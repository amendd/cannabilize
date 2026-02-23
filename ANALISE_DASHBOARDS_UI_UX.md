# Análise Detalhada dos Dashboards — Admin, Paciente e Médico

Análise de **organização**, **layout**, **UI** e **UX** dos três painéis do sistema, com sugestões concretas de melhoria.

---

## 1. Dashboard Admin

### 1.1 Pontos positivos
- **Sidebar agrupada** por domínio (Operacional, Regulatório, Financeiro, Conteúdo, Comunicação, Sistema) — boa hierarquia.
- **Dashboard principal** com métricas (Pacientes, Consultas, Receitas, Receita), ações pendentes e atalhos por grupo.
- **Acesso Rápido** em cards por categoria facilita encontrar telas.
- **Breadcrumbs** em páginas internas (ex.: Consultas).
- **Responsivo**: sidebar colapsável no mobile com overlay e ESC para fechar.
- **Animações** (Framer Motion) dão feedback visual leve.

### 1.2 Problemas e melhorias

| Área | Problema | Sugestão |
|------|----------|----------|
| **Organização** | Muitos atalhos na home; médico (role DOCTOR) vê quase tudo, mas sem foco no dia a dia. | Para DOCTOR: mostrar só “Hoje”, “Consultas”, “Receitas”, “Pacientes” em destaque; manter resto no menu. Opcional: abas “Visão geral” vs “Atalhos”. |
| **Layout** | Ordem na home: Acesso Rápido → Métricas → Pendentes → Financeiro → Gráficos → Tabela. Muito scroll antes das métricas. | Inverter: **Métricas** e **Ações pendentes** no topo; depois Acesso Rápido (ou só no menu); por fim gráficos e tabela. |
| **UI** | Status da consulta em inglês (SCHEDULED, COMPLETED, CANCELLED). | Traduzir para: Agendada, Concluída, Cancelada (e padronizar em todo o sistema). |
| **UI** | Cards de atalho com muitas cores (blue-100, purple-100, etc.); visual pesado. | Reduzir paleta: 2–3 cores por seção ou ícones em cinza + uma cor de destaque por grupo. |
| **UX** | Botão de notificações (sino) sem funcionalidade. | Conectar a notificações reais ou remover; se manter, usar badge só quando houver itens. |
| **Consistência** | `font-display` usada em alguns títulos e não em outros. | Definir em `globals.css`: títulos de página = `font-display`; usar em todas as páginas admin. |

### 1.3 Resumo Admin
- **Organização**: boa estrutura de menu; home pode priorizar “o que importa agora” (métricas e pendências).
- **Layout**: subir métricas e pendentes; considerar duas colunas em desktop (métricas à esquerda, pendentes à direita).
- **UI**: traduzir status, suavizar cores dos atalhos, padronizar tipografia.
- **UX**: notificações reais ou remoção do sino; breadcrumbs em todas as páginas internas.

---

## 2. Dashboard Paciente

### 2.1 Pontos positivos
- **Identidade visual** clara: gradiente roxo/azul, “Área do Paciente”.
- **Cards de entrada** (Consultas, Receitas, Pagamentos, Documentos, Carteirinha) com ícones e links diretos.
- **Próxima consulta** em card em destaque (gradiente) com data, horário, médico e “Entrar na Reunião”.
- **Retorno** com data de próximo retorno em outro card.
- **Convites de remarcação** com componente dedicado.
- **Histórico** de consultas resumido e link “Ver todas”.
- **Layout**: top bar horizontal (não sidebar), adequado para menos itens de menu.

### 2.2 Problemas e melhorias

