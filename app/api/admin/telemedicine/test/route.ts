import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Testa as credenciais do Google Meet ou Zoom
 * POST /api/admin/telemedicine/test
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { platform, clientId, clientSecret, refreshToken, accountId } = body;

    // Se credenciais vieram mascaradas (***) ou vazias, usar as salvas no banco
    // (o front retorna "***" para secrets após carregar a página, então "Testar" enviava literal "***" para o Google)
    const isMasked = (v: string | null | undefined) => !v || v.trim() === '' || v === '***';
    if (platform === 'GOOGLE_MEET' && (isMasked(clientSecret) || isMasked(refreshToken) || isMasked(clientId))) {
      const stored = await prisma.telemedicineConfig.findUnique({
        where: { platform: 'GOOGLE_MEET' },
      });
      if (stored?.clientId && stored?.clientSecret && stored?.refreshToken) {
        clientId = stored.clientId;
        clientSecret = stored.clientSecret;
        refreshToken = stored.refreshToken;
      }
    }
    if (platform === 'ZOOM' && (isMasked(clientSecret) || isMasked(clientId) || isMasked(accountId))) {
      const stored = await prisma.telemedicineConfig.findUnique({
        where: { platform: 'ZOOM' },
      });
      if (stored?.accountId && stored?.clientId && stored?.clientSecret) {
        accountId = stored.accountId;
        clientId = stored.clientId;
        clientSecret = stored.clientSecret;
      }
    }

    if (platform === 'GOOGLE_MEET') {
      // Testar credenciais do Google Meet
      if (!clientId || !clientSecret || !refreshToken) {
        return NextResponse.json(
          { error: 'Client ID, Client Secret e Refresh Token são obrigatórios. Preencha os campos e salve, ou use "Testar Credenciais" após já ter salvado.' },
          { status: 400 }
        );
      }

      // Validar formato básico do Client ID do Google
      // Google Client IDs geralmente têm .apps.googleusercontent.com ou são strings longas
      // Zoom Client IDs são geralmente mais curtos (10-20 caracteres)
      const isLikelyZoomClientId = clientId.length < 25 && !clientId.includes('.apps.googleusercontent.com');
      
      if (isLikelyZoomClientId) {
        return NextResponse.json(
          { 
            success: false,
            error: '⚠️ ATENÇÃO: Parece que você está usando credenciais do Zoom no lugar do Google Meet!\n\n' +
              'Credenciais do Google Meet:\n' +
              '• Client ID: formato xxxxx.apps.googleusercontent.com ou string longa\n' +
              '• Client Secret: string longa\n' +
              '• Refresh Token: string longa começando com "1//"\n\n' +
              'Para obter credenciais do Google Meet:\n' +
              '1. Acesse console.cloud.google.com\n' +
              '2. Crie/selecione um projeto\n' +
              '3. Habilite "Google Calendar API"\n' +
              '4. Crie credenciais OAuth 2.0 (tipo: Aplicativo da Web)\n' +
              '5. Use o Google OAuth Playground para obter o Refresh Token'
          },
          { status: 400 }
        );
      }

      try {
        // Log para debug (sem expor valores completos)
        console.log('🔍 Testando credenciais Google Meet:', {
          clientId: clientId ? `${clientId.substring(0, 10)}...` : 'vazio',
          clientSecret: clientSecret ? '***' : 'vazio',
          refreshToken: refreshToken ? `${refreshToken.substring(0, 10)}...` : 'vazio',
        });

        // Tentar renovar o token para validar as credenciais
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId.trim(),
            client_secret: clientSecret.trim(),
            refresh_token: refreshToken.trim(),
            grant_type: 'refresh_token',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Falha ao validar credenciais';
          let errorCode = '';
          try {
            const errorJson = JSON.parse(errorText);
            errorCode = errorJson.error;
            const errorDescription = errorJson.error_description || errorJson.error || errorMessage;
            
            console.error('❌ Erro ao validar credenciais Google:', {
              error: errorCode,
              description: errorDescription,
            });
            
            if (errorCode === 'invalid_client') {
              errorMessage = 'Cliente OAuth não encontrado. Verifique se:\n' +
                '1. O Client ID está correto (formato: xxxxx.apps.googleusercontent.com)\n' +
                '2. O Client Secret corresponde ao Client ID\n' +
                '3. As credenciais são do Google Cloud Console, não do Zoom';
            } else if (errorCode === 'invalid_grant') {
              errorMessage = 'Refresh Token inválido ou expirado. É necessário gerar um novo Refresh Token usando o Google OAuth Playground.';
            } else if (errorCode === 'unauthorized_client') {
              errorMessage = 'Cliente não autorizado. Verifique se:\n' +
                '1. O Client ID está correto\n' +
                '2. A Google Calendar API está habilitada no projeto\n' +
                '3. O tipo de aplicativo OAuth está configurado corretamente';
            } else {
              errorMessage = `${errorDescription} (Código: ${errorCode})`;
            }
          } catch {
            errorMessage = errorText || errorMessage;
          }
          
          return NextResponse.json(
            { 
              success: false,
              error: errorMessage,
              errorCode: errorCode || 'unknown'
            },
            { status: 400 }
          );
        }

        const data = await response.json();
        
        if (!data.access_token) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Token de acesso não retornado'
            },
            { status: 400 }
          );
        }

        // Tentar acessar a API do Calendar para verificar permissões
        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (!calendarResponse.ok) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Credenciais válidas, mas sem acesso à Google Calendar API. Verifique se a API está habilitada.'
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Credenciais válidas! A integração com Google Meet está funcionando corretamente.',
        });
      } catch (error) {
        console.error('Erro ao testar credenciais do Google Meet:', error);
        return NextResponse.json(
          { 
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido ao testar credenciais'
          },
          { status: 500 }
        );
      }
    } else if (platform === 'ZOOM') {
      // Testar credenciais do Zoom
      if (!accountId || !clientId || !clientSecret) {
        return NextResponse.json(
          { error: 'Account ID, Client ID e Client Secret são obrigatórios' },
          { status: 400 }
        );
      }

      try {
        const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json(
            { 
              success: false,
              error: `Falha ao validar credenciais do Zoom: ${errorText}`
            },
            { status: 400 }
          );
        }

        const data = await response.json();
        
        if (!data.access_token) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Token de acesso não retornado'
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Credenciais válidas! A integração com Zoom está funcionando corretamente.',
        });
      } catch (error) {
        console.error('Erro ao testar credenciais do Zoom:', error);
        return NextResponse.json(
          { 
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido ao testar credenciais'
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Plataforma inválida' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao testar credenciais:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao testar credenciais',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
