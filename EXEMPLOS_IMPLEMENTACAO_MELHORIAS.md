# 💻 Exemplos Práticos de Implementação das Melhorias

Este documento contém exemplos de código práticos para implementar as melhorias sugeridas na análise completa.

---

## 1. 🎨 Design System - Paleta de Cores Expandida

### `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Adicionar suporte a dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00A859",
          dark: "#008048",
          light: "#00C96A",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#00A859",
          600: "#008048",
          700: "#006638",
          800: "#004d2a",
          900: "#00331c",
        },
        secondary: {
          DEFAULT: "#FFD700",
          dark: "#CCAA00",
          light: "#FFE44D",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#FFD700",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        semantic: {
          success: {
            DEFAULT: "#10b981",
            light: "#d1fae5",
            dark: "#059669",
          },
          warning: {
            DEFAULT: "#f59e0b",
            light: "#fef3c7",
            dark: "#d97706",
          },
          error: {
            DEFAULT: "#ef4444",
            light: "#fee2e2",
            dark: "#dc2626",
          },
          info: {
            DEFAULT: "#3b82f6",
            light: "#dbeafe",
            dark: "#2563eb",
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // Escala consistente
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 2. 📝 Tipografia - Fontes Personalizadas

### `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Click Hemp | Líder em Tratamentos com Cannabis Medicinal",
  description: "Consultas online com médicos especialistas em cannabis medicinal por apenas R$50. Suporte completo no processo de importação legal.",
  keywords: "cannabis medicinal, CBD, consulta médica online, telemedicina, tratamento com cannabis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen" id="main-content">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
```

---

## 3. 🖼️ Otimização de Imagens

### Componente de Imagem Otimizada

```tsx
// components/ui/OptimizedImage.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  fallback?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  fallback = '/images/placeholder.jpg',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <ImageOff className="text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      onError={() => {
        if (imgSrc !== fallback) {
          setImgSrc(fallback);
        } else {
          setHasError(true);
        }
      }}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  );
}
```

---

## 4. ⏳ Skeleton Loaders Melhorados

### `components/ui/Skeleton.tsx` (Melhorado)

```tsx
'use client';

import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg shadow-md p-6 animate-pulse"
    >
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </motion.div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Skeleton específico para consultas
export function SkeletonConsultation() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}
```

---

## 5. 🍞 Breadcrumbs Component

### `components/ui/Breadcrumbs.tsx`

```tsx
'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className="mb-6"
    >
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link 
            href="/" 
            className="text-gray-500 hover:text-primary transition"
            aria-label="Página inicial"
          >
            <Home size={16} />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight size={16} className="text-gray-400 mx-2" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-primary transition"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Uso:
// <Breadcrumbs items={[
//   { label: 'Admin', href: '/admin' },
//   { label: 'Consultas', href: '/admin/consultas' },
//   { label: 'Detalhes' }
// ]} />
```

---

## 6. ✅ Validação em Tempo Real Melhorada

### `components/forms/ValidatedInput.tsx`

```tsx
'use client';

import { forwardRef } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import Input from '@/components/ui/Input';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ValidatedInputProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  validateOnChange?: boolean;
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, register, error, type = 'text', placeholder, required, validateOnChange = true }, ref) => {
    return (
      <Input
        ref={ref}
        label={label}
        type={type}
        placeholder={placeholder}
        {...register}
        error={error}
        showValidationIcon
        validateOnChange={validateOnChange}
        isValid={!error}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${register.name}-error` : undefined}
      />
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

export default ValidatedInput;
```

### Exemplo de Uso em Formulário

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ValidatedInput from '@/components/forms/ValidatedInput';
import Button from '@/components/ui/Button';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  phone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .regex(/^[0-9]+$/, 'Apenas números'),
  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
});

type FormData = z.infer<typeof schema>;

export default function AppointmentForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validação em tempo real
  });

  const onSubmit = async (data: FormData) => {
    // Lógica de submit
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ValidatedInput
        label="Email"
        type="email"
        register={register('email')}
        error={errors.email?.message}
        placeholder="seu@email.com"
        required
      />

      <ValidatedInput
        label="Telefone"
        type="tel"
        register={register('phone')}
        error={errors.phone?.message}
        placeholder="(21) 99999-9999"
        required
      />

      <ValidatedInput
        label="CPF"
        type="text"
        register={register('cpf')}
        error={errors.cpf?.message}
        placeholder="00000000000"
        required
      />

      <Button type="submit" loading={isSubmitting}>
        Enviar
      </Button>
    </form>
  );
}
```

---

## 7. 📊 Gráficos no Dashboard Admin

### Instalar dependência

```bash
npm install recharts
```

### `components/admin/ConsultationsChart.tsx`

```tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ConsultationsChartProps {
  data: Array<{
    month: string;
    consultations: number;
    completed: number;
  }>;
}

export default function ConsultationsChart({ data }: ConsultationsChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Consultas por Mês</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="consultations" 
            stroke="#00A859" 
            strokeWidth={2}
            name="Total"
          />
          <Line 
            type="monotone" 
            dataKey="completed" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Concluídas"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 8. ♿ Melhorias de Acessibilidade

### Skip Link

```tsx
// Adicionar no layout.tsx ou Navbar.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
>
  Pular para conteúdo principal
</a>
```

### Botão Acessível

```tsx
<button
  onClick={handleClick}
  aria-label="Fechar modal"
  aria-describedby="modal-description"
  className="focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
>
  <X size={24} />
  <span className="sr-only">Fechar</span>
</button>
```

### Input Acessível

```tsx
<div>
  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
    Email
    <span className="text-red-500" aria-label="obrigatório">*</span>
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={errors.email ? 'true' : 'false'}
    aria-describedby={errors.email ? 'email-error' : undefined}
    className="..."
  />
  {errors.email && (
    <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">
      {errors.email.message}
    </p>
  )}
</div>
```

---

## 9. 🔄 React Query para Cache

### Instalar

```bash
npm install @tanstack/react-query
```

### `app/providers.tsx` (Atualizado)

```tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}
```

### Uso em Componente

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export default function ConsultationsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['consultations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/consultations');
      if (!res.ok) throw new Error('Erro ao carregar');
      return res.json();
    },
  });

  if (isLoading) return <SkeletonTable />;
  if (error) return <div>Erro ao carregar</div>;

  return (
    <div>
      {data.map(consultation => (
        // Renderizar consultas
      ))}
    </div>
  );
}
```

---

## 10. 📱 Menu Mobile Melhorado

### `components/layout/Navbar.tsx` (Melhorado)

```tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  // Fechar menu ao clicar fora ou em link
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">
              Click Hemp
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {/* ... menu desktop ... */}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu com Animação */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay escuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 md:hidden overflow-y-auto"
            >
              <div className="px-4 pt-4 pb-6 space-y-2">
                <Link
                  href="/"
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  onClick={() => setIsOpen(false)}
                >
                  Início
                </Link>
                {/* ... outros links ... */}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
```

---

## 11. 🎯 Progress Bar em Formulários Longos

### `components/forms/ProgressBar.tsx`

```tsx
'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Passo {currentStep} de {totalSteps}
        </span>
        <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-primary h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
```

---

## 12. 🔔 Sistema de Notificações Melhorado

### `components/ui/NotificationCenter.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Notificações</h3>
              <button onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{notification.title}</h4>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

Estes são exemplos práticos das melhorias mais importantes. Cada uma pode ser implementada incrementalmente conforme a prioridade definida no plano de ação.
