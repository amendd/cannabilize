'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';
import LogoImage from '@/components/ui/LogoImage';
import {
  Shield,
  User,
  Stethoscope,
  Building2,
  FileText,
  Wallet,
  ExternalLink,
  Leaf,
} from 'lucide-react';

const ALLOWED_CALLBACK_PREFIXES = ['/admin', '/medico', '/paciente', '/engenheiro', '/erp-canna', '/gpp-canna', '/ifp-canna'];

/** callbackUrl seguro: aceita apenas caminhos internos permitidos (admin, medico, paciente, erp, gpp, ifp). */
function getSafeCallback(callbackUrl: string | null): string | null {
  if (!callbackUrl || typeof callbackUrl !== 'string') return null;
  const decoded = decodeURIComponent(callbackUrl).trim();
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  const allowed = ALLOWED_CALLBACK_PREFIXES.some((p) => decoded === p || decoded.startsWith(p + '/'));
  return allowed ? decoded : null;
}

type LoginOption = {
  label: string;
  path: string;
  icon: typeof User;
  description: string;
  color: string;
};

const AMBIENTES_ASSISTENCIAIS: LoginOption[] = [
  { label: 'Paciente', path: '/paciente', icon: User, description: 'Acompanhamento e consultas do paciente', color: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500' },
  { label: 'Médico', path: '/medico', icon: Stethoscope, description: 'Gestão clínica e prescrições', color: 'bg-teal-600 hover:bg-teal-700 border-teal-500' },
  { label: 'Engenheiro Agrônomo', path: '/engenheiro', icon: Leaf, description: 'Análises técnicas e emissão de laudos', color: 'bg-green-700 hover:bg-green-800 border-green-600' },
];

const AMBIENTES_OPERACIONAIS: LoginOption[] = [
  { label: 'Admin', path: '/admin', icon: Shield, description: 'Gestão administrativa da plataforma', color: 'bg-slate-600 hover:bg-slate-700 border-slate-500' },
  { label: 'ERP CANNA', path: '/erp-canna', icon: Building2, description: 'Operações e pedidos', color: 'bg-amber-600 hover:bg-amber-700 border-amber-500' },
  { label: 'GPP CANNA', path: '/gpp-canna', icon: FileText, description: 'Pacientes e prescrições médicas', color: 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500' },
  { label: 'IFP CANNA', path: '/ifp-canna', icon: Wallet, description: 'Financeiro e pagamentos', color: 'bg-violet-600 hover:bg-violet-700 border-violet-500' },
];

/** Lista única para lookup no formulário de login (callbackUrl). */
const LOGIN_OPTIONS: LoginOption[] = [...AMBIENTES_ASSISTENCIAIS, ...AMBIENTES_OPERACIONAIS];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get('callbackUrl');
  const safeCallback = getSafeCallback(callbackUrlParam);
  const showHub = !safeCallback;

  const [isLoading, setIsLoading] = useState(false);
  const [showDevHint, setShowDevHint] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      setShowDevHint(true);
    }
  }, []);

  // Remove credenciais da URL (segurança: não exibir email/senha na barra de endereço)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasCreds = searchParams.has('email') || searchParams.has('password');
    if (!hasCreds) return;
    const next = new URL(window.location.href);
    next.searchParams.delete('email');
    next.searchParams.delete('password');
    if (next.searchParams.toString()) {
      window.history.replaceState(null, '', next.pathname + '?' + next.searchParams.toString());
    } else {
      window.history.replaceState(null, '', next.pathname);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    void doLogin();
  };

  const doLogin = async () => {

    try {
      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email ou senha inválidos. Verifique suas credenciais ou se a conta está ativa.');
        setIsLoading(false);
      } else {
        toast.success('Login realizado com sucesso!');

        const redirectToDashboard = (path: string) => {
          setIsLoading(false);
          // Redirecionamento completo para garantir que o dashboard carregue com a sessão
          window.location.href = path;
        };

        const resolveRole = async (): Promise<string | null> => {
          // Tentar getSession (cliente NextAuth) e depois fetch sem cache
          const session = await getSession();
          if (session?.user?.role) return session.user.role as string;
          const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' });
          const data = await response.json().catch(() => ({}));
          return data?.user?.role ?? null;
        };

        (async () => {
          try {
            let role: string | null = null;
            for (let i = 0; i < 5; i++) {
              role = await resolveRole();
              if (role) break;
              await new Promise((r) => setTimeout(r, 150 * (i + 1)));
            }

            const adminPaths = ['/admin', '/erp-canna', '/gpp-canna', '/ifp-canna'];
            const canUseCallback =
              safeCallback &&
              role &&
              ((role === 'ADMIN' && adminPaths.some((p) => safeCallback === p || safeCallback.startsWith(p + '/'))) ||
                (role === 'DOCTOR' && (safeCallback === '/medico' || safeCallback.startsWith('/medico/'))) ||
                (role === 'PATIENT' && (safeCallback === '/paciente' || safeCallback.startsWith('/paciente/'))) ||
                (role === 'AGRONOMIST' && (safeCallback === '/engenheiro' || safeCallback.startsWith('/engenheiro/'))));

            if (canUseCallback) {
              redirectToDashboard(safeCallback);
              return;
            }
            if (role === 'ADMIN') {
              redirectToDashboard('/admin');
              return;
            }
            if (role === 'DOCTOR') {
              redirectToDashboard('/medico');
              return;
            }
            if (role === 'PATIENT') {
              redirectToDashboard('/paciente');
              return;
            }
            if (role === 'AGRONOMIST') {
              redirectToDashboard('/engenheiro');
              return;
            }
            redirectToDashboard('/');
          } catch {
            redirectToDashboard('/');
          }
        })();
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
      setIsLoading(false);
    }
  };

  // Hub: Portal Cannabilize — central com todas as opções de login (abre em nova aba)
  if (showHub) {
    const Card = ({ option }: { option: LoginOption }) => {
      const Icon = option.icon;
      return (
        <a
          href={`/login?callbackUrl=${encodeURIComponent(option.path)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-4 rounded-xl border p-4 text-white transition ${option.color} shadow-sm`}
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold block">{option.label}</span>
            <span className="text-sm text-white/90 block truncate">{option.description}</span>
          </div>
          <ExternalLink className="w-5 h-5 flex-shrink-0 opacity-80" />
        </a>
      );
    };

    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <Link href="/" className="flex justify-center">
            <LogoImage width={180} height={56} className="h-14 w-auto" />
          </Link>
          <p className="mt-3 text-center text-sm text-gray-600 max-w-md mx-auto">
            Portal oficial de acesso aos sistemas clínicos e operacionais da Plataforma Cannabilize.
          </p>
          <h1 className="mt-6 text-center text-2xl sm:text-3xl font-bold text-gray-900">
            Portal Cannabilize
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Acesse os ambientes clínicos, assistenciais e operacionais da Plataforma Cannabilize conforme seu perfil.
          </p>
          <p className="mt-4 text-center text-sm text-gray-600">
            Acesse os módulos da Plataforma Cannabilize de acordo com seu perfil de atuação. O login será aberto em uma nova aba.
          </p>

          {/* Ambientes Assistenciais */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">Ambientes Assistenciais</h2>
            <p className="mt-1 text-sm text-gray-600">
              Áreas destinadas ao atendimento, acompanhamento clínico e emissão de laudos.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AMBIENTES_ASSISTENCIAIS.map((option) => (
                <Card key={option.path} option={option} />
              ))}
            </div>
          </section>

          {/* Ambientes Operacionais */}
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900">Ambientes Operacionais</h2>
            <p className="mt-1 text-sm text-gray-600">
              Áreas administrativas, financeiras e de gestão da Plataforma Cannabilize.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AMBIENTES_OPERACIONAIS.map((option) => (
                <Card key={option.path} option={option} />
              ))}
            </div>
          </section>

          {/* Links auxiliares — área secundária inferior */}
          <nav className="mt-12 pt-8 border-t border-gray-200 text-center" aria-label="Links auxiliares">
            <p className="text-sm text-gray-500">
              <Link href="/" className="text-primary font-medium hover:underline">
                Voltar ao início
              </Link>
              {' · '}
              <AgendarTrigger className="text-primary font-medium hover:underline cursor-pointer bg-transparent border-0 p-0 inline">
                Agendar consulta
              </AgendarTrigger>
            </p>
          </nav>
        </div>
      </div>
    );
  }

  // Formulário de login (quando aberto com callbackUrl em nova aba)
  const currentOption = LOGIN_OPTIONS.find((o) => o.path === safeCallback || safeCallback?.startsWith(o.path + '/'));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <LogoImage width={180} height={56} className="h-14 w-auto" />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entrar — {currentOption?.label ?? 'Sistema'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use seu email e senha para acessar {currentOption?.label ?? 'a área selecionada'}.
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            Paciente? Use o mesmo email cadastrado na sua consulta.
          </p>
        </div>
        <form
            className="mt-8 space-y-6"
            method="post"
            action="#"
            onSubmit={handleSubmit}
          >
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          <div className="text-center">
            <Link
              href="/recuperar-senha"
              className="text-sm text-primary font-medium hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          {showDevHint && (
            <p className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <strong>Dica (ambiente local):</strong> Se acabou de subir o projeto, rode <code className="bg-amber-100 px-1 rounded">npx prisma db seed</code>. Admin padrão do seed: <code className="bg-amber-100 px-1 rounded">admin@cannabilize.com.br</code> / <code className="bg-amber-100 px-1 rounded">admin123</code>
            </p>
          )}
          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="text-primary font-medium hover:underline">
              Ver todas as opções de login
            </Link>
            {' · '}
            <Link href="/" className="text-primary font-medium hover:underline">
              Voltar ao início
            </Link>
            {' '}
            <AgendarTrigger className="text-primary font-medium hover:underline cursor-pointer bg-transparent border-0 p-0">
              agendar consulta
            </AgendarTrigger>
          </p>
        </form>
      </div>
    </div>
  );
}
