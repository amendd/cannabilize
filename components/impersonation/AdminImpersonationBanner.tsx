'use client';

import { useSession } from 'next-auth/react';
import { useEffectivePatientId } from './useEffectivePatientId';
import { X, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminImpersonationBanner() {
  const { data: session } = useSession();
  const { isImpersonating, clearImpersonation } = useEffectivePatientId();

  if (!isImpersonating || session?.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-yellow-500 text-white px-4 py-3 shadow-lg"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User size={20} />
          <div>
            <p className="font-semibold">Modo Administrador - Visualizando como Paciente</p>
            <p className="text-sm text-yellow-100">
              Você está navegando na conta de um paciente. Suas ações serão registradas como administrador.
            </p>
          </div>
        </div>
        <button
          onClick={clearImpersonation}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition font-medium text-sm"
          title="Sair do modo paciente"
        >
          <X size={18} />
          Sair
        </button>
      </div>
    </motion.div>
  );
}
