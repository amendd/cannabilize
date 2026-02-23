# Análise de Performance e Desempenho — ClickCannabis / CannabiLize

**Escopo:** frontend, backend, build, infraestrutura e dependências.  
**Foco:** desempenho, tempo de carregamento e eficiência.

---

## 1. Gargalos de performance identificados

### 1.1 Frontend

| Problema | Onde | Impacto |
|----------|------|---------|
| **Nenhum code splitting / lazy loading** | Projeto inteiro | Bundle inicial carrega todos os componentes da home, admin, paciente, médico. Aumenta FCP/LCP e TTI. |
| **Uso intenso de `framer-motion`** | ~50+ arquivos (admin, layouts, paciente, médico) | Biblioteca pesada (~40–60 KB gzipped) em toda a árvore. Animações em listas (ex.: `motion.tr` por linha) geram muitas re-renderizações. |
| **Dashboard admin 100% client-side** | `app/admin/page.tsx` | Página inteira é `'use client'` com 4 fetches em paralelo no mount; sem SSR/streaming, usuário vê loading até tudo carregar. |
| **Múltiplos fetches em cascata no paciente** | `app/paciente/page.tsx` | Consultas + reschedule invites em 2 requests separados; dados poderiam vir em 1 resposta ou via RSC. |
| **API de consultas sem paginação** | `GET /api/consultations?patientId=` | Retorna **todas** as consultas do paciente (sem `take`). Pacientes com muitos registros recebem payload grande e parsing pesado. |
| **Providers com fetch no mount** | `app/providers.tsx` | Busca `/api/security/recaptcha` no `useEffect`; atrasa hidratação e pode piscar UI se RecaptchaProvider envolver tarde. |
| **Sem `loading.tsx` por rota** | `app/**` | Nenhum `loading.tsx`; usuário não vê skeleton durante navegação, apenas tela em branco ou spinner genérico. |
| **Duas fontes Google no layout** | `app/layout.tsx` | Inter + Poppins; aumenta tempo de carregamento de fontes e risco de FOIT. |

### 1.2 Backend / API

| Problema | Onde | Impacto |
|----------|------|---------|
| **Model `Consultation` sem índices** | `prisma/schema.prisma` | Queries por `status`, `scheduledAt` (ex.: admin/health, admin/consultations com filtro de data) fazem full table scan. |
| **Sessão em toda rota protegida** | Rotas em `app/api/admin/*`, etc. | `getServerSession(authOptions)` em cada request; sem cache explícito de sessão, pode haver I/O repetido. |
| **Nenhum cache HTTP em respostas de API** | Rotas GET (stats, pending, health, config) | Dados relativamente estáticos (ex.: contagens) são recalculados a cada request. |
| **Admin consultations com `include` pesado** | `app/api/admin/consultations/route.ts` | `include: { patient, doctor, prescription, payment, rescheduleInvites }` em até 10.000 registros no CSV; risco de memória e latência. |
| **Rate limit em memória** | `middleware.ts` | `Map` em memória não escala com múltiplas instâncias (Vercel serverless); comentário já sugere Redis para produção. |

### 1.3 Build e dependências

| Problema | Onde | Impacto |
|----------|------|---------|
| **Sem análise de bundle** | `next.config.js` | Não há `@next/bundle-analyzer`; não há visibilidade do tamanho por pacote. |
| **`transpilePackages: ['next-auth']`** | `next.config.js` | Aumenta tempo de build e tamanho do bundle ao incluir next-auth na transpilação. |
| **Webpack alias para next-auth** | `next.config.js` | Alias manual para `next-auth/react` pode duplicar código se não configurado com cuidado. |
| **Dependências pesadas no critical path** | `package.json` | `framer-motion`, `googleapis`, `jspdf`, `pdf-lib`, `html2canvas`, `qrcode` — muitas carregadas mesmo em rotas que não usam (sem dynamic import). |

---

## 2. Build e deploy

### 2.1 Tamanho dos bundles

