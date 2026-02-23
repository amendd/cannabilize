import type { Metadata } from 'next';
import ConditionalNavbar from '@/components/layout/ConditionalNavbar';
import ConditionalFooter from '@/components/layout/ConditionalFooter';

export const metadata: Metadata = {
  title: 'Política de Privacidade | CannabiLizi',
  description: 'Política de privacidade e proteção de dados pessoais da CannabiLizi',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <ConditionalNavbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Política de Privacidade
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Última atualização:</strong> 29 de Janeiro de 2026
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Introdução
                </h2>
                <p className="text-gray-700 mb-4">
                  A CannabiLizi ("nós", "nosso" ou "empresa") está comprometida em proteger sua 
                  privacidade e seus dados pessoais. Esta Política de Privacidade descreve como 
                  coletamos, usamos, armazenamos e protegemos suas informações pessoais quando 
                  você utiliza nossos serviços de telemedicina e consultas com cannabis medicinal.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Dados Coletados
                </h2>
                <p className="text-gray-700 mb-4">
                  Coletamos os seguintes tipos de dados pessoais:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Dados de Identificação:</strong> Nome, CPF, data de nascimento, email, telefone</li>
                  <li><strong>Dados de Saúde:</strong> Histórico médico, patologias, receitas médicas, exames</li>
                  <li><strong>Dados de Pagamento:</strong> Informações de cartão de crédito (processadas por terceiros seguros)</li>
                  <li><strong>Dados de Uso:</strong> Logs de acesso, IP, navegador, dispositivo</li>
                  <li><strong>Dados de Consulta:</strong> Agendamentos, anamneses, prescrições, autorizações ANVISA</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. Finalidade do Tratamento
                </h2>
                <p className="text-gray-700 mb-4">
                  Utilizamos seus dados pessoais para:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Prestar serviços de telemedicina e consultas médicas</li>
                  <li>Processar pagamentos e gerenciar transações</li>
                  <li>Emitir receitas médicas e autorizações ANVISA</li>
                  <li>Enviar notificações e lembretes de consultas</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                  <li>Melhorar nossos serviços e experiência do usuário</li>
                  <li>Prevenir fraudes e garantir segurança</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Base Legal
                </h2>
                <p className="text-gray-700 mb-4">
                  O tratamento de seus dados pessoais é baseado em:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Consentimento:</strong> Quando você nos fornece consentimento explícito</li>
                  <li><strong>Execução de Contrato:</strong> Para prestação dos serviços contratados</li>
                  <li><strong>Obrigação Legal:</strong> Para cumprir obrigações legais e regulatórias</li>
                  <li><strong>Proteção da Vida:</strong> Para proteção da saúde e vida do paciente</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Compartilhamento de Dados
                </h2>
                <p className="text-gray-700 mb-4">
                  Compartilhamos seus dados apenas nas seguintes situações:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Médicos:</strong> Com médicos credenciados para prestação de consultas</li>
                  <li><strong>Processadores de Pagamento:</strong> Stripe e outros gateways de pagamento</li>
                  <li><strong>Prestadores de Serviço:</strong> Empresas que nos auxiliam na operação (hospedagem, email)</li>
                  <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  <strong>WhatsApp (Meta):</strong> Utilizamos a API do WhatsApp (Meta Platforms, Inc.) para envio de notificações, lembretes de consulta, confirmações e atendimento. O número de telefone e o conteúdo das mensagens são processados conforme os termos e a política de privacidade do WhatsApp/Meta. Ao nos contactar ou receber mensagens nossas pelo WhatsApp, você está sujeito às políticas da Meta aplicáveis a esse serviço.
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Nunca vendemos seus dados pessoais.</strong>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Segurança dos Dados
                </h2>
                <p className="text-gray-700 mb-4">
                  Implementamos medidas técnicas e organizacionais para proteger seus dados:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                  <li>Criptografia de dados sensíveis no banco de dados</li>
                  <li>Controle de acesso baseado em roles</li>
                  <li>Monitoramento e logs de segurança</li>
                  <li>Backups regulares e seguros</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Seus Direitos (LGPD)
                </h2>
                <p className="text-gray-700 mb-4">
                  Você tem os seguintes direitos sobre seus dados pessoais:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Acesso:</strong> Solicitar acesso aos seus dados pessoais</li>
                  <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
                  <li><strong>Exclusão:</strong> Solicitar exclusão de dados desnecessários ou tratados sem consentimento</li>
                  <li><strong>Portabilidade:</strong> Solicitar exportação dos seus dados em formato estruturado</li>
                  <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
                  <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas situações</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  Para exercer seus direitos, entre em contato através do email: <strong>privacidade@cannalize.com</strong>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Retenção de Dados
                </h2>
                <p className="text-gray-700 mb-4">
                  Mantemos seus dados pessoais pelo tempo necessário para:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Cumprir finalidades para as quais foram coletados</li>
                  <li>Atender obrigações legais (ex: prontuários médicos por 20 anos)</li>
                  <li>Resolver disputas e fazer cumprir acordos</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Cookies e Tecnologias Similares
                </h2>
                <p className="text-gray-700 mb-4">
                  Utilizamos cookies e tecnologias similares para:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Manter sua sessão autenticada</li>
                  <li>Melhorar a experiência do usuário</li>
                  <li>Analisar uso do site (com seu consentimento)</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  Você pode gerenciar cookies através das configurações do seu navegador.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Alterações nesta Política
                </h2>
                <p className="text-gray-700 mb-4">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
                  sobre alterações significativas através de email ou aviso em nosso site.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. Contato
                </h2>
                <p className="text-gray-700 mb-4">
                  Para questões sobre privacidade ou exercer seus direitos, entre em contato:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>Email:</strong> privacidade@cannalize.com
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Encarregado de Dados (DPO):</strong> dpo@cannalize.com
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <ConditionalFooter />
    </>
  );
}
