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

const medicationUpdateSchema = z.object({
  // 🟦 BLOCO 1
  name: z.string().min(1).optional(),
  productType: productTypeEnum.optional(),
  pharmaceuticalForm: z.string().min(1).optional(),
  activePrinciples: z.array(activePrincipleEnum).min(1).optional(),

  // 🟩 BLOCO 2
  cbdConcentrationValue: z.number().positive().optional(),
  cbdConcentrationUnit: concentrationUnitEnum.optional(),
  thcConcentrationValue: z.number().min(0).optional(),
  thcConcentrationUnit: concentrationUnitEnum.optional(),
  otherCannabinoids: z.array(otherCannabinoidSchema).optional(),
  spectrum: spectrumEnum.optional(),

  // 🟨 BLOCO 3
  administrationRoute: routeEnum.optional(),
  dispensingUnit: z.string().min(1).optional(),

  // 🟥 BLOCO 4
  regulatoryClassification: regulatoryEnum.optional(),
  supplier: z.string().optional(),
  active: z.boolean().optional(),
  order: z.number().optional(),

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

// PATCH - Atualizar medicamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = medicationUpdateSchema.parse(body);

    // Buscar atual para recomputar allowsThc/hash com valores finais
    const current = await (prisma as any).medication.findUnique({
      where: { id: params.id },
    });

    if (!current) {
      return NextResponse.json(
        { error: 'Medicamento não encontrado' },
        { status: 404 }
      );
    }

    const merged = { ...current, ...data };
    const thcValue = typeof merged.thcConcentrationValue === 'number' ? merged.thcConcentrationValue : 0;
    const allowsThc = thcValue > 0;
    const regulatoryClassification =
      merged.regulatoryClassification ??
      (allowsThc ? 'CBD_THC' : 'CBD_ONLY');

    const recordHash = computeMedicationHash({
      // somente campos de negócio relevantes para hash
      name: merged.name,
      productType: merged.productType,
      pharmaceuticalForm: merged.pharmaceuticalForm,
      activePrinciples: parseJsonSafely<string[]>(merged.activePrinciples, []),
      cbdConcentrationValue: merged.cbdConcentrationValue,
      cbdConcentrationUnit: merged.cbdConcentrationUnit,
      thcConcentrationValue: merged.thcConcentrationValue,
      thcConcentrationUnit: merged.thcConcentrationUnit,
      otherCannabinoids: parseJsonSafely<any[]>(merged.otherCannabinoids, []),
      spectrum: merged.spectrum,
      administrationRoute: merged.administrationRoute,
      dispensingUnit: merged.dispensingUnit,
      allowsThc,
      regulatoryClassification,
      supplier: merged.supplier,
      active: merged.active,
      order: merged.order,
      description: merged.description,
    });

    const updateData: any = {
      ...data,
      allowsThc,
      regulatoryClassification,
      updatedById: session.user.id,
      recordHash,
    };

    if ('activePrinciples' in data && data.activePrinciples) {
      updateData.activePrinciples = JSON.stringify(data.activePrinciples);
    }

    if ('otherCannabinoids' in data) {
      updateData.otherCannabinoids = data.otherCannabinoids
        ? JSON.stringify(data.otherCannabinoids)
        : null;
    }

    const medication = await (prisma as any).medication.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ medication });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar medicamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar medicamento' },
      { status: 500 }
    );
  }
}

// DELETE - Desativar medicamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Desativar ao invés de deletar
    await (prisma as any).medication.update({
      where: { id: params.id },
      data: {
        active: false,
        updatedById: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Medicamento desativado' });
  } catch (error) {
    console.error('Erro ao desativar medicamento:', error);
    return NextResponse.json(
      { error: 'Erro ao desativar medicamento' },
      { status: 500 }
    );
  }
}
