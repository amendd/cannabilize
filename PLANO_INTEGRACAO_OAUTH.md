# Plano de Integração: Login com Facebook e Google (OAuth)

## 📋 Visão Geral

Este documento descreve a estratégia completa para implementar autenticação OAuth (Facebook e Google) no sistema, mantendo a compatibilidade com o sistema atual de autenticação por credenciais (email/senha).

---

## 🎯 Objetivos

1. **Permitir login via Facebook e Google** sem perder a funcionalidade atual
2. **Unificar contas** quando o mesmo email for usado em diferentes métodos de login
3. **Manter segurança** e conformidade com LGPD/GDPR
4. **Experiência fluida** para o usuário, com opções claras de login

---

## 🏗️ Arquitetura da Solução

### 1. Estrutura de Dados (Prisma Schema)

#### Mudanças Necessárias no Modelo `User`:

```prisma
model User {
  // ... campos existentes ...
  
  // NOVOS CAMPOS PARA OAUTH
  accounts        Account[]        // Relação com contas OAuth
  password        String?          // Já existe - pode ser null para usuários OAuth
  
  // Campos opcionais que podem vir do OAuth
  emailVerified   DateTime?        // Já existe - será preenchido automaticamente no OAuth
  image           String?          // Já existe - pode vir do provider OAuth
}

// NOVO MODELO: Contas OAuth vinculadas ao usuário
model Account {
  id                String   @id @default(uuid())
  userId            String   @map("user_id")
  type              String   // "oauth" | "credentials"
  provider          String   // "google" | "facebook" | "credentials"
  providerAccountId String   @map("provider_account_id") // ID único no provider
  refreshToken      String?  @map("refresh_token")
  accessToken       String?  @map("access_token")
  expiresAt         Int?     @map("expires_at") // Timestamp Unix
  tokenType         String?  @map("token_type")
  scope             String?
  idToken           String?  @map("id_token")
  sessionState      String?  @map("session_state")
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

// NOVO MODELO: Sessões OAuth (opcional, se quiser rastrear sessões)
model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("sessions")
}

// NOVO MODELO: Tokens de verificação (para verificação de email, etc.)
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

**Observações:**
- O campo `password` já existe e é opcional (`String?`), perfeito para usuários OAuth
- O modelo `Account` segue o padrão do NextAuth para OAuth
- Um usuário pode ter múltiplas contas (ex: Google + Facebook) vinculadas ao mesmo email

---

## 🔧 Configuração Técnica

### 2. Variáveis de Ambiente (.env)

```env
# NextAuth (já existe)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-secret-aqui

