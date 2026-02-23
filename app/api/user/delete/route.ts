import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/error-handler';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import bcrypt from 'bcryptjs';

/**
 * Exclui a conta do usuário e seus dados pessoais
 * Conforme LGPD - Direito ao esquecimento
 * 
 * IMPORTANTE: Dados médicos podem ser mantidos por obrigação legal (prontuários)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const { password, confirmDelete } = body;

    // Validações de segurança
    if (!password) {
      return NextResponse.json(
        { error: 'Senha é obrigatória para confirmar exclusão' },
        { status: 400 }
      );
    }

    if (confirmDelete !== 'CONFIRMAR EXCLUSÃO') {
      return NextResponse.json(
        { error: 'Confirmação de exclusão inválida' },
        { status: 400 }
      );
    }

    // Verificar senha
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Conta sem senha. Entre em contato com o suporte.' },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Não permitir exclusão de contas ADMIN (por segurança)
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Contas de administrador não podem ser excluídas através desta interface. Entre em contato com o suporte.' },
        { status: 403 }
      );
    }

    // Log de auditoria ANTES da exclusão
    await createAuditLog({
      userId,
      action: AuditAction.DELETE_ACCOUNT,
      entity: AuditEntity.USER,
      entityId: userId,
      metadata: {
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString(),
      },
    });

    // Excluir dados pessoais (anonimizar ou excluir conforme LGPD)
    // NOTA: Dados médicos podem precisar ser mantidos por obrigação legal
    // Consultar com advogado sobre retenção de prontuários
    
    await prisma.$transaction(async (tx) => {
      // Anonimizar dados pessoais do usuário
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.local`,
          name: 'Usuário Excluído',
          phone: null,
          cpf: null,
          address: null,
          password: null, // Remove senha
          image: null,
          // Manter createdAt e updatedAt para auditoria
        },
      });

      // Cancelar consultas futuras
      await tx.consultation.updateMany({
        where: {
          patientId: userId,
          status: 'SCHEDULED',
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Cancelar convites pendentes
      await tx.consultationRescheduleInvite.updateMany({
        where: {
          patientId: userId,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Excluir tokens de setup
      await tx.accountSetupToken.deleteMany({
        where: { userId },
      });

      // NOTA: Manter consultas, receitas e pagamentos por obrigação legal
      // Mas podem ser anonimizados se necessário
    });

    return NextResponse.json({
      message: 'Conta excluída com sucesso. Seus dados pessoais foram removidos conforme LGPD.',
      note: 'Dados médicos podem ser mantidos por obrigação legal de retenção de prontuários.',
    });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir conta. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
