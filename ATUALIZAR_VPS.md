# Atualizar aplicação na VPS

Execute estes comandos **na VPS** (após conectar por SSH), na pasta do projeto.

## Caminho do projeto

O projeto usa um destes caminhos na documentação:

- **`/var/www/cannabilize`** (mais comum nos guias de produção)
- **`/var/www/clickcannabis-replica`** (se você clonou com o nome do repositório)

Use o que for o da sua VPS. Exemplo com `/var/www/cannabilize`:

```bash
cd /var/www/cannabilize
git pull
npm run build
pm2 restart all
```

Se a pasta for outra (ex.: `/var/www/clickcannabis-replica`), troque só a primeira linha:

```bash
cd /var/www/clickcannabis-replica
git pull
npm run build
pm2 restart all
```

## Conferir

- `git log -1 --oneline` — confere o último commit aplicado
- `pm2 status` — confere se o app está rodando
