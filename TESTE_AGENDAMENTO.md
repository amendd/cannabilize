# 🧪 Como Testar o Agendamento

## ✅ Correções Aplicadas

1. **API de Consultas Corrigida:**
   - ✅ Campo `anamnesis` convertido para string JSON
   - ✅ Campo `amount` usando Float (50.0)
   - ✅ Validação melhorada
   - ✅ Mensagens de erro detalhadas

2. **Formulário Melhorado:**
   - ✅ Tratamento de erros mais robusto
   - ✅ Mensagens específicas por tipo de erro
   - ✅ Logs detalhados para debug

---

## 🧪 Passo a Passo para Testar

### **1. Iniciar o Servidor**
```bash
# Na pasta: C:\Users\Gabriel\clickcannabis-replica
Duplo clique em: EXECUTAR_CMD.bat
```

Aguarde aparecer: `Local: http://localhost:3001`

---

### **2. Acessar Página de Agendamento**
Abra o navegador em: http://localhost:3001/agendamento

---

### **3. Preencher o Formulário**

#### **Dados Pessoais:**
- Nome Completo: `João Silva`
- Email: `joao@exemplo.com`
- Telefone: `(21) 99999-9999`
- CPF: `123.456.789-00`
- Data de Nascimento: `01/01/1990`

#### **Patologias:**
- Selecione pelo menos uma patologia (ex: Ansiedade, Depressão)

#### **Data e Horário:**
- Data: Escolha uma data futura
- Horário: Escolha um horário disponível

#### **Anamnese (Opcional):**
- Pode deixar em branco ou preencher

---

### **4. Confirmar Agendamento**
Clique em: **"Confirmar Agendamento"**

---

## ✅ Resultado Esperado

Se tudo estiver funcionando:
1. ✅ Mensagem de sucesso: "Consulta agendada com sucesso!"
2. ✅ Redirecionamento para página de pagamento
3. ✅ Consulta aparece no admin

---

## 🔍 Verificar no Admin

1. Faça login como admin:
   - Email: `admin@clickcannabis.com`
   - Senha: `admin123`

2. Acesse: http://localhost:3001/admin

3. Veja a consulta em:
   - "Consultas Recentes" (no dashboard)
   - `/admin/consultas` (lista completa)

---

## 🐛 Se Ainda Houver Erro

### **1. Verificar Console do Navegador:**
- Pressione F12
- Vá na aba "Console"
- Veja se há erros em vermelho
- Anote a mensagem de erro

### **2. Verificar Logs do Servidor:**
- Olhe o terminal onde está rodando o servidor
- Veja se há erros em vermelho
- Anote a mensagem de erro

### **3. Erros Comuns:**

#### **Erro: "Dados inválidos"**
- Verifique se todos os campos obrigatórios estão preenchidos
- Verifique se a data é futura
- Verifique se selecionou pelo menos uma patologia

#### **Erro: "Erro ao agendar consulta"**
- Verifique se o servidor está rodando
- Verifique se o banco de dados está configurado
- Verifique os logs do servidor

#### **Erro: "Erro desconhecido"**
- Verifique a conexão com internet
- Verifique se o servidor está acessível
- Verifique os logs do servidor

---

## 📋 Checklist de Verificação

Antes de testar, verifique:

- [ ] Servidor está rodando? (terminal aberto com "Local: http://localhost:3001")
- [ ] Banco de dados está configurado? (`npx prisma db push`)
- [ ] Prisma Client está gerado? (`npx prisma generate`)
- [ ] Todos os campos obrigatórios estão preenchidos?
- [ ] Data escolhida é futura?
- [ ] Pelo menos uma patologia selecionada?

---

## 🆘 Se Precisar de Ajuda

Envie:
1. Screenshot do erro
2. Mensagem de erro completa
3. Logs do console (F12 → Console)
4. Logs do servidor (terminal)

---

**Teste agora e me diga se funcionou!** 🚀
