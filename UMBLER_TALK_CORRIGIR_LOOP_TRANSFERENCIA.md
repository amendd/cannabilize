# Corrigir loop: “Chat transferido para o setor geral pois o contato pediu para falar com um humano”

**Checklist direto para o painel:** veja **UMBLER_TALK_CHECKLIST_PAINEL.md** (passos para "oi" e "como faço o pagamento?" pararem de transferir).

## O que está acontecendo

O chat fica em loop: a Lizze é removida, o chat vai para o setor Geral com a mensagem “o contato pediu para falar com um humano”, a Lizze volta e é removida de novo. Isso ocorre quando o usuário **não** pediu humano – por exemplo quando ele só respondeu à pergunta de patologias (“muita dor de cabeca”) ou disse “oi”.

Ou seja: a **intenção “transferir para humano”** está disparando por engano.

---

## Causa provável

No painel do Umbler Talk, a intenção **“Quando for necessário transferir para um humano”** (ação: Falar com humano / transferir para setor Geral) está configurada de forma **muito ampla**. Ela pode estar sendo acionada quando o usuário:

- Responde à pergunta de **patologias ou motivo da consulta** (ex.: “muita dor de cabeca”, “ansiedade”, “insônia”) – a IA pode estar interpretando como “dúvida médica” e transferindo.
- Diz **“oi”** ou **“olá”** – e a regra de “transferir para humano” está ganhando da regra de “reiniciar fluxo / boas-vindas”.

---

## O que fazer no painel do Umbler Talk

### 1. Ajustar a intenção “Transferir para humano”

A transferência para humano deve acontecer **só** quando o usuário **pedir isso de forma clara**. Não deve disparar em respostas normais do fluxo (patologias, anamnese, “oi”, etc.).

No painel do Umbler Talk (agente Lizze):

1. Abra as **Intenções** (ou “Fluxos” / “Regras”).
2. Localize a intenção que dispara **“Falar com humano”** / **“Transferir para setor Geral”**.
3. **Restrinja os gatilhos** para frases explícitas de pedido de atendente humano, por exemplo:
   - “quero falar com um humano”
   - “falar com atendente”
   - “falar com alguém”
   - “pessoa real”
   - “não quero bot”
   - “reclamação”
   - “quero reclamar”
4. **Remova ou não use** como gatilho para essa intenção:
   - Palavras soltas como “dor”, “cabeça”, “ansiedade”, “insônia” (são respostas de patologias).
   - “oi” e “olá” (devem ir para **reiniciar fluxo / boas-vindas**, não para transferir).

Ou seja: **respostas sobre sintomas/patologias e “oi” não devem** acionar “transferir para humano”.

### 2. Ordem das intenções

Se “oi” / “olá” puderem acionar duas regras (reiniciar e transferir), defina a **prioridade** para que:

- **Primeiro** seja avaliada a intenção de **reiniciar fluxo / boas-vindas** (para “oi”, “olá”, “iniciar”, “começar de novo”).
- **Depois** a de **transferir para humano** (só para pedidos explícitos de atendente humano).

Assim “oi” não leva mais à transferência.

### 3. Dúvida “médica” vs resposta de anamnese

Se você tiver uma regra do tipo “dúvida médica → transferir para humano”, deixe ela **só** para perguntas explícitas (ex.: “isso é perigoso?”, “posso tomar com outro remédio?”). **Não** use como gatilho o fato de o usuário estar descrevendo sintomas ou patologias no passo de anamnese/patologias (ex.: “muita dor de cabeca”) – isso é resposta do fluxo, não pedido de humano.

---

## Webhook do site (resposta dinâmica)

Quando o **webhook** do site (`/api/whatsapp/umbler-webhook`) está ativo:

