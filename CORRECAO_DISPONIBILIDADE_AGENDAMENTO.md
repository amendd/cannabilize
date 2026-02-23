# Correção: Disponibilidade para agendamento (médico online + 30 min)

**Data:** 29 de Janeiro de 2026

---

## Problema relatado

Mesmo com o médico **ativando a opção** "Aceitar agendamentos com 30 min (quando online)" no painel e estando com a **sessão ativa** no site, quando o paciente vai agendar a consulta aparece **indisponível**.

---

## Causas identificadas

### 1. **Timezone do servidor vs "hoje" do paciente (principal)**

- A decisão de tratar a data como **"hoje"** era feita com a data do **servidor** (`new Date()` no Node).
- Em hospedagem (ex.: Vercel) o servidor costuma estar em **UTC**. No Brasil, à noite, no servidor já pode ser **o dia seguinte**.
- Exemplo: Paciente no Brasil, 29/01 22:00 → escolhe "hoje" (29/01). Servidor em UTC já é 30/01 02:00 → `today` no servidor = 30/01. A data 29/01 era considerada **"não é hoje"**.
- Para "não é hoje", o código só filtrava horários no passado (5 min). Como 29/01 14:00 no servidor (UTC) já é **antes** de 30/01 02:05, **todos os horários do dia 29 eram descartados** → zero slots → paciente vê "indisponível".

### 2. **Heartbeat quando ADMIN impersona médico**

- O heartbeat (POST `/api/doctors/activity`) que atualiza `lastActiveAt` só aceitava usuário com role **DOCTOR**.
- Quando um **ADMIN** acessa o painel do médico (impersonando), o heartbeat retornava 401 e **não atualizava** `lastActiveAt`, então o médico aparecia offline nos agendamentos.

### 3. **Validação na criação da consulta**

- Na criação da consulta (POST `/api/consultations`), a antecedência mínima usava só **"médico online"**, sem considerar **"aceita agendamento online"** (`acceptsOnlineBooking`).
- A listagem de slots já usava `canUseShortNotice = doctorIsOnline && acceptsOnline`. A API de criação ficava inconsistente (e poderia aceitar horários que não deveriam aparecer em edge cases).

---

## Correções aplicadas

### 1. **`lib/availability.ts`**

- **"Hoje" com timezone Brasil:**  
  - Função `getTodayStringInTimezone('America/Sao_Paulo')` para obter a data de "hoje" no fuso do Brasil.
  - `isDateToday` passou a ser: `date === todayStrServer || date === todayStrBR`.
  - Assim, quando o paciente escolhe "hoje" (29/01 no Brasil), a data continua sendo tratada como **hoje** mesmo que o servidor esteja em UTC no dia 30/01.
- **Bloco "Para HOJE":** passou a usar a mesma variável `isDateToday` (já baseada em server + Brasil).
- **Logs de diagnóstico:** para cada médico são logados `online`, `acceptsOnlineBooking` e `canUseShortNotice`, facilitando debug no servidor.
- **Exportadas** `getTodayStringInTimezone`, `DEFAULT_AVAILABILITY_TIMEZONE` e `isDateTodayForAvailability` para uso na API de consultas.

### 2. **`app/api/doctors/activity/route.ts`**

- **POST** passou a aceitar também **ADMIN**.
- Se for **ADMIN**, o body pode conter `{ doctorId: "..." }` para indicar qual médico está "ativo" (ex.: quando o admin está impersonando).
- Assim, com o painel do médico aberto como ADMIN impersonando, o heartbeat atualiza o `lastActiveAt` daquele médico.

### 3. **`app/medico/page.tsx`**

- No **heartbeat** (intervalo de 1 min), quando o usuário é **ADMIN** e existe `admin_impersonated_doctor_id` no `sessionStorage`, o POST para `/api/doctors/activity` envia **body** `{ doctorId }`.
- Ao carregar o perfil do médico (fetchDoctorProfile), o heartbeat imediato também envia `doctorId` quando está em modo impersonação, para o médico já aparecer online.

### 4. **`app/api/consultations/route.ts`**

- Uso de **`isDateTodayForAvailability(data.scheduledDate)`** em vez de comparar apenas com a data do servidor, alinhado à listagem de slots.
- Na validação de **antecedência mínima para "hoje"**:
  - Busca do médico para ler **`acceptsOnlineBooking`**.
  - `canUseShortNotice = doctorIsOnline && acceptsOnlineBooking`.
  - Antecedência: **30 min** (ou valor configurado) só se `canUseShortNotice`; senão **2 h** (ou valor configurado).
- Mensagem de erro ajustada para refletir "médico online e aceita 30 min" vs "médico offline ou não aceita 30 min".

---

## Como conferir no seu ambiente

1. **Migração do banco**  
   O médico precisa do campo **`accepts_online_booking`** na tabela `doctors`. No Prisma está como `acceptsOnlineBooking`. Se a coluna não existir, rode:
   ```bash
   npx prisma migrate dev
   ```
   (ou aplique a migration que adiciona esse campo, se já existir no schema.)

2. **Configuração de antecedência (opcional)**  
   Em **Admin → Configurações** você pode ajustar:
   - **Médico online (minutos):** antecedência quando o médico está online e aceita 30 min (ex.: 30).
   - **Médico offline (minutos):** antecedência quando está offline (ex.: 120).

3. **Logs no servidor**  
   Ao buscar slots (paciente escolhendo data), os logs devem mostrar:
   - Se a data foi tratada como HOJE (server + Brasil).
   - Para cada médico: `online=`, `acceptsOnlineBooking=`, `canUseShortNotice=`.

4. **Fluxo esperado**  
   - Médico entra no **painel** (`/medico`), **ativa** "Aceitar agendamentos com 30 min (quando online)" e **mantém a aba aberta** (heartbeat a cada 1 min).
   - Paciente abre o **formulário de agendamento**, escolhe **hoje** e vê horários a partir de **agora + 30 min** (ou o valor configurado).
   - Se o médico fechar a aba ou ficar inativo por mais de **5 minutos**, passa a valer a antecedência de médico offline (ex.: 2 h).

---

## Resumo

| Causa                         | Correção                                                                 |
|------------------------------|---------------------------------------------------------------------------|
| "Hoje" errado por timezone   | "Hoje" = data do servidor **ou** data no timezone America/Sao_Paulo     |
| Heartbeat falhando como ADMIN| POST activity aceita ADMIN e body `{ doctorId }`; painel envia doctorId   |
| Validação na criação         | Usa `isDateTodayForAvailability` e `canUseShortNotice` (online + aceita)   |

Com isso, a opção de disponibilidade para agendamento com 30 min de antecedência passa a funcionar de forma consistente entre listagem de slots e criação da consulta, mesmo com servidor em UTC e quando o médico é acessado via impersonação de admin.
