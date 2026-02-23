# Estudo: Replicar o Fluxo ClickCannabis (Site → WhatsApp → Agendamento)

**Data:** 30/01/2026  
**Objetivo:** Analisar o fluxo completo da ClickCannabis (cliente entra no site, clica em agendar, é direcionado ao WhatsApp e segue até consulta/pós-consulta) e mapear o que precisamos fazer para replicar essa integração no nosso projeto.  
**Base:** Capturas de tela e descrição do fluxo real da ClickCannabis.

---

## 1. Fluxo da ClickCannabis (resumo por etapa)

Com base nas imagens enviadas, o fluxo é o seguinte:

| # | Etapa | Onde | O que acontece |
|---|--------|------|----------------|
| 1 | **Seleção de patologia** | Site | Página "Para qual condição você busca um tratamento?" com lista de patologias (Depressão, Ansiedade, Dores, etc.). Usuário seleciona uma ou mais. |
| 2 | **Modal – dados iniciais** | Site | Modal "Falta pouco para você iniciar sua jornada!" com: campo **Nome**, tag da(s) patologia(s) selecionada(s), checkboxes das condições. Botões: **"Falar com médico"** e "Voltar à página inicial". |
| 3 | **Redirecionamento WhatsApp** | Navegador | Ao clicar em "Falar com médico", o usuário é redirecionado para `api.whatsapp.com/send?phone=5521993686082&text=...` com mensagem pré-preenchida: *"Olá, me chamo [nome]. Patologias selecionadas: 1. [patologia1] 2. [patologia2]..."*. O navegador pode mostrar "Abrir WhatsApp?" ou abrir a página do WhatsApp Web com a mensagem e botões "Abrir app" / "Continuar para o WhatsApp Web". |
| 4 | **Qualificação no WhatsApp** | WhatsApp | Atendimento (humano ou script) responde com boas-vindas e faz perguntas: tempo de sofrimento, tratamentos anteriores, interesse em CBD/THC, como conheceu a Click. Fluxo conversacional. |
| 5 | **Informações e pagamento** | WhatsApp | Mensagens explicando: consulta 100% online, R$ 30, médico especialista, processo de importação ~15 dias. Depois: **link de pagamento PIX** (ex.: `clickagendamento.com/v2/checkout/28144`). Texto: "Após realizar o pagamento, vou receber um aviso em meu sistema e te envio o link de agendamento." |
| 6 | **Confirmação de pagamento** | WhatsApp | Quando o usuário avisa "Fiz o pagamento", o sistema confirma: "Pagamento confirmado! Agora, vamos agendar sua consulta! 📅" e envia instruções (videoconferência, link antes da consulta, tolerância 5 min, etc.). |
| 7 | **Link de agendamento** | WhatsApp | Envio do **link para escolher dia/hora** (ex.: `clickagendamento.com/scheduling/VWdL255`). Usuário acessa no navegador, escolhe data e horário. |
| 8 | **Confirmação de agendamento** | WhatsApp | "Sua consulta está agendada!" com data, horário e **link do Google Meet**. Pergunta: "Podemos seguir com o processo?" |
| 9 | **Anamnese** | WhatsApp | Mensagem sobre "Formulário de Anamnese" com link/botão "Responder Anamnese". Depois: "Chegamos ao final da primeira etapa!" + promoção Instagram. |
| 10 | **Lembrete no dia** | WhatsApp | No dia da consulta: "Bom dia, [nome]! Hoje você tem sua consulta aqui na Click!" com **botões**: "Tudo certo para hoje!" e "Gostaria de tirar dúvidas". |
| 11 | **Lembrete 1h antes** | WhatsApp | "Falta apenas 1hr para a sua consulta! Lembre-se de estar em um lugar tranquilo..." + aviso de que o link do Meet será enviado 5 min antes. |
| 12 | **Link do Meet (5 min antes)** | WhatsApp | "Você receberá novamente o link de acesso do Google Meet 5 minutos antes do horário agendado!" e, no momento: "A consulta está prestes a começar. Horário: 16:20. Link de acesso 👇 [link Google Meet]". |
| 13 | **Pós-consulta – receita** | WhatsApp | "Receita médica. Olá [nome], sua receita ficou pronta, clique no link abaixo para realizar o download do arquivo" + **link PDF** (ex.: S3). |
| 14 | **Follow-up e feedback** | WhatsApp | "O que achou da consulta?" / "Conseguiu visualizar a sua prescrição?"; depois: "Avalie sua consulta com a Click!" com link/botão "Avaliar agora". |

