# Configurar e-mail no domínio cannabilize.com.br

Há duas coisas distintas: **(1)** receber e enviar e-mails como **contato@cannabilize.com.br** (e-mail profissional) e **(2)** a aplicação enviar e-mails (lembretes, confirmações). Este guia foca no **(1)**. O **(2)** você já pode fazer com Gmail/Resend configurados no `.env` ou no painel Admin.

---

## Onde configurar

- **Tela simples (Configurar endereçamento):** o campo **"Servidor de e-mail"** no Registro.br define apenas o **servidor de recebimento (MX)** do domínio raiz. Basta colocar o host do provedor (ex.: ver abaixo).
- **Modo avançado (Zona DNS):** permite definir vários MX, SPF (TXT) e DKIM, recomendado para menos rejeição e spam.

---

## Opção 1: Google Workspace (contato@cannabilize.com.br)

Requer conta paga [Google Workspace](https://workspace.google.com) (ou Google Domains com e-mail). Depois de criar o domínio no Workspace, o Google informa os registros MX.

### Na tela simples do Registro.br

No campo **"Insira o servidor de e-mail"** coloque:

```text
aspmx.l.google.com
```

Isso configura só o MX principal. Para entrega completa, use o **Modo avançado** com os MX oficiais do Google (ver abaixo).

### No Modo avançado (recomendado) – Registro.br

No painel do domínio → **Configurar endereçamento** → **Modo avançado**. Adicione:

**Registros MX (prioridade | servidor):**

| Prioridade | Servidor |
|------------|----------|
| 5 | aspmx.l.google.com |
| 10 | alt1.aspmx.l.google.com |
| 10 | alt2.aspmx.l.google.com |
| 20 | alt3.aspmx.l.google.com |
| 20 | alt4.aspmx.l.google.com |

**Registro TXT (SPF) – ajuda a evitar spam:**

- **Nome:** *(vazio ou @)*  
- **Tipo:** TXT  
- **Valor:** `v=spf1 include:_spf.google.com ~all`

Salve e aguarde a propagação (minutos a algumas horas).

---

## Opção 2: Zoho Mail (grátis até poucos usuários)

[Zoho Mail](https://www.zoho.com/mail/) permite usar o domínio cannabilize.com.br com plano gratuito limitado.

### Na tela simples do Registro.br

No campo **"Insira o servidor de e-mail"**:

```text
mx.zoho.com
```

(Se o Zoho pedir mais de um servidor, use o Modo avançado.)

### No Modo avançado – Registro.br

Depois de criar o domínio no Zoho, ele mostra os MX. Em geral:

| Prioridade | Servidor |
|------------|----------|
| 10 | mx.zoho.com |
| 20 | mx2.zoho.com |

E um registro **TXT** para SPF, algo como:

`v=spf1 include:zoho.com ~all`

Use exatamente o que o painel do Zoho indicar para o seu domínio.

---

## Opção 3: Outro provedor (Hostinger, Locaweb, etc.)

Se o e-mail for gerenciado por outra hospedagem:

1. No painel dessa hospedagem, veja qual é o **servidor de e-mail (MX)** do domínio (ex.: `mail.seudominio.com.br` ou o que eles informarem).
2. No Registro.br, no campo **"Insira o servidor de e-mail"**, coloque esse nome (ex.: `mail.hostinger.com.br` ou o fornecido).
3. Se o provedor der uma lista de MX com prioridades, use o **Modo avançado** e preencha conforme a documentação deles.

---

## Resumo rápido

| Provedor        | Campo "Servidor de e-mail" (tela simples) | Observação |
|-----------------|--------------------------------------------|------------|
| Google Workspace| `aspmx.l.google.com`                       | Melhor usar Modo avançado com todos os MX + SPF |
| Zoho Mail       | `mx.zoho.com`                              | Conferir no Zoho os MX e TXT exatos |
| Outro           | O que o provedor informar (ex.: mail.xxx.com) | Ver documentação do provedor |

---

## E o e-mail que a aplicação envia (lembretes, confirmações)?

A aplicação usa **SMTP** (ex.: Gmail) ou **Resend** configurados no `.env` ou no painel Admin. O remetente pode ser um Gmail (ex.: cannabilizeagora@gmail.com) ou, se quiser **noreply@cannabilize.com.br**:

- **Resend:** adicione o domínio cannabilize.com.br no [Resend](https://resend.com) e inclua no DNS (Registro.br Modo avançado) os registros que o Resend pedir (geralmente TXT e/ou CNAME para verificação e DKIM).
- **SMTP:** pode seguir usando um Gmail/outro SMTP com o remetente que já está no `SMTP_FROM`; não exige alteração de DNS para o domínio.

Ou seja: configurar o **servidor de e-mail** no Registro.br é para **receber e enviar** como **@cannabilize.com.br** (caixa de entrada profissional). O envio automático do sistema pode continuar com a configuração atual ou, se quiser domínio próprio no envio, usar Resend + DNS conforme acima.
