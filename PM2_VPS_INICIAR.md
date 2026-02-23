# Subir a aplicação com PM2 na VPS

Execute os comandos **na VPS** (SSH em `root@5.189.168.66`), no diretório do projeto.

## 1. Garantir que o build está pronto

```bash
cd /var/www/cannabilize
# Se ainda não fez: npm run build
```

## 2. Iniciar com PM2

**Opção A – Nome e porta padrão (3000):**
```bash
cd /var/www/cannabilize
pm2 start npm --name "cannabilize" -- start
```

**Opção B – Usar variável PORT (ex.: 3000):**
```bash
cd /var/www/cannabilize
PORT=3000 pm2 start npm --name "cannabilize" -- start
```

**Opção C – Usar arquivo ecosystem (recomendado para manter):**
Crie na VPS o arquivo `ecosystem.config.cjs` na raiz do projeto (ou use o que estiver no repositório) e rode:
```bash
pm2 start ecosystem.config.cjs
```

## 3. Comandos úteis PM2

| Comando | Descrição |
|--------|------------|
| `pm2 list` | Lista processos (status, CPU, memória) |
| `pm2 logs cannabilize` | Ver logs em tempo real |
| `pm2 restart cannabilize` | Reiniciar a aplicação |
| `pm2 stop cannabilize` | Parar |
| `pm2 delete cannabilize` | Remover do PM2 |

## 4. Manter o app rodando após reboot

```bash
pm2 save
pm2 startup
```

O `pm2 startup` vai imprimir um comando (ex.: `sudo env PATH=... pm2 startup systemd -u root --hp /root`). **Execute esse comando** na VPS. Depois, `pm2 save` já estará ativo e o PM2 subirá o app no boot.

## 5. Testar no navegador

- **http://5.189.168.66:3000** (ou a porta que você definiu)

Se não abrir, verifique:
- **Firewall:** `ufw allow 3000` (se usar UFW) e `ufw status`
- **PM2:** `pm2 list` e `pm2 logs cannabilize --lines 50`

## 6. (Opcional) Nginx na porta 80

Para acessar sem porta (ex.: `http://5.189.168.66`), configure o Nginx como proxy reverso para `localhost:3000` e abra a porta 80. Posso detalhar esse passo se quiser.
