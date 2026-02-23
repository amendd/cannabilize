'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Database,
  Download,
  Upload,
  Save,
  Settings,
  AlertTriangle,
  FileJson,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

interface BackupConfig {
  dbType: string;
  retentionDays: number;
  autoExportEnabled: boolean;
}

export default function AdminBackupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [config, setConfig] = useState<BackupConfig>({
    dbType: 'sqlite',
    retentionDays: 14,
    autoExportEnabled: false,
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importConfirm, setImportConfirm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') loadConfig();
  }, [session?.user?.role]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/backup/config');
      if (res.ok) {
        const data = await res.json();
        setConfig({
          dbType: data.dbType ?? 'sqlite',
          retentionDays: data.retentionDays ?? 14,
          autoExportEnabled: data.autoExportEnabled ?? false,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/backup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retentionDays: config.retentionDays,
          autoExportEnabled: config.autoExportEnabled,
        }),
      });
      if (res.ok) {
        toast.success('Configurações salvas.');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/admin/backup/export', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Erro ao gerar backup');
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const name = match?.[1] || `backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup baixado com sucesso.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Selecione um arquivo JSON de backup.');
      return;
    }
    if (!importConfirm) {
      toast.error('Marque a confirmação de restauração.');
      return;
    }

    try {
      setImporting(true);
      const text = await importFile.text();
      const payload = JSON.parse(text) as { meta?: unknown; data?: unknown };
      if (!payload.meta || !payload.data) {
        toast.error('Arquivo inválido: esperado objeto com meta e data.');
        return;
      }

      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmRestore: true, payload }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Restauração concluída. ${data.imported ?? 0} registros importados.`);
        setImportFile(null);
        setImportConfirm(false);
      } else {
        toast.error(data?.error || 'Erro ao restaurar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Arquivo inválido ou erro ao restaurar.');
    } finally {
      setImporting(false);
    }
  };

  if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Backup' }]} />
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Backup' }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Database className="w-7 h-7 text-primary-600" />
          Backup do banco de dados
        </h1>
        <p className="text-gray-600 mt-1">
          Exporte e importe backups em JSON e configure retenção. Para backups automáticos em produção, consulte{' '}
          <code className="text-sm bg-gray-100 px-1 rounded">docs/ESTRATEGIA_BACKUP_BANCO.md</code>.
        </p>
      </div>

      {/* Configuração */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary-600" />
          Configuração
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de banco</label>
            <div className="flex items-center gap-2 text-gray-600">
              <HardDrive className="w-4 h-4" />
              <span className="capitalize">{config.dbType}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retenção (dias)</label>
            <Input
              type="number"
              min={1}
              max={365}
              value={config.retentionDays}
              onChange={(e) => setConfig((c) => ({ ...c, retentionDays: parseInt(e.target.value, 10) || 14 }))}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="autoExport"
              checked={config.autoExportEnabled}
              onChange={(e) => setConfig((c) => ({ ...c, autoExportEnabled: e.target.checked }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="autoExport" className="text-sm text-gray-700">
              Habilitar exportação automática (quando disponível via cron)
            </label>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={saveConfig} disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar configuração'}
          </Button>
        </div>
      </motion.section>

      {/* Exportar */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary-600" />
          Exportar backup
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Gera um arquivo JSON com todos os dados do banco (todas as tabelas). Use para cópia de segurança ou migração.
        </p>
        <Button onClick={handleExport} disabled={exporting} className="flex items-center gap-2">
          {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
          {exporting ? 'Gerando...' : 'Gerar e baixar backup'}
        </Button>
      </motion.section>

      {/* Importar */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-red-100 p-6 mb-6"
      >
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-amber-600" />
          Restaurar backup (importar)
        </h2>
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Atenção:</strong> Restaurar um backup substitui os dados atuais do banco pelos do arquivo. Faça um
            export antes se quiser manter uma cópia do estado atual. Esta ação não pode ser desfeita.
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo JSON de backup</label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:bg-gray-50 file:text-gray-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="confirmImport"
              checked={importConfirm}
              onChange={(e) => setImportConfirm(e.target.checked)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="confirmImport" className="text-sm text-gray-700">
              Confirmo que desejo substituir todos os dados do banco pelos do arquivo selecionado
            </label>
          </div>
          <Button
            onClick={handleImport}
            disabled={importing || !importFile || !importConfirm}
            className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
          >
            {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Restaurando...' : 'Restaurar backup'}
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
