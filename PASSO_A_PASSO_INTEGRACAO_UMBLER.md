# Passo a passo: Integrar Umbler ao nosso fluxo

Guia em ordem para conectar a Umbler (hospedagem e/ou Umbler Talk) ao fluxo de agendamento e WhatsApp da CannabiLize/ClickCannabis.

---

## Visão rápida

- **Umbler (PaaS)** = onde a aplicação pode ficar hospedada (URL pública).
- **Umbler Talk (uTalk)** = atendente de IA no WhatsApp (opcional).
- **Nosso fluxo** = captação (nome, CPF, nascimento, patologias, anamnese, horário, confirmação) + links de pagamento e cadastro.

Você pode: **(A)** só hospedar na Umbler e manter o fluxo no nosso código (Meta/Twilio → nosso webhook), **(B)** usar o agente de IA do uTalk para conduzir a conversa e nossa API só para dados (horários, confirmação, links), ou **(C)** **integrar a API do Umbler no nosso site** – Umbler envia mensagens para nosso webhook e nosso site responde via API Umbler (fluxo 100% no nosso código; não precisa configurar estágios no painel uTalk). Ver **INTEGRAR_API_UMBLER_NO_SITE.md**.

---

## Passo 1 – Ter uma URL pública da aplicação

O webhook e a integração precisam de uma URL acessível na internet.

- **Para teste:** use ngrok: `npm run dev:tunnel` (ou `ngrok http 3000` em outro terminal). Anote a URL, ex.: `https://xxxx.ngrok-free.app`.
- **Para produção:** faça o deploy na Umbler (ou outro host) e use a URL do app, ex.: `https://seu-app.umbler.io`.

**URL base que você vai usar nos passos abaixo:** `https://SUA-URL` (ngrok ou Umbler).

---

## Passo 2 – Escolher quem conduz o fluxo

| Opção | Quem conduz | Onde configurar o “link do webhook” |
|-------|-------------|-------------------------------------|
| **A – Nosso backend** | Nosso código (`whatsapp-capture-flow.ts`) | No **Meta for Developers** ou **Twilio** (config do WhatsApp) |
| **B – Agente uTalk** | IA do Umbler Talk | No painel do **Umbler Talk** (webhook/API para chamar nossa aplicação) |

- **Escolha A:** fluxo 100% no nosso código; WhatsApp envia mensagens direto para nossa API.  
- **Escolha B:** agente de IA do uTalk conduz a conversa; nossa API só fornece horários, confirma agendamento e devolve links.

Siga o passo 3 **ou** os passos 4–7 conforme a opção escolhida.

---

## Passo 3 – Integração quando NOSSO backend conduz o fluxo (Opção A)

Use este caminho se o WhatsApp (Meta ou Twilio) vai enviar as mensagens **direto** para nossa aplicação.

