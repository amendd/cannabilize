# Análise: Email de teste não recebido

## Problema

O usuário desativou o redirecionamento, reenviou o teste de modelo de email e recebeu mensagem de sucesso na tela, mas **não recebeu o email** na caixa de entrada.

## Causas identificadas

### 1. **Sucesso falso (principal)**

O código **não enviava** o email em vários casos, mas **não lançava erro** — a API retornava 200 e a tela mostrava "sucesso":

- **Nenhum provedor habilitado** (sem config no banco e sem variáveis SMTP no `.env`): o sistema apenas logava no console e retornava.
- **Resend habilitado sem API Key**: prioridade era Resend antes de SMTP; se Resend estava habilitado mas sem chave, o código desistia e retornava sem enviar.
- **SMTP habilitado sem credenciais completas** (host, usuário ou senha faltando): retornava sem enviar.
- **Provedor não implementado** (ex.: SENDGRID): retornava sem enviar.

Ou seja: em todos esses casos a aplicação dizia "sucesso" mas **nenhum email era enviado**.

### 2. **Prioridade do provedor**

A ordem de escolha era: **RESEND → SENDGRID → AWS_SES → SMTP**.  
Se Resend estivesse **habilitado** (mesmo sem API Key configurada), o sistema escolhia Resend, falhava silenciosamente e **nunca tentava o SMTP** (Gmail), que estava configurado e funcionando.

### 3. **Falta de diagnóstico**

Não havia como o usuário ou o admin ver qual provedor estava ativo e se tinha credenciais válidas, nem mensagens de erro quando o envio não acontecia.

---

## Correções implementadas

### 1. **Erro quando o email não é enviado**

- Se **não houver** provedor habilitado ou credenciais: o sistema **lança erro** com mensagem clara.
- A API retorna **500** e a tela mostra o erro (ex.: "Resend está habilitado mas a chave da API não está configurada. Desative o Resend ou configure a chave...").
- Assim não há mais "sucesso" quando nenhum email foi enviado.

### 2. **Prioridade por provedor com credenciais**

- A escolha do provedor passou a **priorizar quem tem credenciais completas**:
  - Resend: precisa de API Key.
  - SMTP: precisa de host, usuário e senha.
- Ordem efetiva: primeiro **Resend com API Key**, depois **SMTP com host+usuário+senha**, etc.
- Se você tem **apenas SMTP (Gmail)** configurado e habilitado, ele será usado.  
  Se Resend estiver habilitado **sem** chave, o sistema agora tenta SMTP (se tiver credenciais) em vez de “desistir” e retornar sucesso sem enviar.

### 3. **Rota de diagnóstico e bloco "Status do envio"**

- **GET `/api/admin/email/status`**: retorna se há provedor ativo, qual é, se tem credenciais e se há redirecionamento.
- Na página **Admin → Email** foi adicionado o bloco **"Status do envio"**:
  - Verde: provedor ativo com credenciais; emails serão enviados.
  - Amarelo: provedor habilitado mas credenciais incompletas (com mensagem orientando o que preencher).

---

## O que fazer agora

1. **Recarregue a página** Admin → Email (F5).
2. **Veja o bloco "Status do envio"** no topo:
   - Se estiver **verde** e "Provedor ativo: SMTP", o envio está ok; tente **Enviar teste** de um modelo de novo.
   - Se estiver **amarelo**, a mensagem dirá o que falta (ex.: preencher host, usuário e senha do SMTP).
3. **Se Resend estiver habilitado e você só usa Gmail (SMTP)**:
   - Desative o Resend (deixe o toggle desligado) e mantenha **apenas SMTP** habilitado com host, porta, usuário e senha de app preenchidos e salvos.
4. **Envie um teste de modelo** de novo:
   - Se **der erro** na tela, a mensagem deve explicar o motivo (ex.: credenciais faltando).
   - Se **der sucesso**, o email deve ser enviado de fato; verifique a caixa de entrada e o **spam** do endereço que você colocou em "Email para receber testes dos modelos".

Se ainda não receber após o status estar verde e o sucesso aparecer na tela, verifique:
- Spam / lixo eletrônico.
- O endereço em "Email para receber testes dos modelos" (ou o "Email para Teste" do SMTP, se esse campo estiver vazio).
- No terminal do servidor (onde roda `npm run dev`), deve aparecer algo como `[EMAIL] Enviando via SMTP: { from, to }` quando o envio for feito.
