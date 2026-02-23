'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const MESSAGES = [
  'Seu tratamento está sendo acompanhado pela equipe CannabiLize.',
  'Estamos monitorando cada etapa do seu processo.',
];

interface InstitutionalMessageProps {
  /** Índice da mensagem (0 ou 1) ou aleatório se não informado */
  index?: number;
  className?: string;
}

export default function InstitutionalMessage({
  index = Math.floor(Math.random() * MESSAGES.length) % MESSAGES.length,
  className = '',
}: InstitutionalMessageProps) {
  const message = MESSAGES[index];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className={`flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 px-4 py-3 ${className}`}
    >
      <Heart className="w-5 h-5 text-purple-500 flex-shrink-0" />
      <p className="text-sm text-gray-700">{message}</p>
    </motion.div>
  );
}
