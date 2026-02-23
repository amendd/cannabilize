'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Save, 
  Edit, 
  Trash2, 
  Plus, 
  ToggleLeft, 
  ToggleRight,
  FileText,
  User,
  UserCircle,
  Shield,
  RotateCcw,
  Info,
  Settings,
  Send,
  X,
  Inbox,
  GitBranch
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';

interface WhatsAppTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: 'PACIENT' | 'DOCTOR' | 'ADMIN';
  enabled: boolean;
  content: string;
  variables: string | null;
  defaultContent: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS = {
  PACIENT: 'Pacientes',
  DOCTOR: 'Médicos',
  ADMIN: 'Administradores',
};

const CATEGORY_ICONS = {
  PACIENT: UserCircle,
  DOCTOR: User,
  ADMIN: Shield,
};

const CATEGORY_COLORS = {
  PACIENT: 'bg-blue-100 text-blue-700 border-blue-200',
  DOCTOR: 'bg-green-100 text-green-700 border-green-200',
  ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
};

/** Atalhos de teclado para variáveis mais usadas */
const VARIABLE_SHORTCUTS: Record<string, string> = {
  'p': 'patientName',
  'd': 'doctorName',
  'e': 'patientEmail',
  't': 'time',
  'a': 'amount',
  'D': 'date',
  'm': 'meetingLink',
  'c': 'consultationId',
  'n': 'newDate',
  'N': 'newTime',
};

/** Parseia o campo variables do template (pode vir como JSON ou JSON duplamente codificado). Retorna objeto { chave: descrição } ou {}. */
function parseTemplateVariables(variables: string | null): Record<string, string> {
  if (!variables || typeof variables !== 'string') return {};
  try {
    let parsed: unknown = JSON.parse(variables);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // ignore
  }
  return {};
}

/** Todas as variáveis disponíveis no sistema para templates WhatsApp */
const ALL_WHATSAPP_VARIABLES: Record<string, string> = {
  // Pessoa / identificação
  patientName: 'Nome do paciente',
  doctorName: 'Nome do médico',
  patientEmail: 'Email do paciente',
  patientPhone: 'Telefone do paciente (opcional)',
  // Data e horário
  date: 'Data (ex.: da consulta, do pagamento)',
  time: 'Horário',
  currentDate: 'Data atual da consulta',
  currentTime: 'Horário atual',
  newDate: 'Nova data proposta',
  newTime: 'Novo horário proposto',
  // Consulta / reunião
  meetingLink: 'Link da reunião online (opcional)',
  platform: 'Plataforma da consulta (ex.: Google Meet) — opcional',
  consultationId: 'ID da consulta no sistema',
  consultationLink: 'Link da consulta para o médico (anamnese, documentos anexados)',
  // Pagamento
  amount: 'Valor em reais (ex.: R$ 180,00)',
  paymentMethod: 'Forma de pagamento (PIX, Cartão, Boleto ou Aguardando pagamento)',
  transactionId: 'ID da transação de pagamento (opcional)',
  // Receita
  medications: 'Lista de medicamentos prescritos (opcional)',
  prescriptionUrl: 'Link para visualizar a receita (opcional)',
  // Convite para adiantar
  acceptLink: 'Link para o paciente aceitar adiantar a consulta',
  rejectLink: 'Link para o paciente recusar o adiantamento',
  acceptUrl: 'URL de aceitar (alternativa a acceptLink)',
  rejectUrl: 'URL de recusar (alternativa a rejectLink)',
  expiresAt: 'Data/hora de expiração do convite (ex.: 24 horas)',
  message: 'Mensagem adicional do médico (opcional)',
};

