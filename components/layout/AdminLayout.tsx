'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import LogoImage from '@/components/ui/LogoImage';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  TestTube,
  Pill, 
  Shield, 
  CreditCard, 
  BookOpen, 
  Image as ImageIcon, 
  Star, 
  Video, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ChevronDown,
  IdCard,
  UserCircle,
  Mail,
  MessageSquare,
  UserCog,
  Briefcase,
  Building2,
  FileCheck,
  Newspaper,
  Radio,
  Activity,
  BarChart3,
  Palette,
  HelpCircle,
  Sun,
  Moon,
  Send,
  Bot,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { canAccessAdmin, canManageUsers, canAccessCompliance, canAccessReports } from '@/lib/roles-permissions';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type PendingKey = 'consultations' | 'prescriptions' | 'anvisa' | 'patientCards';

interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  items: Array<{
    icon: any;
    label: string;
    href: string;
    exact?: boolean;
    adminOnly?: boolean;
    badgeKey?: PendingKey; // contador de pendências ao lado do item
  }>;
  defaultOpen?: boolean;
}

const THEME_STORAGE_KEY = 'admin-theme';

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['operacional']));
  const [pending, setPending] = useState<Record<PendingKey, number>>({
    consultations: 0,
    prescriptions: 0,
    anvisa: 0,
    patientCards: 0,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Garantir que o sidebar mobile não fique travado aberto
  useEffect(() => {
    // Fechar sidebar se estiver em desktop
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    // Fechar com ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    // Limpar overlays travados ao montar
    const cleanupStuckOverlays = () => {
      // Aguardar um pouco para garantir que o DOM está pronto
      setTimeout(() => {
        const overlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"]');
        overlays.forEach((overlay) => {
          const element = overlay as HTMLElement;
          // Se for um overlay escuro sem conteúdo visível, remover
          if (
            (element.classList.contains('bg-black') || 
             element.classList.contains('bg-opacity') ||
             element.style.backgroundColor?.includes('rgba(0, 0, 0')) &&
            !element.querySelector('h1, h2, h3, button, [role="dialog"]') &&
            !element.classList.contains('lg:hidden')
          ) {
            console.warn('Removendo overlay travado detectado');
            element.remove();
            document.body.style.overflow = '';
          }
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleEscape);
    
    // Verificar na montagem
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
      cleanupStuckOverlays();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const role = session?.user?.role;
  const subadminMenuIds = role === 'SUBADMIN' ? (session?.user?.adminMenuPermissions ?? []) : null;
  const allowedGroupIds = subadminMenuIds ? new Set(subadminMenuIds) : null;

  const baseMenuGroups: MenuGroup[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: 'Visão Geral', href: '/admin', exact: true },
        { icon: Activity, label: 'Métricas', href: '/admin/metricas' },
        { icon: Building2, label: 'ERP CANNA', href: '/erp-canna' },
        { icon: FileCheck, label: 'GPP CANNA', href: '/gpp-canna' },
        { icon: CreditCard, label: 'IFP CANNA', href: '/ifp-canna' },
      ],
      defaultOpen: true,
    },
    {
      id: 'pacientes',
      label: 'Pacientes',
      icon: UserCircle,
      items: [{ icon: UserCircle, label: 'Pacientes', href: '/admin/pacientes' }],
      defaultOpen: true,
    },
    {
      id: 'prescricoes',
      label: 'Prescrições',
      icon: FileText,
      items: [
        { icon: FileText, label: 'Prescrições / Receitas', href: '/admin/receitas', badgeKey: 'prescriptions' },
        { icon: Calendar, label: 'Consultas', href: '/admin/consultas', badgeKey: 'consultations' },
        { icon: IdCard, label: 'Carteirinhas', href: '/admin/carteirinhas', badgeKey: 'patientCards' },
      ],
      defaultOpen: true,
    },
    {
      id: 'medicos',
      label: 'Médicos',
      icon: Users,
      items: [{ icon: Users, label: 'Médicos', href: '/admin/medicos' }],
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: FileCheck,
      items: [
        { icon: FileCheck, label: 'Documentos', href: '/admin/documentos' },
      ],
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: BarChart3,
      items: [
        { icon: BarChart3, label: 'Relatórios', href: '/admin/relatorios' },
        { icon: Activity, label: 'Métricas', href: '/admin/metricas' },
      ],
      defaultOpen: false,
    },
    {
      id: 'compliance',
      label: 'Compliance & LGPD',
      icon: Shield,
      items: [
        { icon: Shield, label: 'Consentimentos e Auditoria', href: '/admin/compliance' },
        { icon: Shield, label: 'ANVISA', href: '/admin/anvisa', badgeKey: 'anvisa' },
        { icon: Pill, label: 'Medicamentos', href: '/admin/medicamentos' },
      ],
    },
    {
      id: 'usuarios',
      label: 'Usuários & Permissões',
      icon: UserCog,
      items: [{ icon: UserCog, label: 'Usuários', href: '/admin/usuarios', adminOnly: true }],
    },
    {
      id: 'integracoes',
      label: 'Integrações',
      icon: Radio,
      items: [
        { icon: Send, label: 'Disparos', href: '/admin/disparos' },
        { icon: Video, label: 'Telemedicina', href: '/admin/telemedicina' },
        { icon: Mail, label: 'Email', href: '/admin/email' },
        { icon: MessageSquare, label: 'WhatsApp', href: '/admin/whatsapp' },
        { icon: Activity, label: 'Monitor Z-API', href: '/admin/whatsapp/monitor' },
        { icon: MessageSquare, label: 'Fluxos WhatsApp', href: '/admin/fluxos-whatsapp' },
        { icon: Bot, label: 'IA no WhatsApp', href: '/admin/whatsapp/ia' },
        { icon: CreditCard, label: 'Pagamentos', href: '/admin/pagamentos' },
        { icon: BarChart3, label: 'Google Analytics', href: '/admin/integracoes/analytics' },
      ],
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      items: [
        { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
        { icon: Database, label: 'Backup', href: '/admin/backup' },
        { icon: Shield, label: 'Segurança', href: '/admin/seguranca' },
        { icon: Palette, label: 'Identidade Visual', href: '/admin/identidade-visual' },
        { icon: BookOpen, label: 'Blog', href: '/admin/blog' },
        { icon: ImageIcon, label: 'Galeria', href: '/admin/galeria' },
        { icon: Star, label: 'Artigos Destaque', href: '/admin/artigos-destaque' },
        { icon: HelpCircle, label: 'Dúvidas Frequentes', href: '/admin/duvidas-frequentes' },
        { icon: TestTube, label: 'Teste de Receita', href: '/admin/teste-receita' },
      ],
    },
  ];

  const menuGroups = allowedGroupIds
    ? baseMenuGroups.filter((g) => allowedGroupIds.has(g.id))
    : baseMenuGroups;

  // Buscar contagens de pendências para badges do menu
  useEffect(() => {
    if (!session || !canAccessAdmin(session.user?.role)) return;
    fetch('/api/admin/pending', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        setPending({
          consultations: data.consultations ?? 0,
          prescriptions: data.prescriptions ?? 0,
          anvisa: data.anvisa ?? 0,
          patientCards: data.patientCards ?? 0,
        });
      })
      .catch(() => {});
  }, [session?.user?.role]);

  // Carregar tema salvo na primeira montagem
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
    if (saved === 'dark' || saved === 'light') setTheme(saved);
  }, []);

  // Persistir e aplicar tema (admin: apenas área do painel)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const wrapper = document.getElementById('admin-theme-wrapper');
    if (wrapper) {
      wrapper.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Inicializar grupos expandidos baseado em defaultOpen
  useEffect(() => {
    const defaultOpen = new Set<string>();
    menuGroups.forEach(group => {
      if (group.defaultOpen) {
        defaultOpen.add(group.id);
      }
    });
    setExpandedGroups(defaultOpen);
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow min-h-0 bg-gradient-to-b from-primary-900 to-primary-800 text-white shadow-lg">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-5 border-b border-primary-700">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="bg-white/95 rounded-md px-2 py-1 shadow-sm">
                <LogoImage width={140} height={44} className="h-9 w-auto" />
              </span>
            </Link>
          </div>

          {/* Menu */}
          <nav className="flex-1 min-h-0 px-4 py-6 space-y-2 overflow-y-auto">
            {menuGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups.has(group.id);
              const hasActiveItem = group.items.some(item => {
                if (item.adminOnly && !canManageUsers(role)) return false;
                return isActive(item.href, item.exact);
              });
              
              const visibleItems = group.items.filter(
                item => !item.adminOnly || canManageUsers(role)
              );

              if (visibleItems.length === 0) return null;

              // Grupo com apenas 1 item: exibir como link direto (evita redundância tipo "Pacientes > Pacientes")
              if (visibleItems.length === 1) {
                const item = visibleItems[0];
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                const count = item.badgeKey ? pending[item.badgeKey] : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-100 hover:bg-primary-700/50 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center">
                      <Icon size={20} className="mr-3" />
                      {item.label}
                    </span>
                    {count > 0 && (
                      <span className="min-w-[1.25rem] rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                      hasActiveItem
                        ? 'bg-primary-700/30 text-white'
                        : 'text-primary-100 hover:bg-primary-700/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <GroupIcon size={18} className="mr-2.5" />
                      <span>{group.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className="transition-transform" />
                    ) : (
                      <ChevronRight size={16} className="transition-transform" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 pl-2 border-l-2 border-primary-700/30 space-y-1 mt-1">
                          {visibleItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href, item.exact);
                            const count = item.badgeKey ? pending[item.badgeKey] : 0;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  active
                                    ? 'bg-primary-700 text-white'
                                    : 'text-primary-100 hover:bg-primary-700/50 hover:text-white'
                                }`}
                              >
                                <span className="flex items-center">
                                  <Icon size={18} className="mr-2.5" />
                                  {item.label}
                                </span>
                                {count > 0 && (
                                  <span className="min-w-[1.25rem] rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                                    {count > 99 ? '99+' : count}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Ajuda */}
          <div className="flex-shrink-0 px-4 py-2 border-t border-primary-700">
            <Link
              href="/admin/duvidas-frequentes"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-100 rounded-lg hover:bg-primary-700/50 hover:text-white transition-colors"
              aria-label="Ajuda e dúvidas frequentes"
            >
              <HelpCircle size={18} />
              Ajuda
            </Link>
          </div>

          {/* User Section */}
          <div className="flex-shrink-0 p-4 border-t border-primary-700">
            <div className="flex items-center px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-xs text-primary-200 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-primary-100 rounded-lg hover:bg-primary-700/50 transition-colors"
            >
              <LogOut size={18} className="mr-3" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSidebarOpen(false);
                }
              }}
              role="button"
              tabIndex={-1}
              aria-label="Fechar menu"
              style={{ display: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'none' : 'block' }}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-900 to-primary-800 text-white lg:hidden"
            >
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between px-6 py-5 border-b border-primary-700 flex-shrink-0">
                  <span className="bg-white/95 rounded-md px-2 py-1 shadow-sm">
                    <LogoImage width={140} height={44} className="h-9 w-auto" />
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-primary-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <nav className="flex-1 min-h-0 px-4 py-6 space-y-2 overflow-y-auto">
                  {menuGroups.map((group) => {
                    const GroupIcon = group.icon;
                    const isExpanded = expandedGroups.has(group.id);
                    const hasActiveItem = group.items.some(item => {
                      if (item.adminOnly && !canManageUsers(role)) return false;
                      return isActive(item.href, item.exact);
                    });
                    
                    const visibleItems = group.items.filter(
                      item => !item.adminOnly || canManageUsers(role)
                    );

                    if (visibleItems.length === 0) return null;

                    // Grupo com apenas 1 item: link direto (evita "Pacientes > Pacientes")
                    if (visibleItems.length === 1) {
                      const item = visibleItems[0];
                      const Icon = item.icon;
                      const active = isActive(item.href, item.exact);
                      const count = item.badgeKey ? pending[item.badgeKey] : 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                            active
                              ? 'bg-primary-700 text-white'
                              : 'text-primary-100 hover:bg-primary-700/50 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center">
                            <Icon size={20} className="mr-3" />
                            {item.label}
                          </span>
                          {count > 0 && (
                            <span className="min-w-[1.25rem] rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                              {count > 99 ? '99+' : count}
                            </span>
                          )}
                        </Link>
                      );
                    }

                    return (
                      <div key={group.id} className="space-y-1">
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                            hasActiveItem
                              ? 'bg-primary-700/30 text-white'
                              : 'text-primary-100 hover:bg-primary-700/30 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center">
                            <GroupIcon size={18} className="mr-2.5" />
                            <span>{group.label}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown size={16} className="transition-transform" />
                          ) : (
                            <ChevronRight size={16} className="transition-transform" />
                          )}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-6 pl-2 border-l-2 border-primary-700/30 space-y-1 mt-1">
                                {visibleItems.map((item) => {
                                  const Icon = item.icon;
                                  const active = isActive(item.href, item.exact);
                                  const count = item.badgeKey ? pending[item.badgeKey] : 0;
                                  return (
                                    <Link
                                      key={item.href}
                                      href={item.href}
                                      onClick={() => setSidebarOpen(false)}
                                      className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        active
                                          ? 'bg-primary-700 text-white'
                                          : 'text-primary-100 hover:bg-primary-700/50 hover:text-white'
                                      }`}
                                    >
                                      <span className="flex items-center">
                                        <Icon size={18} className="mr-2.5" />
                                        {item.label}
                                      </span>
                                      {count > 0 && (
                                        <span className="min-w-[1.25rem] rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                                          {count > 99 ? '99+' : count}
                                        </span>
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>
                <div className="flex-shrink-0 p-4 border-t border-primary-700">
                  <Link
                    href="/admin/duvidas-frequentes"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 mb-2 w-full text-sm font-medium text-primary-100 rounded-lg hover:bg-primary-700/50 hover:text-white transition-colors"
                    aria-label="Ajuda e dúvidas frequentes"
                  >
                    <HelpCircle size={18} />
                    Ajuda
                  </Link>
                  <div className="flex items-center px-4 py-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session?.user?.name || 'Admin'}
                      </p>
                      <p className="text-xs text-primary-200 truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-primary-100 rounded-lg hover:bg-primary-700/50 transition-colors"
                  >
                    <LogOut size={18} className="mr-3" />
                    Sair
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content — wrapper para tema claro/escuro */}
      <div
        id="admin-theme-wrapper"
        data-theme={theme}
        className={`lg:pl-64 min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        {/* Top Bar */}
        <header
          className={`sticky top-0 z-30 shadow-sm border-b ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100'}`}
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <button
                type="button"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700 text-amber-300' : 'hover:bg-gray-100 text-gray-600'}`}
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                type="button"
                className={`p-2 rounded-lg relative ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label="Notificações"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {session?.user?.name || 'Admin'}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Administrador
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`py-8 ${theme === 'dark' ? 'text-gray-100' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
