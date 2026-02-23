# Status da replicação D9 Pro — ClickCannabis

Resumo do que **já foi feito** e do que **ainda pode ser feito** com base no plano de replicação (ANALISE_D9_PRO_REPLICACAO.md).

---

## ✅ Já implementado

| Item | Onde / Como |
|------|-------------|
| **Badges no menu** | Sidebar admin: contadores ao lado de Consultas, Prescrições/Receitas, Carteirinhas, ANVISA (API `/api/admin/pending`). |
| **Tema escuro no admin** | Alternador sol/lua no header; persistência em `localStorage`; wrapper `#admin-theme-wrapper` com cores para dark. |
| **Filtro de período em Relatórios** | Checkbox "Usar intervalo personalizado" + campos De/Até; API reports aceita `startDate`/`endDate`. |
| **Filtro de período em Métricas** | Já existia período + intervalo personalizado (date range). |
| **Exportar CSV** | Consultas, Receitas (relatório prescrições), Pacientes. APIs com `?format=csv`. |
| **Submenus Relatórios** | Menu: Relatórios → "Relatórios" e "Métricas". |
| **Página Disparos** | `/admin/disparos`: cards E-mail/WhatsApp (status), tabela de campanhas (estado vazio), links para Templates e Config. |
| **Kanban de consultas** | Toggle Lista/Kanban em `/admin/consultas`; colunas por status com cards e totais em R$. |
| **Ranking por estado** | Em Métricas, seção "Pacientes por região (UF)" com #1, #2… e "X pacientes". |
| **Modal Documentos do pedido** | Botão "Documentos do pedido" no detalhe da consulta; modal com paciente, prescritor, receita, anexos; alerta "Documentação inválida!" quando realizado sem receita. |
| **Fluxo de etapas no detalhe** | Bloco "Fluxo da consulta" com Avançar/Voltar etapa, Cancelar, Não compareceu, Reabrir; API status com NO_SHOW e transições livres para admin/operador. |
| **API consultas com filtro por data** | `dateFrom` e `dateTo` em `GET /api/admin/consultations`; lista e Kanban respeitam o filtro. |
| **Acesso operador** | Páginas admin (consultas, detalhe, pacientes, pending) usam `canAccessAdmin` (inclui OPERATOR). |

---

## 🔲 Ainda pode ser feito (prioridade)

### 1. Relatórios com abas/categorias (média)

- **O quê:** Na página `/admin/relatorios`, ter abas ou sublinks: **Consultas**, **Prescrições**, **Financeiro**, **Prescritores**, **ANVISA**, **Exportações**.
- **Como:** Abas na mesma página (ou subrotas `/admin/relatorios/consultas`, etc.) reutilizando dados de métricas e APIs existentes; cada aba com filtro de período e botão CSV quando fizer sentido.

### 2. Ordenação por coluna nas tabelas (média)

- **O quê:** Cabeçalhos das tabelas principais (consultas, receitas, pacientes) clicáveis para ordenar por aquela coluna (ex.: nome, data, status).
- **Como:** Estado `sortBy`/`sortDir` no componente da lista; passar à API (se suportar) ou ordenar no front após o fetch.

### 3. Botão "Ajuda" no rodapé do admin (baixa)

- **O quê:** Como no D9 Pro, um botão fixo "Ajuda" (ou link para FAQ/documentação) no canto inferior da área do admin.
- **Como:** Em `AdminLayout.tsx`, adicionar um link/botão fixo no canto inferior (ex.: para `/admin/duvidas-frequentes` ou URL externa).

### 4. KPIs com "(Agora)" vs "(No período)" (baixa)

- **O quê:** No dashboard admin, em alguns cards, deixar explícito se o número é "agora" (tempo real) ou "no período" (ex.: últimos 30 dias).
- **Como:** Ajustar rótulos dos cards na `/admin/page.tsx` (ex.: "Consultas pendentes (agora)", "Receitas no mês (período)").

### 5. Exportar CSV na listagem de transações de pagamento (baixa)

- **O quê:** Se existir uma tela de **lista de pagamentos/transações** (não só "formas de pagamento"), adicionar botão Exportar CSV.
- **Observação:** A página atual `/admin/pagamentos` é de **métodos de pagamento**; exportação de transações dependeria de haver listagem e API de transações.

### 6. Chats Dashboard (baixa / contexto)

- **O quê:** Dashboard de atendimento com KPIs (chats abertos, em atendimento, aguardando, finalizados) e gráfico de status, estilo D9 Pro.
- **Como:** Só faz sentido se houver fila de conversas (ex.: integração WhatsApp com fila); hoje o projeto tem WhatsApp e templates, não necessariamente um "chat" unificado. Pode ficar para quando houver esse fluxo.

### 7. Produção/Separação, Rastrear, Multi-Pagamento (só se o negócio exigir)

- **Produção/Separação:** Tabela de pedidos com "Avançar Etapa", etiqueta, declaração — relevante se houver **operação física** (separação/embarque).
- **Rastrear pedidos:** Cards com histórico de rastreio — relevante se houver **entrega física** e integração com transportadora.
- **Multi-Pagamento:** Divisão do valor em várias partições (Pix, parcelas) — depende do gateway e da regra de negócio.

### 8. Acessibilidade e polish (contínuo)

- Revisar contraste no tema escuro.
- Garantir `aria-label` e navegação por teclado em modais e botões importantes.
- Testes em telas menores (responsividade).

---

## Resumo

- **Alta prioridade do plano:** praticamente tudo já implementado (badges, tema, filtros, CSV, submenus, Disparos, Kanban, ranking, documentos, fluxo de etapas).
- **Próximos passos opcionais:** relatórios por abas, ordenação nas tabelas, botão Ajuda, refinamento de labels dos KPIs e, se surgir necessidade, exportação de transações de pagamento e Chats Dashboard.
- **Contexto diferente:** Produção/Separação, Rastrear e Multi-Pagamento só entram no escopo se o negócio tiver operação física, logística e regras de pagamento que justifiquem.

Atualizado com base no estado atual do projeto e no ANALISE_D9_PRO_REPLICACAO.md.
