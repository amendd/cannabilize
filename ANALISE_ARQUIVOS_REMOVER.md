# 📋 Análise de Arquivos para Remoção

## 🎯 Resumo Executivo

Este documento lista todos os arquivos que podem ser **removidos com segurança** do projeto, organizados por categoria.

**Total estimado**: ~80+ arquivos que podem ser removidos ou consolidados.

---

## 📁 Categoria 1: Scripts de Teste/Debug (Raiz do Projeto)

### ❌ REMOVER - Scripts duplicados de teste de login/usuários

Estes scripts são variações do mesmo propósito e podem ser removidos. O script `criar-dados-completos.ts` já cobre todas as funcionalidades:

- [ ] `verificar-usuarios.ts` - Script de teste (duplicado)
- [ ] `criar-usuarios.ts` - Script de teste (funcionalidade já em criar-dados-completos.ts)
- [ ] `testar-login.ts` - Script de teste (duplicado)
- [ ] `verificar-login-simples.js` - Script de teste (duplicado, versão JS)
- [ ] `solucao-login-completa.ts` - Script de teste (duplicado)

**Ação**: Manter apenas `criar-dados-completos.ts` (ou mover para `scripts/`)

---

## 📁 Categoria 2: Documentação de Problemas Resolvidos

### ❌ REMOVER - Documentação de correções temporárias

Estes arquivos documentam problemas que já foram resolvidos e não são mais necessários:

#### Problemas de Login (já resolvidos):
- [ ] `SOLUCAO_LOGIN.md`
- [ ] `SOLUCAO_LOGIN_COMPLETA.md`
- [ ] `SOLUCAO_LOGIN_NAO_FUNCIONA.md`
- [ ] `POR_QUE_LOGIN_PAROU.md`
- [ ] `COMO_INICIAR_SERVIDOR.md`

#### Problemas de Erro (já resolvidos):
- [ ] `SOLUCAO_ERRO.md`
- [ ] `SOLUCAO_ERRO_EPERM.md`
- [ ] `SOLUCAO_ERRO_PRISMA.md`
- [ ] `SOLUCAO_ERRO_DEPENDENCIAS.md`
- [ ] `SOLUCAO_TABELA_NAO_EXISTE.md`
- [ ] `SOLUCAO_PORTA_3000.md`
- [ ] `SOLUCAO_POLITICA_POWERSHELL.md`
- [ ] `SOLUCAO_FECHA_RAPIDO.md`
- [ ] `SOLUCAO_FECHA_RAPIDO_FINAL.md`
- [ ] `SOLUCAO_FINAL.md`

#### Correções Específicas (já aplicadas):
- [ ] `CORRECAO_BOTAO_ADIANTAMENTO.md`
- [ ] `CORRECAO_ERRO_ADMIN.md`
- [ ] `CORRECAO_ERRO_PAGAMENTO.md`
- [ ] `CORRECAO_FLUXO_AGENDAMENTO.md`
- [ ] `CORRECAO_HORARIO_2055.md`
- [ ] `CORRECAO_VALIDACAO_HORARIO.md`
- [ ] `CORRECOES_AGENDAMENTO.md`
- [ ] `CORRECOES_COMPLETAS.md`
- [ ] `RESUMO_CORRECOES_FINAIS.md`
- [ ] `FIX_OVERLAY_EMERGENCY.md`
- [ ] `DEBUG_CONVITES_PACIENTE.md`
- [ ] `DIAGNOSTICO_DISPONIBILIDADE.md`

**Ação**: Remover todos (problemas já resolvidos)

---

## 📁 Categoria 3: Documentação Redundante/Resumos

### ❌ REMOVER - Resumos e análises temporárias

Estes arquivos são resumos de sessões de trabalho e podem ser consolidados:

#### Resumos Executivos:
- [ ] `RESUMO_EXECUTIVO_ANALISE.md`
- [ ] `RESUMO_EXECUTIVO_MELHORIAS.md`
- [ ] `RESUMO_FINAL.md`
- [ ] `FINAL_SUMMARY.md`
- [ ] `RESUMO_PRODUCAO.md`
- [ ] `RESUMO_ANALISE_DESIGN.md`
- [ ] `RESUMO_ANALISE_MELHORIAS.md`
- [ ] `RESUMO_IMPLEMENTACAO_DESIGN.md`
- [ ] `RESUMO_IMPLEMENTACAO_SEGURANCA.md`
- [ ] `RESUMO_IMPLEMENTACAO_CONVITES.md`
- [ ] `RESUMO_CONVITES_ADIANTAMENTO.md`

#### Análises Temporárias:
- [ ] `ANALISE_LAYOUT_DESIGN_UI_UX.md`
- [ ] `ANALISE_COMPLETA_MELHORIAS.md`
- [ ] `ANALISE_PRODUCAO.md`
- [ ] `ANALISE_GERAL_PROJETO.md`
- [ ] `ANALISE_MELHORIAS_PROJETO.md`
- [ ] `ANALISE_UI_UX_CONSULTA_MEDICO.md`

