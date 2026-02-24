# Configs Nginx para CannabiLize (VPS)

- **cannabilize-so-ip.conf** — proxy na porta 80 usando só o IP (sem domínio).
- **cannabilize.conf** — proxy na porta 80 para cannabilize.com.br e www.cannabilize.com.br; use com Certbot para HTTPS.
- **cannabilize-https.conf** — exemplo completo com HTTPS (Certbot) + timeouts e buffers; use como referência na VPS para evitar 502 e problemas com chunks JS.

Instruções completas: [NGINX_SSL_VPS.md](../NGINX_SSL_VPS.md) na raiz do projeto.
