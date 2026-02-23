# Zoom: evitar "Waiting for the host to start the meeting"

Quando o participante (paciente ou médico) entra no link do Zoom e fica em **"Waiting for the host to start the meeting"**, faça o seguinte.

---

## 1. Médico deve entrar primeiro (link de host)

O sistema já está configurado para que, quando o **médico** clica em **"Entrar"** ou **"Iniciar Reunião"** (na lista de consultas, no dashboard ou na página da consulta), seja aberto o **link de host** (start_url) do Zoom, e não o link de participante.

- Assim que o **médico** entra por esse link, a reunião **começa**.
- Depois, o **paciente** pode entrar pelo link que recebeu (meetingLink) e verá o médico, sem ficar "aguardando host".

**Prática recomendada:** o médico abre a reunião primeiro (clicando em "Entrar" no sistema); em seguida o paciente acessa o mesmo link da consulta ou o médico envia o link ao paciente.

---

## 2. Habilitar "Join before host" na conta Zoom

Se mesmo assim aparecer "Waiting for the host", a **conta Zoom** usada nas credenciais (Admin → Telemedicina) pode estar com **"Join before host"** desativado. Nesse caso, a API envia a opção, mas a conta ignora.

**Como ativar:**

1. Acesse o **portal Zoom** (zoom.us) e faça login com a **mesma conta** cujas credenciais estão em Admin → Telemedicina (Server-to-Server OAuth).
2. Vá em **Settings** (Configurações) ou **Account Management** → **Account Settings**.
3. Aba **Meeting** (Reunião).
4. Localize **"Join Before Host"** / **"Allow participants to join before host"**.
5. **Ative** a opção e salve.
6. Se houver um ícone de cadeado, desbloqueie para que a configuração valha para as reuniões da conta.

Assim, as reuniões criadas pela API passam a respeitar **join_before_host: true** e os participantes podem entrar antes do host.

---

## Resumo

| O que fazer | Efeito |
|-------------|--------|
| Médico clicar em "Entrar" / "Iniciar" no sistema | Abre o link de **host** (Zoom start_url); a reunião começa quando o médico entra. |
| Paciente entrar depois | Vê o médico na chamada, sem "Waiting for the host". |
| Ativar "Join before host" na conta Zoom | A API consegue permitir entrada antes do host; reduz dependência de quem entra primeiro. |
