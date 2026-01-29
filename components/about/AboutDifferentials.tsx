import { DollarSign, Headphones, Star } from 'lucide-react';

export default function AboutDifferentials() {
  const differentials = [
    {
      icon: DollarSign,
      title: 'Custo Acessível',
      description: 'Consulta com médicos especialistas em cannabis medicinal por apenas R$50,00',
    },
    {
      icon: Headphones,
      title: 'Suporte Integral',
      description: 'Acompanhamento completo na emissão da documentação e no processo de importação do medicamento.',
    },
    {
      icon: Star,
      title: 'Credibilidade Reconhecida',
      description: 'Mais de 1.500 depoimentos no Google, comprovando a excelência em resultados e satisfação.',
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          O que torna a CannaLize única no mercado
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {differentials.map((diff, index) => {
            const Icon = diff.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <Icon size={40} className="text-primary mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{diff.title}</h3>
                <p className="text-gray-600">{diff.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
