# Dashboard do Engenheiro Agrônomo — Especificação de Produto, UX, UI e Funcionalidades

**Documento de análise e projeto (sem implementação de código)**  
**Data:** Fevereiro 2025  
**Contexto:** Plataforma de telemedicina e cannabis medicinal — paciente já realizou consulta, recebeu receita e contratou/pagou pelo serviço do engenheiro agrônomo.

---

## 1. Objetivo do dashboard

O dashboard do engenheiro agrônomo é uma **ferramenta profissional de trabalho**, com os seguintes objetivos:

| Objetivo | Descrição |
|----------|-----------|
| **Centralizar** | Receber e listar apenas as solicitações de análise agronômica que foram **contratadas e pagas**. |
| **Visualizar** | Acesso controlado aos dados do paciente e da receita médica necessários para a análise técnica. |
| **Analisar** | Permitir análise técnica da receita (leitura, download, contexto adicional) sem poder alterá-la. |
| **Emitir** | Apoiar o preenchimento, rascunho, validação e emissão do laudo agronômico com responsabilidade explícita. |
| **Rastrear** | Garantir rastreabilidade (quem acessou, quando emitiu), segurança e clareza de responsabilidades. |

**Princípio:** O engenheiro atua de forma **técnica e independente**. A plataforma **intermedia** o acesso aos dados e a entrega do laudo; não emite o laudo nem interfere na decisão técnica.

---

## 2. Perfil e permissões do engenheiro agrônomo

### 2.1 Premissa de acesso

- O engenheiro **só acessa casos** em que:
  - O paciente já realizou consulta médica na plataforma.
  - Existe receita médica vinculada.
  - O serviço de análise agronômica foi **contratado e pago** (cobrança/pagamento confirmado).
- Não há acesso a pacientes, consultas ou receitas que não estejam vinculados a uma **solicitação de laudo agronômico paga** atribuída a esse engenheiro.

### 2.2 O que o engenheiro PODE

| Ação | Escopo |
|------|--------|
| **Ver** | Lista de solicitações atribuídas a ele; status de cada caso; dados mínimos do paciente (nome, endereço/localização relevante, dados autorizados); receita médica (somente leitura); contexto técnico adicional e histórico de observações do caso. |
| **Baixar** | Cópia da receita médica (PDF) e do laudo agronômico emitido por ele (para uso profissional/arquivo). |
| **Editar** | Apenas o **conteúdo do laudo agronômico** (rascunho até emissão final). Não pode editar receita, dados do paciente nem dados de pagamento. |
| **Emitir** | Laudo agronômico final (após preenchimento e aceite de responsabilidade), com assinatura/identificação profissional. |
| **Solicitar** | Informações adicionais ao paciente (via fluxo controlado pela plataforma), e registrar observações no caso. |
| **Recusar** | Aceitar ou recusar o caso (com motivo opcional), conforme regras de negócio (ex.: recusa gera devolução ou realocação). |

### 2.3 O que o engenheiro NÃO PODE

| Restrição | Motivo |
|-----------|--------|
| Acessar outros pacientes ou receitas não vinculados às suas solicitações pagas. | Minimização de dados (LGPD) e necessidade profissional. |
| Editar a receita médica. | A receita é documento do médico; somente leitura. |
| Ver dados desnecessários (ex.: CPF completo, dados bancários, outras consultas do paciente). | Princípio do mínimo necessário. |
| Remover ou alterar laudo já emitido (apenas correção via fluxo excepcional, se previsto em regra). | Rastreabilidade e responsabilidade técnica. |
| Acessar painel admin, área do médico ou área do paciente. | Isolamento por perfil (role). |

### 2.4 Resumo de permissões (matriz)

| Recurso | Ver | Baixar | Editar | Emitir |
|---------|-----|--------|--------|--------|
| Lista de solicitações (suas) | ✅ | — | — | — |
| Dados mínimos do paciente | ✅ | — | ❌ | — |
| Receita médica | ✅ | ✅ | ❌ | — |
| Contexto técnico / observações | ✅ | ✅ (se permitido) | ✅ (observações próprias) | — |
| Rascunho do laudo | ✅ | — | ✅ | — |
| Laudo final | ✅ | ✅ | ❌ | ✅ (uma vez) |

---

## 3. Estrutura geral do dashboard

### 3.1 Visão geral (Home)

**Objetivo:** O engenheiro entra e vê de imediato o trabalho pendente e o status dos casos.

