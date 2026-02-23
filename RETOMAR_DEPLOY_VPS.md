# Retomando o deploy na VPS Contabo

Use este guia para **saber em que etapa você está** e continuar de onde parou.

---

## Checklist: em qual etapa você parou?

Marque até onde você **já fez** (na VPS ou no painel). Assim você sabe qual é o próximo passo.

| # | Etapa | Onde fazer | Já fiz? |
|---|--------|-------------|---------|
| **0** | Tenho **IP** e **senha root** da Contabo (e-mail ou painel) | Painel Contabo | ☐ |
| **1** | Consegui conectar na VPS: `ssh root@SEU_IP` | Seu PC (PowerShell) | ☐ |
| **2** | Rodei `apt update && apt upgrade -y` | Dentro da VPS | ☐ |
| **3** | Instalei **Node.js 20** (`node -v` mostra v20.x) | VPS | ☐ |
| **4** | Instalei **PostgreSQL** e criei usuário/banco `clickcannabis` | VPS | ☐ |
| **5** | Instalei **Nginx** e **PM2** (`nginx -v` e `pm2 -v`) | VPS | ☐ |
| **6** | Clonei o repositório em `/var/www/clickcannabis-replica` | VPS | ☐ |
| **7** | Alterei o **Prisma** para `postgresql` no `schema.prisma` (na VPS) | VPS | ☐ |
| **8** | Criei o `.env` na VPS com DATABASE_URL, NEXTAUTH_*, etc. | VPS | ☐ |
| **9** | Rodei `npm ci`, `prisma generate`, `prisma migrate deploy`, `npm run build` | VPS (pasta do projeto) | ☐ |
| **10** | App rodando com **PM2**: `pm2 start npm --name "clickcannabis" -- start` + `pm2 save` + `pm2 startup` | VPS | ☐ |
| **11** | **Nginx** configurado (site em `/etc/nginx/sites-available/clickcannabis`) e ativado | VPS | ☐ |
| **12** | **DNS** do domínio apontando para o IP da VPS (registro A) | Painel do domínio | ☐ |
| **13** | **SSL** com Certbot (`certbot --nginx -d seudominio.com.br ...`) | VPS | ☐ |
| **14** | **Crontab** configurado (lembretes de e-mail/WhatsApp) | VPS | ☐ |
| **15** | **Firewall** UFW ativo (portas 22, 80, 443) | VPS | ☐ |

---

## Etapa 1 – Conectei na VPS e não lembro o que já instalei

Conecte na VPS (`ssh root@SEU_IP`) e rode **todos** os comandos abaixo. Eles só **verificam** o que existe; não instalam nada.

```bash
echo "=== Sistema ==="
apt list --installed 2>/dev/null | grep -E "^(apt|curl)" | head -2

echo ""
echo "=== Node (precisa mostrar v20.x) ==="
node -v 2>/dev/null || echo "Node NÃO instalado"

echo ""
echo "=== npm ==="
npm -v 2>/dev/null || echo "npm NÃO instalado"

echo ""
echo "=== PostgreSQL (precisa estar active/running) ==="
systemctl is-active postgresql 2>/dev/null || echo "PostgreSQL NÃO instalado ou não está rodando"

echo ""
echo "=== Nginx ==="
nginx -v 2>&1 || echo "Nginx NÃO instalado"

echo ""
echo "=== PM2 ==="
pm2 -v 2>/dev/null || echo "PM2 NÃO instalado"

echo ""
echo "=== Git ==="
git --version 2>/dev/null || echo "Git NÃO instalado"
```

**Como ler o resultado:**

| Se aparecer… | Significa |
|--------------|-----------|
| `v20.x.x` no Node | Node 20 instalado ✓ |
| `command not found` ou "NÃO instalado" | Precisa instalar |
| `active` no PostgreSQL | PostgreSQL instalado e rodando ✓ |
| `inactive` ou `failed` no PostgreSQL | Instalado mas parado; rode `systemctl start postgresql` |

