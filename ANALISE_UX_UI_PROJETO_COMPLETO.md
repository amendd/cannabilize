# Análise UX/UI — Projeto Completo (Cannabilize)

Análise de **design**, **UI**, **UX**, **usabilidade**, **facilidade de uso** e **clareza** em **todo o projeto**, incluindo Admin, Médico, Paciente e páginas públicas.

---

## 1. Visão Geral do Projeto

### 1.1 Estrutura de Áreas

| Área | Rota base | Layout | Público |
|------|-----------|--------|---------|
| **Público** | `/`, `/login`, `/agendamento`, `/blog`, `/galeria`, etc. | Navbar + Footer | Todos |
| **Admin** | `/admin/*` | AdminLayout (sidebar azul) | ADMIN, DOCTOR |
| **Médico** | `/medico/*` | DoctorLayout (sidebar verde) | DOCTOR, ADMIN |
| **Paciente** | `/paciente/*` | PatientLayout (top bar roxo/azul) | PATIENT |
| **Fluxos públicos** | `/consultas/[id]/confirmacao`, `/consultas/[id]/pagamento`, `/receita/[id]`, `/carteirinha/[id]` | Sem layout de área | Por link |

### 1.2 Pontos Fortes Globais

- **Next.js** com App Router, estrutura clara por área
- **NextAuth** para autenticação e redirecionamento por role
- **Framer Motion** para animações em várias páginas
- **react-hot-toast** para feedback de ações
- **Skip link** no layout raiz para acessibilidade
- **lang="pt-BR"** no HTML
- **Metadata** definida no layout (title, description, keywords)

### 1.3 Problemas Transversais

- **Status em inglês** em Admin e em vários componentes (SCHEDULED, COMPLETED, etc.)
- **Loading inconsistente**: muitas páginas usam "Carregando..." ou `<div>Carregando...</div>` em vez de skeleton/componente padrão
- **Breadcrumbs**: presentes em parte do Admin e em todo o Paciente; ausentes em Médico e em várias subpáginas do Admin
- **Empty states**: na maior parte só texto; poucos usam componente EmptyState ou ilustração
- **Fundo e espaçamento**: `bg-gray-50` vs `min-h-screen` vs gradientes por área, sem padronização global

---

## 2. Área Admin

### 2.1 Pontos Positivos

- Sidebar agrupada por domínio (Operacional, Regulatório, Financeiro, Conteúdo, Comunicação, Sistema)
- Dashboard com métricas, ações pendentes, atalhos por grupo, gráficos e tabela de consultas recentes
- Uso de **Breadcrumbs** em: Consultas, Configurações, Pacientes, Médicos, Receitas, Usuários, Email, Segurança, Telemedicina, WhatsApp (templates), Medicamentos, Pacientes [editar], Usuários [novo/editar], Concluir Cadastro
- **LoadingPage** e **SkeletonDashboard/SkeletonTable** em: dashboard, pacientes, medicos, medicos/disponibilidade, usuarios, configuracoes, email, telemedicina, seguranca, whatsapp/templates
- Animações (motion) no dashboard
- Mobile: sidebar colapsável com overlay e ESC para fechar

### 2.2 Problemas e Melhorias

| Página/Componente | Problema | Sugestão |
|-------------------|----------|----------|
| **ConsultationsTable** | Status exibido em inglês (`consultation.status`) | Usar `getConsultationStatusLabel()` de `lib/status-labels.ts` |
| **Admin dashboard** (consultas recentes) | Status em inglês | Traduzir com `getConsultationStatusLabel()` |
| **admin/consultas/[id]** | Loading: "Carregando..." centralizado; sem Breadcrumbs; botão "← Voltar" | Skeleton + Breadcrumbs (Admin > Consultas > Detalhe) |
| **admin/receitas, blog, pagamentos, carteirinhas, anvisa, galeria, artigos-destaque, medicos/novo, pagamentos/novo, pagamentos/[id]/editar, blog/[id]/editar** | Loading: "Carregando..." ou texto simples | Padronizar: LoadingPage ou Skeleton conforme contexto |
| **admin/pacientes, medicos, usuarios** | Breadcrumbs presentes; outras listagens (ex.: receitas, pagamentos, blog) | Revisar quais têm Breadcrumbs e adicionar onde faltar |
| **ConsultationDetail** (componente) | Se exibir status, usar português | Usar `getConsultationStatusLabel()` |
| **Notificações (sino)** | Botão sem funcionalidade | Conectar a notificações reais ou remover/ocultar |
| **Empty states** | "Nenhuma consulta recente", etc. | Componente EmptyState reutilizável com ícone e CTA quando fizer sentido |