- **Lista de solicitações**
  - Filtros sugeridos: status, data de abertura, data de vencimento (se houver SLA).
  - Ordenação: por data de criação (mais recente primeiro) ou por status (ex.: “Novo” no topo).
  - Colunas (sugestão): Paciente (nome), Receita (data de emissão), Status, Data da solicitação, Ações (Abrir caso).

- **Status de cada caso (workflow)**
  - **NOVO** — Solicitação paga, ainda não assumida/visualizada pelo engenheiro.
  - **EM_ANALISE** — Engenheiro abriu o caso e está analisando (pode ter rascunho de laudo).
  - **AGUARDANDO_INFORMACOES** — Solicitou informações ao paciente; aguardando resposta.
  - **LAUDO_EMITIDO** — Laudo final emitido e disponível ao paciente.
  - **RECUSADO** — Engenheiro recusou o caso (motivo registrado).
  - **CANCELADO** — Cancelamento ou expiração (regra de negócio a definir).

- **Indicadores simples (cards ou resumo no topo)**
  - Pendências: quantidade de casos em “Novo” ou “Aguardando informações”.
  - Em análise: quantidade em “Em análise”.
  - Laudos emitidos (período opcional: hoje, semana, mês).

Nenhum elemento comercial ou promocional; foco em trabalho profissional.

### 3.2 Detalhe do caso (Paciente / Solicitação)

Ao abrir uma solicitação, o engenheiro vê um layout em seções (abas ou cards), com as informações abaixo.

#### 3.2.1 Informações do paciente (apenas o necessário)

- Nome completo.
- Endereço ou localização relevante para análise (ex.: cultivo, região).
- Outros dados previamente autorizados pelo paciente para compartilhar com o engenheiro (ex.: telefone para contato técnico).
- **Aviso fixo (LGPD):** texto do tipo: “Uso dos dados restrito à análise agronômica e emissão do laudo. Uso responsável e em conformidade com a LGPD.”

Dados sensíveis desnecessários (ex.: CPF completo, e-mail de login) não devem ser exibidos ou devem ser mascarados.

#### 3.2.2 Receita médica

- **Visualização** da receita diretamente no dashboard (visualizador PDF ou HTML gerado a partir do dado existente).
- **Download** em PDF (botão explícito).
- **Metadados exibidos:**
  - Data de emissão.
  - Profissional emissor (nome e CRM).
  - Indicação clara: “Documento somente leitura — não editável”.

A receita não é editável pelo engenheiro em nenhuma circunstância.

#### 3.2.3 Contexto técnico adicional

- Campo ou bloco para **informações complementares** fornecidas pelo paciente (ex.: texto enviado ao solicitar o laudo, anexos aprovados).
- **Histórico de mensagens ou observações** (ex.: solicitação de informações, resposta do paciente, observações internas do engenheiro), ordenado cronologicamente.
- Tudo em uma única linha do tempo ou lista reversa (mais recente no topo).

---

## 4. Emissão do laudo agronômico

### 4.1 Área dedicada

- Uma **seção/aba específica** “Laudo agronômico” ou “Emitir laudo” dentro do detalhe do caso.
- Acesso possível quando o status for “Em análise” (e eventualmente “Aguardando informações” quando as informações chegarem).

### 4.2 Formulário estruturado

- **Campos técnicos** definidos em conjunto com o time de produto e um engenheiro agrônomo (ex.: objetivo do cultivo, espécie/variedade, local, condições, recomendações técnicas, restrições, validade técnica sugerida).
- **Obrigatórios x opcionais:** claramente marcados (ex.: asterisco ou “Obrigatório”).
- **Validações básicas:** preenchimento obrigatório, formatos (datas, números) e tamanhos máximos para evitar erros antes de enviar.

### 4.3 Rascunho e emissão final

- **Salvar rascunho:** botão “Salvar rascunho” que persiste o estado do formulário sem alterar o status do caso para “Laudo emitido”.
- **Emitir laudo:** botão “Emitir laudo” (ou “Finalizar e emitir”) que:
  - Valida todos os campos obrigatórios.
  - Exige **confirmação explícita de responsabilidade técnica** (checkbox + texto: “Declaro que o laudo é de minha autoria e sob minha responsabilidade técnica”).
  - Exige **assinatura ou identificação profissional** (nome completo, CREA ou equivalente).
  - Após confirmação, gera o **laudo final** (PDF ou formato definido), altera o status para “Laudo emitido” e notifica o paciente (conforme regra da plataforma).

