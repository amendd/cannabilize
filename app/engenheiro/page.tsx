'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf, FileText, AlertCircle, Clock, CheckCircle2, Eye, ChevronRight } from 'lucide-react';

// Dados de teste para visualização do layout
const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  EM_ANALISE: 'Em análise',
  AGUARDANDO_INFORMACOES: 'Aguardando informações',
  LAUDO_EMITIDO: 'Laudo emitido',
  RECUSADO: 'Recusado',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  NOVO: 'bg-amber-100 text-amber-800',
  EM_ANALISE: 'bg-blue-100 text-blue-800',
  AGUARDANDO_INFORMACOES: 'bg-orange-100 text-orange-800',
  LAUDO_EMITIDO: 'bg-green-100 text-green-800',
  RECUSADO: 'bg-red-100 text-red-800',
  CANCELADO: 'bg-gray-100 text-gray-600',
};

const SOLICITACOES_TESTE = [
  { id: '1', paciente: 'Maria Santos', receitaEmissao: '05/02/2026', status: 'NOVO', dataSolicitacao: '10/02/2026' },
  { id: '2', paciente: 'Carlos Oliveira', receitaEmissao: '28/01/2026', status: 'EM_ANALISE', dataSolicitacao: '08/02/2026' },
  { id: '3', paciente: 'Ana Paula Lima', receitaEmissao: '20/01/2026', status: 'AGUARDANDO_INFORMACOES', dataSolicitacao: '06/02/2026' },
  { id: '4', paciente: 'Roberto Mendes', receitaEmissao: '15/01/2026', status: 'LAUDO_EMITIDO', dataSolicitacao: '01/02/2026' },
  { id: '5', paciente: 'Fernanda Costa', receitaEmissao: '10/01/2026', status: 'LAUDO_EMITIDO', dataSolicitacao: '28/01/2026' },
];

export default function EngenheiroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/engenheiro'));
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'AGRONOMIST' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-green-700">Carregando...</div>
      </div>
    );
  }

  if (status !== 'authenticated' || (session?.user?.role !== 'AGRONOMIST' && session?.user?.role !== 'ADMIN')) {
    return null;
  }

  const pendentes = SOLICITACOES_TESTE.filter((s) => s.status === 'NOVO' || s.status === 'AGUARDANDO_INFORMACOES').length;
  const emAnalise = SOLICITACOES_TESTE.filter((s) => s.status === 'EM_ANALISE').length;
  const emitidos = SOLICITACOES_TESTE.filter((s) => s.status === 'LAUDO_EMITIDO').length;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-green-800 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8" />
            <span className="font-semibold text-lg">Área do Engenheiro Agrônomo</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-100 text-sm truncate max-w-[180px]">{session?.user?.name}</span>
            <Link href="/" className="text-green-100 hover:text-white text-sm whitespace-nowrap">
              Voltar ao site
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Solicitações de análise agronômica</h1>

        {/* Indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendentes}</p>
                <p className="text-sm text-gray-600">Pendências</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{emAnalise}</p>
                <p className="text-sm text-gray-600">Em análise</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{emitidos}</p>
                <p className="text-sm text-gray-600">Laudos emitidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de solicitações */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 border-b border-green-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Paciente</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Receita (emissão)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data da solicitação</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Ação</th>
                </tr>
              </thead>
              <tbody>
                {SOLICITACOES_TESTE.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-900">{s.paciente}</td>
                    <td className="py-3 px-4 text-gray-600">{s.receitaEmissao}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{s.dataSolicitacao}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 font-medium"
                        onClick={() => alert('Em produção: abrir detalhe do caso ' + s.id)}
                      >
                        <Eye className="w-4 h-4" />
                        Abrir
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Conteúdo de teste para visualização do layout. Em produção os dados virão do banco de dados.
        </p>
      </main>
    </div>
  );
}
