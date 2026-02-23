import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Shield,
  Users,
  FileText,
  ChevronDown,
  Sparkles,
  GraduationCap,
  XCircle,
} from 'lucide-react';
import CursoFaq from '@/components/curso/CursoFaq';
import CursoStickyCta from '@/components/curso/CursoStickyCta';

export const metadata: Metadata = {
  title: 'Curso de Cultivo, Colheita e Extração de Óleo de Cannabis | Formação Técnica e Responsável',
  description:
    'Aprenda cultivo, colheita e extração de óleo de cannabis com base técnica e científica. Conteúdo educacional para uso em contextos legais. Verifique a legislação da sua região.',
  keywords:
    'curso cannabis, cultivo cannabis, extração óleo cannabis, formação cannabis, cannabis medicinal, educação cannabis',
  openGraph: {
    title: 'Curso de Cultivo, Colheita e Extração de Óleo de Cannabis',
    description:
      'Formação técnica e responsável. Conteúdo educacional para contextos legais.',
  },
};

const MODULOS = [
  {
    titulo: 'Fundamentos e legislação',
    descricao:
      'Contexto legal por região, boas práticas regulatórias e enquadramento do cultivo e uso em contextos permitidos.',
    icone: FileText,
  },
  {
    titulo: 'Botânica e ciclo de vida',
    descricao:
      'Anatomia da planta, fases de crescimento, necessidades de luz, água e nutrientes de forma técnica.',
    icone: Leaf,
  },
  {
    titulo: 'Ambiente e cultivo',
    descricao:
      'Montagem de ambiente controlado, substratos, irrigação e manejo integrado de pragas (MIP).',
    icone: BookOpen,
  },
  {
    titulo: 'Colheita e pós-colheita',
    descricao:
      'Ponto de colheita, secagem, cura e armazenamento para preservar qualidade e estabilidade.',
    icone: GraduationCap,
  },
  {
    titulo: 'Extração de óleo (conceitos)',
    descricao:
      'Princípios da extração, segurança no laboratório, equipamentos e boas práticas em ambientes autorizados.',
    icone: Shield,
  },
  {
    titulo: 'Qualidade e boas práticas',
    descricao:
      'Controle de qualidade, rastreabilidade e documentação em conformidade com normas aplicáveis.',
    icone: CheckCircle2,
  },
];

const PARA_QUEM_É = [
  'Interesse em formação técnica e educacional na área',
  'Profissionais de saúde ou pesquisa em contextos legais',
  'Produtores ou empreendedores em regiões com marco legal definido',
  'Estudantes e pesquisadores de áreas afins',
];

const NAO_E_PARA = [
  'Uso ou incentivo a práticas ilegais em sua jurisdição',
  'Instrução para cultivo ou extração fora da lei local',
  'Promessa de resultados médicos ou terapêuticos sem acompanhamento médico',
];

