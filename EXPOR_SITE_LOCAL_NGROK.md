# Expor ambiente local com ngrok (ou similar)

Guia para expor sua URL de desenvolvimento local na internet, útil para webhooks (pagamentos, WhatsApp, OAuth, etc.).

---

## Iniciar projeto + túnel juntos

Para subir o servidor e o ngrok de uma vez:

- **PowerShell (na pasta do projeto):**  
  `.\iniciar-com-tunel.ps1`
- **Ou pelo npm:**  
  `npm run dev:tunnel`

O script inicia o Next.js e o ngrok no mesmo terminal. Quando a URL do ngrok aparecer, use-a no `.env.local` e nos webhooks (Twilio, etc.). Ctrl+C encerra os dois.

---

## 1. ngrok

### Instalação

**Windows (PowerShell como admin):**
```powershell
# Via Chocolatey (se tiver)
choco install ngrok

# Ou baixe em: https://ngrok.com/download
# Extraia o .exe e use no PATH
```

**Ou via npm (global):**
```bash
npm install -g ngrok
```

### Uso básico

1. **Inicie seu app local** (em um terminal):
   ```bash
   npm run dev
   ```
   O Next.js ficará em `http://localhost:3000`.

2. **Em outro terminal, exponha a porta 3000:**
   ```bash
   ngrok http 3000
   ```

3. O ngrok mostrará algo como:
   ```
   Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
   ```
   Use essa URL `https://...ngrok-free.app` como sua URL pública.

### Conta gratuita (recomendado)

- Crie conta em [ngrok.com](https://ngrok.com) e pegue seu **authtoken**.
- Configure uma vez:
  ```bash
  ngrok config add-authtoken SEU_TOKEN
  ```
- Na conta gratuita você pode fixar um subdomínio (ex.: `meu-app.ngrok-free.app`) para não mudar a URL a cada execução.

### Variáveis de ambiente

O projeto já possui um `.env.local` de exemplo com a URL do ngrok. Quando a URL do ngrok mudar (ex.: `https://outra-palavra.ngrok-free.dev`), edite o `.env.local` na raiz e atualize:

- `NEXTAUTH_URL` — auth, cookies, links em e-mails, webhook de pagamento
- `NEXT_PUBLIC_APP_URL` e `APP_URL` — front e webhooks (WhatsApp)
- `TWILIO_WEBHOOK_BASE_URL` — URL que você coloca no painel do Twilio como webhook
- `NEXT_PUBLIC_BASE_URL` — links em e-mails (convites de reagendamento)

Reinicie o `npm run dev` após alterar o `.env.local`.

---

## 2. Alternativas ao ngrok

### Cloudflare Tunnel (gratuito, sem limite de conexões)

1. Instale: [developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation)

2. Crie um túnel:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   Ele gera uma URL `https://....trycloudflare.com`.

### localtunnel (npm, bem simples)

```bash
npx localtunnel --port 3000
```
Ele retorna uma URL tipo `https://xxx.loca.lt`. Pode pedir um “Click to Continue” na primeira vez que acessar.

### localhost.run (sem instalar nada)

No terminal (com o servidor em 3000 rodando):
```bash
ssh -R 80:localhost:3000 localhost.run
```
Gera uma URL pública. Requer SSH configurado.

---

## 3. Checklist para seu projeto

- [ ] App rodando: `npm run dev` (porta 3000).
- [ ] ngrok (ou outro) apontando para `http://localhost:3000`.
- [ ] Copiar a URL HTTPS gerada (ex.: `https://abc123.ngrok-free.app`).
- [ ] Colocar em `.env.local`: `NEXT_PUBLIC_APP_URL` e `APP_URL`.
- [ ] Reiniciar o servidor Next.js.
- [ ] Configurar webhooks (Mercado Pago, WhatsApp, etc.) com essa URL (ex.: `https://abc123.ngrok-free.app/api/payments/webhook`).

---

## 4. Observações

- **HTTPS:** ngrok e Cloudflare Tunnel já fornecem HTTPS; use sempre a URL `https://` em produção e em webhooks.
- **CORS:** Se der erro de CORS em APIs, verifique `next.config.js` e headers da API; o Next.js costuma aceitar o host do ngrok sem mudanças.
- **Segredo de webhook:** Mantenha sempre um segredo (ex.: `WEBHOOK_SECRET`) e valide assinaturas no endpoint de webhook; com URL pública, qualquer um pode tentar chamar o endpoint.

Se quiser, posso te ajudar a colocar a variável `APP_URL` nos pontos do projeto que usam URL base (webhooks, emails, links).
