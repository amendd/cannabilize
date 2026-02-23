# Fluxo do webhook Umbler Talk – detalhado

Documento que descreve, passo a passo, como uma mensagem recebida no WhatsApp (via Umbler Talk) é processada pelo nosso site e como as respostas são enviadas de volta.

---

## 1. Entrada: o que o Umbler envia

- **URL:** `POST https://SEU-DOMINIO.com/api/whatsapp/umbler-webhook`
- **Corpo:** JSON ou form-data com pelo menos:
  - **Remetente:** `from` ou `phone` ou `sender` ou `contact` ou `user` (número do WhatsApp; pode vir com sufixo `@c.us`)
  - **Texto:** `text` ou `body` ou `message` ou `content` ou `msg`

O webhook aceita `application/json` e `multipart/form-data`.

---

## 2. Fluxo geral (resumo)

```
POST /api/whatsapp/umbler-webhook
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Parse do payload (parseUmblerPayload)                         │
│    → phone (normalizado: remove @c.us), text                     │
│    → Se faltar from/phone ou não houver texto útil → 200, fim    │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Normalização do telefone (formatPhoneNumber)                  │
│    → Padrão Brasil 55 + DDD + 9 + 8 dígitos, sem caracteres     │
│    → Mesmo contato sempre com o mesmo phone no banco              │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Resposta rápida (getUmblerQuickResponse)                      │
│    → Pedido explícito de humano? → 1 mensagem, return 200        │
│    → FAQ (pagamento, valor, horários, legal)? → 1 mensagem, 200  │
│    → Senão → segue para o fluxo de captação                       │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Fluxo de captação (processIncomingMessage)                    │
│    → Lead por phone (cria se não existir)                        │
│    → Estado do lead (flowState) define a pergunta atual           │
│    → Valida resposta, atualiza lead, define próxima pergunta     │
│    → Retorna lista de mensagens a enviar                         │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Envio (sendUmblerMessage)                                    │
│    → Para cada mensagem em messagesToSend → API Umbler            │
│    → Resposta 200 { received: true }                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Resposta rápida (lib/umbler-webhook-handler.ts)

Antes de entrar no fluxo de captação, o texto é classificado:

### 3.1 Pedido explícito de humano

Se a mensagem bater com um destes padrões (regex):

- "quero falar com (um )?(humano|atendente|alguém|pessoa)"
- "falar com (um )?(humano|atendente|alguém)"
- "preciso de um atendente"
- "pessoa real"
- "não quero bot"
- "atendente humano"
- "quero reclamar"
- "falar com alguém da equipe"

→ Enviamos **uma única** mensagem: *"Vou te conectar com um atendente. Um momento, por favor."*  
→ Não chamamos o fluxo de captação (não pedimos nome, CPF, etc.).  
→ Resposta HTTP 200 e fim.

### 3.2 FAQ (perguntas frequentes)

Se a mensagem bater com um destes temas:

| Tema              | Exemplos de gatilho                          | Resposta (resumo)                                                                 |
|-------------------|-----------------------------------------------|------------------------------------------------------------------------------------|
| Pagamento         | "como faço o pagamento", "forma de pagamento" | Link após confirmação (PIX/cartão); se já confirmou, e-mail ou falar com atendente |
| Valor             | "qual o valor", "quanto custa", "R$"          | Consulta R$ 50, PIX/cartão via link após confirmação                               |
| Horários          | "horários disponíveis", "quando posso agendar"| Após nome, CPF, nascimento, patologias e anamnese enviamos as opções               |
| Legal / ANVISA    | "é legal", "anvisa", "polícia", "receita"     | Regulamentado pela ANVISA; receita e autorização; CannabiLize cuida da documentação |

→ Enviamos **uma única** mensagem com o texto da FAQ.  
→ Não chamamos o fluxo de captação.  
→ Resposta HTTP 200 e fim.

### 3.3 Caso contrário

→ `getUmblerQuickResponse` retorna `null` e o fluxo segue para `processIncomingMessage`.

---

## 4. Fluxo de captação (lib/whatsapp-capture-flow.ts)

O estado do lead (`flowState`) está na tabela `WhatsAppLead` e define qual pergunta o usuário está “respondendo”.

### 4.1 Estados na ordem do fluxo

| Estado           | Significado                    | O que o sistema faz com a resposta |
|------------------|--------------------------------|-------------------------------------|
| WELCOME          | Boas-vindas já enviadas        | —                                    |
| ASK_NAME         | Pediu nome completo            | Valida (≥3 caracteres), salva, avança |
| ASK_CPF          | Pediu CPF                      | Valida 11 dígitos, salva, avança    |
| ASK_BIRTH        | Pediu data de nascimento       | Valida DD/MM/AAAA ou 8 dígitos, salva, avança |
| ASK_PATHOLOGIES  | Pediu patologias               | Números (1–19) ou texto livre (≥10 chars), salva, avança |
| ANAMNESE         | Pediu histórico/motivo         | Aceita texto (até 5000 chars), salva, avança |
| ASK_SLOT         | Pediu escolha de horário       | Número da lista (1 a N), salva, avança |
| CONFIRM          | Resumo e confirmação          | Cria paciente/consulta, envia links de pagamento e cadastro |

Ordem linear:  
`WELCOME → ASK_NAME → ASK_CPF → ASK_BIRTH → ASK_PATHOLOGIES → ANAMNESE → ASK_SLOT → CONFIRM`

### 4.2 Regras especiais antes dos estados de captação

1. **Primeira mensagem (lead não existe)**  
   - Cria lead com `flowState: 'WELCOME'`.  
   - Envia: **boas-vindas** (capture-funnel) + **próximos passos** (se houver) + **“Por favor, digite seu nome completo”**.  
   - Atualiza lead para `flowState: 'ASK_NAME'`.

2. **Reinício (não é primeira mensagem)**  
   - Se o texto for exatamente uma destas palavras (case-insensitive): **reiniciar**, **resetar**, **começar**, **iniciar**, **oi**, **olá**, **teste**  
   - E o estado **não** for `CONFIRM`:  
   - Envia de novo boas-vindas + próximos passos + pedido de nome.  
   - Atualiza lead para `flowState: 'ASK_NAME'`.

3. **Corrigir (estado CONFIRM)**  
   - Se o texto contiver **“corrigir”**:  
   - Volta para `ASK_NAME` e envia “Para corrigir, digite seu nome completo novamente” + prompt de nome.

4. **Estado WELCOME (reentrada)**  
   - Se o lead já existe e está em `WELCOME`:  
   - Atualiza para `ASK_NAME` e envia só o prompt de nome.

### 4.3 Estados de captação (ASK_NAME até ASK_SLOT)

Para cada mensagem:

1. **Valida** a resposta com `parseAndValidateAnswer(state, text)`:
   - **ASK_NAME:** mínimo 3 caracteres.
   - **ASK_CPF:** 11 dígitos.
   - **ASK_BIRTH:** DD/MM/AAAA ou 8 dígitos.
   - **ASK_PATHOLOGIES:**  
     - Números entre 1 e 19 (lista de patologias) **ou**  
     - Texto livre com ≥10 caracteres (gravado como “Relato livre” + anamnese).
   - **ANAMNESE:** qualquer texto (até 5000 caracteres).
   - **ASK_SLOT:** número de 1 a N (N = quantidade de opções de horário).

2. Se **inválido:**  
   - Envia mensagem de erro (`❌ ...`) e, em ASK_PATHOLOGIES e ASK_SLOT, reenvia o prompt da etapa.  
   - **Não** avança o estado.

3. Se **válido:**  
   - `applyAnswerAndAdvance`: salva os dados no lead, atualiza `metadata` quando for patologias ou slot, e avança o estado.

4. **Atalho patologias em texto livre:**  
   - Se estava em ASK_PATHOLOGIES, a resposta foi texto livre (anamnese preenchida) e o próximo estado seria ANAMNESE:  
   - O fluxo **pula** ANAMNESE e vai direto para **ASK_SLOT** (escolha de horário).

5. **Próxima mensagem ao usuário:**  
   - **ASK_SLOT:** monta lista de horários disponíveis (até 7 dias, até 10 slots) com `buildSlotOptionsAndMessage`, grava em `metadata.slotOptions`.  
   - **CONFIRM:** monta resumo (nome, CPF, nascimento, patologias, anamnese, data/hora) com `buildConfirmMessage`; chama `createPatientAndConsultationFromLead`; envia resumo + links de pagamento e de concluir cadastro (e em caso de erro, mensagem de aviso).

### 4.4 Lista de patologias (ASK_PATHOLOGIES)

O usuário pode responder com **números** (ex.: "1, 2, 8") ou com **texto livre** (ex.: "tenho ansiedade, insônia, bruxismo, quero tentar CBD").

Patologias numeradas (1 a 19):  
Alcoolismo, Ansiedade, Perda de peso, Obesidade, Depressão, Dores, Epilepsia, Insônia, Tabagismo, Autismo, Enxaqueca, Fibromialgia, Parkinson, TDAH, Alzheimer, Anorexia, Crohn, Intestino irritável, Bruxismo.

---

## 5. Origem das mensagens de boas-vindas e próximos passos

- **getWelcomeMessage** e **getNextStepsMessage** vêm de `lib/capture-funnel.ts`.
- Valores configuráveis no admin (SystemConfig):  
  `CAPTURE_WHATSAPP_WELCOME_MESSAGE`, `CAPTURE_WHATSAPP_NEXT_STEPS_MESSAGE`.
- Padrão de boas-vindas (alinhado à Lizze):  
  *"Olá! Sou a Lize, assistente virtual da CannabiLize. Vou te guiar em poucos passos para agendar sua consulta médica online."*

---

## 6. Envio das respostas (lib/umbler-talk.ts)

- Para cada string em `messagesToSend`, o webhook chama `sendUmblerMessage(phone, msg)`.
- A função usa a API do Umbler Talk (Bearer JWT em `UMBLER_TALK_TOKEN`) para enviar a mensagem ao número `phone`.
- Base URL configurável: `UMBLER_TALK_API_BASE_URL` (padrão `https://app-utalk.umbler.com/api`).

