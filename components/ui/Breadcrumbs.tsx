'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Base da navegação: "/" ou "/paciente" para área do paciente */
  baseHref?: string;
}

export default function Breadcrumbs({ items, baseHref = '/' }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className="mb-6"
    >
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link 
            href={baseHref} 
            className="text-gray-500 hover:text-purple-600 transition-colors"
            aria-label={baseHref === '/paciente' ? 'Área do paciente' : 'Página inicial'}
          >
            <Home size={16} />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight size={16} className="text-gray-400 mx-2" aria-hidden="true" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-purple-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
