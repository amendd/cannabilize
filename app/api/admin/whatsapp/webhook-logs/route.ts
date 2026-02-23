import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Indica se detail é só o resumo (não é o texto do paciente). */
function isSummaryDetail(detail: string | null): boolean {
  return !!detail?.trim() && /^Processado:\s*\d+\/\d+\s*mensagens enviadas$/i.test(detail.trim());
}

/** Progresso do cadastro via IA: 0 = início (sem lead/welcome), 1–4 = etapas, 5 = consulta paga e agendada, 6 = atendimento humano. */
function flowStateToProgress(flowState: string | null): number {
  if (!flowState?.trim()) return 0;
  const s = flowState.trim().toUpperCase();
  if (s === 'HUMAN_REQUESTED') return 6;
  if (s === 'HUMAN_PENDING_ACCEPT') return 6; // aguardando atendente aceitar
  if (s === 'WELCOME' || s === 'ASK_NAME') return 1;
  if (['ASK_CPF', 'ASK_BIRTH', 'ASK_ANAMNESIS'].includes(s)) return 2;
  if (['ASK_DAY', 'ASK_DATE', 'ASK_SLOT', 'CONFIRM_SLOT', 'CONFIRM'].includes(s)) return 3;
  if (['QUALIFYING', 'PAYMENT_SENT'].includes(s)) return 4;
  if (s === 'SCHEDULED') return 5;
  return 0;
}

