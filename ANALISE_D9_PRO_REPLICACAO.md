# Análise detalhada D9 Pro — Replicação no ClickCannabis

Documento gerado a partir dos prints da reunião com a D9 Tech. Objetivo: mapear menus, funcionalidades, integrações e UI/UX do sistema D9 Pro para aproveitar o máximo no projeto ClickCannabis.

---

## 1. Estrutura de menus e navegação (D9 Pro)

### 1.1 Barra lateral (sidebar)

O D9 Pro usa uma **sidebar fixa à esquerda** com tema escuro, ícones e agrupamento por seções. O item ativo é destacado em **roxo**; há **badges numéricos** para pendências (ex.: "Aprovar Cadastros... 16").

| Seção        | Itens                                                                 | Observação |
|-------------|-----------------------------------------------------------------------|------------|
| **PEDIDOS** | Novo pedido, Todos pedidos, Visão geral, Produção/Separação, Rastrear, $ Pagamento rápido | Fluxo completo de pedido |
| **CADASTROS** | + Novo cliente, Clientes, Pacientes, Aprovar Cadastros... **16**     | Contador de pendências |
| **ATENDIMENTO** | Chats, Tarefas, Configurar                                           | Comunicação e operação |
| **RELATÓRIOS** | Dashboards (dropdown), Pedidos, Prazos, Comissões, Prescritores, Atendimento, **Anvisa Simples**, Exportações, Insights | BI e compliance |
| **ESTOQUE** | Gerenciar                                                            | Controle de inventário |
| **COMUNICAÇÃO** | (métricas: 2, 2s, 0.0/5.0)                                           | Indicadores de canal |

- **Header:** Logo, D9Pag / D9Med (módulos), bandeira BR, engrenagem.
- **Topo direito:** Lupa, alternador tema (sol/lua), notificações, avatar e nome do usuário.
- **Rodapé:** Botão Ajuda, CSV (exportar), marca "VERSÃO CONFIDENCIAL".

---

## 2. Funcionalidades por tela (D9 Pro)

### 2.1 Disparos (comunicação multicanal)

- **Cards de quota:** "0 Emails Disponíveis", "51 WhatsApps Disponíveis" — visibilidade de créditos.
- **Tabela:** #, Título, Tipo (WhatsApp/Email), Total enviado, Total, Criado em.
- **Ações:** Buscar nos últimos registros, botão "Novo", paginação.
- **Conceito:** Campanhas unificadas (email + WhatsApp) com controle de saldo.

### 2.2 Rastrear pedidos

- **Cards por pedido:** #ID, nome do cliente, localização (UF/cidade), telefone (+55).
- **Status:** Tag (ex.: "673 Dia(s) em trânsito" ou "Nenhuma informação de rastreio").
- **Histórico:** Lista de eventos com data/hora (ex.: "Remessa entregue", "Remessa em rota").
- **Filtro:** "Todos os Rastreios" (dropdown).

### 2.3 Dashboard / Relatórios — Pedidos

