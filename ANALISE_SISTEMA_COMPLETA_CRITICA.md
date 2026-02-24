# Análise Completa, Profunda e Crítica do Sistema — Cannabilize

**Data:** 30/01/2025  
**Escopo:** Código, estrutura, layout, fluxos e decisões atuais. Foco em inconsistências, melhorias técnicas, produto, UX/UI, fluxos e riscos.

---

# 1. INCONSISTÊNCIAS E ERROS

## 1.1 Segurança e Autorização

### 1.1.1 API pública de consulta expõe dados sensíveis (LGPD/Healthtech)

**Problema:** A rota `GET /api/consultations/[id]/public` **não exige autenticação**. Qualquer pessoa que conheça (ou enumere) um UUID de consulta obtém:
- Nome do paciente
- Email do paciente
- Data/hora da consulta
- Status e valor do pagamento

Em healthtech isso é **vazamento de dado de saúde** (contexto de consulta + identificação). UUIDs são previsíveis/ enumeráveis em volume.

**Solução:**  
- Exigir um **token efêmero** (ex.: enviado por email após agendamento/pagamento) como query param ou header, validado no backend.  
- Ou retornar apenas dados mínimos não identificáveis (ex.: “Consulta confirmada para DD/MM”) e nunca email/nome em endpoint público.  
- Documentar claramente o que é “público” e aplicar rate limit + logging de acesso.

---

### 1.1.2 Middleware não protege rotas por papel

**Problema:** O `middleware.ts` atual **não redireciona** usuários não autenticados de `/admin`, `/paciente` ou `/medico`. Só aplica rate limit em APIs e headers de segurança. Quem acessa `/admin` vê o layout (e possivelmente conteúdo) até o React redirecionar no client.

**Consequência:** Flash de conteúdo restrito, pior SEO, e dependência total da verificação em cada página (useEffect + redirect).

**Solução:**  
- No middleware, para rotas que começam com `/admin`, `/paciente`, `/medico`, verificar cookie de sessão NextAuth e redirecionar para `/login` se ausente.  
- Manter a checagem de **role** nas páginas (admin só ADMIN, etc.), pois o middleware não tem acesso fácil ao role sem decodificar JWT.

---

### 1.1.3 Admin e médico compartilham o mesmo dashboard admin

**Problema:** Várias APIs “admin” aceitam `session.user.role === 'ADMIN' || session.user.role === 'DOCTOR'` (ex.: `/api/admin/consultations`, `/api/admin/stats`, `/api/admin/health`). O médico passa a ver:
- Lista de **todas** as consultas da clínica  
- Estatísticas globais (receita total, total de pacientes)  
- Health check do sistema  

**Risco:** Quebra de confidencialidade (médico vê dados de outros médicos) e de regra de negócio (médico não deveria ver receita total da clínica, a menos que seja regra explícita).

**Solução:**  
- Separar claramente: rotas **apenas ADMIN** (stats globais, lista de todas as consultas, health) e rotas **médico** (suas consultas, suas métricas).  
- Ex.: `/api/admin/consultations` → só ADMIN; médico usa `/api/doctors/me/consultations`.  
- Remover DOCTOR do dashboard admin ou criar um “admin médico” com escopo limitado e documentado.

---

### 1.1.4 Impersonation baseada em sessionStorage

**Problema:** O “impersonate paciente” usa `sessionStorage` (`admin_impersonated_patient_id`). O backend em várias rotas confia no `patientId` enviado pelo cliente quando a sessão é ADMIN (ex.: `/api/patient/reschedule-invites?patientId=...`).  
- Se alguma API esquecer de validar que o `patientId` é realmente o impersonado (ou o paciente da sessão), pode haver elevação de privilégio.  
- sessionStorage não é enviado ao servidor; portanto o servidor precisa de outra forma de saber “quem está sendo impersonado” (ex.: header ou param validado apenas para ADMIN).

**Solução:**  
- Centralizar a lógica: todas as APIs que aceitam `patientId` para ADMIN devem validar que esse paciente existe e que o usuário é ADMIN.  
- Considerar um token/cookie assinado de impersonation (gerado no backend ao iniciar impersonation) em vez de confiar só em query params.

