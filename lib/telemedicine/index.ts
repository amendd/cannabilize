/**
 * Serviço unificado de telemedicina
 * Gerencia integrações com Zoom e Google Meet
 */

import { prisma } from '@/lib/prisma';
import { GoogleMeetService } from './google-meet';
import { ZoomService } from './zoom';

export type TelemedicinePlatform = 'ZOOM' | 'GOOGLE_MEET';

interface CreateMeetingParams {
  consultationId: string;
  patientName: string;
  doctorName: string;
  startTime: Date;
  duration: number; // em minutos
  platform?: TelemedicinePlatform;
}

interface MeetingResult {
  meetingId: string;
  meetingLink: string;
  meetingStartUrl?: string; // Zoom: link para o host INICIAR a reunião (evita "aguardando host")
  meetingPassword?: string;
  platform: TelemedicinePlatform;
  startTime: Date;
  endTime: Date;
}

export class TelemedicineService {
  /**
   * Obtém configuração da plataforma de telemedicina
   */
  private async getConfig(platform: TelemedicinePlatform) {
    const config = await prisma.telemedicineConfig.findUnique({
      where: { platform },
    });

    if (!config || !config.enabled) {
      throw new Error(`Plataforma ${platform} não configurada ou desabilitada`);
    }

    // Validar credenciais obrigatórias para Google Meet
    if (platform === 'GOOGLE_MEET') {
      if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        throw new Error('Credenciais do Google Meet incompletas. Verifique se Client ID, Client Secret e Refresh Token estão configurados corretamente.');
      }
    }

    // Validar credenciais obrigatórias para Zoom
    if (platform === 'ZOOM') {
      if (!config.accountId || !config.clientId || !config.clientSecret) {
        throw new Error('Credenciais do Zoom incompletas. Verifique se Account ID, Client ID e Client Secret estão configurados corretamente.');
      }
    }

