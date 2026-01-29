# 🔧 Solução Final: Script Fecha Rápido

## ❌ Problema
O `INICIAR_SITE.bat` abre e fecha imediatamente, sem mostrar erros.

## ✅ Soluções (Tente nesta ordem)

### **Solução 1: Diagnóstico Completo (PRIMEIRO)**

Duplo clique em: **`DIAGNOSTICO_COMPLETO.bat`**

Este script:
- ✅ Verifica TUDO (Node.js, dependências, schema, banco, porta)
- ✅ Mostra TODOS os erros
- ✅ Tenta corrigir automaticamente
- ✅ **NÃO FECHA** automaticamente

**Anote os erros que aparecerem!**

---

### **Solução 2: Executar pelo PowerShell (NUNCA FECHA)**

Duplo clique em: **`EXECUTAR_POWERSHELL.bat`**

Este script:
- ✅ Abre PowerShell (não fecha automaticamente)
- ✅ Executa o servidor diretamente
- ✅ Mostra todos os erros
- ✅ Permanece aberto

**O PowerShell NUNCA fecha automaticamente!**

---

### **Solução 3: Executar Manualmente (100% GARANTIDO)**

1. Abra o **PowerShell** (não CMD)
2. Digite:
```powershell
cd C:\Users\Gabriel\clickcannabis-replica
npm run dev
```

**O PowerShell mostra TODOS os erros e NUNCA fecha!**

---

## 🔍 Por que fecha rápido?

O script fecha quando:
1. Encontra um erro crítico (ex: Node.js não encontrado)
2. Falha na validação do schema
3. Erro ao gerar Prisma Client
4. Erro ao criar banco de dados
5. Problema de sintaxe no script

---

## 📋 Scripts Disponíveis

| Script | O que faz |
|--------|-----------|
| **`DIAGNOSTICO_COMPLETO.bat`** | ⭐ Verifica TUDO e mostra erros |
| **`EXECUTAR_POWERSHELL.bat`** | ⭐ Executa pelo PowerShell (nunca fecha) |
| `INICIAR_SITE.bat` | Versão melhorada (pode ainda fechar se houver erro crítico) |
| `TESTAR_PRIMEIRO.bat` | Valida antes de executar |

---

## 🎯 Passo a Passo Recomendado

### **1. Execute Diagnóstico:**
```
Duplo clique em: DIAGNOSTICO_COMPLETO.bat
```

### **2. Anote os Erros:**
- Se aparecer erro, anote qual foi
- Tire print se necessário

### **3. Execute pelo PowerShell:**
```
Duplo clique em: EXECUTAR_POWERSHELL.bat
```

**OU** execute manualmente:
```powershell
cd C:\Users\Gabriel\clickcannabis-replica
npm run dev
```

---

## 🆘 Se Ainda Não Funcionar

### **Opção A: PowerShell Manual (100% Garantido)**

1. Pressione **Windows + X**
2. Escolha **"Windows PowerShell"** ou **"Terminal"**
3. Digite:
```powershell
cd C:\Users\Gabriel\clickcannabis-replica
npm run dev
```

**O PowerShell mostra TODOS os erros e NUNCA fecha!**

### **Opção B: CMD Manual**

1. Pressione **Windows + R**
2. Digite: `cmd`
3. Digite:
```cmd
cd C:\Users\Gabriel\clickcannabis-replica
npm run dev
```

---

## 📝 Checklist

Antes de executar, verifique:

- [ ] Node.js instalado? (`node --version`)
- [ ] Está na pasta correta? (`C:\Users\Gabriel\clickcannabis-replica`)
- [ ] `package.json` existe?
- [ ] Dependências instaladas? (`node_modules` existe)
- [ ] Schema Prisma válido? (execute `DIAGNOSTICO_COMPLETO.bat`)

---

## ✅ Resumo

**Use este:** `EXECUTAR_POWERSHELL.bat`

**OU execute manualmente pelo PowerShell:**
```powershell
cd C:\Users\Gabriel\clickcannabis-replica
npm run dev
```

**O PowerShell NUNCA fecha e mostra TODOS os erros!** 🚀

---

**Execute `EXECUTAR_POWERSHELL.bat` ou use PowerShell manualmente!** ✅
