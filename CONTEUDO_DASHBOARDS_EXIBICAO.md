# Conteúdo para exibição nos dashboards — Referência completa

Este documento descreve **todo o conteúdo** que pode ser exibido, consultado e associado nos três dashboards (ERP CANNA, GPP CANNA, IFP CANNA) e no Admin, incluindo entidades, APIs e relações.

---

## 1. Consultas (Consultation)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **Admin** | Lista de consultas, filtros, detalhe da consulta, prescrição | `/api/admin/consultations`, `/api/consultations/[id]` |
| **Médico** | Minhas consultas, consultas do dia, iniciar vídeo, emitir receita | `/api/doctors/activity`, `/api/consultations` (filtro por médico) |
| **Paciente** | Minhas consultas, próxima consulta, histórico, pagamento | `/api/consultations` (filtro por paciente) |
| **ERP CANNA** | Pedidos podem ter `consultationId`; não há tela só de “consultas” | ErpOrder.consultationId |
| **GPP CANNA** | Prescrições ligadas a consultas (uma prescrição por consulta) | Prescription.consultationId |
| **IFP CANNA** | Transações com `consultationId` (pagamento da consulta) | Payment.consultationId |

**Entidade:** `Consultation` (paciente, médico, data/hora, status, link da reunião, anamnese, receita, pagamento).

**Associações:**  
- 1 consulta → 1 paciente (User), 0 ou 1 médico (Doctor), 0 ou 1 prescrição (Prescription), 0 ou 1 pagamento (Payment).  
- Vários ErpOrder podem referenciar a mesma consulta (consultationId).

---

## 2. Associações / Organizações (Organization)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **ERP CANNA** | Lista, criar, editar associações (Entidades > Associações); pedidos por organização | `/api/erp-canna/organizations`, ErpOrder.organizationId |
| **Admin** | Não há tela dedicada; associações são geridas no ERP | — |
| **GPP / IFP** | Apenas exibição indireta (ex.: nome da organização no pedido vinculado à transação) | Via ErpOrder.organization |

**Entidade:** `Organization` (nome, tipo ASSOCIATION | CLINIC | HYBRID, CNPJ, email, telefone, endereço, ativo).

**Associações:**  
- 1 organização → vários ErpOrder (pedidos).

**Conteúdo sugerido para exibir:** Nome, tipo, documento, contato, quantidade de pedidos, status ativo.

---

## 3. Medicamentos (Medication)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **Admin** | CRUD de medicamentos (nome, tipo, CBD/THC, forma farmacêutica, espectro, etc.) | `/api/admin/medications` ou equivalente (admin/medicamentos) |
| **GPP CANNA** | Indiretamente nas prescrições (itens da receita) | Prescription → PrescriptionMedication → Medication |
| **ERP / IFP** | Não listam medicamentos; pedidos podem referenciar prescrição que contém medicamentos | — |

**Entidade:** `Medication` (nome, productType, pharmaceuticalForm, activePrinciples, concentrações CBD/THC, spectrum, administrationRoute, dispensingUnit, supplier, regulatoryClassification, ativo).

**Associações:**  
- Medicamento ↔ Prescrição: tabela `PrescriptionMedication` (dosagem, quantidade, instruções).

**Conteúdo sugerido para exibir:** Nome, tipo (óleo, gummies, cápsulas…), CBD/THC, espectro, unidade de dispensação, fornecedor, status ativo.

---

## 4. Produtos / Pedidos (ErpOrder — “produto” no sentido de pedido de entrega)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **ERP CANNA** | Pedidos por status, pedidos recentes, criar/editar pedido, vincular a paciente/prescrição/consulta/organização | `/api/erp-canna/orders`, `/api/erp-canna/stats` |
| **IFP CANNA** | Reconciliação: pedidos com e sem pagamento; transações com pedido vinculado | `/api/ifp-canna/reconciliation`, `/api/ifp-canna/transactions` (include erpOrder) |

