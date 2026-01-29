# 🔧 Solução: Erro de Política PowerShell

## ❌ Problema Identificado

O erro mostra:
```
npm : O arquivo C:\Program Files\nodejs\npm.ps1 não pode ser carregado 
porque a execução de scripts foi desabilitada neste sistema.
```

**Isso significa que o PowerShell está bloqueando a execução de scripts do npm.**

---

## ✅ Soluções (Escolha uma)

### **Solução 1: Usar CMD Direto (MAIS FÁCIL - RECOMENDADO)**

Duplo clique em: **`EXECUTAR_CMD.bat`**

Este script:
- ✅ Usa CMD (não PowerShell)
- ✅ Não precisa alterar política
- ✅ Funciona imediatamente
- ✅ Libera porta 3000 automaticamente

**Esta é a solução mais simples!**

---

### **Solução 2: Liberar Porta e Executar**

Duplo clique em: **`LIBERAR_PORTA_E_EXECUTAR.bat`**

Este script:
- ✅ Libera porta 3000 primeiro
- ✅ Depois executa o servidor
- ✅ Usa CMD (não PowerShell)

---

### **Solução 3: Corrigir Política PowerShell**

Se quiser usar PowerShell:

1. **Clique com botão direito** em: `CORRIGIR_POLITICA_POWERSHELL.bat`
2. Escolha: **"Executar como administrador"**
3. Aguarde concluir
4. Depois execute: `EXECUTAR_POWERSHELL.bat`

---

## 🎯 Solução Recomendada

**Use este:** `EXECUTAR_CMD.bat`

**OU este:** `LIBERAR_PORTA_E_EXECUTAR.bat`

Ambos usam CMD e não precisam alterar política do PowerShell!

---

## 📋 Scripts Disponíveis

| Script | O que faz |
|--------|-----------|
| **`EXECUTAR_CMD.bat`** | ⭐ Usa CMD (não PowerShell) - RECOMENDADO |
| **`LIBERAR_PORTA_E_EXECUTAR.bat`** | ⭐ Libera porta e executa |
| `CORRIGIR_POLITICA_POWERSHELL.bat` | Corrige política PowerShell (precisa admin) |
| `EXECUTAR_POWERSHELL.bat` | Usa PowerShell (só funciona após corrigir política) |

---

## 🔍 Por que acontece?

O Windows bloqueia scripts PowerShell por segurança. O npm tenta executar `npm.ps1` que é bloqueado.

**Solução:** Usar CMD ao invés de PowerShell, ou habilitar política.

---

## ✅ Resumo

**Use:** `EXECUTAR_CMD.bat`

Este script:
- ✅ Não usa PowerShell
- ✅ Não precisa alterar política
- ✅ Funciona imediatamente
- ✅ Libera porta 3000 automaticamente

---

**Execute `EXECUTAR_CMD.bat` - deve funcionar agora!** 🚀
