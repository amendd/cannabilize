import { Check } from 'lucide-react';

const ITEMS = [
  'Atendimento ativo em todo o Brasil',
  'Equipe disponível em horário comercial',
  'Acompanhamento contínuo aos pacientes',
];

export default function AboutOperationSignal() {
  return (
    <section className="py-8 md:py-10 bg-gray-50/80 border-y border-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-gray-600">
          {ITEMS.map((item, index) => (
            <li key={index} className="inline-flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary shrink-0" aria-hidden>
                <Check size={12} strokeWidth={3} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
