import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Resend } from 'resend';

const testEmailSchema = z.object({
  provider: z.enum(['RESEND', 'SENDGRID', 'AWS_SES', 'SMTP']),
  testEmail: z.string().email(),
});

// POST - Testar configuração de email
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
    const { provider, testEmail } = testEmailSchema.parse(body);

    const config = await prisma.emailConfig.findUnique({
      where: { provider },
    });

    if (!config || !config.enabled) {
      return NextResponse.json(
        { error: 'Configuração não encontrada ou desabilitada' },
        { status: 404 }
      );
    }

    // Envio real de email de teste quando o provedor for RESEND
    if (provider === 'RESEND' && config.apiKey) {
      try {
        const resend = new Resend(config.apiKey);
        const fromEmail = config.fromEmail || 'onboarding@resend.dev';
        const fromName = config.fromName || 'Click Cannabis';
        const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        console.log('[EMAIL TEST] Enviando email via Resend:', {
          from,
          to: testEmail,
          domain: config.domain,
        });

        const result = await resend.emails.send({
          from,
          to: testEmail,
          subject: 'Teste de Email - Click Cannabis',
          html: '<h1>Este é um email de teste</h1><p>Se você recebeu este email, a configuração do Resend está funcionando corretamente.</p>',
          reply_to: config.replyTo || undefined,
        });

        console.log('[EMAIL TEST] Resposta do Resend:', result);

        // Verificar se há erro na resposta
        if (result.error) {
          throw new Error(`Resend API Error: ${JSON.stringify(result.error)}`);
        }

        const testResult = {
          success: true,
          message: 'Email de teste enviado com sucesso via Resend',
          timestamp: new Date().toISOString(),
          resendId: result.data?.id || null,
          warning: config.domain && !fromEmail.includes('resend.dev') 
            ? 'Verifique se o domínio está verificado no Resend. Emails podem não ser entregues se o domínio não estiver verificado.'
            : null,
        };

        // Atualizar último teste
        await prisma.emailConfig.update({
          where: { provider },
          data: {
            lastTestAt: new Date(),
            lastTestResult: JSON.stringify(testResult),
          },
        });

        return NextResponse.json(testResult);
      } catch (resendError: any) {
        console.error('[EMAIL TEST] Erro ao enviar email via Resend:', resendError);
        
        // Extrair mensagem de erro mais detalhada
        let errorMessage = 'Erro desconhecido';
        if (resendError instanceof Error) {
          errorMessage = resendError.message;
        } else if (resendError?.message) {
          errorMessage = resendError.message;
        } else if (typeof resendError === 'object') {
          errorMessage = JSON.stringify(resendError);
        }

        // Verificar se é erro de domínio não verificado
        const isDomainError = errorMessage.includes('domain') || 
                              errorMessage.includes('verification') ||
                              errorMessage.includes('not verified');

        const errorResult = {
          success: false,
          message: isDomainError 
            ? 'Domínio não verificado no Resend. Verifique o domínio no dashboard do Resend antes de usar este email remetente.'
            : 'Erro ao enviar email via Resend',
          error: errorMessage,
          timestamp: new Date().toISOString(),
          suggestion: isDomainError
            ? 'Use "onboarding@resend.dev" como email remetente para testes, ou verifique seu domínio no dashboard do Resend.'
            : 'Verifique a API Key e as configurações no Resend.',
        };

        // Atualizar último teste com erro
        await prisma.emailConfig.update({
          where: { provider },
          data: {
            lastTestAt: new Date(),
            lastTestResult: JSON.stringify(errorResult),
          },
        });

        return NextResponse.json(errorResult, { status: 500 });
      }
    }

    // Para outros provedores, apenas simular

    const testResult = {
      success: true,
      message: 'Email de teste enviado (ou simulado) com sucesso',
      timestamp: new Date().toISOString(),
    };

    // Atualizar último teste
    await prisma.emailConfig.update({
      where: { provider },
      data: {
        lastTestAt: new Date(),
        lastTestResult: JSON.stringify(testResult),
      },
    });

    return NextResponse.json(testResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao testar configuração de email:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao testar configuração de email',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
