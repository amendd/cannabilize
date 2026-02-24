# Guia de Setup - Projeto Cannabilize

## 📋 Sobre as Instruções

As instruções recebidas estão **corretas** e seguem o padrão de setup de um projeto Next.js do zero.

## 🚀 Script Automatizado

Foi criado um script PowerShell (`setup-cannabilize.ps1`) que automatiza todo o processo.

### ⚠️ IMPORTANTE - Habilitar Execução de Scripts

**ANTES de executar o script**, você precisa habilitar a execução de scripts no PowerShell:

#### Opção 1: Usar o script auxiliar (Recomendado)
```powershell
# Execute este comando primeiro:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Opção 2: Executar o script de habilitação
```powershell
# Se já existe o script habilitar-powershell.ps1, execute:
powershell -ExecutionPolicy Bypass -File .\habilitar-powershell.ps1
```

**Ou execute diretamente no terminal:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Quando perguntar, digite **S** (Sim) e pressione Enter. *Se nao perguntar, e porque a politica ja estava permitida ou foi aplicada direto — esta tudo certo.*

### Como usar o script:

1. **Abra o PowerShell** no Cursor (Terminal > New Terminal)

2. **Primeiro, habilite a execução de scripts** (veja acima ⚠️)

3. **Execute o script:**
   ```powershell
   .\setup-cannabilize.ps1
   ```

4. **Siga as instruções** que aparecerem na tela

### O que o script faz:

- ✅ Verifica se Git, Node.js e npm estão instalados
- ✅ Clona o repositório `Cannabilize/cannabilize`
- ✅ Cria o projeto Next.js com as configurações corretas
- ✅ Cria o arquivo `.env.local`
- ✅ Instala as dependências
- ✅ Prepara o commit inicial
- ✅ Oferece opção de fazer push para o GitHub

## Repositório "not found" no GitHub

Se aparecer **"remote: Repository not found"** ou **"fatal: repository ... not found"**:

1. **Confirme a URL com quem passou as instruções** — o endereço pode ser diferente (ex.: outro usuario/org, nome com outra grafia). No GitHub a URL e sensivel a maiusculas/minusculas.
2. **Se o repositorio for privado** — faca login no Git e verifique acesso:
   ```powershell
   git config --global user.name "SeuUsuarioGitHub"
   git config --global user.email "seu@email.com"
   ```
   Depois tente clonar de novo; o Windows pode pedir login do GitHub.
3. **Setup sem clonar (recomendado se o repo ainda nao existir):** crie o projeto na sua maquina e depois adicione o remote quando tiver a URL correta. Veja a secao **"Setup manual (sem clonar)"** abaixo.

---

## Setup manual (sem clonar)

Use isto se o repositorio nao existir ainda ou a URL estiver errada. Voce cria o projeto localmente e depois envia para o GitHub quando tiver o repo/URL certa.

1. **Criar pasta e entrar nela:**
   ```powershell
   mkdir cannabilize
   cd cannabilize
   ```

2. **Inicializar Git:**
   ```powershell
   git init
   ```

3. **Criar projeto Next.js** (na pasta atual):
   ```powershell
   npx create-next-app@latest .
   ```
   Responda: TypeScript Yes, ESLint Yes, Tailwind Yes, `src/` Yes, App Router Yes, Import alias Yes.

4. **Criar `.env.local`** na raiz (pode ser vazio por enquanto).

5. **Testar:**
   ```powershell
   npm run dev
   ```
   Abra http://localhost:3000

6. **Quando tiver a URL correta do GitHub**, adicione o remote e envie:
   ```powershell
   git add .
   git commit -m "Initial Next.js project"
   git remote add origin https://github.com/USUARIO_OU_ORG/REPO.git
   git branch -M main
   git push -u origin main
   ```
   Troque `USUARIO_OU_ORG/REPO.git` pela URL que seu amigo passar.

---

## Execução Manual (Alternativa)

Se preferir executar manualmente ou se o script der algum problema:

### 1. Clonar o repositório
```powershell
git clone https://github.com/Cannabilize/cannabilize.git
cd cannabilize
```

### 2. Criar o projeto Next.js
```powershell
npx create-next-app@latest .
```

**Responder às perguntas:**
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- src/ directory: **Yes**
- App Router: **Yes**
- Import alias: **Yes** (ou usar o padrão `@/*`)

### 3. Testar o projeto
```powershell
npm run dev
```

Abrir no navegador: http://localhost:3000

### 4. Criar arquivo .env.local
Na raiz do projeto, criar o arquivo `.env.local` (os valores serão enviados depois).

### 5. Commit inicial
```powershell
git add .
git commit -m "Initial Next.js project"
git push origin main
```

## ⚠️ Observações Importantes

1. **Repositório diferente**: O projeto atual (`clickcannabis-replica`) é diferente do novo projeto (`cannabilize`). O script criará uma nova pasta.

2. **Variáveis de ambiente**: O arquivo `.env.local` será criado vazio. Você precisará adicionar as variáveis depois.

3. **Permissões (ERRO COMUM)**: Se aparecer o erro "execução de scripts foi desabilitada", execute:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   Digite **S** quando perguntar e pressione Enter. Isso permite executar scripts locais com segurança.

4. **Git configurado**: Certifique-se de que o Git está configurado com seu usuário e email:
   ```powershell
   git config --global user.name "Seu Nome"
   git config --global user.email "seu@email.com"
   ```

## ✅ Checklist Final

Após executar o script ou os comandos manuais, confirme:

- [ ] O projeto rodou localmente (`npm run dev`)
- [ ] A página padrão do Next.js abriu em http://localhost:3000
- [ ] O código apareceu no GitHub (repositório `Cannabilize/cannabilize`)
- [ ] O arquivo `.env.local` foi criado (mesmo que vazio)

## 📊 Google Analytics (GA4)

O projeto já inclui a integração com Google Analytics 4. Para ativar:

### Opção 1 – Variável de ambiente (recomendado em produção)

No `.env` ou `.env.local`, adicione o **ID da Métrica** do seu fluxo GA4:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-N0J8MXHEQL
```

(O ID da imagem é `G-N0J8MXHEQL` – fluxo cannabilize / cannabilize.com.br.)

Com isso, a tag do GA4 é carregada em todas as páginas e a coleta de dados começa assim que o site for acessado.

### Opção 2 – Painel Admin

1. Faça login como **Admin**.
2. Acesse **Admin → Integrações → Google Analytics**.
3. Marque **"Ativar Google Analytics na plataforma"**.
4. Cole o **ID de medição** (ex.: `G-N0J8MXHEQL`) no campo indicado.
5. Clique em **Salvar**.

O ID está em: **Google Analytics → Admin → Fluxos de dados → [Seu fluxo da web] → ID de medição**.

### Verificação

- O aviso *"A coleta de dados não está ativa"* no GA4 pode levar até **24–48 horas** para sumir após a tag estar instalada.
- Para testar na hora: no GA4, use **Relatórios → Tempo real** e acesse o site em outra aba; você deve ver 1 usuário ativo.

## 📧 Email SMTP (Gmail – Cannabilize)

O sistema envia emails (confirmação de consulta, lembrete, receita, etc.) via **SMTP**. Você pode usar o Gmail (Cannabilize) de duas formas:

### Opção 1 – Variáveis de ambiente (recomendado para Cannabilize)

No `.env` ou `.env.local`, adicione:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cannabilizeagora@gmail.com
SMTP_PASS=sua-senha-de-app-aqui
SMTP_FROM="Cannabilize <cannabilizeagora@gmail.com>"
SMTP_REPLY_TO=cannabilizeagora@gmail.com
```

- **SMTP_PASS**: use uma **Senha de app** do Google (não a senha da conta). Em [Conta Google → Segurança → Senhas de app](https://myaccount.google.com/apppasswords), crie uma senha de 16 caracteres e cole aqui (com ou sem espaços).
- **Porta 587** usa STARTTLS; não defina `SMTP_SECURE=true` (só use para porta 465).

Se essas variáveis estiverem definidas e **não** houver nenhum provedor de email habilitado no painel Admin, o sistema usará o SMTP do Gmail automaticamente.

### Opção 2 – Painel Admin

1. Faça login como **Admin**.
2. Acesse **Admin → Email** (ou **Integrações → Email**).
3. Adicione ou edite o provedor **SMTP**:
   - **Host SMTP**: `smtp.gmail.com`
   - **Porta**: `587`
   - **Usuário SMTP**: `cannabilizeagora@gmail.com`
   - **Senha SMTP**: sua senha de app do Google
   - **Usar SSL**: **desmarque** (para porta 587)
   - **Remetente (nome)**: `Cannabilize`
   - **Remetente (email)**: `cannabilizeagora@gmail.com`
   - **Reply-To**: `cannabilizeagora@gmail.com`
4. Marque **Habilitado** e salve.
5. Use o botão **Testar** para enviar um email de teste.

## 🔄 Próximos Passos

Após confirmar o checklist acima, será feita:
- Configuração de ambiente
- Integrações
- Deploy

---

**Dúvidas?** O script tem mensagens explicativas em cada etapa e oferece opções interativas quando necessário.
