# Nginx (porta 80) + SSL na VPS

Passo a passo para acessar o site sem `:3000` e com HTTPS. Execute os comandos **na VPS** (SSH).

---

## Opção A: Só porta 80 (sem domínio, por IP)

Para acessar **http://5.189.168.66** em vez de `http://5.189.168.66:3000`.

### 1. Instalar Nginx (se ainda não tiver)

```bash
apt update
apt install -y nginx
```

### 2. Usar o config “só IP”

Na VPS, crie o site e ative:

```bash
# Copiar config do projeto para o Nginx (ajuste o caminho se seu projeto estiver em outro lugar)
cp /var/www/cannabilize/nginx/cannabilize-so-ip.conf /etc/nginx/sites-available/cannabilize

# Remover site default que escuta na 80 (evita conflito)
rm -f /etc/nginx/sites-enabled/default

# Ativar o site cannabilize
ln -sf /etc/nginx/sites-available/cannabilize /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Aplicar
systemctl reload nginx
```

### 3. Firewall (porta 80)

```bash
ufw allow 80
ufw allow 22
ufw status
# Se ainda não ativou: ufw enable
```

Acesse: **http://5.189.168.66** (sem `:3000`).

---

## Opção B: Domínio + HTTPS (SSL com Let's Encrypt)

Requisitos: **cannabilize.com.br** com **registro A** apontando para o IP da VPS (5.189.168.66).

### 1. Instalar Nginx e Certbot

```bash
apt update
apt install -y nginx certbot python3-certbot-nginx
```

### 2. Config com o domínio cannabilize.com.br

O arquivo `cannabilize.conf` já está configurado para **cannabilize.com.br** e **www.cannabilize.com.br**. Só copiar e ativar:

```bash
cp /var/www/cannabilize/nginx/cannabilize.conf /etc/nginx/sites-available/cannabilize
```

### 3. Ativar site e testar

```bash
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/cannabilize /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. Liberar portas 80 e 443

```bash
ufw allow 80
ufw allow 443
ufw allow 22
ufw status
# Se necessário: ufw enable
```

### 5. Gerar certificado SSL (HTTPS)

O Certbot vai alterar o config do Nginx automaticamente para escutar na 443 e usar o certificado:

```bash
certbot --nginx -d cannabilize.com.br -d www.cannabilize.com.br
```

Siga as perguntas (e-mail, termos). Depois disso o site fica em **https://cannabilize.com.br**.

### 6. Renovação automática do certificado

O Certbot agenda a renovação sozinho. Para testar:

```bash
certbot renew --dry-run
```

---

## Resumo rápido

| Objetivo              | Arquivo de config              | Comando principal                          |
|-----------------------|--------------------------------|--------------------------------------------|
| Porta 80 por IP       | `nginx/cannabilize-so-ip.conf` | Copiar, ativar site, `nginx -t` e `reload` |
| Domínio + HTTPS       | `nginx/cannabilize.conf`       | Ativar, depois `certbot --nginx -d cannabilize.com.br -d www.cannabilize.com.br` |

---

## Troubleshooting

- **502 Bad Gateway:** Next.js não está rodando. Verifique: `pm2 list` e `pm2 logs cannabilize`.
- **Nginx não inicia:** `nginx -t` mostra o erro; confira caminhos e sintaxe nos configs.
- **Certbot falha:** Confirme que o domínio aponta para o IP da VPS (`ping cannabilize.com.br`) e que a porta 80 está aberta.
