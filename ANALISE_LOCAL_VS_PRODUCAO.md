# Análise: diferenças entre ambiente local e produção

Objetivo: entender **por que** o site em produção (ex.: https://cannabilize.com.br) se comporta ou aparece diferente do local e **como resolver** de forma objetiva.

---

## 1. Resumo das causas

| Causa | Efeito em produção | Onde atuar |
|-------|--------------------|------------|
| **Imagens ausentes na VPS** | Logo, hero, processo, depoimentos, equipe quebrados (404) | `public/images/` no repo ou na VPS |
| **Banco diferente (SystemConfig)** | Textos, seções (Eventos, Blog, Formas de uso) e URLs de imagens diferentes | Admin → Identidade visual e/ou seed no banco de produção |
| **Banco diferente (LandingTestimonial)** | Lista de depoimentos vazia ou diferente | Admin ou seed de depoimentos em produção |
| **Variáveis de URL no .env** | Login, e-mail, WhatsApp com links errados (localhost ou domínio errado) | `.env` na VPS |
| **Rate limiting só em produção** | 429 após muitas requisições | Esperado; ajustar apenas se atrapalhar |
| **Cache da landing (60s)** | Alterações no Admin demoram até 1 min para aparecer | Normal; revalidar se precisar |

---

## 2. Análise por tema

### 2.1 Imagens

- **O que o código espera:** caminhos como `/images/cannalize-logo.png`, `/images/hero/doctor-consultation.jpg`, `/images/process/consultation.jpg`, etc. (ver `lib/landing-config.ts` e componentes em `components/home/`).
- **Local:** você tem os arquivos em `public/images/` (hero, process, testimonials, team, etc.).
- **Produção:** o repositório hoje **quase não tem** arquivos em `public/images/` (apenas `public/GUIA_CREDENCIAIS_GOOGLE_MEET.md`). Na VPS, após `git pull`, essas pastas ficam vazias → **404** e layout “diferente”.

**Como resolver (escolha uma):**

1. **Incluir imagens no Git**  
   - Coloque em `public/images/` a estrutura esperada (hero, process, testimonials, team, etc.).  
   - Commit + push. Na VPS: `git pull` e reiniciar o app.  
   - Referência: `PRODUCAO_VPS_IMAGENS_E_LANDING.md` e `scripts/vps-copiar-imagens-para-defaults.sh`.

2. **Enviar só para a VPS (sem Git)**  
   - Crie as pastas na VPS, envie os arquivos (SCP/SFTP) e, se precisar, use o script acima para mapear nomes (ex.: primeiro arquivo em `hero/` → `doctor-consultation.jpg`).

3. **Usar URLs externas**  
   - Em **Admin → Identidade visual** preencha logo, hero, processo, depoimentos, equipe com URLs externas (CDN, outro servidor). Aí o site não depende de `public/images/` na VPS.

---

### 2.2 Conteúdo e seções da landing (banco de dados)

Toda a home é definida por **configuração no banco**:

- **SystemConfig** (chaves `landing_*`): textos do hero, estatísticas, URLs de imagens, e **flags**:
  - `landing_show_events_section` → exibir ou não a seção Eventos  
  - `landing_show_blog_preview_section` → exibir ou não o preview do blog  
  - `landing_show_consumption_forms_section` → exibir ou não “Formas de consumo”
- **LandingTestimonial**: depoimentos exibidos na home.
- **SiteAsset** (opcional): URLs de logo, hero, processo, etc.

Se no **local** você rodou seed ou configurou no Admin e em **produção** o banco está vazio ou foi configurado diferente:

- As **seções** podem aparecer/desaparecer (Eventos, Blog, Formas de uso).
- **Textos, logo e imagens** da landing vêm dos defaults do código quando não há valor no banco (ex.: `lib/landing-config.ts` → `DEFAULTS`).

**Como resolver:**

1. **Alinhar pelo Admin em produção**  
   - Acesse **https://cannabilize.com.br/admin** → **Identidade visual**.  
   - Ajuste textos, URLs de imagens e **ative/desative** as seções (Formas de uso, Eventos, Preview do blog) para ficar igual ao que você quer.  
   - Salve. O cache da landing é de 60 segundos.

2. **Reproduzir dados do local em produção (opcional)**  
   - Exportar do banco local as linhas de `system_configs` (chaves `landing_*`), `landing_testimonials` e, se usar, `site_assets`.  
   - Inserir no banco de produção (com cuidado para não sobrescrever dados importantes).  
   - Ou rodar em produção um seed que preencha apenas essas tabelas, se existir e for seguro.

---

### 2.3 URLs da aplicação (.env na VPS)

Login (NextAuth), links em e-mails e WhatsApp usam a **URL base** do site. Se na VPS estiverem erradas (ex.: `localhost` ou domínio antigo):

- Redirecionamento de login falha ou leva para o lugar errado.  
- Links em e-mails/WhatsApp apontam para outro domínio.

Variáveis usadas no código (prioridade aproximada):  
`SITE_PUBLIC_URL` → `NEXT_PUBLIC_APP_URL` → `APP_URL` → `NEXTAUTH_URL` (e em alguns pontos `VERCEL_URL`).  
Arquivo central: `lib/app-url.ts`; também usadas em APIs de consultas, pagamento, WhatsApp, etc.

**Como resolver:**

No `.env` **na VPS**, defina (exemplo para cannabilize.com.br):

```env
NEXTAUTH_URL=https://cannabilize.com.br
NEXT_PUBLIC_APP_URL=https://cannabilize.com.br
APP_URL=https://cannabilize.com.br
SITE_PUBLIC_URL=https://cannabilize.com.br
```

Reinicie o app após alterar (ex.: `pm2 restart cannabilize`).  
Referência: `env.vps.producao.txt` e `PRODUCAO_VPS_IMAGENS_E_LANDING.md`.

---

### 2.4 Comportamento que muda com NODE_ENV

- **Rate limiting** (`middleware.ts`): ativo **só em produção** → em prod você pode receber 429 após muitas requisições; em local não.
- **Respostas de erro**: em desenvolvimento o código às vezes retorna mais detalhes (stack, mensagem); em produção esconde. Não altera layout, só debug.
- **Cron**: em produção, rotas de lembrete/cron devem usar `CRON_SECRET` (header Authorization). Em local pode não ser exigido.
- **reCAPTCHA**: em desenvolvimento pode ser mais permissivo (`lib/security/recaptcha.ts`).

Nada disso costuma explicar “layout ou conteúdo diferente”; explicam diferença de **comportamento** (limite de requisições, segurança, debug).

---

### 2.5 Build (TypeScript)

Em `next.config.js` está `typescript: { ignoreBuildErrors: true }`. O build na VPS passa mesmo com erros de tipo. Isso **não** costuma causar diferença visual entre local e produção; apenas mascara erros de TypeScript. O ideal é ir corrigindo e remover o `ignoreBuildErrors` no futuro.

---

## 3. Checklist objetivo de resolução

Use na ordem que fizer sentido para o seu caso.

- [ ] **URLs no .env da VPS**  
  Definir `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `APP_URL` (e opcionalmente `SITE_PUBLIC_URL`) com o domínio de produção. Reiniciar o app.

- [ ] **Imagens em produção**  
  Garantir que os arquivos esperados existam em `public/images/` na VPS (via Git ou upload manual) OU configurar todas as imagens da landing como URLs externas em Admin → Identidade visual.

- [ ] **Seções e textos da landing**  
  Em Admin → Identidade visual, deixar ativadas/desativadas as seções (Formas de uso, Eventos, Blog) e os textos iguais ao que você quer em produção.

- [ ] **Depoimentos**  
  Cadastrar os depoimentos em produção (Admin) ou rodar/adaptar o seed de `landing_testimonials` no banco de produção.

- [ ] **Cache**  
  Após mudanças no Admin, aguardar até 1 minuto ou fazer um novo deploy/restart se quiser ver a alteração logo.

---

## 4. Resumo em uma frase

As diferenças entre local e produção vêm principalmente de: **(1) imagens em `public/images/` ausentes na VPS, (2) banco de produção sem ou com configuração diferente da landing (SystemConfig + LandingTestimonial) e (3) variáveis de URL do .env na VPS incorretas.** Resolver esses três pontos de forma alinhada ao que você já tem no local (ou ao que deseja em produção) elimina a maior parte das diferenças de forma objetiva.