---

## 1.2 Arquitetura e Código

### 1.2.1 Duplicação da página de consulta do médico (v1 vs v2)

**Problema:** Existem duas páginas completas para a mesma jornada:  
- `app/medico/consultas/[id]/page.tsx`  
- `app/medico/consultas/[id]/v2/page.tsx`  

Ambas têm lógica similar (carregar consulta, anotações, prescrição, vídeo, finalizar). Isso duplica bugs, manutenção e confunde qual é a “fonte da verdade”.

**Solução:**  
- Escolher **uma** versão (ex.: v2 se for a desejada), migrar qualquer comportamento único da v1 e **remover** a outra.  
- Se quiser A/B test, fazer isso por feature flag no código, não por duas rotas permanentes.

---

### 1.2.2 Valor da consulta fixo no código

**Problema:** O valor da consulta (50.0) está hardcoded em:
- `app/api/consultations/route.ts` (criação do pagamento)
- `app/api/payments/create-intent/route.ts` (fallback)
- `app/consultas/[id]/pagamento/page.tsx` (fallback)

**Consequência:** Para mudar o preço é necessário alterar código e deploy. Não há configuração por ambiente ou pela área admin.

**Solução:**  
- Criar chave em `SystemConfig` (ex.: `CONSULTATION_DEFAULT_AMOUNT`) ou tabela de “preços/planos”.  
- Admin define valor (e possivelmente por tipo de consulta).  
- APIs e front usam esse valor com fallback apenas para compatibilidade.

---

### 1.2.3 Dados de contato placeholder em produção

**Problema:** Na página de confirmação da consulta (`app/consultas/[id]/confirmacao/page.tsx`) o telefone exibido é literalmente `(00) 00000-0000`. Vários placeholders de telefone no projeto usam esse valor.

**Solução:**  
- Usar configuração (SystemConfig ou env) para telefone e email de contato da clínica.  
- Exibir esses valores nas telas públicas e no rodapé; nunca deixar placeholder em produção.

---

### 1.2.4 Inconsistência de nomes: Cannabilize vs Cannalize

**Problema:** No layout raiz o metadata usa “Cannabilize”; em vários lugares a logo e referências usam “Cannabilize” ou “Cannalize”. Imagem em `public` é `cannalize-logo.png`.  
Pode ser apenas grafia, mas gera dúvida de marca e parece descuido.

**Solução:**  
- Definir um único nome oficial (ex.: Cannabilize) e usar em metadata, alt texts e documentação.  
- Renomear assets se necessário (ex.: `cannabilize-logo.png`) e atualizar referências.

---

### 1.2.5 Auditoria pouco utilizada

**Problema:** O módulo `lib/audit.ts` existe e está bem definido, mas `createAuditLog` é usado em poucos pontos (user delete/export, webhook de pagamento, alguns services).  
Ações sensíveis como alteração de receita, alteração de dados do paciente, login, alteração de role, acesso a dados de saúde não estão todas auditadas.

**Solução:**  
- Listar todas as ações que devem ser auditadas (LGPD + boas práticas healthtech).  
- Incluir chamadas a `createAuditLog` (ou `createAuditLogAsync`) em: login/logout, alteração de usuário/paciente/médico, emissão/edição de receita, acesso a dados sensíveis (export, visualização em massa).  
- Garantir que falha do audit não quebre a operação (já está assim com try/catch).

---

## 1.3 Banco de Dados e Modelo

### 1.3.1 SQLite em produção

**Problema:** O schema Prisma usa `provider = "sqlite"`. SQLite é adequado para desenvolvimento ou baixo volume, mas para produção com múltiplos acessos concorrentes, backups robustos e escalabilidade, costuma-se usar PostgreSQL (ou MySQL).

**Solução:**  
- Planejar migração para PostgreSQL (Prisma suporta bem).  
- Ajustar tipos se necessário (ex.: JSON nativo).  
- Manter SQLite apenas para dev/local se desejado.

---

### 1.3.2 Roles e enums como string livre