#### Melhorias Implementadas:
- [ ] `MELHORIAS_IMPLEMENTADAS.md`
- [ ] `MELHORIAS_IMPLEMENTADAS_DESIGN.md`
- [ ] `MELHORIAS_IMPLEMENTADAS_SESSAO.md` (duplicado)
- [ ] `MELHORIAS_APLICADAS_SESSAO.md`
- [ ] `MELHORIAS_V2_PAGINA_CONSULTA.md`
- [ ] `MELHORIAS_DISPONIBILIDADE_E_ERROS.md`
- [ ] `MELHORIAS_FINAIS_CONVITES.md`
- [ ] `INOVACOES_E_MELHORIAS.md`
- [ ] `TOP_10_INOVACOES.md`
- [ ] `EXEMPLOS_MELHORIAS_PRATICAS.md`
- [ ] `EXEMPLOS_IMPLEMENTACAO_MELHORIAS.md`

**Ação**: Consolidar informações importantes no README.md e remover os demais

---

## 📁 Categoria 4: Documentação de Implementação (Histórico)

### ⚠️ CONSIDERAR REMOVER - Implementações já concluídas

Estes arquivos documentam implementações que já foram concluídas:

- [ ] `IMPLEMENTACAO_COMPLETA.md`
- [ ] `IMPLEMENTACAO_COMPLETA_TELEMEDICINA.md`
- [ ] `IMPLEMENTACAO_TELEMEDICINA.md`
- [ ] `IMPLEMENTACAO_AGENDAMENTO_MEDICO_ONLINE.md`
- [ ] `IMPLEMENTACAO_CONSULTA_COMPLETA.md`
- [ ] `IMPLEMENTACAO_CONVITES_ADIANTAMENTO.md`
- [ ] `IMPLEMENTACAO_CONFIGURACAO_RECAPTCHA.md`
- [ ] `IMPLEMENTACOES_RECENTES.md`
- [ ] `MIGRACAO_CONCLUIDA.md`
- [ ] `ALTERACOES_REALIZADAS.md`

**Ação**: Mover para pasta `docs/historico/` ou remover se não for mais necessário

---

## 📁 Categoria 5: Guias e Instruções Redundantes

### ⚠️ CONSOLIDAR - Múltiplos guias sobre o mesmo tema

- [ ] `LEIA_ME.txt` - Instruções básicas (redundante com README.md)
- [ ] `LEIA_ME_PRIMEIRO.txt` - Instruções básicas (redundante)
- [ ] `README_EXECUCAO.md` - Redundante com README.md
- [ ] `README_INICIO_RAPIDO.md` - Redundante com README.md
- [ ] `COMO_EXECUTAR.md` - Redundante com README.md
- [ ] `INSTRUCOES_FINAIS.md` - Redundante
- [ ] `INSTRUCOES_MIGRACAO.md` - Pode consolidar no README

**Ação**: Consolidar no README.md principal e remover duplicatas

---

## 📁 Categoria 6: Guias Específicos (Manter ou Consolidar)

### ✅ MANTER (mas considerar consolidar):
- [ ] `GUIA_VERCEL_SUPABASE.md` - Útil para deploy
- [ ] `GUIA_CONFIGURACAO_SEGURANCA.md` - Útil
- [ ] `GUIA_IMPLEMENTACAO_IMAGENS_PESSOAS.md` - Pode ser útil
- [ ] `DEPLOY_VERCEL.md` - Útil para deploy
- [ ] `MIGRACAO_POSTGRESQL.md` - Útil para referência
- [ ] `PREPARACAO_PRODUCAO.md` - Útil
- [ ] `SETUP_EMAIL_SYSTEM.md` - Útil
- [ ] `EMAIL_SYSTEM_DOCUMENTATION.md` - Pode consolidar com SETUP_EMAIL_SYSTEM.md

**Ação**: Manter os úteis, consolidar os duplicados

---

## 📁 Categoria 7: Arquivos de Configuração/Setup Temporários

### ❌ REMOVER:
- [ ] `SCHEMA_CORRIGIDO.txt` - Schema já está no Prisma
- [ ] `CREDENCIAIS_ACESSO.md` - ⚠️ Pode conter credenciais sensíveis
- [ ] `CREDENCIAIS_CANNABILIZE.md` - ⚠️ Pode conter credenciais sensíveis
- [ ] `GUIA_CREDENCIAIS_GOOGLE_MEET.md` - ⚠️ Pode conter credenciais
- [ ] `SUPABASE_CONNECTION_STRING.md` - Informação sensível

**Ação**: ⚠️ **REMOVER IMEDIATAMENTE** - Podem conter credenciais expostas!

---

## 📁 Categoria 8: Scripts PowerShell/Batch

### ❌ REMOVER (ou mover para pasta dev/):
- [ ] `iniciar.ps1` - Script de desenvolvimento local

