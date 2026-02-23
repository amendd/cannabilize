# Verificação da integração Google Meet

Use este checklist para confirmar se a integração com o Google Meet está **ativa**, **válida** e **funcional**.

---

## 1. Configuração no Admin

- [ ] Acessar **Admin → Telemedicina** (`/admin/telemedicina`)
- [ ] Seção **Google Meet**:
  - [ ] Toggle **habilitado** (ligado)
  - [ ] **Client ID** preenchido (formato `xxxxx.apps.googleusercontent.com` ou string longa)
  - [ ] **Client Secret** preenchido (ex.: `GOCSPX-xxxxx`)
  - [ ] **Refresh Token** preenchido (ex.: `1//xxxxx`)
- [ ] Clicar em **"Testar Credenciais"**
  - [ ] Resultado: mensagem de sucesso (ex.: *"Credenciais válidas! A integração com Google Meet está funcionando corretamente."*)
- [ ] Clicar em **"Salvar"**

**Como obter as credenciais:** Google Cloud Console → projeto → habilitar **Google Calendar API** → Credentials → OAuth 2.0 Client ID (Web) → usar OAuth Playground para obter o Refresh Token. O guia na própria página da telemedicina tem o link para o guia completo.

---

## 2. Status da API (script ou navegador)

- [ ] Servidor rodando (ex.: `npm run dev`)
- [ ] Logado como **médico** ou **admin**
- [ ] Chamar **GET** `/api/telemedicine/status` (no navegador em `/api/telemedicine/status` estando logado, ou rodar o script abaixo)
- [ ] Resposta esperada (exemplo):
  ```json
  {
    "configured": true,
    "zoom": { "enabled": false, "available": false },
    "googleMeet": { "enabled": true, "available": true }
  }
  ```
- [ ] `googleMeet.enabled` e `googleMeet.available` devem ser `true` para a integração estar ativa e configurada.

---

## 3. Criação de reunião (fluxo real)

- [ ] Existe pelo menos uma **consulta** com **pagamento confirmado** (status PAID)
- [ ] Médico ou admin abre a consulta (ex.: `/medico/consultas` ou detalhe da consulta)
- [ ] Clicar em **"Iniciar Reunião"** (ou equivalente)
- [ ] Sistema chama `POST /api/consultations/[id]/meeting` com `{ "platform": "GOOGLE_MEET" }` (ou sem platform)
- [ ] Resposta: `{ "meeting": { "meetingLink": "https://meet.google.com/...", "platform": "GOOGLE_MEET" }, "message": "Reunião criada com sucesso" }`
- [ ] Na tela da consulta, o **link do Meet** aparece e pode ser aberto (mesmo link para médico e paciente)

Se todos os itens acima forem verdadeiros, a integração está **funcional**.

---

## 4. Resumo rápido

| Verificação              | Onde / Como                                      | Esperado                          |
|--------------------------|--------------------------------------------------|-----------------------------------|
| Config ativa             | Admin → Telemedicina                             | Google Meet habilitado e salvo    |
| Credenciais válidas      | Botão "Testar Credenciais" na mesma página       | Mensagem de sucesso               |
| Status da API            | GET `/api/telemedicine/status` (logado)          | `googleMeet.available: true`     |
| Criar reunião            | "Iniciar Reunião" em consulta paga               | Link meet.google.com retornado    |

---

## 5. Script de verificação (configuração no banco)

Para checar se o Google Meet está **habilitado e com credenciais salvas** (sem precisar do servidor rodando nem de login):

```bash
npx ts-node scripts/verificar-google-meet-status.ts
```

Ou com `tsx`:

```bash
npx tsx scripts/verificar-google-meet-status.ts
```

O script lê a tabela `telemedicine_configs` e informa:
- se existe configuração para GOOGLE_MEET;
- se está habilitado;
- se Client ID, Client Secret e Refresh Token estão preenchidos.

**Status via API (com servidor e login):** com o servidor rodando e logado como médico ou admin, abra no navegador `http://localhost:3000/api/telemedicine/status` para ver `googleMeet.enabled` e `googleMeet.available`.

---

## Erros comuns

- **401 ao chamar /api/telemedicine/status:** faça login como médico ou admin e chame a URL no mesmo navegador (ou use o script com sessão).
- **"Credenciais do Google Meet incompletas":** preencha Client ID, Client Secret e Refresh Token e salve.
- **"Refresh Token inválido ou expirado":** gere um novo Refresh Token no Google OAuth Playground com as mesmas credenciais OAuth.
- **"Nenhuma plataforma de telemedicina configurada":** habilite o Google Meet no admin e salve; confira se os três campos estão preenchidos.
- **"Pagamento não confirmado" ao criar reunião:** a consulta precisa ter um pagamento com status PAID.

Se após seguir este guia algo ainda falhar, verifique os logs do servidor (erros ao renovar token ou ao chamar a Google Calendar API) e as mensagens de erro retornadas pela API.
