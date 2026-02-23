# Estudo: Funil de Captação via WhatsApp e Configuração por Dispositivo (Mobile vs Desktop)

**Data:** 30/01/2026  
**Objetivo:** Definir como integrar o processo de captação/agendamento via WhatsApp à plataforma, com configuração pelo admin e funis diferentes para mobile e desktop.  
**Status:** Estudo apenas — nenhuma alteração de código nesta fase.

---

## 1. Visão geral do que se quer

- **Captação** (primeiro contato até agendamento/pagamento) poder ser feita **via WhatsApp**, em diálogo com a plataforma.
- **Admin** define **qual funil** usar em cada contexto: por exemplo, em **mobile** um fluxo (ex.: redirecionar para WhatsApp), em **desktop** outro (ex.: manter formulário no site).
- A experiência no WhatsApp deve **integrar com a plataforma**: criar/buscar paciente, consulta, pagamento, notificações, tudo consistente com o que já existe no site.

---

## 2. Estado atual do projeto (resumo)

| Componente | Situação |
|------------|----------|
| **WhatsApp** | Twilio configurado no admin (`/admin/whatsapp`), envio de mensagens (texto e templates), histórico em `WhatsAppMessage`. |
| **Webhook WhatsApp** | `POST /api/whatsapp/webhook` — hoje só trata **status** de mensagens (enviada, entregue, lida). **Não processa mensagens recebidas** do usuário. |
| **Agendamento** | Página `/agendamento` com `AppointmentForm`: dados pessoais, patologias, data/hora, criação de usuário/paciente e consulta via `POST /api/consultations`. Fluxo 100% no site. |
| **Configurações** | `SystemConfig` (key/value) para duração de consulta, antecedência, convites de adiantamento, etc. Admin em `/admin/configuracoes`. |
| **Config público** | `GET /api/config/booking-features` (reschedule, advance booking) — usado por médico; não há hoje uma “config de funil” para a página de agendamento. |
| **Contato** | `lib/contact-config.ts`: telefone e e-mail da clínica (SystemConfig / env). |
| **Detecção de dispositivo** | Não usada no fluxo de agendamento. `user-agent` existe em auditoria e validação de formulário, mas não para escolher funil. |

Ou seja: hoje não existe conceito de “funil de captação” nem regra “mobile = um fluxo, desktop = outro”. O estudo abaixo propõe como introduzir isso e integrar WhatsApp.

---

## 3. Conceitos propostos

### 3.1 Tipos de funil de captação

- **SITE** — Fluxo atual: usuário preenche formulário em `/agendamento`, depois pagamento e confirmação no site.
- **WHATSAPP** — Usuário é levado ao WhatsApp (ou só informa telefone no site e recebe mensagem); coleta de dados e/ou confirmação de horário via conversa; a plataforma cria/atualiza paciente e consulta quando houver agendamento válido.

### 3.2 Regras por “canal” (dispositivo / origem)

- **Desktop** — Pode usar funil SITE ou WHATSAPP (escolha configurável).
- **Mobile** — Idem; na prática costuma-se preferir WHATSAPP em mobile para reduzir abandono.

Assim, o admin poderia escolher, por exemplo:

- Mobile → funil **WHATSAPP**
- Desktop → funil **SITE**

Ou ambos SITE, ou ambos WHATSAPP, etc.

### 3.3 Onde a decisão é tomada

- **Frontend (recomendado):** A página que tem o CTA “Agendar consulta” (ou a própria `/agendamento`) chama uma API pública que retorna “qual funil usar para este dispositivo”. O front então:
  - Redireciona para WhatsApp (com link `https://wa.me/...` e texto pré-preenchido), ou
  - Mostra o formulário do site, ou
  - Mostra uma tela intermediária (ex.: “Informe seu WhatsApp” e depois dispara o fluxo no backend).
- **Alternativa:** Backend poderia receber `User-Agent` (ou um header `X-Device-Type`) e devolver o funil; o front só obedece. Para simplicidade, pode-se fazer a detecção no cliente e enviar `deviceType: 'mobile' | 'desktop'` na requisição.

---

## 4. Modelo de dados sugerido (para implementação futura)

Objetivo: armazenar no banco **qual funil** usar em cada contexto, e **textos/URLs** usados no WhatsApp.

