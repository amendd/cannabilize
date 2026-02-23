import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar todos os templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // PACIENT, DOCTOR, ADMIN

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const templates = await prisma.whatsAppTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Erro ao buscar templates:', error);
    
    // Verificar se é erro de tabela não existente
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('não existe')) {
      return NextResponse.json(
        { 
          error: 'Tabela de templates não existe no banco de dados. Execute: npx prisma db push',
          code: 'TABLE_NOT_FOUND',
          details: error?.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar templates',
        code: error?.code || 'UNKNOWN',
        details: error?.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      code,
      name,
      description,
      category,
      enabled,
      content,
      variables,
    } = body;

    // Validações
    if (!code || !name || !category || !content) {
      return NextResponse.json(
        { error: 'Código, nome, categoria e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['PACIENT', 'DOCTOR', 'ADMIN'].includes(category)) {
      return NextResponse.json(
        { error: 'Categoria inválida. Use: PACIENT, DOCTOR ou ADMIN' },
        { status: 400 }
      );
    }

    let template;
    if (id) {
      // Atualizar template existente
      template = await prisma.whatsAppTemplate.update({
        where: { id },
        data: {
          code,
          name,
          description: description || null,
          category,
          enabled: enabled ?? true,
          content,
          variables: variables ? JSON.stringify(variables) : null,
        },
      });
    } else {
      // Criar novo template
      // Verificar se código já existe
      const existing = await prisma.whatsAppTemplate.findUnique({
        where: { code },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Já existe um template com este código' },
          { status: 400 }
        );
      }

      template = await prisma.whatsAppTemplate.create({
        data: {
          code,
          name,
          description: description || null,
          category,
          enabled: enabled ?? true,
          content,
          defaultContent: content, // Salvar como padrão
          variables: variables ? JSON.stringify(variables) : null,
        },
      });
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Erro ao salvar template:', error);
    
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um template com este código' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Erro ao salvar template' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status (habilitar/desabilitar)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, enabled } = body;

    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'ID e status (enabled) são obrigatórios' },
        { status: 400 }
      );
    }

    const template = await prisma.whatsAppTemplate.update({
      where: { id },
      data: { enabled },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar template' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.whatsAppTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar template' },
      { status: 500 }
    );
  }
}
