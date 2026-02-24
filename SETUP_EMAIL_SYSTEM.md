# 🚀 Guia de Configuração do Sistema de Emails

## ✅ Passo 1: Executar Migração do Banco de Dados

O sistema agora precisa de uma nova tabela `AccountSetupToken` para gerenciar tokens de conclusão de cadastro.

### Execute no terminal:

```bash
npx prisma db push
```

Ou se preferir criar uma migração nomeada:

```bash
npx prisma migrate dev --name add_account_setup_token
```

Isso criará a tabela `account_setup_tokens` no banco de dados.

---

## ✅ Passo 2: Configurar Provedor de Email (Resend)

1. **Criar conta no Resend**
   - Acesse: https://resend.com/signup
   - Crie uma conta gratuita (3.000 emails/mês)

2. **Obter API Key**
   - No dashboard do Resend, vá em "API Keys"
   - Clique em "Create API Key"
   - Copie a chave (formato: `re_xxxxx`)

3. **Configurar no Admin**
   - Acesse: `http://localhost:3000/admin/email` (ou sua URL de produção)
   - Faça login como ADMIN
   - Ative o provedor "Resend"
   - Preencha:
     - **API Key**: Cole a chave copiada
     - **Email Remetente**: `noreply@seudominio.com` (ou use um email verificado)
     - **Nome Remetente**: `Cannabilize`
     - **Reply-To**: `contato@seudominio.com` (opcional)
   - Clique em "Salvar Configuração"
   - Clique em "Testar Envio" para verificar

---

## ✅ Passo 3: Configurar Cron Jobs (Lembretes Automáticos)

### Opção A: Vercel (Recomendado)

O arquivo `vercel.json` já foi criado com a configuração. Se você estiver usando Vercel:

1. Faça commit e push do `vercel.json`
2. Os cron jobs serão configurados automaticamente
3. **Importante**: Configure a variável de ambiente `CRON_SECRET` no Vercel:
   - Settings → Environment Variables
   - Adicione: `CRON_SECRET` = `sua_chave_secreta_aqui`
   - Use a mesma chave no código (descomente a verificação em `app/api/admin/email/reminders/route.ts`)

### Opção B: GitHub Actions

Se não estiver usando Vercel, crie `.github/workflows/email-reminders.yml`:

```yaml
name: Email Reminders

on:
  schedule:
    - cron: '0 */6 * * *'   # A cada 6 horas (24h antes)
    - cron: '*/30 * * * *'   # A cada 30 minutos (2h antes)
    - cron: '*/15 * * * *'   # A cada 15 minutos (na hora)

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send 24H Reminders
        if: github.event.schedule == '0 */6 * * *'
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/admin/email/reminders?type=24H" \
            -H "x-api-key: ${{ secrets.CRON_SECRET }}"
      
      - name: Send 2H Reminders
        if: github.event.schedule == '*/30 * * * *'
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/admin/email/reminders?type=2H" \
            -H "x-api-key: ${{ secrets.CRON_SECRET }}"
      
      - name: Send NOW Reminders
        if: github.event.schedule == '*/15 * * * *'
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/admin/email/reminders?type=NOW" \
            -H "x-api-key: ${{ secrets.CRON_SECRET }}"
```

Configure os secrets no GitHub:
- `APP_URL`: URL da sua aplicação
- `CRON_SECRET`: Chave secreta para autenticação

### Opção C: Servidor Próprio (cron tradicional)

Adicione ao crontab:

```bash
# Lembretes de 24h (a cada 6 horas)
0 */6 * * * curl -X GET "https://seudominio.com/api/admin/email/reminders?type=24H" -H "x-api-key: SUA_CHAVE"

# Lembretes de 2h (a cada 30 minutos)
*/30 * * * * curl -X GET "https://seudominio.com/api/admin/email/reminders?type=2H" -H "x-api-key: SUA_CHAVE"

# Lembretes na hora (a cada 15 minutos)
*/15 * * * * curl -X GET "https://seudominio.com/api/admin/email/reminders?type=NOW" -H "x-api-key: SUA_CHAVE"
```

---

## ✅ Passo 4: Proteger API de Lembretes (Recomendado)

Edite `app/api/admin/email/reminders/route.ts` e descomente a verificação de API key:

```typescript
// Descomente estas linhas:
const apiKey = request.headers.get('x-api-key');
if (apiKey !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
}
```

Adicione no `.env`:
```
CRON_SECRET=sua_chave_secreta_super_segura_aqui
```

---

## ✅ Passo 5: Testar o Sistema

### 1. Testar Provedor de Email
- Vá em `/admin/email`
- Configure o Resend
- Clique em "Testar Envio"
- Verifique se o email chegou

### 2. Testar Conclusão de Cadastro
1. Agende uma consulta com um email novo
2. Verifique se recebeu 2 emails:
   - Email de boas-vindas
   - Email de conclusão de cadastro (com link)
3. Clique no link "Definir Minha Senha"
4. Defina uma senha na página `/concluir-cadastro`
5. Faça login com email e senha

### 3. Testar Lembretes Manualmente
```bash
# Lembrete de 24h
curl -X GET "http://localhost:3000/api/admin/email/reminders?type=24H"

# Lembrete de 2h
curl -X GET "http://localhost:3000/api/admin/email/reminders?type=2H"

# Lembrete na hora
curl -X GET "http://localhost:3000/api/admin/email/reminders?type=NOW"
```

---

## 📋 Checklist Final

- [ ] Migração do banco executada (`npx prisma db push`)
- [ ] Conta no Resend criada
- [ ] API Key do Resend configurada no admin
- [ ] Teste de envio funcionando
- [ ] Cron jobs configurados (Vercel/GitHub Actions/Servidor)
- [ ] Variável `CRON_SECRET` configurada
- [ ] Proteção da API de lembretes ativada
- [ ] Teste completo do fluxo de conclusão de cadastro realizado

---

## 🎉 Pronto!

Agora seu sistema está completo com:
- ✅ 9 templates de email editáveis
- ✅ Lembretes automáticos (24h, 2h e na hora)
- ✅ Sistema de conclusão de cadastro com tokens seguros
- ✅ Integração com Resend (ou outros provedores)

Para mais detalhes, consulte `EMAIL_SYSTEM_DOCUMENTATION.md`.
