# 🎫 Gestão de Carteirinhas Digitais - Admin

## 📋 Visão Geral

Sistema de aprovação manual de carteirinhas digitais pelo administrador. As carteirinhas só são geradas após aprovação do admin e compra do medicamento pelo paciente.

## ✨ Funcionalidades Implementadas

### 1. **Modelo de Dados Atualizado**
- ✅ Status de aprovação: `PENDING`, `APPROVED`, `REJECTED`
- ✅ Campos adicionais:
  - `approvalStatus` - Status da aprovação
  - `approvedBy` - ID do admin que aprovou
  - `approvedAt` - Data de aprovação
  - `rejectionReason` - Motivo da rejeição

### 2. **Fluxo de Aprovação**

#### Antes (Automático):
1. Receita emitida → Carteirinha gerada automaticamente

#### Agora (Manual):
1. Receita emitida → **Solicitação de carteirinha criada (PENDING)**
2. Paciente compra medicamento → Solicitação permanece PENDING
3. **Admin aprova no dashboard** → Carteirinha gerada (APPROVED)
4. Paciente pode visualizar sua carteirinha

### 3. **APIs Implementadas**

#### `/api/admin/patient-cards` (GET)
- Lista todas as carteirinhas
- Filtros: `status`, `approvalStatus`
- Apenas para ADMIN

#### `/api/admin/patient-cards/[id]/approve` (POST)
- Aprova e gera a carteirinha
- Gera QR code e número da carteirinha
- Atualiza status para APPROVED

#### `/api/admin/patient-cards/[id]/reject` (POST)
- Rejeita a solicitação
- Permite adicionar motivo da rejeição
- Atualiza status para REJECTED

### 4. **Página de Gestão Admin**

#### `/admin/carteirinhas`
- Lista todas as solicitações de carteirinhas
- Filtros por status (Todas, Pendentes, Aprovadas, Rejeitadas)
- Busca por nome, email, CPF ou número da carteirinha
- Estatísticas: Total, Pendentes, Aprovadas, Rejeitadas
- Ações: Aprovar ou Rejeitar (apenas para pendentes)

### 5. **Dashboard Admin Atualizado**
- ✅ Card de "Carteirinhas Pendentes" nas ações pendentes
- ✅ Link direto para `/admin/carteirinhas?approvalStatus=PENDING`
- ✅ Contador de carteirinhas pendentes
- ✅ Item no menu lateral: "Carteirinhas"

### 6. **Página do Paciente Atualizada**
- ✅ Mostra mensagem quando carteirinha está pendente
- ✅ Mostra mensagem quando carteirinha foi rejeitada
- ✅ Informa que aguarda aprovação do admin

## 🔄 Fluxo Completo

```
1. Médico emite receita
   ↓
2. Sistema cria solicitação de carteirinha (PENDING)
   ↓
3. Paciente compra medicamento (pagamento confirmado)
   ↓
4. Solicitação permanece PENDING (aguardando aprovação)
   ↓
5. Admin acessa /admin/carteirinhas
   ↓
6. Admin visualiza solicitação pendente
   ↓
7. Admin aprova → Carteirinha gerada (QR code, número, etc)
   ↓
8. Paciente pode visualizar sua carteirinha em /paciente/carteirinha
```

## 📊 Status da Carteirinha

- **PENDING**: Aguardando aprovação do admin
- **APPROVED**: Aprovada e gerada (ativa)
- **REJECTED**: Rejeitada pelo admin

## 🎯 Como Usar (Admin)

1. Acesse `/admin/carteirinhas`
2. Veja as solicitações pendentes
3. Clique em "Aprovar" para gerar a carteirinha
4. Ou clique em "Rejeitar" e informe o motivo

## 🔐 Segurança

- ✅ Apenas ADMIN pode aprovar/rejeitar carteirinhas
- ✅ Paciente só vê sua própria carteirinha (se aprovada)
- ✅ Carteirinhas pendentes não são visíveis para pacientes
- ✅ Histórico de aprovação (quem aprovou e quando)

## 📝 Notas Importantes

- A carteirinha **NÃO** é gerada automaticamente mais
- Requer aprovação manual do admin
- A aprovação deve ser feita após confirmação da compra do medicamento
- O admin pode rejeitar com motivo específico
