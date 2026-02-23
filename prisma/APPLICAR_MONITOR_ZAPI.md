# Aplicar tabela do Monitor Z-API (whatsapp_webhook_logs)

Se `npx prisma migrate dev` falhar com **P3006** (shadow database) ou **no such table: consultations**, use uma das opções abaixo.

## Se der EPERM (operation not permitted) no Prisma

O Prisma tenta **renomear** o arquivo `query_engine-windows.dll.node` e algum processo (Node, antivírus ou a própria IDE) está segurando o arquivo.

**Faça na ordem:**

1. **Feche o servidor Next.js** (Ctrl+C no terminal do `npm run dev`).
2. **Feche todos os terminais** do Cursor que tenham rodado `node` ou `npm` nesse projeto.
3. Encerre processos Node: no PowerShell:
   ```powershell
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
4. **Remova o arquivo que trava** (assim o Prisma cria um novo em vez de renomear):
   - No PowerShell, na pasta do projeto:
   ```powershell
   Remove-Item -Force "node_modules\.prisma\client\query_engine-windows.dll.node" -ErrorAction SilentlyContinue
   Remove-Item -Force "node_modules\.prisma\client\query_engine-windows.dll.node.tmp*" -ErrorAction SilentlyContinue
   ```
5. **Abra um terminal novo** e rode:
   ```bash
   npx prisma generate
   npx prisma db push --accept-data-loss
   ```
6. Se ainda der EPERM no passo 5, abra **PowerShell como Administrador**, vá na pasta do projeto, repita o passo 4 e depois o passo 5.

---

## Opção 1 – Recomendada: `db push`

Sincroniza o schema atual com o banco **sem usar o histórico de migrações** (evita o shadow database).

1. Siga os passos da seção **“Se der EPERM”** acima (feche servidor e terminais, depois use um terminal novo).
2. No terminal:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. Quando aparecer o aviso sobre **`birth_date`** (cast String → DateTime):  
   - Se as 2 datas em `whatsapp_leads` estiverem em formato ISO (ex.: `2020-01-15`), pode responder **Y** (Yes) com segurança.  
   - Para rodar sem perguntar (aceita o aviso automaticamente):  
     `npx prisma db push --accept-data-loss`
4. Suba o servidor de novo (`npm run dev`).

A tabela `whatsapp_webhook_logs` será criada e o Monitor Z-API passará a funcionar.

---

## Opção 2 – Aplicar só esta migração (SQLite)

Se quiser manter o histórico de migrações e o banco já está correto:

1. Feche o servidor Next.js.
2. Abra o SQLite do projeto (ex.: `prisma/dev.db`) e execute o conteúdo de  
   `prisma/migrations/20260210000000_add_whatsapp_webhook_logs/migration.sql`.
3. Depois marque a migração como aplicada:
   ```bash
   npx prisma migrate resolve --applied 20260210000000_add_whatsapp_webhook_logs
   ```

---

## Sobre o aviso de “birth_date” (whatsapp_leads)

O Prisma pode avisar que a coluna `birth_date` será alterada (String → DateTime). No SQLite as datas costumam ser guardadas como texto em formato ISO. Se os 2 valores atuais forem datas válidas (ex.: `1990-05-20`), responder **Y** normalmente preserva os dados. Se preferir não ver a pergunta, use `npx prisma db push --accept-data-loss`.

---

## Sobre o erro P3006

O **shadow database** do Prisma aplica **todas** as migrações em ordem. Como não existe uma migração inicial que crie `consultations`, a migração `add_meeting_start_url` falha no shadow. O `db push` não usa o shadow database, por isso contorna o problema.
