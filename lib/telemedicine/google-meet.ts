/**
 * Integração com Google Meet API
 * Documentação: https://developers.google.com/meet/api/guides/overview
 */

interface GoogleMeetMeeting {
  meetingId: string;
  meetingLink: string;
  startTime: string;
  endTime: string;
  conferenceData?: any;
}

interface GoogleMeetConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  tokenExpiresAt?: Date;
}

export class GoogleMeetService {
  private config: GoogleMeetConfig;

  constructor(config: GoogleMeetConfig) {
    // Validar credenciais obrigatórias
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
      throw new Error('Credenciais do Google Meet incompletas. Client ID, Client Secret e Refresh Token são obrigatórios.');
    }
    
    this.config = config;
  }

  /**
   * Obtém o token atualizado (para atualização no banco de dados)
   */
  getTokenInfo(): { accessToken?: string; tokenExpiresAt?: Date } {
    return {
      accessToken: this.config.accessToken,
      tokenExpiresAt: this.config.tokenExpiresAt,
    };
  }

  /**
   * Renova o access token usando refresh token
   */
  private async refreshAccessToken(): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Falha ao renovar token do Google';
        try {
          const errorJson = JSON.parse(errorText);
          const errorCode = errorJson.error;
          const errorDescription = errorJson.error_description || errorJson.error || errorMessage;
          
          // Traduzir erros comuns do Google OAuth
          if (errorCode === 'invalid_client') {
            errorMessage = 'Cliente OAuth não encontrado ou inválido. Verifique se o Client ID e Client Secret estão corretos no painel de administração.';
          } else if (errorCode === 'invalid_grant') {
            errorMessage = 'Refresh Token inválido ou expirado. É necessário gerar um novo Refresh Token no Google OAuth Playground.';
          } else if (errorCode === 'unauthorized_client') {
            errorMessage = 'Cliente não autorizado. Verifique se o Client ID está correto e se a Google Calendar API está habilitada.';
          } else {
            errorMessage = errorDescription;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('Token de acesso não retornado pela API do Google');
      }

      // expires_in vem em segundos, converter para milissegundos
      const expiresIn = (data.expires_in || 3600) * 1000;
      
      return {
        accessToken: data.access_token,
        expiresIn,
      };
    } catch (error) {
      console.error('Erro ao renovar token do Google Meet:', error);
      throw error;
    }
  }

  /**
   * Obtém ou renova o access token
   */
  private async getAccessToken(): Promise<string> {
    // Se tem token válido, retorna
    if (this.config.accessToken && this.config.tokenExpiresAt && new Date() < this.config.tokenExpiresAt) {
      return this.config.accessToken;
    }

    // Renova o token
    const { accessToken, expiresIn } = await this.refreshAccessToken();
    this.config.accessToken = accessToken;
    // Usar o tempo de expiração retornado pela API
    this.config.tokenExpiresAt = new Date(Date.now() + expiresIn);
    return accessToken;
  }

  /**
   * Cria reunião via Meet REST API (spaces.create) com accessType OPEN:
   * médico e paciente entram direto, sem "pedir para participar".
   * Requer escopo: https://www.googleapis.com/auth/meetings.space.created
   */
  private async createMeetingViaMeetAPI(params: { startTime: Date; endTime: Date }): Promise<GoogleMeetMeeting | null> {
    try {
      const accessToken = await this.getAccessToken();
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            accessType: 'OPEN', // Qualquer um com o link entra sem pedir
          },
        }),
      });
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          console.warn('[Google Meet] Meet API (spaces) indisponível — use escopo meetings.space.created para entrada aberta. Usando Calendar API.');
          return null;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } })?.error?.message || `Meet API ${res.status}`);
      }
      const space = await res.json() as { name?: string; meetingUri?: string; meetingCode?: string };
      if (!space.meetingUri || !space.name) {
        return null;
      }
      return {
        meetingId: space.name,
        meetingLink: space.meetingUri,
        startTime: params.startTime.toISOString(),
        endTime: params.endTime.toISOString(),
      };
    } catch (e) {
      console.warn('[Google Meet] createMeetingViaMeetAPI falhou, usando Calendar:', e);
      return null;
    }
  }

  /**
   * Cria uma reunião no Google Meet.
   * Tenta primeiro a Meet API (entrada aberta); se não tiver escopo, usa Calendar API.
   */
  async createMeeting(params: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
  }): Promise<GoogleMeetMeeting> {
    try {
      const now = new Date();
      const actualStartTime = params.startTime < now ? now : params.startTime;
      const actualEndTime = params.endTime < actualStartTime
        ? new Date(actualStartTime.getTime() + 30 * 60 * 1000)
        : params.endTime;

      const viaMeetAPI = await this.createMeetingViaMeetAPI({
        startTime: actualStartTime,
        endTime: actualEndTime,
      });
      if (viaMeetAPI) {
        return viaMeetAPI;
      }

      // Fallback: criar evento no Google Calendar (pode exigir "Acesso rápido" na conta)
      const accessToken = await this.getAccessToken();
      const event = {
        summary: params.summary,
        description: params.description || '',
        start: {
          dateTime: actualStartTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: actualEndTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        attendees: params.attendees?.map(email => ({ email })) || [],
        conferenceData: {
          createRequest: {
            // Usar ID único baseado em timestamp, random e hash para garantir unicidade absoluta
            // Formato: meet-timestamp-random-hash
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 10)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Falha ao criar reunião no Google Calendar';
        try {
          const errorJson = JSON.parse(errorText);
          const errorCode = errorJson.error?.code || errorJson.error;
          const errorDescription = errorJson.error?.message || errorJson.error_description || errorJson.error || errorMessage;
          
          // Traduzir erros comuns do Google Calendar API
          if (errorCode === 401 || errorCode === 'unauthorized') {
            errorMessage = 'Não autorizado. O token de acesso pode ter expirado. Tente novamente.';
          } else if (errorCode === 403 || errorCode === 'forbidden') {
            errorMessage = 'Acesso negado. Verifique se a Google Calendar API está habilitada e se as permissões estão corretas.';
          } else if (errorDescription?.includes('OAuth client')) {
            errorMessage = 'Cliente OAuth não encontrado. Verifique se o Client ID está correto no painel de administração.';
          } else {
            errorMessage = errorDescription;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const createdEvent = await response.json();
      
      if (!createdEvent.id) {
        throw new Error('Evento criado mas sem ID retornado');
      }

      // Extrair link do Meet de forma mais robusta
      let meetingLink = '';
      if (createdEvent.hangoutLink) {
        meetingLink = createdEvent.hangoutLink;
      } else if (createdEvent.conferenceData?.entryPoints) {
        const meetEntry = createdEvent.conferenceData.entryPoints.find(
          (entry: any) => entry.entryPointType === 'video' || entry.uri?.includes('meet.google.com')
        );
        meetingLink = meetEntry?.uri || createdEvent.conferenceData.entryPoints[0]?.uri || '';
      }

      if (!meetingLink) {
        throw new Error('Link do Google Meet não foi gerado. Verifique se a Google Calendar API está habilitada e se o Meet está ativado na conta.');
      }
      
      return {
        meetingId: createdEvent.id,
        meetingLink,
        startTime: createdEvent.start.dateTime || createdEvent.start.date,
        endTime: createdEvent.end.dateTime || createdEvent.end.date,
        conferenceData: createdEvent.conferenceData,
      };
    } catch (error) {
      console.error('Erro ao criar reunião no Google Meet:', error);
      throw error;
    }
  }

  /**
   * Cancela uma reunião (Calendar event ou Meet space).
   * meetingId começa com "spaces/" quando criado via Meet API; senão é ID do evento no Calendar.
   */
  async cancelMeeting(meetingId: string): Promise<void> {
    try {
      if (!meetingId) {
        throw new Error('ID da reunião é obrigatório');
      }

      const accessToken = await this.getAccessToken();

      if (meetingId.startsWith('spaces/')) {
        const path = `${meetingId}:endActiveConference`;
        const response = await fetch(`https://meet.googleapis.com/v2/${path}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok && response.status !== 404) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: { message?: string } })?.error?.message || 'Falha ao encerrar conferência no Meet');
        }
        return;
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(meetingId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        let errorMessage = 'Falha ao cancelar reunião no Google Calendar';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.error_description || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao cancelar reunião no Google Meet:', error);
      throw error;
    }
  }
}
