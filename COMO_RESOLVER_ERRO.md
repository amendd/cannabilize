# 🚨 Como Resolver o Erro de Execução de Scripts

## O Problema

Você está vendo este erro:
```
execução de scripts foi desabilitada neste sistema
```

## A Solução (Copie e Cole no Terminal)

Execute este comando no terminal do Cursor:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Quando perguntar, digite `S` e pressione Enter.** (Se nao perguntar, a politica ja foi aplicada — esta ok.)

## Depois, Execute o Script Novamente

```powershell
.\setup-cannabilize.ps1
```

---

## ⚡ Solução Rápida (Uma Linha)

Se quiser fazer tudo de uma vez, execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser; .\setup-cannabilize.ps1
```

---

## ❓ Por que isso acontece?

O Windows bloqueia a execução de scripts PowerShell por segurança. O comando acima permite que você execute scripts locais (como o nosso) de forma segura, apenas para o seu usuário.

---

**Pronto!** Isso deve resolver o problema. 🎯
