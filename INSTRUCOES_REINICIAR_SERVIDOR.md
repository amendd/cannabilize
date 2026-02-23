# 🔄 Como Reiniciar o Servidor Next.js

## ⚠️ Problema: PowerShell bloqueando scripts

Se você viu o erro:
```
O arquivo C:\Program Files\nodejs\npm.ps1 não pode ser carregado porque a execução de scripts foi desabilitada neste sistema.
```

Isso significa que o PowerShell está bloqueando a execução de scripts por segurança.

---

## ✅ Solução Rápida (Mais Fácil)

### Opção 1: Usar o arquivo `.bat` (Recomendado)

1. **Clique duas vezes no arquivo `reiniciar-servidor.bat`** na pasta do projeto
2. Ele vai:
   - Parar o servidor (se estiver rodando)
   - Limpar o cache
   - Reiniciar o servidor automaticamente

**Pronto!** Não precisa digitar nada no PowerShell.

---

### Opção 2: Usar Prompt de Comando (CMD) ao invés de PowerShell

1. Pressione `Windows + R`
2. Digite: `cmd` e pressione Enter
3. No CMD, digite:
   ```cmd
   cd c:\Users\Gabriel\clickcannabis-replica
   ```
4. Depois:
   ```cmd
   rmdir /s /q .next
   ```
5. E por fim:
   ```cmd
   npm run dev
   ```

O CMD não tem essa restrição de política de execução!

---

## 🔧 Solução Permanente: Habilitar PowerShell

Se você quiser usar o PowerShell normalmente:

### Passo 1: Abrir PowerShell como Administrador

1. Pressione `Windows + X`
2. Escolha **"Windows PowerShell (Admin)"** ou **"Terminal (Admin)"**
3. Se pedir permissão, clique em **"Sim"**

### Passo 2: Executar o comando

No PowerShell que abriu como Administrador, digite:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. Pressione Enter
4. Se perguntar se deseja continuar, digite `S` (Sim) e pressione Enter

### Passo 3: Fechar e abrir um novo PowerShell

Agora você pode usar o PowerShell normalmente!

---

## 📝 Comandos para Reiniciar o Servidor

Depois de resolver o problema do PowerShell, use estes comandos:

### 1. Parar o servidor (se estiver rodando)
- No terminal onde o servidor está rodando, pressione `Ctrl + C`

### 2. Limpar cache
```powershell
cd c:\Users\Gabriel\clickcannabis-replica
Remove-Item -Recurse -Force .next
```

### 3. Reiniciar servidor
```powershell
npm run dev
```

---

## 🎯 Resumo Rápido

**Mais fácil:** Use o arquivo `reiniciar-servidor.bat` (clique duas vezes)

**Ou:** Use o CMD ao invés do PowerShell (não tem restrições)

**Ou:** Habilite o PowerShell como Administrador (solução permanente)

---

## ❓ Dúvidas?

- **O que é PowerShell?** É o terminal moderno do Windows
- **O que é CMD?** É o terminal antigo do Windows (mais simples)
- **Qual usar?** Para este caso, tanto faz! Use o que for mais fácil para você.
