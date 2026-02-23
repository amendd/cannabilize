# Análise crítica CannabiLize – Pontos críticos e soluções técnicas

Análise aprofundada nos pontos críticos do projeto com soluções técnicas concretas e exemplos de código quando aplicável.

---

## 1. Segurança e LGPD (crítico)

### 1.1 API pública de receita expõe PII sem autenticação

**Problema:** `GET /api/prescriptions/public/[id]` retorna nome, CPF, email e telefone do paciente para **qualquer** ID de receita, sem token nem autenticação. Isso viola LGPD (minimização e finalidade) e permite enumeração de dados sensíveis.

**Arquivo:** `app/api/prescriptions/public/[id]/route.ts`

**Solução técnica:**

1. **Curto prazo:** Não retornar PII na API pública. Retornar apenas dados necessários para **validação de autenticidade** (ex.: hash do documento, status ISSUED/EXPIRED, data de emissão, CRM do médico). Dados completos só para o paciente logado ou com token de uso único.

```ts
// Exemplo: retorno mínimo para validação por QR
return NextResponse.json({
  id: prescription.id,
  status: prescription.status,
  expiresAt: prescription.expiresAt,
  issuedAt: prescription.issuedAt,
  doctor: { name: prescription.doctor.name, crm: prescription.doctor.crm },
  // NÃO incluir patient.name, patient.cpf, patient.email, patient.phone
});
```

2. **Médio prazo:** Endpoint público apenas para “receita válida sim/não”. Dados completos em rota protegida (`/api/prescriptions/[id]`) com sessão ou token de uso único (ex.: `?token=...` com expiração 1h, gerado quando o paciente acessa “Ver minha receita”).

**Implementado:** A API pública de receita foi alterada para não retornar mais o objeto `patient` (PII). A página `/receita/[id]` foi ajustada para exibir mensagem quando os dados do paciente não vêm na resposta; a verificação por QR continua funcionando (médico, datas, status, medicamentos).

---

### 1.2 Upload/listagem de arquivos da consulta sem prova de identidade

**Problema:** `POST/GET /api/consultations/[id]/public/upload` e listagem de arquivos exigem apenas que a consulta exista e o pagamento esteja PAID. Quem souber o ID da consulta (UUID previsível ou vazado) pode enviar ou listar arquivos de outro paciente.

**Arquivo:** `app/api/consultations/[id]/public/upload/route.ts`

**Solução técnica:**

- Exigir o **token de confirmação** (o mesmo da página de confirmação) em todas as chamadas de upload e listagem.

```ts
// POST e GET: validar token
const tokenParam = request.nextUrl.searchParams.get('token');
const consultation = await prisma.consultation.findUnique({
  where: { id: params.id },
  include: { payment: true, confirmationToken: true },
});
if (!consultation?.confirmationToken || consultation.confirmationToken.token !== tokenParam 
    || new Date() > consultation.confirmationToken.expiresAt) {
  return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 403 });
}
```

- Na página de confirmação, enviar `token` em todas as requisições para upload e listagem (query param ou header).

**Implementado:** POST e GET de upload passaram a exigir `?token=...` (token de confirmação). A página `/consultas/[id]/confirmacao` foi atualizada para enviar o token nas chamadas de listagem e upload.

---

### 1.3 Middleware: proteção só por cookie

**Problema:** O middleware protege `/admin`, `/paciente`, `/medico` apenas verificando **existência** do cookie de sessão (`hasNextAuthSessionCookie`). Não valida se o JWT é válido nem se o role corresponde à rota. Um cookie adulterado ou de outra origem pode levar a redirecionamentos incorretos (o NextAuth pode rejeitar depois, mas a lógica de “proteção” é fraca).

**Arquivo:** `middleware.ts`

**Solução técnica:**

- Manter o middleware para redirecionar não autenticados para `/login`. Para autorização por role, **não** confiar só no middleware: cada rota de API já usa `getServerSession` + `checkAuth`. Garantir que **todas** as páginas protegidas (admin, médico, paciente) que carregam dados sensíveis façam a verificação no servidor (Server Component ou API), e que não exista página que mostre dados apenas com base no cookie.
- Opcional: em rotas de API, criar um helper reutilizável para “exige sessão + role” e usar em todas as rotas sensíveis, para não esquecer checagem em novas APIs.

---

## 2. Backend e regras de negócio

### 2.1 Emissão de receita sem exigir “chamada encerrada”

**Problema:** A emissão de receita (`POST /api/prescriptions`) não verifica `videoCallEndedAt` nem status da consulta. O médico pode emitir receita sem ter marcado a chamada como encerrada, o que quebra o fluxo clínico (consultas com vídeo devem ter a chamada encerrada antes de emitir).

