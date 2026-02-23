# Estratégia de Backup Automatizado do Banco de Dados

Documento que define a estratégia completa, segura e automatizada de backup do banco de dados do projeto ClickCannabis (Cannabilize), incluindo identificação dos ambientes, tipos de backup, automação, segurança, retenção, restauração e mitigação de riscos.

---

## 1. Visão geral da arquitetura e do banco de dados

### 1.1 Stack e infraestrutura

| Componente        | Tecnologia                          |
|------------------|-------------------------------------|
| Aplicação        | Next.js 14, Node ≥18                |
| ORM / DB         | Prisma 5.x                          |
| Deploy           | Vercel (serverless + Cron)          |
| Banco dev        | SQLite (`file:./dev.db`)            |
| Banco produção   | PostgreSQL (Supabase / Neon / outro)|

O schema Prisma está em `prisma/schema.prisma`. Em desenvolvimento o provider é `sqlite`; para produção deve ser alterado para `postgresql` e usada uma `DATABASE_URL` de serviço gerenciado.

### 1.2 Bancos de dados por ambiente

| Ambiente   | Tipo       | Onde                         | Uso                          |
|-----------|------------|------------------------------|------------------------------|
| Dev       | SQLite     | Arquivo local `./prisma/dev.db` ou `./dev.db` | Desenvolvimento local        |
| Staging   | PostgreSQL | Supabase/Neon (recomendado)  | Testes pré-produção          |
| Produção  | PostgreSQL | Supabase/Neon ou hospedagem  | Dados reais (LGPD, financeiro) |

**Observação:** O projeto hoje usa apenas `provider = "sqlite"` no schema. Para staging e produção é obrigatório usar PostgreSQL e configurar `DATABASE_URL` com SSL (`sslmode=require`).

### 1.3 Volume estimado de dados

- **Modelos principais:** Users, Doctors, Consultations, Prescriptions, Payments, Charges, PrescriptionDocument, AuditLog, WhatsAppMessage, etc.
- **Estimativa inicial (produção pequena/média):** 50–500 MB (milhares de usuários, dezenas de milhares de consultas/receitas).
- **Crescimento:** Dados clínicos e de auditoria tendem a crescer; prescrições e documentos podem aumentar o volume. Planejar para 1–5 GB no primeiro ano é razoável.

O backup completo (dump) costuma ficar entre 50% e 100% do tamanho do banco (depende de compressão e formato).

---

## 2. Estratégia de backup

### 2.1 Tipos de backup

| Tipo        | Uso recomendado                    | Frequência sugerida |
|-------------|------------------------------------|---------------------|
| **Completo**| Base diária, restore pontual        | 1x por dia           |
| Incremental | Não aplicável de forma simples ao pg_dump (usa WAL/ PITR no provedor) | — |
| Diferencial | Reduzir tempo de restore; exige ferramentas ou PITR | Opcional |

Para este projeto, a estratégia é **backup completo diário** (dump lógico com `pg_dump`), complementado pelos **backups gerenciados do provedor** (Supabase/Neon), que costumam oferecer PITR (Point-in-Time Recovery) e retenção de 7–30 dias.

- **PostgreSQL produção:** backup completo diário (script/CI) + uso dos backups do provedor.
- **SQLite dev:** cópia do arquivo `.db` (ou `.sql` gerado) em horário combinado, opcional.

### 2.2 Frequência e janela

| Ambiente   | Frequência   | Janela sugerida     | Motivo                    |
|-----------|--------------|---------------------|---------------------------|
| Produção  | 1x/dia       | 02:00–04:00 UTC     | Baixo tráfego, menor impacto |
| Staging   | 1x/dia ou 3x/semana | Madrugada (UTC) | Alinhado ao uso de staging |
| Dev       | Opcional     | Manual ou 1x/dia     | Apenas conveniência       |

**RPO (Recovery Point Objective):** até **24 horas** — no pior caso, perda de até um dia de dados se depender só do backup diário. Para reduzir, usar backups do provedor (PITR) ou aumentar frequência (ex.: 2x/dia).

**RTO (Recovery Time Objective):** **4–8 horas** para restauração total a partir do dump (depende do tamanho do banco e do processo documentado). Com PITR do provedor, o RTO pode ser bem menor.

### 2.3 Diagrama conceitual (fluxo de backup)

