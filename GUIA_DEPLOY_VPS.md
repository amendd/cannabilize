# Guia: Deploy do projeto em VPS

Passo a passo para colocar o **ClickCannabis** no ar em uma VPS (servidor próprio), com Node.js, PostgreSQL, Nginx, SSL e cron jobs.

---

## Visão geral

| Etapa | O que faz |
|-------|-----------|
| 1 | Contratar VPS e acessar por SSH |
| 2 | Instalar Node.js 18+, PostgreSQL, Nginx, PM2 |
| 3 | Configurar PostgreSQL e trocar Prisma para PostgreSQL |
| 4 | Clonar o projeto, build e variáveis de ambiente |
| 5 | Rodar a app com PM2 e configurar Nginx (reverse proxy) |
| 6 | SSL com Let's Encrypt (HTTPS) |
| 7 | Configurar crons (lembretes de e-mail e WhatsApp) |

**Requisitos mínimos da VPS:** 1 GB RAM, 1 vCPU, 25 GB disco (recomendado 2 GB RAM para produção).

---

## 1. Escolher e criar a VPS

### Provedores sugeridos

- **DigitalOcean** – [digitalocean.com](https://www.digitalocean.com) – Droplet Ubuntu 22.04, ~US$ 6/mês (1 GB).
- **Vultr** – [vultr.com](https://www.vultr.com) – mesmo tipo de plano, preço similar.
- **Hetzner** – [hetzner.com](https://www.hetzner.com) – mais barato na Europa; tem datacenter no Brasil (Beta).
- **Contabo** – [contabo.com](https://contabo.com) – VPS barata, bom para testes.

Crie uma VPS com:
- **Sistema:** Ubuntu 22.04 LTS
- **Plano:** pelo menos 1 GB RAM (2 GB é melhor para produção)
- **Região:** mais próxima dos seus usuários (ex.: São Paulo se disponível)

Anote o **IP público** e use a chave SSH ou a senha que o provedor enviar.

---

## 2. Acessar a VPS e atualizar o sistema

No seu PC (PowerShell ou terminal):

```bash
ssh root@SEU_IP
# ou: ssh ubuntu@SEU_IP  (se a imagem criar usuário ubuntu)
```

Dentro do servidor:

```bash
apt update && apt upgrade -y
```

---

## 3. Instalar Node.js 20 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # deve mostrar v20.x
npm -v
```

---

## 4. Instalar PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

Criar usuário e banco para a aplicação (troque `sua_senha_forte` e `clickcannabis` se quiser):

```bash
sudo -u postgres psql -c "CREATE USER clickcannabis WITH PASSWORD 'sua_senha_forte';"
sudo -u postgres psql -c "CREATE DATABASE clickcannabis OWNER clickcannabis;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE clickcannabis TO clickcannabis;"
```

**Connection string** (guarde para o `.env`):

```text
DATABASE_URL="postgresql://clickcannabis:sua_senha_forte@localhost:5432/clickcannabis"
```

Se a senha tiver caracteres especiais (`@`, `#`, `%`), use URL encode (ex.: `@` → `%40`).

---

## 5. Instalar Nginx e PM2

```bash
apt install -y nginx
npm install -g pm2
```

PM2 vai manter o Next.js rodando e reiniciar se cair.

---

## 6. Clonar o projeto e preparar o build

Escolha um diretório (ex.: `/var/www`) e clone o repositório (troque pela URL do seu repositório):

```bash
apt install -y git
mkdir -p /var/www
cd /var/www
git clone https://github.com/SEU_USUARIO/clickcannabis-replica.git
cd clickcannabis-replica
```

### 6.1 Trocar Prisma para PostgreSQL

Edite o arquivo `prisma/schema.prisma` e altere o datasource:

**De:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Para:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 6.2 Arquivo `.env` na VPS

Crie o arquivo de ambiente em produção (nunca commite esse arquivo):

```bash
nano /var/www/clickcannabis-replica/.env
```

Preencha com as variáveis necessárias. Exemplo mínimo (ajuste com seus valores reais):

```env
# Banco (PostgreSQL local na VPS)
DATABASE_URL="postgresql://clickcannabis:sua_senha_forte@localhost:5432/clickcannabis"

# NextAuth – use o domínio final (ex.: https://seudominio.com.br)
NEXTAUTH_URL=https://seudominio.com.br
NEXTAUTH_SECRET=gere_um_secret_longo_e_aleatorio

# URLs públicas (mesmo domínio)
SITE_PUBLIC_URL=https://seudominio.com.br
APP_URL=https://seudominio.com.br
NEXT_PUBLIC_APP_URL=https://seudominio.com.br

# Cron – senha para proteger as rotas de lembrete (crontab vai usar)
CRON_SECRET=outra_senha_longa_aleatoria
# Se usar scripts/cron-call.sh no crontab, use:
BASE_URL=http://127.0.0.1:3000

# E-mail (SMTP ou Resend), Stripe, WhatsApp, etc. – copie do seu .env.local
# SMTP_* ou RESEND_API_KEY, STRIPE_*, TWILIO_*, etc.
```

Para gerar segredos no servidor:

```bash
openssl rand -base64 32
```

### 6.3 Instalar dependências, gerar Prisma e rodar migrações

```bash
cd /var/www/clickcannabis-replica
npm ci
npx prisma generate
npx prisma migrate deploy
# Se não houver migrações: npx prisma db push
# Opcional: npm run db:seed
```

### 6.4 Build da aplicação

```bash
npm run build
```

Se der erro, corrija (dependências, variáveis obrigatórias) antes de seguir.

---

## 7. Rodar a aplicação com PM2

```bash
cd /var/www/clickcannabis-replica
pm2 start npm --name "clickcannabis" -- start
pm2 save
pm2 startup
```

O comando `start` do `package.json` usa `next start -p ${PORT:-3000}`, então a app fica na porta **3000** por padrão. PM2 mantém o processo ativo e reinicia em caso de falha.

Verificar:

```bash
pm2 status
pm2 logs clickcannabis
```

---

## 8. Nginx como reverse proxy

Nginx recebe nas portas 80/443 e repassa para o Next.js na porta 3000.

Crie o site (troque `seudominio.com.br` pelo seu domínio):

```bash
nano /etc/nginx/sites-available/clickcannabis
```

Conteúdo (ajuste o `server_name`):

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Ativar e testar:

```bash
ln -s /etc/nginx/sites-available/clickcannabis /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Aponte o **DNS** do domínio para o IP da VPS (registro A para `seudominio.com.br` e `www`). Depois de propagar, acesse `http://seudominio.com.br` e confira se a aplicação abre.

---

## 9. SSL com Let's Encrypt (HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

Siga as perguntas (e-mail, aceitar termos). O Certbot configura o Nginx para HTTPS e renova o certificado automaticamente.

Reinicie o Nginx se precisar:

```bash
systemctl reload nginx
```

Atualize o `.env` para usar **https** em todas as URLs (NEXTAUTH_URL, SITE_PUBLIC_URL, APP_URL, NEXT_PUBLIC_APP_URL) e reinicie a app:

```bash
pm2 restart clickcannabis
```

---

## 10. Cron jobs (lembretes de e-mail e WhatsApp)

Na VPS os crons da Vercel não rodam; é preciso chamar as suas APIs pelo **crontab**, com o header `Authorization: Bearer CRON_SECRET`.

Defina uma variável com o secret (mesmo valor do `.env`):

```bash
nano /var/www/clickcannabis-replica/cron-env.sh
```

Conteúdo (troque pelo seu `CRON_SECRET`):

```bash
export CRON_SECRET="outra_senha_longa_aleatoria"
export BASE_URL="http://127.0.0.1:3000"
```

Salve e dê permissão:

```bash
chmod +x /var/www/clickcannabis-replica/cron-env.sh
```

Abrir o crontab do usuário que roda a app (ex.: root ou um usuário dedicado):

```bash
crontab -e
```

Adicione as linhas abaixo (ajuste o caminho de `cron-env.sh` e `CRON_SECRET`/BASE_URL se mudar). Os horários seguem a mesma lógica do seu `vercel.json`:

```cron
# Carregar CRON_SECRET e BASE_URL
SHELL=/bin/bash
BASH_ENV=/var/www/clickcannabis-replica/cron-env.sh

# Lembretes de e-mail (tipos como na Vercel)
0 */6 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/admin/email/reminders?type=24H" > /dev/null 2>&1
*/30 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/admin/email/reminders?type=2H" > /dev/null 2>&1
*/20 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/admin/email/reminders?type=1H" > /dev/null 2>&1
*/5 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/admin/email/reminders?type=10MIN" > /dev/null 2>&1
*/15 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/admin/email/reminders?type=NOW" > /dev/null 2>&1

# Lembretes de pagamento (uma vez ao dia, 9h)
0 9 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/send-payment-reminders?window=24H" > /dev/null 2>&1

# WhatsApp follow-up (a cada minuto, como no vercel.json)
* * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/whatsapp-follow-up" > /dev/null 2>&1
```

### Opção B: Script wrapper (mais confiável)

O projeto inclui `scripts/cron-call.sh`, que lê `CRON_SECRET` e `BASE_URL` do `.env` e chama a URL. Na VPS:

```bash
chmod +x /var/www/clickcannabis-replica/scripts/cron-call.sh
```

No `crontab -e` (sem depender de BASH_ENV):

```cron
*/15 * * * * /var/www/clickcannabis-replica/scripts/cron-call.sh "GET" "/api/admin/email/reminders?type=NOW"
*/5 * * * * /var/www/clickcannabis-replica/scripts/cron-call.sh "GET" "/api/admin/email/reminders?type=10MIN"
*/20 * * * * /var/www/clickcannabis-replica/scripts/cron-call.sh "GET" "/api/admin/email/reminders?type=1H"
*/30 * * * * /var/www/clickcannabis-replica/scripts/cron-call.sh "GET" "/api/admin/email/reminders?type=2H"
0 */6 * * * /var/www/clickcannabis-replica/scripts/cron-call.sh "GET" "/api/admin/email/reminders?type=24H"
0 9 * * * /var/www/clickcannabis-replica/scripts/cron-call.sh "GET" "/api/cron/send-payment-reminders?window=24H"
* * * * * /var/www/clickcannabis-replica/scripts/cron-call.sh "GET" "/api/cron/whatsapp-follow-up"
```

Assim o secret fica só no `.env` e o cron não precisa de `cron-env.sh`.

---

## 11. Atualizar o projeto (deploy contínuo)

Quando fizer alterações no código:

```bash
cd /var/www/clickcannabis-replica
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart clickcannabis
```

Opcional: criar um script `deploy.sh` com esses comandos e rodar `./deploy.sh` após cada `git push`.

---

## 12. Firewall (recomendado)

Deixar só SSH (22), HTTP (80) e HTTPS (443) abertos:

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
ufw status
```

---

## Checklist rápido

- [ ] VPS criada (Ubuntu 22.04), IP anotado
- [ ] Node 20, PostgreSQL, Nginx, PM2 instalados
- [ ] Banco e usuário PostgreSQL criados, `DATABASE_URL` no `.env`
- [ ] Prisma alterado para `postgresql`, migrações rodadas
- [ ] `.env` completo (NEXTAUTH_*, CRON_SECRET, e-mail, Stripe, WhatsApp, etc.)
- [ ] `npm run build` OK
- [ ] PM2 rodando `npm start`, `pm2 save` e `pm2 startup`
- [ ] Nginx configurado (proxy para porta 3000), DNS apontando para o IP
- [ ] Certbot/SSL ativo para o domínio
- [ ] Crontab configurado com `CRON_SECRET` e chamadas às APIs de lembrete
- [ ] UFW ativo (22, 80, 443)

---

## Opcional: Coolify

Se quiser gerenciar deploy, SSL e ambiente por interface web, pode instalar [Coolify](https://coolify.io) na mesma VPS (ou em outra). O Coolify ajuda a fazer deploy a partir do Git, definir variáveis de ambiente e configurar HTTPS, mas o passo a passo acima já deixa o projeto no ar sem ele.

---

## Problemas comuns

- **502 Bad Gateway:** Next.js não está rodando ou não está na porta 3000. Verifique `pm2 status` e `pm2 logs clickcannabis`.
- **Erro de banco ao subir:** Confirme `DATABASE_URL`, que o PostgreSQL está ativo (`systemctl status postgresql`) e que as migrações rodaram.
- **Crons não disparam:** Confira `crontab -l`, o caminho de `cron-env.sh` e se `CRON_SECRET` está igual ao do `.env`. Teste manualmente: `curl -H "Authorization: Bearer SEU_CRON_SECRET" http://127.0.0.1:3000/api/admin/email/reminders?type=NOW`.

Se disser em qual etapa você está (por exemplo: “já tenho a VPS e instalei Node”), posso detalhar só essa parte ou montar um script único de instalação para você rodar no servidor.
