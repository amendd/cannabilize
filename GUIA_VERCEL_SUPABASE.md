# 🚀 Guia: Vercel + Supabase

Passo a passo para hospedar o projeto na **Vercel** (app) e usar **Supabase** (PostgreSQL).

---

## Visão geral

| Etapa | Onde | O que fazer |
|-------|------|-------------|
| 1 | Supabase | Criar projeto e obter URL do banco |
| 2 | Local | Alterar Prisma para PostgreSQL e rodar migrações |
| 3 | Vercel | Conectar repositório e configurar variáveis |
| 4 | Vercel | Deploy e (opcional) domínio |

---

# PARTE 1: Supabase (banco de dados)

## 1.1 Criar conta e projeto

1. Acesse **https://supabase.com** e clique em **Start your project**.
2. Faça login com **GitHub** (recomendado) ou email.
3. Clique em **New Project**.
4. Preencha:
   - **Name**: ex. `clickcannabis-prod`
   - **Database Password**: crie uma senha forte e **guarde** (você vai usar na `DATABASE_URL`)
   - **Region**: escolha a mais próxima (ex. **South America (São Paulo)** se existir, ou **East US**).
5. Clique em **Create new project** e aguarde alguns minutos.

## 1.2 Obter a connection string

Para **Vercel** você deve usar a **Connection pooling** (porta **6543**), não a conexão direta (5432).  
**Guia detalhado com prints e alternativas:** [SUPABASE_CONNECTION_STRING.md](SUPABASE_CONNECTION_STRING.md)

### Resumo rápido

1. No **Dashboard** do Supabase, abra seu projeto.
2. **Opção A:** No **topo da página**, clique no botão **Connect**.  
   **Opção B:** No menu lateral, vá em **Settings** (engrenagem) → **Database**.
3. Na seção **Connection string**:
   - Escolha a opção **Connection pooling** / **Transaction mode** (porta **6543**).  
     Não use **Direct connection** (porta 5432).
   - Selecione a aba **URI** e copie a URL.
4. A URL terá `[YOUR-PASSWORD]`. Substitua pela **senha do banco** que você definiu ao criar o projeto.  
   Se a senha tiver `@`, `#`, `%`, etc., use URL encode (ex. `@` → `%40`, `#` → `%23`).
5. No **final** da URL, adicione: `?pgbouncer=true&connection_limit=1&sslmode=require`  
   (se já houver `?`, use `&` em vez do primeiro `?`).

Exemplo de formato final (troque `[SENHA]` pela sua senha):

```txt
postgresql://postgres.xxxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

Guarde essa URL; você vai usar como `DATABASE_URL` no `.env` e na Vercel.

---

# PARTE 2: Preparar o projeto (Prisma + PostgreSQL)

## 2.1 Alterar o schema do Prisma

No arquivo **`prisma/schema.prisma`**, altere o `datasource` de `sqlite` para `postgresql`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Ou seja: mude apenas a linha `provider = "sqlite"` para `provider = "postgresql"`.

## 2.2 Configurar DATABASE_URL localmente

No seu **`.env`** (desenvolvimento), use a **mesma URL do Supabase** (pooler, com senha substituída):

```env
DATABASE_URL="postgresql://postgres.xxxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
```

Assim você desenvolve já contra o banco de produção (ou crie um segundo projeto Supabase para “staging” se preferir).

## 2.3 Gerar o Prisma Client e criar as tabelas

No terminal, na raiz do projeto:

```bash
npx prisma generate
```

Para criar as tabelas no Supabase, use **uma** das opções abaixo.

**Opção A – Migrations (recomendado para produção):**

```bash
npx prisma migrate dev --name init_postgresql
```

Isso cria a pasta `prisma/migrations` e aplica as migrações no banco do Supabase.  
Depois, em cada deploy na Vercel, as migrações serão aplicadas com `prisma migrate deploy` (veja Parte 3).

**Opção B – Apenas sincronizar schema (mais simples, menos controle):**

```bash
npx prisma db push
```

Use se ainda estiver em fase inicial e não precisar de histórico de migrações.

## 2.4 (Opcional) Dados iniciais

Se você tiver um seed:

```bash
npm run db:seed
```

Cuidado: só rode em produção se o seed for seguro (ex. um admin inicial, sem dados de teste sensíveis).

---

# PARTE 3: Vercel (deploy da aplicação)

## 3.1 Conta e conexão com o GitHub

1. Acesse **https://vercel.com** e faça login com **GitHub**.
2. Autorize a Vercel a acessar a organização/repositório onde está o projeto.

## 3.2 Importar o projeto

1. Clique em **Add New…** → **Project**.
2. Selecione o repositório do projeto (ex. `clickcannabis-replica`).
3. Em **Configure Project**:
   - **Framework Preset**: Next.js (já deve vir detectado).
   - **Root Directory**: deixe em branco (raiz).
   - **Build Command**: `npm run build` (ou `prisma generate && next build`).
   - **Output Directory**: `.next`.
   - **Install Command**: `npm install`.

Não clique em **Deploy** ainda; antes configure as variáveis.

## 3.3 Variáveis de ambiente na Vercel

Em **Settings** → **Environment Variables** do projeto, adicione:

| Nome | Valor | Observação |
|------|--------|------------|
| `DATABASE_URL` | URL do Supabase (pooler, com senha) | A mesma da etapa 1.2 |
| `NEXTAUTH_URL` | `https://seu-dominio.vercel.app` | No primeiro deploy use a URL que a Vercel der (ex. `https://projeto.vercel.app`) |
| `NEXTAUTH_SECRET` | String aleatória longa | Gerar com: `openssl rand -base64 32` |
| `NODE_ENV` | `production` | |
| `NEXT_PUBLIC_APP_URL` | Mesmo valor de `NEXTAUTH_URL` | |

