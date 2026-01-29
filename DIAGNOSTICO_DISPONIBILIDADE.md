# 🔍 Diagnóstico de Disponibilidade de Agendamentos

## ✅ Correções Realizadas

### 1. **Erro `Cannot read properties of undefined (reading 'parent')`**
- **Problema:** Validação do Zod tentava acessar `ctx.parent` que estava undefined
- **Solução:** Movida validação para nível do objeto usando `.refine()` no schema completo
- **Arquivo:** `components/consultation/AppointmentForm.tsx`

### 2. **Melhorias no Tratamento de Erros**
- Adicionada verificação de existência de `data.slots` antes de processar
- Melhorado tratamento de erros na função `fetchAvailableSlots`
- Adicionado try-catch em funções críticas
- Mensagens de erro mais informativas

### 3. **Mensagens de Erro Melhoradas**
- Mensagem mais clara quando não há horários disponíveis
- Dicas para o usuário sobre como proceder
- Feedback visual melhorado

---

## 🔍 Como Verificar a Disponibilidade

### **Opção 1: Usar a Rota de Debug**

Acesse no navegador ou via API:
```
GET /api/debug/availability?date=2026-01-28
```

Esta rota retorna:
- Total de médicos ativos
- Médicos com disponibilidade para o dia
- Todas as disponibilidades configuradas
- Consultas já agendadas para a data

### **Opção 2: Verificar no Console do Servidor**

Quando você seleciona uma data no formulário, o servidor loga informações detalhadas:
- Total de médicos ativos
- Disponibilidades por médico
- Slots gerados
- Slots ocupados

### **Opção 3: Verificar no Banco de Dados**

Execute no Prisma Studio ou via query:
```sql
-- Verificar médicos ativos
SELECT * FROM Doctor WHERE active = true;

-- Verificar disponibilidades
SELECT * FROM DoctorAvailability WHERE active = true;

-- Verificar disponibilidades para um dia específico (ex: Segunda = 1)
SELECT * FROM DoctorAvailability 
WHERE dayOfWeek = 1 AND active = true;
```

---

## ⚠️ Possíveis Causas de "Nenhum Horário Disponível"

### 1. **Nenhum Médico Cadastrado**
- Verifique se há médicos no sistema
- Acesse: `/admin/medicos`
- Certifique-se de que pelo menos um médico está **ativo**

### 2. **Nenhuma Disponibilidade Configurada**
- Cada médico precisa ter disponibilidade configurada
- Acesse: `/admin/medicos/[id]/disponibilidade`
- Configure horários para os dias da semana desejados

### 3. **Disponibilidade Inativa**
- Verifique se as disponibilidades estão marcadas como `active = true`
- No Prisma Studio, verifique a tabela `DoctorAvailability`

### 4. **Dia da Semana Sem Disponibilidade**
- Se você selecionar uma segunda-feira, mas nenhum médico tem disponibilidade para segunda-feira, não haverá horários
- Configure disponibilidade para todos os dias da semana que deseja atender

### 5. **Todos os Horários Já Ocupados**
- Se todos os slots já foram agendados para aquela data, não haverá horários disponíveis
- Tente selecionar outra data

### 6. **Horários no Passado**
- O sistema filtra automaticamente horários que já passaram
- Se for hoje e todos os horários disponíveis já passaram, não haverá opções

---

## 🛠️ Como Configurar Disponibilidade

### **Passo a Passo:**

1. **Acesse o Painel Admin:**
   ```
   /admin/medicos
   ```

2. **Selecione um Médico:**
   - Clique no médico desejado
   - Ou acesse diretamente: `/admin/medicos/[id]/disponibilidade`

3. **Configure Horários:**
   - Selecione o dia da semana
   - Defina horário de início e fim
   - Defina duração da consulta (padrão: 30 minutos)
   - Clique em "Adicionar Disponibilidade"

4. **Verifique se está Ativo:**
   - Certifique-se de que a disponibilidade está marcada como ativa
   - Disponibilidades inativas não aparecem na busca

---

## 📊 Exemplo de Configuração

Para um médico atender de segunda a sexta, das 9h às 18h:

1. **Segunda-feira:**
   - Início: 09:00
   - Fim: 18:00
   - Duração: 30 minutos

2. **Terça-feira:**
   - Início: 09:00
   - Fim: 18:00
   - Duração: 30 minutos

3. **Repetir para Quarta, Quinta e Sexta**

---

## 🧪 Teste Rápido

1. **Acesse a rota de debug:**
   ```
   http://localhost:3000/api/debug/availability?date=2026-01-29
   ```

2. **Verifique a resposta:**
   - `totalDoctors`: Deve ser > 0
   - `doctorsWithAvailability`: Deve ser > 0
   - `doctorsWithAvailabilityForDay`: Deve ter disponibilidades

3. **Se estiver tudo OK, teste no formulário:**
   - Acesse `/agendamento`
   - Selecione a mesma data
   - Deve aparecer horários disponíveis

---

## 📝 Logs Úteis

O sistema gera logs detalhados no console do servidor. Procure por:
- `[getAvailableSlots]` - Informações sobre a busca
- `[API]` - Informações da API
- Mensagens de erro começando com `ERRO:`

---

## ✅ Checklist de Verificação

- [ ] Há pelo menos um médico cadastrado e ativo?
- [ ] O médico tem disponibilidade configurada?
- [ ] A disponibilidade está marcada como ativa?
- [ ] A disponibilidade cobre o dia da semana selecionado?
- [ ] Os horários não estão todos ocupados?
- [ ] Os horários não estão no passado (se for hoje)?

---

## 🆘 Se Nada Funcionar

1. Verifique os logs do servidor para erros
2. Use a rota de debug para diagnóstico detalhado
3. Verifique o banco de dados diretamente
4. Certifique-se de que o servidor está rodando corretamente
