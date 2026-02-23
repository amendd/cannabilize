# Avaliação do Projeto – Arquitetura, Segurança, Funcionalidades, UI/UX e Escalabilidade

Este documento consolida a análise técnica do projeto **clickcannabis-replica**, organizada em **Problemas críticos**, **Problemas médios** e **Sugestões de melhoria**, com impacto e solução recomendada para cada ponto.

---

## 1. Arquitetura e Código

### Problemas críticos

#### 1.1 Rotas de API sem verificação de papel (SUPER_ADMIN / OPERATOR)

**Problema:** A rota `GET /api/admin/health` exige apenas `session.user.role === 'ADMIN'`. Usuários com papel `SUPER_ADMIN` ou `OPERATOR` (que podem acessar o admin via `canAccessAdmin`) recebem 401 ao carregar os KPIs do dashboard.

**Impacto:** Dashboard admin exibe zeros ou falha para OPERATOR e SUPER_ADMIN; inconsistência entre permissões de UI e de API.

**Solução:** Usar a mesma regra de permissão das outras rotas admin (`canAccessAdmin`):

```ts
// app/api/admin/health/route.ts
import { canAccessAdmin } from '@/lib/roles-permissions';

// Trocar:
if (!session || session.user.role !== 'ADMIN') {
// Por:
if (!session || !canAccessAdmin(session.user.role)) {
```

---

#### 1.2 Código de serviço não utilizado (DRY / manutenção)

**Problema:** Existem `services/consultation.service.ts` e `services/user.service.ts` com lógica de negócio (ConsultationService, UserService), mas as API routes (ex.: `app/api/consultations/route.ts`) não os utilizam; a lógica está duplicada nas rotas.

**Impacto:** Duplicação de regras, risco de divergência de comportamento e mais custo para evoluir e testar.

**Solução:**  
- Opção A: Passar a usar os serviços nas API routes (criar consulta, atualizar usuário, etc.) e manter as rotas finas (validação de entrada, sessão, chamada ao serviço).  
- Opção B: Se a decisão for não usar camada de serviço, remover ou depreciar claramente os arquivos em `services/` e documentar que a lógica fica nas rotas.  
Recomendação: Opção A para melhor testabilidade e DRY.

---

### Problemas médios

#### 1.3 Duplicação de `getOrigin` / URL base

**Problema:** A função `getOrigin()` (ou equivalente) está implementada em `lib/whatsapp-lead-to-patient.ts`, enquanto `lib/app-url.ts` exporta `getAppOrigin(fallback?)` com prioridade de env (SITE_PUBLIC_URL, etc.). (Umbler Talk foi descontinuado; as rotas correspondentes retornam 410.)

**Impacto:** Violação de DRY; risco de links diferentes conforme a rota; manutenção mais difícil.

**Solução:** Remover a função local `getOrigin()` em `lib/whatsapp-lead-to-patient.ts` e usar apenas `getAppOrigin()` de `@/lib/app-url` (passando fallback quando necessário).

---

#### 1.4 Rate limit em memória e rota de debug

**Problema:** O rate limit no `middleware.ts` usa um `Map` em memória. Em múltiplas instâncias (Vercel, vários workers) cada instância tem seu próprio mapa. A rota `/api/debug/clear-rate-limit` está desabilitada em produção, mas continua exposta no código.

**Impacto:** Rate limit ineficaz em ambiente escalonado; rota de debug pode ser reativada por engano.

**Solução:**  
- Documentar que em produção o rate limit ideal é externo (ex.: Redis/Upstash).  
- Manter a rota de debug apenas em desenvolvimento ou protegê-la com um secret (ex.: header ou query) e não depender só de `NODE_ENV`.  
- Para produção multi-instância, implementar rate limit com Redis (ex.: `@upstash/ratelimit`).

---

#### 1.5 Falta de testes automatizados

