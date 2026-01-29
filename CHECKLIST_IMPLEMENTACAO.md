# ✅ Checklist de Implementação das Melhorias

Use este checklist para acompanhar o progresso das melhorias sugeridas.

---

## 🔴 FASE 1 - CRÍTICO (2 semanas)

### 1. Feedback Visual e Loading States

- [ ] Criar componente `SkeletonCard` reutilizável
- [ ] Criar componente `SkeletonTable` reutilizável
- [ ] Criar componente `SkeletonDashboard` reutilizável
- [ ] Criar skeleton específico para consultas
- [ ] Substituir "Carregando..." genérico por skeletons
- [ ] Adicionar animações de transição (Framer Motion)
- [ ] Melhorar mensagens de erro (específicas e acionáveis)
- [ ] Adicionar confirmações visuais para ações importantes
- [ ] Implementar progress indicators em formulários multi-step

**Arquivos a modificar:**
- `components/ui/Skeleton.tsx` (melhorar)
- `components/ui/Loading.tsx` (melhorar)
- `app/admin/page.tsx`
- `app/paciente/page.tsx`
- Todos os componentes que mostram loading

---

### 2. Validação em Formulários

- [ ] Configurar `mode: 'onChange'` em todos os useForm
- [ ] Adicionar validação visual em tempo real
- [ ] Melhorar mensagens de erro (específicas)
- [ ] Adicionar tooltips explicativos em campos complexos
- [ ] Implementar progress bar em AppointmentForm
- [ ] Adicionar aria-labels e aria-describedby
- [ ] Testar validação em todos os formulários

**Arquivos a modificar:**
- `components/consultation/AppointmentForm.tsx`
- `app/login/page.tsx`
- `app/admin/medicos/novo/page.tsx`
- `app/admin/blog/novo/page.tsx`
- Todos os formulários

---

### 3. Acessibilidade (WCAG)

- [ ] Adicionar skip link no layout
- [ ] Adicionar aria-labels em todos os botões
- [ ] Adicionar aria-labels em todos os links
- [ ] Adicionar aria-describedby em inputs com erro
- [ ] Verificar e melhorar contraste de cores (WCAG AA)
- [ ] Implementar navegação completa por teclado
- [ ] Adicionar focus indicators visíveis
- [ ] Usar headings semânticos (h1, h2, h3...)
- [ ] Adicionar alt text descritivo em todas as imagens
- [ ] Testar com screen reader (NVDA ou JAWS)

**Arquivos a modificar:**
- `app/layout.tsx` (skip link)
- `components/layout/Navbar.tsx`
- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- Todos os componentes

**Ferramentas:**
- [ ] Instalar axe DevTools
- [ ] Testar com Lighthouse (Acessibilidade)
- [ ] Verificar contraste com WebAIM Contrast Checker

---

### 4. Otimização de Imagens

- [ ] Criar componente `OptimizedImage` reutilizável
- [ ] Substituir todas as `<img>` por `<Image>` do next/image
- [ ] Adicionar imagens reais (substituir placeholders)
- [ ] Implementar lazy loading (priority={false} para below fold)
- [ ] Adicionar blur placeholder (blurDataURL)
- [ ] Implementar fallbacks elegantes para imagens quebradas
- [ ] Converter imagens para WebP/AVIF
- [ ] Otimizar tamanho das imagens

**Arquivos a modificar:**
- Criar `components/ui/OptimizedImage.tsx`
- `components/home/HeroSection.tsx`
- `components/gallery/GalleryGrid.tsx`
- `app/blog/page.tsx`
- Todos os lugares com imagens

---

### 5. Segurança Básica

- [ ] Implementar rate limiting nas APIs
- [ ] Adicionar CSRF protection
- [ ] Validar e sanitizar todos os inputs (melhorar uso do Zod)
- [ ] Implementar session timeout
- [ ] Adicionar helmet.js para headers de segurança
- [ ] Adicionar logs de segurança
- [ ] Revisar permissões de rotas
- [ ] Criptografar dados sensíveis (verificar payment methods)

**Arquivos a modificar:**
- Criar middleware para rate limiting
- `app/api/**/*.ts` (adicionar validação)
- `lib/auth.ts` (session timeout)
- `next.config.js` (headers de segurança)

**Bibliotecas:**
- [ ] Instalar `express-rate-limit` ou similar
- [ ] Instalar `helmet` ou `next-safe`

---

## 🟡 FASE 2 - IMPORTANTE (4 semanas)

### 6. Design System

- [ ] Expandir paleta de cores no `tailwind.config.ts`
- [ ] Criar sistema de cores semânticas (success, warning, error, info)
- [ ] Adicionar fontes personalizadas (Poppins, Montserrat)
- [ ] Criar sistema de tipografia escalável
- [ ] Padronizar espaçamentos
- [ ] Criar componentes reutilizáveis documentados
- [ ] Criar guia de estilo (documentação)
- [ ] Implementar modo escuro (opcional)

**Arquivos a modificar:**
- `tailwind.config.ts`
- `app/layout.tsx` (fontes)
- Criar `docs/STYLE_GUIDE.md`

---

### 7. Dashboard Admin

- [ ] Instalar Recharts ou Chart.js
- [ ] Criar componente `ConsultationsChart`
- [ ] Criar componente `RevenueChart`
- [ ] Criar componente `PathologyDistributionChart`
- [ ] Adicionar filtros avançados com busca
- [ ] Implementar exportação de relatórios (PDF, Excel)
- [ ] Melhorar cards de estatísticas (animações, tooltips)
- [ ] Adicionar comparação período anterior
- [ ] Criar dashboard customizável (opcional)

