import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="col-span-1 md:col-span-2">
            <Image
              src="/images/cannalize-logo.png"
              alt="CannabiLize"
              width={150}
              height={50}
              className="h-12 w-auto mb-4"
            />
            <p className="text-gray-400 mb-4">
              Líder em tratamentos com cannabis medicinal na América Latina. 
              Democratizando o acesso ao tratamento com consultas acessíveis e suporte completo.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/cannalize/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition"
              >
                <Instagram size={24} />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-primary transition"
              >
                <Facebook size={24} />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-primary transition"
              >
                <Youtube size={24} />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-primary transition">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/sobre-nos" className="text-gray-400 hover:text-primary transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-primary transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/galeria" className="text-gray-400 hover:text-primary transition">
                  Galeria
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a 
                  href="https://wa.me/5521993686082" 
                  target="_blank"
                  className="hover:text-primary transition"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:contato@cannalize.com" className="hover:text-primary transition">
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} CannabiLize. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
