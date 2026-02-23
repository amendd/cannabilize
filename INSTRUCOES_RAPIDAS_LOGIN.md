# 🚀 Solução Rápida para Problema de Login

## ⚡ Solução em 3 Passos

### 1️⃣ Executar Script de Correção

**Opção A - Script Automatizado (Recomendado):**
```
Duplo clique em: CORRIGIR_LOGIN.bat
```

**Opção B - Manual:**
```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npx tsx criar-usuarios.ts
```

### 2️⃣ Verificar Configuração do .env

Certifique-se de que o arquivo `.env` contém:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@host:porta/database?sslmode=require"

# NextAuth (OBRIGATÓRIO)
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

**Se NEXTAUTH_SECRET não existir, gere uma:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copie o resultado e adicione no `.env`:
```env
NEXTAUTH_SECRET="cole-a-chave-gerada-aqui"
```

### 3️⃣ Reiniciar o Servidor

```powershell
# Parar o servidor (Ctrl+C) e iniciar novamente:
npm run dev
```

---

## 🔑 Credenciais para Login

Após executar o script, use:

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | `admin@cannabilize.com.br` | `admin123` |
| **Médico** | `doctor@cannabilize.com.br` | `doctor123` |
| **Paciente** | `paciente@cannabilize.com.br` | `paciente123` |

**URL de Login:** http://localhost:3000/login

---

## ❌ Se Ainda Não Funcionar

### Erro: "Error opening a TLS connection"

**Problema:** Configuração SSL do banco de dados.

**Solução:**
1. Verifique se a `DATABASE_URL` no `.env` inclui `?sslmode=require`
2. Se usar Supabase, use a porta **6543** (pooler):
   ```
   postgresql://postgres.xxxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
   ```
3. Se a senha contém caracteres especiais, codifique-os:
   - `@` → `%40`
   - `#` → `%23`
   - `%` → `%25`

### Erro: "Email ou senha inválidos"

**Problema:** Usuários não existem no banco.

**Solução:**
```powershell
npx tsx criar-usuarios.ts
```

### Erro: "NEXTAUTH_SECRET is missing"

**Problema:** Variável de ambiente não configurada.

**Solução:**
1. Gere uma chave (veja passo 2 acima)
2. Adicione no `.env`
3. Reinicie o servidor

---

## 📋 Checklist Rápido

Antes de tentar fazer login, verifique:

- [ ] Script `criar-usuarios.ts` foi executado
- [ ] Arquivo `.env` existe e está configurado
- [ ] `DATABASE_URL` está correta e acessível
- [ ] `NEXTAUTH_SECRET` está no `.env`
- [ ] `NEXTAUTH_URL` está no `.env`
- [ ] Servidor está rodando (`npm run dev`)
- [ ] Cache do navegador foi limpo (Ctrl+Shift+Delete)

---

## 🆘 Ajuda Adicional

Para diagnóstico completo, execute:
```powershell
npx tsx solucao-login-completa.ts
```

Ou leia o guia completo: `SOLUCAO_LOGIN_COMPLETA.md`

---

**Última atualização:** Janeiro 2026
