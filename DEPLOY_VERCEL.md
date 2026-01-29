# 🚀 Deploy na Vercel - Guia Passo a Passo

A Vercel é a plataforma recomendada para projetos Next.js, oferecendo deploy automático, SSL grátis e CDN global.

---

## 📋 Pré-requisitos

- Conta no GitHub (ou GitLab/Bitbucket)
- Projeto commitado no Git
- Banco PostgreSQL configurado
- Variáveis de ambiente preparadas

---

## 🎯 Passo a Passo

### 1. Preparar o Projeto

#### 1.1 Verificar build local

```bash
# Instalar dependências
npm install

# Testar build
npm run build

# Se houver erros, corrigir antes de fazer deploy
```

#### 1.2 Commit no Git

```bash
# Verificar status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "Preparar para produção"

# Push (se ainda não fez)
git push origin main
```

---

### 2. Criar Conta na Vercel

1. Acesse https://vercel.com
2. Clique em "Sign Up"
3. Escolha "Continue with GitHub" (recomendado)
4. Autorize a Vercel a acessar seus repositórios

---

### 3. Conectar Projeto

1. No dashboard da Vercel, clique em "Add New Project"
2. Selecione seu repositório do GitHub
3. Configure o projeto:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build` (padrão)
   - **Output Directory**: `.next` (padrão)
   - **Install Command**: `npm install` (padrão)

4. Clique em "Deploy"

---

### 4. Configurar Variáveis de Ambiente

**⚠️ IMPORTANTE**: Configure ANTES do primeiro deploy ou após o primeiro deploy falhar.

1. No dashboard do projeto, vá em **Settings** → **Environment Variables**
2. Adicione cada variável:

#### Variáveis Obrigatórias:

```
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
NODE_ENV=production
NEXT_PUBLIC_APP_URL
```

#### Variáveis Opcionais (se usar):

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
WHATSAPP_API_KEY
WHATSAPP_PHONE_NUMBER
GOOGLE_MEET_API_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
AWS_REGION
SENTRY_DSN
NEXT_PUBLIC_GA_ID
```

3. Para cada variável:
   - **Name**: Nome da variável (ex: `DATABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Selecione "Production" (e "Preview" se quiser)

4. Clique em "Save"

---

### 5. Configurar Build Settings

1. Vá em **Settings** → **General**
2. Verifique:
   - **Node.js Version**: 18.x ou superior
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

---

### 6. Deploy

#### Opção A: Deploy Automático (Recomendado)

1. Faça push para a branch `main` (ou `master`)
2. A Vercel detecta automaticamente e faz deploy
3. Acompanhe o progresso no dashboard

#### Opção B: Deploy Manual

1. No dashboard, clique em "Deployments"
2. Clique em "Redeploy" no último deployment
3. Ou use a CLI:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

### 7. Configurar Domínio

#### 7.1 Domínio Grátis da Vercel

1. Vá em **Settings** → **Domains**
2. Você terá um domínio grátis: `seu-projeto.vercel.app`
3. Já está funcionando! ✅

#### 7.2 Domínio Customizado

1. Compre um domínio (Registro.br, GoDaddy, etc.)
2. Na Vercel, vá em **Settings** → **Domains**
3. Clique em "Add Domain"
4. Digite seu domínio (ex: `seudominio.com.br`)
5. Siga as instruções de DNS:

**Para domínio raiz (`seudominio.com.br`):**
- Tipo: `A`
- Nome: `@`
- Valor: `76.76.21.21`

**Para subdomínio (`www.seudominio.com.br`):**
- Tipo: `CNAME`
- Nome: `www`
- Valor: `cname.vercel-dns.com`

6. Aguarde propagação DNS (pode levar até 48h, geralmente 1-2h)
7. SSL será configurado automaticamente ✅

---

### 8. Configurar Prisma em Produção

A Vercel precisa gerar o Prisma Client durante o build.

#### 8.1 Adicionar Script de Build

No `package.json`, certifique-se de ter:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

#### 8.2 Ou usar Build Command na Vercel

No dashboard, em **Settings** → **General** → **Build & Development Settings**:

```
Build Command: npx prisma generate && npm run build
```

---

### 9. Verificar Deploy

1. Acesse seu domínio
2. Teste funcionalidades principais:
   - [ ] Homepage carrega
   - [ ] Login funciona
   - [ ] APIs respondem
   - [ ] Banco de dados conectado
   - [ ] Imagens carregam

---

### 10. Configurar Webhooks (Stripe, etc.)

Se usar webhooks (ex: Stripe):

1. No dashboard da Vercel, vá em **Settings** → **Deploy Hooks**
2. Crie um webhook para produção
3. Configure no serviço externo (Stripe, etc.) com a URL:
   ```
   https://seudominio.com.br/api/payments/webhook
   ```

---

## 🔄 Deploy Automático

A Vercel faz deploy automático quando você faz push para a branch principal.

### Workflow Recomendado:

1. **Desenvolvimento**: Trabalhe em branch `develop`
2. **Teste**: Deploy automático em preview para `develop`
3. **Produção**: Merge `develop` → `main` = Deploy automático em produção

---

## 📊 Monitoramento

### Logs

1. No dashboard, vá em **Deployments**
2. Clique em um deployment
3. Veja logs de build e runtime

### Analytics

1. Vá em **Analytics** (plano Pro ou superior)
2. Veja métricas de performance

---

## 🆘 Troubleshooting

### Erro: "Build failed"

**Causa comum**: Prisma Client não gerado

**Solução**:
```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Ou configure Build Command na Vercel:
```
npx prisma generate && npm run build
```

### Erro: "Database connection failed"

**Causa**: `DATABASE_URL` não configurada ou incorreta

**Solução**:
1. Verifique variáveis de ambiente na Vercel
2. Teste a connection string localmente
3. Verifique se o banco permite conexões externas

### Erro: "NEXTAUTH_SECRET missing"

**Solução**: Adicione `NEXTAUTH_SECRET` nas variáveis de ambiente

### Deploy lento

**Causas**:
- Dependências grandes
- Build sem cache

**Soluções**:
- Use `.vercelignore` para excluir arquivos desnecessários
- Configure cache de build na Vercel

---

## ✅ Checklist Final

- [ ] Projeto commitado no Git
- [ ] Build local funcionando
- [ ] Conta Vercel criada
- [ ] Projeto conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Build settings configurados
- [ ] Deploy realizado
- [ ] Domínio configurado (se aplicável)
- [ ] SSL funcionando
- [ ] Site acessível
- [ ] Funcionalidades testadas
- [ ] Webhooks configurados (se necessário)

---

## 📚 Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

---

**Última atualização**: Janeiro 2026
