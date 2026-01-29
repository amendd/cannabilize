'use client';

import { motion } from 'framer-motion';
import { SkeletonTable } from './Skeleton';

export default function Loading({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`rounded-full border-2 border-primary border-t-transparent ${sizes[size]}`}
      />
    </div>
  );
}

export function LoadingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="text-center">
        <Loading size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-gray-600"
        >
          Carregando...
        </motion.p>
      </div>
    </motion.div>
  );
}

export function LoadingTable() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center py-12"
    >
      <div className="text-center">
        <Loading size="md" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-gray-600"
        >
          Carregando dados...
        </motion.p>
      </div>
    </motion.div>
  );
}

export function LoadingTableSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-12"
    >
      <SkeletonTable />
    </motion.div>
  );
}
