# 🎫 Sistema de Carteirinha Digital - CannabiLizi

## 📋 Visão Geral

Sistema completo de carteirinha digital para pacientes medicinais, que é emitida automaticamente quando o paciente possui uma receita médica ativa. A carteirinha contém informações pessoais do paciente e um QR code que permite verificar a receita médica.

## ✨ Funcionalidades Implementadas

### 1. **Modelo de Dados (Prisma)**
- ✅ Modelo `PatientCard` no schema Prisma
- ✅ Relacionamento com `User` (paciente) e `Prescription` (receita ativa)
- ✅ Campos: número da carteirinha, QR code, data de emissão, validade, status

### 2. **Geração de QR Code**
- ✅ Biblioteca `qrcode` instalada
- ✅ Função para gerar QR code em base64
- ✅ QR code aponta para URL pública da receita (`/receita/[id]`)

### 3. **APIs Implementadas**

#### `/api/patient-card` (GET)
- Busca a carteirinha do paciente logado
- Admins podem buscar carteirinhas de outros pacientes

#### `/api/patient-card` (POST)
- Gera ou atualiza a carteirinha do paciente
- Requer uma receita ativa para gerar

#### `/api/patient-card/[id]` (GET)
- Busca carteirinha por ID (público, para validação)

#### `/api/prescriptions/public/[id]` (GET)
- Busca receita pública por ID (usado pelo QR code)
- Verifica validade e status da receita

### 4. **Páginas Implementadas**

#### `/paciente/carteirinha`
- Visualização completa da carteirinha digital
- Exibe informações do paciente
- Mostra receita ativa vinculada
- QR code para download
- Design moderno e responsivo

#### `/receita/[id]`
- Página pública para visualizar receita via QR code
- Verificação de validade
- Informações completas da receita e medicamentos
- Design profissional para apresentação

### 5. **Integração Automática**

A carteirinha é gerada/atualizada automaticamente em:

1. **Quando uma receita é criada** (`/api/prescriptions` POST)
   - Após o médico emitir uma receita
   - Vincula automaticamente a receita à carteirinha

2. **Quando um pagamento é confirmado**
   - Webhook do Stripe (`/api/payments/webhook`)
   - Atualização manual de pagamento (`/api/payments/[id]` PATCH)
   - Garante que a carteirinha esteja atualizada após compra

### 6. **Dashboard do Paciente**
- ✅ Card de acesso rápido para "Carteirinha Digital"
- ✅ Link direto para `/paciente/carteirinha`

## 🔄 Fluxo de Uso

1. **Paciente agenda consulta** → Consulta criada
2. **Médico emite receita** → Receita criada → **Carteirinha gerada automaticamente**
3. **Paciente acessa `/paciente/carteirinha`** → Visualiza carteirinha com QR code
4. **Paciente apresenta QR code em farmácia** → Escaneia o código
5. **Farmácia acessa `/receita/[id]`** → Verifica receita e validade

## 📦 Estrutura de Arquivos

```
lib/
  └── patient-card.ts          # Funções para gerar QR code e carteirinha

app/
  ├── api/
  │   ├── patient-card/
  │   │   ├── route.ts        # GET/POST carteirinha
  │   │   └── [id]/route.ts   # GET carteirinha por ID
  │   └── prescriptions/
  │       └── public/
  │           └── [id]/route.ts # GET receita pública
  ├── paciente/
  │   ├── carteirinha/
  │   │   └── page.tsx        # Página de visualização
  │   └── page.tsx            # Dashboard (atualizado)
  └── receita/
      └── [id]/
          └── page.tsx        # Página pública da receita
```

## 🗄️ Schema do Banco de Dados

```prisma
model PatientCard {
  id                    String   @id @default(uuid())
  patientId             String   @unique
  cardNumber            String   @unique
  qrCodeUrl             String?
  qrCodeData            String?
  activePrescriptionId  String?
  issuedAt              DateTime @default(now())
  expiresAt             DateTime?
  status                String   @default("ACTIVE")
  // ...
}
```

## 🚀 Como Usar

### 1. Atualizar o Banco de Dados

```bash
npx prisma generate
npx prisma db push
```

### 2. Acessar a Carteirinha

- **Paciente**: Acesse `/paciente/carteirinha` após ter uma receita ativa
- **Admin/Médico**: Pode gerar carteirinhas manualmente via API

### 3. Verificar Receita via QR Code

- Escaneie o QR code da carteirinha
- Será redirecionado para `/receita/[prescriptionId]`
- Página pública mostra todos os detalhes da receita

## 🔐 Segurança

- ✅ Carteirinha só é gerada para pacientes autenticados
- ✅ QR code aponta para receita pública, mas valida status e validade
- ✅ Receitas expiradas são claramente marcadas
- ✅ Verificação de propriedade (paciente só vê sua própria carteirinha)

## 📱 Design

- Interface moderna e responsiva
- Cores alinhadas com a identidade visual (verde/esmeralda)
- QR code destacado e fácil de escanear
- Informações organizadas e fáceis de ler

## 🔄 Próximos Passos (Opcional)

- [ ] Adicionar validação de QR code com assinatura digital
- [ ] Implementar histórico de carteirinhas
- [ ] Adicionar notificações quando carteirinha expirar
- [ ] Exportar carteirinha como PDF
- [ ] Integração com app mobile para carteirinha no celular
