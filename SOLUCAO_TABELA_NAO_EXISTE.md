# 🔧 Solução: Tabela `public.users` Não Existe

## ❌ Problema Identificado

O erro mostra claramente:
```
prisma:error Invalid `prisma.user.findUnique()` invocation:
The table `public.users` does not exist in the current database.
```

**Isso significa:** As tabelas do banco de dados não foram criadas!

---

## ✅ Solução: Criar as Tabelas

### **Método 1: Script Automatizado (Recomendado)**

Duplo clique em:
```
CRIAR_BANCO_E_DADOS.bat
```

Este script vai:
1. ✅ Gerar o Prisma Client
2. ✅ Criar todas as tabelas no banco
3. ✅ Criar os usuários e dados

### **Método 2: Manual (Passo a Passo)**

Execute no PowerShell (na pasta do projeto):

```powershell
cd c:\Users\Gabriel\clickcannabis-replica

# 1. Gerar Prisma Client
npx prisma generate

# 2. Criar tabelas no banco
npx prisma db push --accept-data-loss

# 3. Criar dados (usuários, medicamentos, etc)
npx tsx criar-dados-completos.ts
```

---

## 🔍 Por Que Isso Aconteceu?

Possíveis causas:

1. **Banco foi resetado** - Alguém resetou o banco Supabase
2. **Schema mudou** - O schema Prisma mudou mas as tabelas não foram atualizadas
3. **Primeira execução** - As tabelas nunca foram criadas
4. **Migração falhou** - Uma migração anterior falhou

---

## 📋 Checklist Completo

Execute na ordem:

1. [ ] **Criar tabelas:**
   ```powershell
   npx prisma db push --accept-data-loss
   ```

2. [ ] **Criar dados:**
   ```powershell
   npx tsx criar-dados-completos.ts
   ```

3. [ ] **Verificar se funcionou:**
   ```powershell
   node verificar-login-simples.js
   ```

4. [ ] **Iniciar servidor:**
   ```powershell
   npm run dev
   ```

5. [ ] **Testar login:**
   - Acesse: http://localhost:3000/login
   - Use: `admin@cannabilize.com.br` / `admin123`

---

## ⚠️ Importante

O comando `npx prisma db push --accept-data-loss` vai:
- ✅ Criar todas as tabelas necessárias
- ⚠️ **Pode deletar dados existentes** se houver conflitos
- ✅ Sincronizar o schema com o banco

Se você tem dados importantes, faça backup antes!

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique a conexão:**
   ```powershell
   npx prisma db push
   ```
   
   Se der erro de conexão, verifique o `.env`:
   - `DATABASE_URL` está correto?
   - O banco Supabase está ativo?

2. **Verifique se as tabelas foram criadas:**
   ```powershell
   npx prisma studio
   ```
   
   Isso abre uma interface visual do banco. Veja se as tabelas aparecem.

3. **Recrie tudo do zero:**
   ```powershell
   npx prisma db push --force-reset
   npx tsx criar-dados-completos.ts
   ```

---

## 📝 Resumo

**Problema:** Tabelas não existem no banco  
**Solução:** Executar `npx prisma db push`  
**Depois:** Criar dados com `npx tsx criar-dados-completos.ts`

**Execute o `CRIAR_BANCO_E_DADOS.bat` para resolver tudo de uma vez!** 🎯
