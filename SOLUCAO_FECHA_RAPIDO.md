# 🔧 Solução: Script Fecha Rápido

## ❌ Problema
O arquivo `EXECUTAR.bat` fecha imediatamente sem mostrar erros.

## ✅ Soluções

### **Solução 1: Usar Modo Debug (RECOMENDADO)**

Duplo clique em: **`EXECUTAR_DEBUG.bat`**

Este script:
- ✅ Mostra TODOS os erros
- ✅ Não fecha automaticamente
- ✅ Permite ver o que está acontecendo

---

### **Solução 2: Verificar Problemas Primeiro**

Duplo clique em: **`VERIFICAR_PROBLEMAS.bat`**

Este script verifica:
- ✅ Se Node.js está instalado
- ✅ Se está na pasta correta
- ✅ Se dependências estão instaladas
- ✅ Se porta 3000 está livre
- ✅ Se arquivos necessários existem

---

### **Solução 3: Executar Manualmente (PowerShell)**

Abra o **PowerShell** na pasta do projeto e execute:

```bash
# 1. Ir para a pasta
cd C:\Users\Gabriel\clickcannabis-replica

# 2. Verificar se está na pasta certa
dir package.json

# 3. Instalar dependências (se necessário)
npm install

# 4. Configurar banco
npx prisma generate
npx prisma db push

# 5. Iniciar servidor
npm run dev
```

**O PowerShell não fecha automaticamente** e mostra todos os erros!

---

## 🔍 Por que fecha rápido?

O script fecha quando:
1. Encontra um erro e não tem `pause` antes do `exit`
2. O comando falha silenciosamente
3. Há um problema de sintaxe no script

---

## ✅ Scripts Disponíveis

1. **`EXECUTAR_DEBUG.bat`** ← Use este (mostra todos os erros)
2. **`VERIFICAR_PROBLEMAS.bat`** ← Verifica o que está errado
3. **`EXECUTAR.bat`** ← Versão normal (pode fechar se houver erro)

---

## 🎯 Passo a Passo Recomendado

### **1. Verificar Problemas:**
```
Duplo clique em: VERIFICAR_PROBLEMAS.bat
```
Anote os erros que aparecerem.

### **2. Corrigir Problemas:**
- Se Node.js não encontrado → Instale Node.js
- Se package.json não encontrado → Vá para pasta correta
- Se node_modules não existe → Execute `npm install`

### **3. Executar em Modo Debug:**
```
Duplo clique em: EXECUTAR_DEBUG.bat
```
Este não fecha e mostra todos os erros.

---

## 📝 Checklist Antes de Executar

- [ ] Node.js está instalado? (`node --version`)
- [ ] Está na pasta correta? (`C:\Users\Gabriel\clickcannabis-replica`)
- [ ] Arquivo `package.json` existe?
- [ ] Pasta `node_modules` existe? (se não, execute `npm install`)

---

## 🆘 Se Ainda Fechar

1. Abra o **PowerShell** (não CMD)
2. Navegue até a pasta: `cd C:\Users\Gabriel\clickcannabis-replica`
3. Execute: `npm run dev`
4. O PowerShell **não fecha** e mostra todos os erros

---

**Use `EXECUTAR_DEBUG.bat` para ver todos os erros!** 🔍
