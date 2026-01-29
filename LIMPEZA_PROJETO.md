# 🧹 Limpeza do Projeto para Produção

Este documento lista todos os arquivos e código que devem ser removidos, limpos ou otimizados antes de ir para produção.

---

## 🗑️ Arquivos para REMOVER

### Scripts de Desenvolvimento (.bat)

Estes arquivos são úteis apenas para desenvolvimento local no Windows:

- [ ] `EXECUTAR_AGORA.bat`
- [ ] `EXECUTAR_AQUI.bat`
- [ ] `EXECUTAR_CMD.bat`
- [ ] `EXECUTAR_DEBUG.bat`
- [ ] `EXECUTAR_FIXO.bat`
- [ ] `EXECUTAR_OUTRA_PORTA.bat`
- [ ] `EXECUTAR_SIMPLES.bat`
- [ ] `EXECUTAR.bat`
- [ ] `INICIAR_SITE.bat`
- [ ] `INICIAR_SITE_VERBOSE.bat`
- [ ] `INICIO_RAPIDO.bat`
- [ ] `INSTALAR_CORRETO.bat`
- [ ] `RESOLVER_TUDO.bat`
- [ ] `CORRIGIR_E_EXECUTAR.bat`
- [ ] `SETUP_COMPLETO.bat`

**Ação**: Deletar todos ou mover para pasta `scripts/dev/` (se quiser manter para referência)

---

### Documentação Temporária/Redundante

Manter apenas:
- ✅ `README.md` (principal)
- ✅ `PREPARACAO_PRODUCAO.md` (este guia)
- ✅ `MIGRACAO_POSTGRESQL.md`
- ✅ `DEPLOY_VERCEL.md`
- ✅ `.env.example`

Considerar remover ou consolidar:
- [ ] `COMO_EXECUTAR.md` (pode consolidar no README)
- [ ] `COMO_USAR.txt`
- [ ] `CREDENCIAIS_ACESSO.md` (remover credenciais, manter apenas estrutura)
- [ ] `EXECUTAR_AQUI.bat` (já listado acima)
- [ ] `FINAL_SUMMARY.md`
- [ ] `IMPLEMENTACAO_COMPLETA.md` (pode mover para docs/)
- [ ] `INSTRUCOES_FINAIS.md`
- [ ] `LOGINS_SENHAS.txt` (⚠️ REMOVER - contém credenciais!)
- [ ] `MODELO_DASHBOARDS.md` (pode mover para docs/)
- [ ] `README_EXECUCAO.md`
- [ ] `README_INICIO_RAPIDO.md`
- [ ] `RESUMO_FINAL.md`
- [ ] `SCHEMA_CORRIGIDO.txt`
- [ ] `ROADMAP_INOVACOES.md` (manter se for útil)

**Ação**: 
- Deletar arquivos com credenciais (`LOGINS_SENHAS.txt`, etc.)
- Consolidar documentação similar
- Mover para `docs/` se quiser manter histórico

---

### Arquivos de Banco de Dados Local

- [ ] `dev.db` (SQLite local)
- [ ] `dev.db-journal` (SQLite journal)
- [ ] `*.db` (qualquer arquivo .db)
- [ ] `*.db-journal`

**Ação**: Adicionar ao `.gitignore` e deletar

---

### Arquivos de Log e Cache

- [ ] `*.log`
- [ ] `npm-debug.log*`
- [ ] `yarn-debug.log*`
- [ ] `yarn-error.log*`
- [ ] `.next/` (será recriado no build)
- [ ] `node_modules/` (será recriado no npm install)

**Ação**: Já devem estar no `.gitignore`, mas verificar

---

## 🧹 Código para LIMPAR

### Console.log e Debug

Buscar e remover todos os `console.log` de debug:

```bash
# Buscar console.log
grep -r "console.log" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

**Ação**: 
- Remover `console.log` de debug
- Manter apenas logs importantes (erros críticos)
- Usar sistema de logging adequado (ex: logger.ts)

---

### Código Comentado

Buscar e remover código comentado extenso:

```typescript
// ❌ REMOVER
// const oldFunction = () => {
//   // código antigo
// }

// ✅ MANTER apenas comentários úteis
// Esta função faz X porque Y
```

**Ação**: Revisar e remover código morto

---

### Imports Não Utilizados

```bash
# Verificar com ESLint
npm run lint

# Ou usar ferramenta
npx eslint --fix .
```

**Ação**: Remover imports não utilizados

---

### Variáveis Não Utilizadas

```typescript
// ❌ REMOVER
const unusedVariable = 'test';

// ✅ MANTER apenas o que é usado
```

**Ação**: Remover variáveis não utilizadas

---

## 📝 Arquivos para ATUALIZAR

### .gitignore

Certifique-se de que inclui:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
*.db
*.db-journal

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local
.env.production

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/
*.db
*.db-journal

# Logs
logs/
*.log

# Scripts de desenvolvimento (opcional)
*.bat
```

---

### README.md

Atualizar com:
- [ ] Instruções de instalação atualizadas
- [ ] Link para documentação de produção
- [ ] Remover referências a SQLite (ou marcar como dev only)
- [ ] Adicionar seção de deploy
- [ ] Atualizar variáveis de ambiente

---

### package.json

Verificar:
- [ ] Scripts estão corretos
- [ ] Dependências estão atualizadas
- [ ] Não há dependências desnecessárias
- [ ] Versões estão fixadas (sem `^` ou `~` em produção, ou usar lock file)

```bash
# Verificar dependências não utilizadas
npx depcheck

# Atualizar dependências (cuidado!)
npm outdated
npm update
```

---

## 🔍 Verificações Finais

### Segurança

- [ ] Nenhuma credencial hardcoded no código
- [ ] `.env` não está no Git
- [ ] `.env.production` não está no Git
- [ ] Secrets não estão em logs
- [ ] API keys não estão expostas

### Performance

- [ ] Imagens otimizadas
- [ ] Bundle size verificado
- [ ] Lazy loading implementado
- [ ] Cache configurado

### Qualidade

- [ ] TypeScript sem erros
- [ ] ESLint sem erros críticos
- [ ] Build de produção funciona
- [ ] Testes passando (se houver)

---

## 📋 Script de Limpeza Automática

Crie um script `cleanup.js`:

```javascript
const fs = require('fs');
const path = require('path');

const filesToDelete = [
  'EXECUTAR_AGORA.bat',
  'EXECUTAR_AQUI.bat',
  // ... adicione todos os .bat
  'LOGINS_SENHAS.txt',
  'dev.db',
  'dev.db-journal',
];

filesToDelete.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removido: ${file}`);
  }
});

console.log('✅ Limpeza concluída!');
```

Execute:
```bash
node cleanup.js
```

---

## ✅ Checklist Final de Limpeza

- [ ] Arquivos .bat removidos
- [ ] Documentação consolidada
- [ ] Arquivos com credenciais removidos
- [ ] Arquivos .db removidos
- [ ] console.log removidos
- [ ] Código comentado removido
- [ ] Imports não utilizados removidos
- [ ] Variáveis não utilizadas removidas
- [ ] .gitignore atualizado
- [ ] README.md atualizado
- [ ] package.json verificado
- [ ] Build de produção testado
- [ ] Segurança verificada
- [ ] Performance verificada

---

## 🎯 Resultado Esperado

Após a limpeza, o projeto deve ter:

- ✅ Estrutura limpa e organizada
- ✅ Apenas arquivos necessários
- ✅ Código sem debug
- ✅ Documentação consolidada
- ✅ Pronto para produção

---

**Última atualização**: Janeiro 2026
