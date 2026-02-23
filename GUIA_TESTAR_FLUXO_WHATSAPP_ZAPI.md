# Guia: testar e validar o fluxo WhatsApp (Z-API)

Este guia descreve como testar e validar o fluxo de captação via WhatsApp integrado à Z-API.

---

## 1. Pré-requisitos

- [x] Z-API configurada no Admin → Integrações → WhatsApp (aba Z-API): Instance ID, Token e Client-Token (se exigido).
- [x] Webhook no painel Z-API: em **Webhooks e configurações gerais** → **Ao receber**, URL = `https://SEU-DOMINIO.com/api/whatsapp/zapi-webhook`.
- [x] Número de WhatsApp conectado na Z-API (instância “Conectado”).

---

## 2. Teste rápido pelo painel (simulação)

Serve para validar que o sistema envia as mensagens corretas **sem** precisar mandar mensagem do celular.

1. Acesse **Admin** → **Fluxos WhatsApp** (ou **Integrações** → Fluxos).
2. Role até a seção **“Testar fluxo de resposta”**.
3. No campo **Número**, informe um celular que receberá as mensagens (ex.: `+5511999999999`).
4. Clique em **“Simular primeira mensagem”**.

**Resultado esperado:** o sistema trata como se esse número tivesse enviado a primeira mensagem e envia, via Z-API:
- Mensagem de boas-vindas (configurada em Fluxos WhatsApp).
- Mensagem de próximos passos (se configurada).
- Primeira pergunta: **“Por favor, digite seu nome completo:”**

Se aparecer sucesso e o WhatsApp receber as mensagens, a integração de **envio** e o **texto do fluxo** estão ok.

---

## 3. Teste completo pelo WhatsApp (fluxo real)

Valida o **webhook** (receber mensagem) e o fluxo de captação de ponta a ponta.

### 3.1 Configurar a URL do webhook

- Em **produção**: use `https://cannabilize.com.br/api/whatsapp/zapi-webhook` (ou seu domínio) no campo **“Ao receber”** da Z-API.
- Em **desenvolvimento local**: use um túnel (ngrok, Cloudflare Tunnel, etc.) e coloque a URL pública no **“Ao receber”**.

### 3.2 Enviar mensagem do celular

1. De **outro** número de WhatsApp (não o da instância Z-API), envie uma mensagem para o **número conectado na Z-API**.
2. Exemplos de primeira mensagem: **“Olá”**, **“Oi”**, **“Quero agendar”**.

**Resultado esperado:** em alguns segundos você recebe no mesmo celular:
- Boas-vindas.
- Próximos passos (se configurado).
- Pedido do **nome completo**.

### 3.3 Seguir o fluxo passo a passo

Responda em sequência para validar cada etapa:

| Etapa | O que o sistema pergunta | Exemplo de resposta |
|-------|--------------------------|---------------------|
| 1     | Nome completo            | `Maria Silva`       |
| 2     | CPF (11 dígitos)         | `12345678901`       |
| 3     | Data de nascimento       | `15/03/1990`        |
| 4     | Patologias (números)     | `2, 5, 8`           |
| 5     | Histórico / anamnese     | `Dor crônica, uso de anti-inflamatórios` |
| 6     | Escolha de data/hora     | Número da opção (ex.: `1`) |
| 7     | Confirmação              | `Sim` ou `Confirmar` |

No final, o sistema deve:
- Criar o **paciente** e a **consulta** no sistema.
- Enviar o link para **concluir cadastro** e o link de **pagamento** (se configurado).

---

## 4. Onde ajustar os textos do fluxo

- **Admin** → **Fluxos WhatsApp**:
  - **Mensagem de boas-vindas**: primeira mensagem que o lead recebe.
  - **Próximos passos**: texto opcional após as boas-vindas.
  - **Número para captação**: usado em botões/links “Falar no WhatsApp” no site (wa.me).

Os textos das perguntas (nome, CPF, data, patologias, anamnese, horário) estão no fluxo padrão do sistema e são enviados automaticamente conforme as respostas.

---

## 5. Checklist de validação

- [ ] **Simulação (Admin → Fluxos → Testar fluxo de resposta):** número recebe boas-vindas + pedido de nome.
- [ ] **Webhook:** ao enviar “Oi” do celular para o número Z-API, recebe resposta automática.
- [ ] **Nome:** ao enviar um nome, recebe pedido de CPF.
- [ ] **CPF:** ao enviar 11 dígitos, recebe pedido de data de nascimento.
- [ ] **Data:** ao enviar DD/MM/AAAA, recebe lista de patologias.
- [ ] **Patologias:** ao enviar números (ex.: 1, 3, 5), recebe pedido de anamnese.
- [ ] **Anamnese:** ao enviar texto, recebe opções de data/hora (se houver slots).
- [ ] **Confirmação:** ao confirmar, recebe links de concluir cadastro e pagamento; paciente e consulta aparecem no Admin.

---

## 6. Problemas comuns

| Sintoma | O que verificar |
|--------|------------------|
| Nada chega no WhatsApp | Webhook Z-API (“Ao receber”) apontando para a URL correta; instância Z-API “Conectado”; Admin → WhatsApp (Z-API) habilitado e salvo. |
| Erro “client-token is not configured” | Preencher **Client-Token** em Admin → WhatsApp (Z-API), com o valor da seção **Segurança** no painel Z-API. |
| Resposta só na simulação, não no celular | URL do webhook acessível pela internet (domínio ou túnel); em localhost, usar ngrok/túnel e essa URL no “Ao receber”. |
| Slots não aparecem | Ter pelo menos um médico com disponibilidade cadastrada no futuro (Admin → Médicos → disponibilidade). |

---

## 7. Webhook não responde: diagnóstico

### 7.1 Testar se a URL está no ar

Abra no navegador: `https://cannabilize.com.br/api/whatsapp/zapi-webhook`  
Deve retornar JSON: `{ "ok": true, "message": "Webhook Z-API (Ao receber) está ativo..." }`. Se não abrir, o servidor está inacessível.

### 7.2 Ver logs quando alguém manda mensagem

O servidor grava: `[WhatsApp Z-API Webhook] POST recebido:` e `[WhatsApp Z-API Webhook] Processado:`.  
**Vercel:** Dashboard → Logs (Runtime Logs). Envie uma mensagem e filtre por "zapi-webhook".  
Se **não** aparecer "POST recebido", a Z-API não está chamando sua URL (confira "Ao receber" no painel Z-API).  
Se aparecer "POST recebido" mas "Falha ao enviar", o problema é no envio (Token/Client-Token).

Com isso você consegue testar e validar todo o fluxo WhatsApp com Z-API.