| Área | Problema | Sugestão |
|------|----------|----------|
| **Organização** | **Carteirinha** existe em `/paciente/carteirinha` e no card da home, mas **não está no menu** do PatientLayout. | Incluir “Carteirinha” no menu (ex.: entre Documentos e Meu Perfil) para descoberta e acesso consistente. |
| **Layout** | No mobile, **hamburger e avatar** usam o **mesmo estado** (`menuOpen`): abrem o mesmo painel. Dropdown do usuário (Sair) fica misturado ao menu de navegação. | Separar estados: `mobileNavOpen` e `userDropdownOpen`. No mobile: hamburger = só navegação; avatar = dropdown com nome, email e Sair. |
| **UX** | Texto de debug (“Nenhum convite pendente… Verifique o console”) visível em desenvolvimento. | Manter só em `NODE_ENV === 'development'` e fora da área principal (ex.: rodapé colapsável ou só no console). |
| **UI** | Cards “Ver” (Documentos, Carteirinha) mostram valor “Ver” em vez de número ou indicador (ex.: “5 docs” ou ícone). | Usar contagem quando houver (ex.: documentos) ou label “Acessar”/“Abrir” em vez de “Ver” como número. |
| **Consistência** | Página “Minhas Consultas” usa “← Voltar” e fundo `gray-50`; o restante do paciente usa fundo gradiente. | Alinhar fundo das subpáginas ao do layout (gradiente suave) e usar breadcrumb “Início > Minhas Consultas” em vez de só “Voltar”. |
| **Loading** | Estado de carregamento é apenas texto “Carregando…” centralizado. | Usar skeleton ou spinner alinhado ao layout (header + cards vazios) para sensação de carregamento mais rápida. |

### 2.3 Resumo Paciente
- **Organização**: adicionar Carteirinha ao menu e manter mesma estrutura de “entrada” por cards.
- **Layout**: manter top bar; corrigir comportamento do menu mobile vs dropdown do usuário.
- **UI**: padronizar fundo e breadcrumbs nas subpáginas; melhorar indicadores dos cards “Ver”.
- **UX**: loading com skeleton; esconder mensagens de debug da interface.

---

## 3. Dashboard Médico

### 3.1 Pontos positivos
- **Foco no dia**: “Consultas de Hoje” em destaque, com horário, paciente, anamnese resumida e botão “Entrar na Reunião” / “Iniciar Reunião”.
- **Métricas** alinhadas ao uso (Consultas Hoje/Semana, Receitas, Pacientes Atendidos).
- **Visão financeira** (DoctorFinancialOverview) separada e com aviso de privacidade.
- **Convite de remarcação** (sugerir adiantamento) integrado na lista.
- **Atualização automática** (intervalo 2 min) e indicador “Atualizando…”.
- **Sidebar** verde (diferenciada do admin azul), compacta.

### 3.2 Problemas e melhorias

| Área | Problema | Sugestão |
|------|----------|----------|
| **Navegação / Bug** | Na tabela “Próximas Consultas”, o link “Ver Detalhes” aponta para **`/admin/consultas/${id}`** em vez de **`/medico/consultas/${id}`**. O médico é levado ao painel admin. | Corrigir para `href={/medico/consultas/${consultation.id}}` em `app/medico/page.tsx` (e verificar `app/medico/receitas/page.tsx`). |
| **Consistência** | Em “Consultas de Hoje” o link é “Ver Detalhes” → `/medico/consultas/${id}` (correto). Em “Próximas Consultas” é “Ver Detalhes” → admin (incorreto). | Unificar: todas as ações do médico devem apontar para rotas `/medico/...`. |
| **Layout** | Muito conteúdo em uma coluna: métricas → financeiro → hoje → receitas → próximas. Scroll longo. | Em desktop: coluna esquerda = “Hoje” + “Próximas”; coluna direita = métricas + financeiro + receitas. Ou abas “Hoje” / “Próximos dias”. |
| **UI** | Anamnese dentro do card de consulta pode ficar longa (tratamentos, medicamentos, alergias, info adicional). | Manter “line-clamp” e botão “Ver mais” que expande no próprio card ou leva ao detalhe da consulta. |
| **UX** | “Disponível em X min” para iniciar reunião é claro, mas ocupa espaço. | Manter texto ou substituir por tooltip no botão desabilitado “Iniciar Reunião (em X min)”. |
| **Acessibilidade** | Tabela “Próximas Consultas” sem `scope` em `<th>` e sem `caption`. | Adicionar `scope="col"` nos `<th>` e `<caption class="sr-only">Próximas consultas</caption>` para leitores de tela. |