**Arquivos a modificar:**
- `app/admin/page.tsx`
- Criar `components/admin/ConsultationsChart.tsx`
- Criar `components/admin/RevenueChart.tsx`
- `components/admin/DashboardStats.tsx` (melhorar)

**Bibliotecas:**
- [ ] Instalar `recharts` ou `chart.js`
- [ ] Instalar `jspdf` (já tem) para PDF
- [ ] Instalar `xlsx` para Excel

---

### 8. Integrações Reais

#### 8.1 Mercado Pago
- [ ] Criar conta Mercado Pago
- [ ] Obter credenciais (public key, access token)
- [ ] Implementar checkout pro
- [ ] Implementar webhook handling
- [ ] Adicionar retry logic para falhas
- [ ] Criar dashboard de transações
- [ ] Adicionar logs de transações

#### 8.2 Email (Resend)
- [ ] Criar conta Resend
- [ ] Obter API key
- [ ] Criar templates de email (HTML)
- [ ] Implementar envio de emails transacionais:
  - [ ] Confirmação de agendamento
  - [ ] Lembrete de consulta
  - [ ] Receita emitida
  - [ ] Pagamento confirmado
- [ ] Sistema de templates reutilizáveis

#### 8.3 WhatsApp Business API
- [ ] Escolher provedor (Twilio ou Evolution API)
- [ ] Criar conta e obter credenciais
- [ ] Implementar envio de mensagens
- [ ] Notificações automáticas:
  - [ ] Confirmação de agendamento
  - [ ] Lembrete de consulta (24h antes)
  - [ ] Receita emitida
  - [ ] Pagamento confirmado
  - [ ] Status ANVISA

**Arquivos a modificar:**
- `lib/email.ts` (integrar Resend)
- `lib/whatsapp.ts` (integrar API real)
- `app/api/payments/webhook/route.ts` (Mercado Pago)
- Criar templates de email

---

### 9. Área do Paciente

- [ ] Melhorar dashboard com próximas consultas
- [ ] Adicionar cards informativos
- [ ] Melhorar histórico de consultas (filtros, busca)
- [ ] Implementar upload de documentos
- [ ] Adicionar progresso do tratamento
- [ ] Adicionar lembretes de medicamentos
- [ ] Melhorar visualização de receitas
- [ ] Adicionar rastreamento de importações ANVISA

**Arquivos a modificar:**
- `app/paciente/page.tsx`
- `app/paciente/consultas/page.tsx`
- `app/paciente/documentos/page.tsx`
- `components/patient/PatientDashboard.tsx`

---

## 🟢 FASE 3 - DESEJÁVEL (2 meses)

### 10. Testes

- [ ] Instalar Jest + React Testing Library
- [ ] Configurar ambiente de testes
- [ ] Testes unitários para componentes críticos:
  - [ ] Button
  - [ ] Input
  - [ ] AppointmentForm
- [ ] Testes de integração para APIs:
  - [ ] /api/consultations
  - [ ] /api/auth
  - [ ] /api/payments
- [ ] Testes E2E com Playwright:
  - [ ] Fluxo de agendamento
  - [ ] Login admin
  - [ ] Emissão de receita
- [ ] Testes de acessibilidade (axe-core)
- [ ] Configurar CI/CD para rodar testes

**Arquivos a criar:**
- `jest.config.js`
- `__tests__/` (pasta de testes)
- `playwright.config.ts`

**Bibliotecas:**
- [ ] Instalar `jest`
- [ ] Instalar `@testing-library/react`
- [ ] Instalar `@playwright/test`
- [ ] Instalar `@axe-core/react`

---

### 11. PWA

- [ ] Criar `manifest.json`
- [ ] Adicionar service worker
- [ ] Implementar offline support
- [ ] Adicionar ícones (vários tamanhos)
- [ ] Implementar push notifications
- [ ] Testar instalação em mobile
- [ ] Adicionar splash screen

**Arquivos a criar:**
- `public/manifest.json`
- `public/sw.js` ou usar next-pwa
- `public/icons/` (vários tamanhos)

**Bibliotecas:**
- [ ] Instalar `next-pwa` (opcional)

---

### 12. Analytics

- [ ] Configurar Google Analytics
- [ ] Adicionar eventos customizados:
  - [ ] Agendamento criado
  - [ ] Pagamento concluído
  - [ ] Receita emitida
- [ ] Configurar error tracking (Sentry)
- [ ] Adicionar heatmaps (Hotjar ou similar)
- [ ] Dashboard de métricas

**Bibliotecas:**
- [ ] Instalar `@sentry/nextjs`
- [ ] Configurar Google Analytics

---

## 📊 PROGRESSO GERAL

### Fase 1 - Crítico
- [ ] Feedback Visual (0/9)
- [ ] Validação Formulários (0/8)
- [ ] Acessibilidade (0/10)
- [ ] Otimização Imagens (0/8)
- [ ] Segurança (0/8)

**Total Fase 1:** 0/43 tarefas

### Fase 2 - Importante
- [ ] Design System (0/8)
- [ ] Dashboard Admin (0/9)
- [ ] Integrações (0/15)
- [ ] Área do Paciente (0/8)

**Total Fase 2:** 0/40 tarefas

### Fase 3 - Desejável
- [ ] Testes (0/8)
- [ ] PWA (0/7)
- [ ] Analytics (0/5)

**Total Fase 3:** 0/20 tarefas

**TOTAL GERAL:** 0/103 tarefas

---

## 📝 NOTAS

Use esta seção para anotar problemas encontrados, decisões tomadas, etc.

---

**Última atualização:** 28 de Janeiro de 2026
