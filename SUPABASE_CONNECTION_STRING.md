# 🔌 Como obter a Connection String do Supabase (passo a passo)

Este documento explica em detalhe onde clicar e qual opção escolher para usar com **Vercel** e **Prisma**.

---

## Por que existe “Connection pooling” e porta 6543?

O Supabase oferece **duas formas** de conectar ao PostgreSQL:

| Tipo | Porta | Quando usar |
|------|--------|-------------|
| **Direct connection** (conexão direta) | **5432** | Migrações, backups, ferramentas que ficam conectadas por muito tempo. **Não** use na Vercel. |
| **Connection pooling** (pooler) | **6543** | Aplicações **serverless** (Vercel, Netlify, etc.). Reutiliza conexões e evita “too many connections”. **Use esta na Vercel.** |

- **Porta 5432** = fala direto com o banco. Cada “abertura” da sua app consome uma conexão até fechar.
- **Porta 6543** = fala com um **pooler** (Supavisor/PgBouncer), que reparte poucas conexões reais entre muitas requisições. Ideal para Vercel, onde cada request pode abrir e fechar conexão rápido.

Para o nosso projeto (Next.js na Vercel), você deve usar sempre a **connection string do pooler, porta 6543**.

---

## Onde encontrar a Connection String no Supabase

Há **duas maneiras** de acessar. Use a que aparecer na sua tela.

---

### Opção A: Botão “Connect” (recomendado)

1. Abra o **Dashboard** do Supabase: https://supabase.com/dashboard
2. Clique no **projeto** (ex.: `clickcannabis-prod`).
3. No **topo da página**, ao lado do nome do projeto, procure o botão **“Connect”** (ou “Connect to your database”).
4. Clique em **Connect**.
5. Abre um painel/modal com **várias abas** ou **opções**:
   - **Direct connection** – não use para Vercel (porta 5432).
   - **Connection pooling** / **Transaction mode** / **Session mode** – use a que estiver com **porta 6543** ou descrição “Transaction” / “Pooler”.
6. Dentro dessa opção, escolha a aba **“URI”** (não “JDBC” nem “.NET”).
7. Você verá uma URL no formato:
   ```txt
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
   ou
   ```txt
   postgres://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:6543/postgres
   ```
8. **Copie** essa URL. Ela ainda tem o texto `[YOUR-PASSWORD]` – você vai trocar pela **senha do banco** que definiu ao criar o projeto.

Se não achar o botão “Connect”, use a **Opção B** abaixo.

---

### Opção B: Settings → Database

1. No **menu lateral esquerdo** do projeto, clique no ícone de **engrenagem** (⚙️) para abrir **Settings**.
2. No submenu de Settings, clique em **Database**.
3. A página **Database** mostra várias seções. Role para baixo até a seção **“Connection string”** (ou “Connection info”).
4. Nessa seção costuma haver **abas** ou **cards**:
   - **URI** – clique nessa aba.
   - Às vezes aparecem duas opções:
     - **Direct** (porta 5432) – **não use** para a Vercel.
     - **Connection pooling** / **Transaction** (porta **6543**) – **use esta**.
5. Selecione a opção que mostra a **porta 6543** (Connection pooling / Transaction mode).
6. Copie a URL que aparece. Ela deve conter `:6543/` no meio, por exemplo:
   ```txt
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```

---

## Como saber se é a URL certa (porta 6543)?

A URL correta para Vercel **deve** ter:

- **:6543/** em algum lugar (porta do pooler), **ou**
- O host contendo **`.pooler.supabase.com`**

Exemplos corretos:

- `...@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
- `...@db.xxxxx.supabase.co:6543/postgres`

Exemplo **errado** (não use na Vercel):

- `...@db.xxxxx.supabase.co:5432/postgres` (porta 5432 = conexão direta)

---

## Substituir a senha na URL

A URL copiada vem com `[YOUR-PASSWORD]`. Você precisa trocar por **sua senha real** do banco (a que você definiu ao criar o projeto).

- Se a senha **não** tem caracteres especiais (só letras e números), basta colar no lugar de `[YOUR-PASSWORD]`.
- Se a senha **tem** caracteres como `@`, `#`, `%`, `/`, etc., eles precisam ser **codificados** (URL encode), por exemplo:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `/` → `%2F`

Exemplo: se sua senha for `minha@senha#123`, na URL use `minha%40senha%23123`.

---

## URL final para o Prisma (Vercel)

Depois de colar a URL com a senha substituída, adicione no **final** os parâmetros recomendados para serverless:

```txt
?pgbouncer=true&connection_limit=1&sslmode=require
```

Se a URL já tiver um `?`, use `&` em vez do primeiro `?`:

- Exemplo sem `?`:  
  `postgresql://postgres.xxxxx:minhasenha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require`
- Exemplo com `?` já na URL:  
  `...postgres?param=1&pgbouncer=true&connection_limit=1&sslmode=require`

Onde usar essa URL:

- No **`.env`** local: `DATABASE_URL="..."`
- Na **Vercel**: em **Settings → Environment Variables**, variável `DATABASE_URL`.

---

## Resumo visual (fluxo)

```
Dashboard Supabase
    → Abrir seu projeto
        → Clicar em "Connect" (topo) OU Settings → Database
            → Escolher "Connection pooling" / "Transaction" (porta 6543)
                → Aba "URI"
                    → Copiar URL
                        → Trocar [YOUR-PASSWORD] pela senha real
                            → Adicionar ?pgbouncer=true&connection_limit=1&sslmode=require
                                → Usar em .env e na Vercel como DATABASE_URL
```

---

**Última atualização**: Janeiro 2026
