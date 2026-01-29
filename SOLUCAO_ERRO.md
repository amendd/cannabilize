# 🔧 Solução: ERR_CONNECTION_REFUSED

## ❌ Problema
Você está vendo o erro: **"Não é possível acessar esse site - A conexão com localhost foi recusada"**

Isso significa que o **servidor não está rodando**.

---

## ✅ Soluções (Tente nesta ordem)

### **Solução 1: Executar o Script de Correção (RECOMENDADO)**

1. Vá até: `C:\Users\Gabriel\clickcannabis-replica`
2. **Duplo clique** em: `CORRIGIR_E_EXECUTAR.bat`
3. Aguarde o script fazer tudo
4. O servidor iniciará automaticamente

---

### **Solução 2: Manual (Passo a Passo)**

Abra o **PowerShell** ou **CMD** na pasta do projeto e execute:

```bash
# 1. Ir para a pasta
cd C:\Users\Gabriel\clickcannabis-replica

# 2. Instalar dependências (se ainda não fez)
npm install

# 3. Configurar banco
npx prisma generate
npx prisma db push

# 4. Iniciar servidor
npm run dev
```

Você deve ver uma mensagem como:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

**Só então** abra o navegador em http://localhost:3000

---

### **Solução 3: Verificar o que está errado**

Execute o arquivo: `DIAGNOSTICO.bat`

Ele vai verificar:
- ✅ Se Node.js está instalado
- ✅ Se as dependências estão instaladas
- ✅ Se a porta 3000 está livre
- ✅ Se os arquivos estão corretos

---

## 🔍 Causas Comuns

### 1. **Servidor não foi iniciado**
- **Solução:** Execute `npm run dev` ou `CORRIGIR_E_EXECUTAR.bat`

### 2. **Porta 3000 já está em uso**
- **Solução:** O script `CORRIGIR_E_EXECUTAR.bat` fecha processos na porta 3000 automaticamente
- **Ou manualmente:** Feche outros programas usando a porta 3000

### 3. **Dependências não instaladas**
- **Solução:** Execute `npm install`

### 4. **Node.js não instalado**
- **Solução:** Instale de https://nodejs.org/

### 5. **Pasta errada**
- **Solução:** Certifique-se de estar em `C:\Users\Gabriel\clickcannabis-replica`

---

## 📋 Checklist Rápido

Antes de acessar http://localhost:3000, verifique:

- [ ] Node.js está instalado? (`node --version`)
- [ ] Você executou `npm install`?
- [ ] Você executou `npm run dev`?
- [ ] O terminal mostra "Ready" ou "Local: http://localhost:3000"?
- [ ] Não há erros no terminal?

**Se todas as respostas forem SIM, então pode acessar o site!**

---

## 🎯 Método Mais Fácil

**Simplesmente execute:**
```
CORRIGIR_E_EXECUTAR.bat
```

Este script:
- ✅ Verifica tudo
- ✅ Corrige problemas
- ✅ Instala dependências
- ✅ Configura banco
- ✅ Inicia o servidor automaticamente

---

## ⚠️ Importante

**O servidor precisa estar RODANDO** para você acessar o site!

Você deve ver no terminal algo como:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

**Só então** abra o navegador.

---

## 🆘 Ainda não funciona?

1. Execute `DIAGNOSTICO.bat` para ver o que está errado
2. Verifique se há erros no terminal
3. Tente fechar e abrir o terminal novamente
4. Reinicie o computador (às vezes ajuda)

---

**Execute `CORRIGIR_E_EXECUTAR.bat` e aguarde!** 🚀