Depois de rodar, você pode:
1. **Me enviar a saída** (copiar e colar aqui) que eu digo exatamente o que instalar e em qual ordem, ou  
2. **Seguir a tabela abaixo** e instalar só o que faltar.

**O que instalar quando faltar:**

| Faltando | Comandos (rode na VPS, um bloco por vez) |
|----------|------------------------------------------|
| **Sistema desatualizado** | `apt update && apt upgrade -y` |
| **Node** | `curl -fsSL https://deb.nodesource.com/setup_20.x \| bash -` e depois `apt install -y nodejs` |
| **PostgreSQL** | `apt install -y postgresql postgresql-contrib` → `systemctl start postgresql` → `systemctl enable postgresql` |
| **Nginx** | `apt install -y nginx` |
| **PM2** | `npm install -g pm2` |
| **Git** | `apt install -y git` |

Ordem sugerida: **atualizar sistema** → **Node** → **PostgreSQL** → **Nginx e PM2** → **Git**. Depois disso, seguir o **GUIA_DEPLOY_VPS.md** na seção **4** (criar usuário e banco no PostgreSQL) e daí em diante.

---

## Próximo passo de acordo com a última etapa feita

- **Não conectei ainda** → Siga **PRIMEIROS_PASSOS_VPS_CONTABO.md** (Passos 0 e 1), depois **GUIA_DEPLOY_VPS.md** a partir da seção 2 (atualizar sistema) e 3 (Node.js).
- **Conectei e atualizei o sistema** → **GUIA_DEPLOY_VPS.md**, seção **3. Instalar Node.js 20**.
- **Já tenho Node, mas não PostgreSQL** → **GUIA_DEPLOY_VPS.md**, seção **4. Instalar PostgreSQL**.
- **Já tenho Node e PostgreSQL, falta Nginx/PM2** → **GUIA_DEPLOY_VPS.md**, seção **5. Instalar Nginx e PM2**.
- **Já instalei tudo, falta clonar e buildar** → **GUIA_DEPLOY_VPS.md**, seção **6** (clonar, trocar Prisma, .env, migrações, build).
- **Build OK, app não está rodando** → **GUIA_DEPLOY_VPS.md**, seção **7. Rodar a aplicação com PM2**.
- **App roda com PM2, mas não abre no navegador** → **GUIA_DEPLOY_VPS.md**, seção **8. Nginx como reverse proxy** e conferir DNS (seção 8 final).
- **Abre em HTTP, falta HTTPS** → **GUIA_DEPLOY_VPS.md**, seção **9. SSL com Let's Encrypt**.
- **Site no ar com HTTPS, falta cron** → **GUIA_DEPLOY_VPS.md**, seção **10. Cron jobs**.
- **Tudo feito** → Seção **11** (atualizar projeto) e **12** (firewall), se ainda não fez.

---

## Comandos rápidos para conferir o estado na VPS

Conecte com `ssh root@SEU_IP` e rode:

```bash
# Node instalado?
node -v

# PostgreSQL rodando?
systemctl status postgresql

# PM2 com o app?
pm2 status

# Nginx com o site ativo?
ls -la /etc/nginx/sites-enabled/

# Projeto clonado e buildado?
ls -la /var/www/clickcannabis-replica/.env
ls -la /var/www/clickcannabis-replica/.next
```

---

## Se for recomeçar do zero na mesma VPS

Se preferir **apagar e refazer** (cuidado: apaga banco e app):

1. Parar e remover o app do PM2: `pm2 delete clickcannabis`
2. Remover site do Nginx: `rm /etc/nginx/sites-enabled/clickcannabis` e `systemctl reload nginx`
3. Opcional: dropar o banco e usuário PostgreSQL e recriar (seção 4 do guia)
4. Apagar o projeto: `rm -rf /var/www/clickcannabis-replica`
5. Seguir **GUIA_DEPLOY_VPS.md** a partir da seção **6** (clonar de novo, etc.)

---

Quando souber **em qual etapa você parou** (ou qual número do checklist é o último que você já fez), diga aqui que eu te passo os comandos exatos para o próximo passo.
