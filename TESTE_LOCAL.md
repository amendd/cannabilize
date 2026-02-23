# 🧪 Como Testar Localmente (Sem Migração)

**Data:** 29 de Janeiro de 2026

---

## ✅ O QUE FUNCIONA AGORA (Sem Migração)

### 1. LGPD Compliance
```bash
# Testar páginas
http://localhost:3000/privacidade
http://localhost:3000/termos

# Testar consentimento no formulário
http://localhost:3000/agendamento
# → Tente submeter sem aceitar termos (deve falhar)
# → Aceite os termos e submeta (deve funcionar)
```

### 2. Auditoria (Logs no Console)
```bash
# Iniciar servidor e observar console
npm run dev

# Fazer ações que geram logs:
# - Criar consulta
# - Editar usuário
# - Processar pagamento

# Você verá logs no formato:
# [AUDIT_LOG] {"timestamp":"...","action":"CREATE","entity":"Consultation",...}
```

### 3. Exportação de Dados
```bash
# Fazer login primeiro
# Depois:
curl http://localhost:3000/api/user/export \
  -H "Cookie: next-auth.session-token=SEU_TOKEN"

# Deve retornar JSON com todos os dados
```

### 4. Exclusão de Conta
```bash
# Fazer login primeiro
# Depois:
curl -X DELETE http://localhost:3000/api/user/delete \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{"password":"sua_senha","confirmDelete":"CONFIRMAR EXCLUSÃO"}'
```

### 5. Webhook Stripe
```bash
# O webhook já está validado e funcionando
# Teste com Stripe CLI:
stripe listen --forward-to localhost:3000/api/payments/webhook
stripe trigger payment_intent.succeeded
```

---

## ⚠️ O QUE NÃO FUNCIONA (Precisa Migração)

### 1. Auditoria no Banco
- ❌ Logs não são salvos no banco
- ✅ Mas são logados no console

### 2. Invalidação de Sessão
- ❌ Sessão não é invalidada ao alterar senha
- ✅ Mas não gera erros

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### Teste de Auditoria
1. Abra o console do servidor
2. Crie uma consulta
3. Procure por `[AUDIT_LOG]` no console
4. Deve aparecer um JSON com os dados

### Teste de LGPD
1. Acesse `/agendamento`
2. Preencha o formulário
3. **NÃO** marque os checkboxes de consentimento
4. Tente submeter → Deve falhar com erro
5. Marque os checkboxes
6. Tente submeter → Deve funcionar

### Teste de Exportação
1. Faça login
2. Acesse `/api/user/export` (via Postman/Insomnia)
3. Deve retornar JSON com seus dados

---

## 📊 LOGS DE AUDITORIA

### Formato dos Logs
```json
{
  "timestamp": "2026-01-29T10:30:00.000Z",
  "userId": "user-id-123",
  "action": "CREATE",
  "entity": "Consultation",
  "entityId": "consultation-id-456",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Coletar Logs
```bash
# Salvar logs em arquivo
npm run dev 2>&1 | tee audit.log

# Filtrar apenas logs de auditoria
npm run dev 2>&1 | grep "\[AUDIT_LOG\]" > audit.log
```

---

## 🐛 PROBLEMAS COMUNS

### Erro: "no such column: password_changed_at"
**Status:** ✅ Normal (campo não existe ainda)  
**Solução:** Código já trata isso automaticamente, não precisa fazer nada

### Erro: "Table 'audit_logs' doesn't exist"
**Status:** ✅ Normal (tabela não existe ainda)  
**Solução:** Código já faz fallback para console.log

### Logs não aparecem no console
**Causa:** Pode estar em outro processo ou arquivo de log  
**Solução:** Verifique onde o servidor está rodando

---

## ✅ CHECKLIST DE TESTES

- [ ] Páginas `/privacidade` e `/termos` carregam
- [ ] Formulário de agendamento exige consentimento
- [ ] Logs `[AUDIT_LOG]` aparecem no console
- [ ] Exportação de dados funciona (com login)
- [ ] Exclusão de conta funciona (com login + senha)
- [ ] Webhook Stripe valida assinatura
- [ ] Sistema não quebra ao tentar usar campos inexistentes

---

**Última atualização:** 29 de Janeiro de 2026
