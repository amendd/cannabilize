# Implementações realizadas — P1, P2 e novas funcionalidades

## O que foi feito

### P1 — Crítico

1. **API pública de consulta (LGPD)**  
   - `GET /api/consultations/[id]/public` agora exige **token** para retornar nome e email.  
   - Sem `?token=XXX` válido: retorna apenas `id`, `scheduledDate`, `scheduledTime`, `payment` (sem PII).  
   - Token é criado ao agendar a consulta, válido por 7 dias, e enviado no link dos emails de confirmação e de pagamento confirmado.  
   - Fluxo: agendamento → resposta inclui `confirmationToken` → redirecionamento para `/consultas/[id]/pagamento?token=XXX` → após pagamento, redirecionamento para `/consultas/[id]/confirmacao?token=XXX`.  
   - Emails (confirmação de consulta e pagamento confirmado) passam a incluir link com token.

2. **Restrição do médico nas APIs admin**  
   - `/api/admin/stats`, `/api/admin/consultations`, `/api/admin/pending`, `/api/admin/health` passam a aceitar **apenas ADMIN**.  
   - Médico deve usar `/api/doctors/me/consultations` e equivalentes.  
   - Página `/admin` redireciona usuário DOCTOR para `/medico`.

3. **Proteção de rotas no middleware**  
   - Rotas que começam com `/admin`, `/paciente` ou `/medico` exigem cookie de sessão NextAuth.  
   - Sem sessão: redirecionamento para `/login?callbackUrl=<pathname>`.  
   - `matcher` do middleware atualizado para incluir essas rotas.

4. **Contato real (sem placeholders)**  
   - Criados `lib/contact-config.ts` (getContactPhone, getContactEmail) e `GET /api/config/contact`.  
   - Valores vêm de SystemConfig (`CONTACT_PHONE`, `CONTACT_EMAIL`) ou env (`CONTACT_PHONE`, `CONTACT_EMAIL`).  
   - Página de confirmação da consulta e bloco “Precisa de Ajuda?” passam a usar essa API.

---

### P2 — Alto

5. **Valor da consulta configurável**  
   - `lib/consultation-price.ts`: `getConsultationDefaultAmount()` lê SystemConfig `CONSULTATION_DEFAULT_AMOUNT` (fallback 50).  
   - Uso em: `POST /api/consultations` (criação do pagamento), `POST /api/payments/create-intent`, e página de pagamento (fallback).

6. **Página única do médico (remoção da v2)**  
   - Removido `app/medico/consultas/[id]/v2/page.tsx`.  
   - Página oficial da consulta do médico é `app/medico/consultas/[id]/page.tsx`.

7. **Ampliação da auditoria**  
   - **Login:** `lib/auth.ts` — no callback JWT, ao receber `user`, chama `createAuditLogAsync({ action: LOGIN, entity: User, entityId: user.id })`.  
   - **Receita emitida:** `app/api/prescriptions/route.ts` — após `prescription.create`, chama `createAuditLog` (PRESCRIPTION_ISSUED).  
   - **Feedback:** `app/api/consultations/[id]/feedback/route.ts` — após criar feedback, chama `createAuditLog` (FEEDBACK).  
   - **Export e delete de usuário:** já existiam em `app/api/user/export` e `app/api/user/delete`.  
   - Adicionado `AuditAction.FEEDBACK` em `lib/audit.ts`.

---

### Novas funcionalidades

8. **Qualidade do atendimento (feedback pós-consulta)**  
   - Novo modelo Prisma: `ConsultationFeedback` (consultationId, patientId, rating 1–5, comment opcional).  
   - **GET** `/api/consultations/[id]/feedback` — verifica se o paciente já enviou feedback (retorna `submitted`, `rating`, `comment`, `createdAt`).  
   - **POST** `/api/consultations/[id]/feedback` — paciente envia avaliação (apenas consulta COMPLETED, uma vez por consulta).  
   - Na página do paciente `/paciente/consultas/[id]`, quando a consulta está **finalizada**, é exibido o bloco “Avalie o atendimento” (nota 1–5 + comentário opcional). Após envio, é mostrada mensagem de agradecimento.

