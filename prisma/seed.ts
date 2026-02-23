import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY = 'MIN_ADVANCE_BOOKING_MINUTES_ONLINE';
const MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY = 'MIN_ADVANCE_BOOKING_MINUTES_OFFLINE';

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar ou atualizar usuário admin (senha sempre admin123 ao rodar o seed)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cannabilize.com.br' },
    update: {
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      deletedAt: null,
    },
    create: {
      email: 'admin@cannabilize.com.br',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin criado/atualizado:', admin.email, '(senha: admin123)');

  // Criar médico
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@cannabilize.com.br' },
    update: {},
    create: {
      email: 'doctor@cannabilize.com.br',
      name: 'Dr. João Silva',
      password: doctorPassword,
      role: 'DOCTOR',
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { crm: 'CRM123456' },
    update: { acceptsOnlineBooking: true },
    create: {
      name: 'Dr. João Silva',
      crm: 'CRM123456',
      email: 'doctor@cannabilize.com.br',
      specialization: 'Cannabis Medicinal',
      active: true,
      userId: doctorUser.id,
      acceptsOnlineBooking: true,
    },
  });
  console.log('✅ Médico criado:', doctor.name);

  // Criar engenheiro agrônomo (área /engenheiro)
  const engPassword = await bcrypt.hash('eng123', 10);
  const engUser = await prisma.user.upsert({
    where: { email: 'eng@cannabilize.com.br' },
    update: { password: engPassword, name: 'Eng. Agrônomo Silva', role: 'AGRONOMIST', deletedAt: null },
    create: {
      email: 'eng@cannabilize.com.br',
      name: 'Eng. Agrônomo Silva',
      password: engPassword,
      role: 'AGRONOMIST',
    },
  });
  console.log('✅ Engenheiro agrônomo criado:', engUser.email, '(senha: eng123)');

  // Criar disponibilidade do médico (Segunda a Sexta, 9h-18h)
  await prisma.doctorAvailability.deleteMany({
    where: { doctorId: doctor.id },
  });

  const disponibilidades = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', duration: 30 }, // Segunda
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', duration: 30 }, // Terça
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', duration: 30 }, // Quarta
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', duration: 30 }, // Quinta
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', duration: 30 }, // Sexta
  ];

  for (const disponibilidade of disponibilidades) {
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctor.id,
        ...disponibilidade,
        active: true,
      },
    });
  }
  console.log(`✅ ${disponibilidades.length} disponibilidades criadas (Segunda a Sexta, 9h-18h)`);

  // Configuração de antecedência para agendamentos (30 min quando médico online, 2h quando offline)
  await prisma.systemConfig.upsert({
    where: { key: MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY },
    update: { value: '30' },
    create: { key: MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY, value: '30' },
  });
  await prisma.systemConfig.upsert({
    where: { key: MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY },
    update: { value: '120' },
    create: { key: MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY, value: '120' },
  });
  console.log('✅ Antecedência mínima: 30 min (médico online), 120 min (médico offline)');

  // Contato da clínica e valor da consulta (evita placeholder em produção)
  await prisma.systemConfig.upsert({
    where: { key: 'CONTACT_PHONE' },
    update: {},
    create: { key: 'CONTACT_PHONE', value: '(11) 99999-9999' },
  });
  await prisma.systemConfig.upsert({
    where: { key: 'CONTACT_EMAIL' },
    update: {},
    create: { key: 'CONTACT_EMAIL', value: 'contato@cannabilizi.com.br' },
  });
  await prisma.systemConfig.upsert({
    where: { key: 'CONSULTATION_DEFAULT_AMOUNT' },
    update: {},
    create: { key: 'CONSULTATION_DEFAULT_AMOUNT', value: '50' },
  });
  console.log('✅ Contato e valor da consulta configurados');

  // Criar conta financeira genérica do médico (para área financeira não quebrar)
  await prisma.doctorPayoutAccount.upsert({
    where: { doctorId: doctor.id },
    update: {},
    create: {
      doctorId: doctor.id,
      type: 'PIX',
      pixKey: 'doctor-financeiro@exemplo.com',
      pixKeyType: 'EMAIL',
      holderName: doctor.name,
      notes: 'Conta PIX padrão para testes.',
    },
  });
  console.log('✅ Conta financeira padrão do médico criada');

  // Criar patologias
  const pathologies = [
    'Ansiedade',
    'Depressão',
    'Dores',
    'Epilepsia',
    'Insônia',
    'Autismo',
    'Enxaqueca',
    'Fibromialgia',
    'Parkinson',
    'TDAH',
  ];

  for (const pathologyName of pathologies) {
    await prisma.pathology.upsert({
      where: { name: pathologyName },
      update: {},
      create: {
        name: pathologyName,
        active: true,
      },
    });
  }
  console.log(`✅ ${pathologies.length} patologias criadas`);

  // Criar posts do blog
  const blogPosts = [
    {
      title: 'Click Hemp: Tudo que você precisa saber!',
      slug: 'click-hemp-tudo-que-precisa-saber',
      excerpt: 'Guia completo sobre a Click Hemp e como funciona o tratamento com cannabis medicinal.',
      content: 'Conteúdo completo do artigo...',
      category: 'Guia Click',
      tags: ['cannabis', 'medicinal', 'guia'],
      published: true,
      publishedAt: new Date(),
    },
    {
      title: 'Canabidiol (CBD): entenda como funciona',
      slug: 'canabidiol-cbd-como-funciona',
      excerpt: 'Descubra como o CBD funciona no organismo e seus benefícios terapêuticos.',
      content: 'Conteúdo completo do artigo...',
      category: 'CBD',
      tags: ['cbd', 'canabidiol', 'benefícios'],
      published: true,
      publishedAt: new Date(),
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        tags: Array.isArray(post.tags) ? JSON.stringify(post.tags) : post.tags,
      },
    });
  }
  console.log(`✅ ${blogPosts.length} posts do blog criados`);

  // Criar eventos
  const events = [
    {
      title: 'CannabiLizi Runner',
      slug: 'cannalize-runner',
      description: 'Evento de corrida organizada pela CannabiLizi no RJ',
      eventDate: new Date('2024-06-15'),
      location: 'Rio de Janeiro, RJ',
      active: true,
    },
    {
      title: 'Praia do Arpoador',
      slug: 'arpoador',
      description: 'Campanha de limpeza na praia do Arpoador',
      eventDate: new Date('2024-07-20'),
      location: 'Praia do Arpoador, RJ',
      active: true,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: {},
      create: event,
    });
  }
  console.log(`✅ ${events.length} eventos criados`);

  // Criar alguns medicamentos genéricos para o admin e prescrições
  const medications = [
    {
      name: 'Óleo de Cannabis Full Spectrum 20:1',
      productType: 'OIL',
      pharmaceuticalForm: 'Óleo oral',
      activePrinciples: JSON.stringify(['CBD', 'THC']),
      cbdConcentrationValue: 200,
      cbdConcentrationUnit: 'MG_PER_ML',
      thcConcentrationValue: 10,
      thcConcentrationUnit: 'MG_PER_ML',
      otherCannabinoids: JSON.stringify([{ name: 'CBG', value: 5, unit: 'MG_PER_ML' }]),
      spectrum: 'FULL_SPECTRUM',
      administrationRoute: 'SUBLINGUAL',
      dispensingUnit: 'Frasco 30 mL',
      allowsThc: true,
      regulatoryClassification: 'CBD_THC',
      supplier: 'Associação CannaBilize',
      description:
        'Óleo full spectrum com predominância de CBD, indicado como terapia adjuvante para dor crônica, ansiedade e distúrbios do sono.',
      order: 0,
    },
    {
      name: 'Gummies de CBD 10 mg',
      productType: 'GUMMIES',
      pharmaceuticalForm: 'Goma mastigável',
      activePrinciples: JSON.stringify(['CBD']),
      cbdConcentrationValue: 10,
      cbdConcentrationUnit: 'MG_PER_UNIT',
      thcConcentrationValue: 0,
      thcConcentrationUnit: 'MG_PER_UNIT',
      otherCannabinoids: JSON.stringify([]),
      spectrum: 'BROAD_SPECTRUM',
      administrationRoute: 'ORAL',
      dispensingUnit: 'Unidade (gummy)',
      allowsThc: false,
      regulatoryClassification: 'CBD_ONLY',
      supplier: 'Associação CannaBilize',
      description:
        'Gomas mastigáveis com CBD, sem THC detectável, indicadas para uso diurno em quadros leves de ansiedade e estresse.',
      order: 1,
    },
  ];

  for (const med of medications) {
    await prisma.medication.upsert({
      where: { name: med.name },
      update: {},
      create: {
        ...med,
      },
    });
  }
  console.log(`✅ ${medications.length} medicamentos genéricos criados`);

  // ——— Dados para os 3 dashboards (ERP, GPP, IFP) ———
  const patientPassword = await bcrypt.hash('paciente123', 10);
  const patient1 = await prisma.user.upsert({
    where: { email: 'paciente1@exemplo.com' },
    update: {},
    create: {
      email: 'paciente1@exemplo.com',
      name: 'Maria Santos',
      password: patientPassword,
      role: 'PATIENT',
      phone: '+5521999990001',
    },
  });
  const patient2 = await prisma.user.upsert({
    where: { email: 'paciente2@exemplo.com' },
    update: {},
    create: {
      email: 'paciente2@exemplo.com',
      name: 'Carlos Oliveira',
      password: patientPassword,
      role: 'PATIENT',
      phone: '+5521999990002',
    },
  });
  console.log('✅ 2 pacientes de exemplo criados (ERP/GPP/IFP)');

  const org1 = await prisma.organization.upsert({
    where: { id: 'seed-org-1' },
    update: {},
    create: {
      id: 'seed-org-1',
      name: 'Associação Cannabis Medicinal',
      type: 'ASSOCIATION',
      document: '12.345.678/0001-90',
      email: 'contato@assoc-cannabis.org',
      phone: '+5521988880001',
      address: 'Av. Exemplo, 100 - Rio de Janeiro, RJ',
      active: true,
    },
  });
  const org2 = await prisma.organization.upsert({
    where: { id: 'seed-org-2' },
    update: {},
    create: {
      id: 'seed-org-2',
      name: 'Clínica CannabiLize',
      type: 'CLINIC',
      document: '98.765.432/0001-10',
      email: 'contato@clinicacannabilize.com.br',
      phone: '+5521977770002',
      active: true,
    },
  });
  console.log('✅ 2 associações/organizações criadas (ERP)');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(10, 0, 0, 0);

  const consultation1 = await prisma.consultation.upsert({
    where: { id: 'seed-cons-1' },
    update: {},
    create: {
      id: 'seed-cons-1',
      patientId: patient1.id,
      doctorId: doctor.id,
      scheduledAt: lastWeek,
      scheduledDate: lastWeek.toISOString().slice(0, 10),
      scheduledTime: '10:00',
      status: 'COMPLETED',
      meetingPlatform: 'ZOOM',
    },
  });
  const consultation2 = await prisma.consultation.upsert({
    where: { id: 'seed-cons-2' },
    update: {},
    create: {
      id: 'seed-cons-2',
      patientId: patient2.id,
      doctorId: doctor.id,
      scheduledAt: tomorrow,
      scheduledDate: tomorrow.toISOString().slice(0, 10),
      scheduledTime: '14:00',
      status: 'SCHEDULED',
      meetingPlatform: 'GOOGLE_MEET',
    },
  });
  console.log('✅ 2 consultas de exemplo criadas (1 concluída, 1 agendada)');

  let prescriptionForConsult1: { id: string } | null = null;
  const oilMed = await prisma.medication.findUnique({ where: { name: 'Óleo de Cannabis Full Spectrum 20:1' } });
  if (oilMed) {
    const issuedAt = new Date(lastWeek);
    issuedAt.setHours(12, 0, 0, 0);
    const expiresAt = new Date(issuedAt);
    expiresAt.setMonth(expiresAt.getMonth() + 3);
    const prescriptionData = {
      diagnosis: 'Ansiedade generalizada',
      cid10: 'F41.1',
      medications: [
        { medicationName: oilMed.name, dosage: '5 gotas 2x ao dia', quantity: '1 frasco 30 mL', route: 'SUBLINGUAL' },
      ],
      observations: 'Uso contínuo. Retorno em 90 dias.',
      emissionLocation: 'Rio de Janeiro, RJ',
    };
    const prescription = await prisma.prescription.upsert({
      where: { consultationId: consultation1.id },
      update: {},
      create: {
        consultationId: consultation1.id,
        patientId: patient1.id,
        doctorId: doctor.id,
        prescriptionData: JSON.stringify(prescriptionData),
        issuedAt,
        expiresAt,
        status: 'ISSUED',
      },
    });
    prescriptionForConsult1 = { id: prescription.id };
    await prisma.prescriptionMedication.upsert({
      where: {
        prescriptionId_medicationId: { prescriptionId: prescription.id, medicationId: oilMed.id },
      },
      update: {},
      create: {
        prescriptionId: prescription.id,
        medicationId: oilMed.id,
        dosage: '5 gotas 2x ao dia',
        quantity: '1 frasco 30 mL',
        instructions: 'Sublingual, manter 1 minuto.',
      },
    });
    console.log('✅ 1 prescrição com medicamento vinculada à consulta (GPP)');
  }

  const order1 = await prisma.erpOrder
    .create({
      data: {
        patientId: patient1.id,
        organizationId: org1.id,
        consultationId: consultation1.id,
        prescriptionId: prescriptionForConsult1?.id ?? null,
        status: 'APPROVED',
        notes: 'Pedido vinculado à consulta e prescrição.',
      },
    })
    .catch(async () => prisma.erpOrder.findFirst({ where: { consultationId: consultation1.id } }));
  await prisma.erpOrder.create({
    data: {
      patientId: patient2.id,
      organizationId: org2.id,
      status: 'PENDING',
      notes: 'Aguardando pagamento.',
    },
  }).catch(() => null);
  console.log('✅ 2 pedidos ERP criados (1 aprovado com prescrição, 1 pendente)');

  const paidAt = new Date(lastWeek);
  paidAt.setHours(13, 0, 0, 0);
  const payment1 = await prisma.payment.create({
    data: {
      patientId: patient1.id,
      consultationId: consultation1.id,
      ...(order1 ? { erpOrderId: order1.id } : {}),
      amount: 250,
      currency: 'BRL',
      status: 'PAID',
      paidAt,
      paymentMethod: 'PIX',
    },
  }).catch(() => null);
  if (payment1) console.log('✅ 1 pagamento PAID vinculado à consulta e ao pedido (IFP/ERP)');
  await prisma.payment.create({
    data: {
      patientId: patient2.id,
      consultationId: consultation2.id,
      amount: 250,
      currency: 'BRL',
      status: 'PENDING',
      paymentMethod: 'PIX',
    },
  }).catch(() => null);
  console.log('✅ 1 pagamento PENDING para consulta futura (IFP)');

  await prisma.patientConsent.create({
    data: {
      patientId: patient1.id,
      type: 'DATA_PROCESSING',
      version: '1.0',
      consentedAt: new Date(lastWeek),
      metadata: JSON.stringify({ source: 'seed' }),
    },
  }).catch(() => null);
  await prisma.patientConsent.create({
    data: {
      patientId: patient2.id,
      type: 'TELEMEDICINE',
      version: '1.0',
      consentedAt: new Date(),
      metadata: JSON.stringify({ source: 'seed' }),
    },
  }).catch(() => null);
  console.log('✅ 2 consentimentos de paciente criados (GPP)');

  await prisma.auditLog.createMany({
    data: [
      { action: 'CREATE', entity: 'ErpOrder', entityId: order1.id, userId: admin.id },
      ...(payment1 ? [{ action: 'CREATE', entity: 'Payment', entityId: payment1.id, userId: admin.id }] : []),
    ],
  }).catch(() => null);
  console.log('✅ Registros de auditoria de exemplo (ERP/GPP)');

  // Métodos de pagamento (Mercado Pago - ambiente de testes): só cria se não existir nenhum
  const paymentMethodsCount = await prisma.paymentMethod.count();
  if (paymentMethodsCount === 0) {
    await prisma.paymentMethod.createMany({
      data: [
        {
          name: 'PIX - Mercado Pago',
          type: 'PIX',
          enabled: false,
          isIntegrated: true,
          gateway: 'mercadopago',
          description: 'PIX integrado via Mercado Pago. Edite e preencha Access Token e Public Key (credenciais de teste).',
          icon: '💳',
          order: 0,
        },
        {
          name: 'Cartão de Crédito - Mercado Pago',
          type: 'CREDIT_CARD',
          enabled: false,
          isIntegrated: true,
          gateway: 'mercadopago',
          description: 'Cartão de crédito/débito via Mercado Pago. Edite e preencha as credenciais de teste.',
          icon: '💳',
          order: 1,
        },
      ],
    });
    console.log('✅ Métodos de pagamento Mercado Pago (teste) criados – edite em Admin > Métodos de Pagamento para adicionar credenciais');
  }

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