```
┌─────────────────┐     pg_dump (diário)      ┌──────────────────┐
│  PostgreSQL     │ ─────────────────────────►│  Arquivo .sql    │
│  (Produção)     │   (script ou GitHub       │  (compactado)     │
│  Supabase/Neon  │    Actions)                │                  │
└────────┬────────┘                           └────────┬───────────┘
         │                                            │
         │ Backups gerenciados                         │ Upload
         │ (PITR, snapshots)                           ▼
         │                                    ┌──────────────────┐
         └──────────────────────────────────►│  Armazenamento   │
                                              │  (S3/GCS/outro   │
                                              │   bucket)        │
                                              └──────────────────┘
                                                       │
                                                       │ Cópia/retenção
                                                       ▼
                                              ┌──────────────────┐
                                              │  Off-site /      │
                                              │  outra região    │
                                              └──────────────────┘
```

---

## 3. Solução automatizada

### 3.1 Opções de execução

| Método              | Prós                         | Contras                          | Recomendação        |
|---------------------|-----------------------------|----------------------------------|---------------------|
| Backups do provedor | Zero manutenção, PITR       | Menos controle, retenção limitada| Sempre usar         |
| GitHub Actions      | Não depende de Vercel, idempotente, logs | Requer secrets (DATABASE_URL)   | **Recomendado**     |
| Vercel Cron + API   | Integrado ao deploy         | Timeout (60s), não ideal para DB grande | Só para DB pequeno  |
| Cron em VPS/serviço | Controle total              | Custo e operação                 | Alternativa         |

Recomendação: **usar backups nativos do Supabase/Neon como primeira linha** e **GitHub Actions** para dump diário e cópia para bucket (off-site), com retentativa automática.

### 3.2 Execução confiável e idempotente

- **Idempotência:** cada execução gera um arquivo com data (ex.: `backup-2025-02-10.sql.gz`). Rodar duas vezes no mesmo dia sobrescreve ou versiona conforme política do bucket.
- **Retentativa:** no workflow (ex.: GitHub Actions), configurar `retries: 2` e falhar o job se após retentativas o dump ou upload falhar.
- **Saída:** script deve encerrar com código 0 apenas em sucesso; qualquer falha de `pg_dump` ou upload deve resultar em exit não zero para alertar (e.g. notificação no GitHub ou integração com Slack/email).

### 3.3 Onde estão os artefatos

- **Script de backup PostgreSQL:** `scripts/backup-postgres.ts` (ou `.sh` em `scripts/backup-postgres.sh`).
- **Script de backup SQLite (dev):** `scripts/backup-sqlite.sh` (ou equivalente).
- **Workflow de exemplo:** `.github/workflows/backup-database.yml`.
- **API route opcional (Vercel Cron):** `app/api/cron/backup-database/route.ts` (apenas se DB pequeno e timeout aceitável).

---

## 4. Segurança e conformidade

### 4.1 Criptografia

- **Em trânsito:** `DATABASE_URL` com `sslmode=require`; upload para bucket via HTTPS (S3/GCS com TLS).
- **Em repouso:** bucket com criptografia ativada (S3-SSE, GCS CSEK ou padrão do provedor). Evitar armazenar dumps em disco não criptografado.

### 4.2 Credenciais e segredos

- **DATABASE_URL:** nunca em repositório. Usar GitHub Secrets (ex.: `BACKUP_DATABASE_URL` só para backup, com usuário read-only se possível) ou variáveis do ambiente de deploy.
- **Bucket (S3/GCS):** chaves em secrets (ex.: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `BACKUP_BUCKET`). Preferir IAM/Service Account com política mínima (ex.: apenas `s3:PutObject` no bucket de backup).
- **API de backup (se usar rota Vercel):** proteger com `CRON_SECRET` no header `Authorization`, como nas demais rotas de cron do projeto.

### 4.3 Controle de acesso aos backups

- Restringir listagem e leitura do bucket a poucos usuários/serviços (ex.: role de “backup” e “admin”).
- Logs de acesso ao bucket (S3 Access Logs / GCS audit logs) para auditoria.
- Backups contêm dados sensíveis (LGPD): tratar como dado crítico, acesso somente para restauração ou auditoria autorizada.

### 4.4 Isolamento de produção

