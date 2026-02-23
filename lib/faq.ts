import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

export interface FaqItemPublic {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

const DEFAULT_FAQS: FaqItemPublic[] = [
  { id: '1', question: 'É legal no Brasil?', answer: 'Sim. O uso de cannabis medicinal é regulamentado pela ANVISA. Com receita médica e autorização, você importa e usa o medicamento de forma 100% legal no Brasil.', sortOrder: 0 },
  { id: '2', question: 'Posso ter problemas com a polícia?', answer: 'Não. Com receita médica válida e autorização da ANVISA, você está amparado pela lei. O medicamento é para uso pessoal, com documentação em ordem. A CannabiLize cuida de toda a documentação necessária.', sortOrder: 1 },
  { id: '3', question: 'O valor final é só R$50?', answer: 'Os R$ 50 são o valor da consulta médica. O medicamento em si tem custo à parte (importação), e nossa equipe te orienta em todo o processo. Não há custos ocultos: você sabe de tudo antes de seguir.', sortOrder: 2 },
  { id: '4', question: 'Como funciona a consulta online?', answer: 'A consulta é realizada 100% online via Google Meet, com duração média de 15 minutos. Você agenda um horário, preenche uma anamnese pré-consulta e no dia agendado recebe o link da videoconferência.', sortOrder: 3 },
  { id: '5', question: 'Quanto custa a consulta?', answer: 'A consulta médica custa apenas R$ 50,00. Este é um preço acessível para democratizar o acesso ao tratamento com cannabis medicinal.', sortOrder: 4 },
  { id: '6', question: 'Quanto tempo leva para receber a receita?', answer: 'Se aprovado pelo médico, a receita é emitida em até 10 minutos após o término da consulta. Você recebe a receita digital por email.', sortOrder: 5 },
  { id: '7', question: 'Como funciona o processo de importação?', answer: 'Após receber a receita, nossa equipe te auxilia em todas as etapas: solicitação de autorização ANVISA, documentação necessária e processo de importação. O medicamento é importado diretamente dos EUA com isenção de impostos.', sortOrder: 6 },
  { id: '8', question: 'Qual o prazo de entrega?', answer: 'O prazo de entrega é de até 15 dias úteis após a aprovação da autorização ANVISA e processamento da importação.', sortOrder: 7 },
  { id: '9', question: 'A CannabiLize é confiável?', answer: 'Sim! Temos mais de 1.500 depoimentos positivos no Google, mais de 90.000 atendimentos realizados e nota 4.9 estrelas. Somos referência em tratamentos com cannabis medicinal no Brasil.', sortOrder: 8 },
];

async function getFaqPublicUncached(): Promise<FaqItemPublic[]> {
  try {
    const list = await prisma.landingFaq.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (list.length === 0) return DEFAULT_FAQS;
    return list.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      sortOrder: item.sortOrder,
    }));
  } catch {
    return DEFAULT_FAQS;
  }
}

export async function getFaqPublic(): Promise<FaqItemPublic[]> {
  return unstable_cache(getFaqPublicUncached, ['faq-public'], { revalidate: 60 })();
}
