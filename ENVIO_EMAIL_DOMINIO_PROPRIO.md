# Fazer todos os disparos de e-mail saírem com seu domínio

Todos os e-mails da plataforma (confirmação de consulta, lembretes, recuperação de senha, etc.) podem sair com remetente **@seudominio.com.br** (ex.: `noreply@cannabilize.com.br` ou `Cannabilize <noreply@cannabilize.com.br>`). Há duas formas principais.

---

## Opção 1: Resend (recomendado)

O Resend permite enviar em nome do seu domínio depois que você **verifica o domínio** no painel deles e adiciona os registros DNS.

### Passo 1 – Adicionar o domínio no Resend

1. Acesse [Resend → Domains](https://resend.com/domains).
2. Clique em **Add Domain** e informe o domínio (ex.: `cannabilize.com.br`).
3. O Resend vai mostrar os **registros DNS** que você precisa criar (geralmente um TXT de verificação e registros para DKIM).

### Passo 2 – Configurar o DNS (Registro.br ou onde estiver o DNS)

No painel do seu domínio (ex.: Registro.br → **Configurar endereçamento** → **Modo avançado**), crie exatamente os registros que o Resend pedir, por exemplo:

- **Tipo TXT** – verificação do domínio (nome e valor que o Resend indicar).
- **Tipo CNAME** (se houver) – para DKIM (ex.: algo como `resend._domainkey` apontando para o valor que o Resend mostrar).

Aguarde a propagação (minutos a algumas horas). No Resend, use **Verify** até o domínio aparecer como verificado.

### Passo 3 – Configurar na plataforma (Admin → Email)

1. Em **Admin → Email**, habilite o provedor **Resend**.
2. Preencha a **API Key** do Resend.
3. **Email Remetente:** use um endereço do seu domínio, por exemplo:
   - `noreply@cannabilize.com.br`
4. **Nome Remetente:** por exemplo `Cannabilize`.
5. **Domínio Verificado:** informe **só o domínio**, sem `http://` nem `www`, por exemplo:
   - `cannabilize.com.br`

**Importante:** se **Domínio Verificado** não for preenchido, a aplicação usa o domínio de teste do Resend (`onboarding@resend.dev`) e os e-mails **não** saem com @cannabilize.com.br. Sempre preencha **Email Remetente** e **Domínio Verificado** quando quiser usar o domínio próprio.

6. **Email para Resposta (Reply-To):** opcional; ex.: `contato@cannabilize.com.br` para as respostas caírem na caixa de entrada da clínica.
7. Salve e use **Enviar e-mail de teste** para confirmar.

Depois disso, **todos** os disparos (confirmação, lembretes, recuperação de senha, etc.) passam a sair com o remetente configurado (@seudominio.com.br).

---

## Opção 2: SMTP com domínio próprio

Para o remetente ser **@seudominio.com.br**, o **servidor SMTP** precisa estar autorizado a enviar por esse domínio. Ou seja, você usa um provedor que já gerencia o e-mail do domínio.

### Cenário A – Google Workspace com o domínio

Se o e-mail da clínica é Google Workspace com @cannabilize.com.br:

1. No Google Admin, o envio por SMTP já está autorizado para contas do domínio.
2. Crie (se quiser) um usuário tipo `noreply@cannabilize.com.br` ou use um existente.
3. Gere uma **senha de aplicativo** para esse usuário (Conta Google → Segurança → Senhas de app).
4. Na plataforma:
   - **Admin → Email:** habilite **SMTP**, preencha host `smtp.gmail.com`, porta `587`, usuário e senha de app.
   - **Email Remetente:** `noreply@cannabilize.com.br` (ou o e-mail do Workspace que estiver usando).
   - **Nome Remetente:** `Cannabilize`.

Ou, se usar só variáveis de ambiente (sem config no Admin), no `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@cannabilize.com.br
SMTP_PASS=senha-de-app-16-caracteres
SMTP_FROM="Cannabilize <noreply@cannabilize.com.br>"
SMTP_REPLY_TO=contato@cannabilize.com.br
```

### Cenário B – Zoho Mail (ou outro) com o domínio

Se o e-mail do domínio está no Zoho (ou em outro provedor):

1. Use o host SMTP que o provedor indicar (ex.: Zoho: `smtp.zoho.com`, porta `587`).
2. Use usuário e senha de uma conta **@cannabilize.com.br** (ou a que o provedor permitir para envio).
3. Em **Admin → Email** (SMTP) ou no `.env`:
   - **Email Remetente** / **SMTP_FROM:** `noreply@cannabilize.com.br` (ou outro endereço do domínio que o provedor permitir).
   - **Nome Remetente:** `Cannabilize`.

Assim, todos os disparos saem com o domínio próprio.

---

## Resumo

| Objetivo                         | O que fazer |
|----------------------------------|-------------|
| Enviar como **@seudominio.com.br** com **Resend** | Verificar o domínio no Resend, configurar DNS, e em Admin → Email preencher **Email Remetente** (ex.: noreply@…) e **Domínio Verificado** (ex.: cannabilize.com.br). |
| Enviar como **@seudominio.com.br** com **SMTP**   | Usar um servidor SMTP que já envie por esse domínio (Google Workspace, Zoho, etc.) e configurar **Email Remetente** / **SMTP_FROM** com esse endereço. |

Depois de configurado, **todos** os e-mails enviados pela aplicação (confirmações, lembretes, recuperação de senha, receita, pagamento, etc.) passam a sair com o domínio configurado.