- **Produção:** usar sempre `BACKUP_DATABASE_URL` (ou equivalente) apontando apenas para o banco de produção; rodar backup em job agendado, sem interação manual desnecessária.
- **Staging:** usar outra `DATABASE_URL` e, se possível, outro bucket ou prefixo (ex.: `backups/staging/`).
- Evitar usar a mesma conta de serviço para aplicação e backup; conta/role dedicada para backup reduz superfície de ataque.

---

## 5. Política de retenção

### 5.1 Quantidade e rotação

| Tipo              | Retenção sugerida | Ação após expiração   |
|-------------------|-------------------|------------------------|
| Diário            | Últimos 14 dias   | Excluir ou mover para cold |
| Semanal           | Últimas 4 semanas | Excluir após 4ª semana   |
| Mensal            | Últimos 3 meses  | Excluir ou arquivar      |

Implementação: no script ou no lifecycle do bucket (S3 Lifecycle / GCS Object Lifecycle), regra para deletar objetos com prefixo `backups/daily/` após 14 dias, `backups/weekly/` após 30 dias, etc.

### 5.2 Off-site e outra região/provedor

- **Primário:** bucket na mesma nuvem do app (ex.: Vercel/Neon na AWS → S3 na mesma região).
- **Off-site:** cópia para outro bucket em outra região ou outro provedor (ex.: S3 → GCS, ou S3 região A → S3 região B) para resistir a falha de região ou conta.
- Automatizar a cópia no mesmo job (script em duas etapas: dump → upload primário → upload secundário) ou com replicação entre buckets (S3 Cross-Region Replication, etc.).

---

## 6. Estratégia de restauração

### 6.1 Processo documentado

1. **Identificar o ponto de restauração:** data/hora desejada; escolher dump mais recente anterior a esse ponto (e, se houver PITR no provedor, usar PITR para momento exato).
2. **Baixar o dump:** do bucket (ou do provedor), para ambiente seguro (não produção direto).
3. **Restauração total:** criar banco novo ou usar banco de recuperação; aplicar dump com `psql` ou `pg_restore` conforme tipo de dump (custom/plain).
4. **Validação:** conferir tabelas e contagens; rodar smoke tests da aplicação contra o banco restaurado.
5. **Cutover:** somente após validação, trocar `DATABASE_URL` da aplicação para o banco restaurado (ou promover o banco restaurado como novo primário).

Documento passo a passo detalhado: **`docs/RESTAURACAO_BANCO.md`** (criado junto com esta estratégia).

### 6.2 Testes periódicos de restore

- **Frequência:** pelo menos **trimestral** (ou mensal no início).
- **Procedimento:** restaurar o último backup em ambiente de staging ou local; rodar migrations se necessário; validar login, consultas e um subset de dados; documentar tempo gasto e qualquer problema.
- Registrar resultado em checklist ou planilha (data, responsável, sucesso/falha, observações).

### 6.3 Restauração parcial e total

- **Total:** usar um único dump completo; processo acima.
- **Parcial:** possível com dump em formato custom (`pg_dump -Fc`) e `pg_restore -t tabela` para tabelas específicas. Útil para recuperar apenas uma tabela corrompida ou apagada por engano. Documentar no guia de restauração quais tabelas são críticas e como restaurar só elas.

---

## 7. Impacto de custo e performance

### 7.1 Custos aproximados (ordem de grandeza)

- **Supabase/Neon:** backups gerenciados geralmente inclusos ou baratos no plano pago.
- **Bucket S3/GCS:** ~US$ 0,023/GB/mês (S3); 5 GB ≈ US$ 0,12/mês. Tráfego de upload geralmente baixo.
- **GitHub Actions:** minutos gratuitos suficientes para 1 job diário de poucos minutos; além disso, custo baixo.
- **Conclusão:** custo adicional típico < US$ 5–10/mês para backup automatizado com off-site.

### 7.2 Performance

- **pg_dump:** leitura sequencial; impacto no banco é moderado. Executar na janela de menor uso (madrugada).
- **Connection pooler:** usar URL de conexão direta para backup (porta 5432 no Supabase, se disponível), não pooler (6543), para evitar timeout em dumps maiores. Documentar isso no script e no guia.

### 7.3 Trade-offs

