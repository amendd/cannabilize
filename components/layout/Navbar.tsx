'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  // Fechar menu ao clicar fora ou em link
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/cannalize-logo.png"
              alt="CannabiLize"
              width={180}
              height={56}
              className="h-11 sm:h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary transition">
              Início
            </Link>
            <Link href="/sobre-nos" className="text-gray-700 hover:text-primary transition">
              Sobre Nós
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-primary transition">
              Blog
            </Link>
            <Link href="/galeria" className="text-gray-700 hover:text-primary transition">
              Galeria
            </Link>
            <Link href="/seja-medico" className="text-green-600 hover:text-green-700 font-semibold transition">
              Seja Médico
            </Link>
            {session?.user ? (
              <Link href="/paciente" className="text-gray-700 hover:text-primary transition">
                Área do Paciente
              </Link>
            ) : (
              <Link 
                href="https://wa.me/5521993686082" 
                target="_blank"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
              >
                <Phone size={18} />
                Falar com Especialista
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu com Animações */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay escuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Menu */}
            <motion.div
              id="mobile-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 md:hidden overflow-y-auto"
              role="navigation"
              aria-label="Menu de navegação mobile"
            >
              <div className="px-4 pt-4 pb-6 space-y-2">
                <Link 
                  href="/" 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition min-h-[44px] flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  Início
                </Link>
                <Link 
                  href="/sobre-nos" 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition min-h-[44px] flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sobre Nós
                </Link>
                <Link 
                  href="/blog" 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition min-h-[44px] flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  Blog
                </Link>
                <Link 
                  href="/galeria" 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition min-h-[44px] flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  Galeria
                </Link>
                <Link 
                  href="/seja-medico" 
                  className="block px-4 py-3 text-green-600 hover:bg-green-50 rounded-lg transition min-h-[44px] flex items-center font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Seja Médico
                </Link>
                {session?.user && (
                  <Link 
                    href="/paciente" 
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition min-h-[44px] flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Área do Paciente
                  </Link>
                )}
                <Link 
                  href="https://wa.me/5521993686082" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 bg-primary text-white rounded-lg text-center mt-2 min-h-[44px] flex items-center justify-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Phone size={18} />
                  Falar com Especialista
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