---

## 2. Mapeamento: o que temos hoje vs o que precisamos

### 2.1 Site – Entrada e coleta inicial (etapas 1–3)

| Aspecto | ClickCannabis | Nosso projeto hoje | O que precisamos |
|---------|----------------|--------------------|------------------|
| **Página de patologias** | Página dedicada só para seleção de patologia (antes de qualquer formulário completo). | `/agendamento` já recebe `?pathologies=...` e o `AppointmentForm` mostra patologias; mas a **primeira tela** é o formulário completo (nome, email, CPF, data, horário, etc.), não só patologia. | **Opção A:** Nova página (ex.: `/agendar` ou `/#pathology-form`) só com título + lista de patologias; ao selecionar, abrir modal ou ir para próxima etapa. **Opção B:** Manter `/agendamento` e acrescentar um "fluxo rápido": primeira etapa = só patologia (+ nome na modal); botão "Falar com médico" gera link WhatsApp. |
| **Modal nome + patologia** | Modal com Nome, patologias em tag/checkboxes, botão "Falar com médico". | Não temos modal equivalente; temos formulário completo. | Criar **modal** (ou etapa única) com: campo Nome, exibição das patologias selecionadas, botão **"Falar com médico"** que não envia para o backend; apenas monta a URL do WhatsApp e redireciona. |
| **Link WhatsApp** | `https://api.whatsapp.com/send?phone=5521993686082&text=Olá,%20me%20chamo%20[NOME].%0A%0APatologias%20selecionadas:%0A1.%20[PAT1]%0A2.%20[PAT2]`. | Não temos geração desse link. Temos número em `WhatsAppConfig` / contato; não temos página que redirecione com texto dinâmico. | **Front:** Ao clicar "Falar com médico", montar `wa.me/<número>?text=<encodeURIComponent(mensagem)>`. Mensagem = "Olá, me chamo [nome].\n\nPatologias selecionadas:\n1. [pat1]\n2. [pat2]...". **Backend/Config:** Número do WhatsApp para captação (pode ser o mesmo de `WhatsAppConfig.phoneNumber` ou uma config `CAPTURE_WHATSAPP_NUMBER`). |

Resumo: precisamos de **uma entrada “leve” (patologia + nome)** e **um botão que redireciona para `wa.me` com texto pré-preenchido**. Não é obrigatório criar lead no banco nessa hora; o “lead” entra pelo WhatsApp quando a pessoa manda a primeira mensagem.

---

### 2.2 WhatsApp – Recebimento e qualificação (etapas 4–6)

