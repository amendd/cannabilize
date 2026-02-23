# Erro: "SSL_connect: SSL_ERROR_ZERO_RETURN" ao acessar o domínio

A mensagem **"OpenSSL SSL_connect: SSL_ERROR_ZERO_RETURN in connection to xxx.ngrok-free.dev:443"** significa que o servidor (ngrok) fechou a conexão TLS de forma limpa antes ou durante o handshake. Na prática, o **gateway** (este PHP no domínio) não conseguiu falar com o **túnel ngrok**. Quase sempre é uma destas causas:

## 1. O ngrok não está rodando

O túnel só existe enquanto o processo do ngrok estiver ativo no PC onde o Next.js roda.

**O que fazer:**

1. No PC onde você desenvolve (onde roda o Next.js), abra um terminal e execute:
   ```bash
   ngrok http 3000
   ```
   (Use a porta em que o Next.js está rodando, se for outra.)

2. Deixe essa janela aberta. O ngrok vai mostrar uma URL, por exemplo:
   ```text
   Forwarding    https://abc123xyz.ngrok-free.dev -> http://localhost:3000
   ```

3. Use **essa** URL no próximo passo.

## 2. A URL do ngrok mudou

Na conta gratuita do ngrok, a URL muda cada vez que você inicia o túnel (ex.: `crushingly-genealogic-terica.ngrok-free.dev` vira outra).

**O que fazer:**

1. Com o **ngrok já rodando**, na raiz do projeto execute:
   ```powershell
   .\obter-url-ngrok.ps1
   ```
   O script mostra a URL atual e a linha pronta para colar no `config.php`.
2. Edite o arquivo **`config.php`** (nesta pasta no servidor do domínio) e atualize a constante `TUNNEL_URL` com a URL exibida.
3. Salve e tente acessar de novo o site pelo domínio (ex.: cannabilize.com.br/admin/medicos).

## 3. Onde o config.php é usado

- Se o **gateway** (index.php + config.php) está na **hospedagem do domínio** (cannabilize.com.br): edite o `config.php` **nesse servidor** com a URL atual do ngrok.
- Se você está testando tudo **no mesmo PC**: edite o `config.php` na pasta `gateway-dominio-publico` e use a URL que o ngrok mostrar.

## 4. Script para obter a URL atual

Na **raiz do projeto** existe o script **`obter-url-ngrok.ps1`**. Com o ngrok rodando, execute:

```powershell
.\obter-url-ngrok.ps1
```

Ele consulta a API local do ngrok (porta 4040) e exibe a URL atual e a linha pronta para colar em `config.php`. Use essa URL no servidor do domínio.

## Resumo rápido

| Situação              | Ação                                                                 |
|-----------------------|----------------------------------------------------------------------|
| Ngrok fechado         | Abrir terminal e rodar `ngrok http 3000` ou `npm run dev:tunnel` (e deixar aberto). |
| Ngrok reiniciado      | Rodar `.\obter-url-ngrok.ps1` e atualizar `TUNNEL_URL` no `config.php` do servidor. |
| Testar se o túnel funciona | Abrir no navegador a URL do ngrok (ex.: https://xxxx.ngrok-free.dev). |

Se a URL do ngrok abrir normalmente no navegador mas o domínio continuar com erro, confira se o `config.php` no servidor do domínio está com exatamente essa mesma URL (com https:// e sem barra no final).
