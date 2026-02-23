# Auditoria técnica — Produção VPS (CannabiLize / ClickCannabis)

**Data:** 23/02/2025  
**Escopo:** Aplicação Next.js em produção (VPS, PM2, Nginx, PostgreSQL, SSL).  
**Objetivo:** Garantir que o sistema esteja seguro, estável, performático e pronto para uso em produção por usuários reais.

---

## 1. Resumo executivo

O projeto está **parcialmente pronto para produção**, com boa base de segurança (auth, autorização por papel, headers, sanitização, validação de formulários) e integrações (Stripe, Resend, Twilio) bem utilizadas. Porém existem **pontos críticos e de alta prioridade** que devem ser corrigidos antes de considerar o sistema totalmente seguro e estável para uso com pagantes.

**Principais riscos identificados:**
- **TypeScript desabilitado no build** (`ignoreBuildErrors: true`) — erros de tipo podem mascarar bugs em produção.
- **Rotas de cron abertas** quando `CRON_SECRET` não está definido (qualquer um pode disparar jobs).
- **Receita pública por ID** pode rejeitar receitas válidas (status `ACTIVE` vs `ISSUED`).
- **Nginx** sem timeouts, buffer e headers de segurança explícitos; sem HTTPS na config de exemplo (depende do Certbot).
- **Rate limiting em memória** — não escala com múltiplas instâncias; sem Redis em produção.
- **Crons na VPS** dependem de crontab manual; `vercel.json` não é usado no servidor.

**Pontos positivos:**
- Autenticação NextAuth com JWT, cookies seguros, invalidação por alteração de senha.
- Autorização por papel (ADMIN, DOCTOR, PATIENT) e verificação de ownership em consultas/prescrições.
- Webhook Stripe com validação de assinatura.
- CSP, HSTS, X-Frame-Options e sanitização de inputs (XSS).
- Formulário de agendamento com reCAPTCHA, honeypot e validação de tempo.
- Rota de debug (`/api/debug/*`) bloqueada em produção.

---

## 2. Vulnerabilidades e problemas críticos

### 2.1 Build com erros TypeScript ignorados (CRÍTICO)

**Arquivo:** `next.config.js`

```javascript
typescript: {
  ignoreBuildErrors: true,
},
```

**Risco:** Erros de tipo não quebram o build; bugs podem ir para produção (null/undefined, tipos incorretos em APIs). O comentário cita `ERROS_TYPESCRIPT_BUILD.txt` — a dívida técnica foi “empurrada” em vez de resolvida.

**Ação:**  
- Corrigir erros TypeScript em lotes e remover `ignoreBuildErrors: true`.  
- Manter temporariamente só se houver prazo curto, com tarefa explícita e prazo para remoção.

---

### 2.2 Rotas de cron abertas quando `CRON_SECRET` não está definido (CRÍTICO)

**Rotas afetadas:**
- `GET /api/cron/whatsapp-reminder-auto`  
- `POST /api/cron/expire-reschedule-invites`  
- `GET /api/cron/whatsapp-follow-up`  

**Comportamento atual:**  
Se `CRON_SECRET` não estiver no `.env`, a verificação é pulada e a rota executa sem autenticação. Qualquer pessoa que descubra a URL pode:
- Disparar lembretes em massa (WhatsApp).
- Expirar convites e enviar e-mails aos médicos.
- Acionar follow-up de WhatsApp.

**Exemplo (whatsapp-reminder-auto):**
```ts
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
}
// Se cronSecret é undefined, nunca retorna 401
```

**Ação:**  
- Exigir `CRON_SECRET` em produção: se `NODE_ENV === 'production'` e `!process.env.CRON_SECRET`, retornar 503 ou 401 e não executar o job.  
- Em todas as rotas de cron, usar a mesma lógica: “secret obrigatório em produção”.

---

### 2.3 Receita pública por ID — status incorreto (ALTO)

**Arquivo:** `app/api/prescriptions/public/[id]/route.ts`

```ts
if (prescription.status !== 'ISSUED') {
  return NextResponse.json({ error: 'Receita não está mais válida' }, { status: 403 });
}
```