| Opção              | Segurança | Custo | Complexidade |
|--------------------|-----------|--------|--------------|
| Só provedor         | Média     | Baixo  | Baixa        |
| Provedor + dump diário em bucket | Alta | Baixo | Média        |
| + Off-site outra região | Muito alta | Médio | Média        |
| Backup contínuo/WAL | Muito alta | Maior | Alta         |

Recomendação: **provedor + dump diário em bucket + retenção e lifecycle**, e **off-site** se o negócio exigir resiliência a desastre de região/conta.

---

## 8. Riscos conhecidos e mitigação

| Risco                         | Mitigação                                                                 |
|------------------------------|---------------------------------------------------------------------------|
| Vazamento de DATABASE_URL     | Secrets em repositório; usuário read-only para backup; rotação de senha  |
| Bucket público ou permissões excessivas | Bucket privado; IAM mínimo; sem listagem pública                        |
| Falha silenciosa do job       | Alertas em falha (GitHub, Slack, email); monitorar último backup com data |
| Dump incompleto (timeout)     | Executar em job com tempo suficiente (Actions 6–15 min); usar conexão direta |
| Corrupção de arquivo no bucket| Checksum (ETag/MD5); opcional: verificação após upload                   |
| Região única                  | Cópia off-site em outra região/provedor                                   |
| Restore não testado           | Testes de restore periódicos e documentados                              |

---

## 9. Arquitetura final recomendada

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKUP AUTOMATIZADO                               │
├─────────────────────────────────────────────────────────────────────────┤
│  1. PostgreSQL (Produção) — Supabase / Neon                              │
│     • Backups gerenciados (PITR) — ativar e conferir retenção            │
│     • Conexão direta (5432) para pg_dump quando possível                │
├─────────────────────────────────────────────────────────────────────────┤
│  2. Job agendado (GitHub Actions, 1x/dia, 02:00 UTC)                     │
│     • pg_dump → compressão (gzip)                                        │
│     • Upload para bucket primário (S3 ou GCS)                            │
│     • Opcional: cópia para bucket/região off-site                        │
│     • Retentativa: 2x em caso de falha                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  3. Bucket primário                                                      │
│     • Criptografia em repouso (SSE)                                      │
│     • Lifecycle: diários 14 dias, semanais 30 dias, mensais 90 dias      │
│     • Acesso restrito (IAM/Service Account mínima)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  4. Off-site (opcional)                                                  │
│     • Outra região ou outro provedor                                     │
│     • Mesma política de retenção ou mais longa                           │
├─────────────────────────────────────────────────────────────────────────┤
│  5. Restauração                                                          │
│     • Documentação em docs/RESTAURACAO_BANCO.md                           │
│     • Teste de restore trimestral                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Passo a passo de implementação

1. **Ativar backups no provedor** (Supabase/Neon): conferir plano, PITR e retenção.
2. **Criar bucket** (S3 ou GCS) com criptografia e bloqueio de acesso público.
3. **Configurar secrets:** `BACKUP_DATABASE_URL`, credenciais do bucket (ou OIDC se usar).
4. **Adicionar script** `scripts/backup-postgres.sh` (ou `.ts`) e testar localmente com `BACKUP_DATABASE_URL`.
5. **Adicionar workflow** `.github/workflows/backup-database.yml` com schedule e retentativa.
6. **Configurar lifecycle** do bucket para retenção (14/30/90 dias).
7. **(Opcional)** Configurar cópia off-site (segundo bucket ou script em duas etapas).
8. **Escrever** `docs/RESTAURACAO_BANCO.md` e realizar primeiro teste de restore em staging.
9. **Agendar** testes de restore trimestrais e registrar em checklist.
10. **Revisar** esta estratégia e o guia de restauração ao mudar de provedor ou de tamanho do banco.

---

## 11. Referências rápidas

- **Backup PostgreSQL:** [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html).
- **Supabase:** [Backups](https://supabase.com/docs/guides/platform/backups).
- **Neon:** [Backup and Restore](https://neon.tech/docs/guides/backup-restore).
- **S3 Lifecycle:** [Object lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html).

**Checklist de implementação e validação:** `docs/CHECKLIST_BACKUP_IMPLEMENTACAO.md`

Documento criado como parte da estratégia de backup do projeto. Revisar conforme crescimento do volume e mudanças de infraestrutura.