# Google OAuth
GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-google-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=seu-facebook-app-id
FACEBOOK_CLIENT_SECRET=seu-facebook-app-secret
```

### 3. Instalação de Dependências

```bash
npm install next-auth@^4.24.7  # Já instalado
# NextAuth já suporta Google e Facebook providers nativamente
```

---

## 💻 Modificações no Código

### 4. Atualização do `lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    // Provider existente (credenciais)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // ... código existente ...
      },
    }),
    
    // NOVO: Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    // NOVO: Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // Permitir login sempre (NextAuth gerencia a criação de usuário)
      return true;
    },
    
    async jwt({ token, user, account, trigger }) {
      // Se é o primeiro login (user existe)
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.passwordChangedAt = (user as any).passwordChangedAt || 0;
      }
      
      // Se é login OAuth (account existe)
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      
      // ... resto do código existente para passwordChangedAt ...
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.provider = token.provider as string; // Opcional: saber qual provider
      }
      return session;
    },
  },
  
  // NOVO: Adapter do Prisma para NextAuth
  adapter: PrismaAdapter(prisma),
  
  pages: {
    signIn: '/login',
  },
  
  session: {
    strategy: 'jwt', // Manter JWT (mais simples que database sessions)
  },
  
  // NOVO: Eventos para logging/auditoria
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log de login OAuth
      if (account?.provider !== 'credentials' && isNewUser) {
        // Registrar novo usuário via OAuth
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
            metadata: JSON.stringify({
              provider: account.provider,
              method: 'OAUTH',
              isNewUser: true,
            }),
          },
        });
      }
    },
  },
};
```

**Observações:**
- O `PrismaAdapter` gerencia automaticamente a criação/vinculação de contas OAuth
- Mantemos `strategy: 'jwt'` para simplicidade (não precisamos do modelo `Session`)
- O callback `signIn` permite controlar quem pode fazer login

---

### 5. Atualização da Página de Login (`app/login/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOAuth, setIsLoadingOAuth] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Função existente para login com credenciais
  const handleSubmit = async (e: React.FormEvent) => {
    // ... código existente ...
  };

  // NOVA: Função para login OAuth
  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsLoadingOAuth(provider);
    try {
      await signIn(provider, {
        callbackUrl: '/', // Será redirecionado após login
        redirect: true,
      });
    } catch (error) {
      toast.error(`Erro ao fazer login com ${provider === 'google' ? 'Google' : 'Facebook'}`);
      setIsLoadingOAuth(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ... header existente ... */}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* ... formulário existente ... */}
        </form>

        {/* NOVO: Divisor "OU" */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Ou continue com</span>
          </div>
        </div>

        {/* NOVO: Botões OAuth */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading || isLoadingOAuth !== null}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoadingOAuth === 'google' ? (
              'Carregando...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  {/* Ícone do Google */}
                </svg>
                <span className="ml-2">Google</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('facebook')}
            disabled={isLoading || isLoadingOAuth !== null}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoadingOAuth === 'facebook' ? (
              'Carregando...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  {/* Ícone do Facebook */}
                </svg>
                <span className="ml-2">Facebook</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Fluxo de Autenticação OAuth

### 6. Cenários de Login

#### **Cenário 1: Novo Usuário (Primeiro Login OAuth)**
1. Usuário clica em "Entrar com Google/Facebook"
2. Redirecionado para página de autorização do provider
3. Usuário autoriza o app
4. Provider redireciona de volta com código de autorização
5. NextAuth troca código por tokens
6. NextAuth busca dados do usuário no provider (email, nome, foto)
7. **PrismaAdapter cria:**
   - Novo registro em `User` (se email não existir)
   - Novo registro em `Account` vinculado ao usuário
8. Sessão JWT é criada
9. Usuário é redirecionado para dashboard baseado no role

#### **Cenário 2: Usuário Existente (Email já cadastrado)**
1. Usuário faz login OAuth
2. NextAuth identifica que o email já existe no banco
3. **PrismaAdapter:**
   - Vincula a nova `Account` ao `User` existente
   - **NÃO cria novo usuário**
4. Sessão é criada normalmente
5. Usuário acessa com a conta existente

#### **Cenário 3: Usuário com Login por Credenciais quer usar OAuth**
1. Usuário já tem conta com email/senha
2. Faz login OAuth pela primeira vez
3. Sistema identifica email existente
4. Vincula `Account` OAuth ao `User` existente
5. Agora o usuário pode usar **ambos os métodos** de login

#### **Cenário 4: Múltiplos Providers (Google + Facebook)**
1. Usuário faz login com Google → conta criada/vinculada
2. Depois faz login com Facebook (mesmo email)
3. Sistema vincula segunda `Account` ao mesmo `User`
4. Usuário pode usar qualquer um dos métodos

---

## 🛡️ Segurança e Privacidade

### 7. Considerações de Segurança

#### **LGPD/GDPR:**
- ✅ Dados coletados: email, nome, foto (apenas o necessário)
- ✅ Consentimento explícito via OAuth (usuário autoriza no provider)
- ✅ Usuário pode desvincular conta OAuth a qualquer momento
- ✅ Logs de auditoria para rastreabilidade

#### **Validações:**
- ✅ Email deve ser único (já existe constraint no schema)
- ✅ Verificação de email automática para OAuth (providers já verificam)
- ✅ Tokens OAuth armazenados de forma segura (criptografados se necessário)

#### **Proteções:**
- ✅ Rate limiting no middleware (já existe)
- ✅ CSRF protection (NextAuth gerencia)
- ✅ Tokens JWT com expiração
- ✅ Validação de origem (callback URLs configuradas nos providers)

---

## 📝 Casos Especiais e Tratamento de Erros

### 8. Situações a Considerar

#### **Email não fornecido pelo Provider:**
- Alguns providers podem não retornar email
- **Solução:** Solicitar email manualmente após primeiro login OAuth
- Criar fluxo de "completar cadastro" para usuários OAuth sem email

#### **Email já existe com senha:**
- Usuário tenta fazer OAuth mas email já tem senha
- **Solução:** Vincular automaticamente (como no Cenário 3)
- Opcional: Enviar email notificando vinculação

#### **Conta OAuth desvinculada:**
- Usuário remove permissões no provider
- **Solução:** Próximo login OAuth criará nova `Account` ou reativará existente

#### **Mudança de email no Provider:**
- Usuário muda email no Google/Facebook
- **Solução:** NextAuth atualiza automaticamente via `Account` (email vem do token)

---

## 🎨 Melhorias de UX

### 9. Experiência do Usuário

#### **Página de Login:**
- ✅ Botões OAuth visíveis e acessíveis
- ✅ Ícones reconhecíveis (Google, Facebook)
- ✅ Loading states durante autenticação
- ✅ Mensagens de erro claras

#### **Primeiro Login OAuth:**
- ✅ Boas-vindas personalizadas
- ✅ Solicitar dados complementares se necessário (CPF, telefone)
- ✅ Tutorial rápido do sistema

#### **Vinculação de Contas:**
- ✅ Página de perfil permitindo vincular/desvincular contas
- ✅ Mostrar quais métodos de login estão disponíveis
- ✅ Aviso se tentar remover último método de login

---

## 📊 Estrutura de Dados Esperada

### 10. Exemplo de Dados após Implementação

```typescript
// Usuário com múltiplos métodos de login
User {
  id: "uuid-123",
  email: "usuario@example.com",
  name: "João Silva",
  password: null, // Não tem senha, só OAuth
  role: "PATIENT",
  accounts: [
    {
      provider: "google",
      providerAccountId: "google-123456",
      type: "oauth"
    },
    {
      provider: "facebook",
      providerAccountId: "facebook-789012",
      type: "oauth"
    }
  ]
}

// Usuário com login tradicional + OAuth
User {
  id: "uuid-456",
  email: "medico@example.com",
  name: "Dr. Maria",
  password: "$2a$10$...", // Hash bcrypt
  role: "DOCTOR",
  accounts: [
    {
      provider: "credentials",
      type: "credentials"
    },
    {
      provider: "google",
      providerAccountId: "google-345678",
      type: "oauth"
    }
  ]
}
```

---

## 🚀 Plano de Implementação (Ordem Sugerida)

### Fase 1: Preparação
1. ✅ Criar modelos no Prisma (`Account`, `Session`, `VerificationToken`)
2. ✅ Executar migração do banco de dados
3. ✅ Configurar apps OAuth no Google Cloud Console e Facebook Developers
4. ✅ Adicionar variáveis de ambiente

### Fase 2: Backend
5. ✅ Instalar PrismaAdapter do NextAuth
6. ✅ Atualizar `lib/auth.ts` com providers OAuth
7. ✅ Configurar callbacks e eventos
8. ✅ Testar fluxo de autenticação

### Fase 3: Frontend
9. ✅ Atualizar página de login com botões OAuth
10. ✅ Adicionar ícones e estilos
11. ✅ Implementar loading states
12. ✅ Testar redirecionamentos

### Fase 4: Funcionalidades Extras
13. ✅ Página de perfil para gerenciar contas vinculadas
14. ✅ Fluxo de completar cadastro (se necessário)
15. ✅ Logs de auditoria para logins OAuth
16. ✅ Notificações de vinculação de conta

### Fase 5: Testes e Ajustes
17. ✅ Testar todos os cenários de login
18. ✅ Validar segurança e privacidade
19. ✅ Ajustar UX baseado em feedback
20. ✅ Documentação para usuários

---

## 📚 Recursos e Documentação

### Links Úteis:
- [NextAuth.js OAuth Providers](https://next-auth.js.org/configuration/providers/oauth)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login)
- [PrismaAdapter NextAuth](https://next-auth.js.org/adapters/prisma)

### Configuração nos Providers:

#### **Google Cloud Console:**
1. Criar projeto
2. Habilitar Google+ API
3. Criar credenciais OAuth 2.0
4. Adicionar URLs de callback autorizadas:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://seu-dominio.com/api/auth/callback/google` (prod)

#### **Facebook Developers:**
1. Criar app
2. Adicionar produto "Facebook Login"
3. Configurar URLs de redirecionamento OAuth válidas:
   - `http://localhost:3000/api/auth/callback/facebook` (dev)
   - `https://seu-dominio.com/api/auth/callback/facebook` (prod)
4. Solicitar permissões: `email`, `public_profile`

---

## ⚠️ Pontos de Atenção

1. **PrismaAdapter:** Pode ser necessário instalar `@next-auth/prisma-adapter`
2. **Migração de Dados:** Usuários existentes continuarão funcionando normalmente
3. **Email Obrigatório:** Garantir que providers retornem email (configurar scopes corretos)
4. **Testes em Produção:** Testar callbacks OAuth em ambiente de produção (URLs diferentes)
5. **Backup:** Fazer backup antes de migração do schema

---

## ✅ Checklist Final

- [ ] Schema Prisma atualizado
- [ ] Migração executada
- [ ] Apps OAuth configurados (Google + Facebook)
- [ ] Variáveis de ambiente configuradas
- [ ] `lib/auth.ts` atualizado com providers
- [ ] Página de login atualizada
- [ ] Testes de login OAuth funcionando
- [ ] Vinculação de contas funcionando
- [ ] Logs de auditoria implementados
- [ ] Documentação para usuários finalizada

---

## 🎯 Resultado Esperado

Após a implementação, os usuários poderão:
- ✅ Fazer login com Google (1 clique)
- ✅ Fazer login com Facebook (1 clique)
- ✅ Continuar usando email/senha (método atual)
- ✅ Vincular múltiplos métodos ao mesmo perfil
- ✅ Ter experiência fluida e segura

O sistema manterá **100% de compatibilidade** com usuários existentes e adicionará novas opções de autenticação sem quebrar funcionalidades atuais.
