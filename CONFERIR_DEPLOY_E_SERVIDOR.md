# Como conferir deploy e configuração do servidor

Guia para verificar se o deploy está atualizado e se o servidor está configurado corretamente (evitar erros como **400 Bad Request** ou **MIME type** em arquivos JS/CSS).

---

## 1. Onde o site está hospedado?

- **Vercel** → use a seção [Vercel](#2-se-for-vercel) abaixo.
- **VPS** (servidor próprio com PM2 + Nginx) → use a seção [VPS](#3-se-for-vps).

---

## 2. Se for Vercel

### Conferir o deploy

1. Acesse [vercel.com](https://vercel.com) e entre no projeto **Cannabilize**.
2. Aba **Deployments**: o último deploy deve estar **Ready** (verde).
3. Clique no deploy e veja:
   - **Commit** — confira se é o commit mais recente do `main`.
   - **Build Logs** — se houve erro, aparece ali.

### Garantir que o build está no ar

- **Redeploy:** na lista de deploys, clique nos três pontinhos do último deploy → **Redeploy**.
- Ou faça um **push** na branch conectada (ex.: `main`) para disparar deploy automático.

### Domínio e variáveis

- **Settings → Domains:** confira se `cannabilize.com.br` está apontando para o projeto certo.
- **Settings → Environment Variables:** confira se `DATABASE_URL` e outras variáveis de produção estão preenchidas.

---

## 3. Se for VPS

### 3.1 Conectar na VPS

No seu PC (PowerShell ou CMD), use o script do projeto ou SSH direto:

```bash
# Exemplo (ajuste usuário e IP/domínio)
ssh root@cannabilize.com.br
# ou
ssh root@SEU_IP_DA_VPS
```

Ou use o arquivo **`CONECTAR_VPS_Executar.bat`** do projeto (ele chama o script PowerShell de conexão).

### 3.2 Conferir se o código está atualizado

Na VPS, na pasta do projeto:

```bash
# Ajuste o caminho se for diferente
cd /var/www/cannabilize

# Último commit no servidor
git log -1 --oneline

# Ver se há atualizações no remoto (não altera arquivos ainda)
git fetch origin
git status
```

Se `git status` mostrar que está atrás de `origin/main`, atualize:

```bash
git pull origin main
```

### 3.3 Fazer o build e reiniciar o app

Sempre que fizer `git pull` (ou alterar código), rode:

```bash
cd /var/www/cannabilize   # (ou sua pasta)

npm ci --omit=dev         # instala dependências (ou npm install)
npm run build             # gera .next com os chunks atuais
pm2 restart cannabilize   # ou: pm2 restart all
```

Ou use o script de deploy do projeto:

```bash
./scripts/deploy-vps.sh
```

Com variáveis:

```bash
APP_DIR=/var/www/cannabilize PM2_APP=cannabilize ./scripts/deploy-vps.sh
```

### 3.4 Conferir se o app está rodando

```bash
pm2 status
```

Deve aparecer o processo (ex.: `cannabilize`) com status **online**.

- Ver logs em tempo real: `pm2 logs cannabilize`
- Reiniciar: `pm2 restart cannabilize`

### 3.5 Conferir configuração do Nginx

O Nginx envia todo o tráfego para o Next.js. Arquivos estáticos (`/_next/`, `/next/`) são servidos pelo Next.js; o Nginx não deve devolver 400 nem HTML no lugar de JS.

**Arquivo de config (na VPS):**

```bash
# Caminho típico
sudo cat /etc/nginx/sites-enabled/cannabilize
# ou
sudo cat /etc/nginx/sites-available/cannabilize
```

**O que conferir:**

- `location /` com `proxy_pass http://127.0.0.1:3000;` (porta em que o PM2 sobe o Next.js).
- Não deve existir `location` específica para `/_next/` ou `/next/` que retorne erro ou arquivo estático errado.
- Tamanho de body (upload): se houver upload de arquivos, no bloco `server { }` pode ser necessário algo como `client_max_body_size 10m;`.

**Recarregar o Nginx após mudar config:**

```bash
sudo nginx -t        # testa a config
sudo systemctl reload nginx
```

### 3.6 Ver logs quando der erro no navegador

Quando aparecer 400 ou “MIME type” no navegador:

**Log de erros do Nginx:**

```bash
sudo tail -50 /var/log/nginx/cannabilize.error.log
```

**Log de acesso (ver qual URL retornou 400):**

```bash
sudo tail -50 /var/log/nginx/cannabilize.access.log
```

**Log do app (Next.js via PM2):**

```bash
pm2 logs cannabilize --lines 50
```

Assim você vê se o 400 vem do Nginx ou do Next.js e para qual URL.

---

## 4. Resumo rápido (VPS)

| O que fazer | Comando (na VPS, na pasta do app) |
|-------------|-----------------------------------|
| Atualizar código + build + restart | `git pull origin main && npm run build && pm2 restart cannabilize` |
| Só reiniciar | `pm2 restart cannabilize` |
| Ver se está rodando | `pm2 status` |
| Ver último commit | `git log -1 --oneline` |
| Logs do app | `pm2 logs cannabilize` |
| Logs do Nginx (erro) | `sudo tail -f /var/log/nginx/cannabilize.error.log` |

---

## 5. Erro 400 ou MIME type em arquivos JS/CSS

Quando o navegador pede um arquivo como `/next/static/chunks/webpack-xxx.js` e recebe **HTML** (página de erro), aparece “MIME type ('text/html') is not executable”.

**Causas comuns:**

1. **Build antigo na VPS** — o `.next` não foi regenerado; o HTML que o app entrega referencia chunks que não existem mais.
   - **Solução (obrigatória na VPS):** rodar **build + restart**, não só `git pull` ou reload do Nginx:
     ```bash
     cd /var/www/cannabilize
     npm run build
     pm2 restart cannabilize
     ```
   - Ou usar o script completo: `./scripts/deploy-vps.sh`
2. **Cache antigo no navegador** — HTML em cache pede chunks com hash antigo.
   - **Solução:** no navegador: `Ctrl + Shift + R` (recarregamento forçado) ou limpar dados do site para `cannabilize.com.br`.
3. **Nginx ou outro proxy** devolvendo página de erro (400/404) no lugar do JS.
   - **Solução:** conferir logs (acima) e a config do Nginx; não ter regras que retornem 400 para `/_next/` ou `/next/`.

**Ordem recomendada quando o erro persiste:** (1) na VPS: `npm run build` e `pm2 restart cannabilize`; (2) no navegador: abrir em aba anônima ou `Ctrl+Shift+R`.

**Se o site quebra mesmo em aba anônima** (CSS/JS com MIME type `text/html`): o servidor está devolvendo HTML no lugar dos arquivos estáticos. Na VPS, os arquivos em `.next/static/` podem não existir ou o PM2 pode estar rodando de outra pasta. Rode o diagnóstico: `bash scripts/diagnostico-static-vps.sh`. Depois: `npm run build` e `pm2 restart cannabilize` (garanta que o PM2 foi iniciado a partir da pasta do projeto, ex.: `cd /var/www/cannabilize` antes do `pm2 start`).