---

## 7. Arquivos envolvidos

| Arquivo | Função |
|---------|--------|
| `app/api/whatsapp/umbler-webhook/route.ts` | Entrada POST, parse, normalização, quick response, chamada ao fluxo, envio via Umbler |
| `lib/umbler-webhook-handler.ts` | Lógica de “pedido de humano” e FAQ (getUmblerQuickResponse) |
| `lib/whatsapp-capture-flow.ts` | Estados, validação, avanço do lead, montagem de mensagens (processIncomingMessage) |
| `lib/capture-funnel.ts` | Mensagens de boas-vindas e próximos passos (admin / padrão Lizze) |
| `lib/umbler-talk.ts` | Envio de mensagem via API Umbler (sendUmblerMessage) |
| `lib/whatsapp.ts` | formatPhoneNumber (normalização do número) |

---

## 8. Variáveis de ambiente

- **UMBLER_TALK_TOKEN** – JWT/chave da API Umbler Talk (obrigatório para envio).
- **UMBLER_TALK_API_BASE_URL** – (opcional) base da API.
- **UMBLER_TALK_SEND_PATH** – (opcional) path para enviar mensagem.
- **APP_URL** ou **NEXTAUTH_URL** ou **VERCEL_URL** – usados como `origin` para gerar links de pagamento e concluir cadastro.

