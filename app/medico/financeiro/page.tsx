'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Banknote,
  Calendar,
  CreditCard,
  DollarSign,
  Edit3,
  Info,
  PiggyBank,
  Wallet,
  TrendingUp,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingPage from '@/components/ui/Loading';

type PayoutStatus = 'REQUESTED' | 'PROCESSING' | 'PAID' | 'CANCELLED';

interface SummaryResponse {
  doctorId: string;
  period: 'day' | 'month' | 'year' | 'custom';
  dateRange: { start: string; end: string };
  totals: {
    earned: number;
    paidOut: number;
    available: number;
    requested: number;
    processing: number;
    consultationsPaidCount: number;
  };
  charts: {
    earningsByPeriod: Array<{ period: string; amount: number }>;
  };
}

interface PayoutItem {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  requestedAt: string;
  paidAt?: string | null;
  notes?: string | null;
}

interface PayoutListResponse {
  items: PayoutItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PayoutAccount {
  id: string;
  doctorId: string;
  type: 'PIX' | 'BANK';
  pixKey?: string | null;
  pixKeyType?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  agency?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  holderName?: string | null;
  document?: string | null;
  notes?: string | null;
}

export default function MedicoFinanceiroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [payouts, setPayouts] = useState<PayoutListResponse | null>(null);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<PayoutStatus | ''>('');
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutLoading, setPayoutLoading] = useState(true);

  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState<Partial<PayoutAccount>>({
    type: 'PIX',
  });
  const [savingAccount, setSavingAccount] = useState(false);

  const [requestAmount, setRequestAmount] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'DOCTOR') {
      // Admin também poderia ver um dia, mas hoje restringimos ao médico
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const params = new URLSearchParams();
      params.append('period', summaryPeriod);
      const res = await fetch(`/api/medico/financeiro/summary?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Erro ao carregar resumo financeiro');
      }
      const data = (await res.json()) as SummaryResponse;
      setSummary(data);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar resumo financeiro');
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setPayoutLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(payoutPage));
      params.append('limit', '20');
      if (payoutStatusFilter) params.append('status', payoutStatusFilter);
      const res = await fetch(`/api/medico/financeiro/payouts?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Erro ao carregar repasses');
      }
      const data = (await res.json()) as PayoutListResponse;
      setPayouts(data);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar repasses');
    } finally {
      setPayoutLoading(false);
    }
  };

  const fetchAccount = async () => {
    try {
      setAccountLoading(true);
      const res = await fetch('/api/medico/financeiro/payout-account');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status !== 404) {
          throw new Error(data?.error || 'Erro ao carregar dados de recebimento');
        }
        setAccount(null);
        setAccountForm({ type: 'PIX' });
        return;
      }
      const data = (await res.json()) as PayoutAccount | null;
      setAccount(data);
      if (data) {
        // Formatar CPF se existir
        let formattedDocument = data.document || undefined;
        if (formattedDocument && formattedDocument.length === 11) {
          formattedDocument = formattedDocument.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        
        setAccountForm({
          type: data.type,
          pixKey: data.pixKey || undefined,
          pixKeyType: data.pixKeyType || undefined,
          bankName: data.bankName || undefined,
          bankCode: data.bankCode || undefined,
          agency: data.agency || undefined,
          accountNumber: data.accountNumber || undefined,
          accountType: data.accountType || undefined,
          holderName: data.holderName || undefined,
          document: formattedDocument,
          notes: data.notes || undefined,
        });
      } else {
        setAccountForm({ type: 'PIX' });
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar dados de recebimento');
    } finally {
      setAccountLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user.role === 'DOCTOR') {
      void fetchSummary();
      void fetchPayouts();
      void fetchAccount();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user.role === 'DOCTOR') {
      void fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryPeriod]);

  useEffect(() => {
    if (session?.user.role === 'DOCTOR') {
      void fetchPayouts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoutStatusFilter, payoutPage]);

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false; // Todos os dígitos iguais
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  const handleSaveAccount = async () => {
    // Validação do CPF
    if (!accountForm.document) {
      toast.error('CPF do titular é obrigatório');
      return;
    }

    const cleanCPF = accountForm.document.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      toast.error('CPF deve conter 11 dígitos');
      return;
    }

    if (!validateCPF(accountForm.document)) {
      toast.error('CPF inválido. Verifique os dígitos informados.');
      return;
    }

    // Validação do tipo de chave PIX (obrigatório quando tipo é PIX)
    if (accountForm.type === 'PIX' && !accountForm.pixKeyType) {
      toast.error('Tipo de chave PIX é obrigatório');
      return;
    }

    try {
      setSavingAccount(true);
      const res = await fetch('/api/medico/financeiro/payout-account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: accountForm.type,
          pixKey: accountForm.pixKey,
          pixKeyType: accountForm.pixKeyType,
          bankName: accountForm.bankName,
          bankCode: accountForm.bankCode,
          agency: accountForm.agency,
          accountNumber: accountForm.accountNumber,
          accountType: accountForm.accountType,
          holderName: accountForm.holderName,
          document: cleanCPF, // Enviar apenas números
          notes: accountForm.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao salvar dados de recebimento');
      }
      toast.success('Dados de recebimento atualizados');
      setEditingAccount(false);
      await fetchAccount();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar dados de recebimento');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!summary) return;
    const amountNum = Number(requestAmount.replace(',', '.'));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (amountNum > summary.totals.available + 0.001) {
      toast.error(`Valor maior que o disponível (R$ ${summary.totals.available.toFixed(2)})`);
      return;
    }
    try {
      setRequestLoading(true);
      const res = await fetch('/api/medico/financeiro/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          notes: requestNotes || undefined,
          periodStart: summary.dateRange.start,
          periodEnd: summary.dateRange.end,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao solicitar pagamento');
      }
      toast.success('Solicitação de pagamento enviada');
      setRequestAmount('');
      setRequestNotes('');
      await Promise.all([fetchSummary(), fetchPayouts()]);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao solicitar pagamento');
    } finally {
      setRequestLoading(false);
    }
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'DOCTOR') return null;

  const periodLabel =
    summary && summary.dateRange
      ? `${new Date(summary.dateRange.start).toLocaleDateString('pt-BR')} — ${new Date(
          summary.dateRange.end,
        ).toLocaleDateString('pt-BR')}`
      : '';

  // Calcular estatísticas adicionais
  const maxEarning = summary?.charts.earningsByPeriod.length
    ? Math.max(...summary.charts.earningsByPeriod.map((e) => e.amount))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DollarSign className="text-green-600" size={32} />
              Área Financeira
            </h1>
            <p className="text-gray-600 mt-2">
              Acompanhe seus ganhos, solicite pagamentos e gerencie seus dados de recebimento.
            </p>
          </div>
          {summary && summary.totals.available > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden md:flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2"
            >
              <Wallet className="text-green-600" size={20} />
              <div>
                <p className="text-xs text-gray-600">Disponível para saque</p>
                <p className="text-lg font-bold text-green-700">
                  R$ {summary.totals.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Cards de resumo + filtro de período */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Período dos ganhos:</span>
          </div>
          <div className="flex gap-2">
            {(['day', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSummaryPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  summaryPeriod === p
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'day' ? 'Hoje' : p === 'month' ? 'Este mês' : 'Este ano'}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-500 flex items-center gap-2">
            {summaryLoading || !summary ? (
              'Carregando…'
            ) : (
              <>
                <Calendar size={14} />
                {periodLabel}
              </>
            )}
          </span>
        </div>

        {summaryLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Carregando dados financeiros...</span>
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border rounded-lg p-5 flex items-center justify-between bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Recebido no período</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {summary.totals.earned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.totals.consultationsPaidCount} consulta{summary.totals.consultationsPaidCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-full shadow-md">
                  <DollarSign size={24} className="text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border rounded-lg p-5 flex items-center justify-between bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Disponível para solicitar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {summary.totals.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {summary.totals.available > 0 && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">Pronto para saque</p>
                  )}
                </div>
                <div className="bg-blue-500 p-3 rounded-full shadow-md">
                  <Wallet size={24} className="text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border rounded-lg p-5 flex items-center justify-between bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Repasses em andamento</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {summary.totals.requested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {summary.totals.requested > 0 ? 'Processando...' : 'Nenhum pendente'}
                  </p>
                </div>
                <div className="bg-yellow-500 p-3 rounded-full shadow-md">
                  <CreditCard size={24} className="text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="border rounded-lg p-5 flex items-center justify-between bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Consultas pagas</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totals.consultationsPaidCount}</p>
                  {summary.totals.consultationsPaidCount > 0 && (
                    <p className="text-xs text-purple-600 mt-1">
                      Média: R${' '}
                      {(
                        summary.totals.earned / summary.totals.consultationsPaidCount
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div className="bg-purple-500 p-3 rounded-full shadow-md">
                  <PiggyBank size={24} className="text-white" />
                </div>
              </motion.div>
            </div>

            {/* Gráfico de evolução dos ganhos */}
            {summary.charts.earningsByPeriod.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-600" />
                    Evolução dos Ganhos
                  </h3>
                  <span className="text-xs text-gray-500">Período selecionado</span>
                </div>
                <div className="space-y-3">
                  {summary.charts.earningsByPeriod.map((item, index) => {
                    const percentage = maxEarning > 0 ? (item.amount / maxEarning) * 100 : 0;
                    return (
                      <motion.div
                        key={item.period}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <div className="w-24 text-sm text-gray-700 font-medium">{item.period}</div>
                        <div className="flex-1 relative">
                          <div className="h-8 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-end pr-2"
                            >
                              {percentage > 15 && (
                                <span className="text-xs font-semibold text-white">
                                  R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </motion.div>
                          </div>
                          {percentage <= 15 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700">
                              R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400" size={48} />
            <p className="mt-4 text-gray-600">Nenhum dado financeiro disponível para o período selecionado.</p>
          </div>
        )}
      </div>

      {/* Layout 2 colunas: esquerda repasse, direita dados conta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Solicitar saque + histórico compacto */}
        <div className="lg:col-span-2 space-y-6">
          {/* Solicitar saque */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Banknote size={24} className="text-green-600" />
                Solicitar Pagamento
              </h2>
              {summary && summary.totals.available > 0 && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  <Wallet size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    Disponível: R$ {summary.totals.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {!account && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Configure seus dados de recebimento primeiro</p>
                    <p className="text-xs">
                      Você precisa cadastrar uma chave PIX ou conta bancária antes de solicitar pagamentos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {summary && summary.totals.available === 0 && summary.totals.consultationsPaidCount === 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Por que meu saldo está zerado?</p>
                    <p className="text-xs mb-2">
                      O saldo disponível considera apenas consultas que atendem TODAS estas condições:
                    </p>
                    <ul className="text-xs list-disc list-inside space-y-1 mb-2">
                      <li>Consulta com status <strong>Concluída</strong> (COMPLETED)</li>
                      <li>Receita médica <strong>emitida</strong></li>
                      <li>Pagamento <strong>confirmado</strong> (status PAID)</li>
                    </ul>
                    <p className="text-xs mb-2">
                      Se você tem consultas concluídas mas o saldo está zerado, verifique se a receita foi emitida e se o pagamento foi confirmado.
                    </p>
                    {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'test') && (
                      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                        <p className="font-semibold text-yellow-900">⚠️ Ambiente de Teste:</p>
                        <p className="text-yellow-800">
                          Em ambiente de teste/sandbox, os pagamentos são confirmados automaticamente após 3 segundos. 
                          Se o pagamento não foi confirmado, pode ser necessário confirmar manualmente via área admin.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm text-gray-700">
                Valor a solicitar (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="Ex: 500,00"
                />
              </label>
              <label className="block text-sm text-gray-700">
                Observações (opcional)
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                  placeholder="Alguma instrução específica para o financeiro..."
                />
              </label>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info size={14} />
                  <span>Os repasses são processados conforme as regras do financeiro da plataforma.</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRequestPayout}
                  loading={requestLoading}
                  disabled={requestLoading || !summary || summary.totals.available <= 0}
                >
                  Solicitar pagamento
                </Button>
              </div>
            </div>
          </div>

          {/* Histórico de repasses (tabela resumida) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={24} className="text-green-600" />
                Histórico de Repasses
              </h2>
              <select
                value={payoutStatusFilter}
                onChange={(e) => {
                  setPayoutPage(1);
                  setPayoutStatusFilter(e.target.value as any);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
              >
                <option value="">Todos os status</option>
                <option value="REQUESTED">Solicitado</option>
                <option value="PROCESSING">Processando</option>
                <option value="PAID">Pago</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            {payoutLoading ? (
              <p className="text-sm text-gray-500">Carregando repasses...</p>
            ) : !payouts || payouts.items.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum repasse encontrado.</p>
            ) : (
              <>
                <div className="overflow-x-auto -mx-2">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Data</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Valor</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Pago em</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Obs.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payouts.items.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            {new Date(p.requestedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-900">
                            R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                p.status === 'PAID'
                                  ? 'bg-green-100 text-green-800'
                                  : p.status === 'PROCESSING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : p.status === 'REQUESTED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {p.status === 'REQUESTED'
                                ? 'Solicitado'
                                : p.status === 'PROCESSING'
                                ? 'Processando'
                                : p.status === 'PAID'
                                ? 'Pago'
                                : 'Cancelado'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {p.paidAt
                              ? new Date(p.paidAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">{p.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {payouts.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                    <span>
                      Página {payouts.page} de {payouts.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={payouts.page <= 1}
                        onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={payouts.page >= payouts.totalPages}
                        onClick={() => setPayoutPage((p) => Math.min(payouts.totalPages, p + 1))}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Dados de recebimento */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Banknote size={24} className="text-green-600" />
                Dados de Recebimento
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingAccount((prev) => !prev)}
              >
                <Edit3 size={16} />
                {editingAccount ? 'Fechar' : account ? 'Editar' : 'Cadastrar'}
              </Button>
            </div>

            {accountLoading ? (
              <p className="text-sm text-gray-500">Carregando dados…</p>
            ) : !account && !editingAccount ? (
              <p className="text-sm text-gray-600">
                Você ainda não cadastrou seus dados de recebimento. Clique em <strong>Cadastrar</strong> para informar sua chave PIX ou conta
                bancária.
              </p>
            ) : (
              <>
                {!editingAccount && account && (
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                        {account.type === 'PIX' ? 'PIX' : 'Conta bancária'}
                      </span>
                    </p>
                    {account.document && (
                      <p>
                        <span className="font-medium">CPF do titular: </span>
                        <span>
                          {account.document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                        </span>
                      </p>
                    )}
                    {account.type === 'PIX' ? (
                      <>
                        {account.pixKeyType && (
                          <p>
                            <span className="font-medium">Tipo de chave: </span>
                            <span>
                              {account.pixKeyType === 'CPF'
                                ? 'CPF'
                                : account.pixKeyType === 'CNPJ'
                                ? 'CNPJ'
                                : account.pixKeyType === 'EMAIL'
                                ? 'E-mail'
                                : account.pixKeyType === 'PHONE'
                                ? 'Telefone'
                                : account.pixKeyType === 'RANDOM'
                                ? 'Chave aleatória'
                                : account.pixKeyType}
                            </span>
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Chave: </span>
                          <span>{account.pixKey}</span>
                        </p>
                        {account.holderName && (
                          <p>
                            <span className="font-medium">Titular: </span>
                            <span>{account.holderName}</span>
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p>
                          <span className="font-medium">Banco: </span>
                          <span>{account.bankName}</span>
                        </p>
                        <p>
                          <span className="font-medium">Agência: </span>
                          <span>{account.agency}</span>
                        </p>
                        <p>
                          <span className="font-medium">Conta: </span>
                          <span>{account.accountNumber}</span>
                        </p>
                        {account.holderName && (
                          <p>
                            <span className="font-medium">Titular: </span>
                            <span>{account.holderName}</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {editingAccount && (
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="text-yellow-700 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yellow-800">
                          <strong>Importante:</strong> Os dados de recebimento devem ser do próprio médico. 
                          Informe apenas dados bancários ou PIX em seu nome.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setAccountForm((f) => ({ ...f, type: 'PIX' }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          accountForm.type === 'BANK'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-primary text-white'
                        }`}
                      >
                        Receber via PIX
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountForm((f) => ({ ...f, type: 'BANK' }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          accountForm.type === 'BANK'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Receber em conta bancária
                      </button>
                    </div>

                    <label className="block">
                      <span className="text-sm text-gray-700">
                        CPF do titular <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={accountForm.document || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          let formatted = value;
                          if (value.length <= 11) {
                            formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                          }
                          setAccountForm((f) => ({ ...f, document: formatted }));
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        CPF do médico titular da conta/PIX
                      </p>
                    </label>

                    {accountForm.type === 'PIX' ? (
                      <>
                        <label className="block">
                          <span className="text-sm text-gray-700">
                            Tipo de chave PIX <span className="text-red-500">*</span>
                          </span>
                          <select
                            value={accountForm.pixKeyType || ''}
                            onChange={(e) => setAccountForm((f) => ({ ...f, pixKeyType: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            required
                          >
                            <option value="">Selecione o tipo</option>
                            <option value="CPF">CPF</option>
                            <option value="CNPJ">CNPJ</option>
                            <option value="EMAIL">E-mail</option>
                            <option value="PHONE">Telefone</option>
                            <option value="RANDOM">Chave aleatória</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">
                            Chave PIX <span className="text-red-500">*</span>
                          </span>
                          <input
                            type="text"
                            value={accountForm.pixKey || ''}
                            onChange={(e) => setAccountForm((f) => ({ ...f, pixKey: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder={
                              accountForm.pixKeyType === 'CPF'
                                ? '000.000.000-00'
                                : accountForm.pixKeyType === 'CNPJ'
                                ? '00.000.000/0000-00'
                                : accountForm.pixKeyType === 'EMAIL'
                                ? 'exemplo@email.com'
                                : accountForm.pixKeyType === 'PHONE'
                                ? '(00) 00000-0000'
                                : accountForm.pixKeyType === 'RANDOM'
                                ? 'Chave aleatória gerada pelo banco'
                                : 'Informe a chave PIX'
                            }
                            required
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Nome completo do titular</span>
                          <input
                            type="text"
                            value={accountForm.holderName || ''}
                            onChange={(e) => setAccountForm((f) => ({ ...f, holderName: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Nome completo conforme documento"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="block">
                          <span className="text-sm text-gray-700">
                            Banco <span className="text-red-500">*</span>
                          </span>
                          <input
                            type="text"
                            value={accountForm.bankName || ''}
                            onChange={(e) => setAccountForm((f) => ({ ...f, bankName: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Nome do banco"
                            required
                          />
                        </label>
                        <div className="flex gap-2">
                          <label className="block flex-1">
                            <span className="text-sm text-gray-700">
                              Agência <span className="text-red-500">*</span>
                            </span>
                            <input
                              type="text"
                              value={accountForm.agency || ''}
                              onChange={(e) => setAccountForm((f) => ({ ...f, agency: e.target.value }))}
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              required
                            />
                          </label>
                          <label className="block flex-1">
                            <span className="text-sm text-gray-700">
                              Conta <span className="text-red-500">*</span>
                            </span>
                            <input
                              type="text"
                              value={accountForm.accountNumber || ''}
                              onChange={(e) => setAccountForm((f) => ({ ...f, accountNumber: e.target.value }))}
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              required
                            />
                          </label>
                        </div>
                        <label className="block">
                          <span className="text-sm text-gray-700">Nome completo do titular</span>
                          <input
                            type="text"
                            value={accountForm.holderName || ''}
                            onChange={(e) => setAccountForm((f) => ({ ...f, holderName: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Nome completo conforme documento"
                          />
                        </label>
                      </>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingAccount(false)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveAccount}
                        loading={savingAccount}
                      >
                        Salvar dados
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

