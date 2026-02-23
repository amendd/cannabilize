'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  children,
  className = '',
}: EmptyStateProps) {
  const isAgendar = actionHref === '/agendar';

  return (
    <div
      className={`bg-white rounded-xl shadow-md p-12 text-center border border-gray-100 ${className}`}
    >
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-purple-50 text-purple-500">
          <Icon size={48} strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      {children}
      {actionLabel && actionHref && !children && (
        isAgendar ? (
          <AgendarTrigger
            className="inline-flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            {actionLabel}
          </AgendarTrigger>
        ) : (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            {actionLabel}
          </Link>
        )
      )}
    </div>
  );
}