/** Extrai todo o texto do payload Z-API (para exibir no monitor): texto, template header/body/footer, etc. */
function extractTextFromPayload(preview: string | null): string | null {
  if (!preview?.trim()) return null;
  try {
    const o = JSON.parse(preview) as Record<string, unknown>;
    const parts: string[] = [];

    const push = (v: unknown) => {
      if (typeof v === 'string' && v.trim()) parts.push(v.trim());
    };

    push((o?.text as { message?: string })?.message);
    push((o?.buttonsResponseMessage as { message?: string })?.message);
    push((o?.listResponseMessage as { message?: string })?.message);
    push((o?.image as { caption?: string })?.caption);
    push((o?.body as { text?: string })?.text);
    push(typeof o?.message === 'string' ? o.message : null);
    push(typeof o?.body === 'string' ? o.body : null);
    push(typeof o?.content === 'string' ? o.content : null);
    push(typeof o?.text === 'string' ? o.text : null);

    const ht = o?.hydratedTemplate as Record<string, unknown> | undefined;
    if (ht && typeof ht === 'object') {
      push(ht.header);
      push(ht.body);
      push(ht.footer);
      push(ht.message);
      push(ht.text);
    } else {
      push((o?.hydratedTemplate as { message?: string })?.message);
    }

    if (parts.length > 0) return parts.join('\n');
  } catch {
    // payload pode estar truncado
  }
  // Fallback: regex para "message":"..." ou "text":{"message":"..."} no raw
  const msgMatch = preview.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (msgMatch) return msgMatch[1].replace(/\\"/g, '"').trim();
  const textMatch = preview.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (textMatch) return textMatch[1].replace(/\\"/g, '"').trim();
  return null;
}

/**
 * GET - Listar logs do webhook Z-API com filtros e estatísticas para o monitor
 * Query: page, limit, result, phone, fromDate, toDate
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const resultFilter = searchParams.get('result') || undefined;
    const phoneFilter = searchParams.get('phone') || undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const statsOnly = searchParams.get('statsOnly') === '1';
    const conversationsOnly = searchParams.get('conversations') === '1';

    const where: Record<string, unknown> = {};
    if (resultFilter) where.result = resultFilter;
    // Telefone: OR entre contains(dígitos) e equals(dígitos/+dígitos) para garantir match em qualquer formato no banco
    if (phoneFilter) {
      const digits = phoneFilter.replace(/\D/g, '');
      if (digits.length >= 10) {
        const withPlus = `+${digits}`;
        where.OR = [
          { phone: { contains: digits } },
          { phone: { equals: digits } },
          { phone: { equals: withPlus } },
        ];
      }
    }
    if (fromDate) {
      where.createdAt = { ...((where.createdAt as object) || {}), gte: new Date(fromDate) };
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...((where.createdAt as object) || {}), lte: end };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayWhere = { createdAt: { gte: todayStart } };

    // Modo "conversas": últimos logs agrupados por phone (para lista estilo WhatsApp)
    if (conversationsOnly) {
      try {
        const recentLogs = await prisma.whatsAppWebhookLog.findMany({
          where: { ...where, NOT: { phone: null } },
          orderBy: { createdAt: 'desc' },
          take: 300,
        });
        const byPhone = new Map<string, { lastLog: (typeof recentLogs)[0]; count: number }>();
        for (const log of recentLogs) {
          const phone = log.phone || '';
          if (!phone) continue;
          if (!byPhone.has(phone)) {
            byPhone.set(phone, { lastLog: log, count: 0 });
          }
          byPhone.get(phone)!.count += 1;
        }
        let leadByDigits = new Map<string, { id: string; flowState: string; name: string | null }>();
        try {
          const leads = await prisma.whatsAppLead.findMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma String? filter not: null não está nos tipos gerados
            where: { phone: { not: null } } as any,
            select: { id: true, phone: true, flowState: true, name: true },
            orderBy: { updatedAt: 'desc' },
            take: 300,
          });
          for (const lead of leads) {
            const d = (lead.phone || '').replace(/\D/g, '');
            if (d.length >= 10 && !leadByDigits.has(d)) leadByDigits.set(d, { id: lead.id, flowState: lead.flowState || 'WELCOME', name: lead.name ?? null });
          }
        } catch (leadErr) {
          console.error('[webhook-logs conversations] Erro ao buscar leads para progresso:', leadErr);
        }

        // Última mensagem enviada por destinatário (para ordenar por atividade real = recebida ou enviada)
        const lastSentByPhone = new Map<string, Date>();
        try {
          const recentSent = await prisma.whatsAppMessage.findMany({
            orderBy: { createdAt: 'desc' },
            take: 500,
            select: { to: true, createdAt: true },
          });
          for (const m of recentSent) {
            const digits = (m.to || '').replace(/\D/g, '');
            if (digits.length >= 10 && !lastSentByPhone.has(digits)) {
              lastSentByPhone.set(digits, m.createdAt);
            }
          }
        } catch (sentErr) {
          console.error('[webhook-logs conversations] Erro ao buscar mensagens enviadas:', sentErr);
        }

        const conversations = Array.from(byPhone.entries()).map(([phone, { lastLog, count }]) => {
          const displayText =
            (lastLog.messageText && lastLog.messageText.trim()) ||
            extractTextFromPayload(lastLog.payloadPreview) ||
            (lastLog.detail && lastLog.detail.trim()) ||
            '';
          const digits = phone.replace(/\D/g, '');
          const lead = leadByDigits.get(digits) ?? leadByDigits.get(digits.slice(-11)) ?? leadByDigits.get(digits.startsWith('55') ? digits : `55${digits}`);
          const flowState = lead?.flowState ?? null;
          const progress = flowStateToProgress(flowState);
          const name = lead?.name?.trim() || null;
          const lastSentAt = lastSentByPhone.get(digits) ?? lastSentByPhone.get(digits.slice(-11)) ?? lastSentByPhone.get(digits.startsWith('55') ? digits : `55${digits}`);
          const lastActivityAt = lastSentAt && lastSentAt > lastLog.createdAt ? lastSentAt : lastLog.createdAt;
          return {
            phone,
            leadId: lead?.id ?? undefined,
            name: name ?? undefined,
            lastLog: {
              id: lastLog.id,
              result: lastLog.result,
              detail: lastLog.detail,
              displayText,
              createdAt: lastLog.createdAt,
              payloadPreview: lastLog.payloadPreview,
            },
            count,
            flowState: flowState ?? undefined,
            progress,
            lastActivityAt: lastActivityAt.toISOString ? lastActivityAt.toISOString() : lastActivityAt,
          };
        });

        // Ordenar por última atividade (recebida ou enviada), mais recente primeiro
        conversations.sort((a, b) => {
          const tA = new Date(a.lastActivityAt).getTime();
          const tB = new Date(b.lastActivityAt).getTime();
          return tB - tA;
        });
        const [todayProcessed, todayIgnored, todayErrors] = await Promise.all([
          prisma.whatsAppWebhookLog.count({ where: { ...where, ...todayWhere, result: 'processed' } }),
          prisma.whatsAppWebhookLog.count({ where: { ...where, ...todayWhere, result: 'ignored' } }),
          prisma.whatsAppWebhookLog.count({ where: { ...where, ...todayWhere, result: 'error' } }),
        ]);
        return NextResponse.json({
          conversations,
          stats: {
            todayProcessed,
            todayIgnored,
            todayErrors,
            todayTotal: todayProcessed + todayIgnored + todayErrors,
          },
        });
      } catch (err) {
        console.error('[webhook-logs conversations] Erro ao listar conversas:', err);
        return NextResponse.json({
          conversations: [],
          stats: {
            todayProcessed: 0,
            todayIgnored: 0,
            todayErrors: 0,
            todayTotal: 0,
          },
        });
      }
    }

    const [logs, total, todayProcessed, todayIgnored, todayErrors] = await Promise.all([
      statsOnly
        ? []
        : prisma.whatsAppWebhookLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
      prisma.whatsAppWebhookLog.count({ where }),
      prisma.whatsAppWebhookLog.count({
        where: { ...where, ...todayWhere, result: 'processed' },
      }),
      prisma.whatsAppWebhookLog.count({
        where: { ...where, ...todayWhere, result: 'ignored' },
      }),
      prisma.whatsAppWebhookLog.count({
        where: { ...where, ...todayWhere, result: 'error' },
      }),
    ]);

    const stats = {
      todayProcessed,
      todayIgnored,
      todayErrors,
      todayTotal: todayProcessed + todayIgnored + todayErrors,
    };

    const logsArray = Array.isArray(logs) ? logs : [];
    const logsWithDisplay = logsArray.map((log) => {
      const fromPayload = extractTextFromPayload(log.payloadPreview);
      const rawDetail = log.detail?.trim() || '';
      const displayText =
        (log.messageText && log.messageText.trim()) ||
        fromPayload ||
        (rawDetail && !isSummaryDetail(rawDetail) ? rawDetail : null) ||
        'Mensagem recebida';
      return { ...log, displayText };
    });

    return NextResponse.json({
      logs: logsWithDisplay,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Erro ao listar logs webhook WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao listar logs' },
      { status: 500 }
    );
  }
}
