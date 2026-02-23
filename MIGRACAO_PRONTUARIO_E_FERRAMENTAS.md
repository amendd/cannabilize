# Migração: Prontuário e Novas Ferramentas

Foram adicionados novos recursos ao sistema (prontuário, evolução clínica, templates, atestados, pedidos de exame, notificações). Para que tudo funcione, é necessário aplicar as alterações no banco de dados.

## Passos

1. **Gerar o cliente Prisma e aplicar o schema**
   - No terminal, na pasta do projeto:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   - Se aparecer erro de permissão (EPERM) no `prisma generate`, feche o servidor Next e qualquer processo que use o projeto e tente novamente.

2. **(Opcional) Inserir templates iniciais**
   - Após o `db push`, você pode inserir templates pelo Prisma Studio ou por um script. Exemplo via SQLite:
   - Abra o banco com `npx prisma studio` e na tabela `templates` adicione registros com:
     - `name`: "Anamnese padrão", `type`: "ANAMNESE", `content`: "Tratamentos anteriores:\nMedicamentos atuais:\nAlergias:\nInformações adicionais:", `active`: true
     - `name`: "Evolução padrão", `type`: "EVOLUÇÃO", `content`: "Evolução do quadro. Paciente em acompanhamento.", `active`: true

## Novas tabelas criadas

- `clinical_evolutions` – evolução clínica do paciente
- `templates` – templates de anamnese e evolução
- `medical_certificates` – atestados médicos
- `exam_requests` – pedidos de exame
- `notifications` – central de notificações

## O que foi implementado

- **Médico:** Prontuário do paciente (`/medico/pacientes/[id]/prontuario`), evolução clínica, atestados, pedidos de exame, retornos previstos no dashboard, link “Abrir prontuário” na tela da consulta.
- **Paciente:** Meu histórico (`/paciente/historico`), exportação de dados (LGPD) no perfil.
- **Ambos:** Central de notificações (ícone do sino no topo).

Depois de rodar `prisma generate` e `prisma db push`, reinicie o servidor Next e use as novas telas.
