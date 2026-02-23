# Z-API: enviando mensagem e não recebendo retorno

Siga este checklist quando você **envia uma mensagem** para o número conectado na Z-API e **não recebe resposta** do sistema.

---

## 1. URL do webhook está configurada na Z-API?

No **painel da Z-API** (z-api.io):

1. Vá em **Webhooks e configurações gerais** (ou editar instância).
2. No campo **"Ao receber"** (Upon receiving / Receive), a URL deve ser:
   - **Produção:** `https://SEU-DOMINIO.com/api/whatsapp/zapi-webhook`
   - **Local com túnel (ngrok):** `https://SEU-TUNEL.ngrok.io/api/whatsapp/zapi-webhook`
3. **Salve** a alteração.

Se estiver em branco ou com outra URL, a Z-API **não chama** seu servidor quando alguém manda mensagem — por isso não há retorno.

---

## 2. A URL do webhook está acessível pela internet?

A Z-API envia um **POST** do servidor deles para a sua URL. Por isso:

- **Não use** `http://localhost:3000/...` — a Z-API não consegue acessar seu PC.
- Em **desenvolvimento**, use um túnel (ngrok, Cloudflare Tunnel, etc.) e coloque a **URL pública** no "Ao receber".
- Em **produção**, use o domínio real (ex.: `https://seudominio.com/api/whatsapp/zapi-webhook`).

**Teste rápido:** abra no navegador:

`https://SEU-DOMINIO.com/api/whatsapp/zapi-webhook`

Deve retornar um JSON como:

```json
{ "ok": true, "message": "Webhook Z-API (Ao receber) está ativo. Use POST para mensagens.", "endpoint": "/api/whatsapp/zapi-webhook" }
```

Se a página não abrir ou der erro, o servidor está inacessível para a Z-API.

---

## 3. Z-API está habilitada no Admin?

No seu sistema:

1. Acesse **Admin** → **Integrações** (ou **WhatsApp**).
2. Abra a aba **Z-API**.
3. Confirme que está **habilitado** e que **Instance ID**, **Token** e, se exigido, **Client-Token** estão preenchidos.
4. Clique em **Salvar**.

Se Z-API estiver desabilitada, o webhook recebe o POST mas **não envia** a resposta de volta pelo WhatsApp.

---

## 4. Instância Z-API está conectada?

No painel da Z-API, a instância deve estar **Conectada** (WhatsApp vinculado). Se estiver desconectada, a Z-API não recebe mensagens e não dispara o webhook.

---

## 5. Enviando do número certo?

- A mensagem deve ser enviada **de outro número** (celular do cliente/lead) **para** o número conectado na Z-API.
- Se você enviar **do próprio número** conectado na Z-API (fromMe), o sistema **ignora** de propósito e não responde.

---

## 6. Ver os logs (descobrir onde parou)

Quando alguém manda mensagem, o servidor grava logs. Use isso para ver se o POST está chegando e se o envio da resposta falhou.

**Vercel:** Dashboard do projeto → **Logs** (Runtime Logs). Envie uma mensagem e filtre por `zapi-webhook`.

- **Não aparece** `[WhatsApp Z-API Webhook] POST recebido`  
  → A Z-API **não está chamando** sua URL. Revise o item 1 (URL no painel) e 2 (URL acessível).

- **Aparece** `POST recebido` mas **não** aparece `Processado`  
  → Payload pode estar sendo ignorado (ex.: tipo de evento diferente, sem texto, fromMe). Veja o log "Extraído" e "Ignorado".

- **Aparece** `Falha ao enviar`  
  → O envio via Z-API falhou (token, Client-Token ou Instance ID). Corrija em Admin → WhatsApp (Z-API) e teste de novo.

---

## 7. Rate limit (já corrigido no código)

As rotas em `/api/whatsapp` foram **excluídas do rate limit** do middleware. Assim, callbacks da Z-API não são bloqueados por limite de requisições.

---

## Resumo rápido

| Sintoma                         | O que fazer |
|---------------------------------|-------------|
| Nada chega no WhatsApp          | URL "Ao receber" no painel Z-API correta; URL acessível; Z-API habilitada no Admin; instância conectada. |
| Só falha ao enviar              | Conferir Token, Instance ID e Client-Token (Segurança) no Admin → Z-API. |
| Resposta só na simulação        | Usar URL **pública** no "Ao receber" (domínio ou túnel), não localhost. |

Com isso você consegue identificar e corrigir o ponto em que o retorno está falhando.
