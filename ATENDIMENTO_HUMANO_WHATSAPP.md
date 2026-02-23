# Atendimento humano via WhatsApp – intermediação

## Ideia

Quando o paciente pede para **falar com um humano** (atendente), a conversa pode ser direcionada para ser respondida por outro celular/número, com o **sistema fazendo a intermediação**: o paciente continua falando com o mesmo número da clínica; as respostas são escritas pelo atendente em outro número e o sistema reenvia ao paciente pelo número oficial.

## Como funciona

1. **Paciente** envia mensagem para o **número da clínica (A)**.
2. Em algum momento o paciente escreve algo como: *"quero falar com um humano"*, *"atendente"*, *"pessoa"*, *"operador"*, etc.
3. O sistema:
   - Marca a conversa como **atendimento humano**.
   - Envia ao paciente: *"Um atendente vai te atender. Pode enviar suas mensagens."*
   - Se houver **número do atendente (B)** configurado:
     - Envia para B: *"Novo atendimento – Paciente [nome] ([telefone]). Ele disse: [mensagem]. Responda aqui (neste chat) para que sua resposta seja enviada ao paciente."*
4. **Daí em diante:**
   - Tudo que o **paciente** manda para **A** → o sistema encaminha para **B** (e opcionalmente confirma ao paciente: *"Mensagem recebida."*).
   - Tudo que o **atendente** manda **de B para A** → o sistema entende como “resposta do atendente” e **reenvia esse texto ao paciente** (de A). O paciente só vê o número A.

Assim, o atendente usa o **outro celular/número (B)** e o sistema faz a ponte: paciente ↔ número da clínica (A) ↔ sistema ↔ número do atendente (B).

## Opções de uso

### Opção 1: Só painel admin (sem outro número)

- Não é obrigatório configurar um número B.
- Conversas em “atendimento humano” aparecem no **admin** (ex.: lista de leads com estado “Aguardando atendente”).
- O atendente responde **pelo painel**: digita a mensagem e o sistema envia ao paciente pelo número A (API). Não usa outro celular, mas já é intermediação pelo sistema.

### Opção 2: Intermediação com outro celular/número (B)

- Na configuração do WhatsApp (admin) é informado o **número do atendente (B)**.
- As mensagens do paciente são **encaminhadas para B** (enviadas pelo sistema de A para B).
- O atendente **responde no WhatsApp do celular B** (para o número A). O webhook recebe essa mensagem (remetente = B, destinatário = A), identifica como “resposta do atendente” e envia o texto ao paciente (de A).
- Requisito: o número B precisa receber as mensagens que o sistema envia (de A para B) e o mesmo webhook precisa receber os eventos do número A (incluindo mensagens vindas de B). Com **Meta (Cloud API)** isso é automático quando A e B estão na mesma conta; com **Z-API** depende de como a instância está configurada.

## Detecção de “falar com humano”

O sistema considera pedido de atendente humano quando a mensagem (normalizada) contém ideias como:

- *falar com (um )?humano / atendente / pessoa / operador*
- *quero (um )?atendente / (uma )?pessoa*
- *prefiro (um )?humano*
- *me (conecte|passa|liga) (com|para) (um )?(atendente|humano|pessoa)*
- *não quero (mais )?(bot|robô|ia)*
- Palavras isoladas como *atendente*, *humano*, *pessoa* (em contexto curto)

(Implementação em `lib/whatsapp-capture-flow.ts` e possível ajuste fino por configuração.)

## Múltiplos atendentes e atendentes livres

- No admin é possível cadastrar **vários números** de atendentes (um por linha ou separados por vírgula).
- O pedido "Pode atender? SIM/NÃO" é enviado **apenas aos atendentes que não estão em um atendimento** (ou seja, que não têm um lead em estado HUMAN_REQUESTED com o número deles).
- Se nenhum atendente estiver livre, o paciente recebe: *"Para atendimento humano, por favor aguarde. Em breve alguém irá te atender."*

## Comando ENCERRAR

- O atendente pode **encerrar o atendimento** digitando **ENCERRAR** (em maiúsculas).
- O paciente recebe: *"O atendimento humano foi encerrado. Para continuar, digite seu nome completo ou envie *reiniciar*."*
- O lead volta ao fluxo normal (ASK_NAME) e o atendente fica livre para receber outro chamado.

## Voltar ao fluxo automático

- O paciente pode dizer *"voltar ao atendimento automático"* (ou similar) para sair do modo humano e voltar ao fluxo de captação/IA.
- No admin, pode haver ação “Encerrar atendimento humano” para esse lead, voltando o estado ao fluxo normal.

## Resumo técnico

- **Schema:** estado `HUMAN_REQUESTED` no lead e campo opcional `agentPhone` (número do atendente ao qual a conversa foi direcionada).
- **Config:** número do atendente (opcional) em configurações do WhatsApp (ex.: `config.agentPhone` em JSON ou coluna).
- **Fluxo:** ao detectar “falar com humano” → atualizar lead para `HUMAN_REQUESTED`, definir `agentPhone` se houver, enviar mensagens ao paciente e ao atendente (B) quando configurado.
- **Modo humano:** mensagens do paciente não passam pelo fluxo de captação; são reenviadas para B (e opcionalmente confirmadas ao paciente).
- **Webhook:** se a mensagem recebida for **de** B **para** A → tratar como resposta do atendente e enviar o corpo da mensagem ao `phone` do lead que está em `HUMAN_REQUESTED` com esse `agentPhone`.

Com isso, é possível direcionar a conversa para outro celular/número e ter o sistema fazendo a intermediação de forma contínua.