### 2.3 Consistência Visual

- **Cores**: azul (blue-900/800) na sidebar; primary em links e botões
- **Tipografia**: `font-display` em alguns títulos (dashboard), não padronizado em todas as páginas admin
- **Fundo**: `bg-gray-50` na maioria das páginas; alinhado

---

## 3. Área Médico

### 3.1 Pontos Positivos

- Sidebar verde (diferenciação clara do admin)
- Dashboard focado em "Consultas de Hoje", métricas, visão financeira, receitas recentes, próximas consultas
- **LoadingPage** no dashboard e em consultas/[id], receitas, pacientes, financeiro
- Atualização automática (intervalo) e indicador "Atualizando…"
- Convite de remarcação (sugerir adiantamento) integrado
- Links para detalhe de consulta em `/medico/consultas/[id]` (já corrigido anteriormente)

### 3.2 Problemas e Melhorias

| Página/Componente | Problema | Sugestão |
|-------------------|----------|----------|
| **Breadcrumbs** | Nenhuma página médico usa Breadcrumbs | Adicionar em: Dashboard (opcional), Consultas, Consultas/[id], Receitas, Pacientes, Financeiro |
| **Loading** | LoadingPage fullscreen; em listas não há skeleton específico | Manter LoadingPage onde fizer sentido; em listas considerar skeleton da tabela/cards |
| **Status** | Se houver exibição de status em inglês | Usar `getConsultationStatusLabel()` |
| **Empty states** | Texto simples ("Nenhuma consulta agendada para hoje", etc.) | EmptyState com ícone e mensagem amigável |
| **Navegação** | Relógio na top bar; sino sem função | Manter relógio; notificações reais ou remover sino |

### 3.3 Consistência Visual

- **Cores**: verde (green-700/600) na sidebar; botões e destaques em verde
- **Fundo**: `bg-green-50` no layout; páginas internas com fundo branco/cards

---

## 4. Área Paciente (pós-melhorias)

### 4.1 Já Implementado

- Status em português (`lib/status-labels.ts`) em dashboard, consultas, consultas/[id], documentos, pagamentos, pagamentos/[id]
- Skeleton (SkeletonPatientDashboard, SkeletonPatientList) em todas as páginas principais e detalhes
- Breadcrumbs em todas as subpáginas (baseHref="/paciente")
- EmptyState reutilizável em listas e blocos vazios
- Filtros e busca em Consultas e Receitas
- Badges nos cards do dashboard; "Acessar" em Documentos e Carteirinha
- Toast para download de receita; botão "Visualizar" (abre PDF em nova aba)
- Histórico de consultas com links para detalhe; convites de remarcação em destaque
- Mensagens de carteirinha (PENDING/REJECTED) mais claras

### 4.2 Pendências Menores

- Perfil: apenas edição de foto; edição completa (telefone, endereço) depende de API/regras de negócio
- Preview de arquivos em modal (hoje é link "Visualizar" em nova aba) — melhoria futura

---

## 5. Páginas Públicas

### 5.1 Home (`/`)

- **Pontos positivos**: Hero, seções (PathologySelector, Statistics, ProcessSteps, Testimonials, Events, Blog, FAQ, CTA); estrutura clara
- **Sugestões**: Garantir contraste de textos e CTAs; revisar responsividade de imagens e textos longos

### 5.2 Login (`/login`)

