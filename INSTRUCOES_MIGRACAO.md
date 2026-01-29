# 📋 Instruções para Executar a Migração

## ✅ Migração Criada

A migração para adicionar o sistema de convites de remarcação foi criada em:
- `prisma/migrations/20260128000000_add_reschedule_invites/migration.sql`

## 🚀 Como Executar

### Opção 1: Usando o Script Node.js (Recomendado)

```bash
npx tsx scripts/run-reschedule-invites-migration.ts
```

### Opção 2: Usando Prisma Migrate

```bash
npx prisma migrate deploy
```

Ou se estiver em desenvolvimento:

```bash
npx prisma migrate dev
```

### Opção 3: Executar SQL Manualmente

Se preferir executar manualmente, conecte-se ao banco SQLite e execute o conteúdo do arquivo:
`prisma/migrations/20260128000000_add_reschedule_invites/migration.sql`

## 📊 O que a Migração Cria

1. **Tabela `consultation_reschedule_invites`** com os campos:
   - `id` (TEXT, PRIMARY KEY)
   - `consultation_id` (TEXT, FOREIGN KEY)
   - `patient_id` (TEXT, FOREIGN KEY)
   - `doctor_id` (TEXT, FOREIGN KEY)
   - `current_scheduled_at` (DATETIME)
   - `new_scheduled_at` (DATETIME)
   - `new_scheduled_date` (TEXT)
   - `new_scheduled_time` (TEXT)
   - `status` (TEXT, DEFAULT 'PENDING')
   - `message` (TEXT, nullable)
   - `expires_at` (DATETIME)
   - `responded_at` (DATETIME, nullable)
   - `created_at` (DATETIME)
   - `updated_at` (DATETIME)

2. **5 Índices** para otimização:
   - `consultation_id`
   - `patient_id`
   - `doctor_id`
   - `status`
   - `expires_at`

## ✅ Verificar Migração

Após executar, você pode verificar se a tabela foi criada:

```bash
npx prisma studio
```

Ou usando SQL:

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='consultation_reschedule_invites';
```

## 🔄 Próximos Passos

Após executar a migração:

1. ✅ Tabela criada no banco de dados
2. ✅ Sistema de convites pronto para uso
3. ✅ APIs funcionando
4. ✅ Interface integrada

## ⚠️ Notas Importantes

- A migração é **idempotente** - pode ser executada múltiplas vezes sem problemas
- O script verifica se a tabela já existe antes de criar
- Todas as foreign keys estão configuradas corretamente
- Os índices melhoram a performance das consultas

---

**Migração criada com sucesso! Execute o script para aplicar ao banco de dados.** 🎉
