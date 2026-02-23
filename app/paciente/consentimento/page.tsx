'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { FileCheck, Shield } from 'lucide-react';

const TERMO_LGPD = `
Termo de Consentimento para Tratamento de Dados Pessoais (LGPD)

Ao utilizar esta plataforma e os serviços associados, seus dados pessoais e de saúde serão tratados conforme a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).

1. Finalidade
Os dados coletados são utilizados para: cadastro e identificação; agendamento e realização de consultas; emissão e gestão de prescrições e receitas; cobrança e pagamentos; logística e entrega de produtos quando aplicável; cumprimento de obrigações legais e regulatórias (incluindo RDC e ANVISA); e melhoria dos serviços.

2. Dados tratados
Podem ser tratados: nome, CPF, data de nascimento, endereço, telefone, e-mail, dados de saúde (histórico clínico, prescrições, laudos), dados de acesso e logs de uso do sistema.

3. Base legal
O tratamento se baseia no seu consentimento (manifestado neste termo), na execução de contrato ou de procedimento preliminar, e no cumprimento de obrigação legal ou regulatória.

4. Compartilhamento
Seus dados podem ser compartilhados com: médicos e equipe clínica; operadores da associação/clínica; prestadores de pagamento; transportadoras (quando houver entrega); e autoridades quando exigido por lei.

5. Seus direitos
Você pode solicitar acesso, correção, anonimização, portabilidade, eliminação dos dados tratados com base no consentimento, revogação do consentimento e informações sobre compartilhamento, nos termos da LGPD, através do canal indicado pela plataforma.

6. Segurança e retenção
Adotamos medidas técnicas e organizacionais para proteger seus dados. O prazo de retenção segue a política interna e as exigências legais (incluindo prazo para guarda de prescrições).

7. Consentimento
Ao marcar "Li e aceito o termo de consentimento" e clicar em "Aceitar e continuar", você declara ter lido e aceitado este termo, autorizando o tratamento dos seus dados pessoais nos termos aqui descritos.
`.trim();

export default function ConsentimentoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'PATIENT') {
      router.push('/paciente');
      return;
    }
  }, [status, session?.user?.role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast.error('Marque que leu e aceita o termo para continuar.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/paciente/consentimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Consentimento registrado. Redirecionando...');
        router.push('/paciente');
      } else {
        toast.error(data.error || 'Erro ao registrar consentimento');
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'PATIENT')) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-2">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Termo de Consentimento LGPD</h1>
            <p className="text-emerald-100 text-sm">
              Leia o termo e aceite para acessar a área do paciente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 max-h-[320px] overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{TERMO_LGPD}</pre>
          </div>

          <label className="mt-6 flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-gray-700 group-hover:text-gray-900">
              Li e aceito o termo de consentimento para tratamento de dados pessoais (LGPD).
            </span>
          </label>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={!accepted || saving}
              loading={saving}
              className="inline-flex items-center gap-2"
            >
              <FileCheck size={18} />
              Aceitar e continuar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/paciente')}
              disabled={saving}
            >
              Voltar
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
