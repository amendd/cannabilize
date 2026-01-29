'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
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
  IdCard,
  UserCircle,
  Mail,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', exact: true },
    { icon: Calendar, label: 'Consultas', href: '/admin/consultas' },
    { icon: FileText, label: 'Receitas', href: '/admin/receitas' },
    { icon: TestTube, label: 'Teste de Receita', href: '/admin/teste-receita' },
    { icon: UserCircle, label: 'Pacientes', href: '/admin/pacientes' },
    { icon: Users, label: 'Médicos', href: '/admin/medicos' },
    { icon: UserCog, label: 'Usuários', href: '/admin/usuarios', adminOnly: true },
    { icon: Pill, label: 'Medicamentos', href: '/admin/medicamentos' },
    { icon: Shield, label: 'ANVISA', href: '/admin/anvisa' },
    { icon: CreditCard, label: 'Pagamentos', href: '/admin/pagamentos' },
    { icon: IdCard, label: 'Carteirinhas', href: '/admin/carteirinhas' },
    { icon: BookOpen, label: 'Blog', href: '/admin/blog' },
    { icon: ImageIcon, label: 'Galeria', href: '/admin/galeria' },
    { icon: Star, label: 'Artigos Destaque', href: '/admin/artigos-destaque' },
    { icon: Video, label: 'Telemedicina', href: '/admin/telemedicina' },
    { icon: Mail, label: 'Email', href: '/admin/email' },
    { icon: Shield, label: 'Segurança', href: '/admin/seguranca' },
    { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
  ];

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
        <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-lg">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-5 border-b border-blue-700">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="bg-white/95 rounded-md px-2 py-1 shadow-sm">
                <Image
                  src="/images/cannalize-logo.png"
                  alt="CannabiLize"
                  width={140}
                  height={44}
                  className="h-9 w-auto"
                  priority
                />
              </span>
            </Link>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems
              .filter((item) => !(item as { adminOnly?: boolean }).adminOnly || session?.user?.role === 'ADMIN')
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          {/* User Section */}
          <div className="flex-shrink-0 p-4 border-t border-blue-700">
            <div className="flex items-center px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-xs text-blue-200 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-blue-100 rounded-lg hover:bg-blue-700/50 transition-colors"
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
              className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-5 border-b border-blue-700">
                  <span className="bg-white/95 rounded-md px-2 py-1 shadow-sm">
                    <Image
                      src="/images/cannalize-logo.png"
                      alt="CannabiLize"
                      width={140}
                      height={44}
                      className="h-9 w-auto"
                      priority
                    />
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-blue-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                  {menuItems
                    .filter((item) => !(item as { adminOnly?: boolean }).adminOnly || session?.user?.role === 'ADMIN')
                    .map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href, item.exact);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                            active
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                          }`}
                        >
                          <Icon size={20} className="mr-3" />
                          {item.label}
                        </Link>
                      );
                    })}
                </nav>
                <div className="flex-shrink-0 p-4 border-t border-blue-700">
                  <div className="flex items-center px-4 py-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session?.user?.name || 'Admin'}
                      </p>
                      <p className="text-xs text-blue-200 truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-blue-100 rounded-lg hover:bg-blue-700/50 transition-colors"
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

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
