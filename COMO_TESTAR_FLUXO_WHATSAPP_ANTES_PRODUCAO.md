# Como testar o fluxo WhatsApp antes de produção

O erro **63058** (não pode enviar para o Brasil com o Sandbox dos EUA) impede a entrega no seu número brasileiro. Abaixo estão duas formas de ter certeza de que o fluxo está certo antes de ir para produção.

---

## Opção A: Teste completo com número dos EUA (recomendado)

Assim você valida **tudo**: webhook → lead → envio → **entrega** no WhatsApp.

### O que você precisa

- Um número de telefone **dos EUA** (+1) com WhatsApp (seu, de um amigo ou de um colega).
- Ou um número de outro **país que o Sandbox possa atender** (na dúvida, EUA funciona).

### Passo a passo

1. **Entrar no Sandbox com esse número (EUA)**  
   - No WhatsApp desse número, envie uma mensagem para: **+1 415 523 8886**  
   - Texto: **join** + a palavra que aparece no Twilio (ex.: `join yellow-tiger`).  
   - O Twilio confirma que você entrou no Sandbox.

2. **Garantir que o seu ambiente está rodando**  
   - Next.js rodando (`npm run dev`).  
   - Ngrok rodando e apontando para a mesma porta (ex.: `ngrok http 3000`).  
   - No Twilio, "When a message comes in" = `https://sua-url-ngrok.ngrok-free.dev/api/whatsapp/webhook` (POST).

3. **Enviar a mensagem de teste**  
   - **Do número dos EUA** que entrou no Sandbox, envie uma mensagem para **+1 415 523 8886** (ex.: "Olá, me chamo Teste. Patologias: Ansiedade").

4. **O que deve acontecer**  
   - No **terminal do Next.js**: aparece `[WhatsApp Webhook] POST recebido` e `[WhatsApp Webhook] Boas-vindas enviadas para: +1...`.  
   - No **Twilio** → Monitor → Logs: uma mensagem **Outgoing API** com status **Delivered** (ou Sent).  
   - No **WhatsApp** desse número dos EUA: chega a mensagem de boas-vindas (e a de próximos passos, se configurada).

Se isso acontecer, o fluxo está **100% certo**; em produção, trocando só o número (WhatsApp Business no Brasil), o mesmo código deve funcionar para números brasileiros.

---

## Opção B: Validar sem número dos EUA (o que já está provado)

Se você não tiver um número dos EUA para testar, ainda dá para ter **certeza de que o fluxo está certo** com base no que você já viu:

| Etapa | Status | Evidência |
|-------|--------|-----------|
| 1. Twilio recebe a mensagem do paciente | ✅ | Logs: "Incoming" → "Received" |
| 2. Twilio chama o seu webhook | ✅ | Logs: "Outgoing API" (sua app pediu envio) |
| 3. Sua app processa e chama a API do Twilio | ✅ | Mesmo "Outgoing API" |
| 4. Entrega no Brasil | ❌ | Erro 63058 (restrição Sandbox EUA → Brasil) |

Ou seja: **webhook, lead, envio e chamada à API estão corretos**. Só a **entrega** falha por restrição de país do Sandbox, não por bug no seu código.

### O que fazer na produção

1. Contratar/ativar um **número WhatsApp Business** que possa enviar para o Brasil (em geral um número brasileiro na sua conta Twilio/WhatsApp Business).  
2. No **Admin** da sua app → Integrações → WhatsApp: colocar esse número, Account SID e Auth Token (e webhook se usar).  
3. Manter o mesmo webhook e o mesmo fluxo (boas-vindas + próximos passos).  
4. Testar de novo com um número brasileiro; a partir daí não deve mais aparecer 63058.

---

## Checklist antes de ir para produção

Use isso para não esquecer nada:

- [ ] **Fluxo testado**  
  - Opção A: teste com número EUA e mensagem entregue no WhatsApp.  
  - Opção B: pelo menos conferido que webhook + Outgoing API estão ok (como já está).

- [ ] **Número WhatsApp Business (Brasil)**  
  - Número aprovado que possa enviar para o Brasil (sem 63058).

- [ ] **Configuração no Admin**  
  - Integrações → WhatsApp: número, Account SID, Auth Token, integração habilitada.  
  - Fluxos WhatsApp: mensagem de boas-vindas e (opcional) próximos passos.

- [ ] **Webhook em produção**  
  - URL pública estável (ex.: `https://seu-dominio.com/api/whatsapp/webhook`).  
  - No Twilio, "When a message comes in" apontando para essa URL (POST).  
  - Se usar validação de assinatura: `TWILIO_WEBHOOK_BASE_URL` = URL pública do site.

- [ ] **Teste final em produção**  
  - Enviar uma mensagem de um número brasileiro para o número Business.  
  - Ver no Twilio: Outgoing API → **Delivered**.  
  - Ver no WhatsApp do teste: boas-vindas e próximos passos.

---

## Resumo

- **Quer ver a mensagem chegando no WhatsApp antes de produção?** → Use a **Opção A** com um número dos EUA no Sandbox.  
- **Não tem número dos EUA?** → Use a **Opção B**: o fluxo já está certo; em produção, com número WhatsApp Business no Brasil, o 63058 deixa de acontecer e o mesmo fluxo funciona para o Brasil.
