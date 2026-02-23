# Opção B – Integração Umbler Talk (uTalk) – Processo detalhado

Neste cenário o **agente de IA do Umbler Talk** conduz a conversa no WhatsApp. A **nossa plataforma** só fornece dados (horários disponíveis) e executa a ação de confirmar o agendamento (cria paciente, consulta, pagamento) e devolve os links para o usuário.

---

## Visão do fluxo (quem faz o quê)

```
[Paciente] → WhatsApp → [Umbler Talk / Agente Lize] → conversa (nome, CPF, nascimento, patologias, anamnese, horário, confirmação)
                                                              ↓
                                            [uTalk chama nossa API]
                                                              ↓
                                    GET /api/availability/slots?date=...  → lista de horários
                                    POST /api/umbler-talk/confirm-booking  → dados confirmados → links pagamento + cadastro
                                                              ↓
                                            [uTalk envia os links ao paciente no WhatsApp]
```

- **uTalk:** coleta dados, valida (nome, CPF, data, etc.), mostra opções de horário (obtidas da nossa API), monta o resumo e, ao confirmar, chama nossa API e envia os links ao paciente.
- **Nossa API:** expõe horários disponíveis e o endpoint de confirmação; não envia mensagens no WhatsApp (o uTalk envia).

---

## Passo 1 – Garantir URL pública da aplicação

- **Teste:** rode `npm run dev:tunnel` (Next.js + ngrok) e anote a URL, ex.: `https://xxxx.ngrok-free.app`.
- **Produção:** deploy na Umbler ou outro host; URL ex.: `https://seu-app.umbler.io`.

Use **sempre HTTPS**. Nos passos abaixo, substitua `https://SUA-URL` por essa URL.

---

## Passo 2 – Criar o agente no Umbler Talk