---

## 9. Diagrama simplificado do estado do lead

```
                    primeira mensagem
                          │
                          ▼
  ┌─────────┐    nome    ┌─────────┐   CPF   ┌──────────┐   nasc.   ┌─────────────────┐
  │ WELCOME │───────────►│ASK_NAME │────────►│ ASK_CPF  │──────────►│   ASK_BIRTH      │
  └─────────┘            └─────────┘         └──────────┘           └────────┬─────────┘
       ▲                       ▲                    ▲                        │
       │                       │                    │                        │ patologias
       │  "oi"/"reiniciar"     │ "corrigir"        │                        ▼
       │  (não CONFIRM)        │ (só em CONFIRM)    │           ┌─────────────────────┐
       └──────────────────────┴────────────────────┴───────────►│  ASK_PATHOLOGIES   │
                                                                └────────┬───────────┘
                                                                         │ números ou
                                                                         │ texto livre
                                                                         ▼
  ┌────────────┐   slot    ┌──────────┐   confirma   ┌─────────┐     ┌──────────┐
  │  ASK_SLOT  │◄──────────│ ANAMNESE │◄─────────────│(texto   │     │ (texto   │
  └─────┬──────┘           └────┬─────┘   livre pula │ livre)  │     │  números)│
        │                       │         anamnese)   └─────────┘     └──────────┘
        │ número 1..N           │ texto
        ▼                       │
  ┌──────────┐                  │
  │ CONFIRM  │──────────────────┘
  └────┬─────┘
       │ createPatientAndConsultationFromLead
       ▼
  links (pagamento + concluir cadastro)
```

---

Este é o fluxo completo do webhook Umbler: da entrada do POST até o envio das mensagens de volta e a criação do agendamento no estado CONFIRM.
