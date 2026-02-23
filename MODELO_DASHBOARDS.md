# 📊 Modelo de Dashboards por Nível de Usuário

## 🎯 Visão Geral

Este documento apresenta o modelo de dashboard diferenciado para cada nível de usuário do sistema CannabiLizi, com layouts, funcionalidades e experiências específicas para cada perfil.

---

## 👑 1. DASHBOARD ADMINISTRADOR

### 🎨 **Design e Layout**
- **Tema:** Profissional, corporativo, com cores mais sóbrias (azul escuro, cinza)
- **Layout:** Grid completo com múltiplas seções visíveis simultaneamente
- **Navegação:** Menu lateral fixo com todas as funcionalidades
- **Foco:** Visão macro do sistema, controle total, métricas e relatórios

### 📋 **Seções Principais**

#### **1.1. Cabeçalho (Header)**
- Nome do administrador
- Notificações em tempo real
- Acesso rápido a configurações
- Botão de logout
- Indicador de status do sistema

#### **1.2. Cards de Métricas Principais (Topo)**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Pacientes  │  Consultas  │   Receitas  │  Receita $  │
│     1.234   │    5.678    │    3.456    │  R$ 450.000 │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### **1.3. Ações Pendentes (Alertas)**
- Consultas aguardando aprovação
- Receitas para emitir
- Autorizações ANVISA pendentes
- Pagamentos pendentes
- Médicos aguardando ativação

#### **1.4. Quick Actions (Acesso Rápido)**
Grid de 9-12 cards grandes com ícones:
- 📅 **Consultas** - Gerenciar agendamentos
- 👨‍⚕️ **Médicos** - Cadastrar/gerenciar médicos
- 💊 **Medicamentos** - Catálogo de medicamentos
- 📋 **ANVISA** - Autorizações e gestão
- 💳 **Pagamentos** - Métodos e integrações
- 📝 **Blog** - Gerenciar posts
- 🖼️ **Galeria** - Eventos e imagens
- ⭐ **Artigos Destaque** - Conteúdo em destaque
- 📹 **Telemedicina** - Zoom/Google Meet
- 📊 **Relatórios** - Exportação de dados
- ⚙️ **Configurações** - Sistema
- 👥 **Usuários** - Gestão de usuários

#### **1.5. Gráficos e Análises**
- Gráfico de consultas (últimos 30 dias)
- Gráfico de receita mensal
- Distribuição de patologias
- Taxa de conversão de consultas
- Performance de médicos

#### **1.6. Tabela de Consultas Recentes**
- Últimas 10-15 consultas
- Filtros rápidos (status, data, médico)
- Ações: Ver detalhes, Editar, Cancelar

#### **1.7. Atividades Recentes (Timeline)**
- Log de ações do sistema
- Últimas alterações
- Notificações importantes

### 🔧 **Funcionalidades Exclusivas do Admin**
- ✅ Acesso a TODAS as consultas do sistema
- ✅ Aprovar/rejeitar autorizações ANVISA
- ✅ Gerenciar médicos (cadastrar, editar, desativar)
- ✅ Configurar integrações (pagamento, telemedicina)
- ✅ Gerenciar conteúdo (blog, galeria, artigos)
- ✅ Exportar relatórios completos
- ✅ Visualizar todas as estatísticas
- ✅ Gerenciar usuários e permissões
- ✅ Configurações gerais do sistema

---

## 👨‍⚕️ 2. DASHBOARD MÉDICO

### 🎨 **Design e Layout**
- **Tema:** Médico, clean, focado em produtividade (verde/azul claro)
- **Layout:** Foco em consultas do dia, menos distrações
- **Navegação:** Menu simplificado com apenas funcionalidades médicas
- **Foco:** Consultas do médico, pacientes atribuídos, produtividade clínica

### 📋 **Seções Principais**

#### **2.1. Cabeçalho (Header)**
- Nome do médico + CRM
- Especialização
- Horário atual
- Próxima consulta (countdown)
- Notificações de consultas