**Arquivos:** `app/api/prescriptions/route.ts`, `app/api/consultations/[id]/end-video-call/route.ts`

**Solução técnica:**

Antes de criar/atualizar receita para ISSUED, verificar se a consulta tem reunião por vídeo e, nesse caso, exigir `videoCallEndedAt`:

```ts
// Em POST /api/prescriptions/route.ts, após validar consultation e doctorId
if (consultation.meetingPlatform && ['ZOOM', 'GOOGLE_MEET'].includes(consultation.meetingPlatform)) {
  if (!consultation.videoCallEndedAt) {
    return NextResponse.json(
      {
        error: 'Marque a chamada por vídeo como encerrada antes de emitir a receita.',
        code: 'VIDEO_CALL_NOT_ENDED',
      },
      { status: 400 }
    );
  }
}
```

- Incluir `meetingPlatform` e `videoCallEndedAt` no `findUnique` da consulta nessa rota.

---

### 2.2 Duplicação de verificação “receita já emitida”

**Problema:** Em `app/api/consultations/[id]/prescription/draft/route.ts` (POST) há dois blocos seguidos que verificam `existingIssued` e retornam o mesmo erro, com código duplicado.

**Solução técnica:** Manter uma única verificação após obter a consulta e o médico:

```ts
const existingIssued = await prisma.prescription.findFirst({
  where: { consultationId: params.id, status: 'ISSUED' },
});
if (existingIssued) {
  return NextResponse.json(
    { error: 'Receita já foi emitida. Não é possível salvar rascunho.' },
    { status: 400 }
  );
}
// Remover o segundo bloco idêntico
```

---

### 2.3 Login: fallback redireciona para /admin

**Problema:** Na página de login, se a chamada a `/api/auth/session` falhar (rede, erro 500), o código faz `router.push('/admin')`. Isso pode levar um paciente ou médico para a área de admin.

**Arquivo:** `app/login/page.tsx` (linha ~66)

**Solução técnica:**

```ts
} catch (error) {
  // Fallback seguro: ir para home ou manter na página de login
  router.push('/');
} finally {
  setIsLoading(false);
}
```

- Remover o `router.push('/admin')` no catch e usar `/` ou não redirecionar, apenas mostrar mensagem (“Não foi possível verificar sua conta. Tente novamente.”).

**Implementado:** O fallback no catch foi alterado de `router.push('/admin')` para `router.push('/')`.

---

## 3. Erros silenciosos e riscos em produção

### 3.1 Auditoria: tabela pode não existir

**Problema:** `lib/audit.ts` verifica se a tabela `audit_logs` existe com uma query raw. Se não existir, cai no fallback de `console.log`. Em produção em múltiplas instâncias, logs podem ser perdidos e não há garantia de que a tabela foi criada em todos os ambientes.

**Solução técnica:**

- Garantir que a migração/schema que cria `audit_logs` rode em todos os ambientes (incluindo Vercel/Prisma Migrate).
- Opcional: em produção, enviar fallback para um serviço de log (ex.: Logtail, Datadog) em vez de só `console.log`.
- Documentar no README ou em script de deploy que `audit_logs` é obrigatória para conformidade.

---

### 3.2 Rate limit em memória e múltiplas instâncias

**Problema:** O rate limit em `middleware.ts` e em `lib/security/rate-limit.ts` usa `Map` em memória. Em ambiente serverless (Vercel) ou várias instâncias, cada instância tem seu próprio mapa; o limite real por IP fica “diluído” (ex.: 200 req/15min vira 200 por instância).

**Solução técnica:**

- **Curto prazo:** Manter o atual com comentário no código explicando que é “por instância” e que em produção com muitas instâncias o limite efetivo é maior.
- **Médio prazo:** Usar Redis (ex.: Upstash) com chave por IP (e opcionalmente por usuário para rotas autenticadas) e aplicar o rate limit no middleware ou em um wrapper de API.

---

### 3.3 Webhook Stripe: idempotência

**Problema:** Se o Stripe reenviar o mesmo evento (retry), o handler pode processar duas vezes: atualizar pagamento, enviar email e WhatsApp de novo.

**Arquivo:** `app/api/payments/webhook/route.ts`

**Solução técnica:**

- No início do handler de `payment_intent.succeeded`, checar se já existe pagamento com esse `stripePaymentId` e status `PAID`. Se existir, retornar `{ received: true }` sem reprocessar.

