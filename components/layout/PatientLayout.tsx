'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  CreditCard,
  Package,
  LogOut,
  Menu,
  X,
  Bell,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminImpersonationBanner from '@/components/impersonation/AdminImpersonationBanner';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PatientLayoutProps {
  children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId, isImpersonating } = useEffectivePatientId();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Redirecionar admin sem impersonação
  useEffect(() => {
    if (status === 'loading' || loadingPatientId) return;
    
    if (session?.user.role === 'ADMIN' && !isImpersonating) {
      router.push('/admin/pacientes');
    }
  }, [session, status, isImpersonating, loadingPatientId, router]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Início', href: '/paciente', exact: true },
    { icon: Calendar, label: 'Minhas Consultas', href: '/paciente/consultas' },
    { icon: FileText, label: 'Receitas', href: '/paciente/receitas' },
    { icon: CreditCard, label: 'Pagamentos', href: '/paciente/pagamentos' },
    { icon: Package, label: 'Documentos', href: '/paciente/documentos' },
    { icon: User, label: 'Meu Perfil', href: '/paciente/perfil' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Admin Impersonation Banner */}
      <AdminImpersonationBanner />
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/paciente" className="flex items-center">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/cannalize-logo.png"
                  alt="CannabiLize"
                  width={132}
                  height={42}
                  className="h-9 w-auto"
                  priority
                />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Área do Paciente
                </span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <Icon size={18} className="mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-purple-50 relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {session?.user?.name?.split(' ')[0] || 'Paciente'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {session?.user?.name || 'Paciente'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut({ callbackUrl: '/login' });
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-purple-50"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-purple-100 bg-white"
            >
              <nav className="px-4 py-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        active
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <Icon size={18} className="mr-3" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
