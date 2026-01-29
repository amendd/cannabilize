/**
 * Script para criar uma receita de teste
 * Execute: npx tsx scripts/criar-receita-teste.ts
 * 
 * Este script cria uma receita de teste com dados completos para visualizar o novo design
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function criarReceitaTeste() {
  try {
    console.log('🔍 Buscando consulta disponível...');

    // Buscar uma consulta COMPLETED sem receita
    let consultation = await prisma.consultation.findFirst({
      where: {
        status: 'COMPLETED',
        prescription: null,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    // Se não encontrar, buscar qualquer consulta e marcar como COMPLETED
    if (!consultation) {
      console.log('⚠️  Nenhuma consulta COMPLETED encontrada. Buscando qualquer consulta...');
      
      consultation = await prisma.consultation.findFirst({
        include: {
          patient: true,
          doctor: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      });

      if (!consultation) {
        console.error('❌ Nenhuma consulta encontrada no banco de dados.');
        console.log('💡 Crie uma consulta primeiro através do sistema.');
        return;
      }

      // Marcar como COMPLETED
      consultation = await prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: 'COMPLETED' },
        include: {
          patient: true,
          doctor: {
            include: {
              user: true,
            },
          },
        },
      });

      console.log(`✅ Consulta ${consultation.id} marcada como COMPLETED`);
    }

    console.log(`📋 Usando consulta: ${consultation.id}`);
    console.log(`👤 Paciente: ${consultation.patient.name}`);
    console.log(`👨‍⚕️ Médico: ${consultation.doctor?.name || 'N/A'}`);

    // Buscar medicamentos disponíveis
    const medications = await prisma.medication.findMany({
      where: { active: true },
      take: 2,
    });

    if (medications.length === 0) {
      console.error('❌ Nenhum medicamento encontrado no banco de dados.');
      console.log('💡 Crie medicamentos primeiro através do admin (/admin/medicamentos)');
      return;
    }

    console.log(`💊 Usando ${medications.length} medicamento(s) para a receita`);

    // Criar dados da receita com informações completas
    const prescriptionData = {
      medications: medications.map((med, index) => ({
        medicationId: med.id,
        medicationName: med.name,
        productType: med.form || 'Óleo',
        composition: med.activeIngredient || `CBD: ${10 + index * 5}mg/mL, THC: ${index * 2}mg/mL`,
        spectrum: index === 0 ? 'Full Spectrum' : 'Broad Spectrum',
        route: 'Sublingual',
        quantity: index === 0 ? '1 frasco de 30mL' : '2 frascos de 20mL',
        dosage: `1 gota ${2 + index}x ao dia`,
        initialDose: '1 gota 1x ao dia',
        escalation: 'Aumentar 1 gota a cada 3 dias até atingir dose ideal',
        maxDose: `${5 + index * 2} gotas por dia`,
        suggestedTimes: 'Manhã e noite',
        duration: '60 dias',
        instructions: 'Tomar após as refeições. Manter em local fresco e seco.',
      })),
      observations: 'Paciente deve iniciar com dose baixa e aumentar gradualmente conforme orientação médica. Em caso de efeitos adversos, suspender uso e entrar em contato.',
      diagnosis: 'Dor neuropática crônica refratária a tratamentos convencionais. Ansiedade generalizada com impacto significativo na qualidade de vida.',
      cid10: 'G50.9',
      emissionLocation: 'Brasil',
    };

    // Verificar se já existe receita para esta consulta
    const existingPrescription = await prisma.prescription.findFirst({
      where: { consultationId: consultation.id },
    });

    let prescription;
    if (existingPrescription) {
      // Atualizar receita existente
      prescription = await prisma.prescription.update({
        where: { id: existingPrescription.id },
        data: {
          prescriptionData: JSON.stringify(prescriptionData),
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          status: 'ISSUED',
        },
      });
      console.log(`✅ Receita existente atualizada: ${prescription.id}`);
    } else {
      // Criar nova receita
      prescription = await prisma.prescription.create({
        data: {
          consultationId: consultation.id,
          patientId: consultation.patientId,
          doctorId: consultation.doctorId || consultation.doctor?.id || '',
          prescriptionData: JSON.stringify(prescriptionData),
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          status: 'ISSUED',
        },
      });
      console.log(`✅ Nova receita criada: ${prescription.id}`);
    }

    // Gerar PDF (simular chamada da API)
    console.log('\n📄 Para visualizar a receita:');
    console.log(`   Acesse: http://localhost:3001/admin/consultas/${consultation.id}`);
    console.log(`   Ou: http://localhost:3000/admin/consultas/${consultation.id}`);
    console.log('\n✨ Receita de teste criada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar receita de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criarReceitaTeste();
