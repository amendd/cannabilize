'use client';

import { useSession } from 'next-auth/react';
import { useEffectiveDoctorId } from './useEffectiveDoctorId';
import { X, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDoctorImpersonationBanner() {
  const { data: session } = useSession();
  const { isImpersonating, clearImpersonation } = useEffectiveDoctorId();

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
            <p className="font-semibold">Modo Administrador - Visualizando como Médico</p>
            <p className="text-sm text-yellow-100">
              Você está navegando na conta de um médico. Suas ações serão registradas como administrador.
            </p>
          </div>
        </div>
        <button
          onClick={clearImpersonation}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition font-medium text-sm"
          title="Sair do modo médico"
        >
          <X size={18} />
          Sair
        </button>
      </div>
    </motion.div>
  );
}
