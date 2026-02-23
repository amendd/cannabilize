# Visão geral do fluxo — 3 produtos (Paciente, Médico, Associação)

A plataforma conecta **4 atores**:

| Ator | Papel |
|------|--------|
| **Paciente** | Origem da demanda |
| **Médico** | Valida e autoriza clinicamente |
| **Associação / Clínica** | Opera, administra e entrega |
| **Plataforma** | Garante compliance, rastreabilidade e automação |

**3 eixos centrais:** dados sensíveis (LGPD), autorização médica (prescrição), rastreabilidade operacional (auditoria).

---

## 1. Fluxo do paciente

- **Entrada:** cadastro assistido (associação cria, paciente recebe convite) ou auto cadastro (associação valida e ativa).
- **Status inicial:** Pré-cadastrado.
- **Consentimento LGPD (obrigatório):** paciente lê e aceita o termo; sistema registra data/hora, IP e versão. Sem consentimento → **bloqueio total** de ações.
- **Status após consentimento:** Ativo (LGPD ok).
- **Acompanhamento:** visualizar prescrições, status de pedidos, documentos. Paciente **não edita** dados críticos.

## 2. Fluxo do médico

- Cadastro pela associação/admin (nome, CRM, UF, especialidade). Status: Ativo.
- **Emissão de prescrição:** seleciona paciente, cria prescrição ou upload; contém data, validade, tipo, observações. Status da prescrição: Ativa.
- **Regras:** médico inativo não prescreve; prescrição vencida não gera pedido; nova prescrição substitui a anterior com histórico completo. Tudo gera **log imutável**.

## 3. Fluxo da associação / clínica

- Cria pacientes, gerencia médicos, valida prescrições, cria pedidos, acompanha pagamentos e logística.
- **Validação operacional (automática):** antes de qualquer pedido a plataforma verifica: paciente ativo, consentimento LGPD válido, prescrição ativa, médico ativo. Se qualquer item falhar → **bloqueio automático**.
- **Criação do pedido:** com tudo válido, operador vincula paciente + prescrição, define valor, envia para cobrança. Status: Aguardando pagamento.

## 4. Fluxo financeiro

- Cobrança gerada pela plataforma; link ao paciente (Pix, cartão, boleto).
- Gateway confirma via webhook → status: Pago. Exceções: pagamento falhou → alerta; cobrança vencida → bloqueio; chargeback → alerta crítico + auditoria.

## 5. Fluxo logístico

- Pedido pago dispara solicitação logística; operador escolhe transportadora.
- Tracking: coletado, em trânsito, entregue, falha. Status final: Entregue.

## 6. Plataforma (bastidores)

- Validações automáticas; logs imutáveis (acesso, criação, edição); alertas (prescrição vencendo, pagamento falho, acesso indevido); relatórios clínicos, financeiros e regulatórios.

---

## Status (resumo)

| Entidade | Status |
|----------|--------|
| **Paciente** | Pré-cadastrado, Ativo, Inativo |
| **Prescrição** | Rascunho, Ativa, Vencendo, Vencida, Substituída |
| **Pedido** | Rascunho, Aguardando pagamento, Pago, Em logística, Entregue, Cancelado |

---

## Ponto-chave

- **Nada anda sem prescrição válida.**
- **Nada anda sem consentimento (LGPD).**
- **Nada anda sem rastreabilidade.**

Isso torna a plataforma **infraestrutura regulatória**, não apenas software.

---

## Implementação no código

- **Portas de compliance:** `lib/compliance-gates.ts`  
  - `hasValidLgpdConsent(patientId)`  
  - `isPrescriptionValidForOrder(prescriptionId)`  
  - `getOrderCreationBlockReasons(patientId, prescriptionId)`  
  - `canCreateOrder(patientId, prescriptionId)`  

- **Uso:** criação de pedido em `app/api/erp-canna/orders/route.ts` (POST). Se houver bloqueios, retorna `400` com `blockReasons`. Auditoria de criação de pedido via `createAuditLog`.

---

## Frase para o Cursor (colar direto)

> Implementar um fluxo end-to-end conectando paciente, médico e associação, garantindo que toda ação seja condicionada a consentimento LGPD, prescrição médica válida e rastreabilidade completa. O sistema deve bloquear automaticamente qualquer avanço operacional em caso de não conformidade, registrar logs imutáveis e manter histórico integral de todos os eventos.
