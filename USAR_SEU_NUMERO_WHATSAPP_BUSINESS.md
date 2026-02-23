# Usar seu número WhatsApp Business no projeto

Se você já tem um número registrado no WhatsApp Business, pode usá-lo no projeto para **testar o fluxo completo** (incluindo envio para números brasileiros, sem o erro 63058 do Sandbox).

---

## 1. O número precisa estar no Twilio

Para a aplicação enviar e receber por esse número, ele precisa estar **conectado ao Twilio**:

- **Se o número já está no Twilio** (você registrou ou migrou por lá): siga direto para o passo 2.
- **Se o número está em outro provedor ou só no app WhatsApp Business:** é preciso **migrar/registrar no Twilio**.

### Links que funcionam (documentação Twilio)

- **Página principal WhatsApp no Twilio:**  
  https://www.twilio.com/docs/whatsapp

- **Registrar número novo (Self Sign-up) – pelo Console:**  
  https://www.twilio.com/docs/whatsapp/self-sign-up  
  No Console: **Messaging** → **Senders** → **WhatsApp Senders** → **Create new sender**.  
  Link direto do Console: https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders

- **Usar número já registrado no WhatsApp / migrar:**  
  Na mesma documentação (Self Sign-up), seção *"I want to use an already registered phone number"*:  
  https://www.twilio.com/docs/whatsapp/self-sign-up#i-want-to-use-an-already-registered-phone-number

- **Migrar número e senders (de outro BSP para Twilio):**  
  https://www.twilio.com/docs/whatsapp/migrate-numbers-and-senders

---

## 2. Configurar na sua aplicação (Admin)

1. Acesse **Admin** → **Integrações** → **WhatsApp** (ou **Admin** → **WhatsApp**).
2. Preencha:
   - **Habilitar integração:** ativado.
   - **Account SID:** o mesmo da sua conta Twilio (onde o número está).
   - **Auth Token:** o Auth Token dessa conta Twilio.
   - **Número WhatsApp:** no formato `whatsapp:+55XXXXXXXXX` (código do país + DDD + número, sem espaços).  
     Ex.: `whatsapp:+5521999998888`.
3. Salve.

Opcional (recomendado em produção):

- **Auth Token (webhook):** o mesmo Auth Token (ou o valor que o Twilio usar para assinar o webhook), para validação da assinatura.
- **URL do webhook:** só para referência; a URL efetiva é configurada no Twilio (próximo passo).

---

## 3. Configurar o webhook no Twilio para esse número

O Twilio precisa saber para onde enviar as **mensagens recebidas** nesse número:

1. No **Twilio Console** → **Messaging** → **Try it out** → **Send a WhatsApp message** (ou a seção onde aparece o **seu** número WhatsApp, não o Sandbox).
2. Se o seu número estiver em **Senders** / **WhatsApp Senders**: abra o número e procure **"When a message comes in"** (ou **Webhook URL**).
3. Defina:
   - **URL:** `https://sua-url-publica/api/whatsapp/webhook`  
     Em desenvolvimento: `https://sua-url-ngrok.ngrok-free.dev/api/whatsapp/webhook`
   - **Método:** POST
4. Salve.

Assim, quando alguém mandar mensagem para **seu** número WhatsApp Business, o Twilio chama essa URL e sua aplicação responde (boas-vindas, próximos passos, etc.).

---

## 4. Funil de captação (link “Falar com médico”)

Para o botão **“Falar com médico”** do site abrir o WhatsApp no **seu** número (e não no Sandbox):

1. **Admin** → **Fluxos WhatsApp** (ou **Funil de Captação**).
2. No campo **“Número WhatsApp (captação)”**, coloque o **mesmo** número (só dígitos):  
   Ex.: `5521999998888` ou `+5521999998888`.
3. Salve.

O link `wa.me` passará a usar esse número e as mensagens chegarão no seu WhatsApp Business; o webhook será chamado e a resposta será enviada pelo mesmo número (sem 63058 para Brasil).

---

## 5. Testar o fluxo

1. Next.js e ngrok rodando; webhook no Twilio apontando para a URL do ngrok.
2. No site, clique em **Agendar** → **Falar com médico** (ou acesse o link que usa o número configurado no funil).
3. Envie a mensagem **do seu WhatsApp pessoal (Brasil)** para o **número WhatsApp Business** que você configurou.
4. Verifique:
   - **Terminal:** `[WhatsApp Webhook] POST recebido` e `Boas-vindas enviadas para: +55...`
   - **Twilio** → Monitor → Logs: **Outgoing API** com status **Delivered** (ou Sent).
   - **Seu WhatsApp pessoal:** recebe a mensagem de boas-vindas (e próximos passos, se configurada).

Se isso acontecer, o fluxo está certo com seu número WhatsApp Business e você pode seguir para produção (trocando só a URL do webhook para o domínio definitivo).

---

## Resumo

| Onde | O que fazer |
|------|-------------|
| Twilio | Número WhatsApp Business registrado/migrado nessa conta. |
| Admin → WhatsApp | Habilitado, Account SID, Auth Token, Número = `whatsapp:+55...` |
| Twilio → Seu número | "When a message comes in" = `https://.../api/whatsapp/webhook` (POST) |
| Admin → Fluxos WhatsApp | Número de captação = mesmo número (dígitos) para o link "Falar com médico" |
| Teste | Enviar mensagem do seu celular (BR) para o número Business e conferir resposta no WhatsApp e nos logs |

Com isso, você usa seu número registrado no WhatsApp Business no projeto e valida todo o fluxo antes de ir para produção.