| Aspecto | ClickCannabis | Nosso projeto hoje | O que precisamos |
|---------|----------------|--------------------|------------------|
| **Receber mensagens** | Sistema recebe a primeira mensagem (nome + patologias no texto) e responde com boas-vindas e perguntas. | Webhook `POST /api/whatsapp/webhook` só trata **status** (delivered, read). Não processa mensagens **recebidas** (Body, From). | **Webhook:** Tratar evento de mensagem recebida do Twilio (ex.: `MessageSid`, `Body`, `From`). Identificar número; opcionalmente criar/atualizar um registro "Lead" ou "Conversa" (tabela ou cache). |
| **Resposta automática / script** | Fluxo de perguntas (tempo de sofrimento, tratamentos anteriores, como conheceu). | Não temos bot nem script de conversa. | **Fase 1 (simples):** Uma mensagem de boas-vindas fixa ou configurável (admin). **Fase 2:** Fluxo guiado: estados (aguardando X, aguardando Y); respostas automáticas por estado; quando tiver "pronto para pagamento", enviar link de pagamento. Pode ser humano no meio (como a Click faz com "Rafa"). |
| **Link de pagamento** | Envio de link PIX (ex.: `clickagendamento.com/v2/checkout/28144`). ID na URL provavelmente é sessão/lead ou pedido. | Temos fluxo de pagamento por consulta: `/consultas/[id]/pagamento?token=...`. O link é gerado após criar a consulta. | **Se o agendamento vier depois do pagamento (como na Click):** Criar "pedido" ou "intenção de consulta" quando o lead estiver qualificado; gerar link `/consultas/[id]/pagamento` (ou criar um checkout dedicado para fluxo WhatsApp) e enviar por WhatsApp. **Se mantivermos pagamento após agendamento:** Inverter ou ter dois fluxos: (1) site: agendar → pagar; (2) WhatsApp: qualificar → pagar → depois enviar link de agendamento. |

Resumo: precisamos **tratar mensagens recebidas no webhook**, **resposta automática (ao menos boas-vindas)** e **geração de link de pagamento** associado ao lead/consulta quando for a hora.

---

### 2.3 Agendamento e confirmação (etapas 7–9)

| Aspecto | ClickCannabis | Nosso projeto hoje | O que precisamos |
|---------|----------------|--------------------|------------------|
| **Link de agendamento** | Link único por usuário (ex.: `.../scheduling/VWdL255`) para escolher dia/hora. | Temos `/agendamento` (público) e `/api/availability/slots?date=...`. Não temos "link único por lead" que já carregue contexto do paciente. | **Opção A:** Após pagamento confirmado, criar consulta em status "PENDING_SCHEDULE" (ou similar) e enviar link `/agendamento?token=...` ou `/agendar/[token]` que pré-identifica o paciente e mostra só a etapa de data/hora. **Opção B:** Página dedicada tipo `/scheduling/[token]` que busca consulta por token e exibe apenas seletor de data/hora (e salva na consulta). |
| **Confirmação + Meet** | "Sua consulta está agendada!" + data, horário, link Google Meet. | Já enviamos confirmação por WhatsApp (e email) com link da reunião ao criar/confirmar consulta. | Manter; garantir que o texto seja claro e inclua data, horário e link do Meet (ou Zoom). |
| **Anamnese** | Link "Responder Anamnese" após agendamento. | Anamnese é preenchida na área do paciente (após login) na consulta. | Manter fluxo: link para página de anamnese da consulta (com token se não logado) e enviar lembrete por WhatsApp com esse link. |

Resumo: precisamos de **link de agendamento “único” por paciente/consulta** (após pagamento) e **manter confirmação + anamnese** como já temos, com mensagens WhatsApp alinhadas.

---

### 2.4 Lembretes e dia da consulta (etapas 10–12)

| Aspecto | ClickCannabis | Nosso projeto hoje | O que precisamos |
|---------|----------------|--------------------|------------------|
| **Lembrete no dia** | "Bom dia, [nome]! Hoje você tem sua consulta!" + botões "Tudo certo para hoje!" / "Gostaria de tirar dúvidas". | Temos templates de lembrete 24h e 1h; não temos lembrete "no dia" nem botões interativos. | **Cron/job:** Enviar mensagem no dia da consulta (ex.: 7h ou configurável). **Botões:** WhatsApp Business API permite botões de resposta rápida; Twilio suporta. Implementar envio de mensagem com botões e, no webhook, tratar o clique (resposta com o texto do botão). |
| **Lembrete 1h antes** | "Falta apenas 1hr para a sua consulta!" + aviso do link 5 min antes. | Template 1h existe; falta job/cron que dispare no horário. | Garantir **cron** que rode (ex.: a cada 5 min), calcule consultas em 1h e chame função de envio WhatsApp (já temos o template). |
| **Link Meet 5 min antes** | Mensagem com link do Google Meet exatamente antes da consulta. | Podemos enviar mensagem com `meetingLink`; falta job que dispare "5 min antes". | **Cron:** Consultas com `scheduledAt` em ~5 min e `meetingLink` preenchido → enviar WhatsApp com o link. |