**Problema:** O campo `User.role` é `String` e os comentários indicam valores como "PATIENT", "DOCTOR", "ADMIN". Não há constraint no banco; typos ou valores inválidos podem quebrar lógica de autorização.

**Solução:**  
- No mínimo, centralizar em constantes/union types no TypeScript e validar em APIs (ex.: `if (!['PATIENT','DOCTOR','ADMIN'].includes(session.user.role))`).  
- Ideal: usar enum no Prisma (quando migrar para um provider que suporte bem) ou check constraint no banco.

---

### 1.3.3 Campos sensíveis em texto plano

**Problema:** Credenciais de integração (EmailConfig, WhatsAppConfig, TelemedicineConfig, PaymentMethod) guardam apiKey, authToken, etc. em texto. Se o banco vazar, todos os serviços ficam comprometidos.

**Solução:**  
- Criptografar em repouso (campo cifrado com chave em env/cofre).  
- Usar um secrets manager (AWS Secrets Manager, Vault) para produção e injetar em runtime quando possível.

---

## 1.4 Inconsistências Visuais e de Experiência

### 1.4.1 Botão de notificações sem funcionalidade

**Problema:** No AdminLayout e em outros layouts há um botão de sino (Bell) com badge vermelho, mas não há implementação de centro de notificações (lista, marcar como lido, etc.). Gera expectativa falsa.

**Solução:**  
- Remover o botão até existir feature real, ou  
- Implementar um dropdown mínimo (ex.: últimas ações pendentes vindas do backend) e esconder o badge quando não houver itens.

---

### 1.4.2 Tratamento de erro genérico no login

**Problema:** Na página de login, qualquer falha (rede, 500, credenciais) pode resultar em “Email ou senha inválidos”. O usuário não sabe se o problema é credencial, conta inexistente ou servidor.

**Solução:**  
- Diferenciar 401 (credenciais) de 5xx (erro de servidor) e exibir mensagens distintas.  
- Evitar revelar se o email existe ou não (para não facilitar enumeração de contas); mensagem genérica para credenciais é aceitável.

---

# 2. MELHORIAS TÉCNICAS (ENGENHARIA)

## 2.1 Estrutura de Pastas e Domínios

**Situação atual:**  
- `app/` mistura rotas de página e API por feature (bom).  
- `components/` agrupa por tipo (admin, medico, patient, layout, ui).  
- `lib/` concentra auth, prisma, email, telemedicina, segurança, etc.

**Sugestões:**  
- Introduzir uma camada de **serviços** por domínio (já existe `services/` com user e consultation). Expandir para: `services/consultation.service.ts`, `services/payment.service.ts`, `services/prescription.service.ts`, e usar nas API routes. Isso reduz duplicação e centraliza regras.  
- Agrupar helpers de um mesmo domínio em pastas: `lib/consultation/`, `lib/payment/`, mantendo `lib/auth.ts`, `lib/prisma.ts` no root.  
- Manter `types/` com tipos globais e estender com DTOs de API (request/response) quando fizer sentido.

---

## 2.2 Backend e APIs

- **Validação:** Já existe Zod em algumas rotas (ex.: POST consultas). Padronizar: todas as entradas de POST/PUT validadas com Zod (ou equivalente) e respostas com tipo conhecido.  
- **Erros:** Criar um `error-handler` central (já existe `lib/error-handler.ts`): mapear exceções para códigos HTTP e mensagens seguras (sem stack em produção).  
- **Idempotência:** Em criação de pagamento e webhooks, considerar chave de idempotência para evitar duplicidade em retentativas.  
- **Versionamento de API:** Se no futuro houver consumo por terceiros, prefixar versão (ex.: `/api/v1/...`).

---

## 2.3 Frontend

- **Estado global:** Não há Redux/Zustand visível; estado local e fetch direto predominam. Para fluxos complexos (ex.: wizard de agendamento, múltiplos passos de pagamento), considerar React Query (TanStack Query) para cache, loading e refetch, reduzindo duplicação de `useEffect` + `fetch`.  
- **Tipos:** Reduzir `any` em consultas e respostas de API; definir interfaces para responses (ex.: `ConsultationWithRelations`) e usar nos componentes.  
- **Testes:** Não há testes automatizados visíveis. Priorizar: testes de integração para APIs críticas (agendamento, pagamento, prescrição) e testes unitários para funções de negócio (availability, consultation-config).

