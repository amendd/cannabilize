# 🔐 Solução Completa para Problemas de Login

## 🎯 Diagnóstico Rápido

Execute o script de diagnóstico completo:

```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npx tsx solucao-login-completa.ts
```

Este script vai:
1. ✅ Verificar conexão com banco de dados
2. ✅ Verificar estrutura do banco
3. ✅ Verificar usuários existentes
4. ✅ Criar/atualizar usuários necessários
5. ✅ Verificar configuração do NextAuth
6. ✅ Testar autenticação

---

## 📋 Problemas Comuns e Soluções

### ❌ Problema 1: "Email ou senha inválidos"

**Causa:** Usuários não existem no banco de dados ou senhas não estão configuradas.

**Solução:**
```powershell
npx tsx criar-usuarios.ts
```

Ou use o script completo:
```powershell
npx tsx solucao-login-completa.ts
```

**Credenciais padrão:**
- Admin: `admin@cannabilize.com.br` / `admin123`
- Médico: `doctor@cannabilize.com.br` / `doctor123`
- Paciente: `paciente@cannabilize.com.br` / `paciente123`

---

### ❌ Problema 2: "Error opening a TLS connection"

**Causa:** Problema com SSL/TLS na conexão com o banco de dados (Supabase/PostgreSQL).

**Solução:**

1. **Verifique a DATABASE_URL no arquivo `.env`:**

   Para Supabase, a URL deve incluir `?sslmode=require`:
   ```env
   DATABASE_URL="postgresql://postgres.xxxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
   ```

2. **Se ainda não funcionar, tente `sslmode=prefer`:**
   ```env
   DATABASE_URL="postgresql://postgres.xxxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=prefer"
   ```

3. **Verifique se a senha está codificada corretamente:**
   - Se a senha contém `@`, use `%40`
   - Se contém `#`, use `%23`
   - Se contém `%`, use `%25`
   - Se contém `/`, use `%2F`

---

### ❌ Problema 3: "Cannot connect to database"

**Causa:** Banco de dados não está acessível ou DATABASE_URL incorreta.

**Solução:**

1. **Verifique se o banco Supabase está ativo:**
   - Acesse https://supabase.com
   - Verifique se o projeto está ativo
   - Se estiver pausado, reative-o

2. **Verifique a DATABASE_URL:**
   ```env
   DATABASE_URL="postgresql://usuario:senha@host:porta/database?sslmode=require"
   ```

3. **Teste a conexão:**
   ```powershell
   npx prisma db push
   ```

---

### ❌ Problema 4: "NEXTAUTH_SECRET is missing"

**Causa:** Variável de ambiente NEXTAUTH_SECRET não está configurada.

**Solução:**

1. **Gere uma chave secreta:**
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Adicione no arquivo `.env`:**
   ```env
   NEXTAUTH_SECRET="sua-chave-gerada-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Reinicie o servidor:**
   ```powershell
   npm run dev
   ```

---

### ❌ Problema 5: Login funciona mas redireciona para página errada

**Causa:** Problema com redirecionamento baseado em role.

**Solução:**

O sistema redireciona automaticamente baseado no role:
- `ADMIN` → `/admin`
- `DOCTOR` → `/medico`
- `PATIENT` → `/paciente`

Se não estiver redirecionando corretamente, verifique:
1. Se o usuário tem o role correto no banco
2. Se a sessão está sendo criada corretamente
3. Limpe o cache do navegador

---

## 🔧 Passo a Passo Completo

### 1. Verificar Configuração do Banco

Certifique-se de que o arquivo `.env` contém:

```env
# Banco de Dados (Supabase)
DATABASE_URL="postgresql://postgres.xxxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Gerar Prisma Client

```powershell
npx prisma generate
```

### 3. Criar/Atualizar Tabelas

```powershell
npx prisma db push
```

### 4. Criar Usuários

```powershell
npx tsx solucao-login-completa.ts
```

### 5. Iniciar Servidor

```powershell
npm run dev
```

### 6. Testar Login

1. Acesse: http://localhost:3000/login
2. Use uma das credenciais:
   - Admin: `admin@cannabilize.com.br` / `admin123`
   - Médico: `doctor@cannabilize.com.br` / `doctor123`
   - Paciente: `paciente@cannabilize.com.br` / `paciente123`

---

## 🛠️ Scripts Úteis

### Verificar Usuários
```powershell
npx tsx verificar-usuarios.ts
```

### Criar Usuários
```powershell
npx tsx criar-usuarios.ts
```

### Diagnóstico Completo
```powershell
npx tsx solucao-login-completa.ts
```

---

## 📝 Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] Servidor está rodando (`npm run dev`)
- [ ] Arquivo `.env` existe e está configurado
- [ ] `DATABASE_URL` está correta e acessível
- [ ] `NEXTAUTH_SECRET` está configurado
- [ ] `NEXTAUTH_URL` está configurado
- [ ] Usuários foram criados no banco
- [ ] Tabelas do banco existem (`npx prisma db push`)
- [ ] Prisma Client foi gerado (`npx prisma generate`)
- [ ] Cache do navegador foi limpo

---

## 🆘 Se Nada Funcionar

1. **Execute o diagnóstico completo:**
   ```powershell
   npx tsx solucao-login-completa.ts
   ```

2. **Verifique os logs do servidor** para erros específicos

3. **Verifique os logs do navegador** (F12 → Console) para erros de JavaScript

4. **Teste a conexão com o banco:**
   ```powershell
   npx prisma studio
   ```
   Isso abre uma interface visual para verificar os dados no banco.

---

## 📞 Suporte

Se o problema persistir após seguir todos os passos:

1. Execute `npx tsx solucao-login-completa.ts` e copie a saída completa
2. Verifique os logs do servidor
3. Verifique os logs do navegador
4. Documente o erro exato que aparece

---

**Última atualização:** Janeiro 2026