- **Pedidos por estado:** Mapa do Brasil com cores por volume/valor; ranking por estado (ex.: #1 SP, #2 GO) com quantidade e valor.
- **Características por pedido:** Tabela Produto, Quantidade, Faturado; filtro "Todos Produtos".
- **Pacientes novos e recorrentes:** Gráfico de pizza (Primeiras compras 20% / Recompras 80%); total de pedidos e faturamento no período.
- **Pedidos por prescritor:** Tabela Nome, Tipo (Médico), Faturado, Pedidos, Últ. paciente; ordenação por coluna.
- **Pedidos por operador:** Gráfico de barras por horário; gráfico de pizza por operador (ex.: Jennifer Macedo 42%); filtros por operador e por solicitação.
- **Faturamento:** Gráfico com Produtos, Frete, Descontos, Lucro, Faturado; filtros "Todos pedidos", "Resumido", intervalo de datas.
- **Faturamento Frete:** Lucro, Cobrado, Custo (podem ser R$ 0).
- **Estatísticas gerais:** Variação relação 7 dias; cards Clientes novos, Pedidos novos, Faturamento com % e totais; subperíodos.
- **Patologias atendidas:** Gráfico de barras + tabela (Patologia, Pedidos, Share %); tooltip no gráfico.
- **Clientes cadastrados:** Gráfico de barras simples (ex.: 30 clientes em 01/2026).
- **Prazos:** Mapa do Brasil; lista por estado (pedidos, média dias, mais rápido, mais lento); "Médias" (mínima 10% mais rápidos, total, máxima); filtros Frete (Sedex), Tipo (A partir do envio), Data.

### 2.4 Chats Dashboard (Atendimento)

- **Filtros:** Gateway (Todos), Período (date range).
- **KPI cards:** Chats Abertos (no período), Em atendimento (Agora), Aguardando X (Agora), Aguardando consulta (Agora), Orçamento (Agora), Finalizado (Agora).
- **Gráfico:** Status do Chat (pizza) com legenda (Em atendimento, Aguardando X, Aguardando consulta, Orçamento, Finalizado); "Com base em 8".

### 2.5 Produção / Separação

- **Busca:** "Buscar nos últimos registros".
- **Tabela:** ID, Destinatário (nome + badge D9Tech/Associação), Produtos (lista com checkboxes por item), Estado/Cidade, Criado em, **STATUS** com botão "Avançar Etapa", coluna # com Etiqueta, Declaração, Documentos.
- **Paginação:** Anterior / 1 / Próximo.
- **Exportar:** CSV.

### 2.6 Modal Documentos do pedido

- **Título:** "Documentos do pedido #466".
- **Blocos:** Por paciente/cliente (#36 Paciente, #46 Cliente) com documentos (Receita médica, Documento Paciente, Comprovante de Endereço, Outros anexos) e datas.
- **Dados exibidos:** Patologias, Gênero, Nome do Prescritor, Data nascimento, Validade da Receita, UF Prescritor, Registro Prescritor, Documento SSP (RG).
- **Alerta:** "Documentação inválida!" em vermelho.
- **Ação:** Fechar.

### 2.7 Multi-Pagamento

- **Descrição:** "Selecione e configure o número de partições para o valor de R$ X."
- **Partições:** Botões 2 a 10; cada partição com Valor, Tipo (ex.: Pix), Parcelamento (ex.: 1x).
- **Ações:** Salvar (destaque), Fechar.

### 2.8 Visão geral dos pedidos (Kanban)

- **Colunas por status:** Ex.: "Ficando Documentação" (3, R$ 885,32), "Gerando Etiqueta" (7, R$ 4.175,44), "Pedido em produção" (3, R$ 2.907,56), "Pedido em Separação" (R$ 2.330,33).
- **Cards por pedido:** #ID, Nome, UF/Cidade, Valor (verde), Criado em.
- **Badge** em cada coluna com quantidade de itens.

### 2.9 Detalhe do pedido (barra lateral direita)

- **Fluxo:** "1 - Analisando receita" com botões **Voltar fase** e **Avançar fase**.
- **Ações:** Imprimir, Etiqueta Logística, Declaração de conteúdo, Receita Médica, Pagamento, **Multi-Pagamento**, Copiar Pedido.
- **Detalhes:** Destinatário, Contato (+55), Logradouro, Número, Licenciado, Comissão, Receita, Frete (R$), Tipo (Sedex), Caixa, #ID Cliente (CERTO), [Cliente] CPF, Receita médica - data.

### 2.10 Videoconferência (overlay)

- Controles estilo Google Meet (câmera, microfone, emojis, mais opções, desligar).
- Miniaturas "Você" e "D" (apresentador).
- Texto: "Danieli Stanck (apresentando e fazendo anotações)".

---

## 3. Integrações implícitas (D9 Pro)

| Área            | Integração / Recurso                          |
|-----------------|------------------------------------------------|
| Comunicação     | WhatsApp Business (Disparos, Chats, contato)  |
| Email           | Provedor transacional (Disparos, quotas)      |
| Pagamento       | Pix, multi-pagamento, D9Pag                    |
| Logística       | Rastreio, Sedex, etiquetas, declaração         |
| Regulatório     | Anvisa Simples (relatórios/compliance)        |
| Telemedicina    | Vídeo chamada (Meet/Zoom-like), anotações     |
| CRM/BI          | Prescritores, operadores, dashboards, CSV      |
| Estoque         | Gerenciar (módulo Estoque)                    |

---

## 4. UI/UX observado (D9 Pro)

- **Tema escuro** em todo o admin; alternador sol/lua no header.
- **Sidebar** com ícones, grupos colapsáveis, item ativo em roxo.
- **Badges** numéricos no menu (ex.: 16 em Aprovar Cadastros) e nas colunas do Kanban.
- **Cards** para KPIs e métricas ("Agora" vs "No período").
- **Filtros** consistentes: período (date range), gateway, tipo, operador, empresa.
- **Tabelas** com ordenação por coluna (setas), paginação, busca, ação CSV.
- **Mapa do Brasil** para dados geográficos (pedidos por estado, prazos por estado).
- **Gráficos:** barras, pizza, linha; tooltips; legendas alinhadas.
- **Modais** focados (Multi-Pagamento, Documentos) com botões Salvar/Fechar.
- **Fluxo de etapas** explícito (Voltar fase / Avançar etapa).
- **Validação** com feedback forte ("Documentação inválida!" em vermelho).
- **Exportação** CSV em várias telas; botão Ajuda no rodapé.

---

## 5. O que já temos no ClickCannabis

### 5.1 Menu admin atual (AdminLayout)

- **Dashboard:** Visão Geral, Métricas, ERP CANNA, GPP CANNA, IFP CANNA.
- **Pacientes:** Pacientes.
- **Prescrições:** Prescrições/Receitas, Consultas, Carteirinhas.
- **Médicos:** Médicos.
- **Documentos:** Documentos.
- **Relatórios:** Relatórios (uma página).
- **Compliance:** Consentimentos e Auditoria, ANVISA, Medicamentos.
- **Usuários:** Usuários (admin only).
- **Integrações:** Telemedicina, Email, WhatsApp, Fluxos WhatsApp, Pagamentos, Google Analytics.
- **Configurações:** Configurações, Segurança, Identidade Visual, Blog, Galeria, Artigos Destaque, Dúvidas Frequentes, Teste de Receita.

### 5.2 Funcionalidades existentes

- Dashboard com totais (pacientes, consultas, prescrições, receita) e **ações pendentes** (consultas, receitas, ANVISA, carteirinhas) — sem badge no menu.
- Métricas: consultas por status, prescrições, usuários, acessos, regiões, financeiro, taxas de conversão/cancelamento.
- Relatórios: exportação PDF/CSV por período.
- WhatsApp e Email em páginas separadas; não há tela unificada "Disparos" nem cards de quota.
- Consultas e receitas em listas/tabelas; **não há Kanban** por status.
- Não há tela "Produção/Separação" nem "Rastrear" (não há fluxo de pedido físico).
- Não há Multi-Pagamento; pagamentos existem em admin/pagamentos.
- ANVISA e Compliance existem; "Anvisa Simples" como subrelatório não está no mesmo nível de detalhe.
- Tema claro no admin; **sem dark mode** no painel.
- Sem contadores (badges) nos itens do menu lateral.

---

## 6. Gaps e prioridades de replicação

### 6.1 Alta prioridade (replicar primeiro)

| Item D9 Pro              | Ação no ClickCannabis |
|--------------------------|------------------------|
| Badges no menu           | Contadores no sidebar: "Aprovar cadastros N", "Consultas pendentes N", "Receitas pendentes N", "ANVISA pendentes N". Buscar dados da API e exibir ao lado do item. |
| Tema escuro no admin     | Alternador claro/escuro no header do admin; variáveis CSS (ex.: `--bg-sidebar`, `--text-primary`) e classe `dark` no container do admin. |
| Relatórios por categoria | Em Relatórios: submenus ou abas (Pedidos/Consultas, Prazos, Comissões, Prescritores, Atendimento, Anvisa, Exportações). Reaproveitar dados de métricas e APIs existentes. |
| Filtro de período global | Date range picker no header ou na página de relatórios, aplicado a todos os cards/gráficos da tela. |
| Exportar CSV em listas   | Botão CSV nas tabelas principais (consultas, receitas, pacientes, pagamentos) chamando API de export. |

### 6.2 Média prioridade

| Item D9 Pro              | Ação no ClickCannabis |
|--------------------------|------------------------|
| Disparos unificado       | Nova página admin "Disparos" ou "Campanhas": listar campanhas email + WhatsApp; cards "Emails disponíveis" / "WhatsApp disponíveis" (usar config ou API de quota se houver). |
| Kanban de consultas      | Opção "Visão Kanban" em Consultas: colunas por status (Agendada, Confirmada, Realizada, Cancelada, etc.) com cards arrastáveis (opcional). |
| Mapa do Brasil           | Em Métricas/Relatórios: gráfico ou mapa por UF (pacientes ou consultas por estado) usando dados de `regions` já existentes. |
| Documentos do pedido     | Modal ou drawer na consulta/receita: documentos do paciente, receitas, validade, prescritor; alerta "Documentação inválida" se regras falharem. |
| Fluxo de etapas          | Na tela de detalhe da consulta/receita: steps (ex.: Agendada → Confirmada → Realizada) com botões "Avançar etapa" / "Voltar etapa" e histórico. |

### 6.3 Baixa prioridade / contexto diferente

| Item D9 Pro           | Observação |
|-----------------------|------------|
| Produção/Separação    | Relevante se houver operação de separação física (pedidos/entregas). Caso contrário, manter apenas fluxo de consulta/receita. |
| Rastrear pedidos      | Útil se houver entrega física e integração com transportadora; senão, deixar para fase posterior. |
| Multi-Pagamento       | Replicar se o negócio exigir divisão do valor em várias formas de pagamento; depende do gateway. |
| Chats Dashboard       | Já existe WhatsApp; evoluir para dashboard de conversas (abertas, em atendimento, finalizadas) se houver fila de atendimento. |
| Estoque               | Só faz sentido se o produto tiver controle de estoque (medicamentos/vendas). |

---

## 7. Checklist de melhorias UI/UX (inspirado no D9 Pro)

- [ ] **Sidebar:** Manter grupos e ícones; adicionar badges de contagem nos itens com pendências.
- [ ] **Header:** Adicionar alternador de tema (claro/escuro) e, se fizer sentido, filtro de período global.
- [ ] **Dashboards:** Usar cards para KPIs; indicar "(Agora)" vs "(No período)" quando aplicável.
- [ ] **Tabelas:** Ordenação por coluna, busca, paginação e botão "Exportar CSV" em todas as listagens principais.
- [ ] **Relatórios:** Uma página com abas ou sublinks (Consultas, Prescrições, Financeiro, Prescritores, ANVISA); filtro de datas; gráficos + tabelas; CSV.
- [ ] **Detalhe de consulta/receita:** Barra lateral ou seção com etapas, ações (imprimir, documentos) e alertas de documentação.
- [ ] **Modais:** Padrão único (título, conteúdo, Salvar/Cancelar ou Fechar); destaque para erros (ex.: borda ou texto vermelho).
- [ ] **Acessibilidade:** Contraste em tema escuro; labels e aria-labels; foco em teclado.

---

## 8. Resumo executivo

O D9 Pro é um ERP vertical com foco em **pedidos, cadastros, atendimento (chat), relatórios e compliance (Anvisa)**, com forte uso de **tema escuro**, **badges de pendência**, **Kanban**, **mapas** e **exportação CSV**.  

No ClickCannabis já existem: dashboard com pendências, métricas, relatórios básicos, ANVISA, WhatsApp, email, telemedicina e pagamentos. Os maiores ganhos de replicação são:

1. **Badges no menu** para consultas/receitas/ANVISA/cadastros pendentes.  
2. **Tema escuro** no admin.  
3. **Relatórios segmentados** (por tipo e período) e **exportação CSV** nas listagens.  
4. **Kanban de consultas** (opcional) e **fluxo de etapas** no detalhe.  
5. **Tela "Disparos"** unificada e **mapa por estado** nos relatórios, conforme prioridade de produto.

Com isso, o projeto incorpora o que há de mais aproveitável do D9 Pro sem copiar funcionalidades que dependem de contexto diferente (ex.: produção física, rastreio de entrega), até que esse contexto exista.

---

## 9. Próximos passos técnicos (onde implementar)

| Prioridade | O quê | Onde no projeto |
|------------|--------|------------------|
| Alta | Badges de pendência no menu | `components/layout/AdminLayout.tsx`: buscar contagens (ex.: `/api/admin/stats` ou `/api/admin/pending`), exibir `<span>` com número ao lado de "Consultas", "Prescrições", "ANVISA", etc. |
| Alta | Alternador tema escuro | `AdminLayout.tsx` header: botão Sun/Moon; estado em `localStorage` + classe `dark` no `<html>` ou no wrapper do admin; variáveis em `app/globals.css` para `.dark`. |
| Alta | Filtro de período em relatórios | `app/admin/relatorios/page.tsx` e `app/admin/metricas/page.tsx`: adicionar date range picker; passar `start`/`end` nas chamadas da API. |
| Alta | Botão CSV nas tabelas | Listagens em `app/admin/consultas/page.tsx`, `app/admin/receitas/page.tsx`, `app/admin/pacientes/page.tsx`, `app/admin/pagamentos/page.tsx`: botão "Exportar CSV" que chama API existente ou nova rota `GET ...?format=csv`. |
| Média | Submenus Relatórios | `AdminLayout.tsx`: expandir item Relatórios com subitens (Consultas, Prescrições, Financeiro, Prescritores, ANVISA) ou criar `app/admin/relatorios/` com abas na página. |
| Média | Página Disparos | Nova rota `app/admin/disparos/page.tsx`; cards de quota (email/WhatsApp); tabela de campanhas; opcional: API `GET /api/admin/campaigns` e config de quota. |
| Média | Kanban consultas | Em `app/admin/consultas/page.tsx`: toggle "Lista" / "Kanban"; colunas por status; cards com arraste (ex.: react-beautiful-dnd ou similar). |
| Média | Mapa por estado | Em `app/admin/metricas/page.tsx` ou nova página de relatórios: usar dados `regions` (UF/count); biblioteca de mapa (ex.: react-simple-maps Brasil) ou tabela ranking por UF. |
| Baixa | Modal Documentos na consulta | Em `app/admin/consultas/[id]/page.tsx` ou componente `ConsultationDetail`: botão "Documentos"; modal com lista de documentos do paciente e validação; alerta "Documentação inválida" se regras falharem. |
| Baixa | Fluxo de etapas no detalhe | Na mesma tela de detalhe da consulta: steps visuais (ex.: Agendada → Confirmada → Realizada); botões "Avançar etapa" / "Voltar etapa"; API PATCH para atualizar status. |

---

*Documento gerado a partir da análise das telas do sistema D9 Pro (reunião D9 Tech). Para aplicação técnica (componentes, rotas, APIs), usar este arquivo como referência e implementar por prioridade.*
