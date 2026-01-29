# 📧 Sistema de Emails Transacionais - Documentação Completa

## 📋 Visão Geral

O sistema de emails transacionais do Click Cannabis foi implementado com suporte completo para:
- ✅ Integração com provedores de email (Resend, SendGrid, AWS SES, SMTP)
- ✅ Templates editáveis pelo admin
- ✅ Envio automático em eventos de negócio
- ✅ Lembretes agendados de consultas

---

## 🎯 Templates de Email Disponíveis

### 1. **ACCOUNT_WELCOME** - Boas-vindas
- **Quando é enviado**: Quando um paciente cria uma conta ou agenda a primeira consulta
- **Variáveis disponíveis**: `{{patientName}}`

### 2. **ACCOUNT_SETUP** - Conclusão de Cadastro
- **Quando é enviado**: Quando um novo paciente é criado (sem senha), para definir senha de acesso
- **Variáveis disponíveis**: `{{patientName}}`, `{{setupUrl}}`
- **Link válido por**: 7 dias

### 3. **CONSULTATION_CONFIRMED** - Confirmação de Consulta
- **Quando é enviado**: Imediatamente após o agendamento da consulta
- **Variáveis disponíveis**: `{{patientName}}`, `{{consultationDateTime}}`, `{{meetingLink}}`

### 4. **CONSULTATION_REMINDER_24H** - Lembrete 24h antes
- **Quando é enviado**: 24 horas antes da consulta (via cron job)
- **Variáveis disponíveis**: `{{patientName}}`, `{{consultationDateTime}}`, `{{meetingLink}}`

### 5. **CONSULTATION_REMINDER_2H** - Lembrete 2h antes
- **Quando é enviado**: 2 horas antes da consulta (via cron job)
- **Variáveis disponíveis**: `{{patientName}}`, `{{consultationDateTime}}`, `{{meetingLink}}`

### 6. **CONSULTATION_REMINDER_NOW** - Lembrete na hora ⭐ NOVO
- **Quando é enviado**: No horário agendado da consulta (via cron job)
- **Variáveis disponíveis**: `{{patientName}}`, `{{consultationDateTime}}`, `{{meetingLink}}`

### 7. **CONSULTATION_FOLLOWUP** - Follow-up Pós-Consulta
- **Quando é enviado**: Após a consulta ser concluída e receita emitida
- **Variáveis disponíveis**: `{{patientName}}`, `{{prescriptionUrl}}`

### 8. **PAYMENT_CONFIRMED** - Confirmação de Pagamento
- **Quando é enviado**: Quando o pagamento é confirmado (webhook do Stripe)
- **Variáveis disponíveis**: `{{patientName}}`, `{{amount}}`, `{{consultationDateTime}}`

### 9. **PRESCRIPTION_ISSUED** - Receita Emitida
- **Quando é enviado**: Quando uma receita médica é emitida
- **Variáveis disponíveis**: `{{patientName}}`, `{{prescriptionUrl}}`

---

## ⚙️ Configuração de Provedor de Email

### Recomendado: Resend

1. **Criar conta no Resend**
   - Acesse: https://resend.com
   - Crie uma conta gratuita (100 emails/dia no plano free)

2. **Obter API Key**
   - Vá em "API Keys" no dashboard
   - Crie uma nova API Key
   - Copie a chave (formato: `re_xxxxx`)

3. **Verificar domínio (opcional, mas recomendado)**
   - Adicione seu domínio no Resend
   - Configure os registros DNS conforme instruções
   - Isso melhora a entregabilidade dos emails

4. **Configurar no Admin**
   - Acesse: `/admin/email`
   - Ative o provedor "Resend"
   - Preencha:
     - **API Key**: `re_xxxxx` (sua chave)
     - **Email Remetente**: `noreply@seudominio.com` (ou o email verificado)
     - **Nome Remetente**: `Click Cannabis`
     - **Reply-To**: `contato@seudominio.com` (opcional)
   - Clique em "Salvar Configuração"
   - Teste o envio com o botão "Testar Envio"

---

## 📝 Edição de Templates

1. **Acesse o painel admin**: `/admin/email`
2. **Role até a seção "Modelos de Emails Transacionais"**
3. **Edite os templates**:
   - Clique em qualquer template para expandir
   - Edite o **Assunto** e o **HTML**
   - Use as variáveis disponíveis: `{{variavel}}`
   - Use blocos condicionais: `{{#if variavel}} ... {{/if}}`
4. **Salve**: Clique em "Salvar modelos" no topo da seção
5. **Restaurar padrão**: Use o botão "Restaurar padrão" em qualquer template

