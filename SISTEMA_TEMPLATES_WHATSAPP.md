# 📝 Sistema de Gerenciamento de Templates WhatsApp

## ✅ Implementação Completa

Sistema completo para gerenciar templates de mensagens WhatsApp no painel admin, permitindo edição, habilitação/desabilitação e personalização.

---

## 🎯 Funcionalidades Implementadas

### 1. **Modelo de Dados** ✅
- Tabela `WhatsAppTemplate` no Prisma
- Campos: código, nome, descrição, categoria, habilitado, conteúdo, variáveis
- Suporte a templates editáveis e desabilitáveis

### 2. **API de Gerenciamento** ✅
- `GET /api/admin/whatsapp/templates` - Listar templates
- `POST /api/admin/whatsapp/templates` - Criar/atualizar template
- `PUT /api/admin/whatsapp/templates` - Habilitar/desabilitar
- `DELETE /api/admin/whatsapp/templates` - Deletar template
- `POST /api/admin/whatsapp/templates/seed` - Criar templates padrão

### 3. **Página de Gerenciamento** ✅
- Interface completa em `/admin/whatsapp/templates`
- Filtros por categoria (Paciente, Médico, Admin)
- Editor de templates com preview
- Toggle para habilitar/desabilitar
- Botão para restaurar conteúdo padrão

### 4. **Submenu de Navegação** ✅
- Submenu na página WhatsApp
- Abas: "Configurações" e "Templates de Mensagens"
- Navegação intuitiva entre as páginas

### 5. **Sistema de Processamento** ✅
- Função para processar templates com variáveis
- Suporte a variáveis simples: `{{variavel}}`
- Suporte a blocos condicionais: `{{#variavel}}...{{/variavel}}`
- Fallback para templates padrão se não encontrar no banco

---

## 📋 Templates Disponíveis

### Para Pacientes:
1. `CONSULTATION_CONFIRMED` - Confirmação de Consulta
2. `PAYMENT_CONFIRMED` - Confirmação de Pagamento
3. `PRESCRIPTION_ISSUED` - Receita Emitida
4. `RESCHEDULE_INVITE` - Convite para Adiantar

### Para Médicos:
1. `DOCTOR_CONSULTATION_ASSIGNED` - Nova Consulta Designada

### Para Administradores:
1. `ADMIN_CONSULTATION_SCHEDULED` - Nova Consulta Agendada

---

## 🔧 Como Usar

### 1. Criar Templates Padrão

1. Acesse `/admin/whatsapp/templates`
2. Clique em **"Criar Templates Padrão"**
3. Os templates padrão serão criados automaticamente

### 2. Editar um Template

1. Na lista de templates, clique em **"Editar"**
2. Modifique o conteúdo da mensagem
3. Use variáveis como `{{patientName}}`, `{{date}}`, etc.
4. Clique em **"Salvar Template"**

### 3. Habilitar/Desabilitar

1. Use o toggle ao lado de cada template
2. Templates desabilitados não serão enviados
3. Útil para desativar temporariamente um tipo de mensagem

### 4. Restaurar Padrão

1. Ao editar, clique em **"Restaurar Padrão"**
2. O conteúdo volta ao template original

---

## 📝 Formato de Variáveis

### Variáveis Simples:
```
Olá {{patientName}}! Sua consulta foi confirmada.
```

### Blocos Condicionais:
```
{{#meetingLink}}🔗 Link: {{meetingLink}}{{/meetingLink}}
```

Se `meetingLink` existir, mostra o link. Se não, não mostra nada.

---

## 🎨 Interface

### Página de Templates:
- **Cards por categoria** (Paciente, Médico, Admin)
- **Filtros** para ver apenas uma categoria
- **Editor inline** para editar templates
- **Preview** do conteúdo
- **Lista de variáveis** disponíveis

### Submenu:
- **Aba "Configurações"** - Credenciais do Twilio
- **Aba "Templates"** - Gerenciar mensagens

---

## 🔄 Fluxo de Funcionamento

1. **Sistema tenta buscar template do banco**
   - Se encontrado e habilitado → usa do banco
   - Se não encontrado ou desabilitado → usa fallback padrão

2. **Processa variáveis**
   - Substitui `{{variavel}}` pelos valores
   - Processa blocos condicionais

3. **Envia mensagem**
   - Usa o conteúdo processado
   - Salva no histórico

---

## 📊 Próximos Passos

Para completar a implementação:

1. ✅ Executar migração do banco:
   ```bash
   npx prisma db push
   ```

2. ✅ Criar templates padrão:
   - Acessar `/admin/whatsapp/templates`
   - Clicar em "Criar Templates Padrão"

3. ⏳ (Opcional) Adicionar mais templates:
   - Lembrete 24h antes
   - Lembrete 1h antes
   - Lembrete de pagamento

---

## 💡 Vantagens

- ✅ **Flexibilidade**: Editar mensagens sem alterar código
- ✅ **Controle**: Habilitar/desabilitar tipos de mensagens
- ✅ **Personalização**: Adaptar mensagens para sua marca
- ✅ **Histórico**: Templates salvos no banco
- ✅ **Fallback**: Sistema continua funcionando se template não existir

---

**Sistema completo e pronto para uso!** 🚀
