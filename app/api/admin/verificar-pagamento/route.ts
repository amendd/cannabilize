import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para verificar status e valor do pagamento de um paciente específico
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get('cpf');
    const email = searchParams.get('email');
    const nome = searchParams.get('nome');
    const dataConsulta = searchParams.get('data'); // formato: YYYY-MM-DD

    if (!cpf && !email && !nome) {
      return NextResponse.json(
        { error: 'Informe CPF, email ou nome do paciente' },
        { status: 400 }
      );
    }

    // Buscar paciente
    const where: any = {};
    if (cpf) {
      where.cpf = cpf.replace(/\D/g, ''); // Remove formatação
    }
    if (email) {
      where.email = email.toLowerCase();
    }
    if (nome) {
      where.name = { contains: nome, mode: 'insensitive' };
    }

    const paciente = await prisma.user.findFirst({
      where: {
        role: 'PATIENT',
        OR: cpf && email && nome
          ? [{ cpf: where.cpf }, { email: where.email }, { name: where.name }]
          : cpf && email
          ? [{ cpf: where.cpf }, { email: where.email }]
          : cpf && nome
          ? [{ cpf: where.cpf }, { name: where.name }]
          : email && nome
          ? [{ email: where.email }, { name: where.name }]
          : cpf
          ? [{ cpf: where.cpf }]
          : email
          ? [{ email: where.email }]
          : [{ name: where.name }],
      },
      include: {
        consultations: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                paidAt: true,
                createdAt: true,
                paymentMethod: true,
                transactionId: true,
                stripePaymentId: true,
              },
            },
            prescription: {
              select: {
                id: true,
                issuedAt: true,
                status: true,
              },
            },
            doctor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            scheduledAt: 'desc',
          },
        },
      },
    });

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
    }

    // Filtrar consulta específica se data fornecida
    let consultaEspecifica = null;
    if (dataConsulta) {
      const data = new Date(dataConsulta);
      consultaEspecifica = paciente.consultations.find((c) => {
        const dataConsultaFormatada = new Date(c.scheduledAt);
        return (
          dataConsultaFormatada.getDate() === data.getDate() &&
          dataConsultaFormatada.getMonth() === data.getMonth() &&
          dataConsultaFormatada.getFullYear() === data.getFullYear()
        );
      });
    }

    const consultaParaRetornar = consultaEspecifica || paciente.consultations[0];

    if (!consultaParaRetornar) {
      return NextResponse.json({
        paciente: {
          id: paciente.id,
          nome: paciente.name,
          email: paciente.email,
          cpf: paciente.cpf,
          telefone: paciente.phone,
        },
        consultas: [],
        mensagem: 'Nenhuma consulta encontrada para este paciente',
      });
    }

    // Verificar se conta para saldo disponível do médico
    let contaParaSaldo = false;
    let motivoNaoConta = null;
    if (consultaParaRetornar.doctorId) {
      contaParaSaldo =
        consultaParaRetornar.status === 'COMPLETED' &&
        consultaParaRetornar.prescription !== null &&
        consultaParaRetornar.payment?.status === 'PAID';

      if (!contaParaSaldo) {
        const motivos = [];
        if (consultaParaRetornar.status !== 'COMPLETED') {
          motivos.push(`Consulta não está COMPLETED (status: ${consultaParaRetornar.status})`);
        }
        if (!consultaParaRetornar.prescription) {
          motivos.push('Não tem receita emitida');
        }
        if (consultaParaRetornar.payment?.status !== 'PAID') {
          motivos.push(`Pagamento não está PAID (status: ${consultaParaRetornar.payment?.status || 'N/A'})`);
        }
        motivoNaoConta = motivos.join(', ');
      }
    }

    return NextResponse.json({
      paciente: {
        id: paciente.id,
        nome: paciente.name,
        email: paciente.email,
        cpf: paciente.cpf,
        telefone: paciente.phone,
      },
      consulta: {
        id: consultaParaRetornar.id,
        dataHora: consultaParaRetornar.scheduledAt,
        status: consultaParaRetornar.status,
        medico: consultaParaRetornar.doctor?.user?.name || 'Não atribuído',
        temReceita: !!consultaParaRetornar.prescription,
        receita: consultaParaRetornar.prescription
          ? {
              id: consultaParaRetornar.prescription.id,
              emitidaEm: consultaParaRetornar.prescription.issuedAt,
              status: consultaParaRetornar.prescription.status,
            }
          : null,
        temPagamento: !!consultaParaRetornar.payment,
        pagamento: consultaParaRetornar.payment
          ? {
              id: consultaParaRetornar.payment.id,
              valor: consultaParaRetornar.payment.amount,
              status: consultaParaRetornar.payment.status,
              metodo: consultaParaRetornar.payment.paymentMethod,
              criadoEm: consultaParaRetornar.payment.createdAt,
              pagoEm: consultaParaRetornar.payment.paidAt,
              transactionId: consultaParaRetornar.payment.transactionId,
              stripePaymentId: consultaParaRetornar.payment.stripePaymentId,
            }
          : null,
        contaParaSaldoMedico: contaParaSaldo,
        motivoNaoContaParaSaldo: motivoNaoConta,
      },
      todasConsultas: paciente.consultations.map((c) => ({
        id: c.id,
        dataHora: c.scheduledAt,
        status: c.status,
        temReceita: !!c.prescription,
        temPagamento: !!c.payment,
        pagamentoStatus: c.payment?.status || null,
        pagamentoValor: c.payment?.amount || null,
      })),
    });
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar informações', details: String(error) },
      { status: 500 }
    );
  }
}