**Entidade:** `ErpOrder` (patientId, organizationId, prescriptionId, consultationId, status PENDING | APPROVED | SENT | DELIVERED | CANCELLED, rastreio, datas).

**Associações:**  
- 1 pedido → 1 paciente, 0 ou 1 organização, 0 ou 1 prescrição, 0 ou 1 consulta, 0 ou 1 pagamento (Payment.erpOrderId).

**Conteúdo sugerido para exibir:** ID, paciente, organização, status, data, prescrição/consulta vinculada, valor (via Payment se existir).

---

## 5. Prescrições (Prescription)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **Admin** | Lista de receitas, detalhe, reenvio | `/api/admin/...`, `/api/prescriptions` |
| **Médico** | Emitir receita na consulta; listar receitas emitidas | PrescriptionBuilder, `/api/prescriptions` |
| **Paciente** | Minhas receitas, download PDF | `/api/prescriptions`, `/api/prescriptions/public/[id]` |
| **GPP CANNA** | Lista, status, vencimento, prescrições vencendo em 30 dias, documentos anexos | `/api/gpp-canna/stats`, listagem de prescrições (se houver API dedicada) |
| **ERP CANNA** | Autorizações ANVISA (por prescrição); pedidos com prescriptionId | AnvisaAuthorization.prescriptionId, ErpOrder.prescriptionId |

**Entidade:** `Prescription` (consultationId, patientId, doctorId, prescriptionData, issuedAt, expiresAt, status ISSUED | USED | EXPIRED | CANCELLED).

**Associações:**  
- 1 prescrição → 1 consulta, 1 paciente, 1 médico; vários PrescriptionMedication (medicamentos); 0 ou 1 AnvisaAuthorization; vários ErpOrder; documentos (PrescriptionDocument).

**Conteúdo sugerido para exibir:** Data emissão, validade, status, paciente, médico, medicamentos (nome, dosagem), vencendo em X dias.

---

## 6. Transações / Pagamentos (Payment)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **Admin** | Pagamentos, editar status, vincular a consulta/pedido | `/api/admin/pagamentos`, `/api/payments` |
| **Paciente** | Meus pagamentos, comprovante | `/api/payments` (por paciente) |
| **IFP CANNA** | Total recebido, pendente, receita mês/ano, repasses, lista de transações, reconciliação | `/api/ifp-canna/stats`, `/api/ifp-canna/transactions`, `/api/ifp-canna/reconciliation` |

**Entidade:** `Payment` (patientId, consultationId, erpOrderId, amount, status, paidAt, transactionId, stripePaymentId…).

**Associações:**  
- 1 pagamento → 1 paciente; 0 ou 1 consulta; 0 ou 1 pedido (ErpOrder).

**Conteúdo sugerido para exibir:** Valor, status, data, paciente, consulta (data/hora), pedido (ID/organização se houver).

---

## 7. Repasses (DoctorPayout)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **IFP CANNA** | Repasses efetuados, pendentes, valor e quantidade | `/api/ifp-canna/stats`, `/api/ifp-canna/payouts` |

**Entidade:** `DoctorPayout` (doctorId, amount, status, conta PIX etc.).

**Associações:** Médico (Doctor), conta de repasse (DoctorPayoutAccount).

---

## 8. Pacientes (User com role PATIENT)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **Admin** | Lista de pacientes, editar | `/api/admin/pacientes` ou users filtrados |
| **ERP CANNA** | Entidades > Pacientes; pedidos por paciente | `/api/erp-canna/stats`, listagem (User role PATIENT) |
| **GPP CANNA** | Pacientes; prescrições e consentimentos por paciente | `/api/gpp-canna/stats`, listagem de pacientes GPP |

**Entidade:** `User` (role PATIENT): nome, email, telefone, CPF, data nascimento, endereço.

**Associações:** Consultas, prescrições, pagamentos, carteirinha, consentimentos, pedidos (ErpOrder).

---