1. Acesse o painel do **Umbler Talk (uTalk):** [utalk.umbler.com](https://utalk.umbler.com) (ou pelo menu Umbler).
2. Crie um **novo agente** (ou edite um existente).
3. **Nome do agente:** ex. **Lize**.
4. **Descrição / Instrução do agente (system prompt):**  
   Copie e cole o bloco **“Descrição da IA”** do arquivo `UMBLER_TALK_ATENDENTE_IA.md` (o parágrafo que começa com “Você é a assistente virtual da CannabiLize…”). Esse texto define identidade, serviços e regras (não dar orientação médica, transferir para humano quando necessário, chamar pelo primeiro nome).

---

## Passo 3 – Base de conhecimento

No painel do agente, em **Base de conhecimento** (ou equivalente), adicione os tópicos da **seção 4** do `UMBLER_TALK_ATENDENTE_IA.md`:

- 4.1 – Sobre a CannabiLize / ClickCannabis  
- 4.2 – Consulta e valor (R$ 50, PIX/cartão, online, Google Meet)  
- 4.3 – Processo em 4 etapas (consulta → receita → ANVISA → importação)  
- 4.4 – Legalidade e polícia  
- 4.5 – Agendamento e cadastro (passos e links)  
- 4.6 – Patologias que atendemos (lista)  
- 4.7 – Receita e pós-consulta  
- 4.8 – O que a IA **não** deve fazer  

Isso permite que a Lize responda perguntas frequentes sem inventar informações.

---

## Passo 4 – Estágios da conversa (ordem obrigatória)

Crie os **estágios** na ordem abaixo. O agente deve seguir essa sequência para captar lead e agendar.

| Ordem | Nome do estágio      | O que a IA faz |
|-------|----------------------|----------------|
| 1     | Saudação             | Apresenta-se (ex.: “Sou a Lize”), diz que vai guiar para agendar e pede o **nome completo**. |
| 2     | Solicitar nome       | Pede nome completo; só avança com pelo menos nome e sobrenome (ex.: 3+ caracteres). |
| 3     | Solicitar CPF        | Pede CPF apenas números (11 dígitos); valida antes de avançar. |
| 4     | Solicitar nascimento | Pede data de nascimento no formato DD/MM/AAAA. |
| 5     | Solicitar patologias | Lista opções numeradas (1. Ansiedade, 2. Depressão, etc.) e pede os números separados por vírgula (ex.: 1, 3, 5). |
| 6     | Solicitar anamnese   | Pede resumo: histórico e motivo da consulta (sintomas, medicamentos, expectativas), em texto. |
| 7     | Oferecer horários    | **Chama nossa API** para buscar horários (veja Passo 6) e mostra lista numerada; pede que o usuário responda com o **número** da opção. |
| 8     | Resumo e confirmação | Mostra resumo (nome, CPF, nascimento, patologias, data/hora). Pergunta se está certo. Se sim → **chama nossa API de confirmação** (Passo 7) e envia os links ao usuário. Se não → volta ao estágio “Solicitar nome”. |

Texto detalhado de cada estágio está na **seção 3** do `UMBLER_TALK_ATENDENTE_IA.md`.

---

## Passo 5 – Intenções e ações

Configure as **intenções** e vincule às ações no uTalk (conforme a seção 2 do `UMBLER_TALK_ATENDENTE_IA.md`):

| Intenção                         | Ação no uTalk        |
|----------------------------------|----------------------|
| Usuário se despede / agradece    | Encerrar chat        |
| Pedir atendente humano / reclamação / dúvida médica ou jurídica | Falar com humano     |
| Mensagem inválida (áudio/vídeo quando se espera texto) | Falar com humano ou mensagem: “Digite em texto ou peça um atendente.” |
| Limite de respostas / conversa circular | Falar com humano     |
| “Reiniciar”, “oi”, “olá”, “começar de novo” | Reiniciar para Saudação |
| No estágio de confirmação: “sim”, “está certo”, “confirmo” | Chamar nossa API de confirmação e enviar links (veja Passo 7) |
| No estágio de confirmação: “corrigir”, “errado” | Voltar ao estágio “Solicitar nome” |

---

## Passo 6 – Integração: horários disponíveis

Quando o agente estiver no estágio **“Oferecer horários”**, ele precisa da lista de horários. A nossa API já expõe:

- **Método:** GET  
- **URL:** `https://SUA-URL/api/availability/slots?date=YYYY-MM-DD`  
- **Exemplo:** `https://seu-app.umbler.io/api/availability/slots?date=2025-02-15`  
- **Resposta (resumida):**  
  `{ "slots": [ { "time": "09:00", "doctorId": "...", "doctorName": "...", "available": true }, ... ], "dayOfWeek": 6, "dayName": "Sábado" } `

**No uTalk:**

- Onde houver configuração de **“chamar API para obter horários”** ou **“webhook/URL externa”** para o estágio de horários:
  - Use a URL acima, trocando `SUA-URL` e a data (a data pode ser fixa para teste ou dinâmica, conforme o que o uTalk permitir).
- O agente deve montar a mensagem para o usuário a partir do array `slots` (ex.: “1) 15/02 às 09:00  2) 15/02 às 10:00 …”) e pedir que responda com o número da opção.
- Ao usuário escolher (ex.: “2”), o agente deve guardar **date** (YYYY-MM-DD), **time** (HH:MM) e, se possível, **doctorId** do slot escolhido, para enviar na confirmação (Passo 7).

---

## Passo 7 – Integração: confirmação e links (confirm-booking)

Quando o usuário **confirmar** o resumo (estágio 8), o uTalk deve chamar nossa API para criar o agendamento e obter os links.

- **Método:** POST  
- **URL:** `https://SUA-URL/api/umbler-talk/confirm-booking`  
- **Cabeçalho:**  
  `Content-Type: application/json`  
  Opcional (recomendado em produção): `Authorization: Bearer SEU_UMBLER_TALK_API_KEY` (configure a variável `UMBLER_TALK_API_KEY` no .env e use o mesmo valor no uTalk).  
- **Corpo (JSON):** dados coletados pelo agente:

```json
{
  "phone": "5511999999999",
  "name": "Maria Silva",
  "cpf": "12345678901",
  "birthDate": "1990-03-15",
  "pathologies": ["Ansiedade", "Insônia"],
  "anamnesis": "Histórico breve e motivo da consulta em texto.",
  "date": "2025-02-15",
  "time": "09:00",
  "doctorId": "uuid-do-medico"
}
```

- **Campos obrigatórios:** `phone`, `name`, `date`, `time`.  
- **Opcionais:** `cpf`, `birthDate` (formato YYYY-MM-DD), `pathologies` (array de strings), `anamnesis`, `doctorId`.  
- **Resposta de sucesso (200):**

```json
{
  "ok": true,
  "setupUrl": "https://SUA-URL/concluir-cadastro?token=...",
  "paymentUrl": "https://SUA-URL/consultas/ID/pagamento?token=...",
  "scheduledLabel": "15/02/2025 às 09:00",
  "consultationId": "uuid"
}
```

- **Resposta de erro (4xx/5xx):**  
  `{ "ok": false, "error": "Mensagem de erro" }`  
  Ex.: data/hora indisponível, lead duplicado, etc.

**No uTalk:**

- Na ação “Enviar links de pagamento e concluir cadastro” (ou equivalente), configure uma chamada **POST** para `https://SUA-URL/api/umbler-talk/confirm-booking` com o corpo em JSON usando as variáveis do fluxo (telefone, nome, CPF, data de nascimento, patologias, anamnese, data e hora escolhidas, doctorId se tiver).
- Use na resposta da API os campos `setupUrl` e `paymentUrl` para montar a mensagem ao paciente, por exemplo:  
  “Seus dados foram registrados. Link para pagamento: {paymentUrl}. Link para concluir seu cadastro: {setupUrl}. Consulta agendada para {scheduledLabel}. Bom tratamento! 💚”

---

## Passo 8 – Configurar o número de WhatsApp no uTalk

1. No painel do Umbler Talk, em **Canais** ou **Números**, conecte o número de WhatsApp que receberá as conversas.
2. Associe esse número ao **agente** (Lize) que você configurou.
3. Se o uTalk pedir uma URL de webhook **para receber eventos do WhatsApp**: isso é entre o WhatsApp e o uTalk; nossa URL não entra aí. Nossa API só é chamada pelo uTalk para **horários** e **confirmação**, como nos passos 6 e 7.

---

## Passo 9 – Variáveis de ambiente na nossa aplicação

Na Umbler (ou no .env em produção), garanta:

- `APP_URL` = `https://SUA-URL` (mesma base usada nos links).
- `NEXTAUTH_URL` = `https://SUA-URL`.
- Opcional: `UMBLER_TALK_API_KEY` = uma chave secreta; use a mesma no uTalk no header `Authorization: Bearer ...` ao chamar `/api/umbler-talk/confirm-booking`.

---

## Passo 10 – Testar ponta a ponta

1. Envie uma mensagem para o número WhatsApp conectado ao uTalk.
2. O agente deve se apresentar e pedir nome → CPF → nascimento → patologias → anamnese.
3. No estágio de horários, o uTalk deve chamar `GET /api/availability/slots?date=...` e mostrar opções; escolha uma.
4. No resumo, confirme; o uTalk deve chamar `POST /api/umbler-talk/confirm-booking` e enviar a você os links de pagamento e de concluir cadastro.
5. Verifique no Admin da plataforma se o paciente e a consulta foram criados e se os links funcionam.

---

## Resumo das URLs da nossa API (Opção B)

| Uso                 | Método | URL |
|---------------------|--------|-----|
| Horários por data   | GET    | `https://SUA-URL/api/availability/slots?date=YYYY-MM-DD` |
| Confirmar agendamento e obter links | POST | `https://SUA-URL/api/umbler-talk/confirm-booking` |

---

## Referências

- `UMBLER_TALK_ATENDENTE_IA.md` – Descrição da IA, estágios, base de conhecimento, intenções.  
- `PASSO_A_PASSO_INTEGRACAO_UMBLER.md` – Visão geral e opções A/B.  
- `GUIA_INTEGRACAO_UMBLER.md` – Deploy e variáveis na Umbler.
