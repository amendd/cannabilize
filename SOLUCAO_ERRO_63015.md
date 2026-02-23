# 🔧 Solução: Erro 63015 - Número Não Está no Sandbox

## 🚨 Erro Identificado

**Erro 63015**: "Channel Sandbox can only send messages to phone numbers that have joined the Sandbox"

## 🔍 Problema

Nos logs do Twilio, vejo que:
- **Mensagem recebida (incoming)**: `+55 7991269833` (11 dígitos)
- **Mensagens enviadas (outgoing)**: `+55 79991269833` (12 dígitos) ❌

**O número que você está testando é diferente do número que está registrado no sandbox!**

---

## ✅ Solução Passo a Passo

### Passo 1: Verificar Número Registrado

1. Acesse: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Na seção **"Participantes do Sandbox"**, veja **exatamente** qual número está listado
3. Anote o número **completo** como aparece lá

### Passo 2: Comparar Números

**Exemplo do problema:**
- Número registrado: `+55 7991269833` (11 dígitos após o código do país)
- Número testado: `+55 79991269833` (12 dígitos após o código do país) ❌

**Os números são diferentes!**

### Passo 3: Usar o Número Correto

1. No campo **"Número para Teste"**, use **exatamente** o número que aparece na lista de participantes
2. **Não adicione ou remova dígitos**
3. Use o formato: `+557991269833` (sem espaços)

### Passo 4: Verificar Formato

O número deve estar no formato:
- ✅ `+557991269833` (sem espaços)
- ❌ `+55 7991269833` (com espaços)
- ❌ `557991269833` (sem `+`)
- ❌ `+55 79 9126-9833` (com formatação)

---

## 🎯 Como Identificar o Número Correto

### No Console do Twilio:

1. Vá para: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Role até **"Participantes do Sandbox"**
3. Você verá algo como:
   ```
   WhatsApp: +557991269833
   ```
4. **Use exatamente esse número** (pode copiar e colar)

### No WhatsApp:

1. Abra a conversa com "Twilio Sandbox"
2. Veja qual número você usou para enviar "join [código]"
3. Esse é o número que está registrado

---

## 🔧 Correção Imediata

1. **Acesse**: `/admin/whatsapp`
2. **No campo "Número para Teste"**, digite o número **exatamente** como aparece na lista de participantes do sandbox
3. **Formato**: `+557991269833` (substitua pelo seu número correto)
4. **Clique em "Testar"**

---

## ⚠️ Problemas Comuns

### Problema 1: Número com DDD diferente

Se você tem dois números:
- Celular 1: `+55 79 9126-9833` → Registrado no sandbox
- Celular 2: `+55 75 9200-1478` → NÃO registrado

**Solução**: Use o número que você registrou (Celular 1)

### Problema 2: Número formatado diferente

- Você registrou: `7991269833` (sem DDD)
- Sistema formata para: `+557991269833` (com DDD)

**Solução**: Use o número completo com código do país: `+557991269833`

### Problema 3: Número de outro país

Se você registrou um número de outro país, use o código do país correto:
- Brasil: `+55`
- EUA: `+1`
- etc.

---

## 📋 Checklist

- [ ] Acessei o Console do Twilio
- [ ] Vi qual número está na lista de participantes
- [ ] Copiei o número exatamente como aparece
- [ ] Usei esse número no campo "Número para Teste"
- [ ] Formato está correto: `+[código][número]` (sem espaços)
- [ ] Testei novamente

---

## 💡 Dica

**O número que você usa no teste DEVE SER EXATAMENTE o mesmo que aparece na lista de participantes do sandbox.**

Se aparecer `+557991269833` na lista, use `+557991269833` no teste (não `+5579991269833`).

---

**Agora o sistema mostra o erro 63015 com instruções específicas. Verifique qual número está registrado e use exatamente esse número!** 🎯
