# 🔧 Solução: Erro ao Salvar Configuração WhatsApp

## 🚨 Problema Identificado

O erro "Erro ao salvar configuração" pode ocorrer por alguns motivos:

### Possíveis Causas:

1. **Auth Token mascarado**: Se o token já está salvo e aparece como `••••••••`, você precisa digitar um novo token ou deixar em branco para manter o atual
2. **Campos obrigatórios faltando**: Quando habilitado, Account SID e Número WhatsApp são obrigatórios
3. **Problema no banco de dados**: Tabela não existe ou schema desatualizado
4. **Validação falhando**: Formato incorreto dos dados

---

## ✅ Soluções

### Solução 1: Verificar Auth Token

**Se o Auth Token aparece mascarado (`••••••••`):**

1. **Opção A - Manter o token atual:**
   - Deixe o campo **Auth Token em branco**
   - O sistema manterá o token já salvo

2. **Opção B - Atualizar o token:**
   - Digite o novo Auth Token completo
   - O sistema substituirá o antigo

### Solução 2: Verificar Campos Obrigatórios

Quando **"Habilitar integração WhatsApp"** está marcado, você precisa de:

- ✅ **Account SID**: preenchido (formato AC...)
- ✅ **Auth Token**: Deve estar preenchido OU já salvo anteriormente
- ✅ **Número WhatsApp**: formato `whatsapp:+...`

### Solução 3: Verificar Banco de Dados

Execute no terminal:

```bash
# Verificar se o schema está atualizado
npx prisma db push

# Ou fazer migração
npx prisma migrate dev
```

### Solução 4: Limpar e Reconfigurar

1. **Desmarque** "Habilitar integração WhatsApp"
2. **Salve** a configuração
3. **Preencha todos os campos novamente:**
   - Account SID
   - Auth Token (digite o token completo do painel Twilio)
   - Número WhatsApp
4. **Marque** "Habilitar integração WhatsApp"
5. **Salve** novamente

---

## 🔍 Como Diagnosticar o Erro

### Verificar Console do Navegador

1. Abra o **DevTools** (F12)
2. Vá na aba **Console**
3. Tente salvar novamente
4. Veja se há mensagens de erro específicas

### Verificar Logs do Servidor

No terminal onde o servidor está rodando, você verá mensagens como:

```
Erro ao salvar configuração WhatsApp: [detalhes do erro]
```

---

## 📝 Passo a Passo para Resolver

### 1. Limpar o Campo Auth Token

Se o token está mascarado:

1. **Clique no campo Auth Token**
2. **Apague tudo** (incluindo os dots)
3. **Digite o token completo** (copie do painel Twilio)
4. **Salve**

### 2. Verificar Formato do Número

O número deve estar no formato:
```
whatsapp:+14155238886
```

✅ **Correto**: `whatsapp:+14155238886`
❌ **Incorreto**: `+14155238886` (falta `whatsapp:`)
❌ **Incorreto**: `14155238886` (falta `whatsapp:+`)

### 3. Verificar Webhook URL (Opcional)

Se você não tem um domínio ainda, pode deixar em branco ou usar:

- **Desenvolvimento local**: `http://localhost:3000/api/whatsapp/webhook` (não funcionará, mas não causará erro)
- **Com ngrok**: `https://seu-tunel.ngrok.io/api/whatsapp/webhook`

---

## 🎯 Configuração Correta (Baseada na Sua Imagem)

```
✅ Habilitar integração WhatsApp: [X]

Account SID: (seu SID do Twilio)
Auth Token: (seu token do Twilio)
Número WhatsApp: whatsapp:+...
Webhook URL: (deixe em branco ou configure depois)
Número de Teste: +55...
```

---

## 🚀 Teste Após Salvar

1. Clique em **"Salvar Configuração"**
2. Se salvar com sucesso, clique em **"Testar Conexão"**
3. Você deve receber uma mensagem no WhatsApp `+5579991269833`

---

## 💡 Dica

Se o erro persistir:

1. **Abra o Console do Navegador** (F12)
2. **Tente salvar novamente**
3. **Copie a mensagem de erro completa**
4. **Verifique os logs do servidor** no terminal

Isso ajudará a identificar o problema específico.