    return config;
  }

  /**
   * Detecta qual plataforma está configurada e habilitada
   */
  private async detectAvailablePlatform(): Promise<TelemedicinePlatform | null> {
    const configs = await prisma.telemedicineConfig.findMany({
      where: { enabled: true },
    });

    // Verificar se há preferência configurada
    const preference = await prisma.systemConfig.findUnique({
      where: { key: 'telemedicine_preferred_platform' },
    });

    const preferredPlatform = preference?.value as TelemedicinePlatform | undefined;

    // Verificar Zoom
    const zoomConfig = configs.find(c => c.platform === 'ZOOM');
    const zoomAvailable = zoomConfig && zoomConfig.accountId && zoomConfig.clientId && zoomConfig.clientSecret;

    // Verificar Google Meet
    const meetConfig = configs.find(c => c.platform === 'GOOGLE_MEET');
    const meetAvailable = meetConfig && meetConfig.clientId && meetConfig.clientSecret && meetConfig.refreshToken;

    // Se há preferência e a plataforma preferida está disponível, usar ela
    if (preferredPlatform) {
      if (preferredPlatform === 'ZOOM' && zoomAvailable) {
        return 'ZOOM';
      }
      if (preferredPlatform === 'GOOGLE_MEET' && meetAvailable) {
        return 'GOOGLE_MEET';
      }
    }

    // Se não há preferência ou a preferida não está disponível, usar lógica padrão
    // Priorizar Zoom se estiver configurado
    if (zoomAvailable) {
      return 'ZOOM';
    }

    // Se Zoom não estiver disponível, tentar Google Meet
    if (meetAvailable) {
      return 'GOOGLE_MEET';
    }

    return null;
  }

  /**
   * Cria uma reunião de telemedicina
   */
  async createMeeting(params: CreateMeetingParams): Promise<MeetingResult> {
    // Determinar plataforma
    let platform: TelemedicinePlatform;
    
    if (params.platform) {
      // Se a plataforma foi especificada, usar ela
      platform = params.platform;
    } else {
      // Caso contrário, detectar automaticamente qual está configurada
      const detectedPlatform = await this.detectAvailablePlatform();
      if (!detectedPlatform) {
        throw new Error('Nenhuma plataforma de telemedicina configurada e habilitada. Configure Zoom ou Google Meet no painel de administração.');
      }
      platform = detectedPlatform;
    }

    // Verificar se a plataforma está configurada
    const config = await this.getConfig(platform);

    const endTime = new Date(params.startTime);
    endTime.setMinutes(endTime.getMinutes() + params.duration);

    let meetingResult: MeetingResult;

    if (platform === 'GOOGLE_MEET') {
      const googleMeet = new GoogleMeetService({
        clientId: config.clientId || '',
        clientSecret: config.clientSecret || '',
        refreshToken: config.refreshToken || '',
        accessToken: config.accessToken || undefined,
        tokenExpiresAt: config.tokenExpiresAt || undefined,
      });

      const meeting = await googleMeet.createMeeting({
        summary: `Consulta: ${params.patientName} com ${params.doctorName}`,
        description: `Consulta médica agendada`,
        startTime: params.startTime,
        endTime,
      });

      meetingResult = {
        meetingId: meeting.meetingId,
        meetingLink: meeting.meetingLink,
        platform: 'GOOGLE_MEET',
        startTime: params.startTime,
        endTime,
      };

      // Atualizar token se foi renovado
      const tokenInfo = googleMeet.getTokenInfo();
      if (tokenInfo.accessToken && tokenInfo.accessToken !== config.accessToken) {
        await prisma.telemedicineConfig.update({
          where: { id: config.id },
          data: {
            accessToken: tokenInfo.accessToken,
            tokenExpiresAt: tokenInfo.tokenExpiresAt || null,
          },
        });
      }
    } else if (platform === 'ZOOM') {
      const zoom = new ZoomService({
        accountId: config.accountId || '',
        clientId: config.clientId || '',
        clientSecret: config.clientSecret || '',
        accessToken: config.accessToken || undefined,
        tokenExpiresAt: config.tokenExpiresAt || undefined,
      });

      // SEMPRE gerar senha para Zoom por segurança
      // A senha será gerada automaticamente pelo ZoomService se não for fornecida
      const meeting = await zoom.createMeeting({
        topic: `Consulta: ${params.patientName} com ${params.doctorName} - ID: ${params.consultationId.substring(0, 8)}`,
        startTime: params.startTime,
        duration: params.duration,
        password: undefined, // Deixar o ZoomService gerar senha única
        waitingRoom: config.waitingRoom,
      });

      meetingResult = {
        meetingId: meeting.id,
        meetingLink: meeting.join_url,
        meetingStartUrl: meeting.start_url, // Médico usa este link para INICIAR a reunião (host)
        meetingPassword: meeting.password,
        platform: 'ZOOM',
        startTime: params.startTime,
        endTime,
      };

      // Atualizar token se foi renovado
      const zoomTokenInfo = zoom.getTokenInfo();
      if (zoomTokenInfo.accessToken && zoomTokenInfo.accessToken !== config.accessToken) {
        await prisma.telemedicineConfig.update({
          where: { id: config.id },
          data: {
            accessToken: zoomTokenInfo.accessToken,
            tokenExpiresAt: zoomTokenInfo.tokenExpiresAt || null,
          },
        });
      }
    } else {
      throw new Error(`Plataforma ${platform} não suportada`);
    }

    // Atualizar consulta com informações da reunião
    // IMPORTANTE: Cada reunião é única e vinculada a esta consulta específica
    await prisma.consultation.update({
      where: { id: params.consultationId },
      data: {
        meetingLink: meetingResult.meetingLink,
        meetingStartUrl: meetingResult.meetingStartUrl || null,
        meetingPlatform: meetingResult.platform,
        meetingId: meetingResult.meetingId,
        meetingPassword: meetingResult.meetingPassword || null,
        meetingData: JSON.stringify({
          startTime: meetingResult.startTime.toISOString(),
          endTime: meetingResult.endTime.toISOString(),
          consultationId: params.consultationId, // Vincular explicitamente à consulta
          createdAt: new Date().toISOString(),
          uniqueId: `${params.consultationId}-${Date.now()}`, // ID único para rastreamento
        }),
      },
    });

    // Log de segurança: registrar criação de reunião
    console.log(`🔒 Reunião criada com segurança:`, {
      consultationId: params.consultationId,
      platform: meetingResult.platform,
      meetingId: meetingResult.meetingId,
      hasPassword: !!meetingResult.meetingPassword,
      patientName: params.patientName,
      doctorName: params.doctorName,
    });

    return meetingResult;
  }

  /**
   * Cancela uma reunião
   */
  async cancelMeeting(consultationId: string): Promise<void> {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation || !consultation.meetingId || !consultation.meetingPlatform) {
      throw new Error('Reunião não encontrada ou não configurada');
    }

    const config = await this.getConfig(consultation.meetingPlatform as TelemedicinePlatform);

    if (consultation.meetingPlatform === 'GOOGLE_MEET') {
      const googleMeet = new GoogleMeetService({
        clientId: config.clientId || '',
        clientSecret: config.clientSecret || '',
        refreshToken: config.refreshToken || '',
      });

      await googleMeet.cancelMeeting(consultation.meetingId);
    } else if (consultation.meetingPlatform === 'ZOOM') {
      const zoom = new ZoomService({
        accountId: config.accountId || '',
        clientId: config.clientId || '',
        clientSecret: config.clientSecret || '',
      });

      await zoom.cancelMeeting(consultation.meetingId);
    }

    // Atualizar consulta
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        meetingLink: null,
        meetingStartUrl: null,
        meetingPlatform: null,
        meetingId: null,
        meetingPassword: null,
        meetingData: null,
      },
    });
  }
}

export const telemedicineService = new TelemedicineService();
