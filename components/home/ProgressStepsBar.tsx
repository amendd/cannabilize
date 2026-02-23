'use client';

import type { LandingConfigPublic } from '@/lib/landing-config';

const STEPS = [
  { id: 1, label: 'Escolha sua condição' },
  { id: 2, label: 'Agende sua consulta' },
  { id: 3, label: 'Consulte e receba suporte' },
];

const DEFAULT_LABEL = 'Seu tratamento começa aqui — simples, legal e acompanhado';

interface ProgressStepsBarProps {
  config?: LandingConfigPublic | null;
}

export default function ProgressStepsBar({ config }: ProgressStepsBarProps) {
  const label = config?.progressLabel ?? DEFAULT_LABEL;
  return (
    <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium mb-4 tracking-wide">
          {label}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/10 text-sm font-semibold text-white shadow-sm"
                  aria-hidden
                >
                  {step.id}
                </span>
                <span className="text-sm font-medium text-white/95">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <span className="text-white/50 hidden sm:inline text-lg font-light" aria-hidden>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