### 4.4 Autoria e responsabilidade

- Texto claro na tela e no próprio laudo:
  - **Autoria:** o laudo é de autoria do engenheiro agrônomo.
  - **Papel da plataforma:** apenas intermedia o serviço; não emite nem se responsabiliza pelo conteúdo técnico.
- O PDF (ou documento final) deve conter identificação do profissional e data/hora de emissão.

---

## 5. UX (Experiência do usuário — engenheiro)

### 5.1 Fluxo de ponta a ponta

1. **Login** → redirecionamento para o dashboard do engenheiro (ex.: `/engenheiro` ou `/agronomo`).
2. **Home** → lista de solicitações com status e indicadores; clique em um caso para abrir.
3. **Detalhe do caso** → abas ou seções: Paciente, Receita, Contexto técnico, Laudo.
4. **Análise** → leitura da receita, contexto e dados do paciente; opção de “Solicitar informações” se existir fluxo para isso.
5. **Laudo** → preencher formulário, salvar rascunho quantas vezes quiser; quando pronto, “Emitir laudo” com confirmação e assinatura.
6. **Pós-emissão** → caso passa a “Laudo emitido”; engenheiro pode visualizar e baixar o laudo; paciente recebe acesso conforme regra da plataforma.

### 5.2 Redução de fricção

- Poucos cliques para ir da lista ao caso e da análise ao formulário do laudo.
- Receita visível no mesmo contexto do formulário do laudo (evitar abas demais).
- Salvamento automático de rascunho (opcional) para evitar perda de dados.
- Mensagens de erro objetivas (ex.: “Preencha o campo X”) e sucesso claras (“Laudo emitido com sucesso”).

### 5.3 Organização da informação

- Hierarquia clara: título da página → seções → campos.
- Uso de cards ou abas para separar: Dados do paciente | Receita | Contexto | Laudo.
- Estados visíveis: “Novo”, “Em análise”, “Aguardando informações”, “Laudo emitido”, “Recusado”, “Cancelado”.

### 5.4 Estados de erro e sucesso

- **Erro de validação:** mensagem próxima ao campo ou no topo do formulário; não limpar dados já preenchidos.
- **Erro de rede/servidor:** mensagem amigável e opção de “Tentar novamente” ou “Salvar rascunho”.
- **Sucesso ao salvar rascunho:** toast ou mensagem breve “Rascunho salvo”.
- **Sucesso ao emitir laudo:** mensagem clara “Laudo emitido com sucesso” e redirecionamento ou atualização para estado “Laudo emitido” com link para download.

---

## 6. UI (Interface)

### 6.1 Diretrizes visuais

- **Estilo:** profissional e técnico; coerente com a área do médico (ex.: tons verdes, neutros) mas identificável como área do engenheiro (subtítulo “Área do Engenheiro Agrônomo” ou equivalente).
- **Layout:** limpo, funcional; prioridade para conteúdo e ações, sem elementos decorativos desnecessários.
- **Hierarquia:** títulos bem definidos (H1 para página, H2 para seções); contraste adequado para acessibilidade.

### 6.2 Componentes e estrutura

- **Cards** para cada bloco (resumo do caso, paciente, receita, contexto, laudo).
- **Abas** ou **seções colapsáveis** para alternar entre Paciente, Receita, Contexto e Laudo sem poluir a tela.
- **Tabela** na home com colunas ordenáveis e filtros simples.
- **Botões primários** para ações principais (Abrir caso, Emitir laudo); secundários para Salvar rascunho, Solicitar informações, Recusar.

### 6.3 Responsividade

- **Desktop-first:** uso principal no computador; layout otimizado para telas médias e grandes.
- **Adaptável:** lista e detalhe utilizáveis em tablet; formulário do laudo utilizável em mobile (scroll, campos empilhados).

### 6.4 O que evitar

- Interface poluída com banners, ofertas ou conteúdo comercial.
- Elementos que distraiam do fluxo (animações excessivas, pop-ups desnecessários).
- Excesso de cores ou estilos que quebrem a seriedade do contexto profissional.

---

## 7. Segurança, privacidade e compliance

### 7.1 Controle de acesso

- **Autenticação:** mesmo mecanismo da plataforma (ex.: NextAuth); role específico (ex.: `AGRONOMIST` ou `ENGENHEIRO_AGRONOMO`).
- **Autorização:** em toda API e página, validar que o usuário é engenheiro e que a solicitação/caso pertence a ele (e está pago).
- **Rotas protegidas:** prefixo dedicado (ex.: `/engenheiro`) incluído no middleware; redirecionamento para login se não autenticado e para home se role incorreto.

