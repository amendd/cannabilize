'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';

const AgendarModal = dynamic(() => import('./AgendarModal'), { ssr: false });

interface AgendarModalContextValue {
  openAgendarModal: (options?: { pathologies?: string[] }) => void;
  closeAgendarModal: () => void;
}

const AgendarModalContext = createContext<AgendarModalContextValue | null>(null);

export function useAgendarModal() {
  const ctx = useContext(AgendarModalContext);
  if (!ctx) {
    throw new Error('useAgendarModal must be used within AgendarModalProvider');
  }
  return ctx;
}

export function AgendarModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialPathologies, setInitialPathologies] = useState<string[]>([]);

  const openAgendarModal = useCallback((options?: { pathologies?: string[] }) => {
    setInitialPathologies(options?.pathologies ?? []);
    setIsOpen(true);
  }, []);

  const closeAgendarModal = useCallback(() => {
    setIsOpen(false);
    setInitialPathologies([]);
  }, []);

  return (
    <AgendarModalContext.Provider value={{ openAgendarModal, closeAgendarModal }}>
      {children}
      {isOpen && (
        <AgendarModal
          isOpen={isOpen}
          onClose={closeAgendarModal}
          initialPathologies={initialPathologies}
        />
      )}
    </AgendarModalContext.Provider>
  );
}
