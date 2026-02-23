// Serviço para buscar e processar templates de mensagens WhatsApp do banco
import { prisma } from './prisma';

interface TemplateVariables {
  [key: string]: string | number | Date | undefined | null;
}

/**
 * Processa um template substituindo variáveis
 * Suporta formato {{variavel}} e {{#variavel}}...{{/variavel}} (condicional)
 */
function processTemplate(template: string, variables: TemplateVariables): string {
  let processed = template;

  // Substituir variáveis simples {{variavel}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      let formattedValue = '';
      
      if (value instanceof Date) {
        formattedValue = value.toLocaleDateString('pt-BR');
      } else if (typeof value === 'number') {
        formattedValue = value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      } else {
        formattedValue = String(value);
      }

      // Substituir {{variavel}}
      processed = processed.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), formattedValue);
      
      // Processar condicionais {{#variavel}}...{{/variavel}}
      const conditionalRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
      if (value) {
        processed = processed.replace(conditionalRegex, '$1');
      } else {
        processed = processed.replace(conditionalRegex, '');
      }
    } else {
      // Se valor é null/undefined, remover variável e blocos condicionais
      processed = processed.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), '');
      processed = processed.replace(new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g'), '');
    }
  });

  // Remover linhas vazias extras
  processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');

  return processed.trim();
}

/**
 * Busca template do banco por código
 */
export async function getTemplateByCode(code: string): Promise<string | null> {
  try {
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { code },
    });

    if (!template || !template.enabled) {
      return null;
    }

    return template.content;
  } catch (error) {
    console.error(`Erro ao buscar template ${code}:`, error);
    return null;
  }
}

/**
 * Gera mensagem usando template do banco ou fallback
 */
export async function generateMessage(
  code: string,
  variables: TemplateVariables,
  fallbackTemplate?: string
): Promise<string> {
  // Tentar buscar do banco primeiro
  const templateContent = await getTemplateByCode(code);

  if (templateContent) {
    return processTemplate(templateContent, variables);
  }

  // Se não encontrou ou está desabilitado, usar fallback
  if (fallbackTemplate) {
    return processTemplate(fallbackTemplate, variables);
  }

  // Se não tem fallback, retornar mensagem genérica
  console.warn(`Template ${code} não encontrado e sem fallback`);
  return `Mensagem não configurada (${code})`;
}

/**
 * Verifica se um template está habilitado
 */
export async function isTemplateEnabled(code: string): Promise<boolean> {
  try {
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { code },
      select: { enabled: true },
    });

    return template?.enabled ?? false;
  } catch (error) {
    console.error(`Erro ao verificar template ${code}:`, error);
    return false;
  }
}
