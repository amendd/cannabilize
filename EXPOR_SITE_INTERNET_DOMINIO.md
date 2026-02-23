# Como deixar seu site acessível na internet com seu domínio

Você tem duas abordagens principais:

---

## Opção 1: Túnel (rápido, para testes)

Serve para **mostrar o site local na internet** sem fazer deploy. O computador precisa ficar ligado e o app rodando.

### A) Cloudflare Tunnel (grátis, recomendado)

1. Crie conta em [Cloudflare](https://cloudflare.com) (se ainda não tiver).
2. Instale o **cloudflared**:
   - Windows: baixe em https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   - Ou com winget: `winget install Cloudflare.cloudflared`
3. Com o seu site rodando localmente (`npm run dev`), em outro terminal:
   ```powershell
   cloudflared tunnel --url http://localhost:3000
   ```
4. O comando vai exibir uma URL pública (ex: `https://xxxxx.trycloudflare.com`). Qualquer pessoa pode acessar.
5. **Usar seu domínio**: no painel da Cloudflare, crie um túnel nomeado e aponte um subdomínio (ex: `app.seudominio.com.br`) para `http://localhost:3000`. A documentação está em: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

### B) ngrok

1. Crie conta em [ngrok](https://ngrok.com) e instale o cliente.
2. Com o site rodando:
   ```powershell
   ngrok http 3000
   ```
3. Use a URL gerada (ex: `https://abc123.ngrok.io`).
4. Na conta paga do ngrok você pode usar um subdomínio customizado com seu domínio.

**Limitação**: enquanto usar túnel, o site só fica no ar com seu PC ligado e o servidor local rodando.

---

## Opção 2: Deploy em produção (recomendado para uso contínuo)

Para ter o site **sempre no ar** com seu domínio, o ideal é fazer **deploy** e depois **apontar o domínio** para o serviço.

Seu projeto já tem `vercel.json`, então o caminho mais simples é usar **Vercel**.

### Passo a passo na Vercel

#### 1. Preparar o projeto

- Banco de dados: use um banco na nuvem (ex: [Neon](https://neon.tech), [PlanetScale](https://planetscale.com) ou Supabase). Não use SQLite/arquivo local em produção.
- Variáveis de ambiente: anote tudo que está no `.env` (DATABASE_URL, Stripe, NextAuth, email, etc.) para configurar na Vercel.

#### 2. Deploy na Vercel

1. Crie conta em [Vercel](https://vercel.com) e conecte seu repositório GitHub/GitLab/Bitbucket.
2. Importe o projeto **clickcannabis-replica**.
3. Na hora do deploy:
   - **Framework Preset**: Next.js (deve ser detectado).
   - **Build Command**: `prisma generate && next build` (ou use o script `build` do `package.json`).
   - **Output Directory**: deixe o padrão.
4. Em **Environment Variables**, adicione **todas** as variáveis do `.env` (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, Stripe, etc.).
5. Para **NEXTAUTH_URL** em produção, use depois a URL do seu domínio (ex: `https://seudominio.com.br`).
6. Faça o deploy. A Vercel vai te dar uma URL tipo `seu-projeto.vercel.app`.

#### 3. Conectar seu domínio na Vercel

1. No projeto na Vercel: **Settings** → **Domains**.
2. Clique em **Add** e digite seu domínio (ex: `seudominio.com.br` ou `app.seudominio.com.br`).
3. A Vercel vai mostrar o que configurar no seu **registro de domínio** (onde você comprou o domínio):

   **Se usar os nameservers da Vercel (ou da Cloudflare apontando para Vercel):**
   - Ela pode pedir para você criar registros **A** e **CNAME** ou só **CNAME**.
   - Valores típicos:
     - **A**: `76.76.21.21`
     - **CNAME** (para `www` ou subdomínio): `cname.vercel-dns.com`

   **No painel do seu provedor de domínio** (Registro.br, GoDaddy, Hostinger, etc.):
   - Crie um registro **A** com nome `@` (ou o subdomínio) apontando para `76.76.21.21`.
   - Para `www`: CNAME de `www` para `cname.vercel-dns.com`.
   - Ou siga exatamente o que a Vercel mostrar em **Domains** (ela indica host e valor).

4. Aguarde a propagação do DNS (alguns minutos até 48 horas). A Vercel ativa SSL (HTTPS) automaticamente.

#### 4. Ajustes finais

- Atualize **NEXTAUTH_URL** nas variáveis de ambiente da Vercel para `https://seudominio.com.br` (ou a URL que você escolheu).
- Se usar Stripe, WhatsApp, email, etc., confira se as URLs de callback/whitelist estão com o novo domínio.
- Faça um novo deploy se precisar após mudar variáveis.

---

## Resumo

| Objetivo              | Solução              | Domínio próprio      |
|-----------------------|----------------------|----------------------|
| Testar com alguém fora | Cloudflare Tunnel ou ngrok | Opcional (Cloudflare permite) |
| Site sempre no ar     | Deploy na Vercel     | Sim, em Settings → Domains |

Para **uso sério e contínuo**, use a **Opção 2 (Vercel + domínio)**. A Opção 1 (túnel) é ideal para demonstrações rápidas com o site rodando na sua máquina.

Se disser em qual registro você comprou o domínio (Registro.br, GoDaddy, etc.), dá para detalhar os cliques exatos na tela de DNS.
