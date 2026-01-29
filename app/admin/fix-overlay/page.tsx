'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de emergência para limpar overlays travados
 * Acesse: /admin/fix-overlay
 */
export default function FixOverlayPage() {
  const router = useRouter();

  useEffect(() => {
    // Forçar remoção de qualquer overlay/modal travado
    const fixOverlay = () => {
      // Remover todos os overlays fixos
      const overlays = document.querySelectorAll('[class*="fixed inset-0"], [class*="fixed"][class*="inset-0"]');
      overlays.forEach((overlay) => {
        const element = overlay as HTMLElement;
        // Verificar se é um overlay (tem bg-black ou bg-opacity)
        if (
          element.classList.contains('bg-black') ||
          element.classList.contains('bg-opacity') ||
          element.style.backgroundColor === 'rgba(0, 0, 0, 0.5)' ||
          element.style.backgroundColor.includes('rgba(0, 0, 0')
        ) {
          // Verificar se não é o sidebar mobile (que tem z-40 e lg:hidden)
          if (!element.classList.contains('lg:hidden') || !element.classList.contains('z-40')) {
            element.remove();
          }
        }
      });

      // Limpar overflow hidden do body
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';

      // Limpar qualquer estado de modal no localStorage/sessionStorage
      try {
        sessionStorage.removeItem('modalOpen');
        sessionStorage.removeItem('sidebarOpen');
      } catch (e) {
        // Ignorar erros
      }

      // Redirecionar de volta ao dashboard após 1 segundo
      setTimeout(() => {
        router.push('/admin');
      }, 1000);
    };

    fixOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Corrigindo overlay travado...</p>
        <p className="text-sm text-gray-500 mt-2">Redirecionando em instantes...</p>
      </div>
    </div>
  );
}