- **Situação:** Não há bundle analyzer; tamanho real não medido.
- **Riscos:** `framer-motion`, `lucide-react` (muitos ícones), `next-auth`, `react-hook-form`, `zod` e componentes pesados (PrescriptionBuilder, VideoCallWindow, etc.) podem estar no chunk principal de páginas que não precisam deles.

### 2.2 Code splitting e lazy loading

- **Situação:** Nenhum uso de `next/dynamic` ou `React.lazy` no projeto.
- **Efeito:** Todas as rotas que compartilham layout (ex.: admin) podem puxar componentes de outras rotas (ex.: gráficos, modais, tabelas) no primeiro load.

### 2.3 Tree shaking

- **Next.js 14:** `swcMinify: true` está ativo; tree shaking básico existe.
- **Risco:** Importações como `import { motion } from 'framer-motion'` e `import { Calendar, Users, ... } from 'lucide-react'` em muitos arquivos podem puxar mais do que o necessário se o bundler não conseguir eliminar código morto.

### 2.4 Minificação e compressão

- **Minificação:** SWC minify habilitado.
- **Compressão:** `compress: true` no Next.js (gzip no servidor).
- **Recomendação:** Em produção (ex.: Vercel), verificar se resposta está com `Content-Encoding: gzip` ou `br`.

---

## 3. Frontend — métricas e padrões

### 3.1 Tempo de carregamento (LCP, FCP, TTI)

- **LCP/FCP:** Layout raiz carrega fontes (Inter, Poppins), `ConditionalNavbar`, `ConditionalFooter`, `Providers` (SessionProvider, RecaptchaProvider, AgendarModal, PublicConfig). Até o primeiro paint, todo o JS desses componentes + da página atual é executado.
- **TTI:** Dashboards (admin, paciente, médico) dependem de vários `useEffect` + fetches; TTI alto porque a página “fica pronta” só após dados e hidratação.
- **Boas práticas:** Usar RSC onde possível, `loading.tsx` por segmento, e reduzir JS crítico (lazy de modais, gráficos, framer-motion em below-the-fold).

### 3.2 Re-renderizações desnecessárias

- **Admin dashboard:** Vários `motion.div` com `initial`/`animate`; cada mudança de estado (ex.: `setStats`) re-renderiza toda a árvore.
- **Tabela de consultas recentes:** `motion.tr` com `transition={{ delay: 0.4 + index * 0.05 }}` — animação por linha aumenta custo.
- **Providers:** `recaptchaSiteKey` em state; quando preenchido, re-renderiza toda a árvore de filhos.
- **Recomendação:** Memoizar listas (`React.memo` em linhas de tabela), evitar animações em listas longas ou usar CSS only, e manter estado o mais local possível.

### 3.3 Imagens, fontes e assets

- **Imagens:** Uso de `next/image` via `OptimizedImage` (AVIF/WebP configurados em `next.config.js`) — bom.
- **Risco:** Alguns usos de `<img>` em `CarteirinhaCard.tsx`, `cadastro-medico`, `identidade-visual`; preferir `next/image` para otimização automática.
- **Fontes:** Inter e Poppins com `display: "swap"` — correto para evitar FOIT; duas fontes aumentam um pouco o tempo de rede.
- **Cache:** Nenhum header de cache explícito para assets estáticos no `next.config.js` (Next.js já define cache para `/_next/static`).

### 3.4 Estratégias de cache

- **Landing:** `getLandingConfigPublic()` e `getFaqPublic()` usam `unstable_cache` com `revalidate: 60` — bom.
- **Client:** Nenhum uso de `stale-while-revalidate` (ex.: SWR ou React Query) nas telas de dashboard; cada entrada na página refaz todos os fetches.
- **API:** Respostas GET de admin (stats, pending, health, consultations) sem `Cache-Control`; não há cache em CDN ou cliente.

---

## 4. Backend / API

### 4.1 Latência das rotas

