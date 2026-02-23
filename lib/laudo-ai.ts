/**
 * Geração de rascunho de laudo médico a partir da transcrição da consulta (IA).
 * Requer OPENAI_API_KEY. O laudo é um rascunho para revisão e assinatura do médico.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_LAUDO_MODEL || 'gpt-4o-mini';

export interface LaudoGenerateParams {
  transcript: string;
  patientName?: string;
  doctorName?: string;
  anamnesisSummary?: string;
}

/**
 * Gera um rascunho de laudo médico em português a partir da transcrição da consulta.
 * O médico deve revisar e assinar; não substitui o julgamento clínico.
 */
export async function generateLaudoDraft(params: LaudoGenerateParams): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY não configurada. Configure no .env para gerar laudos por IA.'
    );
  }

  const { transcript, patientName, doctorName, anamnesisSummary } = params;

  const systemPrompt = `Você é um assistente que elabora rascunhos de laudos médicos para o médico revisar e assinar.
Regras:
- O texto deve ser em português brasileiro, formal e objetivo.
- Estruture o laudo com: Identificação (paciente/ data), Anamnese (resumo), Exame físico (se mencionado na conversa), Hipótese diagnóstica ou Diagnóstico, Conduta e Observações.
- Use apenas informações que aparecem na transcrição ou no resumo de anamnese; não invente dados.
- Se algo não estiver claro na transcrição, indique "[a preencher pelo médico]" ou omita.
- O laudo é um RASCUNHO para o médico aprovar; não é um documento final assinado.`;

  const userContent = [
    'Transcrição da consulta (áudio/vídeo):',
    transcript.slice(0, 12000), // limite de contexto
    anamnesisSummary ? `\n\nResumo de anamnese já registrado:\n${anamnesisSummary}` : '',
    patientName ? `\nPaciente: ${patientName}` : '',
    doctorName ? `\nMédico responsável (para referência): ${doctorName}` : '',
  ].filter(Boolean).join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Falha ao gerar laudo (OpenAI): ${response.status} - ${err}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Resposta da IA vazia ao gerar laudo');
  }

  return content;
}

export function isLaudoAiAvailable(): boolean {
  return !!OPENAI_API_KEY;
}
