# 🔧 Solução: Erro EPERM ao Gerar Prisma Client

## ❌ Problema

Erro: `EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp'`

**Causa:** O arquivo do Prisma está sendo usado por outro processo ou há problema de permissão.

---

## ✅ Solução Rápida

### Opção 1: Script Automatizado

**Duplo clique em:**
```
CORRIGIR_PERMISSAO_PRISMA.bat
```

**⚠️ IMPORTANTE:** Antes de executar:
1. **Feche o servidor** (se estiver rodando com `npm run dev`)
2. **Feche o Cursor/VS Code** temporariamente
3. Execute o script
4. Depois abra novamente

---

### Opção 2: Manual (Passo a Passo)

#### 1. Fechar Processos

**Feche:**
- Servidor Next.js (Ctrl+C no terminal)
- Cursor/VS Code (temporariamente)
- Qualquer processo Node.js rodando

#### 2. Limpar Cache do Prisma

```powershell
cd c:\Users\Gabriel\clickcannabis-replica

# Remover pasta .prisma
rmdir /s /q node_modules\.prisma

# Ou se não funcionar, delete manualmente a pasta:
# node_modules\.prisma
```

#### 3. Reinstalar Prisma

```powershell
npm install @prisma/client --save
```

#### 4. Gerar Prisma Client

```powershell
npx prisma generate
```

#### 5. Criar Tabelas

```powershell
npx prisma db push
```

#### 6. Criar Usuários

```powershell
npx tsx criar-usuarios.ts
```

---

## 🚨 Se Ainda Não Funcionar

### Solução 1: Executar como Administrador

1. Clique com botão direito em `CORRIGIR_PERMISSAO_PRISMA.bat`
2. Selecione **"Executar como administrador"**
3. Execute novamente

### Solução 2: Fechar Todos os Processos Node

1. Abra o **Gerenciador de Tarefas** (Ctrl+Shift+Esc)
2. Vá na aba **"Processos"**
3. Encontre todos os processos **Node.js**
4. Clique com botão direito → **"Finalizar tarefa"**
5. Tente novamente

### Solução 3: Desabilitar Antivírus Temporariamente

Alguns antivírus bloqueiam a criação/renomeação de arquivos `.dll.node`:

1. Desabilite temporariamente o antivírus
2. Execute `npx prisma generate`
3. Reabilite o antivírus

### Solução 4: Reinstalar Node Modules

Se nada funcionar:

```powershell
# Remover node_modules
rmdir /s /q node_modules

# Remover package-lock.json
del package-lock.json

# Reinstalar tudo
npm install

# Gerar Prisma Client
npx prisma generate
```

---

## 📋 Checklist de Verificação

Antes de tentar gerar o Prisma Client:

- [ ] Servidor Next.js está fechado
- [ ] Cursor/VS Code está fechado
- [ ] Nenhum processo Node.js rodando (verificar Task Manager)
- [ ] Pasta `node_modules\.prisma` foi removida
- [ ] Executando como Administrador (se necessário)

---

## 🎯 Sequência Completa Após Corrigir

Depois de resolver o erro de permissão:

1. ✅ `npx prisma generate` (gerar Prisma Client)
2. ✅ `npx prisma db push` (criar tabelas)
3. ✅ `npx tsx criar-usuarios.ts` (criar usuários)
4. ✅ `npm run dev` (iniciar servidor)
5. ✅ Acessar http://localhost:3000/login

---

## 💡 Dica: Prevenir no Futuro

Para evitar esse problema:

1. **Sempre feche o servidor** antes de executar `prisma generate`
2. **Use um terminal separado** para comandos Prisma
3. **Não deixe o servidor rodando** enquanto faz mudanças no schema

---

**Última atualização:** Janeiro 2026
