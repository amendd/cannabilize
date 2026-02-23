import type { Metadata } from 'next';
import ConditionalNavbar from '@/components/layout/ConditionalNavbar';
import ConditionalFooter from '@/components/layout/ConditionalFooter';

export const metadata: Metadata = {
  title: 'Termos de Uso | CannabiLizi',
  description: 'Termos e condições de uso dos serviços da CannabiLizi',
};

export default function TermsPage() {
  return (
    <>
      <ConditionalNavbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Termos de Uso
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Última atualização:</strong> 29 de Janeiro de 2026
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Aceitação dos Termos
                </h2>
                <p className="text-gray-700 mb-4">
                  Ao acessar e utilizar os serviços da CannabiLizi, você concorda em cumprir e 
                  estar vinculado a estes Termos de Uso. Se você não concorda com qualquer 
                  parte destes termos, não deve utilizar nossos serviços.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Descrição dos Serviços
                </h2>
                <p className="text-gray-700 mb-4">
                  A CannabiLizi oferece:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Plataforma de telemedicina para consultas online</li>
                  <li>Agendamento de consultas com médicos especialistas em cannabis medicinal</li>
                  <li>Emissão de receitas médicas e autorizações ANVISA</li>
                  <li>Gestão de prontuários eletrônicos</li>
                  <li>Processamento de pagamentos</li>
                  <li>Suporte no processo de importação legal de medicamentos</li>
                  <li>Comunicação por WhatsApp (via API oficial) para notificações, lembretes de consulta, confirmações e atendimento, sujeita aos Termos de Serviço e Políticas do WhatsApp/Meta aplicáveis</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. Cadastro e Conta
                </h2>
                <p className="text-gray-700 mb-4">
                  Para utilizar nossos serviços, você deve:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Fornecer informações verdadeiras, precisas e completas</li>
                  <li>Manter e atualizar suas informações quando necessário</li>
                  <li>Manter a confidencialidade de sua senha e conta</li>
                  <li>Ser responsável por todas as atividades em sua conta</li>
                  <li>Notificar-nos imediatamente sobre uso não autorizado</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Uso dos Serviços
                </h2>
                <p className="text-gray-700 mb-4">
                  Você concorda em:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Usar os serviços apenas para fins legais e legítimos</li>
                  <li>Não usar os serviços de forma que possa danificar, desabilitar ou sobrecarregar nossos sistemas</li>
                  <li>Não tentar acessar áreas restritas ou contas de outros usuários</li>
                  <li>Não usar bots, scripts ou métodos automatizados sem autorização</li>
                  <li>Respeitar direitos de propriedade intelectual</li>
                  <li>Não transmitir vírus, malware ou código malicioso</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Consultas Médicas
                </h2>
                <p className="text-gray-700 mb-4">
                  <strong>Importante:</strong> Nossos serviços de telemedicina são fornecidos por 
                  médicos credenciados. No entanto:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>As consultas não substituem consultas presenciais quando necessário</li>
                  <li>Em emergências, procure atendimento presencial imediatamente</li>
                  <li>Você é responsável por fornecer informações médicas precisas</li>
                  <li>Os médicos têm autonomia para decidir sobre prescrições e tratamentos</li>
                  <li>Cancelamentos devem ser feitos com pelo menos 24h de antecedência</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Pagamentos
                </h2>
                <p className="text-gray-700 mb-4">
                  <strong>Política de Pagamento:</strong>
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Os valores são cobrados antecipadamente</li>
                  <li>Pagamentos são processados por gateways seguros (Stripe, etc.)</li>
                  <li>Reembolsos seguem nossa política específica</li>
                  <li>Cancelamentos com menos de 24h podem não ser reembolsados</li>
                  <li>Não processamos reembolsos para consultas já realizadas</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Propriedade Intelectual
                </h2>
                <p className="text-gray-700 mb-4">
                  Todo o conteúdo do site, incluindo textos, gráficos, logos, ícones, imagens, 
                  downloads digitais e compilações de dados, é propriedade da CannabiLizi ou de 
                  seus fornecedores de conteúdo e está protegido por leis de direitos autorais.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Limitação de Responsabilidade
                </h2>
                <p className="text-gray-700 mb-4">
                  A CannabiLizi não se responsabiliza por:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Decisões médicas tomadas pelos médicos credenciados</li>
                  <li>Resultados de tratamentos ou prescrições</li>
                  <li>Problemas técnicos que possam afetar o acesso aos serviços</li>
                  <li>Danos indiretos, incidentais ou consequenciais</li>
                  <li>Perda de dados devido a falhas técnicas (mantemos backups)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Modificações dos Serviços
                </h2>
                <p className="text-gray-700 mb-4">
                  Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer 
                  aspecto dos serviços a qualquer momento, com ou sem aviso prévio.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Rescisão
                </h2>
                <p className="text-gray-700 mb-4">
                  Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, se 
                  você violar estes Termos de Uso. Você também pode encerrar sua conta a 
                  qualquer momento através das configurações.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. Lei Aplicável
                </h2>
                <p className="text-gray-700 mb-4">
                  Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa 
                  será resolvida nos tribunais competentes do Brasil.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. Contato
                </h2>
                <p className="text-gray-700 mb-4">
                  Para questões sobre estes Termos de Uso, entre em contato:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>Email:</strong> contato@cannalize.com
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Suporte:</strong> suporte@cannalize.com
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
