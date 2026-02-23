# Diagnóstico: mensagem enviada e nada acontece

Siga estes passos para descobrir onde está o problema.

---

## 1. O webhook está sendo chamado?

**Com o servidor rodando localmente** (e o ngrok apontando para ele):

1. Envie uma mensagem no WhatsApp para o número do sandbox/Twilio.
2. Olhe o **terminal** onde o Next.js está rodando.

**Se aparecer algo como:**
```text
[WhatsApp Webhook] POST recebido { formKeys: [...], from: 'whatsapp:+55...', bodyPreview: '...' }
```
→ O Twilio **está** chegando no seu servidor. Siga para o passo 2.

**Se não aparecer nada** no terminal:
→ O Twilio **não** está chamando sua URL ou está caindo em outra resposta (ex.: página do ngrok).

- Confirme no **Twilio Console** → **Monitor** → **Logs** se há requisições para a URL do webhook.
- Confirme a URL configurada: `https://crushingly-genealogic-terica.ngrok-free.dev/api/whatsapp/webhook` (POST).
- Para WhatsApp Sandbox: **Messaging** → **Try it out** → **Send a WhatsApp message** → em **“When a message comes in”** deve estar exatamente essa URL.

---

## 2. O que o log mostra depois do POST?

No mesmo log do POST, veja:

- **`formKeys`** – Devem aparecer coisas como `From`, `To`, `Body`, `MessageSid`. Se `Body` ou `From` não estiverem na lista, o Twilio pode estar enviando outro tipo de evento.
- **`from`** – Deve ser algo como `whatsapp:+5511999999999`. Se estiver `(vazio)`, a requisição não é de mensagem recebida.
- Se aparecer **`[WhatsApp Webhook] Assinatura inválida`** ou **`Validation error`** → a validação do Twilio está falhando. Solução: em **Admin** → **WhatsApp**, deixe o campo **“Auth Token (webhook)”** em branco para testes, ou defina **`TWILIO_WEBHOOK_BASE_URL`** exatamente como a URL pública (ex.: `https://crushingly-genealogic-terica.ngrok-free.dev`).

---

## 3. A resposta está sendo enviada?

No terminal, depois do POST, procure:

- **`[WhatsApp Webhook] Processando mensagem recebida de:`** → A mensagem foi reconhecida.
- **`[WhatsApp Webhook] Boas-vindas enviadas para:`** → A resposta foi enviada com sucesso.
- **`[WhatsApp Webhook] Falha ao enviar boas-vindas:`** ou **`[WhatsApp] Não enviado: integração desabilitada`** → O envio falhou.

**Se “Falha ao enviar” ou “Não enviado”:**

1. **Admin** → **Integrações** → **WhatsApp** (ou **Configurações** → **WhatsApp**):
   - Integração **habilitada** (checkbox ativo).
   - **Account SID**, **Auth Token** e **Número** preenchidos (número no formato `whatsapp:+14155238886` para sandbox).
2. Se estiver usando **Sandbox**: o número que **envia** a mensagem para o sandbox precisa ter “entrado” no sandbox (ex.: enviou “join código” para o número do Twilio). O **destino** da resposta é esse mesmo número (o seu).

---

## 4. Testar se o ngrok entrega no seu app

No navegador, abra:

```text
https://crushingly-genealogic-terica.ngrok-free.dev/api/whatsapp/webhook
```

Deve aparecer algo como: `{"message":"WhatsApp Webhook endpoint"}`.

- Se aparecer isso → o ngrok está levando até a sua aplicação.
- Se aparecer a página do ngrok (“Visit Site” etc.) → em chamadas do Twilio, o ngrok pode estar devolvendo essa página em vez do seu backend; aí o POST não chega ao Next.js.

---

## 5. Resumo rápido

| Onde verificar | O que fazer |
|----------------|-------------|
| Terminal do Next | Aparece `[WhatsApp Webhook] POST recebido`? Se não, Twilio não está chegando (URL/ngrok). |
| Twilio Monitor → Logs | Ver status da requisição ao webhook (200, 403, 500). |
| Admin → WhatsApp | Habilitado, SID, Token, Número preenchidos. |
| “When a message comes in” | URL = `https://crushingly-genealogic-terica.ngrok-free.dev/api/whatsapp/webhook` (POST). |
| Auth Token (webhook) | Para teste, deixar em branco ou ajustar `TWILIO_WEBHOOK_BASE_URL`. |

Depois de enviar uma mensagem, copie o que aparecer no terminal (logs do webhook) e use isso para checar cada item acima.

---

## Mensagens "Outgoing API" com status Undelivered

Se no **Twilio** → **Monitor** → **Logs** você vê:
- **Incoming**: Received (mensagens do paciente chegando)
- **Outgoing API**: **Undelivered** (respostas da sua app não entregues)

então o **webhook está sendo chamado** e a sua app **está pedindo** o envio, mas o **Twilio/WhatsApp não está entregando** a mensagem ao número do paciente.

### O que fazer

