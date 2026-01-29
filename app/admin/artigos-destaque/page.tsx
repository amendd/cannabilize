'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Edit, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
}

export default function ArtigosDestaquePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredPosts, setFeaturedPosts] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchPosts();
      // Carregar artigos em destaque salvos (pode ser do localStorage ou API)
      const saved = localStorage.getItem('featuredPosts');
      if (saved) {
        setFeaturedPosts(JSON.parse(saved));
      }
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = (postId: string) => {
    setFeaturedPosts(prev => {
      const updated = prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId];
      
      // Salvar no localStorage (ou pode salvar via API)
      localStorage.setItem('featuredPosts', JSON.stringify(updated));
      
      toast.success(
        prev.includes(postId)
          ? 'Artigo removido dos destaques'
          : 'Artigo adicionado aos destaques'
      );
      
      return updated;
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Artigos em Destaque</h1>
            <p className="text-gray-600 mt-2">Gerencie quais artigos aparecem em destaque na homepage</p>
          </div>
          <Link
            href="/admin/blog"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Voltar para Blog
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-yellow-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Artigos em Destaque na Homepage
            </h2>
          </div>
          <p className="text-gray-600 text-sm">
            Selecione até 3 artigos para aparecerem em destaque na seção de blog da homepage.
            {featuredPosts.length > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                ({featuredPosts.length} selecionado{featuredPosts.length > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destaque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <p>Nenhum post encontrado</p>
                      <Link
                        href="/admin/blog/novo"
                        className="text-green-600 hover:text-green-700 mt-2 inline-block"
                      >
                        Criar primeiro post
                      </Link>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => {
                    const isFeatured = featuredPosts.includes(post.id);
                    const canAddMore = featuredPosts.length < 3 || isFeatured;

                    return (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (!canAddMore && !isFeatured) {
                                toast.error('Você pode destacar no máximo 3 artigos');
                                return;
                              }
                              toggleFeatured(post.id);
                            }}
                            className={`p-2 rounded-lg transition ${
                              isFeatured
                                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                : canAddMore
                                ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                            disabled={!canAddMore && !isFeatured}
                            title={
                              isFeatured
                                ? 'Remover dos destaques'
                                : canAddMore
                                ? 'Adicionar aos destaques'
                                : 'Máximo de 3 artigos em destaque'
                            }
                          >
                            <Star
                              size={20}
                              className={isFeatured ? 'fill-current' : ''}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          {post.excerpt && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {post.excerpt}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {post.category || 'Sem categoria'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              post.published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {post.published ? 'Publicado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/blog/${post.id}/editar`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {featuredPosts.length > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <Sparkles size={20} />
              <span className="font-semibold">
                {featuredPosts.length} artigo{featuredPosts.length > 1 ? 's' : ''} em destaque
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Estes artigos aparecerão na seção de blog da homepage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
