# Análise: por que os erros de build aparecem e como seguir

## Por que estamos tendo esses erros?

### 1. **TypeScript em modo estrito no build**
O `next build` roda **verificação de tipos** (lint + type check). Qualquer incompatibilidade de tipo faz o build falhar. Isso é diferente de rodar só `next dev`, que em muitos casos é mais permissivo.

### 2. **Tipos de terceiros (APIs)**
Bibliotecas como **Resend** definem as propriedades em **camelCase** (ex.: `replyTo`). Se o código usa **snake_case** (`reply_to`), o TypeScript acusa “propriedade desconhecida”.  
**Causa:** documentação ou exemplos em snake_case, ou código antigo antes da tipagem forte da lib.

### 3. **Session possivelmente null**
O `getServerSession()` retorna `Session | null`. O helper `checkAuth(session)` devolve uma resposta de erro quando não há sessão, mas o **TypeScript não entende** que, depois disso, `session` não é mais `null`. Por isso é preciso um guard explícito (`if (!session?.user) return ...`) para o tipo ser “reduzido” e o uso de `session.user` ser aceito.

### 4. **Projeto grande e tipos desatualizados**
Há muitas rotas, libs e tipos. Pequenas mudanças em dependências (Resend, Prisma, Next, etc.) ou código antigo sem tipagem correta geram erros que só aparecem no **build completo**, não no dia a dia do dev.

---

## O que já foi corrigido

| Erro | Causa | Correção |
|------|--------|----------|
| `session` possibly null em `admin/doctors/route.ts` | TypeScript não narrowa após `checkAuth` | Guard `if (!session) return 401` e `if (!session.user) return 401` |
| Idem em user/export, user/delete, me, admin users/patients | Mesmo padrão | Mesmo guard em todos os handlers que usam `checkAuth` |
| `reply_to` não existe (Resend) | API Resend usa `replyTo` (camelCase) | Troca de `reply_to` para `replyTo` em `email/test/route.ts` e `lib/email.ts` |

---

## Como seguir de forma objetiva

### Opção A – Corrigir erro por erro (recomendado a longo prazo)
1. Rodar `npm run build` na VPS (ou no PC).
2. Se falhar, ler a mensagem: **arquivo**, **linha** e **“did you mean…”** ou “property X does not exist”.
3. Corrigir só esse ponto (nome de propriedade, guard de `session`, tipo, etc.).
4. Fazer commit, push e novo `git pull` + `npm run build` na VPS.
5. Repetir até o build passar.

### Opção B – Desbloquear o build (enquanto ajusta tipos)
Se aparecerem **muitos** erros de tipo e você precisar **subir a aplicação na VPS logo**, pode desativar a **falha do build por erro de TypeScript** (a app continua rodando; os tipos continuam sendo mostrados no editor).

No `next.config.js`, dentro do objeto `nextConfig`, adicione:

```js
typescript: {
  ignoreBuildErrors: true,  // build não falha por erro de tipo
},
eslint: {
  ignoreDuringBuilds: true, // opcional: build não falha por warning do ESLint
},
```

**Vantagem:** o `npm run build` passa e você consegue usar PM2 e acessar o site.  
**Desvantagem:** erros de tipo deixam de impedir o build; você deve ir corrigindo aos poucos e, quando estiver estável, **remover** `ignoreBuildErrors` (e `ignoreDuringBuilds` se tiver adicionado).

---

## Próximos passos imediatos

1. **Commit e push** das correções de `reply_to` → `replyTo`:
   - `app/api/admin/email/test/route.ts`
   - `lib/email.ts`

2. **Na VPS:** `git pull` e `npm run build`.

3. **Se o build passar:** rodar PM2 e testar `http://5.189.168.66:3000`.

4. **Se o build falhar de novo:** usar a mensagem de erro (arquivo + linha) para corrigir o próximo ponto **ou** ativar `typescript.ignoreBuildErrors` no `next.config.js` para desbloquear e corrigir tipos depois.