### Exemplo de Template com Variáveis

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Olá {{patientName}}!</h2>
  <p>Sua consulta é em: {{consultationDateTime}}</p>
  {{#if meetingLink}}
    <p>Link: <a href="{{meetingLink}}">{{meetingLink}}</a></p>
  {{/if}}
</div>
```

---

## ⏰ Configuração de Lembretes Automáticos (Cron Jobs)

Os lembretes de consulta precisam ser executados periodicamente via cron job.

### Opção 1: Vercel Cron (Recomendado para Vercel)

1. **Criar arquivo `vercel.json`** na raiz do projeto:

```json
{
  "crons": [
    {
      "path": "/api/admin/email/reminders?type=24H",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/admin/email/reminders?type=2H",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/admin/email/reminders?type=NOW",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Explicação dos schedules:**
- `0 */6 * * *` = A cada 6 horas (para lembretes de 24h)
- `*/30 * * * *` = A cada 30 minutos (para lembretes de 2h)
- `*/15 * * * *` = A cada 15 minutos (para lembretes na hora)

2. **Proteger com API Key** (recomendado):

Edite `app/api/admin/email/reminders/route.ts` e descomente a verificação de API key:

```typescript
const apiKey = request.headers.get('x-api-key');
if (apiKey !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
}
```

Adicione no `.env`:
```
CRON_SECRET=sua_chave_secreta_aqui
```

Configure no Vercel:
- Settings > Environment Variables
- Adicione `CRON_SECRET` com o mesmo valor

### Opção 2: GitHub Actions (Para qualquer hospedagem)

Crie `.github/workflows/email-reminders.yml`:

```yaml
name: Email Reminders

on:
  schedule:
    - cron: '0 */6 * * *'  # A cada 6 horas
    - cron: '*/30 * * * *'  # A cada 30 minutos

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
```

Configure os secrets no GitHub:
- `APP_URL`: URL da sua aplicação (ex: `https://clickcannabis.com`)
- `CRON_SECRET`: Mesma chave usada no `.env`

### Opção 3: Servidor próprio (cron tradicional)

Adicione ao crontab do servidor:

```bash
# Lembretes de 24h (a cada 6 horas)
0 */6 * * * curl -X GET "https://seudominio.com/api/admin/email/reminders?type=24H" -H "x-api-key: SUA_CHAVE"

# Lembretes de 2h (a cada 30 minutos)
*/30 * * * * curl -X GET "https://seudominio.com/api/admin/email/reminders?type=2H" -H "x-api-key: SUA_CHAVE"
```

---

## 🔍 Testando o Sistema

### 1. Testar Provedor de Email
- Vá em `/admin/email`
- Configure o Resend
- Use o botão "Testar Envio"
- Verifique se o email chegou na caixa de entrada

### 2. Testar Templates
- Edite um template no admin
- Salve
- Dispare o evento correspondente (ex: agende uma consulta)
- Verifique se o email foi enviado com o template editado

### 3. Testar Lembretes Manualmente
```bash
# Lembrete de 24h
curl -X GET "http://localhost:3000/api/admin/email/reminders?type=24H"

# Lembrete de 2h
curl -X GET "http://localhost:3000/api/admin/email/reminders?type=2H"

# Lembrete na hora
curl -X GET "http://localhost:3000/api/admin/email/reminders?type=NOW"
```

### 4. Testar Conclusão de Cadastro
1. Agende uma consulta com um email novo
2. Verifique se o email de conclusão de cadastro foi enviado
3. Clique no link do email
4. Defina uma senha na página `/concluir-cadastro`
5. Faça login com o email e senha definida

---

## 📊 Fluxo de Emails por Evento

### Cadastro de Paciente
1. Paciente agenda primeira consulta
2. Sistema cria conta automaticamente (sem senha)
3. **Email enviado**: `ACCOUNT_WELCOME`
4. **Email enviado**: `ACCOUNT_SETUP` (com link para definir senha)
5. Paciente clica no link e define senha em `/concluir-cadastro`

### Agendamento de Consulta
1. Paciente agenda consulta
2. Sistema cria consulta e pagamento pendente
3. **Email enviado**: `CONSULTATION_CONFIRMED`

### Confirmação de Pagamento
1. Webhook do Stripe confirma pagamento
2. Sistema atualiza status do pagamento
3. **Email enviado**: `PAYMENT_CONFIRMED`

### Lembretes de Consulta
1. Cron job executa periodicamente
2. Sistema busca consultas próximas (24h, 2h ou na hora)
3. **Email enviado**: 
   - `CONSULTATION_REMINDER_24H` (24h antes)
   - `CONSULTATION_REMINDER_2H` (2h antes)
   - `CONSULTATION_REMINDER_NOW` (na hora agendada)

### Emissão de Receita
1. Médico emite receita
2. Sistema gera PDF e atualiza consulta
3. **Email enviado**: `PRESCRIPTION_ISSUED`
4. **Email enviado**: `CONSULTATION_FOLLOWUP` (algumas horas depois)

---

## 🛠️ Troubleshooting

### Emails não estão sendo enviados
1. Verifique se um provedor está habilitado em `/admin/email`
2. Verifique se a API Key está correta
3. Verifique os logs do console para erros
4. Teste o envio manualmente pelo botão "Testar Envio"

### Lembretes não estão sendo enviados
1. Verifique se o cron job está configurado corretamente
2. Verifique os logs do cron job
3. Teste manualmente via curl (veja seção "Testando o Sistema")
4. Verifique se há consultas agendadas no período correto

### Templates não estão sendo salvos
1. Verifique se você está logado como ADMIN
2. Verifique o console do navegador para erros
3. Verifique os logs do servidor

---

## 📚 Referências

- **Resend**: https://resend.com/docs
- **Vercel Cron**: https://vercel.com/docs/cron-jobs
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Última atualização**: Janeiro 2026
