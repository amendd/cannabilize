import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laudo Agronômico | Análise por Engenheiro Agrônomo | Cannabilize',
  description:
    'Serviço opcional: após a consulta médica e a receita, você pode solicitar análise técnica por engenheiro agrônomo e emissão de laudo agronômico. Entenda como funciona.',
  keywords:
    'laudo agronômico, engenheiro agrônomo, análise agronômica, cannabis medicinal, receita médica',
  openGraph: {
    title: 'Laudo Agronômico | Conexão com Engenheiro Agrônomo | Cannabilize',
    description:
      'Serviço opcional de análise agronômica profissional. Conheça o fluxo e as condições.',
  },
};

export default function LaudoAgronomicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
