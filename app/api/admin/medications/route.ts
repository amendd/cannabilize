import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const productTypeEnum = z.enum(['OIL', 'GUMMIES', 'CAPSULES', 'EXTRACT', 'FLOWER', 'OTHER']);
const activePrincipleEnum = z.enum(['CBD', 'THC', 'CBG', 'CBN']);
const concentrationUnitEnum = z.enum(['MG_PER_ML', 'MG_PER_UNIT']);
const spectrumEnum = z.enum(['FULL_SPECTRUM', 'BROAD_SPECTRUM', 'ISOLATE']);
const routeEnum = z.enum(['SUBLINGUAL', 'ORAL', 'TOPICAL', 'INHALATION']);
const regulatoryEnum = z.enum(['CBD_ONLY', 'CBD_THC', 'CONTROLLED']);

const otherCannabinoidSchema = z.object({
  name: z.string().min(1),
  value: z.number().min(0),
  unit: concentrationUnitEnum,
});

const medicationSchema = z.object({
  // 🟦 BLOCO 1
  name: z.string().min(1),
  productType: productTypeEnum,
  pharmaceuticalForm: z.string().min(1),
  activePrinciples: z.array(activePrincipleEnum).min(1),

  // 🟩 BLOCO 2
  cbdConcentrationValue: z.number().positive(),
  cbdConcentrationUnit: concentrationUnitEnum,
  thcConcentrationValue: z.number().min(0).default(0),
  thcConcentrationUnit: concentrationUnitEnum.default('MG_PER_ML'),
  otherCannabinoids: z.array(otherCannabinoidSchema).optional(),
  spectrum: spectrumEnum,

  // 🟨 BLOCO 3
  administrationRoute: routeEnum,
  dispensingUnit: z.string().min(1),

  // 🟥 BLOCO 4
  regulatoryClassification: regulatoryEnum.optional(),
  supplier: z.string().optional(),
  active: z.boolean().default(true),
  order: z.number().default(0),

  // 🟪 BLOCO 5
  description: z.string().optional(),
});

const computeMedicationHash = (data: unknown) => {
  const json = JSON.stringify(data ?? {});
  return crypto.createHash('sha256').update(json).digest('hex');
};

const parseJsonSafely = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
};

// GET - Listar medicamentos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const where =
      session.user.role === 'ADMIN'
        ? {}
        : { active: true };

    const rawMedications = await prisma.medication.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    const medications = rawMedications.map((m: any) => ({
      ...m,
      activePrinciples: parseJsonSafely<string[]>(m.activePrinciples, []),
      otherCannabinoids: parseJsonSafely<any[]>(m.otherCannabinoids, []),
    }));

    return NextResponse.json({ medications });
  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar medicamentos' },
      { status: 500 }
    );
  }
}

// POST - Criar medicamento
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
    const parsed = medicationSchema.parse(body);

    const allowsThc = (parsed.thcConcentrationValue ?? 0) > 0;
    const regulatoryClassification =
      parsed.regulatoryClassification ??
      (allowsThc ? 'CBD_THC' : 'CBD_ONLY');

    const recordHash = computeMedicationHash({
      ...parsed,
      allowsThc,
      regulatoryClassification,
    });

    // Cast para evitar quebra de tipagem antes do prisma generate após alterar schema
    const medication = await (prisma as any).medication.create({
      data: {
        ...parsed,
        activePrinciples: JSON.stringify(parsed.activePrinciples),
        otherCannabinoids: parsed.otherCannabinoids ? JSON.stringify(parsed.otherCannabinoids) : null,
        allowsThc,
        regulatoryClassification,
        createdById: session.user.id,
        updatedById: session.user.id,
        recordHash,
      },
    });

    return NextResponse.json({ medication }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar medicamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar medicamento' },
      { status: 500 }
    );
  }
}
