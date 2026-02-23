/**
 * GET ?test=1 - Testa conexão com a Z-API (lista de chats) para diagnóstico.
 * POST - Sincroniza mensagens da Z-API para o banco local.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncZapiMessages, testZapiChatsFetch } from '@/lib/zapi-sync';

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('test') !== '1') {
    return NextResponse.json({ error: 'Use POST para sincronizar ou GET ?test=1 para testar a conexão.' }, { status: 400 });
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const test = await testZapiChatsFetch();
    return NextResponse.json(test);
  } catch (error) {
    console.error('[sync-messages] Erro no teste:', error);
    return NextResponse.json(
      { ok: false, chatsCount: 0, error: error instanceof Error ? error.message : 'Erro no teste' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const test1 = await testZapiChatsFetch();
    await new Promise((r) => setTimeout(r, 400));
    const test2 = await testZapiChatsFetch();
    const test = (test2.chats?.length ?? 0) > (test1.chats?.length ?? 0) ? test2 : test1;
    const result = await syncZapiMessages({
      maxChats: 30,
      messagesPerChat: 30,
      initialChats: test.ok && test.chats?.length ? test.chats : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Falha ao sincronizar',
          conversationsProcessed: result.conversationsProcessed,
          logsInserted: result.logsInserted,
          messagesInserted: result.messagesInserted,
        },
        { status: 400 }
      );
    }

    const response: Record<string, unknown> = {
      success: true,
      message: `Sincronização concluída: ${result.conversationsProcessed} conversas, ${result.logsInserted} mensagens recebidas e ${result.messagesInserted} enviadas importadas.`,
      conversationsProcessed: result.conversationsProcessed,
      logsInserted: result.logsInserted,
      messagesInserted: result.messagesInserted,
      warning: result.warning,
    };
    if (result.conversationsProcessed === 0 && result.logsInserted === 0 && result.messagesInserted === 0) {
      response.debug = {
        test1Chats: test1.chatsCount,
        test2Chats: test2.chatsCount,
        usedSecond: (test2.chats?.length ?? 0) > (test1.chats?.length ?? 0),
        initialChatsPassed: (test.ok && test.chats?.length ? test.chats : undefined)?.length ?? 0,
      };
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error('[sync-messages] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao sincronizar',
      },
      { status: 500 }
    );
  }
}
