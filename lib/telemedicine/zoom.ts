/**
 * Integração com Zoom API
 * Documentação: https://marketplace.zoom.us/docs/api-reference/zoom-api
 */

interface ZoomMeeting {
  id: string;
  join_url: string;
  start_url: string;
  password?: string;
  start_time: string;
  duration: number;
}

interface ZoomConfig {
  accountId: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  tokenExpiresAt?: Date;
}

export class ZoomService {
  private config: ZoomConfig;

  constructor(config: ZoomConfig) {
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
   * Obtém access token do Zoom usando Server-to-Server OAuth
   */
  private async getAccessToken(): Promise<string> {
    // Se tem token válido, retorna
    if (this.config.accessToken && this.config.tokenExpiresAt && new Date() < this.config.tokenExpiresAt) {
      return this.config.accessToken;
    }

    try {
      // Criar JWT para autenticação
      const token = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.config.accountId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao obter token do Zoom');
      }

      const data = await response.json();
      this.config.accessToken = data.access_token;
      // Token expira em 1 hora
      this.config.tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
      return data.access_token;
    } catch (error) {
      console.error('Erro ao obter token do Zoom:', error);
      throw error;
    }
  }

  /**
   * Cria uma reunião no Zoom
   */
  async createMeeting(params: {
    topic: string;
    startTime: Date;
    duration: number; // em minutos
    password?: string;
    waitingRoom?: boolean;
    hostEmail?: string;
  }): Promise<ZoomMeeting> {
    try {
      const accessToken = await this.getAccessToken();
      const userId = params.hostEmail || 'me'; // 'me' para o usuário autenticado

      // Se a reunião é para agora ou no passado, criar como reunião instantânea
      // Caso contrário, criar como reunião agendada
      const now = new Date();
      const isPastOrNow = params.startTime <= now;
      const meetingType = isPastOrNow ? 1 : 2; // 1 = Instantânea, 2 = Agendada

      // Gerar senha única e segura para a reunião (6 dígitos)
      // Isso garante que mesmo que alguém obtenha o link, precisa da senha
      const generatePassword = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      
      const meetingPassword = params.password || generatePassword();

      // Para reuniões instantâneas (agora), desabilitar sala de espera para permitir conexão imediata
      // Para reuniões agendadas, usar a configuração do usuário
      const shouldUseWaitingRoom = isPastOrNow ? false : (params.waitingRoom !== false);

      console.log('🔧 Configuração da reunião Zoom:', {
        isPastOrNow,
        meetingType: meetingType === 1 ? 'Instantânea' : 'Agendada',
        waitingRoom: shouldUseWaitingRoom,
        startTime: params.startTime.toISOString(),
        now: new Date().toISOString(),
      });

      const meetingData: any = {
        topic: params.topic,
        type: meetingType,
        duration: params.duration,
        timezone: 'America/Sao_Paulo',
        password: meetingPassword, // SEMPRE gerar senha para segurança
        settings: {
          waiting_room: shouldUseWaitingRoom, // Desabilitar para reuniões instantâneas
          join_before_host: true, // Permitir entrar antes do host
          host_video: true,
          participant_video: true,
          mute_upon_entry: false,
          approval_type: 0, // Automaticamente aprovar (só funciona se waiting_room estiver desabilitada)
          auto_recording: 'none', // Não gravar automaticamente
          meeting_authentication: false, // Não exigir autenticação Zoom (usamos nossa própria validação)
          cn_meeting: false, // Não é reunião China
          in_meeting: false, // Não é reunião Índia
          enforce_login: false, // Não exigir login Zoom
          // Configurações para aceitar senha do link automaticamente
          jbh_time: 0, // Permitir entrar a qualquer momento antes do host
          alternative_hosts: '', // Sem hosts alternativos
          // IMPORTANTE: Desabilitar registro para permitir entrada direta
          registration_type: 0, // 0 = Não exigir registro, entrada direta
          registrants_confirmation_email: false, // Não enviar email de confirmação
          registrants_email_notification: false, // Não enviar notificação por email
        },
      };

      // Apenas adicionar start_time se for reunião agendada
      if (meetingType === 2) {
        meetingData.start_time = params.startTime.toISOString();
      }

      const response = await fetch(`https://api.zoom.us/v2/users/${userId}/meetings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Falha ao criar reunião no Zoom';
        try {
          const errorJson = JSON.parse(errorText);
          const errorCode = errorJson.code || errorJson.error?.code;
          const errorDescription = errorJson.message || errorJson.error?.message || errorText;
          
          if (errorCode === 124 || errorDescription?.includes('Invalid access token')) {
            errorMessage = 'Token de acesso inválido. Verifique as credenciais do Zoom.';
          } else if (errorCode === 1001 || errorDescription?.includes('User not found')) {
            errorMessage = 'Usuário do Zoom não encontrado. Verifique o Account ID.';
          } else {
            errorMessage = errorDescription;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const meeting = await response.json();

      // Validar se o join_url está correto
      if (!meeting.join_url) {
        throw new Error('Zoom não retornou o link de entrada da reunião');
      }

      // O Zoom pode retornar o join_url com a senha já codificada no parâmetro pwd
      // Isso permite que o usuário entre automaticamente sem precisar digitar a senha novamente
      let joinUrl = meeting.join_url;
      const finalPassword = meeting.password || meetingPassword;
      
      // Verificar se o join_url já contém a senha codificada (pwd=)
      const hasEncodedPassword = joinUrl.includes('pwd=');
      
      // IMPORTANTE: Se for URL de registro, SEMPRE converter para link direto
      // URLs de registro exigem que o usuário se registre antes de entrar
      if (joinUrl.includes('/meeting/register/')) {
        console.warn('⚠️ Zoom retornou URL de registro, convertendo para link direto');
        // Extrair o meeting ID da URL de registro
        const meetingIdMatch = joinUrl.match(/\/meeting\/register\/([^/?]+)/);
        if (meetingIdMatch) {
          const meetingId = meetingIdMatch[1];
          // Construir link direto de entrada
          joinUrl = `https://zoom.us/j/${meetingId}`;
          
          // IMPORTANTE: Se o join_url original tinha pwd codificado, preservar
          // Caso contrário, o Zoom pode solicitar a senha novamente
          // O Zoom requer senha codificada, não texto plano
          if (hasEncodedPassword) {
            // Extrair o pwd codificado do join_url original se existir
            const pwdMatch = meeting.join_url.match(/[?&]pwd=([^&]+)/);
            if (pwdMatch) {
              joinUrl += `?pwd=${pwdMatch[1]}`;
            }
          } else if (finalPassword) {
            // Se não tiver senha codificada, tentar usar a senha em texto
            // Nota: O Zoom pode ainda solicitar a senha, mas tentamos incluir
            joinUrl += `?pwd=${finalPassword}`;
          }
        } else {
          // Se não conseguir extrair, usar o meeting ID da resposta
          joinUrl = `https://zoom.us/j/${meeting.id}`;
          if (hasEncodedPassword) {
            const pwdMatch = meeting.join_url.match(/[?&]pwd=([^&]+)/);
            if (pwdMatch) {
              joinUrl += `?pwd=${pwdMatch[1]}`;
            }
          } else if (finalPassword) {
            joinUrl += `?pwd=${finalPassword}`;
          }
        }
      } else if (!joinUrl.includes('zoom.us/j/') && meeting.id) {
        // Se o link não estiver no formato correto, construir usando o meeting ID
        joinUrl = `https://zoom.us/j/${meeting.id}`;
        if (hasEncodedPassword) {
          const pwdMatch = meeting.join_url.match(/[?&]pwd=([^&]+)/);
          if (pwdMatch) {
            joinUrl += `?pwd=${pwdMatch[1]}`;
          }
        } else if (finalPassword) {
          joinUrl += `?pwd=${finalPassword}`;
        }
      } else if (!hasEncodedPassword && finalPassword) {
        // Se o link não tem senha codificada e temos a senha, adicionar
        // Nota: O Zoom pode solicitar a senha mesmo assim, pois requer codificação
        const separator = joinUrl.includes('?') ? '&' : '?';
        joinUrl += `${separator}pwd=${finalPassword}`;
      }
      
      // PRIORIDADE: Se o join_url original já tinha senha codificada E não é URL de registro, usar ele diretamente
      // Isso garante que o Zoom não solicite a senha novamente, pois a senha está no formato correto
      // IMPORTANTE: Nunca usar URL de registro, sempre converter para link direto
      if (hasEncodedPassword && meeting.join_url.includes('zoom.us/j/') && !meeting.join_url.includes('/meeting/register/')) {
        joinUrl = meeting.join_url;
        console.log('✅ Usando join_url original do Zoom com senha codificada (não solicitará senha novamente)');
      } else if (joinUrl.includes('/meeting/register/')) {
        // Se ainda for URL de registro após conversão, forçar link direto
        console.warn('⚠️ URL de registro detectada, convertendo para link direto:', joinUrl);
        joinUrl = `https://zoom.us/j/${meeting.id}`;
        if (finalPassword) {
          // Tentar codificar a senha (Zoom pode precisar de codificação base64)
          try {
            const encodedPwd = Buffer.from(finalPassword).toString('base64');
            joinUrl += `?pwd=${encodedPwd}`;
          } catch {
            joinUrl += `?pwd=${finalPassword}`;
          }
        }
        console.log('✅ URL convertida para link direto (sem registro):', joinUrl);
      }
      
      console.log('🔒 Link do Zoom gerado com segurança:', {
        meetingId: meeting.id,
        hasPassword: !!finalPassword,
        hasEncodedPassword: hasEncodedPassword,
        urlLength: joinUrl.length,
        usingOriginalUrl: joinUrl === meeting.join_url,
        isRegistrationUrl: joinUrl.includes('/meeting/register/'),
        finalUrl: joinUrl.substring(0, 100) + '...',
      });

      return {
        id: meeting.id.toString(),
        join_url: joinUrl,
        start_url: meeting.start_url,
        password: finalPassword, // Sempre retornar a senha gerada
        start_time: meeting.start_time || params.startTime.toISOString(),
        duration: meeting.duration,
      };
    } catch (error) {
      console.error('Erro ao criar reunião no Zoom:', error);
      throw error;
    }
  }

  /**
   * Cancela uma reunião
   */
  async cancelMeeting(meetingId: string, hostEmail?: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const userId = hostEmail || 'me';

      await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Erro ao cancelar reunião no Zoom:', error);
      throw error;
    }
  }

  /**
   * Obtém informações de uma reunião
   */
  async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao obter informações da reunião');
      }

      const meeting = await response.json();

      // Validar e corrigir join_url se necessário
      let joinUrl = meeting.join_url;
      if (joinUrl && joinUrl.includes('/meeting/register/')) {
        const meetingIdMatch = joinUrl.match(/\/meeting\/register\/([^/?]+)/);
        if (meetingIdMatch) {
          const meetingId = meetingIdMatch[1];
          joinUrl = `https://zoom.us/j/${meetingId}`;
          if (meeting.password) {
            joinUrl += `?pwd=${meeting.password}`;
          }
        }
      }

      return {
        id: meeting.id.toString(),
        join_url: joinUrl,
        start_url: meeting.start_url,
        password: meeting.password,
        start_time: meeting.start_time,
        duration: meeting.duration,
      };
    } catch (error) {
      console.error('Erro ao obter reunião do Zoom:', error);
      throw error;
    }
  }
}