Depois, conforme usar no projeto:

- **Stripe**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Email**: variáveis usadas em `lib/email.ts` (ex. Resend: `RESEND_API_KEY`, ou SMTP)
- **reCAPTCHA**: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`

Marque **Production** (e **Preview** se quiser) para cada variável e salve.

## 3.4 Build e primeiro deploy

1. Volte em **Deployments** e clique em **Deploy** (ou faça um push na branch conectada).
2. A Vercel vai rodar `npm install` e `npm run build`.  
   O script `build` do `package.json` já inclui `prisma generate` antes do `next build`.
3. Se quiser rodar migrações em todo deploy, no **Build Command** use:

```bash
prisma generate && prisma migrate deploy && next build
```

(Requer que as migrações estejam commitadas em `prisma/migrations`.)

4. Aguarde o build. Se der erro, confira os logs (falta de variável, erro no Prisma, etc.).

## 3.5 URL de produção e ajuste do NextAuth

Após o primeiro deploy:

1. A Vercel mostra a URL (ex. `https://clickcannabis-replica.vercel.app`).
2. Atualize na Vercel:
   - **NEXTAUTH_URL** = essa URL
   - **NEXT_PUBLIC_APP_URL** = essa URL
3. Faça um **Redeploy** (Deployments → ⋮ → Redeploy) para aplicar as novas variáveis.

Assim o login (NextAuth) passa a funcionar corretamente em produção.

---

# PARTE 4: Domínio próprio (opcional)

1. Na Vercel: **Settings** → **Domains** → **Add**.
2. Digite o domínio (ex. `app.seudominio.com.br`).
3. Siga as instruções de DNS (geralmente um CNAME apontando para `cname.vercel-dns.com`).
4. Quando o domínio estiver ativo, atualize de novo:
   - **NEXTAUTH_URL** = `https://app.seudominio.com.br`
   - **NEXT_PUBLIC_APP_URL** = `https://app.seudominio.com.br`
5. Redeploy para aplicar.

---

# Checklist rápido

- [ ] Supabase: projeto criado, senha guardada, URL pooler (porta 6543) copiada.
- [ ] `prisma/schema.prisma`: `provider = "postgresql"`.
- [ ] `.env`: `DATABASE_URL` com URL do Supabase (e senha codificada se tiver caracteres especiais).
- [ ] `npx prisma generate` e `npx prisma migrate dev` (ou `db push`) executados sem erro.
- [ ] Vercel: projeto importado, variáveis (DATABASE_URL, NEXTAUTH_*, etc.) configuradas.
- [ ] Primeiro deploy concluído; NEXTAUTH_URL e NEXT_PUBLIC_APP_URL ajustados para a URL da Vercel; redeploy feito.
- [ ] Login e fluxo principal testados em produção.

---

# Problemas comuns

**Build falha com erro de Prisma**  
- Confirme que o **Build Command** inclui `prisma generate` (ex.: `npm run build` já faz isso).  
- Confirme que `DATABASE_URL` está preenchida na Vercel (e sem espaços extras).

**"Too many connections" no Supabase**  
- Use a URL do **Connection pooler** (porta **6543**) e, se possível, `?connection_limit=1` na `DATABASE_URL`.

**Login não funciona em produção**  
- `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL` devem ser exatamente a URL em que o site está (com `https://`).  
- Após mudar, faça **Redeploy**.

**Tabelas não existem no Supabase**  
- Rode localmente `npx prisma migrate dev` (ou `db push`) com `DATABASE_URL` apontando para o projeto Supabase.  
- Se usar migrações, no build da Vercel use: `prisma migrate deploy` antes do `next build`.

---

**Última atualização**: Janeiro 2026