- **Admin dashboard:** 4 chamadas em paralelo (stats, pending, health, consultations); latência total ≈ máximo das 4. Cada uma faz várias queries (stats faz 11 `Promise.all`); com índices faltando (ex.: Consultation), algumas podem ser lentas.
- **Paciente dashboard:** 2 chamadas (consultations, reschedule-invites); consultations sem limite pode devolver muitos registros e aumentar tempo de serialização e rede.

### 4.2 Queries ao banco

- **Consultation:** Nenhum `@@index` em `Consultation`; filtros por `status`, `scheduledAt`, `patientId` não estão indexados. Em SQLite, tabelas grandes sofrem com full scan.
- **Admin consultations:** `findMany` com `include` grande; para CSV usa `take: 10000` — alto uso de memória e tempo.
- **Stats/health/pending:** Uso de `Promise.all` com `count` e `findMany` enxutos — padrão bom; benefício grande ao adicionar índices em `Consultation` (status, scheduledAt, patientId).

### 4.3 Cache (HTTP, Redis)

- **HTTP:** Nenhum `Cache-Control` em rotas GET de dados (ex.: `/api/admin/stats`). Poderia usar `private, max-age=60` ou similar para reduzir recálculo.
- **Redis:** Não utilizado; rate limit e cache de sessão em produção seriam os primeiros candidatos.

### 4.4 Paralelismo e batching

- **Paralelismo:** Admin stats, pending, health usam `Promise.all` — bom.
- **Batching:** Não há padrão de “batch endpoint” (ex.: um único GET que devolve stats + pending + health); 4 requests separados aumentam latência de rede e número de cold starts em serverless.

---

## 5. Melhorias sugeridas (priorizadas)

### 5.1 Índices no Prisma para Consultation (Alto impacto, baixo esforço)

**Problema:** Queries por `status`, `scheduledAt`, `patientId` sem índice.

**Ação:** No `prisma/schema.prisma`, no model `Consultation`, adicionar:

```prisma
model Consultation {
  // ... campos existentes ...

  @@index([patientId])
  @@index([status])
  @@index([scheduledAt])
  @@index([status, scheduledAt])
  @@map("consultations")
}
```

**Impacto:** Redução forte de tempo em listagens admin, health (consultas hoje), e GET de consultas por paciente.  
**Esforço:** Baixo. Em seguida rodar `prisma migrate dev` (ou `db push` em dev).

---

### 5.2 Paginação ou limite em GET /api/consultations (Alto impacto, baixo esforço)

**Problema:** Retorno de todas as consultas do paciente.

**Ação:** Em `app/api/consultations/route.ts`, no GET:

```ts
const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
const cursor = searchParams.get('cursor'); // opcional

const consultations = await prisma.consultation.findMany({
  where: { patientId },
  include: { doctor: true, prescription: true, payment: true },
  orderBy: { scheduledAt: 'desc' },
  take: limit,
  ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
});
return NextResponse.json({
  consultations,
  nextCursor: consultations.length === limit ? consultations[consultations.length - 1].id : null,
});
```

No cliente (paciente dashboard), pedir por exemplo `limit=50` e, se houver `nextCursor`, carregar mais sob demanda ou em scroll infinito.

**Impacto:** Menor payload e tempo de resposta; menos risco de timeout e memória.  
**Esforço:** Baixo no backend; médio se adaptar UI para “carregar mais”.

---

### 5.3 Lazy loading de componentes pesados (Alto impacto, esforço médio)

**Problema:** Tudo no bundle inicial.

**Ação:** Usar `next/dynamic` com `ssr: false` onde fizer sentido:

```tsx
// app/admin/page.tsx
import dynamic from 'next/dynamic';

const ConsultationsChart = dynamic(
  () => import('@/components/admin/ConsultationsChart'),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" /> }
);
const FinancialSection = dynamic(
  () => import('@/components/admin/FinancialSection'),
  { ssr: false, loading: () => <div className="h-48 bg-gray-100 rounded animate-pulse" /> }
);
```

Fazer o mesmo para modais (AgendarModal), VideoCallWindow, PrescriptionBuilder, etc.

**Impacto:** Redução do JS inicial e melhora de FCP/LCP/TTI.  
**Esforço:** Médio (avaliar cada página e placeholder).