- **Pontos positivos**: Formulário simples; toast de erro/sucesso; redirecionamento por role; labels acessíveis (sr-only); botão desabilitado durante loading
- **Problemas**:
  - Título "Área Administrativa" e texto "painel administrativo" — na prática é login único para Admin, Médico e Paciente. **Sugestão**: "Entrar" ou "Acessar sua conta" e texto neutro ("Faça login para acessar sua área")
  - Fallback em caso de erro ao obter sessão redireciona para `/admin`; pode confundir paciente/médico. **Sugestão**: redirecionar para `/` ou exibir mensagem e link para tentar novamente

### 5.3 Agendamento (`/agendamento`)

- **Pontos positivos**: Título e descrição claros; uso de `AppointmentForm`; suporte a `pathologies` via query
- **Sugestões**: Breadcrumb "Início > Agendar Consulta"; estado de loading ao submeter (se não houver); mensagem de sucesso e próximo passo (ex.: "Confira seu e-mail para confirmar")

### 5.4 Fluxo Consulta (confirmacao e pagamento)

- **`/consultas/[id]/confirmacao`**: Upload de arquivos, claim de conta, login. Loading: "Carregando..." centralizado. **Sugestão**: Skeleton ou LoadingPage; Breadcrumb "Agendamento > Confirmação"
- **`/consultas/[id]/pagamento`**: PaymentForm; Loading: "Carregando...". **Sugestão**: LoadingPage ou skeleton do formulário; mensagem clara se consulta não for encontrada

### 5.5 Receita Pública (`/receita/[id]`)

- Loading: "Carregando receita...". **Sugestão**: LoadingPage ou skeleton; página de erro amigável se id inválido ou não autorizado

### 5.6 Carteirinha Pública (`/carteirinha/[id]`)

- Loading com spinner e texto; estado de erro com link "Voltar para o início". **Bom**: já tem tratamento de erro e CTA

### 5.7 Outras Páginas Públicas

- **Blog, Galeria, Sobre Nós, Seja Médico, Cadastro Médico, Concluir Cadastro, Privacidade, Termos**: Revisar presença de Breadcrumbs onde fizer sentido (ex.: Concluir Cadastro já tem); estados de loading/erro em formulários

---

## 6. Layout e Navegação Global

### 6.1 Layout Raiz

- **ConditionalNavbar** e **ConditionalFooter**; **Toaster**; **Providers** (SessionProvider, etc.)
- **Skip link** "Pular para conteúdo principal" — ótimo para acessibilidade
- **main** com `id="main-content"` e `min-h-screen`

### 6.2 Navbar (público)

- Logo, links (Início, Sobre Nós, Blog, Galeria, Seja Médico), CTA "Falar com Especialista" ou "Área do Paciente" se logado
- Menu mobile com estado `isOpen` e overlay
- **Sugestão**: Garantir que o link ativo (ex.: Blog quando em /blog) tenha estilo diferenciado

### 6.3 Footer

- Verificar links, redes sociais e informações de contato; consistência com Navbar

### 6.4 Condição de Exibição Navbar/Footer

- **ConditionalNavbar/ConditionalFooter**: normalmente ocultos em /login ou em áreas autenticadas (admin, medico, paciente). Revisar regras para não esconder em páginas públicas que precisem (ex.: confirmacao, pagamento).

---

## 7. Componentes Compartilhados

### 7.1 UI

- **Button, Input, Select, Textarea, Card, Modal, Badge, Avatar**: uso consistente melhora a interface
- **Breadcrumbs**: suporta `baseHref`; usado em admin (base `/`) e paciente (base `/paciente`). **Faltando**: médico
- **Loading (LoadingPage, LoadingTable)**: usado em várias áreas; em muitas páginas ainda se usa `<div>Carregando...</div>`
- **Skeleton**: SkeletonDashboard, SkeletonTable, SkeletonCard, SkeletonList; SkeletonPatientDashboard, SkeletonPatientList. **Faltando**: uso em várias páginas admin e em fluxos públicos
- **EmptyState** (patient): usado apenas em paciente; pode ser generalizado (ex.: `components/ui/EmptyState`) para admin e médico