Resumo: **jobs/cron** para lembretes (dia, 1h, 5 min) e **mensagem com botões** no dia (opcional mas desejável para replicar a Click).

---

### 2.5 Pós-consulta (etapas 13–14)

| Aspecto | ClickCannabis | Nosso projeto hoje | O que precisamos |
|---------|----------------|--------------------|------------------|
| **Receita por WhatsApp** | "Sua receita ficou pronta" + link PDF (S3). | Temos geração de receita e possível envio por email; não está documentado envio de link de download por WhatsApp. | **Backend:** Após emissão da receita, gerar link de download (signed URL ou rota autenticada) e chamar `sendWhatsAppMessage` com o texto + link. Armazenamento: local ou S3 (como na Click). |
| **Follow-up e avaliação** | "O que achou?" / "Conseguiu visualizar a prescrição?" e depois "Avalie sua consulta" + link. | Temos `ConsultationFeedback` e possivelmente rota de feedback. | Enviar mensagens de follow-up e "Avalie sua consulta" com link para página de feedback (ex.: `/consultas/[id]/feedback?token=...`) por WhatsApp, após alguns dias ou após envio da receita. |

Resumo: **envio do link da receita por WhatsApp** e **mensagens de follow-up + link de avaliação**.

---

## 3. Checklist técnico para replicar

### 3.1 Site (entrada e redirecionamento)

- [ ] **Página ou etapa “só patologia”**  
  - Lista de patologias (já temos modelo `Pathology` e uso em `AppointmentForm`).  
  - Pode ser `/agendamento` com primeira etapa só patologia ou página separada.

- [ ] **Modal “Falar com médico”**  
  - Campos: Nome (obrigatório), patologias (já selecionadas).  
  - Botão "Falar com médico" → não submete formulário completo; monta mensagem e redireciona.

- [ ] **Geração do link WhatsApp**  
  - `https://wa.me/<número>?text=<encodeURIComponent(mensagem)>`.  
  - Número: configurável (admin) ou `WhatsAppConfig.phoneNumber` (sem prefixo `whatsapp:`).  
  - Mensagem: `Olá, me chamo [nome].\n\nPatologias selecionadas:\n1. [pat1]\n2. [pat2]`.

- [ ] **Config no admin (opcional)**  
  - Número do WhatsApp para captação (se diferente do número de notificações).  
  - Texto base da mensagem (template) para o link.

### 3.2 Webhook e mensagens recebidas

- [ ] **Tratar mensagens recebidas no webhook**  
  - Twilio envia para o mesmo webhook; diferenciar evento de **status** vs **mensagem recebida** (ex.: presença de `Body`, `From`).  
  - Persistir ou atualizar "Lead" / "Conversa" (tabela `WhatsAppLead` ou `WhatsAppConversation` com número, última mensagem, estado do fluxo).

- [ ] **Resposta automática**  
  - Ao receber primeira mensagem (ou mensagem sem estado): enviar boas-vindas (texto configurável no admin).  
  - Opcional: fluxo com estados (qualificação) e envio de link de pagamento quando pronto.

### 3.3 Pagamento e agendamento (fluxo WhatsApp)

- [ ] **Criação de consulta/pedido para fluxo WhatsApp**  
  - Quando o lead estiver “pronto” (após qualificação ou após mensagem “quero agendar”): criar `User` (paciente) se não existir, criar `Consultation` em status que permita pagamento (ex.: PENDING_PAYMENT) ou criar entidade “Pedido” que vira consulta após pagamento.

- [ ] **Link de pagamento por WhatsApp**  
  - Gerar link `/consultas/[id]/pagamento?token=...` (ou checkout dedicado) e enviar por WhatsApp.  
  - Garantir que o webhook de pagamento (Mercado Pago / Stripe) confirme e atualize a consulta e dispare “Pagamento confirmado! Agora, vamos agendar...” por WhatsApp.