```ts
if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const existing = await prisma.payment.findFirst({
    where: { stripePaymentId: paymentIntent.id, status: 'PAID' },
  });
  if (existing) {
    return NextResponse.json({ received: true });
  }
  // ... resto do fluxo
}
```

---

## 4. Autorização e consistência

### 4.1 Padrão de verificação de role nas APIs

**Problema:** Várias rotas repetem o mesmo padrão: `getServerSession` + “se não for DOCTOR e não for ADMIN, 401”. Isso aumenta risco de esquecer a checagem em uma rota nova ou de tratar ADMIN de forma diferente em um lugar e igual em outro.

**Solução técnica:**

- Centralizar em um helper que aceite múltiplos roles e opcionalmente “ownership” (ex.: médico só acessa suas consultas):

```ts
// lib/auth-api.ts (exemplo)
export async function requireSession(
  request: NextRequest,
  options: { roles?: string[]; doctorOnlyOwn?: boolean }
): Promise<{ session: Session; errorResponse: NextResponse | null }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null!, errorResponse: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  if (options.roles?.length && !options.roles.includes(session.user.role)) {
    return { session: null!, errorResponse: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }
  return { session, errorResponse: null };
}
```

- Usar esse helper em todas as rotas protegidas e, onde fizer sentido, verificar “ownership” (médico = consultas do próprio doctorId, paciente = próprio patientId).

---

## 5. UX e conversão (resumo técnico)

- **Landing e CTA:** CTA principal (“Iniciar tratamento agora”) e preço (R$50) estão claros. O valor “R$50” está hardcoded no `CTASection`; convém vir de configuração (admin) ou da API de preço da consulta para evitar divergência.
- **Fluxo agendar → pagamento → confirmação:** A página de confirmação com token e “claim account” está alinhada com LGPD (dados completos só com token). Garantir que o link do email de confirmação sempre inclua `?token=...` e que a primeira ação na confirmação seja “definir senha” ou “entrar” para reduzir abandono.
- **Microcopy:** Manter mensagens de erro da API amigáveis (já usadas em parte pelo `error-handler`); nas telas de paciente/medico, exibir essas mensagens em toast ou inline, evitando “Erro 500” genérico.

---

## 6. Recomendações priorizadas

| Prioridade | Item | Ação sugerida |
|------------|------|----------------|
| **Alta** | API pública de receita expõe PII | Remover PII do GET público; dados completos só com sessão ou token de uso único. |
| **Alta** | Upload/lista de arquivos sem token | Exigir token de confirmação em POST/GET de upload e listagem. |
| **Alta** | Login fallback para /admin | Trocar fallback de redirecionamento para `/` e mensagem de erro. |
| **Média** | Emissão de receita sem “chamada encerrada” | Verificar `videoCallEndedAt` quando `meetingPlatform` for ZOOM/GOOGLE_MEET. |
| **Média** | Idempotência do webhook Stripe | Checar se pagamento já está PAID antes de reprocessar. |
| **Média** | Rate limit em produção | Documentar limitação; planejar Redis para limite global por IP. |
| **Baixa** | Código duplicado no draft de receita | Unificar verificação “receita já emitida” em um único bloco. |
| **Baixa** | Auditoria sem tabela | Garantir migração em todos os ambientes; opcional: envio de fallback para serviço de log. |
| **Baixa** | Preço no CTA hardcoded | Buscar valor da consulta da config/API e exibir no CTA. |

---

## 7. O que corrigir imediatamente

1. **Remover PII da API pública de receita** (ou restringir a “válida sim/não” e mover dados completos para rota autenticada/token).
2. **Exigir token de confirmação** em upload e listagem de arquivos da consulta.
3. **Corrigir o redirecionamento de fallback no login** de `/admin` para `/` e tratar erro de sessão com mensagem clara.

---

## 8. O que pode esperar

- Rate limit com Redis (pode manter em memória enquanto tráfego for baixo).
- Helper único de autorização para APIs (melhora manutenção; as rotas atuais já estão protegidas).
- Preço dinâmico no CTA (evita divergência quando o preço mudar).

---

## 9. Maior impacto com menor esforço

1. **API pública de receita:** alterar apenas o retorno do GET (remover campos do paciente e deixar só o necessário para validação) — pouco código, grande ganho em LGPD e segurança.
2. **Token no upload:** adicionar validação do `token` na rota de upload e passar o token nas chamadas do front (página de confirmação já tem o token na URL).
3. **Login fallback:** uma linha de código (trocar `/admin` por `/` e ajustar mensagem).

---

*Documento gerado com base na análise do código do repositório CannabiLize (clickcannabis-replica).*