### 7.2 Status e Tradução

- **lib/status-labels.ts**: `getConsultationStatusLabel`, `getPaymentStatusLabel`. **Uso**: paciente e pagamentos; **não usado** em admin (ConsultationsTable, dashboard admin, ConsultationDetail) nem em componentes admin que exibem status

### 7.3 Formulários e Feedback

- **toast** (react-hot-toast): usado em login, paciente, médico. Garantir uso em ações críticas (salvar, excluir, erro de API) em admin e médico
- **Validação e mensagens de erro**: em formulários, preferir mensagens por campo e toast para erros gerais

---

## 8. Consistência Cross-Projeto

### 8.1 Cores e Temas

- **Admin**: azul (sidebar e destaques)
- **Médico**: verde
- **Paciente**: roxo/azul (gradientes)
- **Público**: primary (verde) no tailwind; navbar branca
- **Sugestão**: Documentar em um guia de estilo (primary, secondary, áreas) e evitar mistura de paletas dentro da mesma área

### 8.2 Loading

- **Padrão recomendado**: 
  - Tela cheia (troca de contexto): **LoadingPage**
  - Lista/tabela: **SkeletonTable** ou SkeletonList
  - Dashboard: **SkeletonDashboard** ou SkeletonPatientDashboard
- **Evitar**: `<div className="...">Carregando...</div>` ou "Carregando..." solto

### 8.3 Empty States

- **Padrão recomendado**: Componente com ícone, título, descrição e CTA opcional (como EmptyState do paciente)
- **Uso**: listas vazias, filtros sem resultado, primeira vez do usuário

### 8.4 Breadcrumbs

- **Admin**: Breadcrumbs em várias páginas; base `/` (Home). Faltam em: consultas/[id], e possivelmente em outras edições/detalhes
- **Médico**: nenhum
- **Paciente**: todos com baseHref="/paciente"
- **Público**: Concluir Cadastro tem; Agendamento, Confirmacao, Pagamento podem ter

### 8.5 Status em Português

- **Já traduzido**: área paciente (dashboard, consultas, documentos, pagamentos), pagamentos/[id], consultas/[id] (paciente)
- **Ainda em inglês**: admin (ConsultationsTable, dashboard admin, ConsultationDetail e páginas que exibem status), componentes admin que mostram status de consulta/pagamento

### 8.6 Fundo e Containers