9. **Anamnese fora do agendamento; anamnese e documentos após pagamento**  
   - **Agendamento:** removidos do formulário e do schema de validação os campos de anamnese (tratamentos anteriores, medicamentos, alergias, informações adicionais). O agendamento fica só com dados pessoais, patologias, data e horário.  
   - **API POST /api/consultations:** anamnese passou a ser opcional; se não enviada, é salva como `null`.  
   - **Após o pagamento:** na página da consulta do paciente (`/paciente/consultas/[id]`), quando o pagamento está **PAID** e a consulta ainda não está finalizada, é exibida a seção **“Pré-consulta (Anamnese)”** com os quatro campos e botão “Salvar anamnese”.  
   - **PATCH** `/api/consultations/[id]/anamnesis` — apenas o paciente dono da consulta pode atualizar a anamnese (e apenas se pagamento PAID e status não COMPLETED/CANCELLED).  
   - Upload de arquivos (laudos, receitas etc.) continua na mesma página do paciente (já existia); na confirmação pós-pagamento também já havia upload.

---

## Schema Prisma (novos modelos)

- **ConsultationConfirmationToken:** id, consultationId, token, expiresAt.  
  Usado para acesso à API pública e links de confirmação/pagamento.

- **ConsultationFeedback:** id, consultationId, patientId, rating (1–5), comment (opcional), createdAt.  
  Usado para avaliação de qualidade do atendimento.

- **Consultation** passou a ter relação opcional com `confirmationToken` e `feedback`.  
- **User** passou a ter relação com `consultationFeedbacks`.

---

## O que você precisa fazer

1. **Migração do banco**  
   Com o servidor parado (para evitar EPERM no generate), execute:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name add_confirmation_token_and_feedback
   ```

2. **Configuração (opcional)**  
   - **Contato:** em SystemConfig (ou env), defina `CONTACT_PHONE` e `CONTACT_EMAIL` para substituir os fallbacks.  
   - **Valor da consulta:** em SystemConfig, defina `CONSULTATION_DEFAULT_AMOUNT` (ex.: `50` ou `99.90`) para o valor padrão da consulta.

3. **Links antigos**  
   Links de confirmação/pagamento **sem** token continuam funcionando, mas a página de confirmação não mostrará nome/email nem o formulário “Acessar sua conta” até que o usuário acesse pelo link com token (enviado nos emails).

---

## Arquivos criados

- `lib/consultation-price.ts`  
- `lib/contact-config.ts`  
- `app/api/config/contact/route.ts`  
- `app/api/consultations/[id]/anamnesis/route.ts`  
- `app/api/consultations/[id]/feedback/route.ts`  

## Arquivos removidos

- `app/medico/consultas/[id]/v2/page.tsx`  

## Arquivos alterados (principais)

- `prisma/schema.prisma` — novos modelos e relações.  
- `middleware.ts` — proteção de /admin, /paciente, /medico.  
- `app/api/consultations/[id]/public/route.ts` — lógica com token e dados mínimos.  
- `app/api/consultations/route.ts` — token na criação, valor configurável, anamnese opcional.  
- `app/api/payments/create-intent/route.ts` — uso de getConsultationDefaultAmount.  
- `app/api/payments/webhook/route.ts` — confirmação de pagamento com confirmationUrl no email.  
- `app/api/admin/stats|consultations|pending|health/route.ts` — apenas ADMIN.  
- `app/admin/page.tsx` — redirecionamento de DOCTOR para /medico.  
- `components/consultation/AppointmentForm.tsx` — anamnese removida; redirect com token.  
- `app/consultas/[id]/pagamento/page.tsx` — leitura e repasse do token.  
- `app/consultas/[id]/confirmacao/page.tsx` — uso do token e contato via API.  
- `app/paciente/consultas/[id]/page.tsx` — seção anamnese e bloco de feedback.  
- `lib/email.ts` — confirmationUrl nos templates CONSULTATION_CONFIRMED e PAYMENT_CONFIRMED.  
- `lib/auth.ts` — auditoria de LOGIN no callback JWT.  
- `lib/audit.ts` — AuditAction.FEEDBACK.  
- `app/api/prescriptions/route.ts` — auditoria PRESCRIPTION_ISSUED.