- [ ] **Link de agendamento único**  
  - Após pagamento: gerar link com token (ex.: `/agendar/[token]` ou `/agendamento?bookingToken=...`) que identifica a consulta e mostra apenas seletor de data/hora; ao salvar, atualizar `Consultation.scheduledAt` e enviar confirmação com link do Meet.

### 3.4 Lembretes e dia da consulta

- [ ] **Cron/job para lembretes**  
  - Lembrete “no dia” (ex.: 7h).  
  - Lembrete 1h antes (usar template existente).  
  - Lembrete + link Meet 5 min antes.

- [ ] **Mensagem com botões (dia da consulta)**  
  - Enviar mensagem com botões "Tudo certo para hoje!" / "Gostaria de tirar dúvidas" (API WhatsApp/Twilio).  
  - No webhook, tratar a resposta (texto do botão) e, se desejado, registrar ou responder.

### 3.5 Pós-consulta

- [ ] **Envio do link da receita por WhatsApp**  
  - Quando a receita for gerada/liberada: construir link de download (signed URL ou `/api/.../receita/[id]/download?token=...`) e enviar mensagem ao paciente com o link.

- [ ] **Follow-up e avaliação**  
  - Mensagens “Conseguiu visualizar a prescrição?” e “Avalie sua consulta” com link para feedback.

---

## 4. Ordem sugerida de implementação

| Fase | Escopo | Entregável |
|------|--------|------------|
| **1** | Site: entrada “patologia + nome” e redirecionamento WhatsApp | Página/etapa com patologias, modal com nome, botão "Falar com médico" que abre `wa.me` com texto pré-preenchido. |
| **2** | Webhook: receber mensagens e boas-vindas | Tratar mensagem recebida no webhook; salvar lead/conversa; enviar uma mensagem de boas-vindas (configurável). |
| **3** | Fluxo WhatsApp → pagamento | Quando “pronto” (manual ou regra): criar paciente + consulta (ou pedido); gerar link de pagamento; enviar por WhatsApp; ao confirmar pagamento, enviar “Pagamento confirmado! Agora, vamos agendar...” e link de agendamento. |
| **4** | Link de agendamento pós-pagamento | Página `/agendar/[token]` (ou equivalente) que mostra só data/hora; ao salvar, confirma consulta e envia mensagem com data, horário e link do Meet. |
| **5** | Lembretes automatizados | Cron: lembrete no dia, 1h antes, 5 min antes (com link Meet). Opcional: botões no lembrete do dia. |
| **6** | Receita e feedback por WhatsApp | Envio do link da receita após emissão; mensagens de follow-up e link “Avalie sua consulta”. |

---

## 5. Resumo

Para replicar o fluxo da ClickCannabis:

1. **No site:** Ter uma entrada “leve” (patologia + nome) e um botão que redireciona para `wa.me` com mensagem pré-preenchida (nome + patologias), sem precisar de backend nessa etapa.
2. **No WhatsApp:** Passar a **receber** mensagens no webhook, responder com boas-vindas e, em um segundo momento, com fluxo de qualificação e envio de link de pagamento.
3. **Pagamento e agendamento:** Gerar link de pagamento após qualificação; após confirmação do pagamento, enviar link de agendamento “único” (por token); após o paciente escolher data/hora, confirmar e enviar link do Meet.
4. **Lembretes:** Automatizar lembretes no dia, 1h antes e 5 min antes (com link do Meet); opcionalmente com botões no dia.
5. **Pós-consulta:** Enviar link da receita por WhatsApp e mensagens de follow-up + link de avaliação.

O estudo anterior (**ESTUDO_FUNIL_CAPTACAO_WHATSAPP.md**) continua válido para: configuração de funil por dispositivo (mobile/desktop), uso de `SystemConfig` ou tabela de funil, e API pública de config. Este documento detalha o **fluxo concreto** da ClickCannabis e o que implementar em cada etapa para chegar ao mesmo resultado.
