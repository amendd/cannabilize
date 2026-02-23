import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/error-handler';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * Exporta todos os dados pessoais do usuário em formato JSON
 * Conforme LGPD - Direito à portabilidade de dados
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const userId = session.user.id;

    // Buscar todos os dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        consultations: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                crm: true,
                specialization: true,
              },
            },
            prescription: {
              include: {
                medications: {
                  include: {
                    medication: true,
                  },
                },
              },
            },
            payment: true,
            files: true,
            testimonials: true,
          },
        },
        prescriptions: {
          include: {
            consultation: {
              select: {
                id: true,
                scheduledAt: true,
              },
            },
            doctor: {
              select: {
                id: true,
                name: true,
                crm: true,
              },
            },
            medications: {
              include: {
                medication: true,
              },
            },
            anvisaAuthorization: true,
          },
        },
        payments: {
          include: {
            consultation: {
              select: {
                id: true,
                scheduledAt: true,
              },
            },
          },
        },
        anvisaAuthorizations: {
          include: {
            prescription: {
              select: {
                id: true,
                issuedAt: true,
              },
            },
            import: true,
          },
        },
        patientPathologies: {
          include: {
            pathology: true,
          },
        },
        patientCard: {
          include: {
            activePrescription: {
              select: {
                id: true,
                issuedAt: true,
              },
            },
          },
        },
        consultationFiles: true,
        testimonials: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para exportação (remover senha e dados sensíveis)
    const exportData = {
      usuario: {
        id: user.id,
        nome: user.name,
        email: user.email,
        telefone: user.phone,
        cpf: user.cpf,
        dataNascimento: user.birthDate,
        endereco: user.address,
        role: user.role,
        dataCadastro: user.createdAt,
        ultimaAtualizacao: user.updatedAt,
      },
      consultas: user.consultations.map(c => ({
        id: c.id,
        dataAgendamento: c.scheduledAt,
        status: c.status,
        medico: c.doctor ? {
          nome: c.doctor.name,
          crm: c.doctor.crm,
          especializacao: c.doctor.specialization,
        } : null,
        anamnese: c.anamnesis,
        notas: c.notes,
        proximoRetorno: c.nextReturnDate,
        arquivos: c.files.map(f => ({
          nome: f.fileName,
          tipo: f.fileType,
          url: f.fileUrl,
          dataUpload: f.uploadedAt,
        })),
      })),
      receitas: user.prescriptions.map(p => ({
        id: p.id,
        dataEmissao: p.issuedAt,
        validade: p.expiresAt,
        status: p.status,
        medico: {
          nome: p.doctor.name,
          crm: p.doctor.crm,
        },
        medicamentos: p.medications.map(pm => ({
          medicamento: pm.medication.name,
          quantidade: pm.quantity,
          dosagem: pm.dosage,
          instrucoes: pm.instructions,
        })),
        autorizacaoAnvisa: p.anvisaAuthorization ? {
          numero: p.anvisaAuthorization.anvisaNumber,
          status: p.anvisaAuthorization.status,
          dataSubmissao: p.anvisaAuthorization.submittedAt,
          dataAprovacao: p.anvisaAuthorization.approvedAt,
        } : null,
      })),
      pagamentos: user.payments.map(p => ({
        id: p.id,
        valor: p.amount,
        moeda: p.currency,
        metodo: p.paymentMethod,
        status: p.status,
        dataPagamento: p.paidAt,
        dataCriacao: p.createdAt,
      })),
      patologias: user.patientPathologies.map(pp => ({
        nome: pp.pathology.name,
        descricao: pp.pathology.description,
      })),
      carteirinha: user.patientCard ? {
        numero: user.patientCard.cardNumber,
        status: user.patientCard.status,
        dataEmissao: user.patientCard.issuedAt,
        validade: user.patientCard.expiresAt,
      } : null,
      depoimentos: user.testimonials.map(t => ({
        avaliacao: t.rating,
        comentario: t.comment,
        aprovado: t.approved,
        data: t.createdAt,
      })),
      metadata: {
        dataExportacao: new Date().toISOString(),
        formato: 'JSON',
        versao: '1.0',
      },
    };

    // Log de auditoria
    await createAuditLog({
      userId,
      action: AuditAction.EXPORT,
      entity: AuditEntity.USER,
      entityId: userId,
      metadata: {
        format: 'JSON',
        timestamp: new Date().toISOString(),
      },
    });

    // Retornar como JSON
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dados-pessoais-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
