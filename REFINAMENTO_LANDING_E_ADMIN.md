# Refinamento da landing e área admin – Identidade Visual

Resumo do que foi feito como “time de produto premium”: refinamento de copy/UX da landing e criação da área admin para gerenciar identidade visual (hero, logo, imagens, depoimentos).

---

## 1. Banco de dados (Prisma)

Foram adicionados dois modelos em `prisma/schema.prisma`:

- **LandingTestimonial** – Depoimentos da landing (nome, foto, citação curta/completa, data, fonte, nota, destaque, ativo).
- **SiteAsset** – Assets de identidade (chave, categoria, URL, label, altText, ordem).

**O que fazer:** rodar a migração para criar as tabelas:

```bash
npx prisma db push
# ou, se usar migrations:
npx prisma migrate dev --name add_landing_identity
npx prisma generate
```

Se aparecer erro de permissão (EPERM) no `prisma generate`, feche o servidor/IDE que estiver usando o projeto e rode de novo.

---

## 2. API

- **GET /api/config/landing** (público) – Retorna a config da landing (hero, logo, estatísticas, imagens do processo, depoimentos). Usado pela home.
- **GET/PUT /api/admin/landing-config** (admin) – Lê/atualiza textos e URLs (headline, subheadline, imagem do hero, logo, estatísticas, imagens do processo, frase da barra de progresso).
- **GET/POST /api/admin/site-assets** e **GET/PUT/DELETE /api/admin/site-assets/[key]** (admin) – CRUD de assets (hero, logo, processo, banner).
- **GET/POST /api/admin/landing-testimonials** e **GET/PUT/DELETE /api/admin/landing-testimonials/[id]** (admin) – CRUD de depoimentos da landing.

Textos e URLs principais ficam em **SystemConfig** (chaves `landing_*`). Depoimentos em **LandingTestimonial**. Opcionalmente imagens em **SiteAsset**.

---

## 3. Admin – Identidade Visual

No menu do admin (**Conteúdo → Identidade Visual**):

1. **Hero e textos** – Headline, subheadline, texto do CTA, URL da imagem do hero. Preview da imagem quando há URL.
2. **Logo e imagens do processo** – URL do logo e das 4 imagens das etapas (consulta, receita, ANVISA, entrega).
3. **Números de prova social** – Nota, pacientes, consultas, depoimentos, cidades e frase da barra de progresso.
4. **Depoimentos da landing** – Lista com editar/excluir e botão “Novo depoimento”. Cada depoimento: nome, URL da foto, citação curta, citação completa, data, fonte, nota, e opção “Destacar” (apenas um por vez).

Tudo é salvo com os botões “Salvar” de cada bloco. A home passa a usar esses dados quando existirem; caso contrário, usa os valores padrão (fallback).

---

## 4. Home – Uso da config

A página inicial (`app/page.tsx`) é **async** e chama `getLandingConfigPublic()`. O resultado é passado para:

- **HeroSection** – headline, subheadline, CTA, imagem do hero, nota e número de pacientes no topo.
- **ProgressStepsBar** – texto “Você está a X passos…”.
- **Statistics** – números (atendimentos, consultas, depoimentos, cidades) quando configurados.
- **ProcessSteps** – imagens das 4 etapas quando configuradas.
- **Testimonials** – lista de depoimentos; se houver depoimentos no admin, usa essa lista; senão, usa a lista padrão. Um depoimento pode ser marcado como “Destaque”.

---

## 5. Ajustes de copy (premium)

- **Hero (default)** – Headline e subheadline mais orientados a alívio e simplicidade; CTA único forte.
- **Seleção de condições** – Título e texto reforçando “primeiro passo da jornada” e “tudo passa por avaliação médica”.
- **Por que CannabiLize** – Títulos e descrições com benefícios concretos (menos burocracia, preço claro, suporte que responde, tudo em um lugar).
- **Depoimentos** – Versão curta + “Leia mais”; um depoimento em destaque (badge “Destaque”).

Todos esses textos podem ser sobrescritos ou complementados pelo admin em **Identidade Visual**.

---

## 6. Onde está cada coisa

| O que | Onde |
|-------|------|
| Schema (LandingTestimonial, SiteAsset) | `prisma/schema.prisma` |
| Config pública da landing | `lib/landing-config.ts` |
| API pública da config | `app/api/config/landing/route.ts` |
| APIs admin (config, assets, testimonials) | `app/api/admin/landing-config/`, `site-assets/`, `landing-testimonials/` |
| Página admin Identidade Visual | `app/admin/identidade-visual/page.tsx` |
| Menu admin | `components/layout/AdminLayout.tsx` (item “Identidade Visual” em Conteúdo) |
| Home usando config | `app/page.tsx` + componentes em `components/home/` (HeroSection, Statistics, ProcessSteps, ProgressStepsBar, Testimonials) |

Depois de rodar a migração e o `prisma generate`, a home e o admin passam a usar e exibir os dados configurados em **Identidade Visual**.