No schema Prisma, o status de prescrição inclui `ACTIVE`, `EXPIRING`, `EXPIRED`, etc.; `ISSUED` é legado. Receitas com status `ACTIVE` (válidas) estão sendo rejeitadas na rota pública (ex.: acesso via QR code).

**Ação:**  
Considerar válidas as receitas com status `ACTIVE` (e opcionalmente `EXPIRING`). Exemplo:

```ts
const validStatuses = ['ACTIVE', 'EXPIRING', 'ISSUED'];
if (!validStatuses.includes(prescription.status)) {
  return NextResponse.json({ error: 'Receita não está mais válida' }, { status: 403 });
}
```

---

### 2.4 Possível vazamento de credenciais em arquivos (ALTO)

**Arquivo:** `INICIAR_SERVIDOR.bat` (ou similar)

Contém connection string de banco com senha em texto. Se esse arquivo for versionado ou copiado para repositório, a senha fica exposta.

**Ação:**  
- Nunca commitar `.env`, `.bat` ou scripts com secrets.  
- Usar apenas variáveis de ambiente (ex.: `DATABASE_URL` no `.env` na VPS, não em scripts).  
- Verificar com `git log` e `git diff` se esse tipo de arquivo já foi commitado e, em caso positivo, rotacionar a senha do banco e remover o arquivo do histórico (ex.: `git filter-branch` ou BFG).

---

## 3. Arquitetura e organização

### 3.1 Estrutura

- **App Router** do Next.js com `app/` (rotas, layouts, API) está coerente.  
- Separação **admin / medico / paciente** por prefixos de rota e layout é clara.  
- **API:** muitas rotas em `app/api/` (consultas, pagamentos, prescrições, admin, cron, webhooks); padrão de handlers GET/POST por `route.ts` está consistente.

### 3.2 Pontos de atenção

- **Duplicação de lógica de auth:** Várias rotas repetem `getServerSession` + `session.user.role === 'ADMIN'` (ou equivalente). Um helper central (ex.: `requireRole(['ADMIN'])` ou `requireAdmin()`) reduziria inconsistências e facilitaria adicionar SUBADMIN/operação por permissão de menu depois.  
- **SUBADMIN vs API:** O menu admin é filtrado por `adminMenuPermissions` no front (AdminLayout), mas as rotas em `app/api/admin/*` usam `canAccessAdmin(session.user.role)`, que inclui SUBADMIN. Ou seja, um SUBADMIN pode chamar APIs de áreas que não deveria ver (desde que conheça a URL). Recomenda-se, a médio prazo, validar também o grupo de menu na API para SUBADMIN.  
- **Código morto:** Há referências a `app/medico/consultas/[id]/v2/page.tsx` (deletada no git status). Verificar imports e links para essa rota e remover referências.  
- **Scripts com SQL bruto:** `scripts/fix-whatsapp-lead-birth-date.ts`, `lib/whatsapp-lead-birthdate-fix.ts` e `scripts/run-reschedule-invites-migration.ts` usam `$executeRawUnsafe` / `$queryRaw` com SQLite (strftime, etc.). São scripts de migração/manutenção, não usados em runtime; em produção com PostgreSQL, esses scripts não devem ser executados sem adaptação. Manter documentado que são para SQLite e não rodar em produção PostgreSQL.

---

## 4. Segurança

### 4.1 Autenticação e autorização

- **NextAuth** com Credentials, JWT, `maxAge` de sessão e cookie com `httpOnly`, `sameSite`, `secure` conforme `NEXTAUTH_URL` — adequado.  
- **Proteção de rotas:** Middleware redireciona `/admin`, `/paciente`, `/medico` etc. para `/login` quando não há cookie de sessão.  
- **APIs:** Maioria das rotas sensíveis usa `getServerSession(authOptions)` e verifica papel (ADMIN, DOCTOR, PATIENT).  
- **Consultas e prescrições:** Acesso por ID verifica ownership (paciente vê só as suas; médico vê só as suas).  
- **Webhook Stripe:** Assinatura validada com `stripe.webhooks.constructEvent(body, signature, webhookSecret)` — correto.

