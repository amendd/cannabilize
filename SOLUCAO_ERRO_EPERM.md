# 🔧 Solução: Erro EPERM ao Gerar Prisma Client

## ❌ Problema

Erro ao executar `npx prisma generate`:
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node'
[ERRO] Falha ao gerar Prisma Client
```

**Causa:** O servidor Next.js está rodando e usando o Prisma Client, impedindo a atualização.

---

## ✅ Solução Rápida

### **Método 1: Script Corrigido (Recomendado)**

Duplo clique em:
```
CRIAR_BANCO_CORRIGIDO.bat
```

Este script:
1. ✅ Para o servidor automaticamente
2. ✅ Limpa o cache do Prisma
3. ✅ Gera o Prisma Client
4. ✅ Cria as tabelas
5. ✅ Cria os dados

### **Método 2: Manual (Passo a Passo)**

1. **Parar o servidor:**
   - Se estiver rodando, pressione `Ctrl+C` no terminal
   - Ou feche o terminal onde o servidor está rodando

2. **Fechar VS Code (opcional, mas recomendado):**
   - Salve todos os arquivos
   - Feche o VS Code completamente

3. **Executar comandos:**
   ```powershell
   cd c:\Users\Gabriel\clickcannabis-replica
   
   # Limpar cache
   rmdir /s /q node_modules\.prisma
   
   # Gerar Prisma Client
   npx prisma generate
   
   # Criar tabelas
   npx prisma db push --accept-data-loss
   
   # Criar dados
   npx tsx criar-dados-completos.ts
   ```

### **Método 3: Executar como Administrador**

1. Clique com botão direito em `CRIAR_BANCO_CORRIGIDO.bat`
2. Selecione "Executar como administrador"
3. Aguarde a conclusão

---

## 🔍 Por Que Isso Acontece?

O erro `EPERM` (Error PERMission) acontece quando:

1. **Servidor está rodando** - O Next.js está usando o Prisma Client
2. **Arquivo está em uso** - Outro processo está usando o arquivo
3. **Permissões insuficientes** - Windows bloqueia a operação

---

## 📋 Checklist de Solução

Execute na ordem:

1. [ ] **Parar servidor** (Ctrl+C ou fechar terminal)
2. [ ] **Fechar VS Code** (opcional, mas ajuda)
3. [ ] **Executar script corrigido:**
   ```
   CRIAR_BANCO_CORRIGIDO.bat
   ```
4. [ ] **Verificar se funcionou:**
   - Não deve mostrar erro de EPERM
   - Deve mostrar "[OK] Prisma Client gerado"
5. [ ] **Iniciar servidor novamente:**
   ```powershell
   npm run dev
   ```

---

## 🆘 Se Ainda Não Funcionar

### **Solução 1: Reiniciar Computador**

Às vezes o Windows mantém arquivos "travados". Reiniciar resolve.

### **Solução 2: Deletar Manualmente**

1. Feche tudo (servidor, VS Code)
2. Delete a pasta:
   ```
   node_modules\.prisma
   ```
3. Execute novamente:
   ```powershell
   npx prisma generate
   ```

### **Solução 3: Usar PowerShell como Admin**

1. Abra PowerShell como Administrador
2. Navegue até a pasta:
   ```powershell
   cd c:\Users\Gabriel\clickcannabis-replica
   ```
3. Execute:
   ```powershell
   npx prisma generate
   npx prisma db push --accept-data-loss
   npx tsx criar-dados-completos.ts
   ```

---

## 💡 Dica: Sempre Pare o Servidor Antes

**Regra de ouro:** Sempre pare o servidor (`Ctrl+C`) antes de:
- Executar `prisma generate`
- Executar `prisma db push`
- Executar `prisma migrate`

Isso evita erros de permissão!

---

## 📝 Resumo

**Problema:** Erro EPERM ao gerar Prisma Client  
**Causa:** Servidor está rodando  
**Solução:** Parar servidor → Executar `CRIAR_BANCO_CORRIGIDO.bat`

**Execute o script corrigido que para o servidor automaticamente!** 🎯
