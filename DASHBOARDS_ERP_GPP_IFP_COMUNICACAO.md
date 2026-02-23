# Comunicação dos 3 Dashboards — ERP CANNA, GPP CANNA e IFP CANNA

## São o mesmo produto?

**Sim.** Os três dashboards (ERP CANNA, GPP CANNA e IFP CANNA) fazem parte do **mesmo produto** e da mesma aplicação:

- **Mesma base de código** (Next.js, Prisma)
- **Mesmo banco de dados** (uma única `DATABASE_URL`, modelos Prisma compartilhados)
- **Mesma autenticação** (NextAuth; todos exigem `role === 'ADMIN'`)
- **Mesmas entidades de negócio** (User, Doctor, Consultation, Prescription, Payment, Organization, ErpOrder, etc.)

Cada dashboard é uma **visão especializada** sobre o mesmo conjunto de dados: operacional (ERP), pacientes/prescrições (GPP) e financeiro (IFP).

---

## Como se comunicam?

A comunicação não é entre “serviços separados”, e sim **leitura/escrita nas mesmas tabelas**:

| Dashboard   | Rotas (app)        | APIs (backend)              | Principais tabelas Prisma                    |
|------------|--------------------|-----------------------------|----------------------------------------------|
| **ERP CANNA**  | `/erp-canna/*`      | `/api/erp-canna/*`           | User, Doctor, Organization, ErpOrder, AnvisaAuthorization, AuditLog |
| **GPP CANNA**  | `/gpp-canna/*`      | `/api/gpp-canna/*`           | User, Prescription, PatientConsent, PrescriptionDocument, AuditLog |
| **IFP CANNA**  | `/ifp-canna/*`      | `/api/ifp-canna/*`           | Payment, DoctorPayout, ErpOrder (reconciliação) |

### Fluxo de dados compartilhados

1. **Pacientes (User com role PATIENT)**  
   - **ERP**: lista em “Entidades > Pacientes” e nos pedidos.  
   - **GPP**: mesma base em “Pacientes”, “Prescrições” e “Consentimentos”.  
   - **IFP**: transações e reconciliação usam `Payment.patientId` (mesmo User).

2. **Prescrições (Prescription)**  
   - **GPP**: foco em prescrições, status, vencimento, documentos.  
   - **ERP**: pedidos (`ErpOrder`) podem ter `prescriptionId`; autorizações ANVISA ligadas à prescrição.  
   - **IFP**: indiretamente (pagamento pode estar ligado a consulta que gerou receita).

3. **Pedidos (ErpOrder) e Pagamentos (Payment)**  
   - **ERP**: cria/edita pedidos; exibe status (PENDING, APPROVED, SENT, DELIVERED, CANCELLED).  
   - **IFP**: lista pagamentos (transações); reconciliação usa `Payment.erpOrderId` para “pedido com/sem pagamento”.  
   - Quando um **Payment** tem `erpOrderId` preenchido, o mesmo pedido aparece no ERP (pedidos) e no IFP (transações/reconciliação).

4. **Associações (Organization)**  
   - **ERP**: único lugar que gerencia associações (CRUD).  
   - Pedidos no ERP podem ter `organizationId`; no IFP, a listagem de transações pode mostrar a organização do pedido vinculado.

5. **Auditoria (AuditLog)**  
   - **ERP** e **GPP** usam a mesma tabela para “últimos 30 dias” em seus dashboards.

Ou seja: **estão se comunicando corretamente** via banco único; não há APIs cruzadas entre módulos, apenas leitura/escrita nas mesmas entidades.

---

## Pontos de atenção para manter consistência

1. **Vínculo Pagamento ↔ Pedido**  
   - Hoje o IFP mostra “pedidos sem pagamento” (ErpOrder sem Payment) e “pagamentos com/sem pedido”.  
   - Se o fluxo de negócio for “toda consulta paga gera um pedido”, é importante que, ao confirmar pagamento (ex.: webhook Stripe), o sistema crie ou atualize um `ErpOrder` e defina `Payment.erpOrderId` para manter ERP e IFP alinhados.

2. **Criação de ErpOrder**  
   - Pedidos são criados hoje via **ERP** (POST `/api/erp-canna/orders`) ou manualmente.  
   - Se quiser reconciliação automática, ao criar pagamento de consulta pode-se criar um ErpOrder com `consultationId`/`prescriptionId` e associar ao `Payment`.

3. **Medicamentos (Medication)**  
   - Cadastro no **Admin** (“Medicamentos”); usados em prescrições (PrescriptionMedication).  
   - ERP/GPP/IFP não cadastram medicamentos; apenas o admin. Os três dashboards consomem dados que dependem desses cadastros (prescrições no GPP, pedidos no ERP indiretamente).

---

## Resumo

| Pergunta | Resposta |
|----------|----------|
| Os 3 dashboards são o mesmo produto? | Sim. Mesma app, mesmo banco, mesmas entidades. |
| Estão se comunicando corretamente? | Sim. Compartilham o mesmo banco; ERP/GPP/IFP são visões sobre as mesmas tabelas. |
| Onde garantir consistência? | No vínculo Payment ↔ ErpOrder (e, se aplicável, criação de ErpOrder ao confirmar pagamento). |

Para **conteúdo a exibir** em cada dashboard (consultas, associações, medicamentos, produtos, etc.), veja o documento **CONTEUDO_DASHBOARDS_EXIBICAO.md**.
