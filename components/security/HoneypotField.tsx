'use client';

/**
 * Componente Honeypot Field
 * 
 * Campo invisível que bots tendem a preencher, mas humanos não veem.
 * Se preenchido, indica que é um bot.
 */

import { generateHoneypotFieldName } from '@/lib/security/honeypot';

interface HoneypotFieldProps {
  name?: string;
}

export default function HoneypotField({ name }: HoneypotFieldProps) {
  const fieldName = name || generateHoneypotFieldName();

  return (
    <div
      style={{
        position: 'absolute',
        left: '-9999px',
        opacity: 0,
        pointerEvents: 'none',
        visibility: 'hidden',
      }}
      aria-hidden="true"
    >
      <label htmlFor={fieldName}>
        Por favor, deixe este campo em branco
      </label>
      <input
        type="text"
        id={fieldName}
        name={fieldName}
        tabIndex={-1}
        autoComplete="off"
        aria-label="Não preencha este campo"
      />
    </div>
  );
}