#### **2.2. Cards de Métricas Médicas (Topo)**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Consultas   │ Consultas   │ Receitas    │ Pacientes   │
│    Hoje     │   Semana    │  Emitidas   │  Atendidos  │
│      5      │     12      │     8       │     45      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### **2.3. Consultas de Hoje (Destaque Principal)**
**Layout em Cards Grandes:**
```
┌─────────────────────────────────────────────────────┐
│ 🕐 09:00 - João Silva                               │
│ 📧 joao@email.com | 📱 (11) 99999-9999             │
│ 🏥 Patologia: Dor Crônica                           │
│ [▶️ Iniciar Reunião] [📋 Ver Detalhes] [📄 Receita]│
└─────────────────────────────────────────────────────┘
```
- Lista ordenada por horário
- Status visual (Agendada, Em Andamento, Concluída)
- Botão destacado para iniciar reunião
- Acesso rápido a anamnese

#### **2.4. Próximas Consultas (Próximos 7 dias)**
- Tabela compacta
- Filtro por data
- Visualização de calendário semanal

#### **2.5. Pacientes Recentes**
- Lista dos últimos pacientes atendidos
- Acesso rápido ao histórico
- Link para anamnese completa

#### **2.6. Receitas Pendentes**
- Receitas que precisam ser emitidas
- Acesso rápido ao formulário de receita
- Status de cada receita

#### **2.7. Estatísticas Pessoais**
- Consultas realizadas no mês
- Taxa de conclusão
- Tempo médio de consulta
- Satisfação dos pacientes (se houver)

### 🔧 **Funcionalidades do Médico**
- ✅ Visualizar APENAS suas consultas atribuídas
- ✅ Iniciar reuniões de telemedicina
- ✅ Emitir receitas médicas
- ✅ Gerar laudos médicos
- ✅ Visualizar anamnese dos pacientes
- ✅ Ver histórico de pacientes atribuídos
- ✅ Gerenciar disponibilidade
- ❌ NÃO pode aprovar ANVISA
- ❌ NÃO pode ver todas as consultas
- ❌ NÃO pode gerenciar médicos
- ❌ NÃO pode acessar configurações do sistema

### 🎯 **Diferenças Visuais do Admin**
- Menos cards de ação rápida (apenas consultas, receitas, pacientes)
- Foco maior em consultas do dia
- Layout mais limpo e menos informações
- Cores mais suaves (verde médico)
- Menu lateral mais compacto

---

## 👤 3. DASHBOARD PACIENTE

### 🎨 **Design e Layout**
- **Tema:** Amigável, acolhedor, fácil de usar (cores suaves, roxo/azul claro)
- **Layout:** Cards grandes, espaçados, fácil navegação
- **Navegação:** Menu superior simples ou cards principais
- **Foco:** Informações pessoais, consultas, documentos, pagamentos

### 📋 **Seções Principais**

#### **3.1. Cabeçalho (Header)**
- Nome do paciente
- Foto de perfil (opcional)
- Mensagem de boas-vindas personalizada
- Notificações (consultas próximas, receitas novas)

#### **3.2. Cards Principais (Grid 2x2 ou 4 colunas)**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Minhas     │  Receitas   │ Pagamentos  │ Documentos  │
│ Consultas   │  Médicas    │ Pendentes   │             │
│     5       │     3       │     1       │    Ver      │
│  [Ver Todas]│ [Baixar PDF]│ [Pagar Agora]│ [Acessar]   │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### **3.3. Próxima Consulta (Destaque)**
**Card Grande e Destacado:**
```
┌─────────────────────────────────────────────────────┐
│ 🎯 Sua Próxima Consulta                              │
│                                                      │
│ 📅 15 de Fevereiro de 2026                          │
│ 🕐 14:00                                             │
│ 👨‍⚕️ Dr. João Silva - CRM 123456                     │
│ 🏥 Patologia: Dor Crônica                            │
│                                                      │
│ [📹 Entrar na Reunião] [📋 Ver Detalhes]            │
└─────────────────────────────────────────────────────┘
```

#### **3.4. Histórico de Consultas**
- Lista das últimas consultas
- Status visual (Concluída, Agendada, Cancelada)
- Link para detalhes e documentos

#### **3.5. Receitas Médicas Recentes**
- Cards com data e médico
- Botão para baixar PDF
- Status (Válida, Expirada)

#### **3.6. Pagamentos**
- Pagamentos pendentes (destaque)
- Histórico de pagamentos
- Métodos de pagamento salvos

#### **3.7. Documentos**
- Receitas
- Laudos médicos
- Autorizações ANVISA
- Exames (se houver)

#### **3.8. Informações do Perfil**
- Dados pessoais
- Patologias cadastradas
- Editar perfil

