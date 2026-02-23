# Imagens da landing: onde ficam e como enviar para a VPS

## Onde cada upload é salvo (Admin → Identidade visual)

Quando você faz upload pelo Admin, a API **`/api/admin/upload/landing-image`** salva em:

| Tipo no formulário | Pasta no servidor | Exemplo de URL salva no banco |
|-------------------|-------------------|-------------------------------|
| Hero (imagem do topo) | `public/images/hero/` | `/images/hero/hero-1734567890123.jpg` |
| Logo | `public/images/` | `/images/logo-1734567890123.png` |
| Processo 1 a 4 | `public/images/process/` | `/images/process/process_1-1734567890123.jpg` |
| Equipe 1 a 3 | `public/images/team/` | `/images/team/team_1-1734567890123.jpg` |
| Formas de consumo 1 a 4 | `public/images/consumption/` | `/images/consumption/consumption_1-1734567890123.jpg` |

O nome do arquivo é sempre **`{tipo}-{timestamp}.{ext}`**. A URL é gravada no banco (SystemConfig ou SiteAsset) e usada na home.

Depoimentos (testimonials) podem ter **photoUrl** apontando para `/images/testimonials/...` (definido no Admin ou por seed).

---

## Como obter a lista de caminhos e enviar para a VPS

### 1. Listar todos os caminhos (do banco + padrões do código)

No **PC onde você fez os uploads** (e onde está o banco com essas URLs), com o projeto aberto:

```bash
npx tsx scripts/list-landing-image-paths.ts
```

Requisito: **DATABASE_URL** no `.env` apontando para o banco que tem as configurações da landing (onde estão as URLs dos uploads).

Isso gera:

- **`scripts/landing-image-paths.txt`** – todos os caminhos usados (ex.: `/images/hero/hero-1734567890123.jpg`).
- **`scripts/landing-image-paths-missing.txt`** – os que **não** existem em `public/` no seu PC.

No terminal também aparece quantos existem e quantos faltam.

### 2. Empacotar só os arquivos que existem em `public/`

Ainda no PC:

```bash
npx tsx scripts/sync-landing-images-pack.ts
```

Isso cria a pasta **`scripts/sync-landing-images/`** com as subpastas `hero/`, `process/`, `team/`, etc. e **só os arquivos que existem** em `public/`. A estrutura é pronta para ser colada dentro de `public/images/` na VPS.

### 3. Enviar para a VPS

**Opção A – SCP (PowerShell no Windows):**

Crie a pasta na VPS se ainda não existir e envie o conteúdo:

```powershell
ssh root@5.189.168.66 "mkdir -p /var/www/cannabilize/public/images"
scp -r scripts/sync-landing-images/* root@5.189.168.66:/var/www/cannabilize/public/images/
```

**Opção B – Criar zip no PC e enviar:**

1. Zipar a pasta `scripts/sync-landing-images` (por exemplo `sync-landing-images.zip`).
2. Enviar o zip para a VPS: `scp sync-landing-images.zip root@5.189.168.66:/var/www/cannabilize/`
3. Na VPS:
   ```bash
   cd /var/www/cannabilize
   mkdir -p public/images
   unzip -o sync-landing-images.zip -d public/images
   ```
   (Se o zip tiver uma pasta raiz `sync-landing-images`, descompacte para um diretório temporário e depois mova o conteúdo: `unzip ... -d /tmp/sync && cp -r /tmp/sync/sync-landing-images/* public/images/`.)

Depois disso, as imagens passam a ser servidas em **https://cannabilize.com.br/images/...**.

---

## Se o banco da VPS for outro (não tem os uploads)

Se na VPS o banco for **novo** e não tiver as URLs dos uploads que você fez no PC:

1. Use no script o banco **onde você fez os uploads** (por exemplo o `.env` do seu PC com `DATABASE_URL` desse banco).
2. Rode os passos 1 e 2 acima e envie a pasta (ou zip) para a VPS.
3. Na VPS, as URLs que a aplicação usa vêm do **banco da VPS**. Então você precisa que as chaves da landing (SystemConfig) na VPS tenham as mesmas URLs. Opções:
   - **Exportar/importar** só as linhas de SystemConfig e SiteAsset relacionadas à landing (e, se usar, depoimentos) do banco do PC para o da VPS, ou
   - Na VPS, acessar o **Admin → Identidade visual** e fazer de novo os uploads; aí os arquivos serão gravados em `public/images/` na própria VPS e as URLs no banco da VPS.

---

## Resumo

| O que | Onde |
|-------|------|
| Caminho de cada imagem dos uploads | Definido pela API de upload; URL fica em SystemConfig / SiteAsset / depoimentos. |
| Listar todos os caminhos | `npx tsx scripts/list-landing-image-paths.ts` (usa o banco do `.env`). |
| Montar pasta para enviar | `npx tsx scripts/sync-landing-images-pack.ts` → `scripts/sync-landing-images/`. |
| Enviar para a VPS | `scp -r scripts/sync-landing-images/* root@IP:/var/www/cannabilize/public/images/` ou zip + unzip na VPS. |
