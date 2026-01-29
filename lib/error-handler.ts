import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ApiError {
  error: string;
  details?: any;
  code?: string;
}

/**
 * Trata erros e retorna mensagens específicas e amigáveis
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error);

  // Erro de validação Zod
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    const field = firstError.path.join('.');
    return NextResponse.json(
      {
        error: `Dados inválidos: ${field} - ${firstError.message}`,
        details: error.errors,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Violação de constraint única
        const field = error.meta?.target?.[0] || 'campo';
        const fieldName = getFieldName(field);
        return NextResponse.json(
          {
            error: `${fieldName} já está cadastrado. Use outro ${fieldName.toLowerCase()}.`,
            code: 'DUPLICATE_ENTRY',
            details: { field },
          },
          { status: 400 }
        );

      case 'P2025':
        // Registro não encontrado
        return NextResponse.json(
          {
            error: 'Registro não encontrado.',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );

      case 'P2003':
        // Violação de foreign key
        return NextResponse.json(
          {
            error: 'Não é possível realizar esta operação. Existem registros relacionados.',
            code: 'FOREIGN_KEY_CONSTRAINT',
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            error: 'Erro ao processar solicitação no banco de dados.',
            code: 'DATABASE_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          },
          { status: 500 }
        );
    }
  }

  // Erro do Prisma (outros tipos)
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return NextResponse.json(
      {
        error: 'Erro inesperado no banco de dados.',
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }

  // Erro com mensagem
  if (error instanceof Error) {
    // Erros conhecidos com mensagens específicas
    if (error.message.includes('já está cadastrado') || 
        error.message.includes('já existe')) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'DUPLICATE_ENTRY',
        },
        { status: 400 }
      );
    }

    if (error.message.includes('não encontrado') || 
        error.message.includes('não existe')) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (error.message.includes('não autorizado') || 
        error.message.includes('permissão')) {
      return NextResponse.json(
        {
          error: error.message || 'Você não tem permissão para realizar esta ação.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Erro genérico com mensagem
    return NextResponse.json(
      {
        error: error.message || 'Erro ao processar solicitação.',
        code: 'UNKNOWN_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }

  // Erro desconhecido
  return NextResponse.json(
    {
      error: 'Erro inesperado. Tente novamente mais tarde.',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Converte nome do campo do banco para nome amigável
 */
function getFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    email: 'Email',
    crm: 'CRM',
    cpf: 'CPF',
    phone: 'Telefone',
    name: 'Nome',
  };

  return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
}

/**
 * Valida se o usuário tem permissão
 */
export function checkAuth(session: any, requiredRole?: string): NextResponse | null {
  if (!session) {
    return NextResponse.json(
      {
        error: 'Você precisa estar autenticado para realizar esta ação.',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return NextResponse.json(
      {
        error: `Você não tem permissão para realizar esta ação. Apenas ${requiredRole === 'ADMIN' ? 'administradores' : 'médicos'} podem acessar.`,
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  return null;
}
