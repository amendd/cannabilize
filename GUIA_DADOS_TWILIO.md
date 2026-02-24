# 📱 Guia Completo: Como Encontrar os Dados do Twilio

## 🎯 Dados Necessários para Integração

Você precisa de **4 informações principais**:

1. ✅ **Account SID** 
2. ✅ **Auth Token**
3. ✅ **Número do WhatsApp** (Sandbox ou Produção)
4. ✅ **Webhook URL** (para receber status das mensagens)

---

## 📍 PASSO 1: Encontrar Account SID e Auth Token

### Opção A: No Dashboard Principal

1. **No console do Twilio**, clique no **ícone da conta** (canto superior direito)
2. Ou vá para: **https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn**
3. No **painel lateral esquerdo**, procure por:
   - **"Account"** ou **"Painel de controle da conta"**
   - Ou clique no **seu nome de usuário** no topo

4. Você verá uma página com:
   - **Account SID**: Começa com `AC...` (exemplo: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token**: Clique no ícone de **olho** 👁️ para revelar (começa com letras/números aleatórios)

### Opção B: Via URL Direta

Acesse diretamente:
```
https://console.twilio.com/us1/account/keys-credentials/api-keys
```

Ou:
```
https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
```

---

## 📍 PASSO 2: Número do WhatsApp (Sandbox)

### Para TESTES (Sandbox):

Baseado na sua imagem, você já tem:

- **Número do Sandbox**: `+1 415 523 8886`
- **Código de Join**: `join clothing-health`
- **Seu WhatsApp registrado**: `+557592001478`

**Formato para usar no sistema:**
```
whatsapp:+14155238886
```

⚠️ **IMPORTANTE**: 
- O Sandbox só funciona com números que enviaram o código `join clothing-health`
- Para produção, você precisará de um número verificado pelo WhatsApp Business

---

## 📍 PASSO 3: Configurar Webhook URL

### O que é Webhook?

É a URL que o Twilio vai chamar quando:
- Uma mensagem for enviada
- Uma mensagem for entregue
- Uma mensagem for lida
- Ocorrer algum erro

### Como Configurar:

1. **No console do Twilio**, na página que você está:
   - Aba **"Configurações do Sandbox"** (já está aberta)

2. **"Quando uma mensagem chega"**:
   - URL: `https://seu-dominio.com/api/whatsapp/webhook`
   - Método: `POST` (já está configurado)

3. **"URL de retorno de chamada de status"**:
   - URL: `https://seu-dominio.com/api/whatsapp/webhook`
   - Método: `POST`

### Para Desenvolvimento Local:

Se estiver testando localmente, use um túnel como **ngrok**:

```bash
# Instalar ngrok
npm install -g ngrok

# Criar túnel
ngrok http 3000

# Você receberá uma URL como:
# https://abc123.ngrok.io
# Use: https://abc123.ngrok.io/api/whatsapp/webhook
```

---

## 📍 PASSO 4: Configurar no Sistema Cannabilize

### Via Interface Admin:

1. Acesse: **Admin → WhatsApp** (ou `/admin/whatsapp`)
2. Preencha os campos:

```
✅ Habilitar integração WhatsApp: [X]

Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: seu_auth_token_aqui
Número WhatsApp: whatsapp:+14155238886
Webhook URL: https://seu-dominio.com/api/whatsapp/webhook
Número de Teste: +557592001478
```

3. Clique em **"Salvar Configuração"**
4. Clique em **"Testar Conexão"** para verificar

---

## 🔍 Onde Encontrar Cada Dado (Resumo Visual)

```
┌─────────────────────────────────────────┐
│  TWILIO CONSOLE                         │
├─────────────────────────────────────────┤
│                                         │
│  📍 Account SID e Auth Token:          │
│     → Clique no seu nome (topo)        │
│     → Ou: Account → API Keys & Tokens  │
│                                         │
│  📍 Número WhatsApp (Sandbox):         │
│     → Messaging → Try it out           │
│     → Experimente o WhatsApp            │
│     → Número: +1 415 523 8886          │
│                                         │
│  📍 Webhook URL:                       │
│     → Messaging → Try it out           │
│     → Configurações do Sandbox          │
│     → "Quando uma mensagem chega"       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚨 Problemas Comuns

### ❌ "Module not found: Can't resolve 'twilio'"

**Solução**: Já foi corrigido! O sistema agora usa importação dinâmica.

### ❌ "Invalid Account SID"

**Verifique**:
- Account SID começa com `AC`
- Não tem espaços
- Tem 34 caracteres

### ❌ "Auth Token inválido"

**Verifique**:
- Revele o token clicando no ícone de olho 👁️
- Copie completo (sem espaços)
- Não compartilhe publicamente

### ❌ "Número não autorizado" (Sandbox)

**Solução**:
1. Envie `join clothing-health` para `+1 415 523 8886` no WhatsApp
2. Aguarde confirmação
3. Tente novamente

---

## 📝 Checklist de Configuração

- [ ] Account SID copiado do console
- [ ] Auth Token revelado e copiado
- [ ] Número do WhatsApp formatado: `whatsapp:+14155238886`
- [ ] Webhook URL configurada no Twilio
- [ ] Webhook URL configurada no sistema
- [ ] Número de teste adicionado
- [ ] Teste de conexão realizado com sucesso

---

## 🔗 Links Úteis

- **Console Twilio**: https://console.twilio.com
- **Documentação Twilio WhatsApp**: https://www.twilio.com/docs/whatsapp
- **Sandbox Guide**: https://www.twilio.com/docs/whatsapp/sandbox

---

## 💡 Dica Final

**Para Produção**:
- Você precisará solicitar aprovação do WhatsApp Business
- Obter um número verificado
- Configurar templates de mensagem aprovados

**Para Testes**:
- Use o Sandbox (o que você já tem configurado)
- Funciona apenas com números que enviaram o código de join
- Ideal para desenvolvimento e testes

---

## 🎯 Próximos Passos

1. ✅ Encontre Account SID e Auth Token
2. ✅ Configure no sistema (`/admin/whatsapp`)
3. ✅ Teste enviando uma mensagem
4. ✅ Configure webhook para receber status
5. ✅ Teste o fluxo completo

**Precisa de ajuda?** Verifique os logs em `/admin/whatsapp` após testar!