### 7.2 Logs de ações (auditoria)

- Registrar em **AuditLog** (ou equivalente):
  - Acesso à lista de solicitações (opcional, para não poluir).
  - **Abertura/visualização de um caso** (quem, quando, qual caso).
  - **Visualização e download da receita** (quem, quando, qual documento).
  - **Emissão do laudo** (quem, quando, qual caso, identificação do profissional).
  - **Recusa de caso** (quem, quando, motivo se informado).
- Logs imutáveis e com retenção definida (ex.: política de retenção LGPD).

### 7.3 Proteção de dados sensíveis

- Dados do paciente expostos apenas no mínimo necessário (nome, endereço/localização, dados autorizados).
- Receita e laudo em trânsito via HTTPS; em repouso conforme política da plataforma (criptografia, acesso restrito).
- Sem exibir CPF completo, senha ou dados de pagamento ao engenheiro.

### 7.4 Consentimento do paciente

- Antes de criar a solicitação de laudo (fluxo paciente), o paciente deve **consentir** no compartilhamento dos dados necessários com o engenheiro agrônomo (termo específico ou checkbox com link para política).
- Registro do consentimento (tipo, versão, data) em **PatientConsent** ou equivalente.
- No dashboard do engenheiro, exibir aviso de uso responsável (LGPD) na seção de dados do paciente.

### 7.5 Conformidade LGPD

- Base legal: execução de contrato (prestação do serviço de análise) + consentimento para compartilhar dados com o engenheiro.
- Minimização: só expor ao engenheiro o que for necessário para análise e laudo.
- Documentação: manter especificação de tratamento (quem acessa o quê, para quê, por quanto tempo) e política de privacidade atualizada.

---

## 8. Estados, exceções e limites

### 8.1 Engenheiro recusa o caso

- **Ação:** botão “Recusar caso” com motivo opcional (textarea).
- **Regra:** status do caso → “Recusado”; motivo fica registrado em log e visível para admin/operação.
- **Efeito no pagamento:** definir regra (reembolso automático, crédito, ou análise manual); comunicar ao paciente.

### 8.2 Casos incompletos

- Se a receita ou dados mínimos estiverem ausentes: não permitir “Emitir laudo”; exibir mensagem clara (ex.: “Dados insuficientes para emissão do laudo”).
- Se o paciente não tiver autorizado compartilhamento: fluxo de solicitação de laudo não deve criar caso até consentimento; se já criado, bloquear acesso ao caso até regularização.

### 8.3 Solicitação de informações adicionais

- Fluxo: engenheiro envia “Solicitação de informações” (texto); status → “Aguardando informações”; paciente recebe notificação e pode responder (área do paciente ou e-mail).
- Resposta do paciente é anexada ao caso (histórico); engenheiro é notificado; status pode voltar a “Em análise”.
- Prazo máximo opcional (ex.: 15 dias); após isso, status “Expirado” ou “Cancelado” conforme regra.

### 8.4 Cancelamento ou expiração

- **Cancelamento:** pelo paciente ou pela operação antes da emissão; status “Cancelado”; política de reembolso à parte.
- **Expiração:** se houver SLA ou prazo máximo para emissão sem atividade; status “Expirado”; regra de reembolso ou nova solicitação.

### 8.5 Histórico de laudos emitidos

- Na home, filtro ou aba “Laudos emitidos” para o engenheiro ver seus casos finalizados.
- No detalhe do caso com status “Laudo emitido”, exibir o laudo (visualização e download); não permitir edição do laudo já emitido (correção apenas por fluxo excepcional documentado, se houver).

---

## 9. Entregáveis (resumo executivo)

### 9.1 Arquitetura funcional

- **Novo role:** `AGRONOMIST` (ou `ENGENHEIRO_AGRONOMO`).
- **Novas entidades (conceituais):**
  - **Solicitação de laudo agronômico (AgronomicRequest):** id, patientId, prescriptionId, chargeId/paymentId (cobrança/pagamento do serviço), assignedAgronomistId (userId do engenheiro), status (NOVO, EM_ANALISE, AGUARDANDO_INFORMACOES, LAUDO_EMITIDO, RECUSADO, CANCELADO), createdAt, updatedAt, refusedAt, refusedReason, etc.
  - **Laudo agronômico (AgronomicReport):** id, requestId, agronomistId, conteúdo (JSON ou texto estruturado), pdfUrl, status (DRAFT | FINAL), signedAt, professionalIdentification (nome, CREA), createdAt, updatedAt.
  - **Mensagem/Observação do caso (AgronomicRequestMessage):** id, requestId, authorId (engenheiro ou sistema), type (OBSERVATION | REQUEST_INFO | PATIENT_REPLY), content, createdAt.
