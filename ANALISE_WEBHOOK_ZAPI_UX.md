# Análise e melhorias do webhook Z-API (WhatsApp) – UX e fluxo

## Objetivo

Melhorar a experiência do usuário no fluxo de captação via WhatsApp: acolhimento, etapas fáceis, opções dinâmicas (SIM/NÃO), correções de fluxo e tratamento de mensagens que fogem do esperado, reduzindo a sensação de sistema “engessado”.

---

## Arquitetura do webhook

| Componente | Função |
|------------|--------|
| `app/api/whatsapp/zapi-webhook/route.ts` | Recebe POST da Z-API, extrai texto e telefone, chama o fluxo e envia as respostas. |
| `lib/whatsapp-capture-flow.ts` | Lógica do fluxo: estados, validações, mensagens e avanço. |
| `lib/whatsapp.ts` | Envio de mensagens (Z-API/Meta/Twilio). |
| `lib/capture-funnel.ts` | Mensagens de boas-vindas e próximos passos. |

**Estados do fluxo:**  
`WELCOME` → `ASK_NAME` → `ASK_CPF` → `ASK_BIRTH` → `ASK_ANAMNESIS` → `ASK_DAY` → `ASK_DATE` → `ASK_SLOT` → `CONFIRM_SLOT` → `CONFIRM` → `PAYMENT_SENT` / `SCHEDULED`.

---

## Melhorias implementadas

### 1. Opções CONFIRMAR / ALTERAR → SIM / NÃO

- **CONFIRM_SLOT (confirmação do horário)**  
  - Antes: “✅ CONFIRMAR” e “✏️ ALTERAR”.  
  - Agora: “• *SIM* – confirmar” e “• *NÃO* – escolher outro horário”.  
  - Validação aceita: `sim`, `s`, `confirmar`, `ok`, `1` para confirmar; `não`, `nao`, `n`, `alterar`, `2` para alterar.

- **CONFIRM (confirmação final dos dados)**  
  - Já estava em “Digite SIM” / “NÃO (para corrigir)”.  
  - Ajuste: texto unificado “• *SIM* – está tudo certo” e “• *NÃO* – quero corrigir algum dado”.  
  - Validação também aceita `s` e `n`.

### 2. Mensagens fora do fluxo (acolhimento)

- **Detecção de mensagens genéricas:**  
  Exemplos: “oi”, “olá”, “tudo bem”, “obrigado”, “ok”, “bom dia”, “ajuda”, etc. (lista em `isGenericOrOffFlowMessage`).

- **Resposta ao invés de só erro:**  
  Quando a mensagem é genérica e a validação falha, o sistema envia um **prefixo amigável** antes da reorientação, por exemplo:  
  - ASK_NAME: “Para seguir com seu agendamento, preciso do seu nome completo 😊 ”  
  - ASK_CPF: “Sem problemas! Para continuar, …”  
  - CONFIRM_SLOT: “Responda SIM ou NÃO para esse horário 🙂 ”  

  Assim o usuário é reconhecido antes de ser guiado de volta ao passo correto, reduzindo a sensação de fluxo rígido.

### 3. Mensagens de erro e correção suavizadas

- Resposta vazia: “Por favor, digite sua resposta.”  
- Nome: mensagens mais curtas, sem “Nome muito curto”/“Por favor” repetido.  
- CPF inválido: “Verifique os 11 dígitos e digite novamente (pode usar pontos e traço).”  
- Data (ASK_DAY): “Escolha 1 (Hoje), 2 (Amanhã) ou 3 (Escolher outra data).”  
- Horário (ASK_SLOT): “Escolha o número do horário (1 a N) ou digite o horário (ex: 14:00).”  
- Anamnese: “Conte em poucas palavras seu motivo ou histórico da consulta 😊”  
- Estado desconhecido: “Não entendi. Tente novamente ou digite *oi* para recomeçar.”

### 4. Formas dinâmicas de seleção (já existentes, mantidas/reforçadas)

- **Data:** 1 = Hoje, 2 = Amanhã, 3 = Outra data; aceita também palavras (“hoje”, “amanhã”, “outra”).  
- **Horário:** número da lista (1–10) **ou** horário digitado (ex.: 14:00, 9:30).  
- **Confirmações:** SIM/NÃO (e variações: s, n, confirmar, alterar, ok, 1, 2).

---

## Métricas do monitor (Ignoradas / Erros)

No painel **Admin → Integrações → Monitor Z-API**:

