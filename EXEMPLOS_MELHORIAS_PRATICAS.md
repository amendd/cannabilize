# 🛠️ Exemplos Práticos de Melhorias - Cannabilize

Este documento contém exemplos de código para implementar as melhorias mais críticas identificadas na análise.

---

## 1. 🎨 MELHORIAS DE DESIGN

### 1.1 Sistema de Cores Expandido

**Arquivo:** `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00A859', // DEFAULT
          600: '#008048', // dark
          700: '#006638',
          800: '#004d28',
          900: '#003318',
        },
        secondary: {
          DEFAULT: "#FFD700",
          dark: "#CCAA00",
          light: "#FFE44D",
        },
        // Cores semânticas
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
          dark: '#2563eb',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Habilita dark mode
};
export default config;
```

### 1.2 Componente de Loading Melhorado

**Arquivo:** `components/ui/Skeleton.tsx` (NOVO)

```typescript
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-label="Carregando..."
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-24" />
        </div>
      ))}
    </div>
  );
}
```

### 1.3 Hero Section Melhorado

**Arquivo:** `components/home/HeroSection.tsx` (MELHORADO)

```typescript
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 py-16 lg:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            className="text-center lg:text-left space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              🌿 Cannabis Medicinal com Especialistas
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Médicos prescritores de{' '}
              <span className="text-green-600 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Cannabis Medicinal
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Consultas online com especialistas por apenas{' '}
              <span className="font-bold text-green-600 text-3xl">R$50</span>
            </p>

            {/* Trust indicators melhorados */}
            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="text-sm text-gray-600 font-medium">+90.000 pacientes atendidos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="text-sm text-gray-600 font-medium">Consultas 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="text-sm text-gray-600 font-medium">100% Online</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                href="/agendamento"
                className="group bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
              >
                Iniciar jornada
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#click-process"
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Entenda como funciona
              </Link>
            </div>
          </motion.div>

          {/* Image Section - com imagem real */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              {/* Usar next/image com imagem real */}
              <Image
                src="/hero-image.jpg" // Adicionar imagem real
                alt="Médico especialista em cannabis medicinal"
                fill
                className="object-cover"
                priority
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,..." // Adicionar blur placeholder
              />
              
              {/* Overlay com gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                      +90.000
                    </div>
                    <div className="text-2xl md:text-3xl font-semibold mb-2">Atendimentos</div>
                    <div className="text-lg opacity-90">Realizados com sucesso</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

---

## 2. 📝 MELHORIAS EM FORMULÁRIOS

### 2.1 Input com Validação Visual

**Arquivo:** `components/ui/Input.tsx` (MELHORADO)

```typescript
'use client';

import { forwardRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, helperText, icon, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              "w-full px-4 py-3 rounded-lg border transition-all duration-200",
              icon && "pl-10",
              error
                ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                : success
                ? "border-green-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                : "border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary",
              focused && !error && !success && "border-primary",
              className
            )}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          
          {/* Status icons */}
          {error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <XCircle className="text-red-500" size={20} />
            </div>
          )}
          {success && !error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircle2 className="text-green-500" size={20} />
            </div>
          )}
        </div>
        
        {/* Helper text / Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

### 2.2 Formulário com Progress Indicator

**Arquivo:** `components/consultation/AppointmentForm.tsx` (MELHORADO - adicionar no topo)

```typescript
// Adicionar no início do componente
const steps = [
  { id: 1, name: 'Dados Pessoais', completed: false },
  { id: 2, name: 'Informações Médicas', completed: false },
  { id: 3, name: 'Agendamento', completed: false },
  { id: 4, name: 'Confirmação', completed: false },
];

const [currentStep, setCurrentStep] = useState(1);

// Adicionar antes do formulário
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    {steps.map((step, index) => (
      <div key={step.id} className="flex items-center flex-1">
        <div className="flex flex-col items-center flex-1">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
              currentStep > step.id
                ? "bg-green-500 text-white"
                : currentStep === step.id
                ? "bg-primary text-white ring-4 ring-primary/20"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {currentStep > step.id ? (
              <CheckCircle2 size={20} />
            ) : (
              step.id
            )}
          </div>
          <span className={cn(
            "mt-2 text-xs font-medium text-center",
            currentStep >= step.id ? "text-gray-900" : "text-gray-400"
          )}>
            {step.name}
          </span>
        </div>
        {index < steps.length - 1 && (
          <div className={cn(
            "flex-1 h-1 mx-2 transition-all",
            currentStep > step.id ? "bg-green-500" : "bg-gray-200"
          )} />
        )}
      </div>
    ))}
  </div>
  
  {/* Progress bar */}
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-primary h-2 rounded-full transition-all duration-300"
      style={{ width: `${(currentStep / steps.length) * 100}%` }}
    />
  </div>
