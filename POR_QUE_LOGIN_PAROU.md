# 🔍 Por Que o Login Parou de Funcionar?

## ❌ O Que Aconteceu?

O problema mais provável é que **os usuários foram deletados do banco de dados**. Isso pode ter acontecido por alguns motivos:

### **Causa 1: Script EXECUTAR.bat (Mais Provável) ⚠️**

O arquivo `EXECUTAR.bat` contém este comando na linha 106:

```batch
call npx prisma db push --accept-data-loss
```

**O que isso faz:**
- `db push` sincroniza o schema do Prisma com o banco de dados
- `--accept-data-loss` **permite deletar dados** se houver conflitos
- Se o schema mudou ou houve algum conflito, **os dados podem ser perdidos**

**Quando acontece:**
- Se você executou o `EXECUTAR.bat` recentemente
- Se o schema Prisma foi modificado
- Se houve alguma mudança no banco de dados

### **Causa 2: Banco Supabase Resetado**

Se você está usando Supabase (PostgreSQL na nuvem):
- O banco pode ter sido resetado manualmente
- Pode ter expirado (se for plano gratuito com inatividade)
- Pode ter sido deletado e recriado

### **Causa 3: Migração ou Atualização**

- Alguém executou `npx prisma migrate reset` (deleta tudo)
- Alguém executou `npx prisma db push --force-reset`
- Uma migração deletou dados acidentalmente

---

## ✅ Como Verificar o Que Aconteceu

Execute este comando para verificar se os usuários existem:

```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npx tsx verificar-usuarios.ts
```

Isso vai mostrar:
- Quantos usuários existem no banco
- Se o admin e médico existem
- Se eles têm senhas configuradas

---

## 🔧 Solução Imediata

**Criar os usuários novamente:**

```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npx tsx criar-usuarios.ts
```

Ou duplo clique em: `CRIAR_USUARIOS.bat`

---

## 🛡️ Como Prevenir no Futuro

### **1. Não Use `db push --accept-data-loss` em Produção**

O flag `--accept-data-loss` é perigoso! Use apenas em desenvolvimento.

**Melhor opção:** Use migrações formais:
```bash
npx prisma migrate dev --name nome_da_migracao
```

### **2. Use o Script INICIAR_SIMPLES.bat**

Criei um script mais seguro (`INICIAR_SIMPLES.bat`) que **não** executa `db push` automaticamente.

### **3. Faça Backup Regular**

Se você tem dados importantes, faça backup antes de executar comandos que modificam o banco:

```bash
# Exportar dados (se usar PostgreSQL)
pg_dump $DATABASE_URL > backup.sql

# Ou usar Prisma Studio para exportar manualmente
npx prisma studio
```

### **4. Verifique Antes de Executar Scripts**

Sempre leia o que os scripts `.bat` fazem antes de executá-los, especialmente se eles contêm:
- `db push`
- `migrate reset`
- `--accept-data-loss`
- `--force-reset`

---

## 📋 Checklist: O Que Fazer Agora

1. ✅ **Verificar usuários:**
   ```powershell
   npx tsx verificar-usuarios.ts
   ```

2. ✅ **Criar usuários novamente:**
   ```powershell
   npx tsx criar-usuarios.ts
   ```

3. ✅ **Testar login:**
   - Acesse: http://localhost:3000/login
   - Use: `admin@cannabilize.com.br` / `admin123`

4. ✅ **Prevenir no futuro:**
   - Use `INICIAR_SIMPLES.bat` ao invés de `EXECUTAR.bat`
   - Ou execute `npm run dev` diretamente

---

## 🔄 Se Isso Acontecer Novamente

1. Execute `verificar-usuarios.ts` para diagnosticar
2. Execute `criar-usuarios.ts` para recriar
3. Considere fazer backup do banco antes de mudanças

---

## 💡 Dica Extra

Se você quiser que os usuários sejam criados automaticamente sempre que o servidor iniciar, posso criar um script que verifica e cria os usuários se não existirem. Quer que eu faça isso?

---

**Resumo:** O `EXECUTAR.bat` provavelmente executou `db push --accept-data-loss` que deletou os usuários. Execute `criar-usuarios.ts` para recriá-los! 🎯