### 4.1 Opção A — Usar apenas `SystemConfig` (key/value)

Não criar novas tabelas; só chaves como:

| Key | Exemplo de valor | Uso |
|-----|------------------|-----|
| `CAPTURE_FUNNEL_MOBILE` | `WHATSAPP` ou `SITE` | Funil em mobile |
| `CAPTURE_FUNNEL_DESKTOP` | `SITE` ou `WHATSAPP` | Funil em desktop |
| `CAPTURE_WHATSAPP_WELCOME_MESSAGE` | Texto da primeira mensagem ao usuário | Mensagem enviada quando lead entra pelo WhatsApp |
| `CAPTURE_WHATSAPP_PREFILL_TEXT` | Ex.: "Olá, gostaria de agendar uma consulta" | Texto pré-preenchido no link wa.me |

**Prós:** Simples, rápido, já existe padrão no projeto.  
**Contras:** Menos flexível; não dá para ter “vários” funis ou regras mais complexas.

### 4.2 Opção B — Tabela dedicada `CaptureFunnelConfig`

```prisma
model CaptureFunnelConfig {
  id          String   @id @default(uuid())
  channel     String   @unique  // "MOBILE" | "DESKTOP"
  funnelType  String   // "SITE" | "WHATSAPP"
  whatsappPrefillText  String?  // Texto do link wa.me
  whatsappWelcomeTemplateId String?  // Nome do template (Twilio) ou null = mensagem livre
  whatsappWelcomeMessage   String?  // Mensagem livre se não usar template
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Prós:** Um registro por canal, fácil de editar no admin e estender depois (ex.: A/B por origem).  
**Contras:** Nova tabela e migração.

Recomendação: começar com **Opção A** (SystemConfig); se no futuro precisar de mais canais ou regras, migrar para algo como a Opção B.

---

## 5. API pública “qual funil usar”

- **Rota sugerida:** `GET /api/config/capture-funnel` (ou `/api/config/public`, com um bloco `captureFunnel`).
- **Entrada:** Query ou header opcional para dispositivo, ex.: `?device=mobile` ou `device=desktop`. Se não enviar, o backend pode devolver os dois (mobile e desktop) e o front decide com base no próprio `window`/user-agent.
- **Saída (exemplo):**

```json
{
  "mobile": { "funnelType": "WHATSAPP", "whatsappPrefillText": "Olá, gostaria de agendar..." },
  "desktop": { "funnelType": "SITE", "whatsappPrefillText": null }
}
```

Ou, se a decisão for no servidor:

```json
{
  "funnelType": "WHATSAPP",
  "whatsappPrefillText": "Olá, gostaria de agendar uma consulta.",
  "whatsappNumber": "5511999999999"
}
```

O front, ao carregar a página de agendamento (ou a home com botão “Agendar”):

1. Chama `GET /api/config/capture-funnel?device=mobile` (ou detecta no client e envia `device`).
2. Se `funnelType === 'WHATSAPP'`:
   - Ou redireciona para `https://wa.me/<whatsappNumber>?text=<encodeURIComponent(whatsappPrefillText)>`,
   - Ou mostra tela “Informe seu WhatsApp” e depois a plataforma envia a primeira mensagem e continua o fluxo no WhatsApp.
3. Se `funnelType === 'SITE'`, mostra o formulário atual de agendamento.

O número do WhatsApp pode vir do `contact-config` (CONTACT_PHONE) ou de uma config específica de funil; o admin já configura o número em WhatsApp, então pode reutilizar ou ter uma chave tipo `CAPTURE_WHATSAPP_NUMBER` (opcional).

---

## 6. Tela no Admin: “Funil de Captação”

- **Onde:** Nova seção em **Configurações** (`/admin/configuracoes`) ou novo item **Funil de Captação** no menu (ex.: em Comunicação, perto de WhatsApp).
- **Conteúdo sugerido:**
  - **Mobile:** Dropdown → “Site (formulário)” ou “WhatsApp”.
  - **Desktop:** Dropdown → “Site (formulário)” ou “WhatsApp”.
  - Se WhatsApp estiver escolhido para algum:
    - Texto pré-preenchido do link (wa.me).
    - (Opcional) Mensagem de boas-vindas enviada automaticamente quando o usuário mandar a primeira mensagem (pode ser template ou texto livre, conforme o que o backend suportar).
  - Botão Salvar → grava em `SystemConfig` (ou em `CaptureFunnelConfig`).