1. **Clique em "Troubleshoot"** em uma das mensagens **Undelivered** no Twilio. A página de detalhes mostra o motivo (código de erro e explicação).
2. **Causas comuns:**
   - **Janela de 24 horas do WhatsApp:** Depois que o usuário manda a primeira mensagem, você pode enviar mensagens livres por até 24 horas. Fora desse período, o WhatsApp exige uso de **templates aprovados**. Se a resposta sair com atraso ou fora da janela, pode dar Undelivered.
   - **Sandbox:** O número que **recebe** a resposta (o paciente) precisa ter “entrado” no sandbox: enviar "join &lt;código&gt;" do WhatsApp desse número para o número do Twilio (+1 415 523 8886).
   - **Número inválido ou bloqueado:** Formato errado ou número que não aceita mensagens de negócio.
3. **Garantir resposta imediata:** O webhook deve responder e chamar o envio o mais rápido possível (sem esperar muito no código), para não sair da janela de 24h.
4. **Para produção:** Com número WhatsApp Business aprovado, o comportamento da janela e dos templates é o mesmo; use templates quando estiver fora da janela.

### Erro 63058 – "Business is restricted from messaging users in this country"

Se o **Troubleshoot** mostrar **Error Code: 63058**, significa que o **remetente** (número do Twilio/Sandbox) **não pode enviar mensagens para o país do destinatário**.

- **Sandbox Twilio:** O número do sandbox é dos EUA (+1 415 523 8886). Muitas contas/sandbox estão **restritas a não enviar para o Brasil** (+55). Por isso as mensagens para +55 7991269833 ficam **Undelivered**.
- **O que fazer:**
  1. **Para testar agora:** Use um número de **país permitido** (ex.: EUA) que tenha entrado no sandbox ("join &lt;código&gt;") e envie a mensagem de teste desse número. A resposta do webhook deve ser entregue para esse número.
  2. **Para produção no Brasil:** É preciso usar um **número WhatsApp Business** aprovado que possa enviar para o Brasil (ex.: número brasileiro ou número aprovado para o país). O Sandbox dos EUA não substitui isso.
- **Documentação:** [Twilio Error 63058](https://www.twilio.com/docs/api/errors/63058) e política de países do WhatsApp Business.

---

## Nada apareceu no terminal – o que conferir

Se você enviou a mensagem no WhatsApp e **nenhum** log `[WhatsApp Webhook] POST recebido` apareceu no terminal do Next.js, a requisição do Twilio **não está chegando** nessa aplicação. Confira na ordem:

### 1. Ngrok está apontando para o mesmo processo do Next.js?

O ngrok precisa estar redirecionando para a **mesma** máquina e porta onde o `next-server` está rodando (geralmente `http://localhost:3000`).

- No **outro** terminal (não o do Next), você deve ter iniciado o ngrok, algo como:
  ```bash
  ngrok http 3000
  ```
- A URL que o ngrok mostra (ex.: `https://crushingly-genealogic-terica.ngrok-free.dev`) é essa que você usa no Twilio.
- Se o Next.js estiver em outra porta (ex.: 3001), use `ngrok http 3001`.
- Se você fechou o ngrok ou reiniciou o PC, a URL do ngrok pode ter mudado (no plano free). Nesse caso, atualize a URL no Twilio para a nova URL do ngrok + `/api/whatsapp/webhook`.

### 2. Twilio está usando a URL certa?

- Acesse **Twilio Console** → **Messaging** → **Try it out** → **Send a WhatsApp message**.
- Na parte do **Sandbox**, procure **"When a message comes in"** (ou **"Webhook URL"**).
- A URL deve ser **exatamente**:  
  `https://crushingly-genealogic-terica.ngrok-free.dev/api/whatsapp/webhook`  
  (sem barra no final, método **POST**).
- Se a URL do ngrok mudou, coloque a nova URL + `/api/whatsapp/webhook` e **salve**.

### 3. Twilio está realmente chamando a URL?

- No **Twilio Console** → **Monitor** → **Logs** (ou **Developer Console** → **Logs**).
- Envie **de novo** uma mensagem no WhatsApp para o número do sandbox.
- Veja se aparece uma requisição **HTTP** para a sua URL de webhook.
  - Se **não** aparecer nenhuma requisição para essa URL → o webhook não está configurado no lugar certo (ex.: está em outro produto ou número).
  - Se **aparecer** e o status for **200** mas o corpo for HTML (página do ngrok) → o ngrok está mostrando a página “Visit Site” em vez de encaminhar para o Next.js; tente acessar a URL do webhook no navegador e ver se responde JSON.
  - Se aparecer **403** ou **500** → a requisição está chegando em algum lugar; aí vale ver se é outro servidor (ex.: Vercel) ou se o ngrok está apontando para outro processo.

### 4. Teste rápido no navegador

Abra no navegador:

```text
https://crushingly-genealogic-terica.ngrok-free.dev/api/whatsapp/webhook
```

- Se aparecer algo como `{"message":"WhatsApp Webhook endpoint"}` → o ngrok está entregando na sua aplicação (GET funciona). O próximo passo é garantir que o **Twilio** está mesmo usando essa URL para **POST** quando uma mensagem chega.
- Se aparecer a página do ngrok (“Visit Site”) → pode ser que o Twilio também receba essa página em vez do seu app; aí o problema é o ngrok ou a configuração do túnel.