---

### 5.4 Cache HTTP em respostas de API (Médio impacto, baixo esforço)

**Problema:** Stats, pending, health recalculados a cada request.

**Ação:** Em rotas GET como `/api/admin/stats`, `/api/admin/pending`, `/api/admin/health`, adicionar header:

```ts
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
  },
});
```

Ajustar `max-age` conforme necessidade (ex.: 30–120 s). Para dados por usuário, manter `private`.

**Impacto:** Menos chamadas ao banco e menor latência percebida em reloads.  
**Esforço:** Baixo.

---

### 5.5 Reduzir uso de framer-motion no critical path (Médio impacto, esforço médio)

**Problema:** Bundle grande e muitas re-renderizações animadas.

**Ação:**

- Em listas (ex.: tabela de consultas), trocar `motion.tr` por `<tr>` e usar CSS para transição (ex.: `transition: opacity 0.2s`).
- Lazy load do framer-motion apenas em rotas que realmente usam animações elaboradas:  
  `const motion = dynamic(() => import('framer-motion').then(m => m.motion), { ssr: false });` (ou manter import normal só em 1–2 páginas).
- Considerar substituir animações simples por CSS (opacity, transform) ou por uma lib mais leve.

**Impacto:** Menor bundle e menos trabalho na main thread.  
**Esforço:** Médio.

---

### 5.6 loading.tsx por segmento (Médio impacto, baixo esforço)

**Problema:** Navegação sem feedback visual.

**Ação:** Criar `loading.tsx` nos segmentos principais:

- `app/loading.tsx` — skeleton genérico para a raiz.
- `app/admin/loading.tsx` — skeleton do dashboard (cards + tabela).
- `app/paciente/loading.tsx` — skeleton do dashboard paciente.
- `app/medico/loading.tsx` — skeleton do médico.

Exemplo para admin:

```tsx
// app/admin/loading.tsx
import { SkeletonDashboard, SkeletonTable } from '@/components/ui/Skeleton';
export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      <SkeletonDashboard />
      <SkeletonTable />
    </div>
  );
}
```

**Impacto:** Melhor percepção de velocidade (LCP/feedback).  
**Esforço:** Baixo.

---

### 5.7 Endpoint agregado para o dashboard admin (Médio impacto, esforço médio)

**Problema:** 4 requests separados aumentam latência e cold starts.

**Ação:** Criar `GET /api/admin/dashboard` que internamente chama as mesmas funções de stats, pending, health e consultas recentes, e devolve um único JSON. No cliente, um único `fetch('/api/admin/dashboard')`.

**Impacto:** Uma ida e volta, menos cold starts e menor tempo até “dashboard completo”.  
**Esforço:** Médio (extrair lógica para funções reutilizáveis e manter rotas antigas opcionalmente para compatibilidade).

---

### 5.8 Bundle analyzer e revisão de imports (Médio impacto, baixo esforço)

**Problema:** Desconhecimento do tamanho real dos chunks.

**Ação:**

```bash
npm i -D @next/bundle-analyzer
```

Em `next.config.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });
module.exports = withBundleAnalyzer(nextConfig);
```

Rodar `ANALYZE=true npm run build` e inspecionar quais pacotes e rotas mais pesam; em seguida aplicar dynamic imports e tree shaking (ex.: importar só ícones usados de `lucide-react`).

**Impacto:** Visibilidade e base para decisões de lazy load e remoção de dependências.  
**Esforço:** Baixo.

---

### 5.9 Uma fonte no layout (Baixo impacto, baixo esforço)

**Problema:** Duas fontes Google (Inter + Poppins) no layout global.

**Ação:** Usar apenas uma (ex.: Inter) ou carregar Poppins apenas em rotas que precisam (ex.: layout admin). Ex.: remover Poppins do `layout.tsx` e usar `next/font` apenas onde for necessário.

**Impacto:** Menor tempo de carregamento de fontes e menor risco de FOIT.  
**Esforço:** Baixo.

---