- **Validação:** Se funil = WhatsApp, o sistema pode avisar “Confirme que o WhatsApp está configurado em [link para /admin/whatsapp]”.

Nenhuma alteração de código agora; isso é só o desenho da tela futura.

---

## 7. Integração WhatsApp ↔ Plataforma

Hoje o WhatsApp **só envia**. Para um funil de captação via WhatsApp é preciso também **receber** mensagens e **reagir**.

### 7.1 Webhook de mensagens recebidas (Twilio)

- O Twilio envia para o mesmo webhook (`/api/whatsapp/webhook`) eventos de **mensagem recebida** (Body, From, etc.).
- Hoje o código trata só status (delivered, read). É preciso **tratar também** o tipo de evento (ex.: `MessageStatus` vs “nova mensagem”) e, quando for mensagem recebida:
  - Identificar o número (From).
  - Decidir se é um lead novo (primeira mensagem) ou continuação de um fluxo (ex.: usuário já em “coleta de dados” ou “escolher horário”).

### 7.2 Fluxo sugerido (alto nível)

1. **Usuário envia primeira mensagem** (ex.: “Quero agendar”) ou clica no link do site e abre o WhatsApp com texto pré-preenchido.
2. **Webhook recebe** → backend identifica número; se não existir lead/contexto, cria um “Lead” ou “Conversa WhatsApp” (pode ser uma tabela `WhatsAppConversation` ou usar apenas estado em memória/cache com TTL).
3. **Resposta automática** (bot ou regras):
   - Envia mensagem de boas-vindas (configurável pelo admin).
   - Pode pedir: nome, e-mail, CPF, data desejada, etc., em sequência (fluxo passo a passo).
4. **Quando tiver dados mínimos** (nome, telefone, e-mail, data/hora desejada):
   - Backend busca ou cria `User` (paciente) e `Consultation` (status inicial, ex.: PENDING ou aguardando confirmação).
   - Envia link do site para pagamento (`/consultas/:id/pagamento?token=...`) ou instrui por texto.
5. **Pagamento e confirmação** continuam iguais ao fluxo atual (site); o que mudou foi só a **captação** até ter paciente + consulta criados.

Isso exige:
- **Processar mensagens recebidas** no webhook (ler Body, From, e salvar/atualizar estado do lead).
- **Lógica de “bot”** (estado da conversa: aguardando nome, aguardando data, etc.) ou integração com um serviço de chatbot que chame a API da plataforma para criar paciente/consulta.
- **Segurança:** validar assinatura do Twilio; não expor dados sensíveis no log.

### 7.3 Onde criar paciente e consulta

- Reutilizar a mesma lógica (ou partes) de `POST /api/consultations`: validação de slot, criação de `User` (paciente), `PatientPathology`, `Consultation`, tokens de confirmação.
- Pode existir uma rota interna ou função tipo `createConsultationFromWhatsApp(phone, name, email, cpf, scheduledAt, ...)` chamada pelo handler do webhook quando o “bot” tiver coletado os dados necessários.
- Assim, consultas vindas do WhatsApp ficam iguais às do site (mesma tabela, mesmo fluxo de pagamento e lembretes).

---

## 8. Detecção de dispositivo (Mobile vs Desktop)

- **No frontend:**  
  - Usar `window.matchMedia('(max-width: 768px)')` ou similar para “mobile” vs “desktop”, ou  
  - Ler `navigator.userAgent` e usar heurística (ex.: /Mobile|Android|iPhone/i).
- Enviar para a API como `device=mobile` ou `device=desktop` (query ou body em GET não padrão; pode ser header `X-Device-Type`).
- **Alternativa:** A API retorna sempre `{ mobile: {...}, desktop: {...} }` e o front escolhe no client qual usar. Assim a API não precisa receber device.

Recomendação: **API retorna as duas configurações** (mobile e desktop); o front decide qual usar com base na própria detecção. Menos acoplamento e funciona bem com cache público da API.

---

