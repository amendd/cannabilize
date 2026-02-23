# Gravação, transcrição e laudo médico (Zoom + IA)

O sistema permite:

1. **Gravar** a chamada Zoom em nuvem (quando a reunião é criada com gravação ativada).
2. **Transcrever** a conversa (transcrição gerada pelo Zoom após o fim da reunião).
3. **Gerar um rascunho de laudo médico** por IA a partir da transcrição (OpenAI).

O laudo gerado é um **rascunho** para o médico revisar e assinar; não substitui o julgamento clínico.

---

## Requisitos

- **Zoom**: conta com **Cloud Recording** (gravação em nuvem). Em algumas contas é necessário ativar transcrição nas configurações da conta Zoom.
- **Laudo por IA**: variável `OPENAI_API_KEY` no `.env` (chave da OpenAI).

---

## Fluxo

1. **Criar reunião com gravação**  
   Ao criar o link da reunião (Zoom), envie `recordMeeting: true` no body do `POST /api/consultations/[id]/meeting`:
   ```json
   { "recordMeeting": true }
   ```
   Isso define `auto_recording: 'cloud'` na reunião Zoom.

2. **Após o fim da chamada**  
   O médico (ou admin) pode:
   - **Sincronizar gravação e transcrição**: `POST /api/consultations/[id]/recording/sync`  
     - Busca no Zoom a gravação e o arquivo de transcrição (se disponível) e salva na consulta.  
     - A gravação no Zoom pode levar alguns minutos para ficar disponível após o fim da reunião.

3. **Gerar laudo por IA**  
   - `POST /api/consultations/[id]/laudo/generate`  
   - Usa a transcrição já sincronizada e gera um rascunho de laudo (OpenAI).  
   - O médico pode revisar o laudo na consulta e copiar/editar nas notas ou no prontuário.

4. **Consultar dados**  
   - `GET /api/consultations/[id]/recording`  
   - Retorna `recordingUrl`, `transcriptText`, `laudoDraft` e datas de sincronização/geração.

---

## Variáveis de ambiente

| Variável | Obrigatória para laudo | Descrição |
|----------|------------------------|-----------|
| `OPENAI_API_KEY` | Sim | Chave da API OpenAI (https://platform.openai.com/api-keys) |
| `OPENAI_LAUDO_MODEL` | Não | Modelo usado (padrão: `gpt-4o-mini`). Ex.: `gpt-4o` para maior qualidade. |

---

## Banco de dados

Foram adicionados à tabela `consultations`:

- `recording_url` – link da gravação Zoom
- `transcript_text` – texto da transcrição
- `transcript_synced_at` – data da última sincronização da transcrição
- `laudo_draft` – rascunho do laudo gerado por IA
- `laudo_generated_at` – data da geração do laudo

Após alterar o schema, execute:

```bash
npx prisma db push
```

---

## Segurança e LGPD

- Gravação e transcrição são dados sensíveis. Garanta consentimento do paciente (termo de uso / aviso na telemedicina).
- O laudo é apenas um rascunho; a responsabilidade é do médico que revisa e assina.
- Recomenda-se restringir acesso às rotas de gravação/transcrição/laudo apenas a médico da consulta e admin.

---

## Zoom: ativar transcrição

Para que a transcrição apareça na API:

1. Acesse as configurações da sua conta Zoom (zoom.us).
2. Em **Recording** > **Cloud recording**, ative **Record an audio transcript** (ou equivalente).
3. Após o fim da reunião, o Zoom processa áudio e gera o arquivo de transcrição; isso pode levar alguns minutos.

Se a transcrição não aparecer em `recording/sync`, verifique se o plano Zoom inclui cloud recording e transcrição e se as permissões do app Server-to-Server OAuth incluem leitura de gravações.

---

## Interface do médico

Na tela da consulta (`/medico/consultas/[id]`):

- **Antes de criar o link**: aparece o checkbox "Gravar consulta (Zoom: transcrição e laudo por IA)". Se marcado, a reunião Zoom é criada com gravação em nuvem.
- **Após criar reunião Zoom**: aparece o bloco "Gravação e Laudo (Zoom + IA)" com:
  - **Sincronizar gravação** – busca gravação e transcrição no Zoom e salva na consulta (disponível alguns minutos após o fim da chamada).
  - **Gerar laudo por IA** – gera rascunho de laudo a partir da transcrição (requer `OPENAI_API_KEY`). Só fica ativo depois de haver transcrição.
  - Link "Ver gravação no Zoom" (quando houver gravação).
  - Transcrição e rascunho do laudo em blocos expansíveis para revisão.

O bloco continua visível após "Encerrei a chamada por vídeo", para o médico sincronizar e gerar o laudo quando quiser.

---

## O que mais pode ser feito (opcional)

| Item | Descrição |
|------|-----------|
| **Consentimento** | Exigir aceite do paciente para gravação (termo na confirmação ou aviso na tela de entrada da chamada). |
| **Admin: gravar por padrão** | Configuração em Admin → Telemedicina para "Gravar consultas Zoom por padrão" (default do checkbox). |
| **Webhook Zoom** | Registrar webhook `recording.completed` no Zoom para sincronizar gravação automaticamente quando estiver pronta (evita o médico clicar em "Sincronizar"). |
| **Laudo em PDF** | Exportar o laudo revisado como PDF ou anexar às anotações/arquivos da consulta. |
| **Google Meet** | Se usar Google Meet, gravação/transcrição dependem de outra API (Drive/Meet); o fluxo atual é apenas para Zoom. |
