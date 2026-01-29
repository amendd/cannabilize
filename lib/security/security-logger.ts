/**
 * Logger de Segurança
 * 
 * Registra tentativas de ataque, bots detectados e eventos de segurança
 */

export enum SecurityEventType {
  BOT_DETECTED = 'BOT_DETECTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BLOCKED_REQUEST = 'BLOCKED_REQUEST',
  HONEYPOT_TRIGGERED = 'HONEYPOT_TRIGGERED',
  RECAPTCHA_FAILED = 'RECAPTCHA_FAILED',
  CSRF_FAILED = 'CSRF_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
}

interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  ip: string;
  userAgent?: string;
  path: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Armazenamento em memória (em produção, usar banco de dados ou serviço de logging)
const securityLogs: SecurityEvent[] = [];
const MAX_LOGS = 10000; // Manter últimos 10k eventos

/**
 * Registra evento de segurança
 */
export function logSecurityEvent(
  type: SecurityEventType,
  ip: string,
  path: string,
  details: Record<string, any> = {},
  userAgent?: string
): void {
  const severity = getSeverity(type);
  
  const event: SecurityEvent = {
    type,
    timestamp: Date.now(),
    ip,
    userAgent,
    path,
    details,
    severity,
  };

  securityLogs.push(event);

  // Manter apenas últimos MAX_LOGS
  if (securityLogs.length > MAX_LOGS) {
    securityLogs.shift();
  }

  // Em produção, também enviar para serviço de logging externo
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrar com serviço de logging (Sentry, LogRocket, etc)
    console.log('[SECURITY]', JSON.stringify(event));
  } else {
    console.warn('[SECURITY EVENT]', event);
  }
}

/**
 * Obtém severidade baseada no tipo de evento
 */
function getSeverity(type: SecurityEventType): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap: Record<SecurityEventType, 'low' | 'medium' | 'high' | 'critical'> = {
    [SecurityEventType.BOT_DETECTED]: 'high',
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: 'medium',
    [SecurityEventType.SUSPICIOUS_ACTIVITY]: 'high',
    [SecurityEventType.BLOCKED_REQUEST]: 'medium',
    [SecurityEventType.HONEYPOT_TRIGGERED]: 'high',
    [SecurityEventType.RECAPTCHA_FAILED]: 'medium',
    [SecurityEventType.CSRF_FAILED]: 'high',
    [SecurityEventType.INVALID_INPUT]: 'low',
  };

  return severityMap[type] || 'low';
}

/**
 * Obtém logs de segurança filtrados
 */
export function getSecurityLogs(filters?: {
  type?: SecurityEventType;
  ip?: string;
  severity?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}): SecurityEvent[] {
  let filtered = [...securityLogs];

  if (filters?.type) {
    filtered = filtered.filter((log) => log.type === filters.type);
  }

  if (filters?.ip) {
    filtered = filtered.filter((log) => log.ip === filters.ip);
  }

  if (filters?.severity) {
    filtered = filtered.filter((log) => log.severity === filters.severity);
  }

  if (filters?.startTime) {
    filtered = filtered.filter((log) => log.timestamp >= filters.startTime!);
  }

  if (filters?.endTime) {
    filtered = filtered.filter((log) => log.timestamp <= filters.endTime!);
  }

  // Ordenar por timestamp (mais recentes primeiro)
  filtered.sort((a, b) => b.timestamp - a.timestamp);

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Obtém estatísticas de segurança
 */
export function getSecurityStats(timeRangeHours: number = 24): {
  totalEvents: number;
  byType: Record<SecurityEventType, number>;
  bySeverity: Record<string, number>;
  topIPs: Array<{ ip: string; count: number }>;
} {
  const cutoffTime = Date.now() - timeRangeHours * 60 * 60 * 1000;
  const recentLogs = securityLogs.filter((log) => log.timestamp >= cutoffTime);

  const byType: Record<SecurityEventType, number> = {} as any;
  const bySeverity: Record<string, number> = {};
  const ipCounts: Record<string, number> = {};

  for (const log of recentLogs) {
    byType[log.type] = (byType[log.type] || 0) + 1;
    bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
  }

  const topIPs = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents: recentLogs.length,
    byType,
    bySeverity,
    topIPs,
  };
}

/**
 * Limpa logs antigos
 */
export function clearOldLogs(olderThanHours: number = 168): void {
  const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
  const initialLength = securityLogs.length;
  
  // Remover logs mais antigos que o cutoff
  while (securityLogs.length > 0 && securityLogs[0].timestamp < cutoffTime) {
    securityLogs.shift();
  }

  const removed = initialLength - securityLogs.length;
  if (removed > 0) {
    console.log(`[SECURITY] Removidos ${removed} logs antigos`);
  }
}

// Limpar logs antigos periodicamente (logs com mais de 7 dias)
setInterval(() => {
  clearOldLogs(168); // 7 dias
}, 60 * 60 * 1000); // A cada hora
