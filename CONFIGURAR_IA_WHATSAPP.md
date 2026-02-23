# Como configurar a IA no WhatsApp

A IA que responde dúvidas no fluxo do WhatsApp (quando o FAQ não encontra resposta) pode ser **ativada/desativada e o modelo alterado** no Admin. A **chave da API** continua sendo configurada apenas por variável de ambiente (por segurança).

---

## Onde configurar

### Admin (ativar/desativar e modelo)

No painel: **Admin → Integrações → IA no WhatsApp** (ou **Admin → WhatsApp** e depois a aba **IA no WhatsApp**).

- **Usar IA nas dúvidas:** liga ou desliga a IA. Desligado, só o FAQ e a mensagem de fallback são usados.
- **Modelo (opcional):** deixe em branco para o padrão (`gpt-4o-mini`) ou informe outro, ex.: `gpt-4o`.
- **Chave da OpenAI:** você pode informar a chave na própria tela (fica salva no servidor) ou usar variável de ambiente (veja abaixo).

### 1. Desenvolvimento local (chave no .env)

No **arquivo `.env`** na raiz do projeto (se não existir, copie de `.env.example`):

```env
# Chave da OpenAI (obtida em https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-...

# Opcional: modelo para o WhatsApp (padrão: gpt-4o-mini)
# OPENAI_WHATSAPP_MODEL=gpt-4o-mini
```

- Se você **já usa** `OPENAI_API_KEY` para o laudo médico por IA, **não precisa fazer nada a mais**: a mesma chave é usada no WhatsApp.
- Se quiser uma chave **só para o WhatsApp**, use:
  ```env
  OPENAI_WHATSAPP_API_KEY=sk-proj-...
  ```

Depois de salvar o `.env`, reinicie o servidor (`npm run dev`).

---

### 2. Produção (Vercel, Umbler, etc.)

Nas **variáveis de ambiente** do seu provedor:

| Variável | Obrigatória? | Descrição |
|----------|----------------|-----------|
| `OPENAI_API_KEY` | Sim* | Chave da API OpenAI. *Ou use `OPENAI_WHATSAPP_API_KEY` só para o WhatsApp. |
| `OPENAI_WHATSAPP_API_KEY` | Não | Se preenchida, só o WhatsApp usa essa chave (o laudo continua usando `OPENAI_API_KEY`). |
| `OPENAI_WHATSAPP_MODEL` | Não | Modelo (padrão: `gpt-4o-mini`). Ex.: `gpt-4o` para respostas mais elaboradas. |

**Exemplo no Vercel:**  
Projeto → Settings → Environment Variables → adicione `OPENAI_API_KEY` com o valor `sk-proj-...`.

---

## Onde obter a chave

1. Acesse **https://platform.openai.com/api-keys**
2. Faça login (ou crie conta)
3. Clique em **Create new secret key**
4. Copie a chave (começa com `sk-`) e coloque no `.env` ou no painel do provedor

**Custo:** a OpenAI cobra por uso. O modelo `gpt-4o-mini` é barato; cada dúvida no WhatsApp consome poucos centavos. Sem chave configurada, a IA não é chamada e o sistema envia a mensagem de fallback (“um atendente pode te responder...”).

---

## Como testar se a IA está funcionando

### 1. Teste direto no Admin (recomendado)

1. Acesse **Admin → Integrações → IA no WhatsApp**.
2. Confirme que a chave está configurada (indicador verde “Chave da OpenAI: Configurada”).
3. Na seção **“Testar se a IA está respondendo”**, use a pergunta sugerida (ex.: *“Vocês atendem aos sábados?”*) ou digite outra.
4. Clique em **“Testar IA”**.
5. Em alguns segundos deve aparecer a resposta da IA na caixa abaixo. Se aparecer a mensagem de fallback (“um atendente pode te responder...”), a chave pode estar errada, a IA desativada no painel ou a OpenAI pode ter falhado/timeout.

Assim você valida a chave e a integração sem usar o WhatsApp.

### 2. Teste pelo WhatsApp (fluxo real)

1. Envie uma mensagem para o número configurado na Z-API (ex.: “Oi” para iniciar o agendamento).
2. Quando o fluxo pedir o **nome**, em vez de digitar o nome, envie uma **pergunta que não está no FAQ**, por exemplo:
   - *“Vocês atendem aos sábados?”*
   - *“Qual o prazo para receber a receita?”* (esta pode cair no FAQ)
   - *“Tem desconto para idosos?”*
3. O sistema deve responder com a IA (ou com o FAQ, se a pergunta tiver resposta cadastrada) e em seguida repetir o passo atual (“Para continuar seu agendamento: me diga seu nome completo”).
4. Confira também o **Monitor Z-API** (Admin → Integrações → Monitor Z-API) para ver a conversa e o status das mensagens.

---

## Como saber se está ativa

- Se **não** tiver chave (nem no painel nem em `OPENAI_API_KEY` / `OPENAI_WHATSAPP_API_KEY`), o fluxo usa só o FAQ + mensagem de fallback.
- Com a chave configurada e **“Usar IA nas dúvidas”** ativado, perguntas que não caírem no FAQ acionam a IA. Em erro ou timeout (8 s), o fallback é enviado.
