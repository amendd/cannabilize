'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonTable } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';
import { Search, Edit, Eye, UserCircle } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birthDate: string | null;
  role: string;
  createdAt: string;
  consultations: Array<{ id: string; status: string; scheduledAt: string }>;
  prescriptions: Array<{ id: string; createdAt: string }>;
  patientPathologies: Array<{ pathology: { name: string } }>;
  patientCard: { status: string; approvalStatus: string; cardNumber: string | null } | null;
}

export default function GppPacientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') return;
    setLoading(true);
    fetch(`/api/admin/patients?search=${encodeURIComponent(debouncedSearch)}&role=PATIENT`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPatients(data.patients ?? (Array.isArray(data) ? data : []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.role, debouncedSearch]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  const list = Array.isArray(patients) ? patients : [];

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'GPP CANNA', href: '/gpp-canna' }, { label: 'Pacientes' }]} />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
        <p className="text-slate-600 mt-1">Cadastro completo e vínculo com prescrições. Dados sensíveis sob LGPD.</p>
      </motion.div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={5} />
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCircle size={48} className="mx-auto mb-3 text-slate-300" />
            <p>Nenhum paciente encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="pb-3 pt-4 px-4 font-semibold">Paciente</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Contato</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Consultas</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Prescrições</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{p.name}</span>
                      {p.cpf && <span className="block text-xs text-slate-500">CPF: {p.cpf}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700">{p.email}</span>
                      {p.phone && <span className="block text-xs text-slate-500">{p.phone}</span>}
                    </td>
                    <td className="py-3 px-4">{p.consultations?.length ?? 0}</td>
                    <td className="py-3 px-4">{p.prescriptions?.length ?? 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/pacientes/${p.id}/editar`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-800 text-xs font-medium"
                        >
                          <Edit size={14} /> Editar
                        </Link>
                        <Link
                          href={`/gpp-canna/consentimentos?patientId=${p.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-800 text-xs font-medium"
                        >
                          <Eye size={14} /> Consentimentos
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
