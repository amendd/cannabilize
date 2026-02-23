# Análise dos erros de build e checklist para produção

## Causa comum dos erros

Todos os erros que quebraram o build na VPS tinham **três origens principais**:

### 1. Código só no PC, nunca enviado ao GitHub

A VPS faz `git pull` no repositório **amendd/cannabilize**. Se um arquivo existe só na sua máquina e nunca foi commitado/ pushed, ele **não existe** na VPS.

**Arquivos que faltavam no repo e causaram "Module not found" ou "property does not exist":**
- `lib/roles-permissions.ts`
- `lib/audit.ts`
- `lib/admin-menu.ts`
- `lib/whatsapp-templates.ts`
- `lib/whatsapp-templates-service.ts`
- `types/nodemailer.d.ts`
- Versão atual de `lib/account-setup.ts` (5 parâmetros em `createAndSendSetupToken`)
- Versão atual de `prisma/schema.prisma` (campo `adminMenuPermissions` no User, etc.)
- Correções em `app/api/admin/financial-stats/route.ts`, `app/api/admin/patients/route.ts`, etc.

**Como evitar:** Antes de dar por “pronto para produção”, rodar no PC:

```bash
git status
npm run build
```

Se o build passar, fazer **commit e push de tudo** que a aplicação usa. Se algo está “modified” ou “untracked” e é importado pelo projeto, ele deve estar no repositório.

---

### 2. Schema Prisma com provider diferente do banco usado na produção

O repositório estava com `provider = "sqlite"` no `prisma/schema.prisma`, enquanto a **produção (VPS) usa PostgreSQL**.

Consequências:

- Na VPS, `DATABASE_URL` é uma URL `postgresql://...`. Com `provider = "sqlite"`, o Prisma exige URL com protocolo `file:` → **erro ao rodar `prisma db push` ou `prisma generate`**.
- O **Prisma Client** é gerado conforme o provider do schema. Com `sqlite`, os tipos **não** incluem recursos só do PostgreSQL, como `mode: 'insensitive'` em filtros de string.
- Qualquer rota que use `mode: 'insensitive'` (ex.: `app/api/admin/search/route.ts`) passa a dar **erro de tipo** quando o client é gerado com schema SQLite.

**Como evitar:** O `schema.prisma` no repositório deve usar o **mesmo provider que a produção** (PostgreSQL). Assim:

- Na VPS não é necessário usar `sed` para trocar o provider.
- `prisma db push` / `prisma migrate` funcionam com a `DATABASE_URL` da VPS.
- O client gerado suporta `mode: 'insensitive'` e o build passa.

Para **desenvolvimento local** com SQLite, pode-se:
- usar um schema alternativo (ex. `schema.sqlite.prisma`) e trocar manualmente, ou
- usar PostgreSQL local (Docker, etc.) e o mesmo schema do repo.

**Importante:** No PC, se você ainda usa SQLite para desenvolvimento, o `DATABASE_URL` no `.env` deve ser algo como `file:./prisma/dev.db` **apenas** se você trocar temporariamente o provider no schema para `sqlite`. Com o schema no repo em `postgresql`, use uma URL `postgresql://...` no `.env` (local ou remoto).

---

### 3. Uso de recursos específicos do PostgreSQL no código

`mode: 'insensitive'` em filtros (`contains`, `startsWith`, etc.) é **suportado apenas com provider PostgreSQL**. Com schema SQLite, o tipo `StringFilter` não tem a propriedade `mode` → erro em tempo de build.

**Arquivos que usam `mode: 'insensitive'`:**
- `app/api/admin/search/route.ts`
- `app/api/admin/verificar-pagamento/route.ts`
- `services/user.service.ts`
- `scripts/verificar-pagamento-paciente.ts`

**Como evitar:** Com o schema no repo em **PostgreSQL** (recomendado), esse código continua válido. Se em algum momento o schema for SQLite de novo, será preciso remover `mode: 'insensitive'` ou fazer busca case-insensitive em JavaScript (ex.: normalizar `query` e filtrar resultados).

---

## Correções aplicadas para produção

1. **Schema no repositório:** `prisma/schema.prisma` com `provider = "postgresql"`, para bater com a VPS e com o client que suporta `mode: 'insensitive'`.
2. **Documentação:** Este arquivo (análise + checklist).
3. **Checklist abaixo:** para usar antes de cada deploy.

---

## Checklist antes de deploy / “ir para produção”

- [ ] No PC: `git status` — não deixar arquivos **modified** ou **untracked** que sejam usados pela aplicação sem commit + push.
- [ ] No PC: `npm run build` — build deve passar.
- [ ] Repositório: `prisma/schema.prisma` com `provider = "postgresql"` (ou o mesmo provider da produção).
- [ ] Na VPS: após `git pull`, não é necessário alterar o provider do schema (já é PostgreSQL).
- [ ] Na VPS: `npx prisma db push` (ou `migrate deploy`) para alinhar o banco ao schema.
- [ ] Na VPS: `npm run build` — deve passar sem erros de tipo ou “module not found”.

Se algum passo falhar, usar esta análise para checar: (1) arquivo faltando no repo, (2) schema com provider errado, (3) uso de recurso só do Postgres com client gerado para SQLite.