**Problema:** Não há arquivos `*.test.ts/tsx` nem pasta `__tests__`. O projeto não está preparado para refatoração segura nem para CI.

**Impacto:** Regressões não detectadas; medo de mudar código; qualidade difícil de garantir.

**Solução:**  
- Introduzir Jest (ou Vitest) + React Testing Library.  
- Priorizar: (1) `lib/roles-permissions.ts`, (2) `lib/auth` (authorize), (3) serviços em `lib/` (availability, consultation-config, etc.), (4) componentes críticos (formulário de agendamento, login).  
- Rodar testes no CI em todo PR.

---

### Sugestões de melhoria (arquitetura/código)

- **Padronizar tratamento de erro nas APIs:** Usar `handleApiError` de `lib/error-handler.ts` em todas as rotas que ainda fazem `try/catch` e retornam JSON manualmente, para respostas e códigos HTTP consistentes e sem vazamento de stack em produção.  
- **Tipagem do Prisma:** Evitar `(user as any).deletedAt` e `(user as any).passwordChangedAt`; garantir que o schema Prisma e os tipos gerados reflitam esses campos ou estender o tipo do User no projeto.  
- **Organização de pastas:** A pasta `app/api` está coerente com domínios (admin, consultations, payments, etc.). Manter esse padrão e, ao crescer, considerar agrupar por domínio (ex.: `api/consultations/` com sub-rotas) em vez de espalhar lógica em `lib` sem naming claro.  
- **Performance:** Consultas em `admin/health` já usam `Promise.all`; em listagens pesadas (ex.: pacientes com muitas relações), usar `select`/`include` mínimos e paginação (cursor ou offset) para evitar N+1 e payloads grandes.

---

## 2. Segurança

### Problemas críticos

#### 2.1 ~~Umbler Talk: autenticação opcional~~ (Resolvido – integração descontinuada)

A integração **Umbler Talk** foi descontinuada. As rotas `POST /api/umbler-talk/confirm-booking` e `POST /api/whatsapp/umbler-webhook` retornam **410 Gone** e não processam mais requisições. Use Z-API ou Twilio para WhatsApp.

---

#### 2.2 Receita pública por ID (exposição de dados sensíveis)

**Problema:** `GET /api/prescriptions/public/[id]` retorna nome, CPF e e-mail do paciente apenas com o ID da receita (UUID). Quem obtiver o ID (ex.: vazamento, enumeração, link em outro canal) pode acessar dados pessoais sem token.

**Impacto:** Violação de confidencialidade e LGPD; exposição de dados de saúde.

**Solução:**  
- Exigir um token de uso único (ou token de curta duração) gerado no momento do compartilhamento (ex.: QR code ou link “compartilhar receita”) e validar esse token na rota pública.  
- Ou restringir a rota a um hash não reversível (ex.: id + HMAC(secret, id)) em vez de UUID puro.  
- Manter a política atual somente se o ID for considerado “secreto” e não previsível (UUID v4) e o produto aceitar o risco; mesmo assim, considerar token explícito para auditoria.

---

#### 2.3 Sanitização de inputs não aplicada nas APIs

**Problema:** Existe `lib/security/sanitize.ts` (sanitizeHtml, sanitizeString, etc.), mas nenhuma rota da API o utiliza. Vários endpoints aceitam JSON (nome, anamnese, comentários, etc.) e gravam no banco ou reenviam em e-mails sem sanitizar.

**Impacto:** Risco de XSS armazenado (se esses campos forem exibidos em HTML) e de injeção de conteúdo indesejado em e-mails ou relatórios.

**Solução:**  
- Para campos que podem ser exibidos em HTML (ex.: anamnese, notas, comentários), sanitizar antes de persistir ou ao exibir (ex.: `sanitizeHtml` ou biblioteca como DOMPurify no front e sanitize no back).  
- Para APIs que aceitam texto livre, aplicar pelo menos `sanitizeString` (ou equivalente) antes de gravar.  
- Manter validação com Zod (tipo e formato) e usar sanitização como camada adicional para segurança.

