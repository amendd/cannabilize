import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarPagamentoPaciente() {
  try {
    const cpf = '02531645597';
    const email = 'edsib@gmail.com';
    const nome = 'edson carlos nascimento';

    console.log('🔍 Buscando paciente...\n');
    console.log(`CPF: ${cpf}`);
    console.log(`Email: ${email}`);
    console.log(`Nome: ${nome}\n`);

    // Buscar paciente por CPF ou email
    const paciente = await prisma.user.findFirst({
      where: {
        OR: [
          { cpf: cpf },
          { email: email.toLowerCase() },
          { name: { contains: nome, mode: 'insensitive' } },
        ],
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
      console.log('❌ Paciente não encontrado!');
      return;
    }

    console.log('✅ Paciente encontrado:');
    console.log(`   ID: ${paciente.id}`);
    console.log(`   Nome: ${paciente.name}`);
    console.log(`   Email: ${paciente.email}`);
    console.log(`   CPF: ${paciente.cpf || 'Não informado'}`);
    console.log(`   Telefone: ${paciente.phone || 'Não informado'}\n`);

    console.log(`📋 Total de consultas: ${paciente.consultations.length}\n`);

    if (paciente.consultations.length === 0) {
      console.log('⚠️  Nenhuma consulta encontrada para este paciente.');
      return;
    }

    // Buscar consulta de 28 de janeiro de 2026
    const dataConsulta = new Date('2026-01-28');
    const consultaEspecifica = paciente.consultations.find((c) => {
      const dataConsultaFormatada = new Date(c.scheduledAt);
      return (
        dataConsultaFormatada.getDate() === dataConsulta.getDate() &&
        dataConsultaFormatada.getMonth() === dataConsulta.getMonth() &&
        dataConsultaFormatada.getFullYear() === dataConsulta.getFullYear()
      );
    });

    if (consultaEspecifica) {
      console.log('📅 CONSULTA DE 28 DE JANEIRO DE 2026:\n');
      console.log(`   ID da Consulta: ${consultaEspecifica.id}`);
      console.log(`   Data/Hora: ${new Date(consultaEspecifica.scheduledAt).toLocaleString('pt-BR')}`);
      console.log(`   Status: ${consultaEspecifica.status}`);
      console.log(`   Médico: ${consultaEspecifica.doctor?.user?.name || 'Não atribuído'}`);

      if (consultaEspecifica.payment) {
        console.log('\n💰 PAGAMENTO:');
        console.log(`   ID do Pagamento: ${consultaEspecifica.payment.id}`);
        console.log(`   Valor: R$ ${consultaEspecifica.payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Status: ${consultaEspecifica.payment.status}`);
        console.log(`   Método: ${consultaEspecifica.payment.paymentMethod || 'Não informado'}`);
        console.log(`   Criado em: ${new Date(consultaEspecifica.payment.createdAt).toLocaleString('pt-BR')}`);
        console.log(`   Pago em: ${consultaEspecifica.payment.paidAt ? new Date(consultaEspecifica.payment.paidAt).toLocaleString('pt-BR') : 'Não pago'}`);
        console.log(`   Transaction ID: ${consultaEspecifica.payment.transactionId || 'Não informado'}`);
        console.log(`   Stripe Payment ID: ${consultaEspecifica.payment.stripePaymentId || 'Não informado'}`);
      } else {
        console.log('\n⚠️  Nenhum pagamento associado a esta consulta.');
      }

      if (consultaEspecifica.prescription) {
        console.log('\n📄 RECEITA:');
        console.log(`   ID da Receita: ${consultaEspecifica.prescription.id}`);
        console.log(`   Emitida em: ${new Date(consultaEspecifica.prescription.issuedAt).toLocaleString('pt-BR')}`);
        console.log(`   Status: ${consultaEspecifica.prescription.status}`);
      } else {
        console.log('\n⚠️  Nenhuma receita emitida para esta consulta.');
      }

      // Verificar se conta para saldo disponível do médico
      if (consultaEspecifica.doctorId) {
        const contaParaSaldo =
          consultaEspecifica.status === 'COMPLETED' &&
          consultaEspecifica.prescription !== null &&
          consultaEspecifica.payment?.status === 'PAID';

        console.log('\n💵 CONTA PARA SALDO DO MÉDICO:');
        console.log(`   ${contaParaSaldo ? '✅ SIM' : '❌ NÃO'}`);
        if (!contaParaSaldo) {
          const motivos = [];
          if (consultaEspecifica.status !== 'COMPLETED') motivos.push('Consulta não está COMPLETED');
          if (!consultaEspecifica.prescription) motivos.push('Não tem receita emitida');
          if (consultaEspecifica.payment?.status !== 'PAID') motivos.push(`Pagamento não está PAID (status: ${consultaEspecifica.payment?.status})`);
          console.log(`   Motivo: ${motivos.join(', ')}`);
        }
      }
    } else {
      console.log('⚠️  Consulta de 28 de janeiro de 2026 não encontrada.');
      console.log('\n📋 Todas as consultas do paciente:\n');
      paciente.consultations.forEach((c, index) => {
        console.log(`${index + 1}. ${new Date(c.scheduledAt).toLocaleDateString('pt-BR')} - Status: ${c.status}`);
        if (c.payment) {
          console.log(`   Pagamento: R$ ${c.payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Status: ${c.payment.status}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('RESUMO:');
    console.log('='.repeat(60));
    if (consultaEspecifica) {
      if (consultaEspecifica.payment) {
        console.log(`✅ Pagamento encontrado`);
        console.log(`   Valor: R$ ${consultaEspecifica.payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Status: ${consultaEspecifica.payment.status}`);
        console.log(`   ${consultaEspecifica.payment.status === 'PAID' ? '✅ PAGO' : '⏳ PENDENTE'}`);
      } else {
        console.log('❌ Nenhum pagamento encontrado para esta consulta');
      }
    } else {
      console.log('❌ Consulta de 28/01/2026 não encontrada');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar informações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPagamentoPaciente();
