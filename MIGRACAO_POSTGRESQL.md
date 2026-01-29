# 🔄 Migração de SQLite para PostgreSQL

## ⚠️ IMPORTANTE

Este projeto está atualmente usando **SQLite** para desenvolvimento. Para produção, é **ESSENCIAL** migrar para **PostgreSQL**.

---

## 📋 Passo a Passo da Migração

### 1. Escolher Provedor de PostgreSQL

#### Opções Recomendadas:

**🥇 Supabase** (Recomendado - Grátis até 500MB)
- URL: https://supabase.com
- Grátis: 500MB de banco, 2GB de bandwidth
- Setup: 5 minutos
- SSL: Incluído

**🥈 Neon** (Recomendado - Grátis até 3GB)
- URL: https://neon.tech
- Grátis: 3GB de banco, serverless
- Setup: 5 minutos
- SSL: Incluído

**🥉 Railway** (Pago - $5/mês crédito grátis)
- URL: https://railway.app
- Inclui PostgreSQL e deploy
- Setup: 10 minutos

**Outras opções:**
- AWS RDS
- DigitalOcean Managed Databases
- Heroku Postgres

---

### 2. Criar Banco PostgreSQL

#### Exemplo com Supabase:

1. Acesse https://supabase.com
2. Crie uma conta (grátis)
3. Crie um novo projeto
4. Anote as credenciais:
   - Host
   - Port (geralmente 5432)
   - Database name
   - User
   - Password
   - Connection string

#### Exemplo com Neon:

1. Acesse https://neon.tech
2. Crie uma conta (grátis)
3. Crie um novo projeto
4. Copie a connection string

---

### 3. Alterar Schema Prisma

Edite `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Mudar de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

**⚠️ ATENÇÃO**: Faça backup do arquivo antes de alterar!

---

### 4. Configurar DATABASE_URL

No arquivo `.env` (ou `.env.production`):

```env
# SQLite (DESENVOLVIMENTO - REMOVER EM PRODUÇÃO)
# DATABASE_URL="file:./dev.db"

# PostgreSQL (PRODUÇÃO)
DATABASE_URL="postgresql://usuario:senha@host:5432/nome_banco?schema=public&sslmode=require"
```

**Exemplo Supabase:**
```env
DATABASE_URL="postgresql://postgres.xxxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

**Exemplo Neon:**
```env
DATABASE_URL="postgresql://usuario:senha@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

---

### 5. Gerar Prisma Client

```bash
npx prisma generate
```

---

### 6. Criar Migrações

#### Opção A: Usar Migrations (Recomendado)

```bash
# Criar migração inicial
npx prisma migrate dev --name init_postgresql

# Em produção, aplicar migrações:
npx prisma migrate deploy
```

#### Opção B: Usar db push (Mais simples, menos controle)

```bash
npx prisma db push
```

**⚠️ CUIDADO**: `db push` pode perder dados se houver conflitos!

---

### 7. Migrar Dados (Se necessário)

Se você tem dados no SQLite que precisa migrar:

#### Opção A: Exportar/Importar SQL

```bash
# Exportar do SQLite
sqlite3 dev.db .dump > backup.sql

# Adaptar SQL para PostgreSQL (pode precisar ajustes manuais)
# Importar no PostgreSQL
psql $DATABASE_URL < backup_adaptado.sql
```

#### Opção B: Usar ferramenta de migração

- **pgloader**: https://pgloader.readthedocs.io/
- **DBeaver**: Interface gráfica

#### Opção C: Recriar dados (se for apenas dados de teste)

```bash
# Executar seed novamente
npm run db:seed
```

---

### 8. Testar Conexão

Crie um script de teste `test-db.ts`:

```typescript
import { prisma } from './lib/prisma';

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com PostgreSQL estabelecida!');
    
    const userCount = await prisma.user.count();
    console.log(`✅ Total de usuários: ${userCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

test();
```

Execute:
```bash
npx tsx test-db.ts
```

---

### 9. Verificar Diferenças SQLite vs PostgreSQL

Algumas diferenças importantes:

#### Tipos de Dados

**SQLite:**
- `TEXT` → `VARCHAR` ou `TEXT` no PostgreSQL
- `INTEGER` → `INTEGER` ou `BIGINT`
- `REAL` → `DOUBLE PRECISION`

**Prisma** cuida disso automaticamente, mas verifique se há queries SQL diretas.

#### Funções

- SQLite: `datetime('now')`
- PostgreSQL: `NOW()` ou `CURRENT_TIMESTAMP`

#### Case Sensitivity

- SQLite: Case-insensitive por padrão
- PostgreSQL: Case-sensitive (use `ILIKE` para case-insensitive)

---

### 10. Adicionar Índices (Opcional mas Recomendado)

Edite `prisma/schema.prisma` e adicione índices:

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  
  @@index([email])
  @@index([role])
}

model Consultation {
  id        String @id @default(uuid())
  patientId String
  status    String
  
  @@index([patientId])
  @@index([status])
  @@index([scheduledAt])
}
```

Depois execute:
```bash
npx prisma db push
# ou
npx prisma migrate dev --name add_indexes
```

---

## ✅ Checklist de Migração

- [ ] Banco PostgreSQL criado
- [ ] `DATABASE_URL` configurado
- [ ] Schema Prisma alterado para `postgresql`
- [ ] Prisma Client regenerado
- [ ] Migrações criadas/aplicadas
- [ ] Dados migrados (se necessário)
- [ ] Conexão testada
- [ ] Aplicação funcionando
- [ ] Índices adicionados (opcional)
- [ ] Backup do SQLite antigo (se houver dados importantes)

---

## 🆘 Troubleshooting

### Erro: "relation does not exist"
- Execute `npx prisma db push` ou `npx prisma migrate deploy`
- Verifique se o schema está correto

### Erro: "connection refused"
- Verifique se o banco está acessível
- Verifique firewall/security groups
- Verifique credenciais

### Erro: "SSL required"
- Adicione `?sslmode=require` na `DATABASE_URL`

### Erro: "password authentication failed"
- Verifique usuário e senha
- Verifique se o usuário tem permissões

### Performance lenta
- Adicione índices nas colunas mais consultadas
- Verifique pool de conexões
- Considere usar connection pooling (PgBouncer)

---

## 📚 Recursos

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/guides/database/postgresql)
- [Supabase Docs](https://supabase.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)

---

**Última atualização**: Janeiro 2026