## 9. Resumo da integração (fluxo completo)

| Etapa | Quem | O quê |
|-------|------|--------|
| 1. Configuração | Admin | Define funil mobile (ex.: WHATSAPP) e desktop (ex.: SITE); texto wa.me; mensagem de boas-vindas. |
| 2. Página agendamento / CTA | Front | Chama `GET /api/config/capture-funnel`; detecta device; se WHATSAPP, redireciona para wa.me ou mostra “Informe WhatsApp”. |
| 3. Usuário no WhatsApp | Usuário | Envia mensagem (ou abre link com texto). |
| 4. Webhook | Backend | Recebe mensagem; identifica lead; responde com boas-vindas e inicia coleta (nome, e-mail, data, etc.). |
| 5. Coleta concluída | Backend | Cria/atualiza User e Consultation; envia link de pagamento ou instruções. |
| 6. Pagamento e resto | Site | Igual ao fluxo atual (token, página de pagamento, confirmação, notificações WhatsApp/email). |

---

## 10. Fases sugeridas de implementação (quando for fazer)

1. **Fase 1 — Config e front (funil por dispositivo)**  
   - Chaves em `SystemConfig` (ou tabela) para funil mobile/desktop e texto wa.me.  
   - API `GET /api/config/capture-funnel` retornando mobile/desktop.  
   - Tela no admin para editar.  
   - Na página de agendamento (e/ou links “Agendar”): ler config, detectar device, redirecionar para WhatsApp ou mostrar formulário.  
   - **Resultado:** Admin escolhe “mobile → WhatsApp”; em mobile o usuário já cai no WhatsApp com texto pré-preenchido. Ainda não há “resposta automática” nem criação de consulta pelo WhatsApp.

2. **Fase 2 — Webhook recebe mensagens**  
   - No webhook Twilio: tratar mensagens recebidas (Body, From).  
   - Persistir “conversa” ou “lead” (tabela ou cache).  
   - Resposta automática simples (ex.: uma mensagem de boas-vindas fixa ou configurável).  
   - **Resultado:** Usuário manda mensagem e recebe resposta; ainda sem coleta estruturada.

3. **Fase 3 — Bot/coleta e criação na plataforma**  
   - Lógica de estados (aguardando nome, e-mail, data, etc.).  
   - Quando tiver dados mínimos: criar User + Consultation (reutilizando regras do POST consultations).  
   - Enviar link de pagamento por WhatsApp.  
   - **Resultado:** Funil 100% WhatsApp até ter consulta criada; pagamento e confirmação no site.

4. **Fase 4 (opcional)** — Templates aprovados, analytics de funil, A/B (ex.: desktop também poder usar WhatsApp), etc.

---

## 11. Riscos e cuidados

- **Twilio / WhatsApp Business:** Políticas de uso (janela 24h, templates para mensagens proativas). Mensagens de resposta a usuário que iniciou contato costumam ser permitidas.
- **Privacidade e LGPD:** Armazenar conversas e dados apenas o necessário; deixar claro na mensagem ou no site que o contato será via WhatsApp e com qual finalidade.
- **Segurança:** Validar assinatura do webhook; não confiar em `From` sem validação em cenários sensíveis (ex.: confirmação de pagamento só por link com token).
- **Disponibilidade:** Se o webhook estiver lento ou fora, o usuário pode não receber resposta; usar fila (ex.: job em background) e resposta rápida “Recebemos sua mensagem” se necessário.

---

## 12. Conclusão

- **Funil configurável (mobile vs desktop)** pode ser implementado com:
  - Config no banco (SystemConfig ou tabela `CaptureFunnelConfig`).
  - API pública de config (`/api/config/capture-funnel`).
  - Admin para editar qual funil em cada canal.
  - Front que decide, por dispositivo, redirecionar para WhatsApp ou mostrar o formulário do site.
- **Integração WhatsApp ↔ plataforma** exige:
  - Tratar mensagens **recebidas** no webhook.
  - Um fluxo (bot/regras) para coletar dados e, quando pronto, criar paciente e consulta na base atual.
  - Manter pagamento e confirmação no site, reutilizando o que já existe.

Este documento serve como referência para quando for implementar; nenhuma alteração de código foi feita nesta etapa.
