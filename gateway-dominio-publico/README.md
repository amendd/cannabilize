# Gateway – Domínio público sem mostrar o túnel

Pasta para hospedar **em produção** no seu domínio público. Quem acessar o domínio verá o site (que está atrás do túnel), mas a **barra de endereço continuará mostrando o seu domínio**, não a URL do túnel (ngrok, Cloudflare Tunnel, etc.).

## Opção 1: index.html (iframe) – mais simples

- Funciona em qualquer hospedagem estática (Netlify, Vercel estático, GitHub Pages, etc.).
- Basta editar no próprio `index.html` a variável **`TUNNEL_URL`** no JavaScript e colocar a URL do seu túnel (ex.: `https://abc123.ngrok-free.app`).
- O visitante acessa `https://seudominio.com` e o conteúdo do túnel é exibido em tela cheia dentro da página; a URL do navegador permanece `https://seudominio.com`.

**Limitação:** Se o site do túnel enviar cabeçalho `X-Frame-Options: DENY` (ou `SAMEORIGIN` e o domínio for outro), o navegador pode bloquear o iframe. Nesse caso use a Opção 2.

## Opção 2: index.php (proxy) – quando o iframe for bloqueado

- Requer hospedagem com **PHP** (e preferencialmente **cURL** habilitado).
- Configure a URL do túnel em **`config.php`** (constante `TUNNEL_URL`).
- O `index.php` faz as requisições ao túnel e devolve a resposta, reescrevendo links no HTML da página inicial para que continuem passando pelo seu domínio.

**Nota:** O proxy aqui cobre a página principal e links básicos. Para um site complexo (SPA, muitas rotas e APIs), o ideal é usar um proxy reverso no servidor (nginx/Apache) ou um túnel que já use o seu domínio (ex.: Cloudflare Tunnel com subdomínio próprio).

## Deploy em produção

1. **Só HTML:** Suba a pasta (ou só o `index.html`) para a raiz do seu domínio. Ajuste `TUNNEL_URL` no arquivo.
2. **Com PHP:** Suba `index.html`, `index.php` e `config.php`. Configure `TUNNEL_URL` em `config.php`. Defina o servidor para usar `index.php` como índice (ou acesse `https://seudominio.com/index.php`).

## Resumo

| Objetivo                         | Arquivo     | O que fazer                                      |
|----------------------------------|------------|---------------------------------------------------|
| Ver o site sem ver a URL do túnel | `index.html` | Editar `TUNNEL_URL` e hospedar o HTML             |
| Mesmo efeito com proxy em PHP     | `index.php` + `config.php` | Editar `TUNNEL_URL` em `config.php` e hospedar com PHP |

Sempre use **HTTPS** no domínio público e na URL do túnel.
