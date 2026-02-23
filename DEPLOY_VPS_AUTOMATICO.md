# Deploy automático na VPS (GitHub Actions)

Ao dar **push na branch `main`**, o GitHub Actions conecta na sua VPS via SSH, executa `git pull`, `npm ci`, `npm run build` e `pm2 restart`, atualizando o site sem você precisar entrar na VPS.

---

## 1. Configurar secrets no GitHub

No repositório: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Crie estes secrets:

| Secret        | Obrigatório | Exemplo                    | Descrição                          |
|---------------|-------------|----------------------------|------------------------------------|
| `VPS_HOST`    | Sim         | `5.189.168.66` ou `cannabilize.com.br` | IP ou domínio da VPS        |
| `VPS_USER`    | Sim         | `root`                     | Usuário SSH                        |
| `VPS_SSH_KEY` | Sim         | (conteúdo do arquivo da chave privada) | Chave privada SSH (ex.: `~/.ssh/id_rsa`) |
| `VPS_APP_PATH` | Não       | `/var/www/cannabilize`     | Pasta do projeto na VPS (padrão: `/var/www/cannabilize`) |
| `VPS_PM2_NAME` | Não       | `cannabilize`              | Nome do app no PM2 (padrão: `cannabilize`) |

### Obter o conteúdo da chave privada

- **No seu PC (Windows):** no PowerShell ou CMD, por exemplo:  
  `type %USERPROFILE%\.ssh\id_rsa`  
  Copie **todo** o conteúdo (incluindo as linhas `-----BEGIN ... KEY-----` e `-----END ... KEY-----`).

- **Se ainda não tiver chave:** na VPS rode `ssh-keygen -t ed25519 -C "github-deploy"` e use a chave **pública** (`id_ed25519.pub`) no `authorized_keys` do usuário que faz deploy. A chave **privada** você cola no secret `VPS_SSH_KEY`.  
  Ou gere a chave no PC e adicione o `.pub` no `authorized_keys` da VPS; a privada vai no GitHub.

---

## 2. Garantir que a VPS está pronta

Na VPS, o projeto deve estar clonado na pasta configurada (ex.: `/var/www/cannabilize`) e o PM2 deve estar rodando o app com o nome configurado (ex.: `cannabilize`).

Exemplo de primeiro setup na VPS:

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/SEU_USUARIO/SEU_REPO.git cannabilize
cd cannabilize
npm ci
npm run build
pm2 start npm --name cannabilize -- start
pm2 save
```

Se a pasta ou o nome do app forem outros, use os secrets `VPS_APP_PATH` e `VPS_PM2_NAME`.

---

## 3. Como disparar o deploy

- **Automático:** a cada **push na branch `main`** o workflow roda e faz o deploy na VPS.
- **Manual:** no GitHub, aba **Actions** → workflow **Deploy VPS** → **Run workflow** → **Run workflow**.

---

## 4. Rodar o deploy manualmente na VPS

Se quiser atualizar direto na VPS (sem GitHub Actions):

```bash
cd /var/www/cannabilize
./scripts/deploy-vps.sh
```

Ou com pasta/nome do PM2 diferentes:

```bash
APP_DIR=/var/www/cannabilize PM2_APP=cannabilize ./scripts/deploy-vps.sh
```

---

## 5. Troubleshooting

- **"Permission denied (publickey)"**  
  A chave privada em `VPS_SSH_KEY` não confere com nenhuma chave em `~/.ssh/authorized_keys` do usuário `VPS_USER` na VPS. Adicione a chave pública correspondente no `authorized_keys`.

- **"npm ci failed"**  
  Na VPS, dentro da pasta do app, deve existir `package-lock.json` (gerado pelo `npm install` no seu PC e commitado). Se não houver, use no script `npm install` em vez de `npm ci`, ou gere e commite o lock file.

- **PM2 não encontrado**  
  Na VPS, instale o PM2: `npm install -g pm2`. O usuário SSH (`VPS_USER`) deve ser o mesmo que roda o PM2 (ex.: `root`).
