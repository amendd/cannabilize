# Site em iframe apontando para o túnel

Quando o site está **online no domínio** (ex.: cannabilize.com.br) mas a aplicação roda **dentro de um iframe** que carrega a URL do **túnel** (ngrok, Cloudflare Tunnel, etc.), siga estas orientações.

## 1. Links (pagamento, concluir cadastro, e-mails)

O servidor já usa **domínio de produção** para montar todos os links enviados por WhatsApp e e-mail, desde que as variáveis de ambiente estejam configuradas **no ambiente onde o Next.js roda** (o túnel).

No **.env** do servidor (túnel), defina:

```env
NEXT_PUBLIC_APP_URL=https://cannabilize.com.br
APP_URL=https://cannabilize.com.br
NEXTAUTH_URL=https://cannabilize.com.br
```

(sem barra no final)

Assim, links de **pagamento**, **concluir cadastro** e **reagendamento** apontarão para `https://cannabilize.com.br/...` em vez da URL do túnel.

## 2. Webhook Z-API / Meta (WhatsApp)

No admin (**Integrações → WhatsApp**), os campos **URL do webhook** passam a sugerir a URL usando `NEXT_PUBLIC_APP_URL` quando existir. Ou seja, mesmo acessando o admin pelo túnel (dentro do iframe), a URL exibida será `https://cannabilize.com.br/api/whatsapp/zapi-webhook` (ou a do seu domínio).

- **Importante:** a Z-API (ou Meta) precisa conseguir acessar essa URL. Duas opções:
  1. **Proxy reverso no domínio:** configurar em cannabilize.com.br para que rotas como `/api/*` sejam repassadas ao servidor do túnel. Aí o webhook pode ser `https://cannabilize.com.br/api/whatsapp/zapi-webhook`.
  2. **Webhook ainda no túnel:** se o domínio ainda não repassa as requisições ao app, use temporariamente a URL do túnel no painel Z-API (ex.: `https://xxx.ngrok.io/api/whatsapp/zapi-webhook`).

## 3. Quando o usuário clica no link (cannabilize.com.br)

Se o usuário recebe um link `https://cannabilize.com.br/consultas/123/pagamento`:

- Se **cannabilize.com.br** for só a página que embute o iframe (e não servir o app), essa rota pode dar 404. Nesse caso é necessário:
  - **Proxy reverso:** o domínio cannabilize.com.br (ou um subdomínio) encaminhar **todas** as rotas do app para o servidor do túnel; ou
  - **Deploy no domínio:** rodar o Next.js direto no domínio (ex.: Vercel/Umbler com domínio customizado), em vez de iframe + túnel.

Resumindo: com **iframe + túnel**, os **links gerados** já podem usar o domínio (via `NEXT_PUBLIC_APP_URL` / `APP_URL`). Para que **abrir esses links** funcione no domínio, o domínio precisa servir o app (proxy ou deploy).

## 4. Resumo rápido

| Onde | O que fazer |
|------|-------------|
| Servidor (túnel) | Definir `NEXT_PUBLIC_APP_URL`, `APP_URL`, `NEXTAUTH_URL` = `https://cannabilize.com.br` |
| Admin WhatsApp | Copiar a URL de webhook exibida (já usa o domínio se NEXT_PUBLIC_APP_URL estiver setado) |
| Domínio | Se quiser que links abram em cannabilize.com.br, configurar proxy reverso ou deploy do app no domínio |
