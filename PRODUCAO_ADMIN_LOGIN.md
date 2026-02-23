# Login do Admin em Produção

## Situação

Os usuários (incluindo o admin) **só existem em produção** se:

1. O **seed** foi rodado no banco de produção, ou  
2. O admin foi criado/ajustado manualmente (ou por script).

Se você fez apenas `prisma migrate` / `db push` na VPS e **nunca rodou o seed**, a tabela `users` pode estar vazia ou sem o usuário admin — por isso o login falha.

---

## Credenciais padrão do admin (após o seed)

| Campo  | Valor                        |
|--------|------------------------------|
| Email  | `admin@cannabilize.com.br`   |
| Senha  | `admin123`                   |

**Importante:** use o email exatamente como acima (minúsculas, sem espaços).

---

## O que fazer na VPS (produção)

Conecte por SSH na sua VPS, entre na pasta do projeto e use o `.env` de produção (com `DATABASE_URL` apontando para o banco de produção).

### Opção 1: Garantir que o admin exista e a senha seja `admin123`

```bash
cd /var/www/cannabilize   # ou o caminho do seu projeto na VPS
npx prisma db seed
```

Isso cria/atualiza o admin e outros usuários de exemplo. O admin fica com senha `admin123`.

### Opção 2: Só verificar/corrigir o admin (sem criar outros dados)

```bash
npx tsx scripts/verificar-login-admin.ts
```

Esse script:

- Verifica se existe usuário com email `admin@cannabilize.com.br`
- Se não tiver senha ou a senha não for `admin123`, define/atualiza para `admin123`
- Reativa a conta se estiver desativada (`deletedAt`)

### Opção 3: Forçar a senha do admin para `admin123`

Se o admin já existe mas você não sabe a senha:

```bash
npx tsx scripts/fix-admin-password.ts
```

Depois reinicie o app (ex.: `pm2 restart cannabilize`) e tente logar de novo.

---

## Checklist rápido

- [ ] Na VPS, `DATABASE_URL` no `.env` é a do banco de **produção**.
- [ ] Rodou `npx prisma db seed` **ou** `npx tsx scripts/verificar-login-admin.ts` na VPS.
- [ ] Login com `admin@cannabilize.com.br` e `admin123` (em aba anônima ou sem cache).
- [ ] Se usar Nginx/PM2, reiniciou o app após qualquer alteração no banco.

Se ainda falhar, confira no banco se existe um usuário com esse email e role `ADMIN` (por exemplo com `npx prisma studio` apontando para o mesmo `DATABASE_URL`).
