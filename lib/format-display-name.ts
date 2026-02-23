/**
 * Formata o nome para exibição: primeira letra de cada palavra em maiúscula.
 * Ex.: "luanderson andrade souza" → "Luanderson Andrade Souza"
 * Assim, mesmo que o paciente cadastre em minúsculo, a interface o trata com respeito.
 */
export function formatDisplayName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
