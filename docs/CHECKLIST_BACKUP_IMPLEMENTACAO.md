# Checklist de Implementação e Validação — Backup do Banco

Use este checklist para colocar em produção a estratégia de backup e validar periodicamente.

---

## Fase 1 — Implementação inicial

- [ ] **Provedor (Supabase/Neon):** Backups gerenciados ativados e retenção conferida (ex.: 7–30 dias).
- [ ] **Schema Prisma:** Produção usando `provider = "postgresql"` e `DATABASE_URL` com SSL.
- [ ] **Bucket (S3 ou GCS):** Criado, criptografia em repouso ativada, acesso público desativado.
- [ ] **Lifecycle do bucket:** Regras para expirar/arquivar backups (ex.: diários 14 dias, semanais 30, mensais 90).
- [ ] **Secrets no repositório (GitHub):**
  - [ ] `BACKUP_DATABASE_URL` (URL do PostgreSQL; preferir usuário read-only se possível).
  - [ ] Opcional S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `BACKUP_BUCKET`, `AWS_REGION`.
  - [ ] Opcional GCS: `BACKUP_GCS_BUCKET`, `GCP_SA_KEY` (se for usar no script).
- [ ] **Script de backup:** `scripts/backup-postgres.sh` testado localmente com `BACKUP_DATABASE_URL`.
- [ ] **Workflow:** `.github/workflows/backup-database.yml` ativo; primeiro run manual (workflow_dispatch) executado com sucesso.
- [ ] **Documentação:** `docs/ESTRATEGIA_BACKUP_BANCO.md` e `docs/RESTAURACAO_BANCO.md` lidos pela equipe.

---

## Fase 2 — Segurança e conformidade

- [ ] **Credenciais:** Nenhuma URL ou chave de banco em repositório ou logs.
- [ ] **Bucket:** IAM/Service Account com permissão mínima (ex.: apenas PutObject no prefixo de backup).
- [ ] **Rota de cron (se existir):** Protegida com `CRON_SECRET` e não exposta publicamente.

---

## Fase 3 — Validação periódica

### Teste de restore (trimestral ou mensal)

| Data       | Responsável | Dump utilizado     | Resultado (OK/Falha) | Observações |
|-----------|------------|--------------------|----------------------|-------------|
| __________ | __________ | __________________ | ____________________ | __________ |
| __________ | __________ | __________________ | ____________________ | __________ |

- [ ] Primeiro teste de restore realizado e registrado na tabela acima.
- [ ] Restore testado em ambiente de staging ou banco isolado (nunca sobre produção sem plano).
- [ ] Smoke test da aplicação contra banco restaurado (login, consultas, receitas) realizado.

### Saúde do backup

- [ ] Verificar no GitHub Actions (ou no bucket) se o último backup foi gerado na data esperada.
- [ ] Configurar alerta (e-mail, Slack ou GitHub) em caso de falha do workflow de backup.

---

## Fase 4 — Off-site (opcional)

- [ ] Segundo bucket ou região configurado para cópia dos backups.
- [ ] Lifecycle ou script de cópia testado; retenção off-site definida.

---

## Riscos e mitigação (revisão rápida)

| Risco                 | Mitigação adotada |
|-----------------------|-------------------|
| Vazamento de URL      | [ ] Secrets; usuário read-only |
| Bucket exposto        | [ ] Privado; IAM mínima |
| Falha silenciosa      | [ ] Alertas em falha do job |
| Restore não testado   | [ ] Teste trimestral agendado |

---

## Referência de arquivos

| Arquivo | Uso |
|--------|-----|
| `docs/ESTRATEGIA_BACKUP_BANCO.md` | Estratégia completa e arquitetura |
| `docs/RESTAURACAO_BANCO.md` | Passo a passo de restauração |
| `scripts/backup-postgres.sh` | Backup PostgreSQL (produção) |
| `scripts/backup-sqlite.sh` | Backup SQLite (dev) |
| `scripts/restore-postgres.sh` | Restauração a partir de dump |
| `.github/workflows/backup-database.yml` | Job diário de backup |

Documento criado como parte da estratégia de backup. Atualize as datas e responsáveis conforme os testes forem realizados.
