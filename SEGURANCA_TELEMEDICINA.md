# 🔒 Segurança das Reuniões de Telemedicina

## ✅ Medidas de Segurança Implementadas

### 1. **Unicidade das Reuniões**

Cada reunião é **100% única** e vinculada a uma consulta específica:

- **Zoom**: Cada reunião recebe um `meetingId` único gerado pela API do Zoom
- **Google Meet**: Cada reunião recebe um `requestId` único com timestamp + hash aleatório
- **Vinculação**: Cada reunião está vinculada ao `consultationId` no banco de dados
- **Impossível duplicação**: Mesmo que duas consultas sejam criadas simultaneamente, cada uma terá sua própria reunião única

### 2. **Senhas Obrigatórias (Zoom)**

- ✅ **Sempre gerada**: Toda reunião do Zoom recebe uma senha única de 6 dígitos
- ✅ **Armazenada com segurança**: Senha salva no banco vinculada à consulta
- ✅ **Proteção adicional**: Mesmo que alguém obtenha o link, precisa da senha para entrar

### 3. **Validação de Acesso**

#### Ao Criar Reunião:
- ✅ Verifica se o usuário é médico ou admin
- ✅ Verifica se o médico tem acesso à consulta específica
- ✅ Verifica se o pagamento foi confirmado
- ✅ Impede criação de múltiplas reuniões para a mesma consulta

#### Ao Acessar Link:
- ✅ API de validação: `/api/consultations/[id]/meeting/validate`
- ✅ Verifica se o usuário tem permissão para acessar a consulta
- ✅ Médico só acessa reuniões de suas próprias consultas
- ✅ Paciente só acessa reuniões de suas próprias consultas
- ✅ Admin tem acesso a todas (para suporte)

### 4. **Isolamento de Dados**

- ✅ Cada consulta tem seu próprio `meetingId` único
- ✅ Cada consulta tem seu próprio `meetingLink` único
- ✅ Links não são compartilhados entre consultas
- ✅ Dados da reunião armazenados com `consultationId` para rastreamento

### 5. **Sala de Espera (Zoom)**

- ✅ `waiting_room: true` por padrão
- ✅ Host (médico) precisa aprovar participantes
- ✅ Previne entrada não autorizada mesmo com link e senha

### 6. **Logs de Segurança**

- ✅ Todas as criações de reunião são logadas
- ✅ Registro de `consultationId`, `meetingId`, plataforma
- ✅ Rastreamento de quem criou a reunião

---

## 🛡️ Garantias de Segurança

### ✅ **Cada Reunião é Única**
```typescript
// Zoom: meetingId único por reunião
meetingId: "123456789" // Único para cada reunião criada

// Google Meet: requestId único
requestId: "meet-1738080000000-abc123def456-xyz789" // Único e não repetível
```

### ✅ **Vinculação com Consulta**
```typescript
// Cada reunião está vinculada a uma consulta específica
{
  consultationId: "uuid-consulta-especifica",
  meetingId: "id-unico-reuniao",
  meetingLink: "link-unico-para-esta-consulta",
  meetingPassword: "senha-unica-6-digitos"
}
```

### ✅ **Validação de Acesso**
```typescript
// Antes de exibir o link, valida permissão
if (user.role === 'DOCTOR') {
  // Só vê reuniões de suas consultas
  hasAccess = consultation.doctorId === user.doctorId;
}
if (user.role === 'PATIENT') {
  // Só vê reuniões de suas consultas
  hasAccess = consultation.patientId === user.id;
}
```

---

## 🔐 Fluxo de Segurança

### **Criação de Reunião:**
1. ✅ Médico clica em "Iniciar Reunião"
2. ✅ Sistema valida: médico tem acesso à consulta?
3. ✅ Sistema valida: pagamento confirmado?
4. ✅ Sistema cria reunião única com ID único
5. ✅ Sistema gera senha única (Zoom)
6. ✅ Sistema vincula reunião à consulta no banco
7. ✅ Sistema registra log de segurança

### **Acesso ao Link:**
1. ✅ Usuário clica no link da reunião
2. ✅ Sistema valida: usuário tem permissão?
3. ✅ Sistema verifica: é o médico ou paciente desta consulta?
4. ✅ Sistema permite acesso apenas se autorizado
5. ✅ Link redireciona para plataforma (Zoom/Meet)

---

## ⚠️ Prevenção de Acessos Não Autorizados

### **Cenários Impossíveis:**

1. ❌ **Médico A acessar reunião do Médico B**
   - ✅ **Prevenido**: Validação verifica `doctorId` da consulta

2. ❌ **Paciente A acessar reunião do Paciente B**
   - ✅ **Prevenido**: Validação verifica `patientId` da consulta

3. ❌ **Alguém descobrir link e entrar sem senha (Zoom)**
   - ✅ **Prevenido**: Senha obrigatória + sala de espera

4. ❌ **Reutilizar link de outra consulta**
   - ✅ **Prevenido**: Cada consulta tem link único vinculado

5. ❌ **Criar reunião duplicada**
   - ✅ **Prevenido**: Sistema verifica se já existe reunião

---

## 📊 Estrutura de Dados

### **Consulta no Banco:**
```typescript
{
  id: "uuid-consulta", // Único
  meetingId: "zoom-123456789", // Único por reunião
  meetingLink: "https://zoom.us/j/123456789?pwd=123456", // Único
  meetingPassword: "123456", // Único e seguro
  meetingPlatform: "ZOOM",
  meetingData: {
    consultationId: "uuid-consulta", // Vinculação explícita
    uniqueId: "uuid-consulta-timestamp", // ID único para rastreamento
    startTime: "...",
    endTime: "..."
  }
}
```

---

## ✅ Conclusão

**Cada reunião é única, segura e isolada:**
- ✅ ID único por reunião
- ✅ Link único por consulta
- ✅ Senha única (Zoom)
- ✅ Validação de acesso em múltiplas camadas
- ✅ Isolamento completo entre consultas
- ✅ Logs de segurança para auditoria

**Não há risco de:**
- ❌ Médicos acessarem reuniões de outros médicos
- ❌ Pacientes acessarem reuniões de outros pacientes
- ❌ Acesso não autorizado mesmo com o link
- ❌ Duplicação de reuniões

---

**Última atualização**: Janeiro 2026