### 🔧 **Funcionalidades do Paciente**
- ✅ Agendar novas consultas
- ✅ Ver suas consultas (passadas e futuras)
- ✅ Baixar receitas em PDF
- ✅ Baixar laudos médicos
- ✅ Ver histórico de pagamentos
- ✅ Realizar pagamentos
- ✅ Acessar links de telemedicina
- ✅ Ver documentos relacionados
- ✅ Editar perfil pessoal
- ❌ NÃO pode emitir receitas
- ❌ NÃO pode ver outras consultas
- ❌ NÃO pode acessar área admin

### 🎯 **Diferenças Visuais dos Outros Dashboards**
- Layout mais espaçado e amigável
- Menos informações técnicas
- Linguagem mais simples
- Cores mais suaves e acolhedoras
- Foco em ações do paciente (agendar, baixar, pagar)
- Menos menus e opções

---

## 📐 Comparação Visual dos Layouts

### **Admin:**
```
┌─────────────────────────────────────────────────────┐
│ [Header com Menu Lateral Fixo]                      │
│ ┌──────┐ ┌─────────────────────────────────────────┐│
│ │ Menu │ │ Cards Métricas (4)                      ││
│ │      │ │ Quick Actions (9-12 cards)              ││
│ │ Fixo │ │ Gráficos (2-3)                          ││
│ │      │ │ Tabela Consultas                        ││
│ │      │ │ Timeline Atividades                     ││
│ └──────┘ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### **Médico:**
```
┌─────────────────────────────────────────────────────┐
│ [Header Simples]                                    │
│ ┌─────────────────────────────────────────────────┐│
│ │ Cards Métricas (4)                               ││
│ │ Consultas de Hoje (Cards Grandes)               ││
│ │ Próximas Consultas (Tabela)                      ││
│ │ Pacientes Recentes                               ││
│ │ Receitas Pendentes                               ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### **Paciente:**
```
┌─────────────────────────────────────────────────────┐
│ [Header Amigável]                                   │
│ ┌─────────────────────────────────────────────────┐│
│ │ Cards Principais (4)                             ││
│ │ Próxima Consulta (Card Destaque)                 ││
│ │ Histórico Consultas                              ││
│ │ Receitas Recentes                                 ││
│ │ Pagamentos                                        ││
│ │ Documentos                                        ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Paleta de Cores Sugerida

### **Admin:**
- Primária: Azul escuro (#1e3a8a)
- Secundária: Cinza (#4b5563)
- Destaque: Amarelo (#f59e0b)
- Background: Cinza claro (#f3f4f6)

### **Médico:**
- Primária: Verde médico (#059669)
- Secundária: Azul claro (#3b82f6)
- Destaque: Branco (#ffffff)
- Background: Verde muito claro (#f0fdf4)

### **Paciente:**
- Primária: Roxo suave (#7c3aed)
- Secundária: Azul claro (#60a5fa)
- Destaque: Rosa suave (#f472b6)
- Background: Branco/Bege claro (#fefefe)

---

## 🚀 Próximos Passos de Implementação

1. **Separar rotas e componentes:**
   - `/admin` - Dashboard admin completo
   - `/medico` - Dashboard médico (já existe, melhorar)
   - `/paciente` - Dashboard paciente (já existe, melhorar)

2. **Criar componentes específicos:**
   - `AdminDashboard.tsx` - Dashboard completo admin
   - `DoctorDashboard.tsx` - Dashboard focado médico
   - `PatientDashboard.tsx` - Dashboard amigável paciente

3. **Implementar layouts diferentes:**
   - `AdminLayout.tsx` - Com menu lateral fixo
   - `DoctorLayout.tsx` - Menu simplificado
   - `PatientLayout.tsx` - Menu superior simples

4. **Ajustar permissões:**
   - Middleware para verificar role
   - Redirecionar para dashboard correto após login
   - Bloquear acesso não autorizado

5. **Melhorar UX:**
   - Animações suaves
   - Loading states
   - Feedback visual
   - Responsividade mobile

---

## 📝 Notas de Implementação

- Cada dashboard deve ter sua própria rota e componente
- Usar condicionais baseadas em `session.user.role`
- Manter consistência visual dentro de cada dashboard
- Garantir que médicos não vejam funcionalidades de admin
- Garantir que pacientes tenham experiência simplificada
- Todos os dashboards devem ser responsivos (mobile-first)
