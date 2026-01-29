# 📚 Índice – Documentação para Produção

Ponto de entrada para colocar o projeto em produção. Use na ordem abaixo.

---

## 1. Entender o que falta

| Documento | Descrição |
|-----------|-----------|
| **[ANALISE_PRODUCAO.md](ANALISE_PRODUCAO.md)** | Análise do estado atual, o que já está pronto, o que falta e ordem de execução. **Comece por aqui.** |
| **[CHECKLIST_PRODUCAO.md](CHECKLIST_PRODUCAO.md)** | Lista de verificação (checklist) para marcar antes e depois do deploy. |

---

## 2. Executar passo a passo

| Ordem | Documento | Quando usar |
|-------|-----------|-------------|
| ★ | **[GUIA_VERCEL_SUPABASE.md](GUIA_VERCEL_SUPABASE.md)** | **Vercel + Supabase**: passo a passo integrado (banco, Prisma, deploy, domínio). **Use este se for usar Vercel e Supabase.** |
| 1 | **[MIGRACAO_POSTGRESQL.md](MIGRACAO_POSTGRESQL.md)** | Migrar banco de SQLite para PostgreSQL (guia genérico). |
| 2 | **[.env.production.example](.env.production.example)** | Copiar para `.env.production` e preencher variáveis (nunca commitar). |
| 3 | **[LIMPEZA_PROJETO.md](LIMPEZA_PROJETO.md)** | Remover .bat, credenciais, console.log e organizar documentação. |
| 4 | **[DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)** | Deploy na Vercel (detalhes adicionais). |
| 5 | **[PREPARACAO_PRODUCAO.md](PREPARACAO_PRODUCAO.md)** | Guia completo (segurança, performance, backup, CI/CD, etc.). |

---

## 3. Referência e contexto

| Documento | Descrição |
|-----------|-----------|
| **[RESUMO_PRODUCAO.md](RESUMO_PRODUCAO.md)** | Resumo executivo e checklist rápido. |
| **[SUPABASE_CONNECTION_STRING.md](SUPABASE_CONNECTION_STRING.md)** | Onde e como pegar a connection string do Supabase (porta 6543, pooler). |
| **[HOSPEDAGEM_TRADICIONAL.md](HOSPEDAGEM_TRADICIONAL.md)** | Por que cPanel/HostGator não são adequados para este projeto. |

---

## Fluxo resumido (Vercel + Supabase)

1. Seguir o **GUIA_VERCEL_SUPABASE.md** (Supabase → Prisma → Vercel → domínio).
2. Marcar itens do **CHECKLIST_PRODUCAO.md** e validar site, login, APIs e emails.

## Fluxo resumido (genérico)

1. Ler **ANALISE_PRODUCAO.md** e abrir **CHECKLIST_PRODUCAO.md**.
2. Migrar para PostgreSQL (**MIGRACAO_POSTGRESQL.md**).
3. Configurar variáveis de ambiente (**.env.production.example**).
4. Fazer limpeza (**LIMPEZA_PROJETO.md**).
5. Testar build: `npm run build` e `npm start`.
6. Fazer deploy (**DEPLOY_VERCEL.md**).
7. Marcar itens do **CHECKLIST_PRODUCAO.md** e validar site, login, APIs e emails.

---

**Última atualização**: Janeiro 2026