### 4.2 Outros riscos

- **Rate limiting:**  
  - Middleware: 200 req/15 min por IP em rotas de API (exceto auth e webhooks), só em produção.  
  - Em memória (`Map`). Com mais de uma instância PM2 ou escalonamento horizontal, o limite deixa de ser global.  
  - **Recomendação:** Em produção com mais de uma instância, usar Redis (já citado no próprio middleware).  

- **Webhooks WhatsApp/Twilio:**  
  - Rotas em `/api/whatsapp/*` estão excluídas do rate limit (adequado para callbacks externos).  
  - Garantir que a validação do webhook (token/assinatura) esteja sempre ativa conforme o provedor (Twilio/Meta).  

- **CSRF:** NextAuth lida com sessão/cookie; formulários críticos usam POST com origem mesma origem. Não foi identificado uso de tokens CSRF adicionais; para um SaaS com sessão cookie, o risco é mitigado pelo SameSite e pela origem. Manter formulários sempre por POST e sem GET com side-effects.  

- **Logs:**  
  - Em `app/api/consultations/[id]/notes/route.ts` há `console.log` com `session.user` (id, role). Em produção, evitar logar dados de sessão; usar apenas IDs opacos ou remover.  
  - `handleApiError` e outras rotas expõem `details` só em desenvolvimento — correto.

- **Secrets em logs:** Nenhum log direto de `password`, `secret` ou `token` em rotas de API foi encontrado. Scripts (ex.: `test-resend.ts`) logam trechos de API key; garantir que esses scripts não rodem em produção ou que não loguem nada sensível.

---

## 5. Banco de dados (PostgreSQL / Prisma)

- **Conexão:** `lib/prisma.ts` usa singleton por processo e `process.env.DATABASE_URL`. Em VPS com uma instância Node, isso é suficiente. Para serverless ou várias instâncias, a documentação já recomenda connection pooling (ex.: Supabase com porta 6543 e `?pgbouncer=true&connection_limit=1`).  
- **Queries:** Uso de Prisma ORM (sem concatenação de SQL) reduz risco de SQL injection. Os únicos usos de raw estão em scripts de migração (SQLite); em produção com PostgreSQL, não usar esses scripts sem adaptação.  
- **Índices:** O schema Prisma define índices em campos usados em filtros (ex.: `consultationId`, `patientId`, `status`, `scheduledAt`). Para crescimento de dados, monitorar consultas lentas e adicionar índices conforme necessário.  
- **Transações:** Onde há múltiplas escritas relacionadas (ex.: criar consulta + pagamento + token), verificar se estão em `prisma.$transaction([...])` para evitar estado inconsistente.  
- **Soft delete:** Uso de `deletedAt` em `User` está alinhado com não apagar dados definitivamente (compliance/LGPD).

---

## 6. Nginx

- **Configuração atual (`nginx/cannabilize.conf`, `cannabilize-so-ip.conf`):**  
  - Proxy para `http://127.0.0.1:3000` com headers `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` e `Upgrade` para WebSockets — correto.  
  - Só HTTP (porta 80). HTTPS fica por conta do Certbot (documentado em `NGINX_SSL_VPS.md`).

**Melhorias recomendadas (após Certbot ou em config manual):**

- **Timeouts:**  
  - `proxy_connect_timeout`, `proxy_send_timeout`, `proxy_read_timeout` (ex.: 60s) para evitar conexões presas.  
- **Buffer:**  
  - `proxy_buffer_size`, `proxy_buffers` para evitar 502 em respostas grandes.  
- **Segurança:**  
  - Headers como `X-Frame-Options`, `X-Content-Type-Options` já são aplicados pelo Next.js; Nginx pode reforçar ou deixar como está.  
  - Não expor porta 3000 externamente; apenas 80/443.  
- **Performance:**  
  - `gzip on` (e opcionalmente `brotli`) para compressão.  
  - Cache para assets estáticos (`/_next/static`, `/images`) com `proxy_cache` e `expires`.  

