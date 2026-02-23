# Por que o site demora para carregar (local)

## Causas principais

### 1. **Modo desenvolvimento do Next.js**
- O Next.js em `npm run dev` **compila cada página na primeira vez** que você acessa (on-demand).
- A primeira abertura do site ou a primeira visita a uma rota nova sempre será mais lenta.
- Não há cache persistente entre reinicializações do servidor.

### 2. **Banco de dados chamado em todo request**
- O **layout raiz** (`app/layout.tsx`) chama `generateMetadata()`, que usa `getLandingConfigPublic()`.
- Isso roda **em toda página** (home, admin, paciente, médico) só para montar título e ícone.
- `getLandingConfigPublic()` faz **3 consultas**: `SystemConfig`, `SiteAsset`, `LandingTestimonial`.
- Na **home** ainda são chamados `getLandingConfigPublic()` de novo e `getFaqPublic()` (mais 1 consulta).
- Resultado: na home são **7 idas ao banco** (3 no layout + 3+1 na página), e a config da landing é buscada **duas vezes**.

### 3. **Várias fontes do Google**
- O layout carrega **5 fontes**: Inter, Poppins, Montserrat, Lato, Roboto.
- Cada uma gera requisição de rede; em dev isso soma latência.

### 4. **Prisma em dev logando todas as queries**
- Em `lib/prisma.ts`, em desenvolvimento está: `log: ['query', 'error', 'warn']`.
- Cada consulta é impressa no console; com muitas queries, o I/O do terminal pode deixar o fluxo mais lento.

### 5. **Requisição extra no cliente**
- Os `Providers` fazem um `fetch('/api/security/recaptcha')` ao montar a página.
- Mais uma requisição após o carregamento inicial.

### 6. **Banco local (ex.: SQLite no Windows)**
- Se o banco for arquivo (SQLite), leituras/escritas em disco no Windows podem ser mais lentas que em Linux, principalmente com muitas consultas por request.

---

## O que você pode fazer

### Rápido (sem mudar lógica)
- **Reduzir fontes**: usar 1–2 fontes no layout (ex.: Inter + uma para títulos) em vez de 5.
- **Menos log do Prisma em dev**: em `lib/prisma.ts` usar só `['error']` em dev, ou `['warn', 'error']`, para reduzir I/O do console.

### Médio (cache e menos duplicação)
- **Cache da config da landing**: usar `unstable_cache` (Next.js) ou `revalidate` em `getLandingConfigPublic()` e em `getFaqPublic()` para não bater no banco em todo request.
- **Metadata sem DB em rotas internas**: no layout, não chamar `getLandingConfigPublic()` para rotas `/admin`, `/paciente`, `/medico`; usar título/ícone fixos ou de um config leve em memória.

### Estrutural
- **Revalidar apenas quando precisar**: por exemplo, revalidar a config da landing quando alguém salvar no admin (on-demand revalidation), em vez de sempre ler do banco.
- Em **produção** (`npm run build` + `npm start`), as páginas já vêm compiladas e o cache do Next ajuda; a lentidão de “primeira vez” some.

---

## Resumo

| Causa                         | Impacto   | Ação sugerida                          |
|------------------------------|-----------|----------------------------------------|
| Compilação on-demand (dev)   | Primeira visita lenta | Normal em dev; em produção melhora.   |
| Layout buscando config em toda página | Muitas queries desnecessárias | Não buscar config no layout para /admin, /paciente, /medico. |
| Config + FAQ sem cache       | DB em todo request   | `unstable_cache` ou `revalidate`.      |
| 5 fontes Google              | Várias requisições   | Reduzir para 1–2 fontes.               |
| Prisma logando todas queries | I/O no console       | Usar só `error` (ou `warn` + `error`) em dev. |

Se quiser, posso sugerir patches concretos (trechos de código) para layout, `getLandingConfigPublic`/`getFaqPublic` e `lib/prisma.ts`.