### 5.10 Rate limit e cache de sessão para produção (Médio impacto, alto esforço)

**Problema:** Rate limit em memória e sessão sem cache.

**Ação:** Em produção, usar Redis (ou equivalente) para: (1) rate limit (contadores por IP/usuário); (2) cache de sessão do NextAuth (adapter ou cache de `getServerSession`). Documentar em README ou guia de deploy.

**Impacto:** Comportamento correto com múltiplas instâncias e menor carga no DB por sessão.  
**Esforço:** Alto (infra + configuração).

---

## 6. Resumo executivo

### 6.1 Principais problemas encontrados

1. **Banco:** Model `Consultation` sem índices — listagens e filtros por status/data/patient lentos em volume.
2. **API:** GET de consultas do paciente sem limite/paginação — payload e tempo de resposta altos.
3. **Frontend:** Nenhum code splitting/lazy loading — bundle inicial grande e TTI alto.
4. **Frontend:** Uso pesado de framer-motion em muitas telas e em listas — bundle e re-renders desnecessários.
5. **Admin:** Dashboard 100% client-side com 4 fetches em paralelo — poderia ser 1 endpoint + cache e/ou RSC.
6. **Build:** Sem bundle analyzer e sem estratégia de dynamic import — difícil otimizar com dados.
7. **Cache:** Nenhum cache HTTP em APIs de leitura e nenhum uso de SWR/React Query no client — dados sempre refetched.
8. **UX:** Ausência de `loading.tsx` — navegação sem feedback visual.

### 6.2 Top 5 melhorias mais impactantes

| # | Melhoria | Impacto | Esforço |
|---|----------|---------|--------|
| 1 | **Índices no model Consultation** | Reduz tempo de queries em listagens e dashboards | Baixo |
| 2 | **Paginação/limite em GET /api/consultations** | Reduz payload e latência no dashboard paciente | Baixo |
| 3 | **Lazy loading (dynamic) de gráficos, modais e telas pesadas** | Reduz JS inicial e melhora FCP/LCP/TTI | Médio |
| 4 | **Cache HTTP (Cache-Control) em GETs de stats/pending/health** | Menos carga no banco e respostas mais rápidas | Baixo |
| 5 | **Endpoint agregado /api/admin/dashboard + loading.tsx** | Menos round-trips e melhor percepção de velocidade | Médio |

### 6.3 Próximos passos recomendados

1. **Imediato (sprint atual)**  
   - Adicionar índices em `Consultation` e rodar migração.  
   - Colocar `take` (e opcionalmente cursor) no GET de consultas; no cliente, usar `limit=50` e “carregar mais” se necessário.  
   - Adicionar `Cache-Control` em `/api/admin/stats`, `/api/admin/pending`, `/api/admin/health`.

2. **Curto prazo (1–2 sprints)**  
   - Habilitar bundle analyzer e identificar maiores chunks.  
   - Introduzir `next/dynamic` para ConsultationsChart, FinancialSection, AgendarModal, VideoCallWindow, PrescriptionBuilder.  
   - Criar `loading.tsx` em `app`, `app/admin`, `app/paciente`, `app/medico`.  
   - Avaliar endpoint único `/api/admin/dashboard` e migrar o dashboard admin para um único fetch.

3. **Médio prazo**  
   - Reduzir animações com framer-motion em listas (substituir por CSS ou remover).  
   - Considerar SWR ou React Query no cliente para cache e revalidação.  
   - Revisar uso de duas fontes e restringir a uma ou carregar a segunda só onde necessário.

4. **Produção / infra**  
   - Documentar e, se possível, implementar rate limit e cache de sessão com Redis (ou serviço equivalente).

---

## 7. Status das melhorias (o que já foi feito x o que falta)

### 7.1 Já implementado