---

## 2.4 Logs, Rastreabilidade e Observabilidade

- **Request ID:** Adicionar um `x-request-id` (ou similar) no middleware e repassar para logs e audit. Facilita rastrear uma requisição da ponta a ponta.  
- **Logs estruturados:** Padronizar formato (JSON) e níveis (info, warn, error). Evitar `console.log` solto em produção.  
- **Métricas:** Expor endpoint de health (já existe `/api/admin/health`) e considerar métricas básicas (contagem de requests por rota, latência) para preparar escalabilidade.

---

## 2.5 Preparação para Crescimento

- **Rate limit:** Hoje em memória; em múltiplas instâncias não escala. Migrar para Redis (ou equivalente) para contadores compartilhados.  
- **Filas:** Envio de email e WhatsApp em background (já são fire-and-forget em vários pontos). Formalizar com fila (Bull, Inngest, etc.) para retry e monitoramento.  
- **Cache:** Para configurações (SystemConfig, telemedicina, preço da consulta) que mudam pouco, cache em memória com TTL reduz carga no banco.

---

# 3. MELHORIAS DE PRODUTO E NEGÓCIO

## 3.1 Proposta de valor por dashboard

- **Admin:** Hoje é um painel operacional (consultas, receitas, pacientes, médicos, integrações). Falta uma “home” que responda: “O que preciso fazer hoje?” (pendências, alertas, métricas do dia). Reforçar KPIs e próximas ações.  
- **Paciente:** O dashboard já mostra próxima consulta, convites de remarcação e histórico. Pode destacar mais “próximos passos” (ex.: pagamento pendente, documento pendente, retorno sugerido) e um CTA claro para agendar nova consulta.  
- **Médico:** Foco em “minha agenda hoje”, “consultas pendentes de receita”, “convites de adiantamento”. Reduzir ruído de informações que não são do médico (ex.: receita global da clínica, se não for política do produto).

---

## 3.2 Barreiras e conversão

- **Cadastro no agendamento:** O fluxo já cria conta automaticamente e envia link de conclusão de senha. Garantir que o email de “definir senha” seja claro e que o link não expire muito rápido (verificar `AccountSetupToken`).  
- **Pagamento após agendar:** O caminho agendamento → confirmação → pagamento está separado. Um resumo único “Você agendou; pague agora para confirmar” com botão direto para pagamento pode reduzir abandono.  
- **Primeiro acesso do paciente:** Após login, um pequeno onboarding (“Aqui estão suas consultas”, “Aqui você paga”) pode reduzir confusão, principalmente para usuários menos digitais.

---

## 3.3 Features estratégicas sugeridas

- **Lembretes e notificações in-app:** Além de email/WhatsApp, um centro de notificações no app (com badge real) aumenta engajamento e sensação de cuidado.  
- **Avaliação pós-consulta:** Coletar satisfação (NPS ou nota) após consulta concluída; útil para qualidade e marketing.  
- **Prontuário resumido para o paciente:** Histórico de consultas + receitas + documentos em uma linha do tempo, exportável (LGPD).  
- **Configuração de preço e descontos:** Admin poder definir valor da consulta e eventualmente cupons ou descontos por campanha.

---

# 4. UI/UX (EXPERIÊNCIA DO USUÁRIO)

## 4.1 Consistência visual entre dashboards

- **Cores e identidade:** Admin (azul), Paciente (roxo/azul), Médico (verde) diferenciam bem os contextos. Garantir que botões primários, estados de erro e links sigam o mesmo padrão dentro de cada área (ex.: sempre o mesmo “primary” no admin).  
- **Componentes:** Há uso de `components/ui` (Button, Card, Input, Modal). Padronizar todas as telas nesses componentes e evitar estilos inline ou classes Tailwind repetidas para o mesmo conceito (ex.: um `EmptyState` único já existe; reutilizar em todas as listas vazias).  
- **Tipografia:** Várias fontes carregadas (Inter, Poppins, Montserrat, Lato, Roboto) podem pesar e gerar inconsistência. Definir hierarquia clara (título, subtítulo, corpo, legenda) e usar no máximo 2–3 fontes.