</div>
```

---

## 3. 🔔 MELHORIAS DE FEEDBACK

### 3.1 Toast Melhorado

**Arquivo:** `app/layout.tsx` (MELHORADO)

```typescript
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#fff',
      color: '#333',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      padding: '16px',
      fontSize: '14px',
    },
    success: {
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
      style: {
        borderLeft: '4px solid #10b981',
      },
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
      style: {
        borderLeft: '4px solid #ef4444',
      },
    },
  }}
/>
```

### 3.2 Modal de Confirmação

**Arquivo:** `components/ui/ConfirmModal.tsx` (NOVO)

```typescript
'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'info',
}: ConfirmModalProps) {
  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-primary hover:bg-primary-dark',
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    variant === 'danger' ? 'bg-red-100' :
                    variant === 'warning' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <AlertTriangle className={
                      variant === 'danger' ? 'text-red-600' :
                      variant === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    } size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                      {title}
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-600">
                      {message}
                    </Dialog.Description>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${variantStyles[variant]}`}
                  >
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

---

## 4. 🚀 MELHORIAS DE PERFORMANCE

### 4.1 Otimização de Imagens

**Arquivo:** `next.config.js` (MELHORADO)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['images.unsplash.com', 'res.cloudinary.com'], // Adicionar domínios permitidos
    minimumCacheTTL: 60,
  },
  // Outras configurações...
};

module.exports = nextConfig;
```

### 4.2 Lazy Loading de Componentes

**Exemplo:** Carregar componentes pesados apenas quando necessário

```typescript
import dynamic from 'next/dynamic';

// Carregar componente pesado apenas quando necessário
const HeavyChart = dynamic(() => import('@/components/admin/HeavyChart'), {
  loading: () => <SkeletonCard />,
  ssr: false, // Se não precisa de SSR
});

// Usar em páginas administrativas
export default function AdminDashboard() {
  return (
    <div>
      {/* Conteúdo leve */}
      <HeavyChart /> {/* Carrega apenas quando necessário */}
    </div>
  );
}
```

---

## 5. ♿ MELHORIAS DE ACESSIBILIDADE

### 5.1 Skip Links

**Arquivo:** `components/layout/SkipLinks.tsx` (NOVO)

```typescript
export default function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50">
      <a
        href="#main-content"
        className="block px-4 py-2 bg-primary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Pular para conteúdo principal
      </a>
      <a
        href="#navigation"
        className="block px-4 py-2 bg-primary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-2"
      >
        Pular para navegação
      </a>
    </div>
  );
}
```

### 5.2 Navbar Melhorado com Acessibilidade

**Arquivo:** `components/layout/Navbar.tsx` (MELHORADO)

```typescript
<nav className="bg-white shadow-md sticky top-0 z-50" role="navigation" aria-label="Navegação principal">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      {/* Logo */}
      <Link 
        href="/" 
        className="flex items-center"
        aria-label="Cannabilize - Página inicial"
      >
        <span className="text-2xl font-bold text-primary">
          Cannabilize
        </span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-8" role="menubar">
        <Link 
          href="/" 
          className="text-gray-700 hover:text-primary transition"
          role="menuitem"
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          Início
        </Link>
        {/* ... outros links */}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  </div>

  {/* Mobile Menu */}
  {isOpen && (
    <div 
      id="mobile-menu"
      className="md:hidden bg-white border-t"
      role="menu"
      aria-label="Menu mobile"
    >
      {/* ... conteúdo do menu */}
    </div>
  )}
</nav>
```

---

## 6. 📧 INTEGRAÇÃO DE NOTIFICAÇÕES

### 6.1 Integração com Resend (Email)

**Arquivo:** `lib/email.ts` (MELHORADO)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Cannabilize <noreply@cannabilize.com>',
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

export async function notifyAdminByEmail(data: ConsultationNotificationData) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #00A859; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { display: inline-block; background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nova Consulta Agendada</h1>
          </div>
          <div class="content">
            <p><strong>Paciente:</strong> ${data.patientName}</p>
            <p><strong>Email:</strong> ${data.patientEmail}</p>
            <p><strong>Telefone:</strong> ${data.patientPhone}</p>
            <p><strong>Data:</strong> ${data.scheduledDate}</p>
            <p><strong>Horário:</strong> ${data.scheduledTime}</p>
            <p><strong>Médico Designado:</strong> ${data.doctorName}</p>
            <a href="${process.env.NEXTAUTH_URL}/admin/consultas" class="button">
              Ver Consulta
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  if (data.adminEmail) {
    return await sendEmail({
      to: data.adminEmail,
      subject: 'Nova Consulta Agendada - Cannabilize',
      html,
    });
  }
}
```

### 6.2 Integração com Twilio (WhatsApp/SMS)

**Arquivo:** `lib/whatsapp.ts` (MELHORADO)

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsApp({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  try {
    // Formatar número (adicionar código do país se necessário)
    const formattedNumber = to.startsWith('+') ? to : `+55${to.replace(/\D/g, '')}`;

    const messageData = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`,
    });

    console.log('WhatsApp enviado:', messageData.sid);
    return { success: true, sid: messageData.sid };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    throw error;
  }
}