## 9. Médicos (Doctor)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **Admin** | CRUD médicos, disponibilidade | `/api/admin/doctors`, `/api/admin/medicos` |
| **ERP CANNA** | Entidades > Médicos; total ativos no dashboard | `/api/erp-canna/stats` (totalDoctors) |

**Entidade:** `Doctor` (nome, CRM, email, especialidade, ativo, userId, disponibilidade).

**Associações:** Consultas, prescrições, disponibilidade (DoctorAvailability), repasses (DoctorPayout).

---

## 10. Autorizações ANVISA (AnvisaAuthorization)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **Admin** | Tela ANVISA; pendências | `/api/admin/anvisa` ou similar |
| **ERP CANNA** | Número de autorizações pendentes no dashboard; tela Autorizações | `/api/erp-canna/stats` (anvisaPending), listagem |

**Entidade:** `AnvisaAuthorization` (prescriptionId, patientId, anvisaNumber, status, submittedAt, approvedAt, expiresAt).

**Associações:** 1 autorização → 1 prescrição, 1 paciente.

---

## 11. Consentimentos (PatientConsent)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **GPP CANNA** | Total de consentimentos ativos; lista (se houver tela) | `/api/gpp-canna/stats`, `/api/gpp-canna/consents` |

**Entidade:** `PatientConsent` (patientId, type, version, consentedAt, revokedAt).

**Associações:** 1 consentimento → 1 paciente.

---

## 12. Auditoria (AuditLog)

| Onde aparece | O que exibe | API / Fonte |
|--------------|-------------|-------------|
| **ERP CANNA** | Logs últimos 30 dias; link “Ver logs” | `/api/erp-canna/audit` |
| **GPP CANNA** | Logs últimos 30 dias; link “Ver logs” | `/api/gpp-canna/audit` |

**Entidade:** `AuditLog` (userId, action, entity, entityId, changes, ip, userAgent, createdAt).

---

## Resumo por dashboard

| Dashboard   | Conteúdo principal para exibir / consultar |
|------------|---------------------------------------------|
| **ERP CANNA**  | Pacientes, médicos, **associações**, **pedidos (ErpOrder)**, autorizações ANVISA, auditoria. |
| **GPP CANNA**  | **Pacientes**, **prescrições**, prescrições vencendo, **consentimentos**, documentos, auditoria. |
| **IFP CANNA**  | **Transações (Payment)**, receita, pendentes, **reconciliação (pedido ↔ pagamento)**, **repasses**. |
| **Admin**      | **Consultas**, **medicamentos**, usuários, médicos, pagamentos, blog, configurações, etc. |

---

## Como popular os dados para exibição

- **Seed (recomendado):** O arquivo `prisma/seed.ts` já cria dados de exemplo para os três dashboards:
  - **2 pacientes** (paciente1@exemplo.com, paciente2@exemplo.com — senha: `paciente123`)
  - **2 associações/organizações** (Associação Cannabis Medicinal, Clínica CannabiLize)
  - **2 consultas** (1 concluída, 1 agendada)
  - **1 prescrição** com medicamento vinculado (Óleo Full Spectrum)
  - **2 pedidos ERP** (1 aprovado com prescrição, 1 pendente)
  - **2 pagamentos** (1 PAID vinculado à consulta e ao pedido, 1 PENDING)
  - **2 consentimentos** (DATA_PROCESSING, TELEMEDICINE)
  - **Registros de auditoria**
  
  Execute: `npx prisma db seed` para popular o banco e ver os três dashboards com conteúdo.

- **Admin:** Cadastro manual de associações (ERP > Entidades > Associações), medicamentos (Admin > Medicamentos), médicos e pacientes.
- **Fluxo real:** Agendamento → consulta → pagamento (e opcionalmente criação de ErpOrder) → prescrição → pedido; assim os dados aparecem naturalmente no ERP, GPP e IFP.

Para detalhes da comunicação entre os três dashboards, veja **DASHBOARDS_ERP_GPP_IFP_COMUNICACAO.md**.