- **Vínculos:** Patient, Prescription, Charge/Payment já existentes; acesso ao engenheiro apenas via AgronomicRequest atribuído e pago.

### 9.2 Journey do engenheiro (resumida)

1. Login → Dashboard (lista de solicitações).
2. Clicar em um caso → Detalhe (Paciente | Receita | Contexto | Laudo).
3. Ler receita e contexto; opcionalmente solicitar informações.
4. Preencher formulário do laudo; salvar rascunho.
5. Emitir laudo (confirmar responsabilidade, assinar) → status “Laudo emitido”; notificação ao paciente.
6. Ver histórico de laudos emitidos na lista.

### 9.3 Lista de telas e seções

| Tela | Seções / Conteúdo |
|------|-------------------|
| Login | (existente; redirecionamento por role) |
| Home `/engenheiro` | Indicadores (pendentes, em análise, emitidos); tabela de solicitações com filtros e status; botão Abrir caso. |
| Detalhe do caso `/engenheiro/solicitacoes/[id]` | Abas: Paciente (dados mínimos + aviso LGPD); Receita (visualização + download + metadados); Contexto (complementos + histórico de mensagens); Laudo (formulário + rascunho + emitir). |
| (Opcional) Minha conta | Nome, e-mail, CREA; alteração de senha. |

### 9.4 Campos necessários por tela (resumo)

- **Home:** filtros (status, data); colunas: paciente, receita (data), status, data solicitação; ação Abrir.
- **Paciente:** nome completo; endereço/localização; outros autorizados; aviso LGPD.
- **Receita:** visualizador; botão download; data emissão; médico (nome, CRM); badge “Somente leitura”.
- **Contexto:** texto complementar do paciente; lista de mensagens (data, autor, tipo, conteúdo).
- **Laudo:** campos técnicos (obrigatórios/opcionais conforme especificação técnica); Salvar rascunho; Emitir laudo (checkbox responsabilidade, identificação profissional, botão confirmar).

### 9.5 Regras de negócio principais

- Engenheiro só vê solicitações atribuídas a ele e com pagamento confirmado.
- Receita é somente leitura.
- Laudo só pode ser emitido uma vez por solicitação; após emissão, somente visualização/download.
- Recusa e cancelamento atualizam status e disparam regras de reembolso/notificação conforme definição.
- Todo acesso a caso, receita e emissão de laudo deve ser registrado em auditoria.

### 9.6 Pontos críticos de atenção

- **LGPD:** consentimento explícito do paciente para compartilhar dados com o engenheiro; minimização de dados; aviso de uso responsável.
- **Responsabilidade técnica:** texto e fluxo que deixem claro que o laudo é do engenheiro; plataforma apenas intermedeia.
- **Pagamento:** só liberar caso ao engenheiro após confirmação de pagamento (charge/payment status PAID).
- **Auditoria:** logs de acesso a caso, receita e emissão de laudo para rastreabilidade e eventual demanda legal.

### 9.7 Sugestões de evolução futura

- Assinatura digital do laudo (certificado digital).
- Templates de laudo configuráveis por admin.
- SLA e prazos (ex.: “Emitir em até X dias”); alertas para o engenheiro.
- Canal de mensagens integrado (engenheiro ↔ paciente) com histórico no caso.
- Relatório para o engenheiro: quantidade de laudos por período, tempo médio por caso.
- Múltiplos engenheiros: fila ou distribuição automática de solicitações (round-robin ou por especialidade).

---

## 10. Observação final

Este documento é **somente de produto, UX, segurança e responsabilidades**. Nenhum código foi implementado. A implementação deve seguir esta especificação, ajustando nomes de entidades e rotas ao padrão do projeto (ex.: Prisma, Next.js, middleware de rotas protegidas).

---

*Documento gerado com base na análise do sistema atual (roles, Prescription, Consultation, Charge, Payment, AuditLog, PatientConsent) e nos requisitos do prompt do Dashboard do Engenheiro Agrônomo.*
