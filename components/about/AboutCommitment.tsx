export default function AboutCommitment() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Nosso compromisso é com o futuro: ações que transformam vidas
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
          Responsabilidade social e sustentabilidade fazem parte de nosso DNA!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-semibold text-gray-900 mb-2">Sustentabilidade</h3>
            <p className="text-gray-600">Compromisso com o meio ambiente</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-semibold text-gray-900 mb-2">Responsabilidade Social</h3>
            <p className="text-gray-600">Ações que fazem a diferença</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-semibold text-gray-900 mb-2">Comunidade</h3>
            <p className="text-gray-600">Unindo pessoas em prol da saúde</p>
          </div>
        </div>
      </div>
    </section>
  );
}
