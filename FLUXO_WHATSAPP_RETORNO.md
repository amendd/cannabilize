# Fluxo de retorno WhatsApp – quando o paciente envia a primeira mensagem

## O que acontece

1. O paciente clica em **Falar com médico** no site e abre o WhatsApp com a mensagem pré-preenchida.
2. O paciente **envia** a mensagem para o número configurado (ex.: Twilio Sandbox ou número Business).
3. O **Twilio** recebe a mensagem e envia um POST para o webhook da aplicação: `POST /api/whatsapp/webhook`.
4. O webhook:
   - Cria ou atualiza o registro do lead em `WhatsAppLead`.
   - Na **primeira mensagem** do número: envia a **mensagem de boas-vindas** (configurável no admin) e, se configurada, a **mensagem de próximos passos**.
5. O paciente recebe as mensagens no WhatsApp.

## Requisitos para o retorno funcionar

### 1. Webhook acessível pelo Twilio

O Twilio chama a sua aplicação pela internet. Por isso:

- **Produção:** use a URL do seu domínio, ex.: `https://seu-dominio.com/api/whatsapp/webhook`.
- **Desenvolvimento local:** use um túnel (ngrok, Cloudflare Tunnel, etc.) e configure no Twilio a URL pública, ex.: `https://abc123.ngrok.io/api/whatsapp/webhook`.

Se o webhook for só `http://localhost:3000/...`, o Twilio não consegue acessar e o paciente **não** recebe o retorno.

### 2. Configuração no Twilio

No Console do Twilio → Messaging → Try it out → Send a WhatsApp message:

- Em **“When a message comes in”**, coloque a URL do webhook (ex.: `https://seu-dominio.com/api/whatsapp/webhook`).
- Método: **POST**.

### 3. Validação da assinatura (opcional)

Se em produção a validação da assinatura do Twilio falhar (por causa da URL usada no serverless), defina no ambiente:

- `TWILIO_WEBHOOK_BASE_URL` = URL pública do site (ex.: `https://seu-dominio.com`)

Ou `NEXT_PUBLIC_APP_URL` / `VERCEL_URL` (a rota `/api/whatsapp/webhook` é montada automaticamente).

### 4. Número do paciente

O número usado para **responder** é o `From` que o Twilio envia no webhook. A aplicação formata para E.164 e preserva o código do país (Brasil +55, EUA +1, etc.), para que o envio de volta funcione.

### 5. Mensagens configuradas no admin

Em **Admin → Fluxos WhatsApp**:

- **Mensagem de boas-vindas:** enviada na primeira mensagem do paciente.
- **Mensagem de próximos passos (opcional):** enviada em seguida (ex.: valor da consulta, link de pagamento depois).

Se a mensagem de boas-vindas estiver vazia, usa-se o texto padrão da aplicação.

## Resumo

| Onde | O que fazer |
|------|-------------|
| Twilio Console | “When a message comes in” = `https://seu-dominio.com/api/whatsapp/webhook` (POST) |
| Local | Expor o app com ngrok e usar essa URL no Twilio |
| Admin → Fluxos WhatsApp | Preencher boas-vindas e, se quiser, próximos passos |
| Produção (se der 403) | Definir `TWILIO_WEBHOOK_BASE_URL` com a URL pública do site |

Assim, quando o paciente envia a mensagem, ele passa a receber o retorno e o fluxo definido (boas-vindas + próximos passos).