Exemplo de blocos úteis:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_cache_bypass $http_upgrade;
  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_read_timeout 60s;
  proxy_buffer_size 128k;
  proxy_buffers 4 256k;
}
```

---

## 7. Deploy e PM2

- **Build:** `package.json`: `"build": "prisma generate && next build"` — correto.  
- **Start:** `"start": "next start -p ${PORT:-3000}"` — usa `PORT` quando definido (ex.: 3000 no PM2).  
- **ecosystem.config.cjs:**  
  - `script: 'npm', args: 'start'`, `cwd`, `NODE_ENV: 'production'`, `instances: 1`, `exec_mode: 'fork'`, `autorestart: true`, `max_memory_restart: '500M'` — adequado para uma instância.  
- **Persistência:** É essencial rodar `pm2 save` e `pm2 startup` na VPS para o processo subir após reboot.  
- **Múltiplas instâncias:** Com `instances: 1` não há conflito de porta. Se no futuro usar `instances > 1`, será necessário sticky session ou stateless e rate limit/estado em Redis.

---

## 8. Variáveis de ambiente e secrets

- **.env.example** documenta NEXTAUTH_URL, NEXTAUTH_SECRET, DATABASE_URL, Stripe, Resend, SMTP, CRON_SECRET, reCAPTCHA, etc.  
- **Uso:** APIs leem `process.env.*`; não há secrets hardcoded nas rotas.  
- **Validação:** Não há checagem centralizada ao subir a aplicação (ex.: validar NEXTAUTH_SECRET, DATABASE_URL). Se uma variável obrigatória faltar, o erro pode aparecer só em runtime.  
- **Recomendação:**  
  - Em produção, validar ao startup as variáveis críticas (NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL, e em produção CRON_SECRET) e falhar rápido com mensagem clara.  
  - Manter NEXTAUTH_URL com HTTPS em produção e nunca commitar `.env` ou arquivos com credenciais.

---

## 9. Cron jobs e background jobs (VPS)

- **Vercel:** O `vercel.json` define crons; na VPS eles **não são executados** (são específicos da Vercel).  
- **VPS:** Os jobs devem ser agendados via **crontab** (ou equivalente), chamando as APIs com `Authorization: Bearer CRON_SECRET`. O projeto já tem `scripts/cron-call.sh` e documentação (ex.: `GUIA_DEPLOY_VPS.md`) para isso.  
- **Riscos já citados:**  
  - Se `CRON_SECRET` não estiver definido, três rotas de cron ficam abertas (whatsapp-reminder-auto, expire-reschedule-invites, whatsapp-follow-up).  
  - Duplicação de execução: se o crontab estiver mal configurado (ex.: duas entradas para a mesma URL), os jobs podem rodar em duplicidade. Garantir que cada job tenha uma única entrada e, quando possível, desenhar os jobs como idempotentes.  
- **Timezone:** Os jobs usam `new Date()` em Node; o fuso do servidor (TZ) deve estar correto (ex.: `America/Sao_Paulo`) para lembretes e expirações no horário esperado.  
- **Falha e retry:** Não há fila ou retry automático; se a chamada HTTP falhar, o cron não repete. Para maior confiabilidade, considerar log + alerta e, no futuro, fila (ex.: Redis/Bull) com retry.

---

## 10. Logging e monitoramento

- **Erros:** `handleApiError` e `console.error` em várias rotas; detalhes de erro só em desenvolvimento.  
- **Auditoria:** `AuditLog` e `createAuditLog` para login e ações sensíveis — bom para compliance.  
- **Produção:** Não há integração com serviço de APM (Sentry, Datadog, etc.) nem health check HTTP dedicado (ex.: `/api/health` público que verifique DB).  
- **Recomendações:**  
  - Adicionar rota `GET /api/health` que faça `prisma.$queryRaw\`SELECT 1\`` e retorne 200/503; usar no Nginx ou em monitoramento externo.  
  - Considerar Sentry (ou similar) para erros em produção.  
  - Evitar logar dados de sessão ou PII em produção; usar apenas IDs e códigos de erro.

---

## 11. Performance e escalabilidade