export default function WhatsAppTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'PACIENT' | 'DOCTOR' | 'ADMIN' | 'ALL'>('ALL');
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [testingTemplate, setTestingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [autocompleteVisible, setAutocompleteVisible] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const autocompleteStartRef = useRef<number | null>(null);

  /** Insere uma variável (ex: {{patientName}}) no campo Conteúdo da Mensagem na posição do cursor */
  const insertVariableIntoContent = (variableText: string) => {
    if (!editingTemplate) return;
    const textarea = contentTextareaRef.current;
    const content = editingTemplate.content;
    const start = textarea ? textarea.selectionStart : content.length;
    const end = textarea ? textarea.selectionEnd : content.length;
    const newContent = content.slice(0, start) + variableText + content.slice(end);
    setEditingTemplate({ ...editingTemplate, content: newContent });
    pendingCursorRef.current = start + variableText.length;
    setAutocompleteVisible(false);
  };

  /** Filtra variáveis para autocomplete baseado na query (ex: /d, /da, /date) */
  const getAutocompleteSuggestions = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    const entries = Object.entries(ALL_WHATSAPP_VARIABLES);
    if (!lowerQuery) return entries.slice(0, 10); // Sem query: mostra as primeiras 10
    return entries
      .filter(([key]) => key.toLowerCase().includes(lowerQuery) || key.toLowerCase().startsWith(lowerQuery))
      .slice(0, 10);
  };

  /** Calcula posição do dropdown de autocomplete abaixo do cursor no textarea */
  const updateAutocompletePosition = (textarea: HTMLTextAreaElement, startOffset: number) => {
    const rect = textarea.getBoundingClientRect();
    const textBefore = textarea.value.slice(0, startOffset);
    const lines = textBefore.split('\n');
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
    const charWidth = 8;
    const lineLength = lines[lines.length - 1].length;
    setAutocompletePosition({
      top: rect.top + (lines.length - 1) * lineHeight + lineHeight + 4,
      left: rect.left + lineLength * charWidth,
    });
  };

  /** Lida com digitação no textarea: / ou /d, /da etc. abre autocomplete de variáveis */
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingTemplate) return;
    
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    
    // Detectar / ou /algo (barra no início da linha ou após espaço/quebra)
    const lastSlash = textBeforeCursor.lastIndexOf('/');
    const charBeforeSlash = lastSlash > 0 ? textBeforeCursor[lastSlash - 1] : '\n';
    const isValidSlash = lastSlash !== -1 && (lastSlash === 0 || charBeforeSlash === ' ' || charBeforeSlash === '\n');
    
    if (isValidSlash) {
      const query = textBeforeCursor.slice(lastSlash + 1);
      // Não considerar se tiver espaço na query (fechou o comando)
      const queryWithoutSpace = query.includes(' ') ? '' : query;
      const suggestions = getAutocompleteSuggestions(queryWithoutSpace);
      
      if (suggestions.length > 0) {
        setAutocompleteQuery(queryWithoutSpace);
        setAutocompleteVisible(true);
        autocompleteStartRef.current = lastSlash;
        setTimeout(() => {
          updateAutocompletePosition(e.target, lastSlash);
        }, 0);
      } else {
        setAutocompleteVisible(false);
      }
    } else {
      setAutocompleteVisible(false);
    }
    
    setEditingTemplate({ ...editingTemplate, content: value });
  };

  useEffect(() => {
    if (pendingCursorRef.current === null) return;
    const textarea = contentTextareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(pendingCursorRef.current, pendingCursorRef.current);
      pendingCursorRef.current = null;
    }
  }, [editingTemplate?.content]);

  // Capturar atalhos de teclado quando o editor estiver aberto
  useEffect(() => {
    if (!showEditor || !editingTemplate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+? ou Ctrl+/ para mostrar ajuda
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === '?') || (!e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        setShowShortcutsHelp(true);
        return;
      }

      // ESC para fechar ajuda ou autocomplete
      if (e.key === 'Escape') {
        setShowShortcutsHelp(false);
        setAutocompleteVisible(false);
        return;
      }

      // Só processar atalhos se o textarea estiver focado
      const textarea = contentTextareaRef.current;
      if (!textarea || document.activeElement !== textarea) return;

      // Tab ou Enter no autocomplete (digite /d, /da etc.)
      if (autocompleteVisible && (e.key === 'Tab' || e.key === 'Enter')) {
        e.preventDefault();
        const suggestions = getAutocompleteSuggestions(autocompleteQuery);
        if (suggestions.length > 0 && autocompleteStartRef.current !== null && editingTemplate) {
          const textarea = contentTextareaRef.current;
          if (textarea) {
            const start = autocompleteStartRef.current;
            const end = textarea.selectionStart;
            const before = editingTemplate.content.slice(0, start);
            const after = editingTemplate.content.slice(end);
            const newContent = before + `{{${suggestions[0][0]}}}` + after;
            setEditingTemplate({ ...editingTemplate, content: newContent });
            pendingCursorRef.current = start + `{{${suggestions[0][0]}}}`.length;
            setAutocompleteVisible(false);
            autocompleteStartRef.current = null;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditor, editingTemplate, autocompleteVisible, autocompleteQuery]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user.role === 'ADMIN') {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory !== 'ALL' ? `?category=${selectedCategory}` : '';
      const response = await fetch(`/api/admin/whatsapp/templates${categoryParam}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Templates carregados:', data);
        setTemplates(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro ao carregar templates:', errorData);
        
        // Se for erro de tabela não encontrada, mostrar mensagem específica
        if (errorData.code === 'TABLE_NOT_FOUND') {
          toast.error(
            'Tabela não existe no banco. Execute: npx prisma db push',
            { duration: 8000 }
          );
        } else {
          toast.error(errorData.error || 'Erro ao carregar templates');
        }
        setTemplates([]);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleToggleEnabled = async (template: WhatsAppTemplate) => {
    try {
      const response = await fetch('/api/admin/whatsapp/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: template.id,
          enabled: !template.enabled,
        }),
      });

      if (response.ok) {
        toast.success(`Template ${!template.enabled ? 'habilitado' : 'desabilitado'}`);
        await loadTemplates();
      } else {
        toast.error('Erro ao atualizar template');
      }
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate),
      });

      if (response.ok) {
        toast.success('Template salvo com sucesso!');
        setShowEditor(false);
        setEditingTemplate(null);
        await loadTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar template');
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!editingTemplate || !editingTemplate.defaultContent) return;
    
    if (confirm('Tem certeza que deseja restaurar o conteúdo padrão? Isso irá sobrescrever suas alterações.')) {
      setEditingTemplate({
        ...editingTemplate,
        content: editingTemplate.defaultContent,
      });
      toast.success('Conteúdo restaurado para o padrão');
    }
  };

  const handleSeed = async () => {
    if (confirm('Isso irá criar/atualizar os templates padrão. Continuar?')) {
      try {
        setSaving(true);
        const response = await fetch('/api/admin/whatsapp/templates/seed', {
          method: 'POST',
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Resultado da criação de templates:', result);
          
          // Aguardar um pouco para garantir que o banco processou
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Recarregar templates
          await loadTemplates();
          
          toast.success(result.message || 'Templates padrão criados/atualizados!');
          
          // Se houver erros, mostrar aviso
          if (result.errors && result.errors.length > 0) {
            console.warn('Alguns templates tiveram erros:', result.errors);
            const errorDetails = result.errors.map((e: any) => `${e.code}: ${e.error}`).join(', ');
            toast.error(`Alguns templates não puderam ser criados. Verifique o console para detalhes.`, {
              duration: 8000,
            });
            console.error('Detalhes dos erros:', result.errors);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          console.error('Erro ao criar templates:', errorData);
          
          // Se for erro de tabela não encontrada, mostrar mensagem específica
          if (errorData.code === 'TABLE_NOT_FOUND') {
            toast.error(
              'Tabela não existe no banco. Execute: npx prisma db push',
              { duration: 8000 }
            );
          } else {
            toast.error(errorData.error || 'Erro ao criar templates padrão');
          }
        }
      } catch (error) {
        console.error('Erro ao criar templates:', error);
        toast.error('Erro ao criar templates. Verifique o console para mais detalhes.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleTest = async () => {
    if (!testingTemplate) return;

    if (!testPhone.trim()) {
      toast.error('Por favor, informe um número de telefone para teste');
      return;
    }

    try {
      setTesting(true);
      const response = await fetch('/api/admin/whatsapp/templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: testingTemplate.id,
          phoneNumber: testPhone.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Mensagem de teste enviada com sucesso!');
        setTestingTemplate(null);
        setTestPhone('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar mensagem de teste');
      }
    } catch (error) {
      console.error('Erro ao testar template:', error);
      toast.error('Erro ao testar template');
    } finally {
      setTesting(false);
    }
  };

  const openTestModal = (template: WhatsAppTemplate) => {
    setTestingTemplate(template);
    setTestPhone('');
  };

  const filteredTemplates = selectedCategory === 'ALL' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  if (status === 'loading') {
    return <LoadingPage />;
  }
  
  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'WhatsApp', href: '/admin/whatsapp' },
          { label: 'Templates' },
        ]} />

        {/* Submenu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 mt-4"
        >
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex gap-4">
              <Link
                href="/admin/whatsapp"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings size={18} />
                Configurações
              </Link>
              <Link
                href="/admin/whatsapp/templates"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/templates'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText size={18} />
                Templates de Mensagens
              </Link>
              <Link
                href="/admin/whatsapp/mensagens"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/mensagens'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Inbox size={18} />
                Mensagens
              </Link>
              <Link
                href="/admin/fluxos-whatsapp"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/fluxos-whatsapp'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <GitBranch size={18} />
                Fluxos
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">Templates de Mensagens WhatsApp</h1>
              <p className="text-gray-600 mt-2">Gerencie os modelos de mensagens enviadas automaticamente</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSeed}
                className="flex items-center gap-2"
                variant="outline"
                disabled={saving || loading}
              >
                <Plus size={16} />
                {saving ? 'Criando...' : 'Criar Templates Padrão'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filtros por Categoria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === 'ALL'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {(['PACIENT', 'DOCTOR', 'ADMIN'] as const).map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {CATEGORY_LABELS[category]}
              </button>
            );
          })}
        </div>
        </motion.div>

        {/* Editor de Template */}
        {showEditor && editingTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white rounded-lg shadow-md p-6 border-2 border-primary"
          >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Editando: {editingTemplate.name}
            </h2>
            <button
              onClick={() => {
                setShowEditor(false);
                setEditingTemplate(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6 pb-4 border-b border-gray-200">
            Os campos abaixo definem como a mensagem será exibida no WhatsApp. Cada campo indica onde o texto aparece na conversa.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Template
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Aparece como <strong>título da mensagem</strong> no WhatsApp — o texto em destaque no início da mensagem (ex.: &quot;Nova Consulta Agendada&quot;).
              </p>
              <Input
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  name: e.target.value,
                })}
                className="w-full"
                placeholder="Ex: Confirmação de Consulta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Apenas para <strong>uso interno</strong> no painel — ajuda a identificar quando este template é usado. <em>Não é enviada na mensagem do WhatsApp.</em>
              </p>
              <Input
                value={editingTemplate.description || ''}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  description: e.target.value,
                })}
                className="w-full"
                placeholder="Ex: Enviada quando uma consulta é agendada"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo da Mensagem
              </label>
              <p className="text-xs text-gray-500 mb-2">
                É o <strong>corpo da mensagem</strong> enviada no WhatsApp — o texto completo que o destinatário verá. Use <code className="bg-gray-200 px-1 rounded">{'{{variavel}}'}</code> para dados dinâmicos (nome, data, valor, etc.).
              </p>
              <div className="relative">
                <textarea
                  ref={contentTextareaRef}
                  value={editingTemplate.content}
                  onChange={handleContentChange}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="Digite o conteúdo. Use /d, /da, /date etc. para inserir variáveis (ex: {{date}})."
                />
                
                {/* Autocomplete dropdown (digite / ou /d, /da etc.) */}
                {autocompleteVisible && autocompleteStartRef.current !== null && (
                  <div 
                    className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto py-1"
                    style={{
                      top: `${autocompletePosition.top}px`,
                      left: `${autocompletePosition.left}px`,
                      minWidth: '280px',
                    }}
                  >
                    <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">
                      Variáveis — clique ou Tab/Enter para inserir
                    </div>
                    {getAutocompleteSuggestions(autocompleteQuery).map(([key, desc]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (autocompleteStartRef.current !== null && contentTextareaRef.current && editingTemplate) {
                            const textarea = contentTextareaRef.current;
                            const start = autocompleteStartRef.current;
                            const end = textarea.selectionStart;
                            // Remover {{query e substituir por {{key}}
                            const before = editingTemplate.content.slice(0, start);
                            const after = editingTemplate.content.slice(end);
                            const newContent = before + `{{${key}}}` + after;
                            setEditingTemplate({ ...editingTemplate, content: newContent });
                            pendingCursorRef.current = start + `{{${key}}}`.length;
                            setAutocompleteVisible(false);
                            autocompleteStartRef.current = null;
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2 transition"
                      >
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">{`{{${key}}}`}</code>
                        <span className="text-xs text-gray-600">{desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Variáveis disponíveis neste template</p>
                    <p className="text-xs text-blue-700 mb-2">
                      Digite <code className="bg-blue-100 px-1 rounded">/</code> no conteúdo e depois o início do nome (ex: <code className="bg-blue-100 px-1 rounded">/d</code>, <code className="bg-blue-100 px-1 rounded">/da</code> para <code className="bg-blue-100 px-1 rounded">{'{{date}}'}</code>). Ou clique em uma variável abaixo.
                    </p>
                    {editingTemplate.variables && (() => {
                      const varsObj = parseTemplateVariables(editingTemplate.variables);
                      const entries = Object.entries(varsObj);
                      if (entries.length === 0) return null;
                      return (
                        <ul className="list-disc list-inside space-y-1">
                          {entries.map(([key, value]) => (
                            <li key={key} className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => insertVariableIntoContent(`{{${key}}}`)}
                                className="bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded font-mono text-sm cursor-pointer border border-blue-200 transition"
                                title={`Inserir ${key} no conteúdo`}
                              >
                                {`{{${key}}}`}
                              </button>
                              <span className="text-blue-800">: {value}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Referência: todas as variáveis do sistema */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Todas as variáveis disponíveis no sistema
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Digite <code className="bg-gray-200 px-1 rounded">/</code> no conteúdo e depois o início do nome (ex: <code className="bg-gray-200 px-1 rounded">/d</code>, <code className="bg-gray-200 px-1 rounded">/date</code>) para ver sugestões. Ou clique em uma variável. As marcadas como &quot;opcional&quot; só aparecem se o sistema tiver o dado.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {Object.entries(ALL_WHATSAPP_VARIABLES).map(([key, desc]) => (
                    <div key={key} className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => insertVariableIntoContent(`{{${key}}}`)}
                        className="bg-gray-200 hover:bg-gray-300 px-1.5 py-0.5 rounded shrink-0 font-mono cursor-pointer border border-gray-300 transition text-left"
                        title={`Inserir ${key} no conteúdo`}
                      >
                        {`{{${key}}}`}
                      </button>
                      <span className="text-gray-700">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center justify-between">
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Salvando...' : 'Salvar Template'}
                </Button>
                {editingTemplate.defaultContent && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Restaurar Padrão
                  </Button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(true)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                title="Como inserir variáveis com /"
              >
                <Info size={14} />
                Inserir variável: digite /
              </button>
            </div>

            {/* Overlay de ajuda com atalhos */}
            {showShortcutsHelp && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowShortcutsHelp(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Inserir variáveis com /
                    </h3>
                    <button
                      onClick={() => setShowShortcutsHelp(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        No campo &quot;Conteúdo da Mensagem&quot;, digite uma barra e o início do nome da variável:
                      </p>
                      <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                        <li><code className="bg-gray-200 px-1 rounded">/</code> — mostra todas as variáveis</li>
                        <li><code className="bg-gray-200 px-1 rounded">/d</code> — filtra variáveis com &quot;d&quot; (ex: date, doctorName)</li>
                        <li><code className="bg-gray-200 px-1 rounded">/da</code> — filtra para <code className="bg-gray-200 px-1 rounded">{'{{date}}'}</code></li>
                        <li><code className="bg-gray-200 px-1 rounded">/pat</code> — filtra para patientName, patientEmail, patientPhone</li>
                        <li><code className="bg-gray-200 px-1 rounded">/amount</code> — insere <code className="bg-gray-200 px-1 rounded">{'{{amount}}'}</code></li>
                      </ul>
                      <p className="text-sm text-gray-600 mt-2">
                        Clique na sugestão ou pressione <kbd className="bg-gray-100 border px-1 rounded text-xs">Tab</kbd> / <kbd className="bg-gray-100 border px-1 rounded text-xs">Enter</kbd> para inserir.
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Atalhos:
                      </p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <kbd className="bg-gray-100 border border-gray-300 px-2 py-1 rounded text-xs font-mono">
                            Ctrl+/
                          </kbd>
                          <span>Abrir esta ajuda</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <kbd className="bg-gray-100 border border-gray-300 px-2 py-1 rounded text-xs font-mono">
                            ESC
                          </kbd>
                          <span>Fechar ajuda ou autocomplete</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
          </motion.div>
        )}

        {/* Lista de Templates */}
        {loading ? (
          <SkeletonDashboard />
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory === 'ALL' 
              ? 'Crie os templates padrão para começar'
              : `Nenhum template para ${CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS]}`}
          </p>
          <Button 
            onClick={handleSeed} 
            className="flex items-center gap-2 mx-auto"
            disabled={saving || loading}
          >
            <Plus size={16} />
            {saving ? 'Criando...' : 'Criar Templates Padrão'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const CategoryIcon = CATEGORY_ICONS[template.category];
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-md p-5 border-2 ${
                  template.enabled 
                    ? 'border-green-200' 
                    : 'border-gray-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon size={20} className={CATEGORY_COLORS[template.category].split(' ')[1]} />
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${CATEGORY_COLORS[template.category]}`}>
                      {CATEGORY_LABELS[template.category]}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleEnabled(template)}
                    className="text-gray-400 hover:text-gray-600"
                    title={template.enabled ? 'Desabilitar' : 'Habilitar'}
                  >
                    {template.enabled ? (
                      <ToggleRight size={24} className="text-green-600" />
                    ) : (
                      <ToggleLeft size={24} className="text-gray-400" />
                    )}
                  </button>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                )}

                <div className="mb-3">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {template.code}
                  </code>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-3 max-h-32 overflow-y-auto">
                  <p className="text-xs text-gray-600 line-clamp-4 font-mono">
                    {template.content}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(template)}
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit size={14} />
                    Editar
                  </Button>
                  <Button
                    onClick={() => openTestModal(template)}
                    className="flex-1 flex items-center justify-center gap-2 text-sm bg-green-600 hover:bg-green-700"
                  >
                    <Send size={14} />
                    Testar
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
        )}

        {/* Modal de Teste */}
        {testingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Testar Template: {testingTemplate.name}
              </h3>
              <button
                onClick={() => {
                  setTestingTemplate(null);
                  setTestPhone('');
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={testing}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Telefone para Teste
              </label>
              <Input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+55 79 99999-9999"
                className="w-full"
                disabled={testing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite o número no formato internacional (ex: +55 79 99999-9999)
              </p>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">A mensagem será enviada com dados de exemplo:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {testingTemplate.variables && Object.entries(parseTemplateVariables(testingTemplate.variables)).slice(0, 3).map(([key, value]) => (
                      <li key={key}>
                        <code className="bg-blue-100 px-1 rounded">{`{{${key}}}`}</code>: {value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleTest}
                disabled={testing || !testPhone.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Send size={16} />
                {testing ? 'Enviando...' : 'Enviar Teste'}
              </Button>
              <Button
                onClick={() => {
                  setTestingTemplate(null);
                  setTestPhone('');
                }}
                variant="outline"
                disabled={testing}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