**Nota**: Se houver arquivos `.bat`, também devem ser removidos (conforme LIMPEZA_PROJETO.md)

---

## 📁 Categoria 9: Documentação de Funcionalidades (Manter se útil)

### ✅ AVALIAR - Pode ser útil manter:
- [ ] `SISTEMA_PAGAMENTOS.md` - Documentação de funcionalidade
- [ ] `SIMPLIFICACAO_PAGAMENTOS.md` - Pode consolidar com acima
- [ ] `SEGURANCA_TELEMEDICINA.md` - Documentação importante
- [ ] `SEGURANCA_PROTECAO_BOTS.md` - Documentação importante
- [ ] `EXPLICACAO_WEBHOOKS.md` - Pode ser útil
- [ ] `CARTEIRINHA_DIGITAL.md` - Documentação de funcionalidade
- [ ] `CARTEIRINHA_ADMIN.md` - Pode consolidar com acima
- [ ] `FUNCIONALIDADES_ADICIONAIS.md` - Pode ser útil
- [ ] `ROADMAP_INOVACOES.md` - Pode ser útil manter
- [ ] `MODELO_DASHBOARDS.md` - Pode ser útil
- [ ] `HOSPEDAGEM_TRADICIONAL.md` - Pode ser útil
- [ ] `CONFIGURACAO_ANTECEDENCIA_MINIMA.md` - Pode ser útil
- [ ] `TESTE_AGENDAMENTO.md` - Pode ser útil
- [ ] `CHECKLIST_IMPLEMENTACAO.md` - Pode ser útil
- [ ] `CHECKLIST_PRODUCAO.md` - Pode ser útil
- [ ] `CHANGELOG.md` - ✅ MANTER (histórico de versões)
- [ ] `PRODUCAO_INDEX.md` - Pode ser útil

**Ação**: Avaliar caso a caso, consolidar quando possível

---

## 📁 Categoria 10: Scripts na Pasta scripts/

### ✅ MANTER (mas verificar se são necessários):
- [ ] `scripts/criar-admin-clickcannabis.ts` - Pode ser útil
- [ ] `scripts/criar-receita-teste.ts` - Script de teste (considerar remover)
- [ ] `scripts/fix-resend-config.ts` - Script de correção (já aplicado?)
- [ ] `scripts/run-reschedule-invites-migration.ts` - Migração (já aplicada?)
- [ ] `scripts/setup-resend.js` - Setup (já configurado?)
- [ ] `scripts/test-resend.ts` - Script de teste (considerar remover)
- [ ] `scripts/verificar-pagamento-paciente.ts` - Script de teste (considerar remover)

**Ação**: Verificar se são scripts úteis ou apenas de teste/correção temporária

---

## 📊 Resumo por Prioridade

### 🔴 ALTA PRIORIDADE - Remover Imediatamente:
1. Arquivos com credenciais (CREDENCIAIS_*.md, SUPABASE_CONNECTION_STRING.md)
2. Scripts de teste duplicados na raiz
3. Documentação de problemas já resolvidos (SOLUCAO_*.md, CORRECAO_*.md)

### 🟡 MÉDIA PRIORIDADE - Consolidar/Remover:
1. Resumos e análises temporárias (RESUMO_*.md, ANALISE_*.md)
2. Melhorias implementadas (MELHORIAS_*.md)
3. Guias redundantes (LEIA_ME*.txt, README_*.md duplicados)

### 🟢 BAIXA PRIORIDADE - Avaliar:
1. Documentação de funcionalidades (pode ser útil manter)
2. Scripts na pasta scripts/ (verificar se ainda são necessários)

---

## ✅ Arquivos para MANTER

### Documentação Essencial:
- ✅ `README.md` - Documentação principal
- ✅ `CHANGELOG.md` - Histórico de versões
- ✅ `LIMPEZA_PROJETO.md` - Este guia de limpeza
- ✅ `PREPARACAO_PRODUCAO.md` - Guia de produção
- ✅ `DEPLOY_VERCEL.md` - Guia de deploy
- ✅ `MIGRACAO_POSTGRESQL.md` - Referência de migração

### Scripts Essenciais:
- ✅ `criar-dados-completos.ts` - Script de setup (ou mover para scripts/)
- ✅ Scripts úteis em `scripts/` (após avaliação)

---

## 🎯 Plano de Ação Recomendado

1. **Fase 1 - Segurança**: Remover arquivos com credenciais
2. **Fase 2 - Limpeza**: Remover scripts de teste duplicados
3. **Fase 3 - Consolidação**: Remover documentação de problemas resolvidos
4. **Fase 4 - Organização**: Consolidar documentação redundante
5. **Fase 5 - Avaliação**: Revisar e manter apenas o essencial

---

**Data da Análise**: Janeiro 2026
**Total de Arquivos Identificados para Remoção**: ~80+ arquivos