| Item | Status |
|------|--------|
| Índices no model `Consultation` (patientId, status, scheduledAt, status+scheduledAt) | ✅ |
| Limite em GET `/api/consultations` (parâmetro `limit`, default 100, max 500) | ✅ |
| Cache-Control em `/api/admin/stats`, `pending`, `health` e `/api/admin/dashboard` | ✅ |
| `loading.tsx` em `app`, `app/admin`, `app/paciente`, `app/medico` | ✅ |
| Endpoint agregado `GET /api/admin/dashboard` e dashboard admin com 1 fetch | ✅ |
| Bundle analyzer (`@next/bundle-analyzer`, `ANALYZE=true`) | ✅ |
| Uma fonte no layout (removida Poppins; só Inter) | ✅ |
| Lazy loading: ConsultationsChart, FinancialSection, AgendarModal, VideoCallWindow, PrescriptionBuilder, PrescriptionView, ConsultationsTable, RescheduleInviteModal | ✅ |
| Admin dashboard e admin/consultas sem framer-motion (motion → div) | ✅ |
| Paciente: `limit=100` no fetch de consultas | ✅ |
| Endpoint `GET /api/patient/dashboard` (consultas + convites) e paciente com 1 fetch | ✅ |
| Trocar `<img>` por `next/image` em CarteirinhaCard e cadastro-medico | ✅ |
| GET `/api/consultations` retorna `{ consultations, nextCursor }` e suporta `cursor` | ✅ |
| Página paciente/consultas com botão “Carregar mais” (cursor) | ✅ |
| Dashboard paciente sem framer-motion (motion → div) | ✅ |
| SWR no dashboard admin e no dashboard paciente (cache + revalidação) | ✅ |
| Dashboard médico sem framer-motion (motion → div) | ✅ |
| Export CSV consultas limitado a 2.000 linhas | ✅ |
| reCAPTCHA: uso de env quando disponível (evita fetch no mount) | ✅ |
| Documentação rate limit/Redis em `docs/RATE_LIMIT_PRODUCAO.md` | ✅ |

### 7.2 O que ainda falta fazer

**Médio impacto, esforço baixo/médio**

1. ~~**Dashboard paciente: unificar 2 fetches em 1**~~ **Feito.**

2. ~~**Paginação “carregar mais” no paciente**~~ **Feito.** API retorna `nextCursor`; página “Minhas Consultas” tem botão “Carregar mais”.

3. ~~**Cache no cliente (SWR ou React Query)**~~ **Feito.** SWR no dashboard admin e no dashboard paciente (`revalidateOnFocus`, `dedupingInterval`). Médico continua com fetch tradicional (múltiplos endpoints).

4. ~~**Trocar `<img>` por `next/image`**~~ **Parcial.** Feito em `CarteirinhaCard.tsx` e `cadastro-medico`. Revisar outras páginas que ainda usem `<img>` (ex.: identidade-visual, se existir).

5. ~~**Reduzir framer-motion em outras páginas**~~ **Parcial.** Removido em admin dashboard, admin/consultas, paciente dashboard e **dashboard médico** (`app/medico/page.tsx`). Outras rotas (whatsapp, configuracoes, etc.) ainda podem ser simplificadas.

**Médio impacto, esforço maior**

6. ~~**Export CSV de consultas**~~ **Feito.** Limite reduzido de 10.000 para **2.000** linhas no export CSV de consultas.

7. ~~**Provider do reCAPTCHA**~~ **Feito.** Se `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` estiver definido, o provider usa na hora (sem fetch no mount); fetch da API só quando a env não estiver definida.

**Produção / infra (alto esforço)**

8. **Rate limit e sessão com Redis**  
   Rate limit em memória no middleware não escala com várias instâncias. Criado **`docs/RATE_LIMIT_PRODUCAO.md`** com orientações para uso de Redis (ou Upstash) em produção; implementação depende de infra.

9. **Rodar o bundle analyzer**  
   Executar `ANALYZE=true npm run build:analyze` (ou equivalente no Windows), inspecionar os chunks e aplicar mais `dynamic()` ou revisar imports (ex.: ícones do `lucide-react`) onde fizer sentido.

---

*Documento gerado com base na análise do repositório (frontend, backend, build, dependências e configurações). Recomenda-se validar índices e mudanças de API em ambiente de staging antes de produção.*