---

### Problemas médios

#### 2.4 Webhooks WhatsApp (Z-API / Umbler) sem verificação de assinatura

**Problema:** O webhook Stripe valida assinatura com `STRIPE_WEBHOOK_SECRET`. Os webhooks WhatsApp (Z-API, Umbler) não implementam verificação equivalente (token no header, assinatura no body, etc.) no código analisado.

**Impacto:** Terceiros podem enviar POST para a URL do webhook e simular mensagens, levando a criação de leads, notificações ou respostas automáticas indevidas.

**Solução:**  
- Consultar a documentação da Z-API e da Umbler sobre assinatura ou token de verificação do webhook.  
- Validar token/assinatura em toda requisição POST ao webhook; rejeitar com 401/403 quando inválido.  
- Não processar corpo até a verificação ser bem-sucedida.

---

#### 2.5 CSP com `unsafe-inline` e `unsafe-eval`

**Problema:** No `middleware.ts`, o CSP inclui `'unsafe-inline'` e `'unsafe-eval'` em `script-src` para permitir reCAPTCHA e possivelmente outros scripts. Isso enfraquece a proteção contra XSS.

**Impacto:** Maior superfície para XSS se algum conteúdo controlado pelo atacante for refletido em página que execute script.

**Solução:**  
- Usar nonces ou hashes para scripts permitidos (Next.js e reCAPTCHA suportam) em vez de `unsafe-inline` quando possível.  
- Manter `unsafe-eval` apenas se estritamente necessário (ex.: lib que exige eval); caso contrário, remover.  
- Revisar se todos os domínios em `script-src` e `frame-src` são realmente necessários.

---

#### 2.6 Credenciais e variáveis de ambiente

**Problema:** O `.env.example` está bem comentado, mas não há checklist de “obrigatório em produção” (ex.: NEXTAUTH_SECRET, STRIPE_WEBHOOK_SECRET, RECAPTCHA_SECRET_KEY). Algumas chaves, se ausentes, deixam o sistema aberto ou quebrado.

**Impacto:** Deploy em produção sem uma chave crítica (ex.: NEXTAUTH_SECRET fraco ou ausente, webhook sem secret).

**Solução:**  
- Manter um “Checklist de produção” (pode ser no README ou em PREPARACAO_PRODUCAO.md) listando variáveis obrigatórias e o que acontece se faltar.  
- No código, onde for crítico (ex.: webhook Stripe, NextAuth), falhar de forma clara (log + 500/503) se a variável não estiver definida em produção, em vez de seguir com comportamento inseguro.

---

### Sugestões de melhoria (segurança)

- **CSRF:** NextAuth já lida com CSRF para sessão; garantir que formulários críticos (agendamento, pagamento, alteração de senha) usem sessão/cookie e, se houver formulários que não passem pelo NextAuth, considerar tokens CSRF.  
- **Headers de segurança:** O middleware já define CSP, X-Frame-Options, HSTS, etc. O `next.config.js` também define alguns headers (ex.: X-Frame-Options SAMEORIGIN). Unificar em um único lugar (recomendação: middleware) para evitar conflitos e facilitar manutenção.  
- **Auditoria e logs:** O uso de `createAuditLog` em login e em ações sensíveis é positivo; estender para alterações de perfil, papel de usuário e acesso a dados sensíveis (ex.: exportação de pacientes).  
- **Senha:** Manter bcrypt com custo adequado (ex.: 10+ rounds) e política de senha (já há mínimo 6 caracteres no setup-password); considerar exigir complexidade mínima e não permitir senhas comuns.

---

## 3. Funcionalidades e Estabilidade

### Problemas críticos

- Nenhum bug crítico de funcionalidade quebrada foi identificado com base apenas na análise estática. Recomenda-se testes manuais dos fluxos principais (agendamento, pagamento, receita, login por papel, admin/OPERATOR).

