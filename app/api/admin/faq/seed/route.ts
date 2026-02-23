import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';

const DEFAULT_ITEMS = [
  { question: 'É legal no Brasil?', answer: 'Sim. O uso de cannabis medicinal é regulamentado pela ANVISA. Com receita médica e autorização, você importa e usa o medicamento de forma 100% legal no Brasil.' },
  { question: 'Posso ter problemas com a polícia?', answer: 'Não. Com receita médica válida e autorização da ANVISA, você está amparado pela lei. O medicamento é para uso pessoal, com documentação em ordem. A CannabiLize cuida de toda a documentação necessária.' },
  { question: 'O valor final é só R$50?', answer: 'Os R$ 50 são o valor da consulta médica. O medicamento em si tem custo à parte (importação), e nossa equipe te orienta em todo o processo. Não há custos ocultos: você sabe de tudo antes de seguir.' },
  { question: 'Como funciona a consulta online?', answer: 'A consulta é realizada 100% online via Google Meet, com duração média de 15 minutos. Você agenda um horário, preenche uma anamnese pré-consulta e no dia agendado recebe o link da videoconferência.' },
  { question: 'Quanto custa a consulta?', answer: 'A consulta médica custa apenas R$ 50,00. Este é um preço acessível para democratizar o acesso ao tratamento com cannabis medicinal.' },
  { question: 'Quanto tempo leva para receber a receita?', answer: 'Se aprovado pelo médico, a receita é emitida em até 10 minutos após o término da consulta. Você recebe a receita digital por email.' },
  { question: 'Como funciona o processo de importação?', answer: 'Após receber a receita, nossa equipe te auxilia em todas as etapas: solicitação de autorização ANVISA, documentação necessária e processo de importação. O medicamento é importado diretamente dos EUA com isenção de impostos.' },
  { question: 'Qual o prazo de entrega?', answer: 'O prazo de entrega é de até 15 dias úteis após a aprovação da autorização ANVISA e processamento da importação.' },
  { question: 'A CannabiLize é confiável?', answer: 'Sim! Temos mais de 1.500 depoimentos positivos no Google, mais de 90.000 atendimentos realizados e nota 4.9 estrelas. Somos referência em tratamentos com cannabis medicinal no Brasil.' },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const count = await prisma.landingFaq.count();
    if (count > 0) {
      return NextResponse.json(
        { message: 'Já existem itens cadastrados. O seed só é aplicado quando a lista está vazia.', list: await prisma.landingFaq.findMany({ orderBy: { sortOrder: 'asc' } }) },
        { status: 200 }
      );
    }

    await prisma.landingFaq.createMany({
      data: DEFAULT_ITEMS.map((item, index) => ({
        question: item.question,
        answer: item.answer,
        sortOrder: index,
        active: true,
      })),
    });

    const list = await prisma.landingFaq.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ message: 'Dúvidas padrão carregadas.', list });
  } catch (error) {
    return handleApiError(error);
  }
}