- **Pedido explícito de humano:** Se o paciente escrever algo como "quero falar com atendente" ou "pessoa real", o webhook envia **uma única** mensagem ("Vou te conectar com um atendente. Um momento, por favor.") e não repete perguntas do fluxo. A lógica está em `lib/umbler-webhook-handler.ts` (padrões explícitos).
- **FAQ (pagamento, valor, horários):** Perguntas como "como faço o pagamento?" ou "qual o valor?" são respondidas com uma mensagem objetiva e **não** disparam transferência. Assim o paciente não cai em "transferido pois pediu para falar com humano" só por ter perguntado sobre pagamento.

Recomendação: no **painel** do Umbler Talk, configure a transferência para humano **somente** para as mesmas frases explícitas usadas no handler (ex.: "quero falar com humano", "atendente", "pessoa real"), para evitar que "qualquer motivo" vire transferência.

---

## Resumo

- **Problema:** “Transferir para humano” dispara com “dor de cabeça” ou “oi” e gera o loop.
- **Solução:** No Umbler Talk, limitar essa intenção a **pedidos explícitos** de atendente humano e garantir que “oi”/“olá” acionem **só** o fluxo de boas-vindas/reinício, nunca a transferência.

Depois de salvar as alterações, teste de novo com “muita dor de cabeca” e com “oi” – o chat não deve mais ser transferido nesses casos.

---

## “No painel funciona, no WhatsApp real entra em loop”

Se o fluxo está certo no **chat do painel** do Umbler, mas ao mandar mensagem por um **WhatsApp real** o chat cai no mesmo loop (transferir para Lizze → remover → setor Geral → “contato pediu para falar com um humano”), a causa costuma ser **configuração específica do canal WhatsApp**.

### O que verificar no Umbler Talk

1. **Comportamento por canal / origem**
   - Em **Configurações**, **Canais**, **WhatsApp** ou **Integrações**, veja se existe opção do tipo:
     - “Quando mensagem vier do WhatsApp” / “Comportamento para mensagens externas”
     - “Primeira mensagem do contato” / “Novo contato”
   - Se houver **“Transferir para setor Geral”** ou **“Enviar para atendente humano”** como padrão para o canal WhatsApp (ou para “novo contato”), **desative** ou altere para que o **agente Lizze** atenda primeiro, sem transferir logo de cara.

2. **Atribuição automática ao agente**
   - Confirme que conversas que chegam **pelo WhatsApp** estão sendo atribuídas ao **mesmo agente** (Lizze) e ao **mesmo fluxo** que você testa no painel.
   - Se existir “rota por canal”, defina para o WhatsApp usar o fluxo da Lizze (e não um fluxo que já começa com “transferir para humano”).

3. **Regras que só disparam no WhatsApp**
   - Algumas plataformas têm regras separadas por canal. Procure regras/automações que:
     - Só se aplicam a “WhatsApp” ou “mensagens externas”
     - Ou a “conversa nova” / “primeiro contato”
   - Se alguma delas fizer “transferir para setor Geral” ou “pediu para falar com humano”, ajuste para **não** disparar em toda mensagem do WhatsApp; ou remova essa ação para o canal WhatsApp.

4. **Webhook (se estiver usando Opção C – nosso site)**
   - Se você configurou o **webhook** para nosso site (`/api/whatsapp/umbler-webhook`), confira:
     - Se a URL está correta e ativa para o **canal WhatsApp** (e não só para o chat interno).
     - Nos logs do Umbler, se as mensagens do WhatsApp estão **chegando** no webhook.
   - Se as mensagens do WhatsApp **não** forem enviadas ao webhook e ficarem só no Umbler, o loop é 100% no lado do Umbler (itens 1–3 acima). Se forem enviadas ao webhook, vale checar também os logs do nosso site para ver se há erro na resposta.

### Resumo (painel ok, WhatsApp em loop)

