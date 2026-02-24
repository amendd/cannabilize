import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';

const DEFAULT_TESTIMONIALS = [
  { name: 'Natalia Almeida', photoUrl: '/images/testimonials/natalia-almeida.jpg', shortQuote: 'Vi o verdadeiro diferencial no cuidado com o paciente.', fullQuote: 'Faço tratamento com Cannabis Medicinal há mais de um ano, mas só depois que conheci a CannabiLize é que vi o verdadeiro diferencial no cuidado com o paciente 💚', displayDate: '17/05/2025', source: 'Google', rating: 5, sortOrder: 0, featured: false, condition: 'Cannabis medicinal', treatmentTime: '12 meses de acompanhamento', age: null as number | null },
  { name: 'Luciana Pereira', photoUrl: '/images/testimonials/luciana-pereira.jpg', shortQuote: 'Melhorou a qualidade do meu sono e já não me sinto tão ansiosa.', fullQuote: 'Desde o primeiro momento, muito bem atendida! Com 30 dias em uso do óleo, melhorou a qualidade do meu sono e já não me sinto tão ansiosa quanto antes do tratamento! Grata à CannabiLize! 💚', displayDate: '17/05/2025', source: 'Google', rating: 5, sortOrder: 1, featured: false, condition: 'Ansiedade e insônia', treatmentTime: '30 dias', age: null as number | null },
  { name: 'Beatriz Dobruski', photoUrl: '/images/testimonials/beatriz-dobruski.jpg', shortQuote: 'O tratamento com óleo de CBD transformou minha vida.', fullQuote: 'Apenas gratidão. O tratamento com o óleo de CBD tem transformado minha vida, me ajudando a superar completamente as crises de ansiedade. Além disso, o suporte da equipe foi excepcional.', displayDate: '17/03/2025', source: 'Google', rating: 5, sortOrder: 2, featured: false, condition: 'Ansiedade', treatmentTime: '3 meses de acompanhamento', age: null as number | null },
  { name: 'Vera Oliveira', photoUrl: '/images/testimonials/vera-oliveira.jpg', shortQuote: 'Já estou vendo resultado na ansiedade e para dormir.', fullQuote: 'Boa Noite !! Hoje faz um mês que estou tomando este medicamento, comecei com 2 gotas, por orientação aumentei, hoje estou tomando 5 gotinhas, e já estou vendo resultado, na ansiedade e para dormir.', displayDate: '11/05/2025', source: 'Google', rating: 5, sortOrder: 3, featured: false, condition: 'Ansiedade e insônia', treatmentTime: '1 mês de acompanhamento', age: null as number | null },
  { name: 'Luadi Morais', photoUrl: '/images/testimonials/luadi-morais.jpg', shortQuote: 'Pela primeira vez na vida, 5 dias consecutivos sem dores.', fullQuote: 'Estou impactada com a experiência. Pela primeira vez na vida. Fiquei 5 dias consecutivos sem dores. Sei que é só o começo. Agradeço a atenção antes, durante e principalmente no pós.', displayDate: '17/02/2025', source: 'Google', rating: 5, sortOrder: 4, featured: true, condition: 'Dor crônica', treatmentTime: '2 meses de acompanhamento', age: null as number | null },
  { name: 'Thiago Jatobá', photoUrl: '/images/testimonials/thiago-jatoba.jpg', shortQuote: 'Consulta acessível e já sinto menos ansiedade.', fullQuote: 'Excelente e rápido atendimento. Consulta com preço muito acessível e o valor da medicação é bem menor que os tarja pretas. Hoje completo minha primeira semana de tratamento e já sinto menos ansiedade.', displayDate: '11/05/2025', source: 'Google', rating: 5, sortOrder: 5, featured: false, condition: 'Ansiedade', treatmentTime: '1 mês de acompanhamento', age: null as number | null },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const count = await prisma.landingTestimonial.count();
    if (count > 0) {
      return NextResponse.json(
        { message: 'Já existem depoimentos cadastrados. Use "Novo depoimento" para adicionar mais.', count },
        { status: 200 }
      );
    }

    await prisma.landingTestimonial.createMany({
      data: DEFAULT_TESTIMONIALS.map((t) => ({
        name: t.name,
        photoUrl: t.photoUrl,
        shortQuote: t.shortQuote,
        fullQuote: t.fullQuote,
        displayDate: t.displayDate,
        source: t.source,
        rating: t.rating,
        sortOrder: t.sortOrder,
        featured: t.featured,
        active: true,
        condition: t.condition ?? undefined,
        treatmentTime: t.treatmentTime ?? undefined,
        age: t.age ?? undefined,
      })),
    });

    const list = await prisma.landingTestimonial.findMany({
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    });
    return NextResponse.json({ message: 'Depoimentos padrão carregados.', list });
  } catch (error) {
    return handleApiError(error);
  }
}
