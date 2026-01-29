# Enviar o código para o GitHub (repositório vazio)

Siga estes passos **no terminal** (PowerShell, CMD ou Git Bash), na **pasta do projeto** (`clickcannabis-replica`).

---

## 1. Abrir a pasta do projeto

```bash
cd c:\Users\Gabriel\clickcannabis-replica
```

---

## 2. Inicializar o Git (se ainda não for um repositório)

```bash
git init
```

*(Se aparecer "reinitialized" ou "already exists", o repositório já existe — pule para o passo 3.)*

---

## 3. Conectar ao repositório no GitHub

Substitua `amendd/cannabilis` pela sua conta e nome do repositório, se for diferente:

```bash
git remote add origin https://github.com/amendd/cannabilis.git
```

Se já existir um `origin` e der erro, use:

```bash
git remote set-url origin https://github.com/amendd/cannabilis.git
```

---

## 4. Adicionar todos os arquivos

```bash
git add .
```

*(O arquivo `.env` **não** será incluído — está no `.gitignore`.)*

---

## 5. Fazer o primeiro commit

```bash
git commit -m "Deploy: Next.js + Supabase + Vercel"
```

---

## 6. Nomear a branch como main e enviar para o GitHub

```bash
git branch -M main
git push -u origin main
```

Se o GitHub pedir **usuário e senha**, use:
- **Usuário:** seu usuário do GitHub
- **Senha:** um **Personal Access Token** (o GitHub não aceita mais senha comum).  
  Para criar: GitHub → Settings → Developer settings → Personal access tokens → Generate new token. Marque pelo menos `repo`.

---

## Resumo (copiar e colar em sequência)

```bash
cd c:\Users\Gabriel\clickcannabis-replica
git init
git remote add origin https://github.com/amendd/cannabilis.git
git add .
git commit -m "Deploy: Next.js + Supabase + Vercel"
git branch -M main
git push -u origin main
```

---

Depois do `git push`, o repositório **amendd/cannabilis** deixará de estar vazio. Volte na Vercel, recarregue a página (ou importe de novo o projeto) e clique em **Deploy**.