- **Causa provável:** regra ou comportamento **específico do canal WhatsApp** (ou “novo contato”) que força transferência para humano/setor Geral em toda mensagem.
- **O que fazer:** no painel do Umbler, revisar **Canais / WhatsApp / Comportamento por origem** e **regras por canal**, e garantir que o WhatsApp use o mesmo fluxo da Lizze, sem transferir automaticamente para humano a cada mensagem.

---

## Loop “volta a pedir nome” depois de patologias/anamnese

O usuário já informou nome, CPF, nascimento, patologias ou motivo da consulta (ex.: “nada a comentar”), mas a Lizze **repete** a saudação e pede o nome de novo em vez de **oferecer horários** ou mostrar o resumo.

### Se o WhatsApp estiver usando **nosso webhook** (Opção C)

O nosso fluxo avança assim: nome → CPF → nascimento → patologias → anamnese → **horários** → confirmação. Se está voltando ao nome, em geral o **mesmo contato está sendo tratado como conversa nova** (lead não encontrado).

1. **Telefone em formato diferente**  
   Se o Umbler enviar o número às vezes como `5521999999999` e outras como `5521999999999@c.us`, o nosso código pode estar gerando chaves diferentes e “criando” um novo lead a cada mensagem.  
   - **Ajuste feito no código:** o webhook agora remove o sufixo `@c.us` do número antes de normalizar, para o mesmo usuário ser sempre encontrado.  
   - Confirme no painel do Umbler se o número vem sempre no mesmo formato; se vier em outro campo (ex.: `contact`, `sender`), ajuste o parsing em `app/api/whatsapp/umbler-webhook/route.ts` para usar esse campo.

2. **Conferir no banco**  
   Veja na tabela de leads (WhatsApp/captação) se, para aquele telefone, existe **um único** lead e se o `flowState` avança (ex.: de ANAMNESE para ASK_SLOT). Se aparecerem vários leads para o mesmo número, a causa é formato de telefone diferente entre mensagens.

### Se o WhatsApp e o painel forem atendidos **só pela Lizze (Umbler)**

Aí o loop está na **configuração do agente** no Umbler Talk:

1. **Estágio depois de “patologias / motivo da consulta”**  
   Deve existir um estágio claro **depois** da coleta de patologias/anamnese, por exemplo **“Oferecer horários”** (listar datas/horários e pedir que o usuário escolha).  
   - Se esse estágio não existir ou não estiver ligado ao anterior, o agente pode “cair” no início do fluxo e pedir o nome de novo.  
   - Crie ou ajuste a **transição**: após “Solicitar anamnese (motivo da consulta)” → ir para **“Oferecer horários”**, e não para “Saudação” nem “Solicitar nome”.

2. **Intenção “reiniciar” com gatilho largo**  
   Se existir uma intenção do tipo “reiniciar fluxo” ou “boas-vindas” com gatilhos como “qualquer mensagem curta” ou “nada a comentar”, ela pode estar mandando o fluxo de volta ao começo.  
   - Restrinja **só** a frases explícitas de reinício: “reiniciar”, “começar de novo”, “oi”, “olá”, “iniciar”.  
   - **Não** use como gatilho: “nada a comentar”, “nada”, “ok”, “tudo certo”, etc. (são respostas válidas de anamnese).

3. **Ordem dos estágios**  
   A sequência no painel deve ser: Saudação → Nome → CPF → Nascimento → Patologias → Anamnese → **Oferecer horários** → Resumo e confirmação. Confira se “Oferecer horários” está logo após anamnese e se a Lizze está configurada para **avançar** para esse estágio quando o usuário responder à pergunta de patologias/motivo (incluindo “nada a comentar”).

### Resumo (loop “volta a pedir nome”)

- **Webhook (nosso site):** garantir que o **mesmo número** seja sempre reconhecido (normalização do telefone, inclusive sem `@c.us`). O código do webhook já foi ajustado para isso.
- **Só Lizze (Umbler):** configurar o estágio **“Oferecer horários”** logo após anamnese/patologias e **não** disparar “reiniciar” em respostas como “nada a comentar”.
