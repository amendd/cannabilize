import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { createAuditLogAsync, AuditAction, AuditEntity } from './audit';
import { parseAdminMenuPermissions } from './admin-menu';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password.trim();

        // Consulta mínima para evitar erro "Unknown field" se o Prisma Client estiver desatualizado
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
            passwordChangedAt: true,
            deletedAt: true,
          },
        });

        if (!user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Login falhou: usuário não encontrado:', credentials.email);
          }
          return null;
        }
        if (!user.password) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Login falhou: conta sem senha (cadastro por link?)', user.email);
          }
          return null;
        }
        if ((user as any).deletedAt) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Login falhou: conta desativada (deletedAt)', user.email);
          }
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Login falhou: senha incorreta para', user.email);
          }
          return null;
        }

        // SUBADMIN: carrega adminMenuPermissions em query separada (evita campo inexistente no client antigo)
        let adminMenuPermissions: string[] | undefined;
        if (user.role === 'SUBADMIN') {
          try {
            const sub = await prisma.user.findUnique({
              where: { id: user.id },
              select: { adminMenuPermissions: true },
            });
            if (sub && (sub as any).adminMenuPermissions) {
              adminMenuPermissions = parseAdminMenuPermissions((sub as any).adminMenuPermissions);
            }
          } catch {
            // Prisma client desatualizado sem o campo; ignorar
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          passwordChangedAt: (user as any).passwordChangedAt?.getTime() || 0,
          adminMenuPermissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.passwordChangedAt = (user as any).passwordChangedAt || 0;
        token.adminMenuPermissions = (user as any).adminMenuPermissions;
        createAuditLogAsync({
          userId: user.id,
          action: AuditAction.LOGIN,
          entity: AuditEntity.USER,
          entityId: user.id,
        });
      }
      
      // Se a senha foi alterada, invalidar token
      // Funciona apenas se o campo passwordChangedAt existir (após migração)
      if (trigger === 'update') {
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { 
              passwordChangedAt: true,
              updatedAt: true, // Fallback: usar updatedAt se passwordChangedAt não existir
            },
          });
          
          if (currentUser) {
            // Se passwordChangedAt existe, usar ele
            if ((currentUser as any).passwordChangedAt) {
              const passwordChangedAt = (currentUser as any).passwordChangedAt.getTime();
              const tokenPasswordChangedAt = (token.passwordChangedAt as number) || 0;
              
              if (passwordChangedAt > tokenPasswordChangedAt) {
                throw new Error('Sessão inválida. Faça login novamente.');
              }
            }
            // Se não existe, não invalidar (comportamento antigo)
            // Em produção, após migração, sempre usar passwordChangedAt
          }
        } catch (error: any) {
          // Se der erro de campo não encontrado, ignorar (tabela ainda não migrada)
          if (!error?.message?.includes('Sessão inválida')) {
            // Outros erros, ignorar silenciosamente
          } else {
            throw error; // Re-lançar erro de sessão inválida
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.adminMenuPermissions = token.adminMenuPermissions as string[] | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // Duração da sessão: 3 dias (em segundos)
    maxAge: 3 * 24 * 60 * 60,
  },
  // Por padrão o NextAuth NÃO define maxAge no cookie de sessão, então o
  // navegador trata como "session cookie" e apaga ao fechar o navegador/aba.
  // Definindo maxAge aqui, o cookie persiste e o usuário continua logado.
  cookies: {
    sessionToken: {
      name: (process.env.NEXTAUTH_URL?.startsWith('https') ?? false)
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https') ?? false,
        maxAge: 3 * 24 * 60 * 60, // 3 dias
      },
    },
  },
};
