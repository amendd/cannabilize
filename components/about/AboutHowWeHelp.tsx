import { FileText, ClipboardList, Package, Heart, Video } from 'lucide-react';

const STEPS = [
  {
    icon: Video,
    title: 'Consulta médica',
    description: 'Você agenda e faz sua consulta online com um médico especialista. Na conversa, são avaliadas sua história e suas necessidades para definir se o tratamento com cannabis medicinal é indicado para você.',
    descriptionShort: 'Consulta online com médico especialista. Sua história e necessidades são avaliadas com calma.',
  },
  {
    icon: FileText,
    title: 'Prescrição',
    description: 'Quando indicado, você recebe a prescrição médica com segurança e clareza. O documento segue as normas vigentes e pode ser usado para dar sequência ao processo.',
    descriptionShort: 'Você recebe a prescrição com clareza. O documento está em conformidade e pronto para os próximos passos.',
  },
  {
    icon: ClipboardList,
    title: 'Documentação',
    description: 'Você é orientado sobre os documentos necessários (incluindo ANVISA quando se aplica). A equipe acompanha a organização de cada etapa para que nada fique para trás.',
    descriptionShort: 'Orientação sobre os documentos necessários. Nosso suporte ajuda a organizar cada etapa.',
  },
  {
    icon: Package,
    title: 'Importação',
    description: 'Se seu tratamento envolver importação, você recebe orientação sobre o processo legal do medicamento, para fazer tudo com segurança e dentro da lei.',
    descriptionShort: 'Orientação para importação legal do medicamento, com segurança em cada passo.',
  },
  {
    icon: Heart,
    title: 'Acompanhamento',
    description: 'Você não fica sozinho depois da primeira consulta. Há suporte para dúvidas e possibilidade de retorno para ajustes, conforme sua necessidade.',
    descriptionShort: 'Suporte para dúvidas e retornos para ajustes. Você tem com quem contar.',
  },
];

export default function AboutHowWeHelp() {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2 md:mb-3">
          Seu caminho até o tratamento começa aqui
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 font-display tracking-tight">
          Como ajudamos você, passo a passo
        </h2>
        <p className="text-gray-600 mb-10 md:mb-12 max-w-2xl text-sm md:text-base">
          Do primeiro contato à documentação e ao acompanhamento: você tem clareza em cada etapa. O atendimento segue diretrizes clínicas e protocolos assistenciais desenvolvidos pela equipe Cannabilize.
        </p>

        <div className="relative pl-0 md:pl-1">
          <div className="absolute left-[1.375rem] md:left-6 top-6 bottom-6 w-0.5 bg-primary-200 rounded-full hidden sm:block" aria-hidden />
          <ul className="space-y-8 md:space-y-10">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={index} className="relative flex gap-4 sm:gap-6">
                  <div className="relative z-10 flex shrink-0 items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-sm shadow-md border-4 border-white">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5 pb-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary-100 text-primary shrink-0">
                        <Icon size={18} className="sm:w-5 sm:h-5" aria-hidden />
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base hidden sm:block">{step.description}</p>
                    <p className="text-gray-600 leading-relaxed text-sm sm:hidden">{step.descriptionShort}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
