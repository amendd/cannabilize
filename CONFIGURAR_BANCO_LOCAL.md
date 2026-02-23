# 🔧 Configurar Banco de Dados Local

## 🎯 Problema Identificado

O sistema está conectando ao banco de **produção (Supabase)** ao invés de um banco **local**. Isso causa:
- ❌ Dependência de internet
- ❌ Risco de modificar dados de produção
- ❌ Lentidão na conexão
- ❌ Problemas de login

---

## ✅ Solução: Configurar Banco Local

Você tem **2 opções** para banco local:

### Opção 1: SQLite (Recomendado para Desenvolvimento) ⭐

**Vantagens:**
- ✅ Não precisa instalar nada
- ✅ Funciona offline
- ✅ Rápido e simples
- ✅ Arquivo único (`dev.db`)

**Desvantagens:**
- ⚠️ Não é adequado para produção
- ⚠️ Limitações de concorrência

### Opção 2: PostgreSQL Local

**Vantagens:**
- ✅ Mesmo banco que produção
- ✅ Melhor para testes
- ✅ Suporta múltiplos usuários

**Desvantagens:**
- ⚠️ Precisa instalar PostgreSQL
- ⚠️ Mais complexo de configurar

---

## 🚀 Solução Rápida (Script Automatizado)

### Duplo clique em:
```
CONFIGURAR_BANCO_LOCAL.bat
```

O script vai:
1. ✅ Perguntar qual banco usar (SQLite ou PostgreSQL)
2. ✅ Alterar o `schema.prisma` automaticamente
3. ✅ Configurar o `.env` com banco local
4. ✅ Gerar Prisma Client
5. ✅ Criar todas as tabelas
6. ✅ Criar usuários de teste

---

## 📋 Configuração Manual

### Opção 1: SQLite Local

#### 1. Alterar `prisma/schema.prisma`

```prisma
datasource db {
  provider = "sqlite"  // Mudar de "postgresql" para "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 2. Configurar `.env`

```env
# Banco de Dados SQLite Local
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

#### 3. Executar Comandos

```powershell
cd c:\Users\Gabriel\clickcannabis-replica

# Gerar Prisma Client
npx prisma generate

# Criar tabelas
npx prisma db push

# Criar usuários
npx tsx criar-usuarios.ts
```

---

### Opção 2: PostgreSQL Local

#### 1. Instalar PostgreSQL (se não tiver)

- Download: https://www.postgresql.org/download/windows/
- Durante instalação, anote a senha do usuário `postgres`

#### 2. Criar Banco de Dados

```powershell
# Abrir psql
psql -U postgres

# Criar banco
CREATE DATABASE clickcannabis;

# Sair
\q
```

#### 3. Alterar `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"  // Já deve estar assim
  url      = env("DATABASE_URL")
}
```

#### 4. Configurar `.env`

```env
# Banco de Dados PostgreSQL Local
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/clickcannabis?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

#### 5. Executar Comandos

```powershell
cd c:\Users\Gabriel\clickcannabis-replica

# Gerar Prisma Client
npx prisma generate

# Criar tabelas
npx prisma db push

# Criar usuários
npx tsx criar-usuarios.ts
```

---

## 🔍 Verificar Configuração

Após configurar, verifique:

### 1. Verificar Schema Prisma

```powershell
# Ver qual provider está configurado
findstr "provider" prisma\schema.prisma
```

Deve mostrar:
- `provider = "sqlite"` (se escolheu SQLite)
- `provider = "postgresql"` (se escolheu PostgreSQL)

### 2. Verificar .env

```powershell
# Ver DATABASE_URL
findstr "DATABASE_URL" .env
```

Deve mostrar:
- `DATABASE_URL="file:./dev.db"` (SQLite)
- `DATABASE_URL="postgresql://..."` (PostgreSQL local)

### 3. Testar Conexão

```powershell
npx tsx verificar-usuarios.ts
```

Se funcionar, você verá os usuários ou uma mensagem de que não existem (normal se ainda não criou).

---

## 🎯 Credenciais Após Configurar

Depois de configurar o banco local e criar usuários:

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | `admin@cannabilize.com.br` | `admin123` |
| **Médico** | `doctor@cannabilize.com.br` | `doctor123` |
| **Paciente** | `paciente@cannabilize.com.br` | `paciente123` |

**URL:** http://localhost:3000/login

---

## ⚠️ Importante

### Backup do .env de Produção

Antes de alterar, **faça backup** do `.env` atual:

```powershell
copy .env .env.producao.backup
```

Assim você pode voltar para produção depois.

### Separar Ambientes

Para trabalhar com produção e local:

1. **Local:** Use `.env` com banco local
2. **Produção:** Use `.env.production` com banco Supabase

No deploy, a Vercel usa automaticamente `.env.production`.

---

## 🆘 Problemas Comuns

### Erro: "Cannot connect to database" (PostgreSQL)

**Solução:**
1. Verifique se PostgreSQL está rodando
2. Verifique se o banco existe: `psql -U postgres -l`
3. Verifique credenciais no `.env`

### Erro: "Database file not found" (SQLite)

**Solução:**
1. Execute `npx prisma db push` para criar o arquivo `dev.db`
2. Verifique permissões na pasta do projeto

### Erro: "Table already exists"

**Solução:**
- Normal se as tabelas já existem
- O `db push` vai sincronizar sem deletar dados

---

## 📝 Checklist

Antes de começar a desenvolver:

- [ ] Script `CONFIGURAR_BANCO_LOCAL.bat` executado
- [ ] Schema Prisma alterado (SQLite ou PostgreSQL)
- [ ] `.env` configurado com banco local
- [ ] `npx prisma generate` executado
- [ ] `npx prisma db push` executado
- [ ] `npx tsx criar-usuarios.ts` executado
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Login testado com sucesso

---

**Última atualização:** Janeiro 2026
