# 🔧 Solução: Tabelas Não Existem no Banco de Dados

## ❌ Problema

Erro: `The table 'public.users' does not exist in the current database.`

**Causa:** As tabelas do banco de dados não foram criadas ainda.

---

## ✅ Solução Rápida

### Opção 1: Script Automatizado (Recomendado)

**Duplo clique em:**
```
CRIAR_TABELAS_E_USUARIOS.bat
```

Este script vai:
1. ✅ Gerar o Prisma Client
2. ✅ Criar todas as tabelas no banco
3. ✅ Criar os usuários de teste
4. ✅ Verificar se tudo foi criado corretamente

---

### Opção 2: Manual (Passo a Passo)

#### 1. Gerar Prisma Client

```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npx prisma generate
```

#### 2. Criar Tabelas no Banco

```powershell
npx prisma db push
```

**⚠️ IMPORTANTE:** Este comando vai:
- Criar todas as tabelas definidas no `schema.prisma`
- Sincronizar o schema com o banco de dados
- **NÃO** vai deletar dados existentes (a menos que haja conflitos)

#### 3. Criar Usuários

```powershell
npx tsx criar-usuarios.ts
```

#### 4. Verificar

```powershell
npx tsx verificar-usuarios.ts
```

---

## 🔍 Verificar Configuração

Antes de executar, certifique-se de que:

### 1. Arquivo `.env` está configurado

```env
# Banco de Dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@host:porta/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Schema Prisma está correto

O arquivo `prisma/schema.prisma` deve ter:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 🚨 Problemas Comuns

### Erro: "Error opening a TLS connection"

**Solução:**
- Verifique se a `DATABASE_URL` inclui `?sslmode=require`
- Se usar Supabase, use a porta **6543** (pooler)

### Erro: "Cannot connect to database"

**Solução:**
- Verifique se o banco Supabase está ativo
- Verifique se a `DATABASE_URL` está correta
- Teste a conexão com a internet

### Erro: "Table already exists"

**Solução:**
- Isso é normal se as tabelas já existem
- O comando `db push` vai sincronizar sem deletar dados

---

## 📋 Checklist

Antes de tentar fazer login:

- [ ] `npx prisma generate` foi executado
- [ ] `npx prisma db push` foi executado com sucesso
- [ ] `npx tsx criar-usuarios.ts` foi executado
- [ ] Arquivo `.env` está configurado corretamente
- [ ] `NEXTAUTH_SECRET` está no `.env`
- [ ] Servidor está rodando (`npm run dev`)

---

## 🎯 Credenciais Após Executar

Depois de executar o script, use:

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | `admin@cannabilize.com.br` | `admin123` |
| **Médico** | `doctor@cannabilize.com.br` | `doctor123` |
| **Paciente** | `paciente@cannabilize.com.br` | `paciente123` |

**URL:** http://localhost:3000/login

---

## 💡 Dica

Se você quiser usar SQLite localmente (mais simples para desenvolvimento):

1. Altere `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. No `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. Execute:
   ```powershell
   npx prisma generate
   npx prisma db push
   npx tsx criar-usuarios.ts
   ```

---

**Última atualização:** Janeiro 2026
