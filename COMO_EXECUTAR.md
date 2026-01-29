# 🚀 Como Ver o Site Funcionando - Guia Passo a Passo

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

1. **Node.js** (versão 18 ou superior)
   - Baixar em: https://nodejs.org/
   - Verificar instalação: `node --version`

2. **PostgreSQL** (banco de dados)
   - Baixar em: https://www.postgresql.org/download/
   - Ou usar um serviço online como Supabase, Neon, etc.

3. **Git** (opcional, para clonar repositórios)

---

## 🎯 Passo a Passo Completo

### **PASSO 1: Navegar até a pasta do projeto**

Abra o terminal (PowerShell ou CMD) e navegue até a pasta do projeto:

```bash
cd C:\Users\Gabriel\clickcannabis-replica
```

---

### **PASSO 2: Instalar as dependências**

Execute o comando para instalar todas as bibliotecas necessárias:

```bash
npm install
```

⏱️ **Tempo estimado:** 2-5 minutos (dependendo da internet)

---

### **PASSO 3: Configurar o banco de dados**

#### 3.1 Criar arquivo `.env`

Crie um arquivo chamado `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/clickcannabis?schema=public"

# NextAuth (Autenticação)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="qualquer-string-aleatoria-aqui-123456789"

# Opcional - Para integrações futuras
# STRIPE_SECRET_KEY=""
# WHATSAPP_API_KEY=""
```

**⚠️ IMPORTANTE:**
- Substitua `usuario` e `senha` pelas credenciais do seu PostgreSQL
- Substitua `localhost:5432` se seu banco estiver em outro servidor
- Gere uma string aleatória para `NEXTAUTH_SECRET` (pode usar: https://generate-secret.vercel.app/32)

#### 3.2 Gerar o cliente Prisma

```bash
npx prisma generate
```

#### 3.3 Criar as tabelas no banco

```bash
npx prisma db push
```

Isso criará todas as tabelas necessárias no banco de dados.

---

### **PASSO 4: Popular o banco com dados de exemplo (OPCIONAL)**

Execute o seed para criar dados de teste:

```bash
npm run db:seed
```

Isso criará:
- ✅ Usuário admin: `admin@clickcannabis.com` / senha: `admin123`
- ✅ Médico: `doctor@clickcannabis.com` / senha: `doctor123`
- ✅ Patologias, posts do blog e eventos de exemplo

---

### **PASSO 5: Iniciar o servidor de desenvolvimento**

Execute o comando:

```bash
npm run dev
```

Você verá uma mensagem como:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

---

### **PASSO 6: Abrir no navegador**

Abra seu navegador e acesse:

🌐 **http://localhost:3000**

---

## 🎉 Pronto! O site está funcionando!

### 📍 URLs Disponíveis:

- **Homepage:** http://localhost:3000
- **Sobre Nós:** http://localhost:3000/sobre-nos
- **Blog:** http://localhost:3000/blog
- **Galeria:** http://localhost:3000/galeria
- **Agendamento:** http://localhost:3000/agendamento
- **Login:** http://localhost:3000/login
- **Área Admin:** http://localhost:3000/admin
- **Área do Paciente:** http://localhost:3000/paciente

---

## 🔑 Credenciais de Acesso (após seed)

### Administrador:
- **Email:** admin@clickcannabis.com
- **Senha:** admin123

### Médico:
- **Email:** doctor@clickcannabis.com
- **Senha:** doctor123

---

## 🛠️ Comandos Úteis

### Desenvolvimento:
```bash
npm run dev          # Inicia servidor de desenvolvimento
```

### Banco de Dados:
```bash
npx prisma studio    # Abre interface visual do banco
npx prisma db push   # Atualiza schema do banco
npm run db:seed      # Popula banco com dados de exemplo
```

### Build para Produção:
```bash
npm run build        # Cria build de produção
npm start            # Inicia servidor de produção
```

---

## ❌ Solução de Problemas Comuns

### Erro: "Cannot find module"
```bash
# Deletar node_modules e reinstalar
rm -rf node_modules
npm install
```

### Erro: "Database connection"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -U usuario -d clickcannabis`

### Erro: "Port 3000 already in use"
```bash
# Usar outra porta
npm run dev -- -p 3001
```

### Erro: "Prisma Client not generated"
```bash
npx prisma generate
```

---

## 📝 Checklist Rápido

Antes de executar, verifique:

- [ ] Node.js instalado (`node --version`)
- [ ] PostgreSQL instalado e rodando
- [ ] Arquivo `.env` criado com `DATABASE_URL`
- [ ] Dependências instaladas (`npm install`)
- [ ] Prisma gerado (`npx prisma generate`)
- [ ] Banco criado (`npx prisma db push`)
- [ ] Seed executado (opcional, `npm run db:seed`)

---

## 🎬 Resumo Rápido (TL;DR)

```bash
# 1. Ir para a pasta
cd C:\Users\Gabriel\clickcannabis-replica

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env com DATABASE_URL

# 4. Configurar banco
npx prisma generate
npx prisma db push

# 5. (Opcional) Popular dados
npm run db:seed

# 6. Executar
npm run dev

# 7. Abrir navegador
# http://localhost:3000
```

---

## 💡 Dica: Usar SQLite para Testes Rápidos

Se não quiser instalar PostgreSQL, pode usar SQLite temporariamente:

1. No arquivo `.env`, use:
```env
DATABASE_URL="file:./dev.db"
```

2. No `prisma/schema.prisma`, mude:
```prisma
datasource db {
  provider = "sqlite"  // em vez de "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Execute:
```bash
npx prisma generate
npx prisma db push
```

⚠️ **Nota:** SQLite é apenas para desenvolvimento. Use PostgreSQL em produção.

---

## 🆘 Precisa de Ajuda?

Se encontrar algum problema:

1. Verifique os logs no terminal
2. Confirme que todas as dependências foram instaladas
3. Verifique se o banco de dados está acessível
4. Tente deletar `node_modules` e `.next` e reinstalar

---

**Boa sorte! 🚀**
