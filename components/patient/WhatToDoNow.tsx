'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import type { NextStepAction } from '@/lib/patient-treatment-status';

interface WhatToDoNowProps {
  action: NextStepAction | null;
  /** Se não houver ação, mostrar mensagem de acompanhamento */
  emptyMessage?: string;
}

export default function WhatToDoNow({
  action,
  emptyMessage = 'Você está em dia. Qualquer nova etapa aparecerá aqui.',
}: WhatToDoNowProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
    >
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        O que você precisa fazer agora
      </h2>
      {action ? (
        <Link
          href={action.href}
          className="flex items-center justify-between gap-4 p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100/80 hover:border-purple-200 transition group"
        >
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">{action.label}</p>
              {action.description && (
                <p className="text-sm text-gray-600 mt-0.5">{action.description}</p>
              )}
            </div>
          </div>
          <span className="text-purple-600 font-medium group-hover:translate-x-1 transition-transform">
            Fazer agora →
          </span>
        </Link>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
          <p className="text-gray-700">{emptyMessage}</p>
        </div>
      )}
    </motion.section>
  );
}
