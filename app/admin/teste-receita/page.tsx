'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

export default function TesteReceitaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [consultationId, setConsultationId] = useState('');

  const safeReadJson = async <T,>(res: Response): Promise<{ ok: boolean; status: number; data: T | null; raw: string }> => {
    const raw = await res.text();
    if (!raw) {
      return { ok: res.ok, status: res.status, data: null, raw: '' };
    }
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(raw) as T, raw };
    } catch {
      return { ok: res.ok, status: res.status, data: null, raw };
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN')) {
    router.push('/login');
    return null;
  }

  const criarReceitaTeste = async () => {
    setLoading(true);
    try {
      // Buscar consultas COMPLETED
      const consultationsRes = await fetch('/api/admin/consultations?status=COMPLETED&limit=20');
      const consultationsJson = await safeReadJson<any[]>(consultationsRes);
      if (!consultationsJson.ok || !Array.isArray(consultationsJson.data)) {
        const msg = consultationsJson.raw?.slice(0, 200) || 'Resposta vazia';
        throw new Error(`Erro ao buscar consultas (HTTP ${consultationsJson.status}). ${msg}`);
      }
      const consultations = consultationsJson.data;
      
      // Buscar qualquer consulta COMPLETED (a API permite ADMIN atualizar receitas existentes)
      let consultation = consultations.find((c: any) => !c.prescription) || consultations[0];

      // Se ainda não encontrou, buscar qualquer consulta e marcar como COMPLETED
      if (!consultation) {
        const allConsultationsRes = await fetch('/api/admin/consultations?limit=10');
        const allConsultationsJson = await safeReadJson<any[]>(allConsultationsRes);
        if (!allConsultationsJson.ok || !Array.isArray(allConsultationsJson.data)) {
          const msg = allConsultationsJson.raw?.slice(0, 200) || 'Resposta vazia';
          throw new Error(`Erro ao buscar consultas (HTTP ${allConsultationsJson.status}). ${msg}`);
        }
        const allConsultations = allConsultationsJson.data;
        
        if (allConsultations.length > 0) {
          consultation = allConsultations[0];
          
          // Marcar como COMPLETED se não estiver (via API admin)
          if (consultation.status !== 'COMPLETED') {
            try {
              const updateRes = await fetch(`/api/admin/consultations/${consultation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'COMPLETED' }),
              });
              if (updateRes.ok) {
                consultation.status = 'COMPLETED';
                toast.success('Consulta marcada como COMPLETED');
              }
            } catch (error) {
              console.error('Erro ao marcar consulta como COMPLETED:', error);
              // Continuar mesmo se não conseguir atualizar
            }
          }
        }
      }

      if (!consultation) {
        toast.error('Nenhuma consulta encontrada. Crie uma consulta primeiro.');
        setLoading(false);
        return;
      }

      // Buscar medicamentos
      const medsRes = await fetch('/api/admin/medications');
      const medsJson = await safeReadJson<{ medications?: any[]; error?: string }>(medsRes);
      if (!medsJson.ok) {
        const msg = medsJson.raw?.slice(0, 200) || 'Resposta vazia';
        throw new Error(`Erro ao buscar medicamentos (HTTP ${medsJson.status}). ${msg}`);
      }
      const medications = medsJson.data?.medications || [];

      if (medications.length === 0) {
        toast.error('Nenhum medicamento encontrado. Crie medicamentos primeiro em /admin/medicamentos');
        setLoading(false);
        return;
      }

      // Criar dados da receita de teste
      const prescriptionData = {
        medications: medications.slice(0, 2).map((med: any, index: number) => ({
          medicationId: med.id,
          medicationName: med.name,
          productType: med.productType || 'OIL',
          composition: `CBD ${med.cbdConcentrationValue ?? (10 + index * 5)} ${med.cbdConcentrationUnit === 'MG_PER_UNIT' ? 'mg/unidade' : 'mg/mL'} / THC ${med.thcConcentrationValue ?? (index * 2)} ${med.thcConcentrationUnit === 'MG_PER_UNIT' ? 'mg/unidade' : 'mg/mL'}`,
          spectrum: med.spectrum || (index === 0 ? 'FULL_SPECTRUM' : 'BROAD_SPECTRUM'),
          route: med.administrationRoute || 'SUBLINGUAL',
          quantity: index === 0 ? '1 frasco de 30mL' : '2 frascos de 20mL',
          dosage: `1 gota ${2 + index}x ao dia`,
          initialDose: '1 gota 1x ao dia',
          escalation: 'Aumentar 1 gota a cada 3 dias até atingir dose ideal',
          maxDose: `${5 + index * 2} gotas por dia`,
          suggestedTimes: 'Manhã e noite',
          duration: '60 dias',
          instructions: 'Tomar após as refeições. Manter em local fresco e seco.',
        })),
        observations: 'Paciente deve iniciar com dose baixa e aumentar gradualmente conforme orientação médica. Em caso de efeitos adversos, suspender uso e entrar em contato.',
        diagnosis: 'Dor neuropática crônica refratária a tratamentos convencionais. Ansiedade generalizada com impacto significativo na qualidade de vida.',
        cid10: 'G50.9',
        emissionLocation: 'Brasil',
      };

      // Criar receita via API
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: consultation.id,
          prescriptionData,
        }),
      });

      if (!response.ok) {
        const errorJson = await safeReadJson<{ error?: string }>(response);
        const errorMessage =
          errorJson.data?.error ||
          (errorJson.raw ? errorJson.raw.slice(0, 200) : '') ||
          'Erro ao criar receita';
        
        // Mensagens mais específicas
        if (errorMessage.includes('médico')) {
          throw new Error('A consulta precisa ter um médico atribuído. Atribua um médico à consulta primeiro.');
        } else if (errorMessage.includes('não encontrada')) {
          throw new Error('Consulta não encontrada. Verifique se a consulta existe.');
        } else {
          throw new Error(errorMessage);
        }
      }

      toast.success('Receita de teste criada com sucesso!');
      
      // Redirecionar para a página da consulta
      setTimeout(() => {
        router.push(`/admin/consultas/${consultation.id}`);
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar receita de teste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Criar Receita de Teste
          </h1>
          
          <div className="space-y-4 mb-6">
            <p className="text-gray-700">
              Este utilitário cria uma receita de teste com dados completos para visualizar o novo design.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">O que será criado:</h3>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li>Receita com 2 medicamentos de exemplo</li>
                <li>Dados completos: diagnóstico, CID-10, posologia detalhada</li>
                <li>Informações de produto: tipo, composição, espectro, via</li>
                <li>Observações médicas</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Requisitos:</strong> É necessário ter pelo menos uma consulta COMPLETED e medicamentos cadastrados no sistema.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={criarReceitaTeste}
              loading={loading}
              className="flex-1"
            >
              {loading ? 'Criando Receita...' : 'Criar Receita de Teste'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/admin/consultas')}
            >
              Ver Consultas
            </Button>
          </div>

          {consultationId && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Receita criada! <a href={`/admin/consultas/${consultationId}`} className="underline font-semibold">Ver receita</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