---

## 4.2 Usabilidade e clareza

- **Hierarquia:** Em listas longas (consultas, pacientes), usar tabelas ou cards com informações principais em destaque e ações secundárias visíveis (ex.: “Ver”, “Pagar”, “Entrar na reunião”).  
- **Feedback:** Após ações (salvar, enviar, pagar), sempre toast ou mensagem clara de sucesso/erro. Já existe `react-hot-toast`; garantir que nenhuma ação crítica fique sem feedback.  
- **Loading:** Usar skeletons ou loading consistente (ex.: `LoadingPage`, `SkeletonDashboard`) em todas as telas que dependem de API, para evitar “tela em branco” ou layout que pula.

---

## 4.3 Acessibilidade

- **Skip link:** Já existe “Pular para conteúdo principal” no layout; manter e testar com teclado e leitor de tela.  
- **Contraste e foco:** Revisar contraste de texto (WCAG) e estados de foco em botões e links (visible focus ring).  
- **Labels e formulários:** Garantir que todos os inputs tenham `<label>` associado ou `aria-label`; evitar placeholders como única descrição.  
- **Modais e overlays:** Fechar com ESC e manter foco preso no modal (focus trap) e devolver foco ao botão que abriu ao fechar.

---

## 4.4 Onboarding e orientação

- **Paciente novo:** Na primeira vez em “Minhas Consultas” vazio, o `EmptyState` já sugere “Começar meu tratamento” com link para agendamento. Replicar essa ideia em Receitas, Pagamentos e Documentos.  
- **Médico:** Na primeira vez na área médica, um passo a passo curto (“Configure seus horários”, “Veja suas consultas”) pode ajudar.  
- **Admin:** Lista de “primeiras configurações” (telemedicina, email, WhatsApp, métodos de pagamento) na home ou em uma página “Configuração inicial” reduz tempo até o sistema estar operacional.

---

# 5. FLUXOS E JORNADAS

## 5.1 Jornada do paciente

1. **Agendamento (não logado):** Formulário único → criação de conta implícita + consulta + pagamento pendente.  
   - Ponto de fricção: muitos campos (incluindo patologias). Considerar wizard em passos ou pré-seleção de “motivo da consulta” para encurtar.  
2. **Confirmação:** Página pública com token/ID mostra detalhes e permite upload de documentos e “definir senha / login”.  
   - Risco: link público sem token pode vazar dados (já citado).  
3. **Pagamento:** Fluxo separado (consultas/[id]/pagamento). Integração Stripe; em dev há auto-confirmação.  
   - Garantir que após pagamento o usuário seja direcionado para confirmação ou área do paciente, e que o email de confirmação seja enviado.  
4. **Área do paciente:** Dashboard, consultas, receitas, pagamentos, documentos, carteirinha.  
   - Convites de remarcação bem destacados são um diferencial. Manter e garantir que a resposta (aceitar/recusar) seja simples e com feedback claro.

**Sugestão:** Desenhar um diagrama de estados (agendado → pago → realizado → receita emitida) e garantir que cada tela e email reflitam esse estado, evitando mensagens contraditórias.

---

## 5.2 Jornada do médico

1. **Login → Dashboard:** Ver consultas do dia e pendências.  
2. **Consulta:** Abrir detalhe da consulta, anotações, documentos do paciente, vídeo, prescrição, data de retorno, encerrar chamada.  
   - Duplicação v1/v2 atrapalha; unificar em uma experiência só.  
3. **Disponibilidade:** Configuração de horários por dia da semana.  
4. **Financeiro:** Repasses e dados de conta PIX.  

**Sugestão:** Reduzir cliques para “entrar na consulta” (um botão direto do dashboard para a reunião ou para a tela da consulta). Alertas sonoros já existem; garantir que não sejam intrusivos e que possam ser desligados.

