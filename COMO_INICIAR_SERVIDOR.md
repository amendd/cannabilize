# 🚀 Como Iniciar o Servidor

## ✅ Opções Disponíveis

### **Opção 1: INICIAR_SIMPLES.bat (Mais Rápido) ⭐**

**Duplo clique em:**
```
INICIAR_SIMPLES.bat
```

**O que faz:**
- ✅ Inicia o servidor diretamente
- ✅ Simples e rápido
- ⚠️ Não verifica nada antes

**Use quando:** Você já tem tudo configurado e só quer iniciar o servidor.

---

### **Opção 2: INICIAR_SEGURO.bat (Recomendado) ⭐⭐⭐**

**Duplo clique em:**
```
INICIAR_SEGURO.bat
```

**O que faz:**
- ✅ Verifica se está na pasta correta
- ✅ Verifica Node.js
- ✅ Verifica dependências
- ✅ Gera Prisma Client
- ✅ Verifica porta 3000
- ✅ Inicia o servidor

**Use quando:** Primeira vez ou se algo não está funcionando.

---

### **Opção 3: Comando Direto (PowerShell)**

Abra o PowerShell na pasta do projeto e execute:

```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npm run dev
```

**Use quando:** Prefere usar o terminal diretamente.

---

## 📋 Qual Usar?

### **Primeira Vez ou Após Mudanças:**
```
INICIAR_SEGURO.bat
```

### **Uso Diário (Tudo Já Configurado):**
```
INICIAR_SIMPLES.bat
```

### **Desenvolvimento (Terminal):**
```powershell
npm run dev
```

---

## 🎯 Passo a Passo Completo

### **1. Primeira Vez (Configuração Inicial)**

1. **Criar banco e dados:**
   ```
   CRIAR_BANCO_CORRIGIDO.bat
   ```

2. **Iniciar servidor:**
   ```
   INICIAR_SEGURO.bat
   ```

3. **Acessar:**
   - http://localhost:3000
   - Login: `admin@cannabilize.com.br` / `admin123`

### **2. Uso Diário (Já Configurado)**

1. **Iniciar servidor:**
   ```
   INICIAR_SIMPLES.bat
   ```

2. **Aguardar aparecer:**
   ```
   ✓ Ready in 2.5s
   ○ Local:        http://localhost:3000
   ```

3. **Acessar no navegador:**
   ```
   http://localhost:3000
   ```

---

## ⚠️ Importante

### **Sempre Pare o Servidor Antes de:**
- Executar `prisma generate`
- Executar `prisma db push`
- Fazer mudanças no banco

**Para parar:** Pressione `Ctrl+C` no terminal

---

## 🔍 Verificar se Está Rodando

1. **Abra o navegador:**
   ```
   http://localhost:3000
   ```

2. **Se carregar:** Servidor está rodando ✅

3. **Se não carregar:** Servidor não está rodando ❌

---

## 🆘 Problemas Comuns

### **Erro: "Porta 3000 em uso"**

**Solução:**
1. Pare o servidor anterior (Ctrl+C)
2. Ou execute: `LIBERAR_PORTA_3000.bat`

### **Erro: "Cannot find module"**

**Solução:**
```powershell
npm install
```

### **Erro: "Prisma Client not generated"**

**Solução:**
```powershell
npx prisma generate
```

---

## 📝 Resumo Rápido

**Iniciar servidor:**
- Duplo clique: `INICIAR_SIMPLES.bat` ⭐
- Ou: `npm run dev` no PowerShell

**Parar servidor:**
- Pressione `Ctrl+C` no terminal

**Acessar:**
- http://localhost:3000

---

**Use `INICIAR_SIMPLES.bat` para iniciar rapidamente!** 🚀