### 3.3 Resumo Médico
- **Organização**: já boa (hoje em foco, depois receitas e próximas). Garantir que todos os links sejam `/medico/...`.
- **Layout**: considerar duas colunas ou abas para reduzir scroll e agrupar “consultas” vs “resumo”.
- **UI**: controlar tamanho da anamnese nos cards (expandir ou link para detalhe).
- **UX**: corrigir links para admin; melhorar acessibilidade da tabela.

---

## 4. Cross-dashboard (geral)

### 4.1 Consistência entre os três
- **Admin**: azul (blue-900/800), sidebar fixa 64 (256px).
- **Paciente**: roxo/azul (purple/blue), top bar, fundo gradiente.
- **Médico**: verde (green-700/600), sidebar 56 (224px).

Sugestão: manter diferença de cor por persona (admin = azul, paciente = roxo, médico = verde), mas padronizar:
- Altura do header (ex.: 64px).
- Espaçamento do conteúdo (ex.: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
- Estilo de botões primários (um componente `Button` com variantes).
- Tratamento de loading (skeleton ou spinner) e estados vazios (“Nenhum item” + ilustração ou ícone).

### 4.2 Navegação e rotas
- Admin: sidebar com grupos; médico: sidebar simples; paciente: top bar.
- Garantir que **médico nunca seja redirecionado para rotas `/admin/...`** nas ações do próprio dashboard (consultas, receitas).
- Breadcrumbs: admin já usa em algumas telas; usar também em paciente e médico em subpáginas (ex.: Consultas > Detalhe).

### 4.3 Responsividade
- Admin e médico: sidebar vira drawer no mobile; overlay e ESC estão ok.
- Paciente: menu horizontal vira lista no mobile; ajustar estado do dropdown do usuário (ver acima).
- Tabelas: em mobile, considerar cards empilhados em vez de tabela horizontal (admin consultas, médico próximas).

---

## 5. Priorização sugerida

### Alta prioridade (bugs e confusão)
1. **Médico**: trocar links “Ver Detalhes” de `/admin/consultas/` para `/medico/consultas/` (e receitas).
2. **Paciente**: incluir “Carteirinha” no menu do layout.
3. **Paciente**: separar estado do menu mobile do estado do dropdown do usuário.

### Média prioridade (UX e clareza)
4. **Admin**: colocar Métricas e Ações pendentes no topo da home.
5. **Sistema**: traduzir status de consulta (SCHEDULED → Agendada, etc.) em todos os dashboards.
6. **Paciente**: substituir “Carregando…” por skeleton no dashboard e subpáginas.
7. **Paciente**: breadcrumbs nas subpáginas (Consultas, Receitas, etc.).

### Baixa prioridade (refino)
8. **Admin**: notificações reais no sino ou remoção.
9. **Médico**: layout em duas colunas ou abas na home.
10. **Geral**: padronizar `font-display`, tokens de cor e componentes de empty state.

---

## 6. Checklist rápido por dashboard

| Item | Admin | Paciente | Médico |
|------|--------|----------|--------|
| Menu reflete todas as rotas acessíveis | ✅ | ⚠️ Falta Carteirinha | ✅ |
| Links internos apontam para o próprio painel | ✅ | ✅ | ❌ Links para /admin |
| Breadcrumbs em subpáginas | ⚠️ Parcial | ❌ | ❌ |
| Status em português | ❌ | ✅ | ⚠️ Parcial |
| Loading com skeleton/spinner | ✅ | ❌ | ✅ |
| Mobile: menu vs dropdown distintos | N/A (sidebar) | ❌ Mesmo estado | N/A (sidebar) |
| Empty states com mensagem clara | ⚠️ | ⚠️ | ✅ |

---

*Documento gerado com base no código em `app/admin`, `app/paciente`, `app/medico` e `components/layout`.*
