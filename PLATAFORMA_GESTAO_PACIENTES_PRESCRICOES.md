# Plataforma de Gestão de Pacientes e Prescrições

Resumo das alterações implementadas conforme especificação (SaaS B2B regulatório, LGPD, rastreabilidade, segurança).

## 1. Schema (Prisma)

- **Prescription**: `consultationId` passou a ser opcional (prescrição pode ser criada/upload sem consulta). Novos campos: `prescriptionType`, `doctorCrm`, `specialty`, `observations`, `replacedById` (histórico quando nova prescrição substitui anterior). Status: `DRAFT`, `ACTIVE`, `EXPIRING`, `EXPIRED`, `REPLACED`, `CANCELLED` (legado: `ISSUED`, `USED`). Índices em `patientId+status` e `expiresAt`.
- **User**: já possui `deletedAt` (soft delete) e `role` como string — use `SUPER_ADMIN`, `ADMIN`, `OPERATOR`, `DOCTOR`, `PATIENT`.

**Ação necessária:** rodar migração e gerar client:
```bash
npx prisma migrate dev --name prescription_standalone_and_roles
npx prisma generate
```

## 2. Roles e permissões

- **`lib/roles-permissions.ts`**: funções `canAccessAdmin`, `canCreatePatient`, `canEditPatient`, `canCreatePrescription`, `canViewPrescription`, `canManageUsers`, `canAccessCompliance`, `canAccessReports`.
- **`lib/prescription-constants.ts`**: status de prescrição e constantes (`BLOCKING_STATUSES`, `ACTIVE_STATUSES`, `EXPIRING_DAYS`).

Acesso ao admin: **SUPER_ADMIN**, **ADMIN**, **OPERATOR**. Usuários e permissões: apenas **SUPER_ADMIN** e **ADMIN**.

## 3. Menu (sidebar) admin

Reorganizado conforme spec:

- Dashboard (Visão Geral, Métricas, ERP/GPP/IFP)
- Pacientes
- Prescrições (Prescrições/Receitas, Consultas, Carteirinhas)
- Médicos
- Documentos
- Relatórios
- Compliance & LGPD
- Usuários & Permissões
- Integrações
- Configurações

Itens “adminOnly” (ex.: Usuários) visíveis apenas para ADMIN e SUPER_ADMIN.

## 4. Dashboard

- **API `/api/admin/stats`**: passa a retornar também `prescriptionsActive`, `prescriptionsExpiring7`, `prescriptionsExpiring15`, `prescriptionsExpiring30`, `prescriptionsExpired`, `alertsNoConsent`, `alertsDoctorInactive`. Autorização via `canAccessAdmin`.
- **Dashboard (admin)**: nova seção “Prescrições e validade” com cards clicáveis (ativos, vencendo 7/15/30 dias, vencidas, sem consentimento LGPD, médicos inativos). Redirecionamentos para `/admin/receitas` com query params. Uso de `canAccessAdmin` e `isAdminOrSuper` para exibição e links.

## 5. Novas páginas admin

- **`/admin/documentos`**: central de documentos com link para o módulo GPP CANNA (`/gpp-canna/documentos`).
- **`/admin/relatorios`**: relatórios por período e exportação (CSV implementado).
- **`/admin/compliance`**: Compliance & LGPD com links para consentimentos e auditoria (GPP CANNA).

## 6. APIs atualizadas

- **`/api/admin/stats`**: estatísticas estendidas e uso de `canAccessAdmin`.
- **`/api/admin/patients`**: uso de `canAccessAdmin` para permitir OPERATOR.
- **`/api/admin/reports`** (nova): GET com `period` e `format`; export CSV de prescrições no período; PDF retorna 501 (em desenvolvimento).

## 7. Páginas admin existentes

- **Dashboard, Pacientes, Receitas, Documentos, Relatórios, Compliance**: passaram a usar `canAccessAdmin(session?.user?.role)` para redirecionamento e carregamento, permitindo acesso a OPERATOR e SUPER_ADMIN onde aplicável.

## 8. Próximos passos (MVP / spec)

- **Prescrições**: fluxo de criar/upload de prescrição sem consulta (patientId + doctorId + PDF), regras “pedido só com prescrição ativa” e “prescrição vencida bloqueia”.
- **Pacientes**: formulário com consentimento LGPD (checkbox, versão do termo, data/hora/IP) e opção de revogação (não retroativa).
- **Compliance**: solicitações do titular (acesso, correção, exclusão lógica) e registro em auditoria.
- **Relatórios**: export PDF e relatórios por médico; logs de auditoria exportáveis.
- **Automações**: alerta prescrição vencendo, bloqueio prescrição vencida, bloqueio médico inativo, log de tentativa de acesso indevido, alerta consentimento revogado.
- **Seed/usuários**: criar usuários com role `OPERATOR` ou `SUPER_ADMIN` para testes.

## 9. Segurança (já presentes)

- Criptografia em trânsito (HTTPS/TLS) e headers de segurança no middleware.
- Soft delete (`User.deletedAt`).
- Logs de auditoria (`AuditLog`, `lib/audit.ts`).
- Consentimentos LGPD (`PatientConsent`) e documentos com registro de acesso (`PrescriptionDocumentAccess`).