1. **Garantir que a app está no ar** na URL pública (ngrok ou Umbler).
2. **Configurar o webhook no provedor do WhatsApp:**
   - **Meta (WhatsApp Cloud API):** Em [Meta for Developers](https://developers.facebook.com) → seu app → WhatsApp → Configuração → Webhook:
     - URL de callback: `https://SUA-URL/api/whatsapp/webhook`
     - Token de verificação: o mesmo valor que está em **Admin da nossa plataforma → WhatsApp** (ou em `WHATSAPP_WEBHOOK_VERIFY_TOKEN` no .env).
   - **Twilio:** No painel Twilio → Messaging → “When a message comes in”:
     - URL: `https://SUA-URL/api/whatsapp/webhook` (método POST).
3. **Variáveis de ambiente** (na Umbler ou .env):
   - `APP_URL` = `https://SUA-URL`
   - `NEXTAUTH_URL` = `https://SUA-URL`
   - Se Twilio: `TWILIO_WEBHOOK_BASE_URL` = `https://SUA-URL`
4. **Testar:** enviar uma mensagem para o número WhatsApp; o fluxo (boas-vindas, nome, CPF, etc.) deve seguir o que está em `lib/whatsapp-capture-flow.ts`.

Neste cenário **não** é obrigatório configurar nada no Umbler Talk; o fluxo é todo definido pelo nosso webhook.

---

## Passo 4 – Criar e configurar o agente no Umbler Talk (Opção B)

Use quando o **agente de IA do uTalk** vai conduzir a conversa e nossa API só vai fornecer dados e ações.

**Guia completo da Opção B (processo detalhado):** `OPCAO_B_UMBLER_TALK_DETALHADO.md`

1. **Acessar o Umbler Talk (uTalk)**  
   Painel em [utalk.umbler.com](https://utalk.umbler.com) (ou pelo painel Umbler).

2. **Criar / editar o agente**
   - Nome do agente, ex.: **Lize**.
   - No campo de **descrição / instrução do agente**, colar o texto da seção **“Descrição da IA”** do arquivo `UMBLER_TALK_ATENDENTE_IA.md` (bloco que começa com “Você é a assistente virtual da CannabiLize…”).

3. **Base de conhecimento**  
   Incluir os tópicos da **seção 4** do `UMBLER_TALK_ATENDENTE_IA.md` (CannabiLize, consulta e valor, processo em 4 etapas, legalidade, agendamento, patologias, receita, o que a IA não deve fazer).

4. **Estágios da conversa**  
   Criar os estágios na ordem do documento (Saudação → Nome → CPF → Nascimento → Patologias → Anamnese → Horário → Resumo e confirmação), com as instruções indicadas na **seção 3** do `UMBLER_TALK_ATENDENTE_IA.md`.

5. **Intenções**  
   Configurar as intenções da **seção 2** (encerrar chat, falar com humano, reiniciar fluxo, confirmar dados, corrigir dados, mídia inválida, etc.) e vincular às ações correspondentes.

6. **Integração com nossa API (webhook/URL do backend)**  
   No uTalk, onde houver campo para **URL do backend** ou **webhook**:
   - **URL base:** `https://SUA-URL` (mesma do passo 1).
   - Exemplos de uso (conforme a API do uTalk):
     - Para **horários disponíveis:** nossa API pode expor algo como `GET https://SUA-URL/api/availability/slots?date=YYYY-MM-DD` (se existir ou for criada).
     - Para **confirmar agendamento e receber links:** algo como `POST https://SUA-URL/api/umbler-talk/confirm-booking` (ou rota que criarmos) com os dados coletados pela IA; a resposta pode trazer link de pagamento e link de concluir cadastro.

   Consultar a documentação do uTalk ([utalk.umbler.com/site/api](https://utalk.umbler.com/site/api), webhook) para o formato exato de chamada e onde colar essa URL.

7. **Conectar o número de WhatsApp ao uTalk**  
   No painel do uTalk, vincular o número que receberá as conversas ao agente configurado.

---

## Passo 5 – Deploy na Umbler (hospedagem) – opcional

Se quiser que a aplicação rode na Umbler em vez de outro host:

1. Criar **projeto Node.js** no painel Umbler e conectar o repositório Git.
2. Configurar **variáveis de ambiente** (mínimo: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `APP_URL`). Ver lista completa em `GUIA_INTEGRACAO_UMBLER.md`, seção 2.6.
3. Fazer **deploy:** `git push umbler main` (ou o branch que a Umbler usar).
4. Rodar **migrações** do banco (SSH ou job): `npx prisma migrate deploy` ou `npx prisma db push`.
5. Usar a **URL do app na Umbler** como `SUA-URL` em todos os passos acima (webhook Meta/Twilio ou URL do backend no uTalk).

Detalhes: `GUIA_INTEGRACAO_UMBLER.md`.

---

## Passo 6 – Resumo: onde colocar o link do webhook

| Onde você coloca o link | Quem define o fluxo | Link a usar |
|------------------------|----------------------|-------------|
| **Meta for Developers** ou **Twilio** (config do WhatsApp) | Nosso backend | `https://SUA-URL/api/whatsapp/webhook` |
| **Umbler Talk** (campo “URL do backend” / webhook) | Agente de IA do uTalk | `https://SUA-URL` (base); rotas específicas conforme API do uTalk (ex.: `/api/availability/slots`, `/api/umbler-talk/confirm-booking`) |

---

## Passo 7 – Testar

- **Opção A (nosso webhook):** Enviar mensagem no WhatsApp → deve responder com boas-vindas e seguir nome, CPF, etc., conforme `whatsapp-capture-flow.ts`. Verificar logs no servidor (Next.js) e no painel Meta/Twilio.
- **Opção B (uTalk):** Enviar mensagem no número conectado ao uTalk → o agente (Lize) deve responder e seguir os estágios. Se configurou chamadas à nossa API (horários, confirmação), testar até a confirmação e checar se os links de pagamento e cadastro chegam.

---

## Referências no projeto

| Arquivo | Uso |
|---------|-----|
| `GUIA_INTEGRACAO_UMBLER.md` | Deploy na Umbler, variáveis, cenários uTalk |
| `UMBLER_TALK_ATENDENTE_IA.md` | Descrição da IA, estágios, base de conhecimento, intenções |
| `lib/whatsapp-capture-flow.ts` | Fluxo quando nosso backend conduz (estados e mensagens) |
| `app/api/whatsapp/webhook/route.ts` | Endpoint do webhook WhatsApp |
| `OPCAO_B_UMBLER_TALK_DETALHADO.md` | Processo detalhado da Opção B (uTalk + nossa API) |
| `app/api/umbler-talk/confirm-booking/route.ts` | API de confirmação de agendamento chamada pelo uTalk |
| `INTEGRAR_API_UMBLER_NO_SITE.md` | Integrar API Umbler no site (webhook + envio via API; fluxo no nosso código) |
| `lib/umbler-talk.ts` | Cliente para enviar mensagem via API Umbler |
| `app/api/whatsapp/umbler-webhook/route.ts` | Webhook que recebe do Umbler e usa nosso fluxo + API Umbler para responder |
