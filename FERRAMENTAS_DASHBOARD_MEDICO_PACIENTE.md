# Ferramentas e Soluções para Dashboard Médico e Paciente

Visão do que o sistema já oferece, o que o mercado de telemedicina e cannabis oferece, e recomendações para elevar a experiência de médicos e pacientes — incluindo **prontuário eletrônico** e outras ferramentas.

---

## 1. O que o sistema já tem hoje

### Dashboard do médico
- **Dashboard** (resumo, próximas consultas, anotações rápidas)
- **Minhas Consultas** (lista, filtros, entrada na consulta)
- **Consulta individual**: vídeo (Zoom/Google Meet), anotações da consulta, data de retorno, anexos, receita, gravação + transcrição + **rascunho de laudo por IA**
- **Meus Horários** (disponibilidade)
- **Receitas** (lista e emissão)
- **Pacientes** (lista com totais; link “Ver Consultas” para lista geral)
- **Financeiro** (resumo, payouts, conta de repasse)

### Dashboard do paciente
- **Início** (resumo)
- **Minhas Consultas** (lista e detalhe com anamnese pré-consulta, anexos)
- **Receitas** (lista e visualização)
- **Pagamentos** (histórico)
- **Documentos** (central de documentos)
- **Carteirinha** (carteirinha digital)
- **Meu Perfil**
- **Consentimento** (LGPD) e **Próximos passos**

### Dados já no banco (base para prontuário)
- **Consultation**: `anamnesis` (JSON), `notes`, `nextReturnDate`, `transcriptText`, `laudoDraft`, `videoCallEndedAt`, `recordingUrl`
- **Prescription** + medicamentos, status, vínculo com consulta
- **PatientPathology** (patologias do paciente)
- **ConsultationFile** (anexos por consulta)
- **PatientCard**, **AnvisaAuthorization**, **ConsultationFeedback**
- **PrescriptionDocument** (documentos extras do paciente)

Ou seja: já existe **anamnese por consulta**, **notas do médico**, **transcrição e laudo (IA)**, **receitas** e **anexos**. Falta **organizar isso em um prontuário único por paciente** e acrescentar outras ferramentas que o mercado já oferece.

---

## 2. O que soluções de mercado oferecem (referência)

Com base em plataformas de telemedicina, PEP (Prontuário Eletrônico do Paciente) e clínicas de cannabis:

| Área | Exemplos de ferramentas |
|------|-------------------------|
| **Prontuário** | Histórico clínico em ordem cronológica; identificação + foto; anamneses e evoluções; modelos personalizáveis; armazenamento em nuvem; assinatura digital (ICP-Brasil). |
| **Consulta** | Teleconsulta com prontuário aberto na mesma tela; videoconferência segura; teletriagem; teleinterconsulta; telemonitoramento. |
| **Documentação** | Prescrições digitais e assinatura eletrônica; atestados; laudos; pedidos de exame; receitas integradas (ex.: Memed, WhatsApp/e-mail). |
| **Produtividade** | IA para transcrição e sugestão de diagnóstico; redução de tempo de registro; templates de evolução. |
| **Acompanhamento** | Upload de fotos/vídeos para evolução; lembretes de retorno; mensagens seguras. |
| **Paciente** | Acesso ao próprio histórico (consultas, receitas, laudos); agendamento; pagamento; documentos em um só lugar; lembretes. |

No nosso sistema já temos: vídeo, anamnese, notas, transcrição, laudo (rascunho IA), receitas, anexos, carteirinha, documentos. O maior gap é **prontuário unificado** e **evoluções/registros entre consultas**.

---

## 3. Recomendações para o dashboard do MÉDICO

### 3.1 Prontuário do paciente (prioridade alta)
- **O que é**: Uma página “Prontuário” por paciente, acessível a partir de “Pacientes” (ex.: “Ver prontuário”).
- **Conteúdo sugerido**:
  - **Identificação**: nome, foto (se houver), idade, CPF, contato, patologias (já temos `PatientPathology`).
  - **Timeline cronológica**:
    - Consultas (data, status, link para detalhe da consulta).
    - Para cada consulta: resumo da anamnese, notas do médico, data de retorno, anexos, receita e laudo (se houver).
  - **Receitas**: lista de receitas do paciente (ativas e históricas) com link para detalhe.
  - **Documentos**: anexos das consultas + documentos de receita/paciente em um só lugar.
- **Implementação**: Nova rota `/medico/pacientes/[id]/prontuario` (ou `/medico/prontuario/[patientId]`), API que agregue consultas + prescrições + anexos + patologias por paciente. Reaproveitar dados já existentes (`Consultation`, `Prescription`, `ConsultationFile`, etc.).

### 3.2 Evolução clínica (entre consultas)
- **O que é**: Registros de evolução (“evoluções”) não vinculados a uma consulta específica (ex.: “Paciente retornou por mensagem”, “Ajuste de dose por teleatendimento”).
- **Onde**: Dentro do prontuário ou em uma aba “Evoluções”.
- **Implementação**: Novo model opcional `ClinicalEvolution` (patientId, doctorId, date, text, createdAt) ou uso de um “registro” em texto no próprio prontuário. Pode começar simples (campo de texto + data).

### 3.3 Atalhos na consulta
- Na tela da consulta (`/medico/consultas/[id]`):
  - Link “Abrir prontuário do paciente” (nova página de prontuário).
  - Resumo da última consulta e última receita no sidebar ou em colapsável.

