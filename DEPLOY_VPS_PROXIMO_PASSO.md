# Próximo passo: clonar projeto, configurar e buildar na VPS

Siga **na ordem**, conectado na VPS por SSH (`CONECTAR_VPS_Executar.bat` ou `ssh root@5.189.168.66`).

---

## Passo 1: Clonar o repositório

O projeto precisa estar em um repositório Git (GitHub, GitLab, etc.) para clonar na VPS.

### 1.1 Se o projeto já está no GitHub (público ou privado)

**Público:** use a URL do repositório.
**Privado:** use uma URL com token ou configure chave SSH no servidor.

Na VPS, rode (troque pela URL real do seu repositório):

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/SEU_USUARIO/clickcannabis-replica.git
cd clickcannabis-replica
```

Exemplo com token (repositório privado):
```bash
git clone https://SEU_TOKEN@github.com/SEU_USUARIO/clickcannabis-replica.git
```

Se ainda **não** subiu o projeto para o GitHub:
1. No seu PC, na pasta do projeto: crie um repositório no GitHub e rode `git remote add origin https://github.com/SEU_USUARIO/clickcannabis-replica.git` e `git push -u origin main` (ou master).
2. Depois use essa URL no `git clone` na VPS.

---

## Passo 2: Trocar o Prisma de SQLite para PostgreSQL

Na VPS, dentro da pasta do projeto:

```bash
cd /var/www/clickcannabis-replica
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
```

Conferir (deve mostrar `postgresql`):
```bash
grep provider prisma/schema.prisma
```

---

## Passo 3: Criar o arquivo `.env`

### 3.1 Gerar segredos

Rode duas vezes e **anote** cada resultado (use no próximo passo):

```bash
openssl rand -base64 32
openssl rand -base64 32
```

### 3.2 Criar o arquivo `.env`

```bash
nano /var/www/clickcannabis-replica/.env
```

Cole o conteúdo abaixo e **ajuste**:

- Substitua `PRIMEIRO_SECRET_GERADO` e `SEGUNDO_SECRET_GERADO` pelos dois valores do `openssl rand -base64 32`.
- Por enquanto use o **IP da VPS** nas URLs (depois que tiver domínio, troque por `https://seudominio.com.br`).
- A `DATABASE_URL` já está com usuário `ucannabilize`, banco `bdcannabilize` e a senha que você definiu.

```env
# Banco PostgreSQL (VPS)
DATABASE_URL="postgresql://ucannabilize:mm5d98U4UHYcBxuXKk@localhost:5432/bdcannabilize"

# NextAuth – use o IP por enquanto; quando tiver domínio, troque por https://seudominio.com.br
NEXTAUTH_URL=http://5.189.168.66:3000
NEXTAUTH_SECRET=PRIMEIRO_SECRET_GERADO

# URLs públicas (mesmo valor; quando tiver domínio use https://seudominio.com.br)
SITE_PUBLIC_URL=http://5.189.168.66:3000
APP_URL=http://5.189.168.66:3000
NEXT_PUBLIC_APP_URL=http://5.189.168.66:3000

# Cron (lembretes por e-mail/WhatsApp)
CRON_SECRET=SEGUNDO_SECRET_GERADO
BASE_URL=http://127.0.0.1:3000
```

Salvar no `nano`: **Ctrl+O**, Enter, depois **Ctrl+X**.

---

## Passo 4: Instalar dependências e gerar o Prisma

```bash
cd /var/www/clickcannabis-replica
npm ci
npx prisma generate
```

Se `npm ci` der erro de rede ou timeout, tente: `npm install`.

---

## Passo 5: Criar as tabelas no banco (PostgreSQL)

As migrações atuais do projeto foram feitas para **SQLite**. No PostgreSQL use **db push** (não use `migrate deploy`):

```bash
npx prisma db push
```

Deve aparecer algo como: “Your database is now in sync with your schema.”

Se der erro de permissão, confira usuário/senha e que o banco `bdcannabilize` existe (você já criou).

---

## Passo 6: Build da aplicação

```bash
npm run build
```

Pode levar alguns minutos. Se aparecer erro:
- De variável de ambiente: confira o `.env` (NEXTAUTH_URL, etc.).
- De TypeScript/Prisma: anote a mensagem e corrija conforme indicado.

---

## Passo 7: Subir a aplicação com PM2

```bash
cd /var/www/clickcannabis-replica
pm2 start npm --name "clickcannabis" -- start
pm2 save
pm2 startup
```

Se `pm2 startup` mostrar um comando (ex.: `sudo env PATH=...`), **copie e rode** esse comando para o app iniciar após reinício do servidor.

Conferir:
```bash
pm2 status
pm2 logs clickcannabis --lines 30
```

---

## Passo 8: Testar no navegador

Abra no seu PC:

**http://5.189.168.66:3000**

Se a página do site abrir, o deploy deste passo está ok. Depois você configura o **Nginx** (porta 80) e **SSL** (HTTPS) quando tiver domínio.

---

## Resumo da ordem dos comandos (copiar/colar em blocos)

```bash
# 1) Clone (troque a URL pelo seu repositório)
mkdir -p /var/www && cd /var/www
git clone https://github.com/SEU_USUARIO/clickcannabis-replica.git
cd clickcannabis-replica

# 2) Prisma PostgreSQL
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 3) .env – criar com nano (cole o conteúdo do Passo 3.2, edite os secrets e salve)
nano .env

# 4) Dependências e schema
npm ci
npx prisma generate
npx prisma db push
npm run build

# 5) PM2
pm2 start npm --name "clickcannabis" -- start
pm2 save
pm2 startup
```

---

## Problemas comuns

| Erro | O que fazer |
|------|-------------|
| `git clone` pede usuário/senha ou falha em privado | Use URL com token ou configure chave SSH na VPS. |
| `npm ci` muito lento ou timeout | Rode `npm install` ou verifique firewall/proxy. |
| `prisma db push` – “Permission denied” ou “role does not exist” | Confira usuário `ucannabilize`, senha e banco `bdcannabilize` no `.env`. |
| `npm run build` – “NEXTAUTH_SECRET is not set” | Garanta que o `.env` existe e tem `NEXTAUTH_SECRET` e `NEXTAUTH_URL`. |
| Site não abre em http://5.189.168.66:3000 | Verifique `pm2 status` e `pm2 logs clickcannabis`; confira se a porta 3000 está liberada (firewall). |

Quando terminar até o Passo 8, você pode seguir com Nginx (porta 80) e SSL no **GUIA_DEPLOY_VPS.md** (seções 8 e 9).
