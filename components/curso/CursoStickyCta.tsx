'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CursoStickyCta() {
  const [visible, setVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - viewportHeight;

      setLastScrollY(currentScrollY);
      setVisible(currentScrollY > viewportHeight * 0.5 && currentScrollY < docHeight - 120);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg md:hidden"
      role="complementary"
      aria-label="Chamada para ação"
    >
      <Link
        href="#comprar"
        className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-primary-700 transition shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Quero aprender com segurança
        <ArrowRight className="w-5 h-5" aria-hidden />
      </Link>
    </div>
  );
}
