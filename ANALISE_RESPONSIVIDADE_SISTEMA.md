# Análise da Responsividade do Sistema CannabiLizi

**Data:** 29 de Janeiro de 2026  
**Projeto:** CannabiLizi

---

## 1. Resumo Executivo

O sistema utiliza **Tailwind CSS** com breakpoints padrão (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px) e adota **layout responsivo** em layouts principais, landing e formulários. Há **146 usos de classes responsivas** em 43 componentes. A base é sólida, mas existem **gaps** em tabelas mobile, touch targets e consistência de viewport/padding.

| Aspecto | Status | Nota |
|--------|--------|------|
| Layouts (Admin, Médico, Paciente) | ✅ Bom | Sidebar/drawer no mobile, top bar responsiva |
| Navegação pública (Navbar) | ✅ Bom | Menu mobile com overlay, touch targets 44px |
| Landing (Hero, Footer) | ✅ Bom | Grid adaptativo, padding progressivo |
| Tabelas (Admin/Médico) | ⚠️ Parcial | Apenas scroll horizontal, sem card view no mobile |
| Formulários | ✅ Adequado | Containers responsivos; inputs sem type otimizado |
| Touch targets (dashboards) | ⚠️ Inconsistente | Apenas Navbar com 44px; demais botões menores |
| Viewport / meta | ⚠️ Verificar | Next.js adiciona viewport por padrão; não há export explícito |

**Conclusão:** Responsividade **boa em estrutura e navegação**, com **melhorias recomendadas** em tabelas mobile, touch targets e padronização de viewport.

---

## 2. Configuração e Breakpoints

### 2.1 Tailwind

- **Arquivo:** `tailwind.config.ts`
- **Breakpoints:** Padrão do Tailwind (nenhum customizado).
- **Conteúdo:** `./pages/**`, `./components/**`, `./app/**` — cobertura adequada.

### 2.2 Viewport

- **Layout raiz:** `app/layout.tsx` não exporta `viewport`; o Next.js 13+ costuma injetar `<meta name="viewport" content="width=device-width, initial-scale=1">` por padrão.
- **Recomendação:** Exportar explicitamente em `app/layout.tsx` para garantir e permitir ajustes futuros (ex.: `user-scalable`, `maximum-scale` se necessário para acessibilidade).

---

## 3. Layouts Principais

### 3.1 AdminLayout

- **Desktop (lg+):** Sidebar fixa `lg:w-64`, conteúdo com `lg:pl-64`.
- **Mobile:** Sidebar vira drawer (Framer Motion), overlay `lg:hidden`, fecha com ESC e em resize para ≥1024px.
- **Top bar:** `px-4 sm:px-6 lg:px-8`; botão hamburger `lg:hidden` sem `min-h-[44px]`.
- **Pontos fortes:** Overlay, teclado (ESC), resize, grupos de menu no drawer.
- **Melhorias:** Botão do menu mobile com `min-h-[44px] min-w-[44px]` e `aria-label`.

### 3.2 DoctorLayout

- **Desktop (lg+):** Sidebar `lg:w-56`, conteúdo `lg:pl-56`.
- **Mobile:** Drawer idêntico ao admin (overlay + drawer lateral), animação suave.
- **Top bar:** `px-4 sm:px-6 lg:px-8`; nome do médico `hidden sm:flex`.
- **Melhorias:** Mesmo padrão de touch target no botão hamburger (44px) e `aria-label`.

### 3.3 PatientLayout

