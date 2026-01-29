# CannaLize - Sistema Completo

Sistema completo de telemedicina para tratamentos com cannabis medicinal.

## 🚀 Funcionalidades Implementadas

### ✅ Frontend Completo
- **Homepage** com todas as seções (Hero, Patologias, Processo, Estatísticas, Depoimentos, Eventos, Blog, FAQ)
- **Página Sobre Nós** com história, diferenciais e pilares
- **Blog** com sistema de artigos
- **Galeria** de eventos
- **Sistema de Agendamento** completo com formulário de anamnese

### ✅ Backend e APIs
- **Sistema de Autenticação** (NextAuth) com roles (PATIENT, DOCTOR, ADMIN)
- **API de Consultas** (criação, listagem, detalhes)
- **API de Receitas Médicas** com geração de PDF
- **API de Laudos Médicos** com geração de PDF
- **APIs Administrativas** (estatísticas, consultas, ações pendentes)

### ✅ Área Administrativa
- **Dashboard** com estatísticas e métricas
- **Gestão de Consultas** com filtros e detalhes
- **Emissão de Receitas** médicas
- **Geração de Laudos** em PDF
- **Visualização de Anamnese** e dados do paciente

### ✅ Banco de Dados
- **Schema Prisma** completo com todas as entidades
- Modelos: User, Doctor, Consultation, Prescription, AnvisaAuthorization, Import, Payment, Testimonial, BlogPost, Event

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório e instale as dependências:**
```bash
cd clickcannabis-replica
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/clickcannabis?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-key-aqui"
```

3. **Configure o banco de dados:**
```bash
npx prisma generate
npx prisma db push
```

4. **Popule o banco com dados de exemplo (opcional):**
```bash
npm run db:seed
```

Isso criará:
- Usuário admin: `admin@clickcannabis.com` / `admin123`
- Médico: `doctor@clickcannabis.com` / `doctor123`
- Patologias, posts do blog e eventos de exemplo

5. **Execute o servidor de desenvolvimento:**
```bash
npm run dev
```

6. **Acesse a aplicação:**
- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login: http://localhost:3000/login
- Área do Paciente: http://localhost:3000/paciente

## 📁 Estrutura do Projeto

```
clickcannabis-replica/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── admin/        # APIs administrativas
│   │   ├── auth/         # Autenticação
│   │   ├── consultations/# Consultas
│   │   ├── prescriptions/# Receitas
│   │   └── reports/      # Laudos
│   ├── admin/            # Área administrativa
│   ├── agendamento/      # Página de agendamento
│   ├── blog/              # Blog
│   ├── galeria/           # Galeria
│   └── sobre-nos/        # Sobre nós
├── components/            # Componentes React
│   ├── admin/            # Componentes admin
│   ├── about/             # Componentes sobre
│   ├── blog/              # Componentes blog
│   ├── consultation/      # Componentes consulta
│   ├── gallery/           # Componentes galeria
│   ├── home/              # Componentes homepage
│   └── layout/            # Layout (Navbar, Footer)
├── lib/                   # Bibliotecas e utilitários
│   ├── auth.ts           # Configuração NextAuth
│   ├── prisma.ts         # Cliente Prisma
│   ├── prescription-generator.ts  # Gerador de receitas PDF
│   └── report-generator.ts        # Gerador de laudos PDF
├── prisma/                # Prisma
│   └── schema.prisma     # Schema do banco
└── types/                 # TypeScript types
```

## 🔐 Autenticação

O sistema usa NextAuth com autenticação por credenciais. Para criar usuários:

1. **Criar usuário admin via Prisma Studio:**
```bash
npx prisma studio
```

2. **Ou criar via script:**
```typescript
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const password = await bcrypt.hash('senha123', 10);

await prisma.user.create({
  data: {
    email: 'admin@clickcannabis.com',
    name: 'Admin',
    password,
    role: 'ADMIN',
  },
});
```

## 📝 Funcionalidades Principais

### Sistema de Agendamento
1. Paciente seleciona patologias na homepage
2. Preenche formulário de agendamento
3. Sistema cria consulta e pagamento pendente
4. Médico realiza consulta via Google Meet
5. Médico emite receita (PDF gerado automaticamente)
6. Sistema gera laudo médico se necessário

### Área Administrativa
- Dashboard com métricas em tempo real
- Gestão completa de consultas
- Emissão de receitas médicas
- Geração de laudos em PDF
- Visualização de anamnese e histórico

### Geração de Documentos
- **Receitas Médicas**: PDF gerado automaticamente com dados do paciente, médico e medicamentos
- **Laudos Médicos**: PDF completo com anamnese, observações e prescrição

## 🚀 Deploy e Produção

Para colocar o sistema em produção, use a documentação organizada em:

- **[PRODUCAO_INDEX.md](PRODUCAO_INDEX.md)** – Índice de toda a documentação de produção (comece aqui).
- **[ANALISE_PRODUCAO.md](ANALISE_PRODUCAO.md)** – Análise do que falta e ordem de execução.
- **[CHECKLIST_PRODUCAO.md](CHECKLIST_PRODUCAO.md)** – Checklist para marcar antes e depois do deploy.

Resumo: migrar banco para PostgreSQL, configurar variáveis de ambiente (`.env.production.example`), limpar o projeto e fazer deploy (recomendado: Vercel).

---

## 🔄 Próximos Passos

Funcionalidades ainda a implementar:
- [ ] Integração com pagamentos (Stripe/Mercado Pago)
- [ ] Integração com WhatsApp Business API
- [ ] Sistema de gestão ANVISA (formulários e acompanhamento)
- [ ] Sistema de importação e rastreamento
- [ ] Área do paciente (histórico, documentos)
- [ ] Notificações por email
- [ ] Upload de imagens para eventos
- [ ] Sistema de comentários no blog

## 🛡️ Segurança

- Autenticação com NextAuth
- Validação de dados com Zod
- Proteção de rotas administrativas
- Sanitização de inputs
- Criptografia de senhas (bcrypt)

## 📚 Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **NextAuth** - Autenticação
- **Tailwind CSS** - Estilização
- **React Hook Form** - Formulários
- **Zod** - Validação
- **PDF-lib** - Geração de PDFs
- **React Hot Toast** - Notificações

## 📄 Licença

Este projeto é uma replicação educacional do modelo Click Cannabis.

## 🤝 Contribuindo

Este é um projeto de replicação. Para melhorias e correções, sinta-se à vontade para fazer pull requests.

---

**Desenvolvido com ❤️ replicando o modelo Click Cannabis**
