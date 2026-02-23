# 🔧 Solução: Erro "Cannot read properties of undefined (reading 'findUnique')"

## 🚨 Problema

O erro indica que o **Prisma Client** não está inicializado corretamente ou a tabela `whatsapp_configs` não existe no banco de dados.

## ✅ Soluções

### Solução 1: Gerar o Prisma Client

Execute no terminal:

```bash
npx prisma generate
```

Isso regenera o Prisma Client com todos os modelos atualizados.

### Solução 2: Verificar se a Tabela Existe

Execute no terminal:

```bash
# Verificar o schema
npx prisma db push

# Ou fazer migração
npx prisma migrate dev
```

### Solução 3: Verificar Variável de Ambiente

Certifique-se de que o arquivo `.env` tem a variável `DATABASE_URL`:

```env
DATABASE_URL="file:./dev.db"
```

Ou se estiver usando PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"
```

### Solução 4: Reiniciar o Servidor

Após executar `npx prisma generate`, **reinicie o servidor Next.js**:

1. Pare o servidor (Ctrl+C)
2. Execute novamente: `npm run dev`

## 🔍 Verificação

Para verificar se está funcionando:

1. Abra o terminal onde o servidor está rodando
2. Tente salvar a configuração novamente
3. Veja se há mensagens de erro mais específicas nos logs

## 📝 Passo a Passo Completo

1. **Pare o servidor** (se estiver rodando)

2. **Gere o Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Atualize o banco de dados:**
   ```bash
   npx prisma db push
   ```

4. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

5. **Tente salvar a configuração novamente**

## 🎯 Se o Erro Persistir

Verifique os logs do servidor. Agora o sistema mostrará mensagens de erro mais específicas:

- Se for problema de conexão: "Não foi possível conectar ao banco de dados"
- Se for problema do Prisma: "Erro de configuração do banco de dados. Execute: npx prisma generate"
- Se for problema de tabela: Verifique se o schema está correto

## 💡 Dica

Se você acabou de adicionar o modelo `WhatsAppConfig` ao schema, certifique-se de:

1. ✅ Executar `npx prisma generate`
2. ✅ Executar `npx prisma db push` ou criar uma migração
3. ✅ Reiniciar o servidor
