# 🔐 Solução: Credenciais de Login Não Funcionam

## ❌ Problema
As credenciais de login não estão funcionando.

## ✅ Solução: Criar Usuários no Banco de Dados

O problema é que os usuários ainda não foram criados no banco de dados. Siga estes passos:

### **Opção 1: Script Automatizado (Mais Fácil)**

1. **Duplo clique no arquivo:**
   ```
   CRIAR_USUARIOS.bat
   ```

2. **Aguarde a mensagem de sucesso**

3. **Use as credenciais:**
   - Admin: `admin@clickcannabis.com` / `admin123`
   - Médico: `doctor@cannalize.com` / `doctor123`

### **Opção 2: Executar Manualmente**

Abra o PowerShell na pasta do projeto e execute:

```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npx tsx criar-usuarios.ts
```

### **Opção 3: Usar o Seed Completo**

Se quiser criar todos os dados de exemplo (usuários, patologias, blog, etc.):

```powershell
cd c:\Users\Gabriel\clickcannabis-replica
npm run db:seed
```

---

## 📋 Credenciais Criadas

Após executar o script, você terá:

### **Administrador**
- **Email:** `admin@clickcannabis.com`
- **Senha:** `admin123`
- **Acesso:** `/admin`

### **Médico**
- **Email:** `doctor@cannalize.com`
- **Senha:** `doctor123`
- **Acesso:** `/medico`

---

## 🔍 Verificar se Funcionou

1. Acesse: http://localhost:3000/login
2. Tente fazer login com uma das credenciais acima
3. Se ainda não funcionar, verifique:
   - O servidor está rodando? (`npm run dev`)
   - O banco de dados está conectado? (verifique o `.env`)
   - Os usuários foram criados? (execute o script novamente)

---

## 🛠️ Troubleshooting

### Erro: "Email ou senha inválidos"

1. **Execute o script de criação novamente:**
   ```powershell
   npx tsx criar-usuarios.ts
   ```

2. **Verifique se o banco está conectado:**
   - Abra o arquivo `.env`
   - Verifique se `DATABASE_URL` está correto

3. **Teste a conexão:**
   ```powershell
   npx prisma db push
   ```

### Erro: "Cannot connect to database"

- Verifique sua conexão com a internet
- Verifique se a `DATABASE_URL` no `.env` está correta
- Se estiver usando Supabase, verifique se o projeto está ativo

---

## 📝 Notas Importantes

- O script `criar-usuarios.ts` usa `upsert`, então pode ser executado várias vezes sem problemas
- Se você mudar a senha no código, execute o script novamente para atualizar
- Os usuários são criados com senhas criptografadas usando bcrypt

---

**Pronto! Agora você deve conseguir fazer login! 🎉**
