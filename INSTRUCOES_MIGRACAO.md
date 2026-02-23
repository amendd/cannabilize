# 🔄 Instruções de Migração - Novas Funcionalidades

**Data:** 29 de Janeiro de 2026

---

## ⚠️ IMPORTANTE: Execute a Migração do Banco de Dados

Após as implementações, você precisa executar a migração do Prisma para adicionar os novos campos e tabelas.

### Passo 1: Gerar Migração

```bash
npx prisma migrate dev --name add_audit_log_and_password_changed_at
```

Isso irá:
- Criar a tabela `audit_logs`
- Adicionar campo `password_changed_at` na tabela `users`
- Criar os indexes necessários

### Passo 2: Gerar Cliente Prisma

```bash
npx prisma generate
```

---

## 📋 O QUE FOI IMPLEMENTADO

### ✅ LGPD Compliance Completo
- Páginas de Política de Privacidade e Termos de Uso
- Consentimento obrigatório no cadastro
- Exportação de dados pessoais
- Exclusão de conta (direito ao esquecimento)

### ✅ Sistema de Auditoria
- Modelo AuditLog no banco
- Serviço de auditoria (`lib/audit.ts`)
- Logs em ações críticas

### ✅ Segurança Melhorada
- Validação aprimorada de webhook Stripe
- Invalidação de sessão ao alterar senha
- Logs de tentativas suspeitas

### ✅ Camada de Serviços
- `services/consultation.service.ts`
- `services/user.service.ts`
- Preparado para expansão

---

## 🧪 TESTES RECOMENDADOS

### 1. Testar LGPD
```bash
# 1. Acesse http://localhost:3000/privacidade
# 2. Acesse http://localhost:3000/termos
# 3. Tente agendar consulta sem aceitar termos
# 4. Faça login e teste exportação: GET /api/user/export
```

### 2. Testar Auditoria
```bash
# 1. Faça login
# 2. Crie/edite uma consulta
# 3. Verifique logs: SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

### 3. Testar Invalidação de Sessão
```bash
# 1. Faça login em uma aba
# 2. Em outra aba, altere sua senha (via admin)
# 3. Volte para primeira aba e tente usar (deve falhar)
```

---

## 📝 ARQUIVOS CRIADOS/MODIFICADOS

### Novos Arquivos
- `app/privacidade/page.tsx`
- `app/termos/page.tsx`
- `app/api/user/export/route.ts`
- `app/api/user/delete/route.ts`
- `lib/audit.ts`
- `services/consultation.service.ts`
- `services/user.service.ts`
- `RESUMO_IMPLEMENTACOES.md`
- `INSTRUCOES_MIGRACAO.md`

### Arquivos Modificados
- `prisma/schema.prisma` (AuditLog, passwordChangedAt)
- `lib/auth.ts` (invalidação de sessão)
- `lib/account-setup.ts` (passwordChangedAt)
- `components/layout/Footer.tsx` (links LGPD)
- `components/consultation/AppointmentForm.tsx` (consentimento)
- `app/api/consultations/route.ts` (validação consentimento)
- `app/api/payments/webhook/route.ts` (auditoria e validação)

---

## ⚡ PRÓXIMOS PASSOS

1. **Execute a migração** (comando acima)
2. **Teste as funcionalidades** (testes recomendados)
3. **Revise logs de auditoria** (verificar se estão sendo criados)
4. **Continue implementações** (2FA, mais serviços, etc.)

---

## 🐛 PROBLEMAS COMUNS

### Erro: "Table 'audit_logs' doesn't exist"
**Solução:** Execute a migração do Prisma

### Erro: "Column 'password_changed_at' doesn't exist"
**Solução:** Execute a migração do Prisma

### Sessão não invalida após alterar senha
**Solução:** Verifique se `passwordChangedAt` está sendo atualizado e se o callback JWT está funcionando

---

**Última atualização:** 29 de Janeiro de 2026
