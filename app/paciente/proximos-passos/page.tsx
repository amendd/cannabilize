'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';
import {
  FileText,
  IdCard,
  CreditCard,
  Package,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Leaf,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonPatientDashboard } from '@/components/ui/Skeleton';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';

type Step = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  highlight?: boolean;
  badge?: string;
};

export default function ProximosPassosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();

  const fromConsultation = searchParams.get('from') === 'consultation';
  const consultationId = searchParams.get('id');

  const [consultations, setConsultations] = useState<any[]>([]);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const patientId = effectivePatientId || session.user.id;

    const paymentsUrl = patientId ? `/api/payments?patientId=${patientId}` : '/api/payments';
    Promise.all([
      fetch(`/api/consultations?patientId=${patientId}&limit=100`).then((r) =>
        r.ok ? r.json().then((d: any) => d.consultations ?? d ?? []) : []
      ),
      fetch(paymentsUrl).then((r) => {
        if (!r.ok) return [];
        return r.json().then((data: any[]) => (Array.isArray(data) ? data : []));
      }),
    ])
      .then(([consults, payments]) => {
        setConsultations(Array.isArray(consults) ? consults : []);
        const pending = Array.isArray(payments)
          ? payments.filter((p: any) => p.status === 'PENDING').length
          : 0;
        setPendingPaymentsCount(pending);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, session?.user?.id, effectivePatientId]);

  if (status === 'loading' || loadingPatientId || loading) {
    return <SkeletonPatientDashboard />;
  }

  if (!session) return null;

  const completedConsultations = consultations.filter((c: any) => c.status === 'COMPLETED');
  const hasPrescriptions = completedConsultations.some((c: any) => c.prescription);
  const nextReturn = completedConsultations
    .filter((c: any) => c.nextReturnDate)
    .sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
  const nextReturnDate = nextReturn?.nextReturnDate
    ? new Date(nextReturn.nextReturnDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const steps: Step[] = [
    {
      id: 'receita',
      title: 'Ver e baixar sua receita',
      description: hasPrescriptions
        ? 'Sua receita médica está disponível. Baixe ou visualize quando precisar.'
        : 'Quando o médico emitir, sua receita aparecerá em Receitas.',
      href: '/paciente/receitas',
      icon: FileText,
      highlight: hasPrescriptions,
    },
    {
      id: 'carteirinha',
      title: 'Carteirinha digital',
      description: 'Tenha sua carteirinha de paciente sempre à mão para acesso a medicamentos.',
      href: '/paciente/carteirinha',
      icon: IdCard,
    },
    {
      id: 'retorno',
      title: nextReturnDate ? 'Agendar seu retorno' : 'Agendar nova consulta',
      description: nextReturnDate
        ? `Seu médico indicou retorno por volta de ${nextReturnDate}. Agende quando quiser.`
        : 'Marque uma nova consulta quando precisar de acompanhamento.',
      href: '/agendar',
      icon: RotateCcw,
      highlight: !!nextReturnDate,
      badge: nextReturnDate ? 'Recomendado' : undefined,
    },
    {
      id: 'pagamentos',
      title: 'Pagamentos',
      description:
        pendingPaymentsCount > 0
          ? `Você tem ${pendingPaymentsCount} pagamento(s) pendente(s). Regularize para não perder prazos.`
          : 'Consulte o histórico e comprovantes de pagamento.',
      href: '/paciente/pagamentos',
      icon: CreditCard,
      highlight: pendingPaymentsCount > 0,
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} pendente(s)` : undefined,
    },
    {
      id: 'documentos',
      title: 'Documentos',
      description: 'Guarde receitas, laudos e exames em um só lugar.',
      href: '/paciente/documentos',
      icon: Package,
    },
    {
      id: 'blog',
      title: 'Conteúdo sobre cannabis medicinal',
      description: 'Artigos e orientações sobre uso medicinal, dosagem e cuidados.',
      href: '/blog',
      icon: BookOpen,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        baseHref="/paciente"
        items={[{ label: 'Início', href: '/paciente' }, { label: 'Próximos passos' }]}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-100">
            <Leaf className="text-green-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Próximos passos</h1>
            <p className="text-gray-600 mt-0.5">
              {fromConsultation
                ? 'Sua consulta foi finalizada. Siga estes passos para continuar seu tratamento com tranquilidade.'
                : 'O que você pode fazer agora na sua jornada de tratamento.'}
            </p>
          </div>
        </div>

        {fromConsultation && consultationId && (
          <Link
            href={`/paciente/consultas/${consultationId}`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
          >
            <ArrowRight className="rotate-180" size={16} />
            Voltar ao detalhe da consulta
          </Link>
        )}
      </motion.div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const cardClassName = `block rounded-xl border-2 p-5 transition-all hover:shadow-md w-full text-left ${
            step.highlight
              ? 'border-green-200 bg-green-50/50 hover:border-green-300'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`;
          const content = (
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 p-2.5 rounded-lg ${
                  step.highlight ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <Icon
                  size={24}
                  className={step.highlight ? 'text-green-600' : 'text-gray-600'}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
                  {step.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        step.highlight ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {step.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1 text-primary font-medium text-sm">
                Acessar
                <ArrowRight size={18} />
              </div>
            </div>
          );
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              {step.href === '/agendar' ? (
                <AgendarTrigger className={cardClassName}>
                  {content}
                </AgendarTrigger>
              ) : (
                <Link href={step.href} className={cardClassName}>
                  {content}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 p-5 rounded-xl bg-gray-50 border border-gray-100"
      >
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-green-600" />
          Dica
        </h3>
        <p className="text-sm text-gray-700">
          Guarde sua receita e a carteirinha no celular. Em caso de dúvidas sobre dosagem ou
          retorno, entre em contato com a clínica ou agende uma nova consulta.
        </p>
      </motion.div>
    </div>
  );
}
