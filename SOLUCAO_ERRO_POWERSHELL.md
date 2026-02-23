# 🔧 Solução Rápida - Erro de Execução de Scripts PowerShell

## ❌ Erro que você está vendo:

```
.\setup-cannabilize.ps1 : O arquivo ... não pode ser carregado porque a execução de scripts foi desabilitada neste sistema.
```

## ✅ Solução (3 passos simples):

### Passo 1: Abra o terminal PowerShell no Cursor

### Passo 2: Execute este comando:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Passo 3: Quando perguntar, digite **S** e pressione Enter

```
Execution Policy Change
A política de execução ajuda a proteger você contra scripts não confiáveis. Você deseja realmente alterar a política de execução?
[S] Sim  [N] Não  [S] Suspender  [?] Ajuda (o padrão é "S"): S
```

## 🚀 Agora você pode executar o script:

```powershell
.\setup-cannabilize.ps1
```

---

## 📝 O que esse comando faz?

- **RemoteSigned**: Permite executar scripts locais (como o nosso) e exige assinatura para scripts baixados da internet
- **Scope CurrentUser**: Aplica apenas para o seu usuário (não precisa de permissões de administrador)
- **É seguro**: Não afeta outros usuários ou configurações do sistema

---

## 🔄 Alternativa (se ainda não funcionar):

Se ainda der erro, tente executar o script diretamente com bypass:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-cannabilize.ps1
```

---

**Pronto!** Agora você pode executar o script normalmente. 🎉
