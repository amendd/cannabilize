'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import LogoImage from '@/components/ui/LogoImage';
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
  User,
  IdCard,
  History,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminImpersonationBanner from '@/components/impersonation/AdminImpersonationBanner';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import { useLogoUrl } from '@/lib/public-config-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { formatDisplayName } from '@/lib/format-display-name';

interface PatientLayoutProps {
  children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId, isImpersonating } = useEffectivePatientId();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [treatmentDropdownOpen, setTreatmentDropdownOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Redirecionar admin sem impersonação
  useEffect(() => {
    if (status === 'loading' || loadingPatientId) return;
    
    if (session?.user.role === 'ADMIN' && !isImpersonating) {
      router.push('/admin/pacientes');
    }
  }, [session, status, isImpersonating, loadingPatientId, router]);

  // Paciente: bloquear uso da área até aceitar consentimento LGPD
  useEffect(() => {
    if (status !== 'authenticated' || session?.user.role !== 'PATIENT' || consentChecked) return;
    if (pathname === '/paciente/consentimento') {
      setConsentChecked(true);
      return;
    }
    fetch('/api/paciente/consentimento/status', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setConsentChecked(true);
        if (data.hasConsent !== true) {
          router.replace('/paciente/consentimento');
        }
      })
      .catch(() => setConsentChecked(true));
  }, [status, session?.user?.role, pathname, router, consentChecked]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-dropdown]')) setUserDropdownOpen(false);
      if (!target.closest('[data-treatment-dropdown]')) setTreatmentDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fechar dropdown quando menu mobile abrir (evitar conflito)
  useEffect(() => {
    if (mobileNavOpen) {
      setUserDropdownOpen(false);
    }
  }, [mobileNavOpen]);

  const treatmentItems = [
    { icon: Calendar, label: 'Consultas', href: '/paciente/consultas' },
    { icon: FileText, label: 'Receitas', href: '/paciente/receitas' },
    { icon: Package, label: 'Documentos do Tratamento', href: '/paciente/documentos' },
    { icon: CreditCard, label: 'Pagamentos', href: '/paciente/pagamentos' },
    { icon: History, label: 'Histórico', href: '/paciente/historico' },
  ];

  const isTreatmentActive = treatmentItems.some((item) => pathname?.startsWith(item.href));

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Modo admin: aviso discreto no topo direito */}
      <AdminImpersonationBanner />

      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/paciente" className="flex items-center">
              <div className="flex items-center gap-3">
                <LogoImage
                  width={132}
                  height={42}
                  className="h-9 w-auto"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Centro de Tratamento
                </span>
              </div>
            </Link>

            {/* Desktop Menu — Meu Tratamento + Identidade + Perfil */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/paciente"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === '/paciente'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <LayoutDashboard size={18} className="mr-2" />
                Início
              </Link>

              <div className="relative" data-treatment-dropdown>
                <button
                  type="button"
                  onClick={() => setTreatmentDropdownOpen(!treatmentDropdownOpen)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isTreatmentActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  Meu Tratamento
                  <ChevronDown size={16} className={`ml-1 transition-transform ${treatmentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {treatmentDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50"
                    >
                      {treatmentItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setTreatmentDropdownOpen(false)}
                            className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                              active ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Icon size={18} className="mr-3 text-gray-500" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/paciente/carteirinha"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname?.startsWith('/paciente/carteirinha')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <IdCard size={18} className="mr-2" />
                Carteirinha
              </Link>

              <Link
                href="/paciente/perfil"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname?.startsWith('/paciente/perfil')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <User size={18} className="mr-2" />
                Meu Perfil
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <NotificationsDropdown />
              
              {/* User Menu */}
              <div className="relative" data-user-dropdown>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {formatDisplayName(session?.user?.name).charAt(0) || 'P'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {formatDisplayName(session?.user?.name).split(' ')[0] || 'Paciente'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDisplayName(session?.user?.name) || 'Paciente'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
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
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-purple-50"
              >
                {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-purple-100 bg-white"
            >
              <nav className="px-4 py-2 space-y-1">
                <Link
                  href="/paciente"
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    pathname === '/paciente' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  <LayoutDashboard size={18} className="mr-3" />
                  Início
                </Link>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Meu Tratamento
                </p>
                {treatmentItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                        active ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-purple-50'
                      }`}
                    >
                      <Icon size={18} className="mr-3" />
                      {item.label}
                    </Link>
                  );
                })}
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Identidade do Paciente
                </p>
                <Link
                  href="/paciente/carteirinha"
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    pathname?.startsWith('/paciente/carteirinha') ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  <IdCard size={18} className="mr-3" />
                  Carteirinha digital
                </Link>
                <Link
                  href="/paciente/perfil"
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    pathname?.startsWith('/paciente/perfil') ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  <User size={18} className="mr-3" />
                  Meu Perfil
                </Link>
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
