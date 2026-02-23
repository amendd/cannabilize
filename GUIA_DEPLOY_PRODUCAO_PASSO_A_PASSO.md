# Guia completo: Deploy em produção com seu domínio

Este guia leva você do ambiente local até o site no ar, acessível pelo domínio que você já comprou.

---

## Visão geral: ordem dos passos

1. **Banco de dados na nuvem** – Criar um PostgreSQL (Neon ou Supabase).
2. **Ajustar o projeto** – Trocar SQLite por PostgreSQL no Prisma e testar o build.
3. **Código no Git** – Garantir que o projeto está no GitHub (ou GitLab/Bitbucket).
4. **Vercel** – Conectar o repositório, configurar variáveis e fazer o primeiro deploy.
5. **Domínio** – Adicionar o domínio na Vercel e configurar DNS onde você comprou o domínio.
6. **Ajustes finais** – NEXTAUTH_URL, webhook Stripe, e-mail, etc.

---

## Passo 1: Banco de dados na nuvem

O projeto usa **SQLite** localmente. Na Vercel (e em qualquer hospedagem serverless) você precisa de um banco **PostgreSQL** na nuvem.

### Opção A: Neon (recomendado, plano gratuito)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta (pode usar GitHub).
2. Crie um novo projeto (ex.: "clickcannabis-prod").
3. Escolha a região mais próxima (ex.: São Paulo se existir, ou us-east-1).
4. No painel, copie a **connection string** (Connection string). Ela será algo como:
   ```text
   postgresql://usuario:senha@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Guarde essa URL; você vai usar como `DATABASE_URL` na Vercel.

### Opção B: Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. Em **Settings** → **Database** copie a **Connection string** (modo “URI”, com senha).
3. Use essa URL como `DATABASE_URL`.

---

## Passo 2: Ajustar o projeto para PostgreSQL

### 2.1 Alterar o Prisma para usar PostgreSQL

No arquivo `prisma/schema.prisma`, na parte de **datasource**:

**De (SQLite):**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Para (PostgreSQL):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.2 Usar a URL do banco na nuvem

Crie ou edite um `.env` (ou `.env.local`) **só na sua máquina** e defina:

```env
DATABASE_URL="postgresql://usuario:senha@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

Substitua pela connection string real do Neon (ou Supabase).

### 2.3 Rodar as migrações no banco novo

No terminal, na raiz do projeto:

```powershell
npx prisma migrate deploy
```

Se aparecer erro dizendo que não há migrações aplicáveis, use:

```powershell
npx prisma db push
```

Isso cria as tabelas no PostgreSQL. Depois, se quiser popular dados iniciais:

```powershell
npm run db:seed
```

### 2.4 Testar o build local

```powershell
npm run build
```

Se der certo, o projeto está pronto para o deploy.

---

## Passo 3: Código no Git

1. Confirme que todas as alterações estão commitadas:
   ```powershell
   git status
   git add .
   git commit -m "Preparar deploy: PostgreSQL e ajustes para produção"
   ```
2. Envie para o GitHub (ou outro):
   ```powershell
   git push origin main
   ```
   (Troque `main` por `master` se for o nome da sua branch principal.)

---

## Passo 4: Deploy na Vercel

### 4.1 Criar conta e conectar o repositório

