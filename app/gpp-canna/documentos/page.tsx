'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileStack, FileText, User, Calendar, ExternalLink } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Doc {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  version: number;
  validUntil: string | null;
  uploadedAt: string;
  patient?: { id: string; name: string; email: string };
  doctor?: { id: string; name: string; crm: string } | null;
  prescription?: { id: string; status: string } | null;
}

export default function GppDocumentosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (session?.user?.role !== 'ADMIN') return;
    setLoading(true);
    fetch('/api/gpp-canna/documents')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDocuments(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.role]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'GPP CANNA', href: '/gpp-canna' }, { label: 'Documentos (upload)' }]} />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documentos de prescrição</h1>
        <p className="text-slate-600 mt-1">
          Upload e versionamento de PDFs e anexos. Vínculo com paciente, médico e receita.
        </p>
      </motion.div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800 text-sm">
        Para adicionar novos documentos (upload), use a API ou uma tela de upload em desenvolvimento. Aqui são listados os documentos já cadastrados.
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileStack size={48} className="mx-auto mb-3 text-slate-300" />
            <p>Nenhum documento de prescrição cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="pb-3 pt-4 px-4 font-semibold">Arquivo</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Paciente</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Médico</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Versão</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Validade</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Upload</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        {d.fileName}
                      </span>
                      <span className="text-xs text-slate-500">{d.fileType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700">{d.patient?.name || '—'}</span>
                      {d.patient?.email && (
                        <span className="block text-xs text-slate-500">{d.patient.email}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{d.doctor?.name || '—'}</td>
                    <td className="py-3 px-4">v{d.version}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {d.validUntil ? new Date(d.validUntil).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(d.uploadedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {d.fileUrl && (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium"
                        >
                          <ExternalLink size={14} /> Abrir
                        </a>
                      )}
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
