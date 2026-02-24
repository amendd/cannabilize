# 🚀 Preparação para Produção - Guia Completo

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Checklist Pré-Deploy](#checklist-pré-deploy)
3. [Configurações Essenciais](#configurações-essenciais)
4. [Banco de Dados](#banco-de-dados)
5. [Segurança](#segurança)
6. [Performance e Otimização](#performance-e-otimização)
7. [Hospedagem e Domínio](#hospedagem-e-domínio)
8. [Monitoramento e Logs](#monitoramento-e-logs)
9. [Backup e Recuperação](#backup-e-recuperação)
10. [CI/CD e Deploy Automatizado](#cicd-e-deploy-automatizado)
11. [Limpeza e Otimização](#limpeza-e-otimização)
12. [Checklist Final](#checklist-final)

---

## 🎯 Visão Geral

Este documento detalha todos os passos necessários para colocar o projeto Cannabilize em produção de forma segura, escalável e profissional.

### Stack Atual
- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: SQLite (dev) → **PostgreSQL (produção)**
- **ORM**: Prisma
- **Autenticação**: NextAuth
- **Pagamentos**: Stripe
- **Estilização**: Tailwind CSS

---

## ✅ Checklist Pré-Deploy

### 🔴 CRÍTICO - Fazer ANTES de ir para produção

- [ ] **Migrar banco de SQLite para PostgreSQL**
- [ ] **Configurar variáveis de ambiente de produção**
- [ ] **Gerar NEXTAUTH_SECRET seguro**
- [ ] **Configurar HTTPS/SSL**
- [ ] **Remover dados de teste/desenvolvimento**
- [ ] **Configurar domínio e DNS**
- [ ] **Configurar backups automáticos**
- [ ] **Implementar monitoramento de erros**
- [ ] **Configurar rate limiting**
- [ ] **Revisar e remover código de debug**

---

## ⚙️ Configurações Essenciais

### 1. Variáveis de Ambiente de Produção

Crie um arquivo `.env.production` (NÃO commitar no Git):

```env
# ============================================
# PRODUÇÃO - NUNCA COMMITAR NO GIT
# ============================================

# Banco de Dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@host:5432/clickcannabis_prod?schema=public&sslmode=require"

# NextAuth
NEXTAUTH_URL="https://seudominio.com.br"
NEXTAUTH_SECRET="GERE-UM-SECRET-ALEATORIO-AQUI-MINIMO-32-CARACTERES"

# Ambiente
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seudominio.com.br"

# Stripe (Produção)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@seudominio.com.br"
SMTP_PASSWORD="senha-do-app"
SMTP_FROM="noreply@seudominio.com.br"

# WhatsApp (se usar)
WHATSAPP_API_KEY=""
WHATSAPP_PHONE_NUMBER=""

# Google Meet (se usar)
GOOGLE_MEET_API_KEY=""

# AWS S3 (para uploads de arquivos)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET="clickcannabis-prod"
AWS_REGION="us-east-1"

# Analytics e Monitoramento
SENTRY_DSN="" # Opcional: para tracking de erros
GOOGLE_ANALYTICS_ID="" # Opcional
```

### 2. Gerar NEXTAUTH_SECRET Seguro

```bash
# No terminal, execute:
openssl rand -base64 32

# Ou use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Ou acesse: https://generate-secret.vercel.app/32
```

**⚠️ IMPORTANTE**: Use um secret diferente para cada ambiente (dev, staging, prod)

---

## 🗄️ Banco de Dados

### 1. Migrar de SQLite para PostgreSQL

#### Passo 1: Alterar schema.prisma

```prisma
datasource db {
  provider = "postgresql"  // Mudar de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Passo 2: Criar banco PostgreSQL em produção

**Opções de hospedagem PostgreSQL:**
- **Supabase** (grátis até 500MB, fácil setup)
- **Neon** (grátis até 3GB, serverless)
- **Railway** (grátis até $5/mês)
- **AWS RDS** (pago, escalável)
- **DigitalOcean** (pago, $15/mês)
- **Heroku Postgres** (pago)

#### Passo 3: Configurar conexão

```bash
# Exemplo com Supabase
DATABASE_URL="postgresql://postgres:[SENHA]@[HOST]:5432/postgres?schema=public&sslmode=require"
```

#### Passo 4: Executar migrações

```bash
# Gerar Prisma Client
npx prisma generate

# Criar migrações
npx prisma migrate dev --name init

# Aplicar em produção (CUIDADO!)
npx prisma migrate deploy

# OU usar db push (mais simples, mas menos controle)
npx prisma db push
```

### 2. Configurar Pool de Conexões

Crie/atualize `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. Backup Automatizado

Configure backups diários do banco:

**Com Supabase/Neon**: Já vem com backup automático

**Manual (cron job)**:
```bash
# Backup diário às 2h da manhã
0 2 * * * pg_dump $DATABASE_URL > backup_$(date +\%Y\%m\%d).sql
```

---

## 🔒 Segurança

### 1. Headers de Segurança

Crie/atualize `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'cdn.clickagendamento.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 2. Rate Limiting

Verifique se já existe em `middleware.ts`. Se não, implemente:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting simples (melhor usar Redis em produção)
const rateLimitMap = new Map()

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const limit = 100 // requests
  const window = 60000 // 1 minuto

  const key = `${ip}-${Date.now() - (Date.now() % window)}`
  const count = rateLimitMap.get(key) || 0

  if (count >= limit) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  rateLimitMap.set(key, count + 1)

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

### 3. Validação de Input

Certifique-se de que todas as APIs validam input com Zod:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  // ...
})
```

### 4. Sanitização de Dados

Use bibliotecas como `dompurify` para sanitizar HTML:

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### 5. CORS

Configure CORS adequadamente em APIs:

```typescript
// app/api/example/route.ts
export async function GET(request: Request) {
  return new Response(JSON.stringify({ data: 'ok' }), {
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

---

## ⚡ Performance e Otimização

### 1. Build de Produção

```bash
# Build otimizado
npm run build

# Testar build localmente
npm start
```

### 2. Otimizações Next.js

#### Image Optimization
Já configurado em `next.config.js`, mas verifique:

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

#### Bundle Analysis

```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

```bash
ANALYZE=true npm run build
```

### 3. Cache e CDN

- Configure CDN (Cloudflare, Vercel Edge Network)
- Configure cache headers
- Use `revalidate` em páginas estáticas

### 4. Lazy Loading

Certifique-se de usar:
- `next/dynamic` para componentes pesados
- `next/image` para imagens
- Code splitting automático do Next.js

### 5. Database Indexes

Adicione índices no Prisma schema:

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  
  @@index([email])
  @@index([role])
}

model Consultation {
  id        String @id @default(uuid())
  patientId String
  
  @@index([patientId])
  @@index([status])
  @@index([scheduledAt])
}
```

---

## 🌐 Hospedagem e Domínio

### ⚠️ IMPORTANTE: Hospedagens Tradicionais NÃO Funcionam

**Hospedagens como HostGator, Locaweb, KingHost com cPanel NÃO são adequadas** para este projeto porque:
- ❌ Não suportam Node.js
- ❌ Não permitem processos longos
- ❌ Não têm PostgreSQL
- ❌ Não suportam build de aplicações Node.js

**📖 Leia:** `HOSPEDAGEM_TRADICIONAL.md` para análise completa

---

### Opções Recomendadas

#### 1. **Vercel** (Recomendado para Next.js) ⭐⭐⭐
- **Prós**: Deploy automático, SSL grátis, CDN global, otimizado para Next.js, **GRÁTIS**
- **Contras**: Limites no plano grátis (suficiente para começar)
- **Preço**: **Grátis** até 100GB bandwidth/mês
- **Setup**: Conecte GitHub, configure env vars, deploy automático (5 minutos)
- **Ideal para**: Projetos Next.js (como este)

#### 2. **Railway** ⭐⭐
- **Prós**: Fácil, inclui PostgreSQL, SSL grátis, deploy automático
- **Contras**: Pode ficar caro com muito tráfego
- **Preço**: $5/mês crédito grátis, depois $0.01/GB
- **Setup**: Conecte GitHub, adicione PostgreSQL, configure env vars
- **Ideal para**: Quando precisa de PostgreSQL incluído

#### 3. **DigitalOcean App Platform** ⭐⭐
- **Prós**: Escalável, previsível, bom suporte
- **Contras**: Mais caro que alternativas
- **Preço**: $5-12/mês
- **Setup**: Conecte GitHub, configure build, adicione banco
- **Ideal para**: Projetos que precisam de mais controle

#### 4. **Render** ⭐⭐
- **Prós**: Suporta Node.js, SSL grátis, PostgreSQL disponível
- **Contras**: Plano grátis com limitações
- **Preço**: Grátis (limitado) ou $7/mês
- **Setup**: Conecte GitHub, configure env vars

#### 5. **VPS (DigitalOcean, Linode, etc.)** ⭐
- **Prós**: Controle total, preço fixo
- **Contras**: Requer conhecimento técnico, configuração manual
- **Preço**: $6-20/mês
- **Setup**: Instalar Node.js, PostgreSQL, Nginx, PM2, SSL manualmente
- **Ideal para**: Quem tem experiência com servidores Linux

### Configuração de Domínio

1. **Comprar domínio** (Registro.br, GoDaddy, Namecheap)
2. **Configurar DNS**:
   - A Record: `@` → IP do servidor (se VPS)
   - CNAME: `www` → `seudominio.vercel.app` (se Vercel)
3. **SSL/HTTPS**: Automático na maioria das plataformas
4. **Atualizar NEXTAUTH_URL** com domínio real

### Exemplo: Deploy na Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Configurar variáveis de ambiente no dashboard da Vercel
```

---

## 📊 Monitoramento e Logs

### 1. Error Tracking

**Sentry** (Recomendado):

```bash
npm install @sentry/nextjs
```

```bash
npx @sentry/wizard@latest -i nextjs
```

### 2. Analytics

**Google Analytics**:

```typescript
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 3. Uptime Monitoring

- **UptimeRobot** (grátis até 50 monitors)
- **Pingdom**
- **StatusCake**

### 4. Logs

Configure logs estruturados:

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...data }))
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error }))
  },
}
```

---

## 💾 Backup e Recuperação

### 1. Backup do Banco de Dados

**Automático** (se usar Supabase/Neon): Já configurado

**Manual**:
```bash
# Script de backup diário
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload para S3 ou outro storage
```

### 2. Backup de Arquivos

Se usar uploads locais, configure backup para S3 ou similar.

### 3. Plano de Recuperação

Documente:
- Como restaurar banco de dados
- Como restaurar arquivos
- Contatos de emergência
- Procedimentos de rollback

---

## 🔄 CI/CD e Deploy Automatizado

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test # Se tiver testes
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🧹 Limpeza e Otimização

### 1. Remover Arquivos Desnecessários

**Arquivos para remover/deletar:**
- [ ] Todos os arquivos `.bat` de desenvolvimento
- [ ] Arquivos de documentação temporária (manter apenas README.md)
- [ ] Logs locais
- [ ] Arquivos de teste não essenciais

**Arquivos para manter:**
- ✅ `README.md`
- ✅ `package.json`
- ✅ `next.config.js`
- ✅ `prisma/schema.prisma`
- ✅ `.gitignore`
- ✅ `.env.example` (sem valores reais)

### 2. Limpar Código

- [ ] Remover `console.log` de debug
- [ ] Remover comentários desnecessários
- [ ] Remover código comentado
- [ ] Verificar imports não utilizados
- [ ] Otimizar imagens estáticas

### 3. Otimizar Dependências

```bash
# Verificar dependências não utilizadas
npx depcheck

# Atualizar dependências
npm outdated
npm update

# Remover dependências não usadas
npm prune
```

### 4. Minificar e Otimizar

Next.js já faz isso automaticamente no build, mas verifique:
- ✅ Build production gera arquivos otimizados
- ✅ Imagens são otimizadas
- ✅ CSS é minificado
- ✅ JavaScript é minificado e tree-shaken

### 5. Configurar .gitignore

Certifique-se de que `.gitignore` inclui:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/

# Production
dist/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local
.env.production

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/
*.db
*.db-journal

# Logs
logs/
*.log
```

---

## ✅ Checklist Final

### Antes do Deploy

- [ ] Banco migrado para PostgreSQL
- [ ] Variáveis de ambiente configuradas
- [ ] NEXTAUTH_SECRET gerado e seguro
- [ ] Build de produção testado localmente
- [ ] Testes passando (se houver)
- [ ] Código revisado e limpo
- [ ] Arquivos desnecessários removidos
- [ ] `.gitignore` configurado corretamente
- [ ] Domínio configurado
- [ ] SSL/HTTPS funcionando
- [ ] Backups configurados
- [ ] Monitoramento configurado
- [ ] Rate limiting implementado
- [ ] Headers de segurança configurados

### Após o Deploy

- [ ] Site acessível via domínio
- [ ] Login funcionando
- [ ] APIs respondendo corretamente
- [ ] Banco de dados conectado
- [ ] Emails sendo enviados (se configurado)
- [ ] Pagamentos funcionando (Stripe)
- [ ] Monitoramento ativo
- [ ] Logs sendo coletados
- [ ] Performance aceitável
- [ ] Mobile responsivo funcionando

### Pós-Deploy (Primeiras 24h)

- [ ] Monitorar logs de erro
- [ ] Verificar métricas de performance
- [ ] Testar todas as funcionalidades principais
- [ ] Verificar backups
- [ ] Documentar qualquer problema encontrado

---

## 📚 Recursos Adicionais

### Documentação
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production](https://www.prisma.io/docs/guides/deployment)
- [Vercel Documentation](https://vercel.com/docs)

### Ferramentas Úteis
- [SSL Labs](https://www.ssllabs.com/ssltest/) - Testar SSL
- [PageSpeed Insights](https://pagespeed.web.dev/) - Performance
- [Security Headers](https://securityheaders.com/) - Verificar headers

---

## 🆘 Troubleshooting

### Erro: "Database connection failed"
- Verificar `DATABASE_URL`
- Verificar se banco está acessível
- Verificar firewall/security groups

### Erro: "NEXTAUTH_SECRET missing"
- Verificar variável de ambiente
- Gerar novo secret se necessário

### Erro: "Build failed"
- Verificar logs de build
- Verificar dependências
- Verificar TypeScript errors

### Performance lenta
- Verificar banco de dados (índices)
- Verificar CDN
- Verificar cache
- Analisar bundle size

---

**Última atualização**: Janeiro 2026
**Versão**: 1.0