1. Acesse [vercel.com](https://vercel.com) e faça login (recomendado: “Continue with GitHub”).
2. Clique em **Add New** → **Project**.
3. Importe o repositório do projeto (ex.: `clickcannabis-replica`).
4. **Não** clique em Deploy ainda; primeiro configure as variáveis.

### 4.2 Configurar variáveis de ambiente

No passo de configuração do projeto (ou depois em **Settings** → **Environment Variables**), adicione as variáveis abaixo. Marque **Production** (e **Preview** se quiser que previews também funcionem).

#### Obrigatórias

| Variável | Exemplo / descrição |
|----------|----------------------|
| `DATABASE_URL` | A connection string do Neon ou Supabase (PostgreSQL). |
| `NEXTAUTH_URL` | URL final do site, ex: `https://seudominio.com.br` (pode começar com `https://seu-projeto.vercel.app` e trocar depois). |
| `NEXTAUTH_SECRET` | Texto aleatório longo (ex: gere com `openssl rand -base64 32` ou um gerador online). |
| `NODE_ENV` | `production` |

#### Muito recomendadas

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_APP_URL` | Mesma URL do site, ex: `https://seudominio.com.br`. |
| `NEXT_PUBLIC_BASE_URL` | Opcional; se não definir, o código usa `NEXTAUTH_URL`. Pode ser `https://seudominio.com.br`. |

#### E-mail (SMTP ou Resend)

Se usar SMTP (Gmail, etc.):

| Variável | Exemplo |
|----------|--------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Seu e-mail |
| `SMTP_PASS` ou `SMTP_PASSWORD` | Senha de app (Gmail: senha de 16 caracteres) |
| `SMTP_FROM` | `"Nome do Site <email@dominio.com>"` |
| `SMTP_REPLY_TO` | E-mail para resposta |

Se usar Resend (painel Admin → E-mail):

| Variável | Descrição |
|----------|-----------|
| `RESEND_API_KEY` | Chave da API Resend |

#### Pagamentos (Stripe)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chave pública (pk_live_...) |
| `STRIPE_SECRET_KEY` | Chave secreta (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook (whsec_...) – configurado depois do domínio estar no ar |

#### reCAPTCHA (formulários / agendamento)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Site key do reCAPTCHA |
| `RECAPTCHA_SECRET_KEY` | Secret key |
| `RECAPTCHA_THRESHOLD` | Opcional; ex: `0.5` |

#### Crons (lembretes de e-mail – vercel.json)

Se o projeto usar crons da Vercel que chamam rotas protegidas:

| Variável | Descrição |
|----------|-----------|
| `CRON_SECRET` | Um segredo que você define; a rota de cron deve validar esse valor no header/query. |

### 4.3 Build na Vercel

- **Build Command:** deixe o padrão ou use: `npm run build` (o `package.json` já tem `prisma generate` no script `build`).
- **Output Directory:** padrão (Next.js).
- **Install Command:** `npm install`.

Clique em **Deploy**. Aguarde o build. Se falhar, veja os logs na Vercel (geralmente falta variável ou erro no Prisma).

### 4.4 Primeiro acesso

Depois do deploy, acesse a URL que a Vercel mostrar (ex.: `https://seu-projeto.vercel.app`). Teste:

- Página inicial
- Login
- Uma ou duas funcionalidades principais

Se algo depender de domínio (ex.: login com NextAuth), pode dar aviso até você configurar o domínio e atualizar `NEXTAUTH_URL`.

---

## Passo 5: Conectar seu domínio na Vercel

### 5.1 Adicionar o domínio no projeto

1. No projeto na Vercel: **Settings** → **Domains**.
2. Clique em **Add** e digite seu domínio, por exemplo:
   - `seudominio.com.br` (domínio raiz)
   - ou `app.seudominio.com.br` (subdomínio)
3. A Vercel vai mostrar quais registros DNS criar.

### 5.2 Configurar DNS onde você comprou o domínio

Você precisa criar os registros no painel do **registro do domínio** (Registro.br, GoDaddy, Hostinger, Locaweb, etc.).

A Vercel costuma pedir:

**Para o domínio raiz (`seudominio.com.br`):**

| Tipo | Nome | Valor / Apontamento |
|------|------|----------------------|
| A | `@` (ou vazio, conforme o painel) | `76.76.21.21` |

**Para `www` (`www.seudominio.com.br`):**

| Tipo | Nome | Valor / Apontamento |
|------|------|----------------------|
| CNAME | `www` | `cname.vercel-dns.com` |

**Se usar só subdomínio (ex.: `app.seudominio.com.br`):**

| Tipo | Nome | Valor / Apontamento |
|------|------|----------------------|
| CNAME | `app` | `cname.vercel-dns.com` |

- No **Registro.br**: em “DNS” / “Editar zona”, crie os registros A e CNAME conforme a tabela.
- Em **GoDaddy**, **Hostinger**, etc.: procure “DNS”, “Manage DNS” ou “Zona DNS” e adicione os mesmos tipos, nomes e valores.

Salve as alterações. A propagação pode levar de alguns minutos a 48 horas (geralmente 15–60 minutos).

### 5.3 Verificar na Vercel

Em **Settings** → **Domains**, o domínio deve aparecer como “Valid” quando o DNS estiver correto. A Vercel ativa o **HTTPS (SSL)** automaticamente.

---

## Passo 6: Ajustes finais após o domínio estar no ar

### 6.1 Atualizar NEXTAUTH_URL e URLs públicas

1. **Settings** → **Environment Variables**.
2. Altere `NEXTAUTH_URL` para: `https://seudominio.com.br` (ou o subdomínio que você usou).
3. Altere `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_BASE_URL` (se existir) para a mesma URL.
4. Salve e faça um **Redeploy** (Deployments → ⋮ no último deploy → Redeploy).

### 6.2 Webhook do Stripe

1. No [Dashboard do Stripe](https://dashboard.stripe.com/webhooks), adicione um endpoint:
   - URL: `https://seudominio.com.br/api/payments/webhook`
   - Eventos: os que seu código usa (ex.: `payment_intent.succeeded`, etc.).
2. Copie o **Signing secret** (whsec_...).
3. Na Vercel, em **Environment Variables**, defina ou atualize `STRIPE_WEBHOOK_SECRET` com esse valor.
4. Redeploy.

### 6.3 E-mail e outros serviços

- Se usar Gmail/SMTP, confira se o “remetente” e domínio estão permitidos.
- Se usar Resend, no painel do Resend adicione e verifique o domínio de envio, se necessário.
- WhatsApp, Google Meet, etc.: atualize qualquer URL de callback ou whitelist para `https://seudominio.com.br`.

### 6.4 Testar em produção

- Abra `https://seudominio.com.br`.
- Teste login, agendamento, pagamento (modo teste se for Stripe teste), e-mail de recuperação de senha, etc.

---

## Resumo rápido

| Etapa | O que fazer |
|-------|-------------|
| 1 | Criar banco PostgreSQL (Neon ou Supabase) e copiar `DATABASE_URL`. |
| 2 | No `prisma/schema.prisma`: `provider = "postgresql"`. Rodar `npx prisma migrate deploy` ou `npx prisma db push` e `npm run build`. |
| 3 | Commit e push do projeto para o GitHub. |
| 4 | Vercel: importar repositório, preencher variáveis (DATABASE_URL, NEXTAUTH_*, Stripe, SMTP/Resend, etc.), Deploy. |
| 5 | Settings → Domains: adicionar domínio; no registro do domínio criar A `76.76.21.21` e CNAME `www` → `cname.vercel-dns.com`. |
| 6 | Ajustar NEXTAUTH_URL e NEXT_PUBLIC_APP_URL para o domínio; configurar Stripe webhook; redeploy e testar. |

Se você disser em qual serviço registrou o domínio (Registro.br, GoDaddy, Hostinger, etc.), dá para detalhar os cliques exatos na tela de DNS.
