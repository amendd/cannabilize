# ✅ Projeto Centralizado - Cannabilize

## 🎯 Tudo em Uma Única Pasta!

Todos os arquivos estão agora centralizados em:
```
C:\Users\Gabriel\clickcannabis-replica
```

---

## 🚀 Como Executar (Super Simples)

### **Passo 1:**
Abra a pasta:
```
C:\Users\Gabriel\clickcannabis-replica
```

### **Passo 2:**
Duplo clique em:
```
EXECUTAR.bat
```

### **Passo 3:**
Aguarde aparecer no terminal:
```
Local: http://localhost:3000
```

### **Passo 4:**
Abra o navegador em: **http://localhost:3000**

---

## 📁 Estrutura Organizada

```
clickcannabis-replica/
│
├── EXECUTAR.bat          ← ARQUIVO PRINCIPAL (use este!)
│
├── app/                  # Aplicação Next.js
│   ├── admin/           # Área administrativa
│   ├── paciente/        # Área do paciente
│   ├── api/             # APIs RESTful
│   └── ...
│
├── components/          # Componentes React
│   ├── admin/           # Componentes admin
│   ├── home/            # Componentes homepage
│   ├── ui/              # Componentes reutilizáveis
│   └── ...
│
├── lib/                 # Bibliotecas e utilitários
│   ├── prisma.ts        # Cliente Prisma
│   ├── auth.ts          # Autenticação
│   └── ...
│
├── prisma/              # Banco de dados
│   ├── schema.prisma    # Schema do banco
│   └── seed.ts         # Dados de exemplo
│
├── scripts/             # Scripts .bat (organizados)
│   └── (outros scripts)
│
└── docs/                # Documentação
    └── (arquivos .md e .txt)
```

---

## 🔑 Credenciais de Acesso

Após a primeira execução (com seed):

- **Administrador:**
  - Email: `admin@clickcannabis.com`
  - Senha: `admin123`

- **Médico:**
  - Email: `doctor@cannalize.com`
  - Senha: `doctor123`

### ⚠️ Problema de Login?

Se você receber "Email ou senha inválidos" ao tentar fazer login:

1. **Execute o script para criar o admin:**
   ```bash
   npx tsx scripts/criar-admin-clickcannabis.ts
   ```

2. **Ou execute o seed novamente:**
   ```bash
   npx prisma db seed
   ```

Isso criará/atualizará o usuário admin com o email correto.

---

## 📍 URLs Disponíveis

| URL | Descrição |
|-----|-----------|
| http://localhost:3000 | Homepage |
| http://localhost:3000/agendamento | Agendar consulta |
| http://localhost:3000/login | Login |
| http://localhost:3000/admin | Área administrativa |
| http://localhost:3000/paciente | Área do paciente |
| http://localhost:3000/sobre-nos | Sobre nós |
| http://localhost:3000/blog | Blog |
| http://localhost:3000/galeria | Galeria |

---

## ⚠️ Importante

1. **Deixe o terminal aberto** enquanto o servidor estiver rodando
2. **O servidor precisa estar rodando** para acessar o site
3. **Só acesse** http://localhost:3000 **DEPOIS** que aparecer "Ready" no terminal
4. **Para parar** o servidor, pressione `Ctrl+C` no terminal

---

## 🛠️ Requisitos

- **Node.js** 18 ou superior
  - Verificar: `node --version`
  - Baixar: https://nodejs.org/

- **Internet** (para instalar dependências na primeira vez)

---

## 📝 O que o EXECUTAR.bat faz

1. ✅ Verifica Node.js
2. ✅ Instala dependências (se necessário)
3. ✅ Cria arquivo .env (se não existir)
4. ✅ Configura banco de dados (SQLite)
5. ✅ Popula com dados de exemplo (opcional)
6. ✅ Inicia o servidor

---

## ❌ Solução de Problemas

### Erro: "Node.js não encontrado"
- **Solução:** Instale Node.js de https://nodejs.org/

### Erro: "package.json não encontrado"
- **Solução:** Certifique-se de estar na pasta `C:\Users\Gabriel\clickcannabis-replica`

### Erro: "Porta 3000 em uso"
- **Solução:** Feche outros programas usando a porta 3000

### Erro: "Dependências não instaladas"
- **Solução:** Execute `EXECUTAR.bat` novamente (ele instala automaticamente)

---

## 🎉 Pronto!

**Tudo está centralizado e organizado em uma única pasta!**

Basta executar `EXECUTAR.bat` e aguardar! 🚀

---

**Pasta do Projeto:** `C:\Users\Gabriel\clickcannabis-replica`  
**Arquivo Principal:** `EXECUTAR.bat`
