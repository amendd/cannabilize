# Como autorizar seu número no Meta (erro 131030)

No **modo desenvolvimento**, a API do WhatsApp (Meta) só permite enviar mensagens para números que você **autorizou** no painel. O erro **131030** (“Recipient phone number not in allowed list”) significa que seu número ainda não está nessa lista.

## Passo a passo no Meta for Developers

### 1. Abrir o painel do app

1. Acesse **https://developers.facebook.com**
2. Faça login e vá em **Meus aplicativos** (My Apps)
3. Clique no **app** que está usando para o WhatsApp

### 2. Ir na configuração do WhatsApp

1. No menu lateral, clique em **Casos de uso** (Use cases) — ícone de lápis
2. Em **Conectar com clientes pelo WhatsApp**, clique em **Personalizar** (Customize)
3. Você verá a tela de **Quickstart** / **Configuração da API**

### 3. Enviar a primeira mensagem para o SEU número (é isso que autoriza)

O número só entra na lista de permitidos **depois que você envia uma mensagem de template para ele** pelo painel do Meta. Use exatamente o número que recebe as mensagens no WhatsApp.

1. Na seção **“Enviar e receber mensagens”** ou **“Enviar mensagem”**:
   - No campo **“De” (From)**: selecione o **número de teste** do WhatsApp Business (o que envia)
   - No campo **“Até” (To)**: digite o número que **recebe** (seu celular), no formato:
     - **5579991269833** (Brasil: 55 + DDD + 9 + 8 dígitos, só números, sem + ou espaço)

2. Escolha o template **hello_world** (ou outro disponível) e clique em **“Enviar mensagem”** / **“Send message”**.

3. **Confira no seu WhatsApp**: você deve receber a mensagem de teste do número Business.

4. **Responda** no WhatsApp (ex.: “Oi”). Isso abre a janela de 24h e permite que o sistema envie respostas automáticas (não só templates).

### 4. Conferir o formato do número

- Use **só dígitos**: `5579991269833`
- Brasil: **55** (país) + **79** (DDD) + **9** (celular) + **8 dígitos**
- Não use: `+55`, espaços, traços ou parênteses no campo “Até”

### 5. Se ainda der 131030

- Confirme que o número no campo **“Até”** é exatamente o do celular que você usa no WhatsApp (incluindo o 9 do celular).
- Envie o template de novo para esse número e aguarde a mensagem chegar antes de testar pelo site.
- No modo desenvolvimento você pode ter **até 5 números** na lista; se já tiver 5, remova um ou use outro número para teste.
- Depois de enviar o template, **não é necessário** “salvar” o número em outro lugar: o ato de enviar já o autoriza.

### 6. Depois que autorizar

Quando a mensagem do template chegar no seu WhatsApp e você responder, o sistema (webhook + fluxo de captação) poderá enviar as respostas automáticas (boas-vindas, pedido de nome, etc.) sem o erro 131030.

---

**Resumo:** O número fica “autorizado” quando você **envia uma mensagem de template** do painel do Meta **para esse número**. Use o campo **“Até”** com `5579991269833` (ou seu número no mesmo formato), clique em **Enviar mensagem** e confira se a mensagem chegou no seu WhatsApp.