export async function notifyAdminByWhatsApp(data: ConsultationNotificationData) {
  if (!data.adminPhone) return { success: false, error: 'Telefone não fornecido' };

  const message = `🔔 *Nova Consulta Agendada - Cannabilize*

👤 *Paciente:* ${data.patientName}
📧 *Email:* ${data.patientEmail}
📱 *Telefone:* ${data.patientPhone}
📅 *Data:* ${data.scheduledDate}
⏰ *Horário:* ${data.scheduledTime}
👨‍⚕️ *Médico:* ${data.doctorName}

Acesse o painel administrativo para mais detalhes.`;

  return await sendWhatsApp({
    to: data.adminPhone,
    message,
  });
}
```

---

## 7. 📊 DASHBOARD COM GRÁFICOS

### 7.1 Instalação de Dependências

```bash
npm install recharts
```

### 7.2 Componente de Gráfico

**Arquivo:** `components/admin/ConsultationsChart.tsx` (NOVO)

```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ConsultationsChartProps {
  data: Array<{
    date: string;
    consultations: number;
    completed: number;
  }>;
}

export default function ConsultationsChart({ data }: ConsultationsChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Consultas por Período
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
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

## 📝 NOTAS FINAIS

Estes são exemplos práticos das melhorias mais críticas. Implemente gradualmente, testando cada mudança antes de prosseguir.

**Ordem Recomendada:**
1. Melhorias de feedback visual (loading, toasts)
2. Validação em formulários
3. Otimização de imagens
4. Integração de notificações
5. Melhorias de design (cores, tipografia)
6. Acessibilidade
7. Performance avançada

---

*Documento atualizado em: 27 de Janeiro de 2026*
