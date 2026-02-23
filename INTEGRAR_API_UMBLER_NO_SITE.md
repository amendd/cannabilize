# Integrar a API do Umbler no nosso site

Sim, **é mais fácil**: em vez do agente de IA do Umbler Talk conduzir a conversa e chamar nossa API (Opção B), **nosso site** usa a API do Umbler só para **enviar e receber** mensagens no WhatsApp. O **fluxo** (nome, CPF, horário, confirmação, links) continua 100% no nosso código.

---

## Por que é mais fácil

| Abordagem | Onde está o fluxo | O que você configura |
|-----------|-------------------|----------------------|
| **Opção B (uTalk conduz)** | No painel do Umbler Talk (estágios, intenções, base de conhecimento) | Agente, estágios, intenções, e nossa API para horários/confirmação |
| **API Umbler no nosso site** | No nosso código (`lib/whatsapp-capture-flow.ts`) | Só o canal: webhook Umbler → nosso site; nosso site envia resposta via API Umbler |

Com a API integrada no site:
- Um único lugar para alterar o fluxo (nosso código).
- Não precisa replicar estágios/intenções no painel do uTalk.
- Reaproveitamos o mesmo fluxo que já existe para Meta/Twilio; só trocamos o “transportador” das mensagens.

---

## Como funciona

```
[Paciente] → WhatsApp → [Umbler] → webhook POST para nosso site
                                      ↓
                    processIncomingMessage(phone, text)  (nosso fluxo)
                                      ↓
                    [Nosso site] envia mensagens via API Umbler
                                      ↓
[Umbler] → WhatsApp → [Paciente]
```

1. No **Umbler Talk**, você configura o **webhook** para: `https://SEU-DOMINIO.com/api/whatsapp/umbler-webhook`
2. Quando alguém manda mensagem no WhatsApp conectado ao Umbler, o Umbler envia um POST para essa URL com o número e o texto.
3. Nosso site processa com o fluxo atual (`whatsapp-capture-flow.ts`) e obtém as mensagens a enviar.
4. Nosso site chama a **API do Umbler** para enviar cada mensagem de volta ao paciente.

---

## O que foi implementado no projeto

1. **`lib/umbler-talk.ts`**  
   Função para enviar mensagem de texto via API do Umbler (token em variável de ambiente).

2. **`POST /api/whatsapp/umbler-webhook`**  
   Rota que:
   - Recebe o payload do Umbler (número e texto da mensagem recebida).
   - **Resposta dinâmica (evita redundância e transferência indevida):**
     - Se o paciente pedir **de forma clara** para falar com um humano (ex.: "quero falar com atendente", "pessoa real"), enviamos **uma única** mensagem: "Vou te conectar com um atendente. Um momento, por favor." e não repetimos perguntas do fluxo.
     - Se o paciente fizer **pergunta frequente** (ex.: "como faço o pagamento?", "qual o valor?", "horários disponíveis?"), respondemos com **uma mensagem objetiva** e não acionamos transferência.
   - Caso contrário, chama `processIncomingMessage` (fluxo de captação: nome → CPF → nascimento → patologias → anamnese → horário → confirmação).
   - Envia as respostas usando `lib/umbler-talk.ts`.

3. **`lib/umbler-webhook-handler.ts`**  
   Lógica de **pedido explícito de humano** (só frases claras disparam a mensagem de transferência) e **FAQ** (pagamento, valor, horários, legalidade). Assim o webhook fica mais dinâmico e a transferência para humano **não** ocorre "por qualquer motivo".

4. **Variáveis de ambiente**  
   - `UMBLER_TALK_TOKEN` – JWT / chave de acesso da API (veja “Autenticação” abaixo).  
   - Opcional: `UMBLER_TALK_API_BASE_URL` – base da API (padrão: `https://app-utalk.umbler.com/api`).  
   - Opcional: `UMBLER_TALK_SEND_PATH` – path para enviar mensagem (padrão: `/send/token/`).

---

## Autenticação na API oficial (Bearer JWT)

A documentação em **app-utalk.umbler.com/api/docs** usa o esquema **Bearer (JWT)**:

1. Abra [Umbler.U.Talk.Api – Documentação](https://app-utalk.umbler.com/api/docs/index.html).
2. Clique em **“Autorizar”** (cadeado no topo).
3. No modal **“Autorizações disponíveis”**: em **Valor**, cole o token JWT que você obteve no painel do uTalk (geração de chave de acesso).
4. Clique em **“Autorizar”** e feche.

No nosso site, use o **mesmo valor** na variável de ambiente:

```env
UMBLER_TALK_TOKEN=seu-jwt-aqui
```

O código envia esse token no cabeçalho `Authorization: Bearer <token>` em todas as chamadas à API.

---

## Passo a passo para usar

1. **Obter o token da API no Umbler**  
   No painel do uTalk/Umbler: criar uma chave de acesso da API e copiar o token.

2. **Configurar no nosso site**  
   No .env (ou variáveis de ambiente na Umbler/Vercel), use o **mesmo token** que você colocaria em “Autorizar” na documentação:
   ```env
   UMBLER_TALK_TOKEN=seu-jwt-ou-chave-de-acesso
   ```
   A API oficial usa base `https://app-utalk.umbler.com/api` e autenticação Bearer JWT; o padrão já está configurado no código.

3. **Configurar o webhook no Umbler**  
   No painel do Umbler Talk, em configurações de webhook (ou “Integrações”):
   - URL: `https://SEU-DOMINIO.com/api/whatsapp/umbler-webhook`
   - Método: POST  
   (Consulte a documentação do uTalk para o nome exato do campo e se há verificação.)

4. **Garantir que a aplicação está no ar**  
   A URL do webhook precisa ser acessível (deploy ou ngrok em teste).

5. **Testar**  
   Enviar uma mensagem para o número de WhatsApp conectado ao Umbler; o fluxo (boas-vindas, nome, CPF, etc.) deve responder automaticamente, com as mensagens saindo pela API do Umbler.

---

## Formato do payload do Umbler (webhook)

A rota `/api/whatsapp/umbler-webhook` espera um JSON no corpo do POST. Como o formato exato pode variar conforme a documentação do uTalk, a rota tenta extrair:

- **Número do remetente:** `body.from` ou `body.phone` ou `body.sender` (valor pode vir como `5511999999999` ou `5511999999999@c.us`).
- **Texto da mensagem:** `body.text` ou `body.body` ou `body.message` ou `body.content`.

Se o Umbler usar outros nomes de campo, basta ajustar o parsing em `app/api/whatsapp/umbler-webhook/route.ts` para refletir o payload real (você pode conferir nos logs o que está chegando).

---

## Por que o conteúdo no painel é diferente do WhatsApp real?

- **Teste no painel do Umbler:** a conversa é respondida pelo **agente configurado no uTalk** (ex.: Lizze), com o texto da base de conhecimento, estágios e descrição da IA. Por isso “boa tarde” ou “oi” recebem a resposta da Lizze (ex.: “Sou a Lize, assistente virtual da CannabiLize…”).

- **WhatsApp real (com webhook apontando para nosso site):** quem responde é o **nosso backend** (rota `umbler-webhook` + `lib/whatsapp-capture-flow.ts` + `lib/capture-funnel.ts`). O **texto** das mensagens vem daí: boas-vindas e “próximos passos” vêm de `getWhatsAppWelcomeMessage()` e `getWhatsAppNextStepsMessage()`, que usam as configurações do **Admin → Funil de captação** ou os padrões do código.

Para o conteúdo ficar **igual** ao do painel (Lizze):

1. **Padrões no código** – Os textos padrão em `lib/capture-funnel.ts` foram alinhados ao tom da Lizze (ex.: “Olá! Sou a Lize, assistente virtual da CannabiLize. Vou te guiar em poucos passos para agendar sua consulta médica online.”). Se você não alterou nada no Admin, o WhatsApp real passa a usar esse texto.
2. **Admin → Funil de captação** – Se você já configurou “Mensagem de boas-vindas WhatsApp” ou “Próximos passos”, esse valor continua prevalecendo. Para ficar igual ao painel, edite e cole o mesmo texto da Lizze (ver `UMBLER_TALK_ATENDENTE_IA.md`, seção 5 – Exemplos de mensagens).
3. **Não usar webhook para conteúdo** – Se quiser que **só** a Lizze responda (inclusive no WhatsApp), não configure o webhook para nosso site no canal WhatsApp; aí o Umbler encaminha todas as mensagens para a Lizze e o conteúdo será o mesmo do teste no painel (e o fluxo fica 100% no Umbler).

---

## Resumo

- **Integrar a API do Umbler no nosso site** = nosso backend recebe o webhook do Umbler e envia as respostas pela API do Umbler; o fluxo da conversa é o que já está em `lib/whatsapp-capture-flow.ts`.
- Não é necessário configurar estágios nem agente de IA no painel do uTalk para esse fluxo; o agente pode ficar desativado ou usado só para outro canal.
- Documentação oficial da API (Bearer JWT, v1): [app-utalk.umbler.com/api/docs](https://app-utalk.umbler.com/api/docs/index.html). Em “Autorizar” → “Autorizações disponíveis” você usa o mesmo token que configurar em `UMBLER_TALK_TOKEN`.  
- Webhook: [utalk.umbler.com/site/api/webhook](https://utalk.umbler.com/site/api/webhook).  
- **Se o envio retornar 404:** a API v1 pode usar outro path para mensagens. Defina `UMBLER_TALK_API_BASE_URL=https://api.utalk.chat` para usar a API legada de envio, ou confira na documentação o endpoint correto e defina `UMBLER_TALK_SEND_PATH`.
