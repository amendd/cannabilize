# Produção VPS: imagens, seção “Formas de uso” e seções da home

Guia para corrigir **imagens que não carregam**, **seção “Formas de uso” (óleo, gummy, softgel) que sumiu** e **seções que apareceram e deveriam ficar ocultas** no site em https://cannabilize.com.br.

---

## 1. Imagens não aparecem

**Causa:** O repositório não contém os arquivos de imagem em `public/images/`. Na VPS, após `git pull`, as pastas `public/images/hero/`, `public/images/process/`, `public/images/testimonials/`, etc. ficam vazias ou não existem, então as URLs (ex.: `/images/hero/doctor-consultation.jpg`) retornam 404.

**O que o site espera (caminhos usados no código):**

| Pasta / arquivo | Uso |
|-----------------|-----|
| `public/images/cannalize-logo.png` | Logo e favicon |
| `public/images/hero/doctor-consultation.jpg` | Imagem do hero da home |
| `public/images/hero/placeholder.jpg` | Fallback do hero (opcional) |
| `public/images/process/consultation.jpg`, `prescription.jpg`, `anvisa.jpg`, `delivery.jpg` | Passos do processo |
| `public/images/testimonials/*.jpg` | Fotos dos depoimentos (natalia-almeida.jpg, etc.) |
| `public/images/team/dr-joao-silva.jpg`, `dra-maria-santos.jpg`, `equipe-suporte.jpg` | Fotos da equipe (Sobre, etc.) |
| `public/images/events/click-runner.webp`, etc. | Eventos (se usar a seção) |
| `public/images/placeholder.jpg` | Placeholder genérico (opcional) |

**Como corrigir:**

- **Opção A – Você tem as imagens no PC**  
  1. No seu PC, coloque os arquivos nas pastas acima dentro de `public/images/`.  
  2. Faça commit e push (ex.: `git add public/images` e `git commit -m "Add imagens produção"`).  
  3. Na VPS: `cd /var/www/cannabilize && git pull`.  
  4. Reinicie o app se quiser: `pm2 restart cannabilize`.

- **Opção B – Criar as pastas na VPS e enviar só as imagens**  
  1. Na VPS:  
     `mkdir -p /var/www/cannabilize/public/images/{hero,process,testimonials,team,events,consumption}`  
  2. Envie os arquivos do seu PC para a VPS (por SCP, SFTP ou outro). Exemplo no PC (PowerShell, ajuste o IP se precisar):  
     `scp -r public/images/* root@5.189.168.66:/var/www/cannabilize/public/images/`  
  3. Ajuste dono se necessário: na VPS, `chown -R www-data:www-data /var/www/cannabilize/public/images` (ou o usuário que roda o Node).

- **Opção C – Usar URLs externas pelo Admin**  
  Em **Admin → Identidade visual** você pode definir URLs externas para logo, hero, processo, depoimentos, etc. Assim as imagens vêm de outro servidor (CDN, hospedagem de arquivos) e não dependem de `public/images/` na VPS. Os caminhos locais acima continuam como fallback se o campo estiver vazio.

---

## 2. Seção “Formas de uso” (óleo, gummy, softgel) sumiu

**Causa:** A exibição dessa seção é controlada pela configuração da landing no banco: chave `landing_show_consumption_forms_section`. Se estiver como `false` (ou tiver sido desligada no Admin), a seção não aparece.

**Como corrigir:**

1. Acesse o **Admin** do site: **https://cannabilize.com.br/admin**
2. Vá em **Identidade visual** (ou o menu onde está a configuração da landing).
3. Localize a opção **“Exibir seção Formas de consumo”** (ou “Formas de uso”) e **ative** (marque/ligue).
4. Salve. A seção deve voltar a aparecer na home após recarregar a página (e possível cache de 1 minuto).

---

## 3. Outras seções que “estavam desabilitadas” e apareceram

**Causa:** As seções **Eventos** e **Preview do blog** também são controladas pelo Admin (e pelo banco): `landing_show_events_section` e `landing_show_blog_preview_section`. Em produção o banco pode estar com essas opções ligadas ou sem valor (aí o código usa “mostrar” como padrão), enquanto no seu ambiente local você tinha desligado.

**Como corrigir:**

1. Acesse **Admin → Identidade visual**.
2. **Desative** as opções que não devem aparecer na home, por exemplo:
   - “Exibir seção Eventos”
   - “Exibir seção Preview do blog”
3. Salve. A home passa a refletir o que você escolheu.

Assim você centraliza o que aparece ou não na home (Formas de uso, Eventos, Blog) pelo painel, em vez de depender do ambiente.

---

## 4. URLs da aplicação em produção (.env na VPS)

Para login, links de e-mail, WhatsApp e redirecionamentos funcionarem corretamente no domínio **https://cannabilize.com.br**, o `.env` na VPS deve ter:

```env
NEXTAUTH_URL=https://cannabilize.com.br
NEXT_PUBLIC_APP_URL=https://cannabilize.com.br
APP_URL=https://cannabilize.com.br
```

(Opcional, para links que devem sempre usar o domínio público: `SITE_PUBLIC_URL=https://cannabilize.com.br`.)

Depois de alterar o `.env`, reinicie o app: `pm2 restart cannabilize`.

---

## Resumo

| Problema | Ação |
|----------|------|
| Imagens não carregam | Colocar arquivos em `public/images/` (no repo ou na VPS) ou usar URLs externas no Admin → Identidade visual. |
| “Formas de uso” sumiu | Admin → Identidade visual → ativar “Exibir seção Formas de consumo”. |
| Seções que não deveriam aparecer | Admin → Identidade visual → desativar “Eventos” e “Preview do blog” (ou o que for o caso). |
| Links/login com domínio errado | Ajustar `NEXTAUTH_URL`, `APP_URL` e `NEXT_PUBLIC_APP_URL` no `.env` da VPS e reiniciar o PM2. |
