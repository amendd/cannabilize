# Aplicar variáveis de produção no .env da VPS

As URLs do site em produção devem estar no `.env` na VPS para login, links de e-mail e WhatsApp funcionarem com **https://cannabilize.com.br**.

## Conteúdo a adicionar/atualizar

O arquivo **`env.vps.producao.txt`** no projeto contém apenas as linhas de URL. Use-as no `.env` da VPS:

```env
NEXTAUTH_URL=https://cannabilize.com.br
NEXT_PUBLIC_APP_URL=https://cannabilize.com.br
APP_URL=https://cannabilize.com.br
SITE_PUBLIC_URL=https://cannabilize.com.br
```

## Como aplicar na VPS

### Opção 1 – Editar o .env na VPS

1. Conecte na VPS:
   ```bash
   ssh root@5.189.168.66
   ```
2. Abra o `.env`:
   ```bash
   cd /var/www/cannabilize
   nano .env
   ```
3. Adicione as 4 linhas acima (ou atualize se já existirem com outro valor).
4. Salve: `Ctrl+O`, Enter, `Ctrl+X`.
5. Reinicie o app:
   ```bash
   pm2 restart cannabilize
   ```

### Opção 2 – Anexar a partir do arquivo do projeto

No seu PC, depois de dar `git pull` (ou ter o arquivo `env.vps.producao.txt`):

**PowerShell (Windows):**
```powershell
Get-Content env.vps.producao.txt | Where-Object { $_ -match '^[A-Z]' } | ForEach-Object { $_ -replace '^#.*','' } | Where-Object { $_.Trim() -ne '' }
```
Isso só mostra as linhas; para enviar para a VPS você pode copiar manualmente o bloco do `env.vps.producao.txt` e colar no `nano .env` na VPS.

Ou envie o arquivo e na VPS anexe ao .env:

```powershell
scp env.vps.producao.txt root@5.189.168.66:/var/www/cannabilize/
```

Na VPS:
```bash
cd /var/www/cannabilize
grep -v '^#' env.vps.producao.txt | grep -v '^$' >> .env
pm2 restart cannabilize
```

(Se já existir alguma dessas chaves no .env, remova a duplicata manualmente ou use `sed` para atualizar.)

## Depois de aplicar

- Login em **https://cannabilize.com.br** deve manter a sessão e redirecionar corretamente.
- Links em e-mails (concluir cadastro, recuperar senha, etc.) devem apontar para **https://cannabilize.com.br**.