### 3.4 Templates e modelos
- Templates de anamnese e de evolução (ex.: dropdown “Usar template”) para acelerar preenchimento.
- Pode ser tabela `Template` (nome, tipo: ANAMNESE/EVOLUÇÃO, conteúdo) ou JSON em configuração.

### 3.5 Lembretes e retornos
- Já existe `nextReturnDate`. Podem ser adicionados:
  - Lista “Retornos previstos” no dashboard do médico (próximos 7/15 dias).
  - Lembrete (e-mail ou notificação) para o médico na véspera do retorno.

### 3.6 Notificações úteis
- Notificação quando o paciente preenche anamnese ou envia documento antes da consulta.
- Badge “Novo anexo” ou “Anamnese atualizada” na lista de consultas.

### 3.7 Outras ferramentas (médico)
- **Atestados**: emissão de atestado simples (data, CID opcional, texto) e PDF para download.
- **Pedido de exame**: modelo de pedido de exame (texto/PDF) vinculado ao paciente (e opcionalmente à consulta).
- **Laudo final**: hoje há “rascunho de laudo por IA”; fluxo para “aprovar e assinar” (arquivo final PDF) e anexar ao prontuário.
- **Indicadores**: quantidade de consultas na semana, receitas emitidas, retornos agendados (já próximo do que o dashboard faz).

---

## 4. Recomendações para o dashboard do PACIENTE

### 4.1 Meu histórico / Meu prontuário (visão paciente)
- **O que é**: Página “Meu histórico” ou “Meu prontuário” onde o paciente vê, em ordem cronológica:
  - Consultas (data, médico, status).
  - Para cada consulta: resumo (ex.: “Consulta realizada”, “Receita emitida”), sem expor notas internas do médico.
  - Receitas e documentos que ele já pode acessar (links para receitas e documentos que já existem).
- **Objetivo**: Transparência e “tudo em um lugar”, alinhado à LGPD (dados do próprio paciente).

### 4.2 Preparação para a consulta
- Já existe anamnese pré-consulta e upload de documentos na página da consulta.
- Melhorias possíveis:
  - Checklist “O que levar para a consulta” (documentos, exames).
  - Lembrete 24h antes: “Preencha sua anamnese e anexe laudos se ainda não fez”.

### 4.3 Pós-consulta
- Resumo pós-consulta (o que foi combinado, próxima data de retorno, receita disponível).
- Opção de avaliar o atendimento (já existe `ConsultationFeedback`); exibir “Obrigado por avaliar” ou incentivo na área do paciente.

### 4.4 Comunicação e lembretes
- Lembretes de retorno (e-mail/notificação) com data sugerida pelo médico (`nextReturnDate`).
- Central de notificações (já existe ícone de sino): listar “Nova receita”, “Consulta confirmada”, “Lembrete de retorno”.

### 4.5 Saúde e cannabis
- **Tratamento**: página “Meu tratamento” com receita ativa, medicamentos e data de validade (dados já existem; é uma visão consolidada).
- **Carteirinha e ANVISA**: já existe carteirinha; reforçar link para autorização ANVISA e próximos passos (renovação, importação).

### 4.6 Outras ferramentas (paciente)
- **Agendamento**: já existe fluxo de agendamento; melhorar descoberta (botão “Agendar nova consulta” no dashboard).
- **Pagamentos**: histórico e comprovantes já existem; opção de “Segunda via” ou reenvio por e-mail.
- **Exportação de dados (LGPD)**: permitir baixar “Meus dados” (consultas, receitas, documentos) em ZIP ou PDF (já existe rota de export em `/api/user/export`; expor no perfil como “Exportar meus dados”).

---

## 5. Priorização sugerida

| Prioridade | Ferramenta | Onde | Esforço |
|------------|------------|------|---------|
| **P1** | Prontuário do paciente (visão médico) | Médico > Pacientes > Ver prontuário | Médio |
| **P1** | Meu histórico / Meu prontuário (visão paciente) | Paciente > novo item no menu | Médio |
| **P2** | Evolução clínica (registros entre consultas) | Dentro do prontuário médico | Baixo/Médio |
| **P2** | Retornos previstos no dashboard do médico | Médico > Dashboard | Baixo |
| **P2** | Link “Abrir prontuário” na tela da consulta | Médico > Consulta [id] | Baixo |
| **P3** | Templates (anamnese/evolução) | Médico > Consulta e Prontuário | Médio |
| **P3** | Atestados e pedidos de exame | Médico | Médio |
| **P3** | Laudo final (aprovar e assinar) | Médico > Consulta | Médio |
| **P3** | Exportação de dados (LGPD) no perfil do paciente | Paciente > Perfil | Baixo |
| **P3** | Central de notificações (lista) | Médico e Paciente | Médio |

---

## 6. Resumo: o que oferecer para “experiência ainda maior”

- **Médico**: **Prontuário eletrônico** por paciente (timeline de consultas, anamneses, notas, receitas, laudos, anexos), **evoluções** entre consultas, **retornos previstos**, atalho ao prontuário na consulta, templates e, em seguida, atestados, pedidos de exame e laudo final assinado.
- **Paciente**: **Meu histórico** (prontuário em linguagem acessível), **meu tratamento** (receita ativa e validade), **lembretes e notificações**, **exportação de dados (LGPD)** e reforço da preparação para consulta e pós-consulta.

Isso coloca o sistema alinhado às melhores práticas de telemedicina e PEP, com foco em **prontuário** como eixo central para o médico e **histórico/transparência** para o paciente.
