import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/availability';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const doctorId = searchParams.get('doctorId') || undefined;
    const duration = searchParams.get('duration') ? parseInt(searchParams.get('duration')!) : undefined;

    if (!date) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }

    // Validar formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Formato de data inválido. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    console.log('\n========================================');
    console.log(`[API] Buscando slots para data: ${date}`);
    console.log(`[API] doctorId: ${doctorId || 'todos'}, duration: ${duration ?? '(padrão)'}`);
    console.log('========================================\n');
    
    const slots = await getAvailableSlots(date, {
      doctorId,
      duration,
    });

    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const [y, m, d] = date.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    const dayName = dayNames[dayOfWeek];

    console.log('\n========================================');
    console.log(`[API] RESULTADO: ${slots.length} slot(s) disponível(eis)`);
    if (slots.length > 0) {
      console.log(`[API] Primeiros slots:`, slots.slice(0, 5).map(s => `${s.time} (${s.doctorName})`).join(', '));
    } else {
      console.log(`[API] Dia da semana: ${dayName} (${date}). Cadastre disponibilidade para esse dia em Admin → Médicos → Disponibilidade.`);
    }
    console.log('========================================\n');

    return NextResponse.json({
      slots,
      ...(slots.length === 0 && { dayOfWeek, dayName }),
    });
  } catch (error) {
    console.error('Erro ao buscar slots disponíveis:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar horários disponíveis' },
      { status: 500 }
    );
  }
}
