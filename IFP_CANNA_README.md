# IFP CANNA — Infraestrutura Financeira e Pagamentos

Dashboard inspirado no sistema D9 Tech para **pedidos ↔ cobranças ↔ pagamentos ↔ reconciliação** em um único fluxo.

## O que foi implementado

- **Dashboard** (`/ifp-canna`): visão geral com totais recebidos, pendentes, receita do mês e repasses.
- **Transações** (`/ifp-canna/transacoes`): lista de pagamentos com vínculo **paciente ↔ consulta ↔ pedido**, filtros por status e período.
- **Reconciliação** (`/ifp-canna/reconciliacao`): visão de pagamentos com/sem vínculo a pedido e lista de pedidos sem pagamento vinculado.
- **Repasses** (`/ifp-canna/repasses`): listagem de repasses aos médicos (DoctorPayout) com status e valores.
- **Relatórios** (`/ifp-canna/relatorios`): resumo financeiro para auditoria.

## Schema (Prisma)

Foi adicionado em `Payment`:

- `erpOrderId` (opcional): vínculo explícito **pagamento ↔ pedido** para reconciliação.

Para aplicar no banco:

```bash
npx prisma migrate dev --name add_payment_erp_order_id
```

Ou, se usar apenas `db push`:

```bash
npx prisma db push
```

Depois, gere o cliente (se ainda não tiver):

```bash
npx prisma generate
```

## Acesso

- **URL:** `/ifp-canna`
- **Requer:** usuário logado com **role ADMIN**.
- Links para o IFP CANNA foram adicionados no **Admin** (menu Dashboard) e no **ERP CANNA** (rodapé da sidebar).

## Funcionalidades (espelho D9)

| Recurso                         | Status        |
|---------------------------------|---------------|
| Registro de transações          | ✅ (payments) |
| Vínculo pagamento ↔ pedido ↔ paciente | ✅            |
| Relatórios financeiros          | ✅            |
| Controle de repasses            | ✅ (visualização) |
| Estrutura para auditoria        | ✅            |

Melhorias sugeridas depois: UX do pagador, Pix avançado, recorrência, export CSV/PDF dos relatórios.
