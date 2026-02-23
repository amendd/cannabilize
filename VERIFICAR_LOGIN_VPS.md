# Verificar por que /login ainda aparece antigo na VPS

Execute estes comandos **na VPS** (SSH em `/var/www/cannabilize`).

## 1. Confirmar que o código novo está no servidor

```bash
cd /var/www/cannabilize
grep -n "Portal Cannabilize" app/login/page.tsx | head -3
```

- **Se aparecer** algo como `211:            Portal Cannabilize` → o código novo está no servidor; o problema é **cache** (vá para o passo 2).
- **Se não aparecer** ou der "No such file" → o `git pull` não trouxe a última versão. Rode:
  ```bash
  git fetch origin
  git status
  git log -1 --oneline app/login/page.tsx
  git pull origin main
  ```

## 2. Rebuild limpo e reinício (elimina cache do Next)

```bash
cd /var/www/cannabilize
rm -rf .next
npm run build
pm2 restart cannabilize
```

## 3. Testar sem cache do navegador

- Abra o site em **aba anônima/privada** ou use **Ctrl+Shift+R** (hard refresh) na página `/login`.
- Se usar **Nginx** na frente do Node, pode ser cache do Nginx; reinicie: `sudo systemctl reload nginx` (ou `restart`).

## 4. Confirmar de qual pasta o PM2 está rodando

```bash
pm2 show cannabilize
```

Veja o campo **exec cwd** (ou **script path**). Tem de ser `/var/www/cannabilize` (ou a pasta onde você deu `git pull` e `npm run build`). Se for outra pasta, o PM2 está rodando o build antigo; ajuste o `ecosystem.config.js` ou o comando do PM2 para apontar para `/var/www/cannabilize`.
