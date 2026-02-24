# Análise geral do projeto e correções aplicadas

**Data:** 09/02/2025  
**Objetivo:** Entender o projeto, identificar problemas recentes e aplicar correções.

---

## 1. Resumo do projeto

- **Nome:** clickcannabis-replica (Cannabilize / CannabiLize)
- **Stack:** Next.js 14, Prisma, SQLite (dev) / PostgreSQL (prod), NextAuth, Stripe, Tailwind
- **Papéis:** PATIENT, DOCTOR, ADMIN
- **Funcionalidades:** Telemedicina, agendamento, pagamentos, receitas, carteirinha, blog, dashboards (ERP, GPP, IFP)

---

## 2. Problemas identificados e correções

### 2.1 Login “parando de funcionar” e credenciais erradas

**Problema:**  
- Documentação e script de verificação usavam e-mails diferentes dos que o seed e `criar-usuarios.ts` criam.  
- Ex.: `POR_QUE_LOGIN_PAROU.md` e `EXECUTAR.bat` citavam `admin@clickcannabis.com` e `doctor@clickcannabis.com`, enquanto o seed usa `admin@cannabilize.com.br` e `doctor@cannabilize.com.br`.  
- Quem seguia a documentação tentava logar com e-mail inexistente.

**Correções:**  
- **verificar-usuarios.ts:** passou a buscar `admin@cannabilize.com.br` e `doctor@cannabilize.com.br` (alinhado ao seed e `criar-usuarios.ts`).  
- **POR_QUE_LOGIN_PAROU.md:** credencial de teste atualizada para `admin@cannabilize.com.br` / `admin123`.  
- **EXECUTAR.bat:** mensagem pós-seed corrigida para exibir as credenciais corretas (admin, médico e paciente).

**Credenciais corretas após seed / criar-usuarios:**  
- Admin: `admin@cannabilize.com.br` / `admin123`  
- Médico: `doctor@cannabilize.com.br` / `doctor123`  
- Paciente: `paciente@cannabilize.com.br` / `paciente123`

---

### 2.2 Risco de perda de dados ao executar scripts

**Problema:**  
- Vários `.bat` (incluindo `EXECUTAR.bat`) usavam `npx prisma db push --accept-data-loss`, que pode apagar dados em caso de conflito de schema.  
- Documentação já alertava que isso podia ter apagado usuários e causado “login parou”.

**Correção:**  
- **EXECUTAR.bat:** passou a usar apenas `npx prisma db push` (sem `--accept-data-loss`).  
- Comentário no script orienta usar `--accept-data-loss` manualmente apenas quando for necessário recriar o banco.

**Recomendação:** Para subir o projeto sem alterar o banco, use `INICIAR_SIMPLES.bat` ou `npm run dev`. Para primeira configuração ou recriar tabelas, use `npx prisma db push` (e só `--accept-data-loss` se souber que pode perder dados).

---

### 2.3 Configuração de contato e valor da consulta

**Problema:**  
- Sem valores no `SystemConfig`, o sistema poderia exibir fallbacks genéricos (ex.: telefone) em produção.  
- O seed não criava `CONTACT_PHONE`, `CONTACT_EMAIL` nem `CONSULTATION_DEFAULT_AMOUNT`.

**Correção:**  
- **prisma/seed.ts:** passou a criar/atualizar no `SystemConfig`:  
  - `CONTACT_PHONE`  
  - `CONTACT_EMAIL`  
  - `CONSULTATION_DEFAULT_AMOUNT` (ex.: 50)  
- Assim, após rodar o seed, a página de confirmação e outras telas que usam `getContactPhone()` / `getContactEmail()` e `getConsultationDefaultAmount()` passam a ter valores definidos.

---

## 3. Pontos já ok (não alterados)

- **Middleware:** já protege `/admin`, `/paciente`, `/medico`, `/erp-canna`, `/ifp-canna`, `/gpp-canna` e redireciona para `/login` quando não há sessão.  
- **API pública de consulta** (`/api/consultations/[id]/public`): já exige token para retornar nome/email; sem token retorna apenas dados mínimos (LGPD).  
- **Valor da consulta:** já centralizado em `lib/consultation-price.ts` com `SystemConfig` e fallback 50.  
- **Contato:** já centralizado em `lib/contact-config.ts` e exposto em `/api/config/contact`; página de confirmação já consome essa API.  
- **Página duplicada v2:** `app/medico/consultas/[id]/v2/page.tsx` já foi removida (apenas uma página de consulta do médico permanece).  
- **Linter:** sem erros nos diretórios `app`, `lib` e `components` no momento da análise.

---

## 4. Recomendações futuras (não implementadas nesta rodada)

- **Banco em produção:** migrar de SQLite para PostgreSQL (já previsto na análise do projeto).  
- **Scripts .bat:** revisar outros que ainda usam `db push --accept-data-loss` e usar apenas quando for realmente necessário recriar o banco.  
- **2FA e auditoria:** implementar 2FA para admins e ampliar uso de `createAuditLog` em ações sensíveis (conforme análises existentes).  
- **LGPD:** garantir política de privacidade, consentimento e exportação/exclusão de dados (conforme documentação do projeto).

---

## 5. Como usar após as correções

1. **Verificar usuários:**  
   `npx tsx verificar-usuarios.ts`  
   (agora verifica os e-mails corretos: `admin@cannabilize.com.br`, `doctor@cannabilize.com.br`.)

2. **Criar/recriar usuários de teste:**  
   `npx tsx criar-usuarios.ts`

3. **Popular banco (incluindo contato e valor da consulta):**  
   `npm run db:seed`

4. **Subir o projeto sem alterar o banco:**  
   `INICIAR_SIMPLES.bat` ou `npm run dev`

5. **Login:**  
   Use `admin@cannabilize.com.br` / `admin123` (e as demais credenciais acima).

---

Resumo: os problemas recentes de “login parando” e confusão de credenciais foram tratados alinhando documentação e scripts aos e-mails do seed; o risco de perda de dados foi reduzido no `EXECUTAR.bat`; e o seed passou a configurar contato e valor da consulta no `SystemConfig`.
