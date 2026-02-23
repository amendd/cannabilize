/**
 * Receber e armazenar mídia (imagem, documento, áudio, vídeo) enviada pelo paciente via WhatsApp.
 * Meta Cloud API: webhook envia apenas o ID da mídia; é preciso buscar a URL e baixar o arquivo.
 */

const META_GRAPH_VERSION = 'v21.0';

export type WhatsAppMediaType = 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO';

const MIME_BY_TYPE: Record<string, string> = {
  image: 'image/jpeg',
  document: 'application/octet-stream',
  audio: 'audio/ogg',
  video: 'video/mp4',
};

/**
 * Obtém a URL de download da mídia a partir do media ID (Meta Cloud API).
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
 */
export async function getMetaMediaUrl(
  mediaId: string,
  accessToken: string
): Promise<{ url: string } | { error: string }> {
  const res = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${mediaId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[WhatsApp Media] Meta get media URL failed:', res.status, json);
    return { error: json?.error?.message || res.statusText || 'Falha ao obter URL da mídia' };
  }
  const url = json?.url;
  if (!url || typeof url !== 'string') {
    return { error: 'Resposta da Meta sem URL da mídia' };
  }
  return { url };
}

/**
 * Baixa o arquivo da URL retornada pela Meta (a URL exige o mesmo token).
 */
export async function downloadMetaMedia(
  mediaUrl: string,
  accessToken: string
): Promise<{ buffer: Buffer; mimeType?: string } | { error: string }> {
  const res = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    console.error('[WhatsApp Media] Meta download failed:', res.status);
    return { error: `Download falhou: ${res.status}` };
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = res.headers.get('content-type')?.split(';')[0]?.trim() || undefined;
  return { buffer, mimeType };
}

/**
 * Converte buffer para data URL (base64) para armazenar como no restante do sistema (ConsultationFile).
 */
export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Nome de arquivo seguro a partir do tipo e timestamp.
 */
export function defaultFileName(mediaType: string, mimeType?: string): string {
  const ext = mimeType?.split('/')[1] || mediaType.toLowerCase();
  const safeExt = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'ogg', 'mp4', 'webp'].includes(ext)
    ? ext
    : 'bin';
  return `whatsapp-${mediaType.toLowerCase()}-${Date.now()}.${safeExt}`;
}

/**
 * Mapeia tipo da mensagem Meta para nosso fileType e mime padrão.
 */
export function metaMessageTypeToFileType(
  type: string
): { fileType: WhatsAppMediaType; mime: string } {
  const lower = type.toLowerCase();
  const fileType = (
    lower === 'image' ? 'IMAGE' :
    lower === 'document' ? 'DOCUMENT' :
    lower === 'audio' ? 'AUDIO' :
    lower === 'video' ? 'VIDEO' :
    'DOCUMENT'
  ) as WhatsAppMediaType;
  const mime = MIME_BY_TYPE[lower] || MIME_BY_TYPE.document;
  return { fileType, mime };
}
