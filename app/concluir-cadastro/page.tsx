'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function ConcluirCadastroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (!token) {
      toast.error('Token não fornecido');
      router.push('/login');
      return;
    }

    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/auth/setup-password?token=${token}`);

      if (response.ok) {
        setValid(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Token inválido ou expirado');
        setValid(false);
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      toast.error('Erro ao validar token');
      setValid(false);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        toast.success('Senha definida com sucesso! Redirecionando...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao definir senha');
      }
    } catch (error) {
      console.error('Erro ao definir senha:', error);
      toast.error('Erro ao definir senha');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando token...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-8 text-center"
          >
            <XCircle className="text-red-500 mx-auto mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Token Inválido
            </h1>
            <p className="text-gray-600 mb-6">
              Este link de conclusão de cadastro é inválido ou já expirou.
            </p>
            <Button onClick={() => router.push('/login')}>Ir para Login</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Breadcrumbs items={[{ label: 'Concluir Cadastro' }]} />
          <div className="bg-white rounded-lg shadow-md p-8 mt-8">
            <div className="text-center mb-6">
              <div className="bg-primary/10 rounded-full p-3 inline-block mb-4">
                <Lock className="text-primary" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Concluir seu Cadastro
              </h1>
              <p className="text-gray-600">
                Defina uma senha para acessar sua conta no Click Cannabis
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }
                    }}
                    placeholder="Mínimo 6 caracteres"
                    error={errors.password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors(prev => ({
                          ...prev,
                          confirmPassword: undefined,
                        }));
                      }
                    }}
                    placeholder="Digite a senha novamente"
                    error={errors.confirmPassword}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={saving}
                className="w-full"
                disabled={!password || !confirmPassword}
              >
                Definir Senha
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma senha?{' '}
                <a
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Fazer login
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
