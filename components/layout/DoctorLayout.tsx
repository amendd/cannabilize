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
  User,
  LogOut,
  Menu,
  X,
  Clock,
  Bell,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminDoctorImpersonationBanner from '@/components/impersonation/AdminDoctorImpersonationBanner';

interface DoctorLayoutProps {
  children: React.ReactNode;
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/medico', exact: true },
    { icon: Calendar, label: 'Minhas Consultas', href: '/medico/consultas' },
    { icon: FileText, label: 'Receitas', href: '/medico/receitas' },
    { icon: User, label: 'Pacientes', href: '/medico/pacientes' },
    { icon: DollarSign, label: 'Financeiro', href: '/medico/financeiro' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* Admin Impersonation Banner */}
      <AdminDoctorImpersonationBanner />
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-green-700 to-green-600 text-white shadow-lg">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-green-600">
            <Link href="/medico" className="flex items-center gap-3">
              <span className="bg-white/95 rounded-md px-2 py-1 shadow-sm">
                <Image
                  src="/images/cannalize-logo.png"
                  alt="CannabiLize"
                  width={132}
                  height={42}
                  className="h-8 w-auto"
                  priority
                />
              </span>
              <span className="text-sm font-semibold leading-tight">
                Área Médica
              </span>
            </Link>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-green-600 text-white'
                      : 'text-green-100 hover:bg-green-600/50 hover:text-white'
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex-shrink-0 p-3 border-t border-green-600">
            <div className="flex items-center px-3 py-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || 'Médico'}
                </p>
                <p className="text-xs text-green-200 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-green-100 rounded-lg hover:bg-green-600/50 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-56 bg-gradient-to-b from-green-700 to-green-600 text-white lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-5 border-b border-green-600">
                  <div className="flex items-center gap-3">
                    <span className="bg-white/95 rounded-md px-2 py-1 shadow-sm">
                      <Image
                        src="/images/cannalize-logo.png"
                        alt="CannabiLize"
                        width={132}
                        height={42}
                        className="h-8 w-auto"
                        priority
                      />
                    </span>
                    <span className="text-sm font-semibold leading-tight">
                      Área Médica
                    </span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-green-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          active
                            ? 'bg-green-600 text-white'
                            : 'text-green-100 hover:bg-green-600/50 hover:text-white'
                        }`}
                      >
                        <Icon size={18} className="mr-3" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="flex-shrink-0 p-3 border-t border-green-600">
                  <div className="flex items-center px-3 py-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session?.user?.name || 'Médico'}
                      </p>
                      <p className="text-xs text-green-200 truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-green-100 rounded-lg hover:bg-green-600/50 transition-colors"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:pl-56">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-green-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-green-50"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={18} />
                <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <button className="p-2 rounded-lg hover:bg-green-50 relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'Médico'}
                  </p>
                  <p className="text-xs text-green-600">Médico</p>
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
