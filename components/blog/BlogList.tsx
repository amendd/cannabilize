import Link from 'next/link';

interface BlogListProps {
  posts: any[];
}

export default function BlogList({ posts }: BlogListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nenhum artigo publicado ainda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition"
        >
          <div className="h-48 bg-gradient-to-br from-primary to-secondary"></div>
          <div className="p-6">
            <span className="text-sm text-primary font-semibold">{post.category || 'Blog'}</span>
            <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-2 line-clamp-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {post.publishedAt && (
                <span>{new Date(post.publishedAt).toLocaleDateString('pt-BR')}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
