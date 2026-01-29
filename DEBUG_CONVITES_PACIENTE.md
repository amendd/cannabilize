# 🔍 Debug: Convites não aparecem no Dashboard do Paciente

**Data:** 28 de Janeiro de 2026

---

## ✅ Correções Aplicadas

1. **Melhorada lógica de carregamento** no `app/paciente/page.tsx`
   - Agora aguarda corretamente o `effectivePatientId` estar pronto
   - Logs de debug adicionados para rastrear o fluxo

2. **Logs adicionados na API** `app/api/patient/reschedule-invites/route.ts`
   - Logs mostram quando a API é chamada
   - Logs mostram quantos convites foram encontrados
   - Logs mostram a query executada

---

## 🔍 Como Verificar

### 1. **Verificar no Console do Navegador**

Abra o console do navegador (F12) e procure por:
- `"Buscando convites de remarcação..."`
- `"Resposta da API de convites: 200 OK"`
- `"Convites recebidos da API: {...}"`
- `"Total de convites encontrados: X"`

### 2. **Verificar no Console do Servidor**

No terminal onde o servidor está rodando, procure por:
- `"Buscando convites para paciente: [id]"`
- `"Query where: {...}"`
- `"Encontrados X convites para paciente [id]"`

### 3. **Verificar se há Convites no Banco**

**Opção A: Via Prisma Studio**
```bash
npx prisma studio
```
Navegue até a tabela `consultation_reschedule_invites` e verifique:
- Se há registros
- Se o `patient_id` corresponde ao ID do paciente logado
- Se o `status` é `PENDING`
- Se o `expires_at` é maior que agora

**Opção B: Via SQL**
```sql
SELECT * FROM consultation_reschedule_invites 
WHERE patient_id = '[ID_DO_PACIENTE]' 
  AND status = 'PENDING' 
  AND expires_at > datetime('now');
```

### 4. **Verificar Autenticação**

No console do navegador, verifique:
- `session?.user?.id` existe
- `session?.user?.role` é `'PATIENT'`
- `effectivePatientId` está definido

---

## 🧪 Como Testar

### Passo 1: Criar um Convite (como Médico)

1. Faça login como médico
2. Vá para `/medico` ou `/medico/consultas`
3. Encontre uma consulta `SCHEDULED` futura
4. Clique em "Sugerir Adiantamento" ou "Adiantar"
5. Selecione um horário anterior
6. Clique em "Enviar Convite"

### Passo 2: Verificar se o Convite foi Criado

**No console do servidor, você deve ver:**
```
Convite criado: { id: '...', patientId: '...', ... }
```

**No Prisma Studio, você deve ver:**
- Um novo registro na tabela `consultation_reschedule_invites`
- `status` = `'PENDING'`
- `expires_at` = 5 minutos a partir de agora

### Passo 3: Verificar no Dashboard do Paciente

1. Faça login como o paciente que recebeu o convite
2. Vá para `/paciente`
3. **Verifique o console do navegador:**
   - Deve aparecer: `"Buscando convites de remarcação..."`
   - Deve aparecer: `"Resposta da API de convites: 200 OK"`
   - Deve aparecer: `"Total de convites encontrados: 1"` (ou mais)

4. **Verifique o console do servidor:**
   - Deve aparecer: `"Buscando convites para paciente: [id]"`
   - Deve aparecer: `"Encontrados 1 convites para paciente [id]"`

5. **Verifique na tela:**
   - Deve aparecer um card com o convite acima dos cards principais

---

## 🐛 Problemas Comuns

### Problema 1: "Total de convites encontrados: 0"

**Possíveis causas:**
- ✅ Convite expirou (5 minutos)
- ✅ Convite já foi respondido (status não é `PENDING`)
- ✅ `patient_id` não corresponde ao paciente logado
- ✅ Convite foi cancelado (status = `CANCELLED`)

**Solução:**
- Criar um novo convite
- Verificar no Prisma Studio se o `patient_id` está correto

### Problema 2: "Acesso negado"

**Possíveis causas:**
- ✅ Usuário não está autenticado
- ✅ Role do usuário não é `PATIENT`

**Solução:**
- Verificar se está logado como paciente
- Verificar `session?.user?.role` no console

### Problema 3: "Erro ao carregar convites"

**Possíveis causas:**
- ✅ Erro na API (verificar logs do servidor)
- ✅ Problema de conexão com banco de dados

**Solução:**
- Verificar logs do servidor para detalhes do erro
- Verificar se o banco de dados está acessível

---

## 📊 Estrutura Esperada da Resposta da API

```json
{
  "invites": [
    {
      "id": "uuid",
      "consultationId": "uuid",
      "currentScheduledAt": "2026-01-28T21:40:00.000Z",
      "newScheduledAt": "2026-01-28T20:55:00.000Z",
      "newScheduledDate": "2026-01-28",
      "newScheduledTime": "20:55",
      "message": "Mensagem opcional do médico",
      "status": "PENDING",
      "expiresAt": "2026-01-28T21:05:00.000Z",
      "respondedAt": null,
      "createdAt": "2026-01-28T21:00:00.000Z",
      "doctor": {
        "id": "uuid",
        "name": "Dr. João Silva"
      },
      "consultation": {
        "id": "uuid",
        "status": "SCHEDULED",
        "scheduledAt": "2026-01-28T21:40:00.000Z"
      }
    }
  ]
}
```

---

## ✅ Checklist de Verificação

- [ ] Convite foi criado no banco de dados
- [ ] `patient_id` do convite corresponde ao paciente logado
- [ ] `status` do convite é `PENDING`
- [ ] `expires_at` é maior que agora
- [ ] API `/api/patient/reschedule-invites` retorna 200 OK
- [ ] Resposta da API contém array `invites` com pelo menos 1 item
- [ ] Console do navegador mostra logs de sucesso
- [ ] Console do servidor mostra logs de sucesso
- [ ] Card do convite aparece no dashboard

---

**Com os logs adicionados, agora é mais fácil identificar onde está o problema!** 🔍
