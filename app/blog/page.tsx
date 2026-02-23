import { prisma } from '@/lib/prisma';
import BlogList from '@/components/blog/BlogList';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Central de Conhecimento Cannabilize
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Conteúdos desenvolvidos para orientar pacientes e profissionais sobre o uso seguro e responsável da cannabis medicinal.
          </p>
        </div>
        <BlogList posts={posts} />
      </div>
    </div>
  );
}
