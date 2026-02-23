const IMPACT = [
  { value: '15.000+', label: 'Pacientes acompanhados com suporte médico', sub: 'Em todo o Brasil' },
  { value: '27', label: 'Estados com atendimento', sub: 'Presença nacional' },
  { value: '20.000+', label: 'Tratamentos iniciados com segurança médica', sub: 'Prescrições em conformidade' },
  { value: '96%', label: 'Pacientes satisfeitos com o tratamento', sub: 'Recomendariam a Cannabilize' },
];

export default function AboutImpact() {
  return (
    <section className="py-14 md:py-20 bg-primary text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-primary-100 text-sm font-semibold uppercase tracking-wider mb-4 md:mb-6">
          Nosso impacto em números
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-white mb-8 md:mb-12 font-display tracking-tight">
          Resultados que refletem confiança e cuidado
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 lg:gap-8">
          {IMPACT.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight">
                {item.value}
              </div>
              <div className="text-sm md:text-base lg:text-lg font-semibold text-white/95 mt-2 leading-snug">{item.label}</div>
              <div className="text-xs md:text-sm text-primary-100 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