- **Next.js:** `swcMinify`, `reactStrictMode`, `compress: true` — adequado.  
- **Imagens:** `remotePatterns` e formatos AVIF/WebP configurados.  
- **Prisma:** Uso de `select`/`include` evita trazer colunas desnecessárias; em listagens grandes, garantir paginação (ex.: `take`/`skip` ou cursor).  
- **Rate limit em memória:** Com uma instância PM2 está ok; com várias instâncias é necessário Redis (ou equivalente) para limite global.  
- **Escalabilidade horizontal:** Para mais instâncias atrás do Nginx, a aplicação é stateless (sessão JWT); o ponto a resolver é estado compartilhado (rate limit, cache, filas) e connection pooling no banco (já orientado na documentação para Supabase/pooler).

---

## 12. Pontuação de produção e priorização

**Score geral de prontidão para produção: 6,0 / 10**

- **Crítico (corrigir antes de considerar “production-ready”):**  
  - Exigir `CRON_SECRET` em produção nas rotas de cron e bloquear execução quando ausente.  
  - Remover ou restringir ao máximo `ignoreBuildErrors: true` e tratar erros TypeScript.  
  - Garantir que nenhum arquivo com credenciais (ex.: connection string no `.bat`) seja versionado e rotacionar senhas se já foi.

- **Alta prioridade:**  
  - Ajustar rota de receita pública para aceitar status `ACTIVE` (e possivelmente `EXPIRING`).  
  - Configurar Nginx com timeouts e buffers.  
  - Validar variáveis de ambiente críticas no startup.  
  - Documentar e configurar crontab na VPS com `CRON_SECRET` e URLs corretas.

- **Média prioridade:**  
  - Rate limiting com Redis se houver mais de uma instância.  
  - Reforçar autorização por menu para SUBADMIN nas APIs admin.  
  - Health check `/api/health` e monitoramento de erros (ex.: Sentry).  
  - Revisar e remover `console.log` com dados de sessão.

- **Melhorias desejáveis:**  
  - Helper centralizado para “exigir role” nas APIs.  
  - Cache (ex.: Redis) para dados pouco voláteis.  
  - Idempotência e retry para jobs de cron.

---

## 13. Ações imediatas recomendadas (checklist)

1. [ ] Definir `CRON_SECRET` no `.env` da VPS e alterar as 3 rotas de cron para **exigir** esse secret em produção (retornar 401/503 se não definido ou inválido).  
2. [ ] Corrigir a rota `prescriptions/public/[id]` para aceitar status `ACTIVE` (e `EXPIRING` se fizer sentido).  
3. [ ] Remover credenciais de qualquer `.bat` ou script versionado; usar só `.env` na VPS.  
4. [ ] Configurar crontab na VPS com `CRON_SECRET` e chamadas para lembretes, payment reminders, expire-reschedule e whatsapp-follow-up (conforme documentação do projeto).  
5. [ ] Adicionar timeouts e buffers no Nginx (e, se ainda não estiver, ativar HTTPS com Certbot).  
6. [ ] Planejar remoção de `ignoreBuildErrors: true`: listar erros em `ERROS_TYPESCRIPT_BUILD.txt`, corrigir em lotes e depois desativar a flag.  
7. [ ] Verificar `pm2 save` e `pm2 startup` na VPS para persistência após reboot.  
8. [ ] (Opcional) Implementar `GET /api/health` com checagem de banco e usar em monitoramento.

---

## 14. Conclusão

O sistema tem base sólida de segurança (auth, roles, ownership, webhooks, sanitização, CSP) e está adequado para um primeiro deploy em VPS com uma instância. Os bloqueios principais para considerar o ambiente “production-safe” são: **proteção obrigatória das rotas de cron com CRON_SECRET**, **não ignorar erros de TypeScript no build** e **evitar qualquer vazamento de credenciais em repositório**. Com as correções críticas e de alta prioridade aplicadas, o score de prontidão pode subir para cerca de **7,5–8/10**, permitindo uso por usuários pagantes com monitoramento contínuo e evolução da dívida técnica (TypeScript, Redis, SUBADMIN por menu, observabilidade).
