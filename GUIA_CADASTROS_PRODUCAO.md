# 📋 Guia Completo de Cadastros para Produção

Este documento lista **TODOS os cadastros e informações** que você precisa fazer e guardar para quando for colocar o projeto em produção. Guarde este arquivo em local seguro!

---

## 🎯 Índice

1. [Hospedagem e Infraestrutura](#1-hospedagem-e-infraestrutura)
2. [Banco de Dados](#2-banco-de-dados)
3. [Autenticação (NextAuth)](#3-autenticação-nextauth)
4. [Pagamentos (Stripe)](#4-pagamentos-stripe)
5. [Email (Resend/SMTP)](#5-email-resendsmtp)
6. [WhatsApp (Twilio) - Opcional](#6-whatsapp-twilio---opcional)
7. [Telemedicina (Google Meet/Zoom) - Opcional](#7-telemedicina-google-meetzoom---opcional)
8. [Upload de Arquivos (AWS S3) - Opcional](#8-upload-de-arquivos-aws-s3---opcional)
9. [Segurança (reCAPTCHA) - Recomendado](#9-segurança-recaptcha---recomendado)
10. [Monitoramento - Opcional](#10-monitoramento---opcional)
11. [Domínio e DNS](#11-domínio-e-dns)
12. [Checklist Final](#12-checklist-final)

---

## 1. Hospedagem e Infraestrutura

### ✅ Obrigatório: Escolher plataforma de hospedagem

**Recomendado: Vercel** (gratuito para começar, otimizado para Next.js)

**O que você precisa:**
- [ ] Criar conta na Vercel: https://vercel.com
- [ ] Conectar com GitHub/GitLab (onde está o código)
- [ ] **Guardar:** Email da conta Vercel
- [ ] **Guardar:** Nome do projeto na Vercel

**Alternativas:**
- Railway (https://railway.app)
- Render (https://render.com)
- DigitalOcean App Platform

---

## 2. Banco de Dados

### ✅ Obrigatório: PostgreSQL (NÃO usar SQLite em produção!)

**Opções recomendadas:**

#### Opção 1: Supabase (Recomendado - Grátis até 500MB)
- [ ] Criar conta: https://supabase.com
- [ ] Criar novo projeto
- [ ] **Guardar:**
  - `DATABASE_URL` completa (exemplo: `postgresql://postgres.xxxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require`)
  - Senha do banco de dados
  - Host/URL do projeto
  - Email da conta Supabase

#### Opção 2: Neon (Grátis até 3GB, Serverless)
- [ ] Criar conta: https://neon.tech
- [ ] Criar banco de dados
- [ ] **Guardar:**
  - `DATABASE_URL` completa
  - Senha do banco
  - Email da conta Neon

#### Opção 3: Railway (Grátis até $5/mês)
- [ ] Criar conta: https://railway.app
- [ ] Criar banco PostgreSQL
- [ ] **Guardar:**
  - `DATABASE_URL` completa
  - Senha do banco
  - Email da conta Railway

**⚠️ IMPORTANTE:**
- A URL deve incluir `?sslmode=require` para conexão segura
- Guarde a senha em local seguro (gerenciador de senhas)
- Faça backup regular do banco

---

## 3. Autenticação (NextAuth)

### ✅ Obrigatório

**O que você precisa gerar:**

1. **NEXTAUTH_SECRET** (Secret aleatório de 32+ caracteres)
   - **Como gerar:**
     ```bash
     # No terminal:
     openssl rand -base64 32
     
     # Ou online:
     https://generate-secret.vercel.app/32
     ```
   - **Guardar:** O secret gerado (exemplo: `aBc123XyZ...`)

2. **NEXTAUTH_URL** (URL do site em produção)
   - **Guardar:** URL completa (exemplo: `https://seudominio.com.br`)
   - Se usar Vercel, será algo como: `https://seu-projeto.vercel.app`

3. **NEXT_PUBLIC_APP_URL** (Mesma URL do site)
   - **Guardar:** Mesma URL de `NEXTAUTH_URL`

**⚠️ IMPORTANTE:**
- Use um secret DIFERENTE para cada ambiente (dev, staging, prod)
- Nunca compartilhe o secret publicamente
- Guarde em local seguro

---

## 4. Pagamentos (Stripe)

### ✅ Obrigatório se usar pagamentos online

**O que você precisa fazer:**

1. **Criar conta no Stripe:**
   - [ ] Acesse: https://stripe.com
   - [ ] Criar conta (pode começar com modo teste)
   - [ ] **Guardar:** Email da conta Stripe
   - [ ] **Guardar:** Senha da conta Stripe

2. **Ativar conta de produção:**
   - [ ] Preencher dados da empresa (CNPJ, endereço, etc.)
   - [ ] Verificar identidade (documentos)
   - [ ] Configurar conta bancária para recebimentos

3. **Obter chaves de PRODUÇÃO:**
   - [ ] Acessar Dashboard → Developers → API Keys
   - [ ] **Guardar:**
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (começa com `pk_live_...`)
     - `STRIPE_SECRET_KEY` (começa com `sk_live_...`)

4. **Configurar Webhook:**
   - [ ] Dashboard → Developers → Webhooks
   - [ ] Adicionar endpoint: `https://seudominio.com.br/api/payments/webhook`
   - [ ] Selecionar eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - [ ] **Guardar:** `STRIPE_WEBHOOK_SECRET` (começa com `whsec_...`)

**⚠️ IMPORTANTE:**
- NÃO use chaves de teste (`pk_test_`, `sk_test_`) em produção
- Guarde as chaves secretas em local seguro
- O webhook secret é diferente para cada endpoint

---

## 5. Email (Resend/SMTP)

### ✅ Obrigatório para envio de emails (confirmações, lembretes)

**Opção 1: Resend (Recomendado - Grátis 3.000 emails/mês)**

1. **Criar conta:**
   - [ ] Acesse: https://resend.com/signup
   - [ ] Criar conta gratuita
   - [ ] **Guardar:** Email da conta Resend
   - [ ] **Guardar:** Senha da conta Resend

2. **Obter API Key:**
   - [ ] Dashboard → API Keys → Create API Key
   - [ ] **Guardar:** `RESEND_API_KEY` (formato: `re_xxxxx`)

3. **Verificar domínio (opcional, mas recomendado):**
   - [ ] Adicionar domínio (ex: `seudominio.com.br`)
   - [ ] Configurar registros DNS conforme instruções
   - [ ] **Guardar:** Domínio verificado

4. **Configurar no sistema:**
   - [ ] Acessar painel admin: `/admin/email`
   - [ ] Ativar provedor "Resend"
   - [ ] Preencher API Key
   - [ ] Configurar email remetente (ex: `noreply@seudominio.com`)

**Opção 2: SMTP (Gmail, SendGrid, etc.)**

Se preferir usar SMTP direto:

- [ ] **Gmail:**
  - Criar "Senha de App" (não usar senha normal)
  - **Guardar:** `SMTP_HOST=smtp.gmail.com`
  - **Guardar:** `SMTP_PORT=587`
  - **Guardar:** `SMTP_USER=seu-email@gmail.com`
  - **Guardar:** `SMTP_PASSWORD=senha-do-app`
  - **Guardar:** `SMTP_FROM=noreply@seudominio.com`

- [ ] **SendGrid:**
  - Criar conta: https://sendgrid.com
  - Obter API Key
  - **Guardar:** API Key do SendGrid

**⚠️ IMPORTANTE:**
- Resend é mais fácil e recomendado para começar
- Gmail tem limite de 500 emails/dia
- Guarde as credenciais em local seguro

---

## 6. WhatsApp (Twilio) - Opcional

### ⚠️ Opcional: Se quiser enviar notificações via WhatsApp

**O que você precisa fazer:**

1. **Criar conta no Twilio:**
   - [ ] Acesse: https://www.twilio.com
   - [ ] Criar conta gratuita
   - [ ] **Guardar:** Email da conta Twilio
   - [ ] **Guardar:** Senha da conta Twilio

2. **Ativar WhatsApp Sandbox (para testes):**
   - [ ] Console → Messaging → Try it out → Send a WhatsApp message
   - [ ] Seguir instruções para adicionar número ao sandbox
   - [ ] **Guardar:** Número do sandbox (ex: `+1 415 523 8886`)

3. **Obter credenciais:**
   - [ ] Dashboard → Account Info
   - [ ] **Guardar:** `TWILIO_ACCOUNT_SID` (Account SID)
   - [ ] **Guardar:** `TWILIO_AUTH_TOKEN` (Auth Token)

4. **Configurar número WhatsApp (produção):**
   - [ ] Solicitar número WhatsApp Business (pago)
   - [ ] Ou usar sandbox para testes
   - [ ] **Guardar:** Número no formato `whatsapp:+5511999999999`

5. **Configurar no sistema:**
   - [ ] Acessar painel admin: `/admin/whatsapp`
   - [ ] Preencher Account SID, Auth Token e Número
   - [ ] Testar envio

**⚠️ IMPORTANTE:**
- Sandbox é gratuito mas limitado (apenas números cadastrados)
- Produção requer número WhatsApp Business (pago)
- Guarde as credenciais em local seguro

---

## 7. Telemedicina (Google Meet/Zoom) - Opcional

### ⚠️ Opcional: Se quiser criar links de vídeo automaticamente

**Opção 1: Google Meet**

1. **Criar projeto no Google Cloud:**
   - [ ] Acesse: https://console.cloud.google.com
   - [ ] Criar novo projeto
   - [ ] **Guardar:** Nome do projeto
   - [ ] **Guardar:** Project ID

2. **Habilitar Google Calendar API:**
   - [ ] APIs & Services → Enable APIs
   - [ ] Habilitar "Google Calendar API"

3. **Criar credenciais OAuth:**
   - [ ] APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - [ ] Tipo: Web application
   - [ ] **Guardar:** `GOOGLE_CLIENT_ID`
   - [ ] **Guardar:** `GOOGLE_CLIENT_SECRET`
   - [ ] **Guardar:** `GOOGLE_REFRESH_TOKEN` (gerado após autorização)

**Opção 2: Zoom**

1. **Criar conta Zoom:**
   - [ ] Acesse: https://zoom.us
   - [ ] Criar conta (pode ser gratuita)
   - [ ] **Guardar:** Email da conta Zoom

2. **Criar App no Zoom:**
   - [ ] Zoom Marketplace → Develop → Build App
   - [ ] Tipo: Server-to-Server OAuth
   - [ ] **Guardar:** `ZOOM_ACCOUNT_ID`
   - [ ] **Guardar:** `ZOOM_CLIENT_ID`
   - [ ] **Guardar:** `ZOOM_CLIENT_SECRET`

**⚠️ IMPORTANTE:**
- Google Meet é mais simples (usa Google Calendar)
- Zoom requer conta paga para produção
- Guarde todas as credenciais em local seguro

---

## 8. Upload de Arquivos (AWS S3) - Opcional

### ⚠️ Opcional: Se quiser armazenar arquivos (exames, documentos) na nuvem

**O que você precisa fazer:**

1. **Criar conta AWS:**
   - [ ] Acesse: https://aws.amazon.com
   - [ ] Criar conta (pode usar free tier)
   - [ ] **Guardar:** Email da conta AWS
   - [ ] **Guardar:** Senha da conta AWS

2. **Criar bucket S3:**
   - [ ] Console AWS → S3 → Create bucket
   - [ ] Escolher região (ex: `us-east-1`)
   - [ ] **Guardar:** Nome do bucket (ex: `clickcannabis-prod`)

3. **Criar usuário IAM:**
   - [ ] IAM → Users → Create user
   - [ ] Anexar política: `AmazonS3FullAccess` (ou mais restritiva)
   - [ ] **Guardar:** `AWS_ACCESS_KEY_ID`
   - [ ] **Guardar:** `AWS_SECRET_ACCESS_KEY`

4. **Configurar CORS (se necessário):**
   - [ ] Bucket → Permissions → CORS
   - [ ] Configurar regras conforme necessário

**⚠️ IMPORTANTE:**
- AWS tem free tier (5GB por 12 meses)
- Guarde as chaves de acesso em local seguro
- Configure políticas de acesso restritivas

---

## 9. Segurança (reCAPTCHA) - Recomendado

### ⚠️ Recomendado: Para proteger formulários contra bots

**O que você precisa fazer:**

1. **Criar conta Google reCAPTCHA:**
   - [ ] Acesse: https://www.google.com/recaptcha/admin
   - [ ] Fazer login com conta Google
   - [ ] **Guardar:** Email da conta Google

2. **Registrar site:**
   - [ ] Criar novo site
   - [ ] Tipo: reCAPTCHA v3 (recomendado)
   - [ ] Domínios: `seudominio.com.br`, `www.seudominio.com.br`
   - [ ] **Guardar:** `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (Site Key)
   - [ ] **Guardar:** `RECAPTCHA_SECRET_KEY` (Secret Key)

**⚠️ IMPORTANTE:**
- reCAPTCHA v3 é invisível (não mostra desafio)
- Adicione todos os domínios que vai usar
- Guarde as chaves em local seguro

---

## 10. Monitoramento - Opcional

### ⚠️ Opcional: Para rastrear erros e métricas

**Opção 1: Sentry (Rastreamento de Erros)**

1. **Criar conta:**
   - [ ] Acesse: https://sentry.io
   - [ ] Criar conta gratuita
   - [ ] **Guardar:** Email da conta Sentry

2. **Criar projeto:**
   - [ ] Selecionar "Next.js"
   - [ ] **Guardar:** `SENTRY_DSN` (Data Source Name)

**Opção 2: Google Analytics**

1. **Criar propriedade:**
   - [ ] Acesse: https://analytics.google.com
   - [ ] Criar propriedade
   - [ ] **Guardar:** `NEXT_PUBLIC_GA_ID` (Measurement ID, formato: `G-XXXXXXX`)

---

## 11. Domínio e DNS

### ✅ Obrigatório se quiser domínio customizado

**O que você precisa fazer:**

1. **Registrar domínio:**
   - [ ] Escolher registrador (ex: Registro.br, GoDaddy, Namecheap)
   - [ ] Registrar domínio (ex: `seudominio.com.br`)
   - [ ] **Guardar:** Email da conta do registrador
   - [ ] **Guardar:** Senha da conta
   - [ ] **Guardar:** Data de expiração do domínio

2. **Configurar DNS:**
   - [ ] Se usar Vercel:
     - Adicionar registro CNAME: `www` → `cname.vercel-dns.com`
     - Adicionar registro A: `@` → IP da Vercel (ou usar CNAME)
   - [ ] **Guardar:** Configurações DNS aplicadas

3. **Configurar no Vercel:**
   - [ ] Settings → Domains → Add Domain
   - [ ] Adicionar domínio
   - [ ] Seguir instruções de verificação

**⚠️ IMPORTANTE:**
- DNS pode levar até 48h para propagar
- Guarde credenciais do registrador em local seguro
- Configure renovação automática do domínio

---

## 12. Checklist Final

### 📝 Antes de colocar em produção, verifique:

#### Infraestrutura
- [ ] Hospedagem configurada (Vercel)
- [ ] Banco PostgreSQL criado e configurado
- [ ] Domínio configurado (se usar)

#### Variáveis de Ambiente
- [ ] `DATABASE_URL` configurada (PostgreSQL)
- [ ] `NEXTAUTH_URL` configurada
- [ ] `NEXTAUTH_SECRET` gerado e configurado
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` configurada

#### Serviços Essenciais
- [ ] Email configurado (Resend ou SMTP)
- [ ] Stripe configurado (se usar pagamentos)
- [ ] Webhook do Stripe configurado

#### Serviços Opcionais
- [ ] WhatsApp configurado (se usar)
- [ ] Telemedicina configurada (se usar)
- [ ] S3 configurado (se usar uploads)
- [ ] reCAPTCHA configurado (recomendado)
- [ ] Monitoramento configurado (opcional)

#### Segurança
- [ ] Todas as senhas e secrets guardados em local seguro
- [ ] Nenhuma credencial commitada no Git
- [ ] `.env` no `.gitignore`
- [ ] Variáveis de ambiente configuradas na plataforma (Vercel)

#### Testes
- [ ] Build local funcionando (`npm run build`)
- [ ] Login testado
- [ ] Agendamento testado
- [ ] Email de confirmação testado
- [ ] Pagamento testado (se usar)

---

## 📦 Onde Guardar as Informações

### Recomendações:

1. **Gerenciador de Senhas:**
   - Use LastPass, 1Password, Bitwarden, etc.
   - Guarde TODAS as senhas e secrets lá

2. **Documento Seguro:**
   - Crie um documento criptografado
   - Guarde este arquivo (`GUIA_CADASTROS_PRODUCAO.md`) preenchido
   - NUNCA commite no Git

3. **Backup:**
   - Faça backup do documento
   - Guarde em local seguro (cloud criptografado)

---

## 🚀 Próximos Passos

Quando estiver pronto para produção:

1. Revisar este checklist
2. Preencher todas as variáveis de ambiente na Vercel
3. Fazer primeiro deploy
4. Testar todas as funcionalidades
5. Monitorar logs e erros

---

## 📞 Suporte

Se precisar de ajuda:
- Documentação do projeto: Ver arquivos `.md` na raiz
- Vercel: https://vercel.com/docs
- Stripe: https://stripe.com/docs
- Resend: https://resend.com/docs

---

**Última atualização:** Janeiro 2026  
**Versão:** 1.0
