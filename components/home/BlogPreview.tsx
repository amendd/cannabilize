import Link from 'next/link';

const blogPosts = [
  {
    title: 'CannaLize: Tudo que você precisa saber!',
    date: '29/04/2025',
    category: 'Guia CannaLize',
    readTime: '8 minutos de leitura',
    slug: '/blog/cannalize-tudo-que-precisa-saber',
  },
  {
    title: 'Consulta na CannaLize: Por que o acompanhamento médico é essencial',
    date: '05/11/2025',
    category: 'Guia CannaLize',
    readTime: '9 minutos de leitura',
    slug: '/blog/consulta-cannalize',
  },
  {
    title: 'Canabidiol (CBD): entenda como funciona, seus benefícios e aplicações terapêuticas',
    date: '11/04/2025',
    category: 'CBD',
    readTime: '9 minutos de leitura',
    slug: '/blog/canabidiol-cbd',
  },
];

export default function BlogPreview() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Artigos em destaque
          </h2>
          <p className="text-lg text-gray-600">
            Explore artigos e notícias sobre o universo da Cannabis Medicinal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <Link
              key={index}
              href={post.slug}
              className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition group"
            >
              <div className="h-48 bg-gradient-to-br from-primary to-secondary"></div>
              <div className="p-6">
                <span className="text-sm text-primary font-semibold">{post.category}</span>
                <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-2 group-hover:text-primary transition">
                  {post.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/blog"
            className="inline-block border-2 border-primary text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary hover:text-white transition"
          >
            Ver todos os artigos
          </Link>
        </div>
      </div>
    </section>
  );
}