### Problemas médios

#### 3.1 Inconsistência de permissão admin (health)

**Problema:** Como na seção 1.1, OPERATOR e SUPER_ADMIN não conseguem carregar os KPIs do dashboard porque a rota `/api/admin/health` só aceita `ADMIN`.

**Impacto:** Funcionalidade “quebrada” para esses papéis.

**Solução:** Mesma correção indicada em 1.1: usar `canAccessAdmin(session.user.role)`.

---

#### 3.2 Tratamento de erro e mensagens ao usuário

**Problema:** Em várias rotas, em caso de erro genérico retorna-se apenas “Erro ao …” sem código ou identificador, o que dificulta suporte e debugging.

**Impacto:** Usuário e suporte não sabem o que falhou; difícil correlacionar com logs.

**Solução:**  
- Retornar um `code` estável (ex.: `CONSULTATION_SLOT_UNAVAILABLE`) junto da mensagem amigável.  
- Em produção, não retornar stack; opcionalmente retornar um `requestId` (ou correlation id) para o usuário informar no suporte e buscar no log.

---

### Sugestões de melhoria (funcionalidades)

- **Validação de entrada:** Manter e expandir o uso de Zod (ou equivalente) em todas as rotas que recebem JSON; evitar `body as T` sem validação.  
- **Idempotência:** Em criação de consulta/pagamento via webhook ou integração externa, considerar chave idempotente para evitar duplicatas em retentativas.  
- **Feedback visual:** Garantir loading e desabilitação de botões em submits (ex.: agendamento, login, conclusão de cadastro) e mensagens de sucesso/erro consistentes (já há uso de toast em vários pontos; padronizar).

---

## 4. UI, UX e Design

### Problemas críticos

- Nenhum problema crítico puramente de UI/UX foi identificado sem testes reais de usabilidade. Abaixo itens médios e melhorias.

### Problemas médios

#### 4.1 Contraste e acessibilidade

**Problema:** Em `globals.css` há `color: #111827` e placeholders em `#6b7280`. Em temas escuros (`prefers-color-scheme: dark`) o fundo é `#0a0a0a` e o texto `#ededed`; componentes que usam cores fixas (ex.: cinza claro em inputs) podem ter contraste insuficiente.

**Impacto:** Dificuldade de leitura para usuários com baixa visão ou em certos monitores; possível não conformidade com WCAG.

**Solução:**  
- Garantir razão de contraste mínima (4.5:1 para texto normal) em todos os estados (normal, hover, disabled).  
- Usar variáveis CSS para texto e fundo e evitar cores fixas que quebrem no dark mode.  
- Testar com ferramentas (ex.: axe DevTools, Lighthouse) e corrigir focos de teclado e labels de formulário.

---

#### 4.2 Consistência de feedback (loading / erro)

**Problema:** Em algumas páginas o loading é apenas estado local (spinner/skeleton), em outras pode haver apenas texto. Padrão de “botão desabilitado + loading” não está unificado.

**Impacto:** Usuário pode clicar várias vezes ou achar que a aplicação travou.

**Solução:**  
- Padronizar: durante submit, desabilitar o botão e mostrar indicador (spinner no botão ou toast “Processando…”).  
- Usar um componente global de loading (ex.: LoadingPage/Skeleton) nas transições de página quando fizer sentido.

---

### Sugestões de melhoria (UI/UX)

- **Hierarquia e densidade:** Em tabelas do admin (consultas, pacientes), manter cabeçalhos claros e espaçamento consistente; evitar telas excessivamente carregadas.  
- **Responsividade:** O menu mobile já usa `min-h-[44px]` para área de toque; revisar listas e formulários em mobile (inputs e botões com altura mínima, espaçamento adequado).  
- **Navegação:** Breadcrumbs e títulos de página ajudam; garantir que todas as áreas (admin, médico, paciente) tenham contexto claro (onde estou, como voltar).  
- **Tipografia:** O uso de Arial/Helvetica em `body` é genérico; considerar uma fonte mais característica (mantendo legibilidade e acessibilidade) para reforçar identidade visual.