- **Processadas:** mensagens que entraram no fluxo e geraram resposta.  
- **Ignoradas:** chamadas ao webhook que não são “mensagem de texto do usuário” (ex.: status de entrega, leitura, reações, áudio sem legenda). É esperado um volume alto de “ignoradas” por causa desses eventos.  
- **Erros:** exceções ao processar ou ao enviar resposta.

Para reduzir “erros” e melhorar “processadas”, as mudanças acima focam em:  
1) aceitar mais variações (SIM/NÃO, s, n, horário digitado);  
2) não tratar como “falha” quando o usuário manda algo genérico, e sim redirecionar com tom acolhedor.

---

## FAQ durante o agendamento

Quando o usuário faz uma **pergunta ou dúvida** no meio do fluxo (ex.: "quanto custa?", "como funciona?", "quais documentos?"), o sistema:

1. **Detecta** se a mensagem parece uma pergunta (`?` ou frases como "quanto", "qual", "como", "valor", etc.).
2. **Busca** uma resposta na lista de FAQs em `lib/whatsapp-faq.ts` (primeira correspondência por padrões).
3. **Responde** com o texto curto da FAQ (valor usa o preço configurado em Admin).
4. **Reenvia** o passo atual ("Para continuar seu agendamento:" + pergunta do estado), sem avançar nem voltar estado.

Assim dúvidas são sanadas na hora e o usuário continua de onde parou. Temas cobertos: valor/preço, forma de pagamento, como funciona a consulta, legalidade/ANVISA, prazo da receita, importação/entrega, documentos necessários, horários disponíveis, confiabilidade, primeira consulta vs retorno, e um fallback de "ajuda/dúvida".

---

## IA no atendimento (OpenAI)

Quando a mensagem parece uma **pergunta** e o **FAQ não encontra** resposta, o fluxo pode usar **IA** (OpenAI) para:

1. Gerar uma resposta curta e contextualizada (CannabiLize, cannabis medicinal, consulta online, agendamento).
2. Manter tom acolhedor e objetivo (1–3 frases, adequado ao WhatsApp).
3. Se a IA não souber ou a pergunta for sensível, sugerir que um atendente pode ajudar.

**Configuração:** mesma `OPENAI_API_KEY` do laudo médico, ou `OPENAI_WHATSAPP_API_KEY` dedicada. Modelo padrão: `gpt-4o-mini` (ou `OPENAI_WHATSAPP_MODEL`). Se a chave não estiver configurada ou a chamada falhar (timeout 8s), o sistema envia uma mensagem de fallback: *"Entendi sua dúvida. Para te ajudar melhor, um atendente pode te responder em breve. Enquanto isso, para continuar seu agendamento..."*.

**Arquivo:** `lib/whatsapp-ai.ts`. Integração em `lib/whatsapp-capture-flow.ts`: após tentar FAQ, chama `getWhatsAppAiReply`; se retornar texto, usa; senão usa o fallback. O estado do fluxo não avança (a mensagem é tratada só como dúvida).

---

## Recomendações futuras

1. **Botões interativos (Z-API):** Se a Z-API permitir listas ou botões de resposta rápida, usar “SIM” / “NÃO” como botões na confirmação de horário e na confirmação final.  
2. **Reconhecimento de intenção:** Para mensagens longas ou ambíguas, considerar um passo de “Não entendi. Você quis dizer: 1) Sim 2) Não?” antes de dar erro.  
3. **Atalho “reiniciar”:** Já existe: “oi” ou “reiniciar” em qualquer momento (exceto na primeira mensagem) reinicia o fluxo em ASK_NAME. Pode ser divulgado na mensagem pós-pagamento.  
4. **Logs:** Acompanhar no monitor quais mensagens ainda caem em “erro” ou em respostas genéricas para refinar `isGenericOrOffFlowMessage` e as mensagens de reorientação.

---

## Arquivos alterados

- `lib/whatsapp-capture-flow.ts`:  
  - `buildConfirmSlotMessage` e `buildConfirmMessage` com SIM/NÃO.  
  - `parseAndValidateAnswer`: CONFIRM_SLOT e CONFIRM com SIM/NÃO e mensagens de erro ajustadas.  
  - `isGenericOrOffFlowMessage` e `getFriendlyRedirectPrefix` para mensagens fora do fluxo.  
  - Uso do prefixo amigável quando a validação falha e a mensagem é genérica.  
  - Suavização de várias mensagens de erro e comentário de UX no cabeçalho do arquivo.

Nenhuma alteração em `app/api/whatsapp/zapi-webhook/route.ts`: a interface do webhook e o fluxo de chamada a `processIncomingMessage` permanecem iguais.
