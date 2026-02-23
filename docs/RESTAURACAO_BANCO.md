# Guia de Restauração do Banco de Dados

Processo claro para restauração **total** e **parcial** a partir dos backups, e como validar após o restore.

---

## Pré-requisitos

- Acesso ao dump (arquivo `.sql` ou `.sql.gz`) ou ao painel do provedor (Supabase/Neon) para PITR.
- Cliente PostgreSQL instalado (`psql`, `pg_restore`) ou uso do painel do provedor.
- Para restauração em novo banco: nova `DATABASE_URL` ou banco temporário criado no provedor.

---

## 1. Restauração total (dump completo)

### 1.1 Obter o dump

- **Bucket (S3/GCS):** baixar o arquivo do dia desejado (ex.: `backup-2025-02-10.sql.gz`).
- **Provedor:** Supabase/Neon podem permitir download de snapshot ou uso de PITR na interface.

### 1.2 Ambiente de restauração

- Preferir **banco novo** (ex.: `clickcannabis_restore`) para não sobrescrever produção.
- Criar o banco no Supabase/Neon ou em servidor PostgreSQL e anotar a `DATABASE_URL` de restauração.

### 1.3 Aplicar o dump

**Dump em texto (plain SQL), compactado:**
```bash
# Descompactar e restaurar
gunzip -c backup-2025-02-10.sql.gz | psql "$DATABASE_URL_RESTORE" -v ON_ERROR_STOP=1
```

**Dump em texto, não compactado:**
```bash
psql "$DATABASE_URL_RESTORE" -v ON_ERROR_STOP=1 -f backup-2025-02-10.sql
```

**Dump em formato custom (pg_dump -Fc):**
```bash
pg_restore -d "$DATABASE_URL_RESTORE" -v --no-owner --no-privileges backup-2025-02-10.dump
```

- `ON_ERROR_STOP=1` faz o `psql` parar no primeiro erro (recomendado).
- Se o dump foi gerado com `--clean`, ele tenta dropar objetos antes; em banco novo isso pode gerar avisos (normal).

### 1.4 Pós-restauração

- Rodar migrations do Prisma se necessário: `npx prisma migrate deploy` (ou `db push` em cenário controlado).
- Validar contagens de tabelas e smoke tests (ver seção 3).

---

## 2. Restauração parcial (uma ou mais tabelas)

Útil quando apenas uma tabela foi corrompida ou apagada por engano.

### 2.1 Usando dump em formato custom

Se o backup foi gerado com `pg_dump -Fc` (formato custom):

```bash
# Listar tabelas no dump
pg_restore -l backup-2025-02-10.dump

# Restaurar apenas a tabela desejada (ex.: users) em banco existente
pg_restore -d "$DATABASE_URL_RESTORE" -v -t users --no-owner --no-privileges backup-2025-02-10.dump
```

- Restaurar em banco auxiliar e depois copiar dados para produção (INSERT SELECT ou ferramenta) costuma ser mais seguro do que restaurar direto em produção.
- Atenção a FKs: pode ser necessário desabilitar triggers ou restaurar tabelas na ordem correta.

### 2.2 A partir de dump em texto (plain SQL)

- Abrir o `.sql` e extrair apenas os `INSERT` (e eventualmente `CREATE TABLE`) da tabela desejada.
- Ou usar ferramenta que filtre por tabela; aplicar em banco de teste primeiro.

---

## 3. Validação após restauração

### 3.1 Verificações rápidas

```sql
-- Contagem de registros em tabelas principais
SELECT 'users' AS tabela, COUNT(*) FROM users
UNION ALL SELECT 'consultations', COUNT(*) FROM consultations
UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL SELECT 'payments', COUNT(*) FROM payments;
```

### 3.2 Smoke test da aplicação

- Apontar a aplicação (staging ou local) para a `DATABASE_URL` do banco restaurado.
- Testar: login (admin e paciente), listagem de consultas, visualização de uma receita, listagem de pagamentos.
- Conferir se não há erros de FK ou dados faltando nas telas principais.

### 3.3 Registro do teste

- Data do restore, dump utilizado, responsável, resultado (sucesso/falha) e observações.
- Atualizar o checklist de testes de restore (ex.: `docs/CHECKLIST_BACKUP_IMPLEMENTACAO.md`).

---

## 4. Cutover para produção (após validação)

- **Se restaurou em banco novo:** alterar `DATABASE_URL` da aplicação (Vercel/host) para o banco restaurado e fazer deploy ou reinício.
- **Se usou PITR do provedor:** seguir a documentação do provedor para “promover” o ponto de restauração como novo primário e atualizar a `DATABASE_URL` se necessário.
- Comunicar equipe e monitorar logs e métricas após o cutover.

---

## 5. Referência rápida (comandos)

| Ação              | Comando (exemplo) |
|-------------------|-------------------|
| Restaurar .sql.gz | `gunzip -c backup.sql.gz \| psql $URL -v ON_ERROR_STOP=1` |
| Restaurar .sql    | `psql $URL -v ON_ERROR_STOP=1 -f backup.sql` |
| Restaurar .dump   | `pg_restore -d $URL -v --no-owner --no-privileges backup.dump` |
| Listar conteúdo   | `pg_restore -l backup.dump` |
| Restaurar 1 tabela| `pg_restore -d $URL -t nome_tabela backup.dump` |

Documento complementar a `docs/ESTRATEGIA_BACKUP_BANCO.md`.