- **Desktop (md+):** Top bar com menu horizontal `hidden md:flex`.
- **Mobile:** Menu vira lista expansível abaixo do header (`md:hidden`), dropdown do usuário separado do menu (evita conflito).
- **Conteúdo:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`.
- **Gap:** Botão do menu mobile não tem `min-h-[44px] min-w-[44px]` nem `aria-label`/`aria-expanded`.

---

## 4. Navegação Pública (Navbar)

- **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Desktop:** Links visíveis `hidden md:flex`.
- **Mobile:** Botão com `min-h-[44px] min-w-[44px]`, `aria-label`, `aria-expanded`, `aria-controls`; menu em overlay full-screen; links do menu com `min-h-[44px]`.
- **Body:** `overflow: hidden` quando menu aberto.
- Referência positiva de acessibilidade e touch para o resto do sistema.

---

## 5. Páginas e Componentes

### 5.1 Landing (Hero, Footer, etc.)

- **HeroSection:** `grid grid-cols-1 lg:grid-cols-2`, títulos `text-4xl md:text-5xl lg:text-6xl`, CTAs `flex-col sm:flex-row`, container `px-4 sm:px-6 lg:px-8`.
- **Footer:** `grid grid-cols-1 md:grid-cols-4`, padding consistente.
- Boa adaptação para mobile e desktop.

### 5.2 Login

- Container: `min-h-screen flex ... py-12 px-4 sm:px-6 lg:px-8`, card `max-w-md w-full`.
- Layout adequado para telas pequenas.

### 5.3 Tabelas (Admin e Médico)

- **Padrão encontrado:**  
  `overflow-x-auto` + `table` (ex.: `ConsultationsTable`, admin consultas, pacientes, médicos, receitas, medicamentos, carteirinhas, blog, artigos-destaque; médico consultas, receitas, disponibilidade, pacientes, financeiro).
- **Comportamento:** Em mobile a tabela não quebra; o usuário rola horizontalmente.
- **Problema:** Em telas muito estreitas, tabelas com muitas colunas ficam difíceis de usar e menos legíveis.
- **Recomendação (já citada em outros docs):** Em breakpoint mobile (ex.: `md`), esconder a tabela (`hidden md:table`) e exibir lista de **cards** com as mesmas informações (uma linha da tabela = um card), ou usar componente que alterna tabela/cards por breakpoint.

### 5.4 Área do Paciente – Consultas

- Listagem por **cards** (`flex flex-col sm:flex-row`, `flex-wrap`), sem tabela.
- Filtros: `flex-col sm:flex-row`.
- Boa experiência em mobile; pode servir de modelo para outras listagens.

### 5.5 Formulários (AppointmentForm, PaymentForm, etc.)

- Uso de grid/stack responsivo e containers com padding responsivo.
- **Gap:** Inputs não utilizam de forma consistente `type="tel"`, `type="email"`, `inputMode="numeric"` onde aplicável, o que ajudaria teclado e UX em mobile.

---

## 6. Touch Targets e Acessibilidade

- **Navbar:** Botão e links do menu mobile com altura mínima 44px — **ok**.
- **AdminLayout / DoctorLayout / PatientLayout:** Botões de abrir/fechar menu são apenas `p-2` ou `rounded-lg` sem mínimo 44px — **abaixo do recomendado** (44x44px para áreas clicáveis em mobile).
- **Outros:** Alguns botões em admin (pacientes, médicos) já usam `min-h-[44px]`; vale estender esse padrão para todos os controles principais em mobile.

---

## 7. Padrões de Espaçamento e Container

- **Container comum:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (layout, páginas internas, Footer).
- **Conteúdo das páginas:** Uso consistente desse padrão nas áreas admin, médico e paciente.
- **Sidebars:** Admin 256px (w-64), Médico 224px (w-56); conteúdo com `lg:pl-64` / `lg:pl-56` — correto.

---

## 8. Pontos de Atenção por Dispositivo

### 8.1 Mobile (< 768px)

- Menu: drawer/listas funcionais; falta padronizar touch targets e aria nos layouts.
- Tabelas: apenas scroll horizontal; ideal evoluir para cards ou vista simplificada.
- Formulários: layout ok; melhorar tipos de input para mobile.

### 8.2 Tablet (768px–1024px)

- Admin/Médico: sem sidebar, só top bar + drawer; uso do espaço horizontal é limitado.
- Poderia haver opção de sidebar recolhível já em `md` (opcional).

### 8.3 Desktop (≥ 1024px)

- Sidebars fixas e conteúdo com margem adequada; sem problemas identificados.

---

## 9. Checklist de Melhorias Sugeridas

### Alta prioridade

1. **Viewport:** Exportar `viewport` em `app/layout.tsx` (ex.: `width=device-width, initial-scale=1`).
2. **Touch targets:** Botões de menu mobile em Admin, Médico e Paciente com `min-h-[44px] min-w-[44px]` e `aria-label` / `aria-expanded` onde fizer sentido.
3. **Tabelas em mobile:** Em listagens críticas (consultas admin/médico, pacientes, receitas), oferecer vista em cards no mobile (ex.: `hidden md:block` na tabela + `md:hidden` em lista de cards) ou componente único que troque por breakpoint.

### Média prioridade

4. **Inputs em formulários:** Usar `type="tel"` para telefone, `type="email"` para email, `inputMode="numeric"` onde for número puro, para melhorar teclado em mobile.
5. **Padronizar aria:** Garantir `aria-label` em botões de ícone (menu, notificações, fechar) em todos os layouts.
6. **Testes:** Validar em dispositivos reais (ou DevTools) em 320px, 375px, 768px, 1024px nas páginas mais usadas (login, dashboards, listagens, agendamento).

### Baixa prioridade

7. **Tablet:** Avaliar sidebar opcional em `md` para admin/médico.
8. **Orientação:** Verificar páginas de vídeo/telemedicina em landscape no mobile.

---

## 10. Referência Rápida – Arquivos Relevantes

| Área | Arquivo |
|------|--------|
| Layout raiz / viewport | `app/layout.tsx` |
| Navbar (referência touch/aria) | `components/layout/Navbar.tsx` |
| Admin layout | `components/layout/AdminLayout.tsx` |
| Médico layout | `components/layout/DoctorLayout.tsx` |
| Paciente layout | `components/layout/PatientLayout.tsx` |
| Tabela consultas admin | `components/admin/ConsultationsTable.tsx` |
| Listagem consultas paciente (cards) | `app/paciente/consultas/page.tsx` |
| Hero responsivo | `components/home/HeroSection.tsx` |
| Footer | `components/layout/Footer.tsx` |
| Configuração Tailwind | `tailwind.config.ts` |

---

*Documento gerado a partir da análise do código-fonte do repositório.*
