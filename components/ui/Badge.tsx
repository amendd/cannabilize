import { ReactNode } from 'react';
import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  status?: string;
  className?: string;
}

export default function Badge({ children, variant, status, className }: BadgeProps) {
  if (status) {
    return (
      <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(status), className)}>
        {children}
      </span>
    );
  }

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', variants[variant || 'default'], className)}>
      {children}
    </span>
  );
}
