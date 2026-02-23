'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HelpCircle, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
};

export default function AdminDuvidasFrequentesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [list, setList] = useState<FaqItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    active: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      load();
    }
  }, [status, session?.user?.role, router]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/faq');
      let items: FaqItem[] = [];
      if (res.ok) {
        const data = await res.json();
        items = Array.isArray(data) ? data : [];
      }
      // Se não houver itens no banco, carrega as dúvidas padrão (mesmo conteúdo exibido na home) para edição
      if (items.length === 0) {
        const seedRes = await fetch('/api/admin/faq/seed', { method: 'POST' });
        const seedData = await seedRes.json();
        if (seedRes.ok && seedData.list && Array.isArray(seedData.list)) {
          items = seedData.list;
          toast.success('Dúvidas padrão carregadas. Você já pode editar o conteúdo exibido na home.');
        }
      }
      setList(items);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar dúvidas frequentes');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ question: '', answer: '', active: true });
    setShowForm(true);
  };

  const openEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setForm({
      question: item.question,
      answer: item.answer,
      active: item.active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ question: '', answer: '', active: true });
  };

  const saveItem = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Preencha pergunta e resposta.');
      return;
    }
    try {
      setSaving(true);
      const url = editingId ? `/api/admin/faq/${editingId}` : '/api/admin/faq';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { question: form.question.trim(), answer: form.answer.trim(), active: form.active }
        : { question: form.question.trim(), answer: form.answer.trim(), active: form.active };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? 'Item atualizado!' : 'Item criado!');
        closeForm();
        load();
      } else {
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Excluir esta dúvida?')) return;
    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Item excluído');
        if (editingId === id) closeForm();
        load();
      } else {
        const data = await res.json();
        toast.error(data?.error || 'Erro ao excluir');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir');
    }
  };

  const seedDefaults = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/admin/faq/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.list) {
        setList(data.list);
        toast.success(data.message || 'Dúvidas padrão carregadas.');
      } else if (res.ok && data.message) {
        toast.success(data.message);
        load();
      } else {
        toast.error(data?.error || 'Erro ao carregar padrão');
        load();
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar padrão');
      load();
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Dúvidas frequentes' }]} />
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Dúvidas frequentes' }]} />
      <div className="mt-6 flex items-center gap-2 text-gray-700">
        <HelpCircle size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Dúvidas frequentes</h1>
      </div>
      <p className="mt-2 text-gray-600">
        Gerencie as perguntas e respostas exibidas na seção &quot;Dúvidas frequentes&quot; da página inicial. A ordem da lista define a ordem de exibição na home.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={openNew} className="gap-2">
          <Plus size={18} />
          Nova dúvida
        </Button>
        {list.length === 0 && (
          <Button variant="secondary" onClick={seedDefaults} disabled={seeding} className="gap-2">
            {seeding ? 'Carregando...' : 'Carregar dúvidas padrão'}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Editar dúvida' : 'Nova dúvida'}
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pergunta</label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="mt-1"
                placeholder="Ex: É legal no Brasil?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Resposta</label>
              <textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                placeholder="Resposta completa exibida ao expandir o item na home."
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Exibir na home</span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={saveItem} disabled={saving} className="gap-2">
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="secondary" onClick={closeForm} className="gap-2">
              <X size={18} />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {list.length === 0 && !showForm && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Nenhuma dúvida cadastrada. Clique em &quot;Nova dúvida&quot; para adicionar ou em &quot;Carregar dúvidas padrão&quot; para usar as perguntas sugeridas.
          </div>
        )}
        {list.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{item.question}</p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.answer}</p>
              <div className="mt-2 flex items-center gap-2">
                {item.active ? (
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Visível na home
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    Oculto
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                aria-label="Editar"
              >
                <span className="flex items-center gap-1.5">
                  <Pencil size={16} />
                  Editar
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                aria-label="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