- **Admin**: `bg-gray-50` + `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- **Médico**: layout com `bg-green-50`; conteúdo com `max-w-7xl ...`
- **Paciente**: layout com gradiente; páginas com `max-w-7xl` ou `max-w-5xl`/`max-w-3xl` conforme página
- **Público**: varia (gray-50, etc.). Padronizar containers (max-width e padding) onde fizer sentido

---

## 9. Acessibilidade

### 9.1 Pontos Positivos

- Skip link no layout
- `lang="pt-BR"`
- Labels em inputs (sr-only no login)
- `aria-label` em botões de menu (Navbar, Admin sidebar mobile)
- Uso de semântica (nav, main, header)

### 9.2 Melhorias Sugeridas

- **Focus visible**: garantir `focus:ring-2` ou equivalente em links e botões em todo o projeto
- **Contraste**: revisar textos em cinza e botões secundários (WCAG AA)
- **Tabelas**: `scope="col"` em `<th>`, `caption` ou `aria-label` onde ajudar
- **Status e badges**: além de cor, usar texto traduzido (já em parte); evitar só ícone sem texto
- **Mensagens de erro**: associar a `aria-describedby` ou `aria-invalid` nos campos

---

## 10. Performance e Carregamento

### 10.1 Boas Práticas

- Next.js Image onde há imagens
- Uso de loading states evita “flash” de conteúdo vazio

### 10.2 Sugestões

- **Skeleton em vez de spinner** onde possível (melhor percepção de velocidade)
- **Lazy loading** de componentes pesados (modais, gráficos) se necessário
- **Cache de listas** (ex.: React Query/SWR) para reduzir requisições repetidas

---

## 11. Priorização de Melhorias (Projeto Inteiro)

### 11.1 Alta Prioridade

1. **Traduzir status em todo o projeto**: usar `getConsultationStatusLabel` e `getPaymentStatusLabel` em Admin (ConsultationsTable, dashboard, ConsultationDetail e qualquer outro componente que exiba status).
2. **Padronizar loading no Admin**: substituir "Carregando..." por LoadingPage ou Skeleton (consultas/[id], receitas, blog, pagamentos, carteirinhas, anvisa, galeria, artigos-destaque, medicos/novo, pagamentos/novo, pagamentos/[id]/editar, blog/[id]/editar, etc.).
3. **Breadcrumbs no Médico**: adicionar em Consultas, Consultas/[id], Receitas, Pacientes, Financeiro.
4. **Breadcrumbs em detalhes/edição do Admin**: consultas/[id], e outras páginas de detalhe/edição que ainda usem só "← Voltar".
5. **Login**: ajustar título e texto para "Entrar" / "Acessar sua conta"; revisar fallback de redirecionamento quando falha ao obter sessão.

### 11.2 Média Prioridade

6. **Empty states no Admin e Médico**: usar componente EmptyState (ou variante) em tabelas e listas vazias.
7. **Loading em fluxos públicos**: confirmacao, pagamento, receita/[id] — usar LoadingPage ou skeleton.
8. **ConsultationsTable (admin)**: além de status em português, considerar skeleton da tabela durante loading.
9. **Notificações (sino)**: implementar ou remover em Admin e Médico.
10. **Documentar guia de estilo**: cores por área, quando usar Breadcrumbs, loading e empty state.

### 11.3 Baixa Prioridade

11. **Tipografia**: padronizar uso de `font-display` (ou classe de título) em todas as páginas admin.
12. **Navbar**: destacar link ativo (ex.: Blog quando em /blog).
13. **Revisão de contraste e focus** em todo o projeto.
14. **Componente EmptyState global** em `components/ui` para reuso em admin e médico.

---

## 12. Checklist por Área

| Item | Admin | Médico | Paciente | Público |
|------|--------|--------|----------|---------|
| Status em português | ❌ Parcial | ⚠️ Verificar | ✅ | N/A |
| Loading padronizado (LoadingPage/Skeleton) | ⚠️ Parcial | ✅ | ✅ | ❌ |
| Breadcrumbs | ⚠️ Parcial | ❌ | ✅ | ⚠️ Pontual |
| Empty states com componente | ❌ | ❌ | ✅ | N/A |
| Toast em ações críticas | ⚠️ | ⚠️ | ✅ | ✅ (login) |
| Fundo/container consistente | ✅ | ✅ | ✅ | ⚠️ |
| Acessibilidade (skip link, focus, labels) | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

---

## 13. Resumo Executivo

- **Paciente**: após as melhorias recentes, está alinhado a skeleton, breadcrumbs, empty state, status em português, filtros e toasts.
- **Admin**: estrutura e sidebar boas; falta padronizar status em português, loading em várias páginas, breadcrumbs em detalhes/edição e empty states.
- **Médico**: dashboard e fluxos bons; falta breadcrumbs em todas as subpáginas e alinhar empty/loading onde ainda for texto simples.
- **Público**: login e home ok; ajustar texto do login (neutro) e loading/feedback nos fluxos de confirmacao, pagamento e receita pública.

**Próximos passos sugeridos**: (1) Estender `lib/status-labels.ts` ao Admin e componentes admin; (2) Substituir "Carregando..." por LoadingPage/Skeleton nas páginas listadas; (3) Adicionar Breadcrumbs no médico e nos detalhes do admin; (4) Ajustar tela de login e fallback de sessão.

---

*Documento gerado com base na análise de `app/`, `components/` e padrões de UX/UI do projeto.*
