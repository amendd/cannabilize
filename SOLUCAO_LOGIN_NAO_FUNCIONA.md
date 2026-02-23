# 🔧 Solução: Login Não Funciona Após Criar Dados

## 🔍 Diagnóstico Passo a Passo

### **Passo 1: Verificar se os Dados Foram Criados**

Execute no PowerShell (na pasta do projeto):

```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npx tsx testar-login.ts
```

Este script vai verificar:
- ✅ Se os usuários existem no banco
- ✅ Se as senhas estão corretas
- ✅ Se há problemas de conexão

---

### **Passo 2: Se os Usuários Não Existem**

Execute novamente o script de criação:

```powershell
npx tsx criar-dados-completos.ts
```

**OU** duplo clique em: `CRIAR_DADOS_COMPLETOS.bat`

---

### **Passo 3: Verificar se o Servidor Está Rodando**

O servidor **DEVE estar rodando** para o login funcionar!

**Verificar:**
1. Abra o navegador em: http://localhost:3000
2. Se não carregar, o servidor não está rodando

**Iniciar servidor:**
```powershell
npm run dev
```

Ou use o script seguro:
```powershell
.\INICIAR_SEGURO.bat
```

---

### **Passo 4: Verificar Credenciais Corretas**

Use **EXATAMENTE** estas credenciais:

**Admin:**
- Email: `admin@cannabilize.com.br`
- Senha: `admin123`

**Médico:**
- Email: `doctor@cannabilize.com.br`
- Senha: `doctor123`

**⚠️ IMPORTANTE:**
- Use o domínio **cannabilize.com.br** (não clickcannabis.com)
- Senhas são **case-sensitive** (minúsculas)
- Sem espaços antes ou depois

---

### **Passo 5: Limpar Cache do Navegador**

O navegador pode estar com cache antigo:

1. **Chrome/Edge:**
   - Pressione `Ctrl + Shift + Delete`
   - Selecione "Cookies e outros dados do site"
   - Clique em "Limpar dados"

2. **Ou use Modo Anônimo:**
   - Pressione `Ctrl + Shift + N`
   - Tente fazer login novamente

---

### **Passo 6: Verificar Console do Navegador**

1. Abra a página de login: http://localhost:3000/login
2. Pressione `F12` para abrir DevTools
3. Vá na aba **Console**
4. Tente fazer login
5. Veja se há erros em vermelho

**Erros comuns:**
- `ECONNREFUSED` → Servidor não está rodando
- `401 Unauthorized` → Credenciais incorretas
- `500 Internal Server Error` → Problema no servidor/banco

---

### **Passo 7: Verificar Logs do Servidor**

No terminal onde o servidor está rodando, veja se há erros quando você tenta fazer login.

**Erros comuns:**
- `PrismaClientInitializationError` → Problema de conexão com banco
- `Error: Invalid credentials` → Senha não confere
- `Error: User not found` → Usuário não existe

---

## 🛠️ Soluções Rápidas

### **Solução 1: Recriar Tudo do Zero**

```powershell
# 1. Parar o servidor (Ctrl+C)

# 2. Recriar dados
npx tsx criar-dados-completos.ts

# 3. Reiniciar servidor
npm run dev

# 4. Tentar login novamente
```

### **Solução 2: Verificar Conexão com Banco**

```powershell
# Testar conexão
npx prisma db push
```

Se der erro, verifique o arquivo `.env`:
- `DATABASE_URL` está correto?
- O banco Supabase está ativo?

### **Solução 3: Verificar NEXTAUTH_SECRET**

O arquivo `.env` deve ter:
```env
NEXTAUTH_SECRET="click-cannabis-secret-2026-123456789"
NEXTAUTH_URL="http://localhost:3000"
```

Se mudou, pode causar problemas de autenticação.

---

## 📋 Checklist Completo

Execute este checklist na ordem:

- [ ] **Servidor está rodando?** (http://localhost:3000 carrega?)
- [ ] **Usuários foram criados?** (execute `npx tsx testar-login.ts`)
- [ ] **Credenciais estão corretas?** (admin@cannabilize.com.br / admin123)
- [ ] **Cache do navegador limpo?** (ou modo anônimo)
- [ ] **Console do navegador sem erros?** (F12 → Console)
- [ ] **Logs do servidor sem erros?** (verificar terminal)
- [ ] **Conexão com banco OK?** (execute `npx prisma db push`)

---

## 🆘 Se Nada Funcionar

1. **Pare o servidor** (Ctrl+C)
2. **Recrie os dados:**
   ```powershell
   npx tsx criar-dados-completos.ts
   ```
3. **Reinicie o servidor:**
   ```powershell
   npm run dev
   ```
4. **Limpe o cache do navegador**
5. **Tente login em modo anônimo**

---

## 💡 Dica Extra

Se você executou o script mas ainda não funciona, pode ser que:
- O script não completou (verifique se mostrou "✅ Dados criados com sucesso!")
- O banco foi resetado depois
- Há um problema de permissão no banco

**Execute o teste:**
```powershell
npx tsx testar-login.ts
```

Este script vai dizer **exatamente** qual é o problema!

---

**Execute o `testar-login.ts` primeiro para diagnosticar o problema!** 🔍
