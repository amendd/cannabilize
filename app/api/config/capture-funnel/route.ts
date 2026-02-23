import { NextResponse } from 'next/server';
import { getCaptureFunnelConfig } from '@/lib/capture-funnel';

/**
 * GET - Retorna configuração do funil de captação (público).
 * Usado pela página de agendamento para decidir redirecionar para WhatsApp ou mostrar formulário.
 */
export async function GET() {
  try {
    const config = await getCaptureFunnelConfig();
    // Para wa.me o número deve ser só dígitos (sem +)
    const whatsappNumberForUrl = config.whatsappNumber.replace(/\D/g, '');
    return NextResponse.json({
      mobile: config.mobile,
      desktop: config.desktop,
      whatsappNumber: config.whatsappNumber,
      whatsappNumberForUrl,
      whatsappPrefillTemplate: config.whatsappPrefillTemplate,
      // Não expor mensagem de boas-vindas no público (só admin)
    });
  } catch (error) {
    console.error('Erro ao buscar config do funil:', error);
    return NextResponse.json(
      {
        mobile: { funnelType: 'SITE' as const },
        desktop: { funnelType: 'SITE' as const },
        whatsappNumber: '+5521999999999',
        whatsappNumberForUrl: '5521999999999',
        whatsappPrefillTemplate: 'Olá, me chamo {{name}}.\n\nPatologias selecionadas:\n{{pathologies}}',
      },
      { status: 200 }
    );
  }
}