export default function CursoCannabisPage() {
  return (
    <div className="flex flex-col pb-24 md:pb-8">
      {/* ========== HERO ========== */}
      <section
        className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 py-16 lg:py-24 overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold">
                <Leaf className="w-4 h-4" />
                Formação técnica e responsável
              </div>

              <h1
                id="hero-heading"
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight"
              >
                Aprenda cultivo, colheita e extração de óleo de cannabis com{' '}
                <span className="text-primary-600">segurança e base técnica</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Curso 100% online, com abordagem educacional e científica, para
                quem busca conhecimento em contextos onde a legislação permite.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link
                  href="#comprar"
                  className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Quero aprender com segurança
                  <ArrowRight
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="#conteudo"
                  className="inline-flex items-center justify-center text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2 transition py-2"
                >
                  Ver conteúdo do curso
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shadow-xl border border-primary-200/50">
                <div className="text-center p-8">
                  <BookOpen className="w-24 h-24 text-primary-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-800">
                    Curso completo
                  </p>
                  <p className="text-gray-600">6 módulos • Acesso vitalício</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROBLEMA / DOR ========== */}
      <section
        className="py-16 lg:py-20 bg-white"
        aria-labelledby="problema-heading"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2
              id="problema-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Os riscos de aprender sem orientação técnica
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Muitas pessoas buscam informação na internet e acabam expostas a
              erros, riscos e conteúdo que não considera a lei nem a segurança.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
              <AlertTriangle className="w-10 h-10 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erros no cultivo
              </h3>
              <p className="text-gray-700">
                Substrato inadequado, excesso de água, pragas e falta de
                controle de ambiente podem comprometer todo o processo e gerar
                perda de tempo e recursos.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
              <AlertTriangle className="w-10 h-10 text-amber-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Colheita no momento errado
              </h3>
              <p className="text-gray-700">
                Colher cedo ou tarde demais afeta qualidade e estabilidade do
                material. Sem critérios técnicos, o resultado fica inconsistente.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
              <AlertTriangle className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Riscos na extração
              </h3>
              <p className="text-gray-700">
                Extração sem equipamentos e protocolos adequados pode causar
                acidentes e contaminar o produto. É essencial aprender boas
                práticas de segurança.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-gray-600 text-sm max-w-2xl mx-auto">
            Este curso foi desenhado para reduzir esses riscos, com conteúdo
            educacional que prioriza segurança, legislação e técnica.
          </p>
        </div>
      </section>

      {/* ========== PROPOSTA DE VALOR ========== */}
      <section
        className="py-16 lg:py-20 bg-gray-50"
        aria-labelledby="valor-heading"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2
              id="valor-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Por que aprender com este curso?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Conteúdo estruturado, linguagem clara e posicionamento responsável
              em relação à lei e à segurança.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Shield className="w-10 h-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enfoque na legislação
              </h3>
              <p className="text-gray-600">
                Abordagem que respeita a variação de leis por país e região.
                Você entende o que é permitido onde vive.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <GraduationCap className="w-10 h-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Base técnica e científica
              </h3>
              <p className="text-gray-600">
                Conteúdo alinhado a boas práticas agronômicas e de laboratório,
                sem promessas milagrosas.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 md:col-span-2 lg:col-span-1">
              <Sparkles className="w-10 h-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Acesso vitalício e suporte
              </h3>
              <p className="text-gray-600">
                Estude no seu ritmo, revise quando quiser e tire dúvidas por
                canal dedicado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTEÚDO DO CURSO ========== */}
      <section
        id="conteudo"
        className="py-16 lg:py-20 bg-white"
        aria-labelledby="conteudo-heading"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2
              id="conteudo-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              O que você aprende no curso
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              6 módulos do básico ao avançado: legislação, cultivo, colheita,
              extração e qualidade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {MODULOS.map((modulo, index) => {
              const Icon = modulo.icone;
              return (
                <div
                  key={index}
                  className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 transition"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Módulo {index + 1}: {modulo.titulo}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {modulo.descricao}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="#comprar"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
            >
              Garantir minha vaga no curso
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== PARA QUEM É / NÃO É ========== */}
      <section
        className="py-16 lg:py-20 bg-gray-50"
        aria-labelledby="publico-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="publico-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12"
          >
            Para quem é — e para quem não é — este curso
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary-600" />
                É para você se
              </h3>
              <ul className="space-y-3">
                {PARA_QUEM_É.map((item, i) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Não é para você se
              </h3>
              <ul className="space-y-3">
                {NAO_E_PARA.map((item, i) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========== AUTORIDADE ========== */}
      <section
        className="py-16 lg:py-20 bg-white"
        aria-labelledby="autoridade-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              id="autoridade-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Quem criou o curso
            </h2>
            <p className="text-lg text-gray-600">
              Conteúdo desenvolvido por profissionais com experiência em
              formação na área.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 md:p-10 border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-primary-200 flex items-center justify-center">
                <Users className="w-10 h-10 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Equipe especializada
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  O curso foi elaborado por profissionais com atuação em
                  educação, pesquisa e aplicação técnica em contextos onde a
                  legislação permite. O material prioriza clareza, segurança e
                  alinhamento com boas práticas regulatórias e científicas.
                </p>
                <p className="text-gray-600 leading-relaxed mt-3">
                  Nosso compromisso é oferecer formação informativa e
                  responsável, sem incentivo a práticas ilegais em nenhuma
                  jurisdição.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROVA SOCIAL (placeholders) ========== */}
      <section
        className="py-16 lg:py-20 bg-gray-50"
        aria-labelledby="depoimentos-heading"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="depoimentos-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              O que dizem quem já estudou
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Depoimentos reais de alunos (em breve mais avaliações).
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                texto: 'Conteúdo muito claro e seguro. A parte de legislação me ajudou a entender o que posso e não posso na minha região.',
                nome: 'Aluno A.',
                contexto: 'Interesse em cultivo regulado',
              },
              {
                texto: 'Finalmente um curso que não promete milagres e explica o passo a passo técnico. Recomendo.',
                nome: 'Aluno B.',
                contexto: 'Área de pesquisa',
              },
              {
                texto: 'Suporte rápido e material bem organizado. Consigo estudar no meu tempo.',
                nome: 'Aluno C.',
                contexto: 'Profissional da saúde',
              },
            ].map((depoimento, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <p className="text-gray-700 mb-4 italic">&ldquo;{depoimento.texto}&rdquo;</p>
                <p className="font-semibold text-gray-900">{depoimento.nome}</p>
                <p className="text-sm text-gray-500">{depoimento.contexto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== OFERTA + CTA ========== */}
      <section
        id="comprar"
        className="py-16 lg:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden"
        aria-labelledby="oferta-heading"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2
              id="oferta-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Acesso completo ao curso
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Todos os módulos, material de apoio e suporte para dúvidas.
              Estude quando e onde quiser.
            </p>
          </div>

          <ul className="space-y-3 max-w-md mx-auto mb-10">
            {[
              '6 módulos em vídeo e texto',
              'Acesso vitalício',
              'Material de apoio para download',
              'Canal de suporte para dúvidas',
              'Certificado de conclusão',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary-200 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 md:p-8 mb-10 max-w-md mx-auto">
            <p className="text-center text-white/80 text-sm mb-2">
              Investimento único
            </p>
            <p className="text-center text-4xl md:text-5xl font-bold mb-1">
              R$ 497
            </p>
            <p className="text-center text-white/80 text-sm">
              ou em até 12x no cartão
            </p>
            <p className="text-center text-white/70 text-xs mt-2">
              Preço pode variar. Consulte a página de checkout.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/curso-cannabis#comprar"
              className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto max-w-md bg-white text-primary-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-50 transition-all duration-300 shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700"
            >
              Acessar o curso agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-white/80 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Garantia de 7 dias: não gostou? Devolvemos 100%.
            </p>
          </div>

          <p className="text-center text-white/60 text-xs mt-8 max-w-xl mx-auto">
            Ao clicar, você será direcionado à página de pagamento seguro. O
            curso é destinado exclusivamente a fins educacionais e deve ser
            utilizado em conformidade com as leis da sua região.
          </p>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section
        className="py-16 lg:py-20 bg-gray-50"
        aria-labelledby="faq-heading"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="faq-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10"
          >
            Dúvidas frequentes
          </h2>
          <CursoFaq />
        </div>
      </section>

      {/* ========== RODAPÉ LEGAL ========== */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-3">Avisos legais</h3>
              <p className="text-sm leading-relaxed">
                Este curso tem finalidade exclusivamente educacional e
                informativa. A legalidade do cultivo, colheita, extração e uso
                de cannabis varia conforme o país e a região. É sua
                responsabilidade verificar e cumprir a legislação aplicável ao
                seu local de residência. O conteúdo não constitui aconselhamento
                jurídico nem incentiva práticas ilegais.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Contato e políticas</h3>
              <ul className="text-sm space-y-2">
                <li>
                  <Link href="/termos" className="hover:text-white transition">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="hover:text-white transition">
                    Política de privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white transition">
                    Voltar ao site
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>
              © {new Date().getFullYear()} CannabiLize. Curso com fins
              educacionais. Respeite a legislação da sua região.
            </p>
          </div>
        </div>
      </footer>

      <CursoStickyCta />
    </div>
  );
}
