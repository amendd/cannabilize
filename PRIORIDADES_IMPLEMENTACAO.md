# Prioridades de Implementação — CannabiLizi

Com base na análise completa do sistema, esta é a ordem sugerida para atacar os problemas e melhorias.

---

## 🔴 PRIORIDADE 1 — Crítico (fazer primeiro)

| # | Item | Motivo | Onde / O que fazer |
|---|------|--------|--------------------|
| 1 | **Proteger API pública de consulta** | Vazamento de dados sensíveis (nome, email) sem autenticação = risco LGPD e reputação. | `app/api/consultations/[id]/public/route.ts`: exigir token efêmero (query ou header) OU retornar só “Consulta confirmada para DD/MM” sem PII. |
| 2 | **Restringir o que o médico vê nas “APIs admin”** | Médico hoje vê todas as consultas e receita da clínica. Quebra confidencialidade. | Separar: rotas que listam “todas as consultas” e “stats globais” → só `role === 'ADMIN'`. Médico usar apenas `/api/doctors/me/consultations` e equivalentes. Revisar: `admin/consultations`, `admin/stats`, `admin/health`, `admin/pending`. |
| 3 | **Proteger rotas no middleware** | Qualquer um acessa `/admin`, `/paciente`, `/medico` e vê layout até o redirect no client. | No `middleware.ts`: para paths que começam com `/admin`, `/paciente`, `/medico`, verificar cookie de sessão NextAuth; se não existir, redirecionar para `/login`. |
| 4 | **Remover placeholders de contato em produção** | Telefone “(00) 00000-0000” e contato genérico passam má impressão e atrapalham o paciente. | Criar config (SystemConfig ou env) para telefone e email de contato; usar em `confirmacao/page.tsx`, Footer, e qualquer tela que mostre “Precisa de ajuda?”. |

**Estimativa:** 1–2 sprints. Itens 1 e 2 são mudanças de lógica; 3 e 4 são configuração e substituição de texto.

---

## 🟠 PRIORIDADE 2 — Alto (próximas 2–4 semanas)

| # | Item | Motivo | Onde / O que fazer |
|---|------|--------|--------------------|
| 5 | **Valor da consulta configurável** | Preço fixo R$ 50 no código exige deploy para mudar. | Chave em SystemConfig (ex.: `CONSULTATION_DEFAULT_AMOUNT`); admin pode editar. Usar em `api/consultations/route.ts`, `api/payments/create-intent/route.ts`, e página de pagamento. |
| 6 | **Unificar página de consulta do médico (v1 vs v2)** | Duplicação de código, bugs e confusão sobre qual é a “oficial”. | Escolher uma versão (ex.: v2), migrar qualquer comportamento único da v1, remover a outra rota e redirecionar `/medico/consultas/[id]` para a versão escolhida. |
| 7 | **Ampliar auditoria** | LGPD e boas práticas exigem rastreabilidade de ações sensíveis. | Chamar `createAuditLog` em: login/logout, alteração de usuário/paciente/médico, emissão/edição de receita, export de dados, acesso a dados sensíveis. Listar ações no `lib/audit.ts` e ir plugando nas APIs. |
| 8 | **Notificações: implementar ou remover** | Sino com badge vermelho sem função gera expectativa falsa. | Opção A: remover botão até existir feature. Opção B: endpoint “minhas notificações” + dropdown mínimo (ex.: últimas 5) e badge só quando houver itens não lidos. |

**Estimativa:** 2–3 sprints. Itens 5 e 6 são estruturais; 7 e 8 podem ser incrementais.

---

## 🟡 PRIORIDADE 3 — Médio (próximo trimestre)

| # | Item | Motivo | Onde / O que fazer |
|---|------|--------|--------------------|
| 9 | **Impersonation mais segura** | Hoje baseada em sessionStorage + query params; servidor precisa validar sempre que ADMIN envia patientId. | Documentar regra: “APIs que aceitam patientId para ADMIN devem validar que o usuário é ADMIN e que patientId existe.” Revisar todas as rotas que usam impersonation. Opcional: token de impersonation assinado no backend. |
| 10 | **Validação e tipos nas APIs** | Reduzir erros e manutenção. | Padronizar Zod em todas as entradas POST/PUT; definir tipos de resposta (interfaces) e reduzir `any` nas respostas de API e nos componentes. |
| 11 | **Centralizar tratamento de erros** | Respostas e logs consistentes. | Usar `lib/error-handler.ts` em todas as API routes: mapear exceções para status HTTP e mensagem segura (sem stack em produção). |
| 12 | **Acessibilidade e feedback** | Inclusão e menos frustração. | Revisar contraste, foco visível, labels em formulários; garantir toast/skeleton em todas as ações críticas; modais com ESC e focus trap. |
| 13 | **Nome da marca único** | CannabiLizi vs Cannalize gera dúvida. | Definir um nome oficial, atualizar metadata, alt texts e referências; alinhar nome do asset da logo se necessário. |

**Estimativa:** 3–4 sprints, em paralelo com features.

---

## 🟢 PRIORIDADE 4 — Desejável (médio/longo prazo)

| # | Item | Motivo | Onde / O que fazer |
|---|------|--------|--------------------|
| 14 | **Migração SQLite → PostgreSQL** | Produção com concorrência e backups robustos. | Planejar migração de schema e dados; ajustar env e Prisma; testar em staging. |
| 15 | **Criptografia de credenciais no banco** | Reduz impacto em caso de vazamento do banco. | Criptografar apiKey, authToken, etc. (EmailConfig, WhatsAppConfig, TelemedicineConfig, PaymentMethod) com chave em env ou cofre. |
| 16 | **Rate limit com Redis** | Necessário quando houver mais de uma instância. | Substituir Map em memória no middleware por Redis (ou serviço equivalente) para contadores compartilhados. |
| 17 | **Filas para email/WhatsApp** | Retry e monitoramento de envios. | Usar fila (Bull, Inngest, etc.) para envio de email e WhatsApp em background; manter fallback atual até estável. |
| 18 | **Testes automatizados** | Menos regressão e mais confiança em deploys. | Testes de integração para APIs críticas (agendamento, pagamento, prescrição); testes unitários para libs de negócio (availability, consultation-config). |
| 19 | **Proposta de valor por dashboard** | Admin: “O que fazer hoje?”; Paciente: próximos passos; Médico: só o que é dele. | Ajustes de copy e layout nas homes de admin, paciente e médico; bloco “Pendências” no admin com links diretos. |

---

## Ordem sugerida por sprint (exemplo)

- **Sprint 1:** Itens 1 (API pública), 3 (middleware), 4 (contato).
- **Sprint 2:** Itens 2 (médico vs admin), 5 (valor consulta).
- **Sprint 3:** Item 6 (unificar v1/v2 médico), início do 7 (auditoria).
- **Sprint 4:** Conclusão 7, item 8 (notificações ou remoção), início 9–11.
- A partir daí: itens 12–13 (UX e marca), depois 14–19 conforme capacidade.

---

## Resumo visual

```
P1 (Crítico)     → Segurança e LGPD: API pública, escopo médico, middleware, contato real.
P2 (Alto)        → Produto e manutenção: preço configurável, uma tela de consulta, auditoria, notificações.
P3 (Médio)       → Qualidade: impersonation, validação, erros, acessibilidade, marca.
P4 (Desejável)   → Escala e robustez: PostgreSQL, criptografia, Redis, filas, testes, proposta de valor.
```

Priorize sempre **P1** antes de features novas; **P2** em paralelo ou logo em seguida; **P3** e **P4** conforme roadmap e equipe.
