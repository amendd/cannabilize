/**
 * Script completo para criar todos os dados necessários no banco
 * Execute: npx tsx criar-dados-completos.ts
 * 
 * Cria:
 * - Usuários (admin, médico, paciente) com domínio cannabilize.com.br
 * - Médico com disponibilidade de horários
 * - Medicamentos
 * - Patologias
 * - Conta financeira do médico
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarDadosCompletos() {
  try {
    console.log('🌱 Iniciando criação completa de dados...\n');

    // ============================================
    // 1. CRIAR USUÁRIOS
    // ============================================
    console.log('👥 Criando usuários...\n');

    // Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cannabilize.com.br' },
      update: {
        password: adminPassword,
        role: 'ADMIN',
        name: 'Administrador',
      },
      create: {
        email: 'admin@cannabilize.com.br',
        name: 'Administrador',
        password: adminPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin criado: admin@cannabilize.com.br / admin123');

    // Médico
    const doctorPassword = await bcrypt.hash('doctor123', 10);
    const doctorUser = await prisma.user.upsert({
      where: { email: 'doctor@cannabilize.com.br' },
      update: {
        password: doctorPassword,
        role: 'DOCTOR',
        name: 'Dr. João Silva',
      },
      create: {
        email: 'doctor@cannabilize.com.br',
        name: 'Dr. João Silva',
        password: doctorPassword,
        role: 'DOCTOR',
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { crm: 'CRM123456' },
      update: {
        userId: doctorUser.id,
        email: 'doctor@cannabilize.com.br',
        active: true,
      },
      create: {
        name: 'Dr. João Silva',
        crm: 'CRM123456',
        email: 'doctor@cannabilize.com.br',
        specialization: 'Cannabis Medicinal',
        active: true,
        userId: doctorUser.id,
      },
    });
    console.log('✅ Médico criado: doctor@cannabilize.com.br / doctor123');

    // Paciente de teste
    const patientPassword = await bcrypt.hash('paciente123', 10);
    const patient = await prisma.user.upsert({
      where: { email: 'paciente@cannabilize.com.br' },
      update: {
        password: patientPassword,
        role: 'PATIENT',
        name: 'Paciente Teste',
      },
      create: {
        email: 'paciente@cannabilize.com.br',
        name: 'Paciente Teste',
        password: patientPassword,
        role: 'PATIENT',
      },
    });
    console.log('✅ Paciente criado: paciente@cannabilize.com.br / paciente123\n');

    // ============================================
    // 2. CRIAR DISPONIBILIDADE DO MÉDICO
    // ============================================
    console.log('📅 Criando disponibilidade do médico...\n');

    // Deletar disponibilidades antigas do médico
    await prisma.doctorAvailability.deleteMany({
      where: { doctorId: doctor.id },
    });

    // Disponibilidade: Segunda a Sexta, 9h às 18h
    const disponibilidades = [
      // Segunda-feira (1)
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', duration: 30 },
      // Terça-feira (2)
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', duration: 30 },
      // Quarta-feira (3)
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', duration: 30 },
      // Quinta-feira (4)
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', duration: 30 },
      // Sexta-feira (5)
      { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', duration: 30 },
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
    console.log(`✅ ${disponibilidades.length} disponibilidades criadas (Segunda a Sexta, 9h-18h)\n`);

    // ============================================
    // 3. CRIAR CONTA FINANCEIRA DO MÉDICO
    // ============================================
    console.log('💰 Criando conta financeira do médico...\n');

    await prisma.doctorPayoutAccount.upsert({
      where: { doctorId: doctor.id },
      update: {
        type: 'PIX',
        pixKey: 'doctor@cannabilize.com.br',
        pixKeyType: 'EMAIL',
        holderName: doctor.name,
        notes: 'Conta PIX padrão do médico.',
      },
      create: {
        doctorId: doctor.id,
        type: 'PIX',
        pixKey: 'doctor@cannabilize.com.br',
        pixKeyType: 'EMAIL',
        holderName: doctor.name,
        notes: 'Conta PIX padrão do médico.',
      },
    });
    console.log('✅ Conta financeira criada\n');

    // ============================================
    // 4. CRIAR MEDICAMENTOS
    // ============================================
    console.log('💊 Criando medicamentos...\n');

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
      {
        name: 'Óleo de CBD Isolado 500mg',
        productType: 'OIL',
        pharmaceuticalForm: 'Óleo oral',
        activePrinciples: JSON.stringify(['CBD']),
        cbdConcentrationValue: 500,
        cbdConcentrationUnit: 'MG_PER_ML',
        thcConcentrationValue: 0,
        thcConcentrationUnit: 'MG_PER_ML',
        otherCannabinoids: JSON.stringify([]),
        spectrum: 'ISOLATE',
        administrationRoute: 'SUBLINGUAL',
        dispensingUnit: 'Frasco 10 mL',
        allowsThc: false,
        regulatoryClassification: 'CBD_ONLY',
        supplier: 'Associação CannaBilize',
        description:
          'Óleo de CBD isolado de alta concentração, ideal para casos que requerem doses mais elevadas de CBD sem THC.',
        order: 2,
      },
      {
        name: 'Cápsulas de CBD 25mg',
        productType: 'CAPSULES',
        pharmaceuticalForm: 'Cápsula gelatinosa',
        activePrinciples: JSON.stringify(['CBD']),
        cbdConcentrationValue: 25,
        cbdConcentrationUnit: 'MG_PER_UNIT',
        thcConcentrationValue: 0,
        thcConcentrationUnit: 'MG_PER_UNIT',
        otherCannabinoids: JSON.stringify([]),
        spectrum: 'BROAD_SPECTRUM',
        administrationRoute: 'ORAL',
        dispensingUnit: 'Caixa com 30 cápsulas',
        allowsThc: false,
        regulatoryClassification: 'CBD_ONLY',
        supplier: 'Associação CannaBilize',
        description:
          'Cápsulas de CBD para administração oral, facilitando o uso e dosagem precisa.',
        order: 3,
      },
      {
        name: 'Óleo de Cannabis Balanceado 1:1',
        productType: 'OIL',
        pharmaceuticalForm: 'Óleo oral',
        activePrinciples: JSON.stringify(['CBD', 'THC']),
        cbdConcentrationValue: 50,
        cbdConcentrationUnit: 'MG_PER_ML',
        thcConcentrationValue: 50,
        thcConcentrationUnit: 'MG_PER_ML',
        otherCannabinoids: JSON.stringify([{ name: 'CBG', value: 5, unit: 'MG_PER_ML' }]),
        spectrum: 'FULL_SPECTRUM',
        administrationRoute: 'SUBLINGUAL',
        dispensingUnit: 'Frasco 30 mL',
        allowsThc: true,
        regulatoryClassification: 'CBD_THC',
        supplier: 'Associação CannaBilize',
        description:
          'Óleo balanceado com proporção igual de CBD e THC, indicado para casos que se beneficiam da sinergia entre os canabinoides.',
        order: 4,
      },
    ];

    for (const med of medications) {
      await prisma.medication.upsert({
        where: { name: med.name },
        update: med,
        create: {
          ...med,
          createdById: admin.id,
        },
      });
    }
    console.log(`✅ ${medications.length} medicamentos criados\n`);

    // ============================================
    // 5. CRIAR PATOLOGIAS
    // ============================================
    console.log('🏥 Criando patologias...\n');

    const pathologies = [
      'Ansiedade',
      'Depressão',
      'Dores Crônicas',
      'Epilepsia',
      'Insônia',
      'Autismo',
      'Enxaqueca',
      'Fibromialgia',
      'Parkinson',
      'TDAH',
      'Esclerose Múltipla',
      'Artrite',
      'Síndrome do Intestino Irritável',
      'Glaucoma',
      'Transtorno de Estresse Pós-Traumático',
    ];

    for (const pathologyName of pathologies) {
      await prisma.pathology.upsert({
        where: { name: pathologyName },
        update: { active: true },
        create: {
          name: pathologyName,
          active: true,
        },
      });
    }
    console.log(`✅ ${pathologies.length} patologias criadas\n`);

    // ============================================
    // 6. CRIAR POSTS DO BLOG
    // ============================================
    console.log('📝 Criando posts do blog...\n');

    const blogPosts = [
      {
        title: 'CannaBilize: Tudo que você precisa saber!',
        slug: 'cannabilize-tudo-que-precisa-saber',
        excerpt: 'Guia completo sobre a CannaBilize e como funciona o tratamento com cannabis medicinal.',
        content: `
          <h2>O que é a CannaBilize?</h2>
          <p>A CannaBilize é uma plataforma completa de telemedicina especializada em tratamentos com cannabis medicinal. Nossa missão é tornar o acesso ao tratamento com cannabis mais fácil, seguro e acessível para todos.</p>
          
          <h2>Como Funciona?</h2>
          <p>Nosso processo é simples e seguro:</p>
          <ol>
            <li>Agende sua consulta online</li>
            <li>Realize a consulta com um médico especializado via telemedicina</li>
            <li>Receba sua receita digital</li>
            <li>Inicie seu tratamento com acompanhamento contínuo</li>
          </ol>
          
          <h2>Benefícios</h2>
          <ul>
            <li>Atendimento 100% online</li>
            <li>Médicos especializados em cannabis medicinal</li>
            <li>Acompanhamento contínuo</li>
            <li>Receitas digitais válidas</li>
          </ul>
        `,
        category: 'Guia CannaBilize',
        tags: ['cannabis', 'medicinal', 'guia', 'telemedicina'],
        published: true,
        publishedAt: new Date(),
      },
      {
        title: 'Canabidiol (CBD): entenda como funciona',
        slug: 'canabidiol-cbd-como-funciona',
        excerpt: 'Descubra como o CBD funciona no organismo e seus benefícios terapêuticos.',
        content: `
          <h2>O que é CBD?</h2>
          <p>O Canabidiol (CBD) é um dos principais canabinoides encontrados na planta Cannabis sativa. Diferente do THC, o CBD não possui efeitos psicoativos, ou seja, não causa "barato".</p>
          
          <h2>Como Funciona?</h2>
          <p>O CBD interage com o sistema endocanabinoide do nosso corpo, que regula diversas funções como sono, apetite, humor e resposta à dor.</p>
          
          <h2>Benefícios Terapêuticos</h2>
          <ul>
            <li>Redução de ansiedade e estresse</li>
            <li>Alívio de dores crônicas</li>
            <li>Melhora na qualidade do sono</li>
            <li>Redução de convulsões em casos de epilepsia</li>
            <li>Efeitos anti-inflamatórios</li>
          </ul>
        `,
        category: 'CBD',
        tags: ['cbd', 'canabidiol', 'benefícios', 'terapia'],
        published: true,
        publishedAt: new Date(),
      },
    ];

    for (const post of blogPosts) {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: post,
        create: {
          ...post,
          tags: Array.isArray(post.tags) ? JSON.stringify(post.tags) : post.tags,
        },
      });
    }
    console.log(`✅ ${blogPosts.length} posts do blog criados\n`);

    // ============================================
    // 7. CRIAR EVENTOS
    // ============================================
    console.log('🎉 Criando eventos...\n');

    const events = [
      {
        title: 'CannaBilize Runner',
        slug: 'cannabilize-runner',
        description: 'Evento de corrida organizada pela CannaBilize no RJ',
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
        update: event,
        create: event,
      });
    }
    console.log(`✅ ${events.length} eventos criados\n`);

    // ============================================
    // RESUMO FINAL
    // ============================================
    console.log('🎉 Dados criados com sucesso!\n');
    console.log('📋 Credenciais para login:');
    console.log('   👤 Admin: admin@cannabilize.com.br / admin123');
    console.log('   👨‍⚕️  Médico: doctor@cannabilize.com.br / doctor123');
    console.log('   👤 Paciente: paciente@cannabilize.com.br / paciente123');
    console.log('\n📊 Resumo:');
    console.log(`   ✅ ${3} usuários criados`);
    console.log(`   ✅ ${disponibilidades.length} disponibilidades do médico (Segunda a Sexta, 9h-18h)`);
    console.log(`   ✅ ${medications.length} medicamentos criados`);
    console.log(`   ✅ ${pathologies.length} patologias criadas`);
    console.log(`   ✅ ${blogPosts.length} posts do blog criados`);
    console.log(`   ✅ ${events.length} eventos criados`);
    console.log('\n✨ Tudo pronto para uso!');

  } catch (error: any) {
    console.error('❌ Erro ao criar dados:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

criarDadosCompletos();
