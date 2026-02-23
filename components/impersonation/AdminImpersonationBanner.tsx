'use client';

import { useSession } from 'next-auth/react';
import { useEffectivePatientId } from './useEffectivePatientId';
import { X } from 'lucide-react';

export default function AdminImpersonationBanner() {
  const { data: session } = useSession();
  const { isImpersonating, clearImpersonation } = useEffectivePatientId();

  if (!isImpersonating || session?.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm">
      <span className="text-xs font-medium text-amber-800">
        Modo de visualização administrativa ativo
      </span>
      <button
        onClick={clearImpersonation}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
        title="Sair do modo paciente"
      >
        <X size={14} />
        Sair
      </button>
    </div>
  );
}
