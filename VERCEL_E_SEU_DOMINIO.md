# Vercel + seu domínio

Com **Vercel**, o site roda nos **servidores da Vercel**, não no seu PC. Por isso:

- O **banco não pode ficar só no seu computador** – a Vercel não acessa sua máquina.
- Você precisa de um **banco na nuvem** (PostgreSQL, ex.: Neon ou Supabase).

Se quiser **só** domínio com banco local, use o **Cloudflare Tunnel** (guia: `ACESSO_DOMINIO_BANCO_LOCAL.md`).

Se quiser **Vercel + seu domínio**, o fluxo é o de **deploy em produção**. Resumo abaixo; o passo a passo completo está em **`GUIA_DEPLOY_PRODUCAO_PASSO_A_PASSO.md`**.

---

## Resumo: Vercel + domínio

| Etapa | O que fazer |
|-------|-------------|
| 1 | Criar um **PostgreSQL na nuvem** (Neon ou Supabase) e copiar a `DATABASE_URL`. |
| 2 | No `prisma/schema.prisma`: trocar `provider = "sqlite"` por `provider = "postgresql"`. Rodar `npx prisma db push` (ou `migrate deploy`) e `npm run build`. |
| 3 | Subir o código para o **GitHub** (commit + push). |
| 4 | Na **Vercel**: importar o repositório, configurar **variáveis de ambiente** (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, Stripe, SMTP/Resend, etc.) e fazer o **Deploy**. |
| 5 | **Conectar o domínio**: na Vercel → **Settings** → **Domains** → **Add** → digitar seu domínio (ex.: `seudominio.com.br` ou `app.seudominio.com.br`). |
| 6 | **DNS**: onde você comprou o domínio (Registro.br, GoDaddy, etc.), criar: **A** `@` → `76.76.21.21` e **CNAME** `www` → `cname.vercel-dns.com`. |
| 7 | Atualizar **NEXTAUTH_URL** e **NEXT_PUBLIC_APP_URL** na Vercel para `https://seudominio.com.br`, fazer **Redeploy** e configurar o webhook do Stripe se usar. |

A Vercel cuida do **HTTPS (SSL)** automaticamente quando o DNS estiver correto.

---

## Onde está cada coisa

- **Passo a passo completo (banco, Prisma, variáveis, DNS):** `GUIA_DEPLOY_PRODUCAO_PASSO_A_PASSO.md`
- **Deploy só na Vercel (sem domínio):** `DEPLOY_VERCEL.md`
- **Domínio com banco local (sem Vercel):** `ACESSO_DOMINIO_BANCO_LOCAL.md`
