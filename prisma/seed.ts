import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clickcannabis.com' },
    update: {},
    create: {
      email: 'admin@clickcannabis.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin criado:', admin.email);

  // Criar médico
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@cannalize.com' },
    update: {},
    create: {
      email: 'doctor@cannalize.com',
      name: 'Dr. João Silva',
      password: doctorPassword,
      role: 'DOCTOR',
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { crm: 'CRM123456' },
    update: {},
    create: {
      name: 'Dr. João Silva',
      crm: 'CRM123456',
      email: 'doctor@cannalize.com',
      specialization: 'Cannabis Medicinal',
      active: true,
      userId: doctorUser.id,
    },
  });
  console.log('✅ Médico criado:', doctor.name);

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
      title: 'CannaLize Runner',
      slug: 'cannalize-runner',
      description: 'Evento de corrida organizada pela CannaLize no RJ',
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
      supplier: 'Associação Genérica',
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
      supplier: 'Associação Genérica',
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
