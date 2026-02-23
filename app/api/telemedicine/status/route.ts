import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Verifica o status da configuração de telemedicina
 * GET /api/telemedicine/status
 * Acessível para médicos e admins
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const configs = await prisma.telemedicineConfig.findMany({
      where: { enabled: true },
    });

    // Verificar Zoom
    const zoomConfig = configs.find(c => c.platform === 'ZOOM');
    const zoomAvailable = zoomConfig && 
                         zoomConfig.accountId && 
                         zoomConfig.clientId && 
                         zoomConfig.clientSecret;

    // Verificar Google Meet
    const meetConfig = configs.find(c => c.platform === 'GOOGLE_MEET');
    const meetAvailable = meetConfig && 
                          meetConfig.clientId && 
                          meetConfig.clientSecret && 
                          meetConfig.refreshToken;

    const hasAnyPlatform = zoomAvailable || meetAvailable;

    return NextResponse.json({
      configured: hasAnyPlatform,
      zoom: {
        enabled: !!zoomConfig?.enabled,
        available: zoomAvailable,
      },
      googleMeet: {
        enabled: !!meetConfig?.enabled,
        available: meetAvailable,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar status de telemedicina:', error);
    return NextResponse.json(
      { 
        configured: false,
        error: 'Erro ao verificar configuração'
      },
      { status: 500 }
    );
  }
}