---

## 5.3 Jornada do admin

- **Operacional:** Consultas, receitas, pacientes, médicos, carteirinhas.  
- **Regulatório:** ANVISA, medicamentos.  
- **Conteúdo:** Blog, galeria, artigos em destaque.  
- **Integrações:** Telemedicina, email, WhatsApp, pagamentos, analytics.  

**Sugestão:** Uma aba ou bloco “Pendências” na home (carteirinhas para aprovar, receitas pendentes, consultas sem pagamento) com links diretos para cada item. Isso reduz tempo para “o que fazer agora”.

---

# 6. RISCOS E PONTOS DE ATENÇÃO

## 6.1 Riscos técnicos

| Risco | Impacto | Mitigação |
|-------|--------|-----------|
| API pública de consulta vazando dados | Alto (LGPD, reputação) | Token ou restrição forte de dados (ver 1.1.1) |
| SQLite em produção com concorrência | Médio | Planejar migração para PostgreSQL |
| Credenciais em texto no banco | Alto | Criptografia ou secrets manager |
| Rate limit em memória com múltiplas instâncias | Médio | Redis ou equivalente |
| Médico vendo todas as consultas/receita da clínica | Médio | Separar APIs admin vs médico (ver 1.1.3) |

---

## 6.2 Riscos jurídicos/operacionais (healthtech)

- **LGPD:** Dados de saúde (consultas, receitas, anamnese) são sensíveis. Garantir base legal, consentimento onde cabível, e que apenas quem precisa acessa (role + auditoria).  
- **Regulamentação de telemedicina:** Links de vídeo e gravação (se houver) devem estar alinhados à legislação e à política da clínica.  
- **Receita e ANVISA:** Fluxo de autorização ANVISA e importação deve refletir processo real; qualquer automação deve ser validada por especialista regulatório.

---

## 6.3 Riscos de experiência

- **Expectativa de notificações:** Badge de sino sem funcionalidade gera frustração.  
- **Dois fluxos de consulta do médico (v1/v2):** Confusão e manutenção duplicada.  
- **Placeholders de contato:** Telefone (00) 00000-0000 em produção passa impressão de descuido e dificulta o paciente a entrar em contato.

---

## 6.4 Dependências e decisões que podem travar o projeto

- **Stripe como único gateway:** Se no futuro precisar de PIX nativo ou outro provedor, a abstração atual (valor fixo, create-intent direto) pode exigir refatoração. Considerar camada de “payment provider” desde já.  
- **NextAuth + JWT:** Sessão em JWT sem refresh em DB é comum, mas invalidação em massa (ex.: “deslogar todos”) exige mecanismo extra (blacklist ou curto maxAge).  
- **Muitas fontes e libs de UI:** Reduzir dependências visuais e de animação (ex.: Framer Motion) onde não forem essenciais, para facilitar upgrades e bundle size.

---

# Resumo executivo

- **Segurança:** Corrigir exposição de dados na API pública de consulta, reforçar proteção de rotas no middleware e limitar o que o médico vê no “admin”.  
- **Arquitetura:** Unificar página de consulta do médico (v1/v2), mover valor da consulta e dados de contato para configuração, ampliar uso de auditoria e serviços por domínio.  
- **Produto:** Deixar proposta de valor por dashboard mais clara, reduzir barreiras no funil (agendar → pagar → primeiro acesso) e adicionar notificações in-app e configuração de preço.  
- **UX/UI:** Padronizar componentes e hierarquia, reduzir fontes, garantir acessibilidade e feedback em todas as ações, e substituir placeholders por dados reais.  
- **Fluxos:** Documentar jornadas e estados (paciente/médico/admin), unificar experiência da consulta médica e destacar pendências no admin.  
- **Riscos:** Priorizar LGPD e dados sensíveis, planejar migração de banco e gestão de segredos, e evitar decisões que travem mudança de gateway de pagamento ou de provedores de integração.

Com isso, o sistema fica mais seguro, consistente e preparado para escalar e para ser operado e vendido como produto digital de saúde de longa duração.