---

## 5. Qualidade Geral e Escalabilidade

### Problemas médios

#### 5.1 Escalabilidade horizontal (rate limit e sessão)

**Problema:** Rate limit em memória e sessão JWT (NextAuth) não compartilhados entre instâncias. Em múltiplas réplicas, o rate limit por IP fica fragmentado e a revogação de sessão (ex.: alteração de senha) depende de expiração do JWT.

**Impacto:** Em escala, rate limit ineficaz; revogação imediata de sessão limitada.

**Solução:**  
- Rate limit: usar Redis (ou serviço gerenciado) com mesma chave (ex.: IP ou userId).  
- Sessão: manter JWT com TTL curto e refresh token em armazenamento compartilhado se precisar de revogação imediata; ou aceitar que a revogação efetiva ocorre na próxima renovação do JWT.

---

#### 5.2 Banco de dados (SQLite)

**Problema:** O schema usa SQLite. Para produção com muitos usuários e concorrência, SQLite pode ser gargalo (escrita única, backups, replicação).

**Impacto:** Limite de crescimento e de resiliência (backup, failover).

**Solução:**  
- Para produção, planejar migração para PostgreSQL (ou MySQL) com Prisma; o schema já está em Prisma, o que facilita a troca de provider.  
- Manter SQLite para desenvolvimento e testes locais; documentar o path de migração para produção.

---

### Sugestões de melhoria (escalabilidade e qualidade)

- **Modularidade:** Manter domínios bem separados (consultas, pagamentos, prescrições, usuários) e evitar importações cruzadas entre domínios; os serviços em `services/` podem ser o ponto de entrada por domínio.  
- **Testabilidade:** Com a introdução de testes (1.5), a lógica em `lib/` e em serviços fica testável sem subir a aplicação; as API routes ficam mais finas e estáveis.  
- **Configuração:** Centralizar constantes (ex.: duração de sessão, limites de rate limit, tamanhos de página) em `lib/consultation-config.ts` ou arquivo de config por ambiente, em vez de espalhar números mágicos.  
- **Documentação de API:** Considerar OpenAPI/Swagger para as rotas principais (admin, consultas, pagamentos) para integrações e onboarding de desenvolvedores.

---

## 6. Resumo das prioridades sugeridas

| Prioridade | Ação |
|-----------|------|
| Alta      | Corrigir permissão em `/api/admin/health` (SUPER_ADMIN/OPERATOR). |
| —         | ~~Umbler Talk~~ Integração descontinuada (rotas retornam 410). |
| Alta      | Proteger receita pública por token ou mecanismo equivalente; não expor PII só com ID. |
| Alta      | Aplicar sanitização (`lib/security/sanitize`) em campos de texto livre nas APIs. |
| Média     | Unificar origem da URL (`getAppOrigin`) e remover duplicação de `getOrigin`. |
| Média     | Validar assinatura/token nos webhooks WhatsApp (Z-API, Umbler). |
| Média     | Revisar CSP (reduzir/eliminar unsafe-inline e unsafe-eval onde possível). |
| Média     | Usar serviços (ConsultationService, UserService) nas API routes ou remover serviços. |
| Média     | Introduzir testes automatizados e rate limit com Redis para produção. |
| Baixa     | Padronizar tratamento de erro (handleApiError), códigos e requestId. |
| Baixa     | Melhorar contraste e acessibilidade (WCAG) e documentar checklist de env para produção. |

---

*Documento gerado com base em análise estática do repositório. Recomenda-se testes manuais e de integração para validar fluxos críticos e revisar periodicamente as recomendações de segurança.*
