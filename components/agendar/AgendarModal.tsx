'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Leaf, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

function buildPrefillMessage(template: string, name: string, pathologies: string[]): string {
  const pathologiesList = pathologies.length
    ? pathologies.map((p, i) => `${i + 1}. ${p}`).join('\n')
    : '';
  return template
    .replace(/\{\{name\}\}/g, name.trim())
    .replace(/\{\{pathologies\}\}/g, pathologiesList);
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const PATHOLOGIES = [
  'Alcoolismo',
  'Ansiedade',
  'Perda de peso',
  'Obesidade',
  'Depressão',
  'Dores',
  'Epilepsia',
  'Insônia',
  'Tabagismo',
  'Autismo',
  'Enxaqueca',
  'Fibromialgia',
  'Parkinson',
  'TDAH',
  'Alzheimer',
  'Anorexia',
  'Crohn',
  'Intestino irritável',
];

interface CaptureFunnelApi {
  mobile: { funnelType: string };
  desktop: { funnelType: string };
  whatsappNumber: string;
  whatsappNumberForUrl: string;
  whatsappPrefillTemplate: string;
}

interface AgendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPathologies?: string[];
}

export default function AgendarModal({ isOpen, onClose, initialPathologies = [] }: AgendarModalProps) {
  const router = useRouter();
  const [config, setConfig] = useState<CaptureFunnelApi | null>(null);
  const [selectedPathologies, setSelectedPathologies] = useState<string[]>(initialPathologies);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [step, setStep] = useState<'form' | 'next-steps'>('form');

  useEffect(() => {
    if (initialPathologies.length > 0) {
      setSelectedPathologies(initialPathologies);
    }
  }, [initialPathologies.join(',')]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setLoading(true);
    setRedirecting(false);
    fetch('/api/config/capture-funnel')
      .then((res) => res.json())
      .then((data) => {
        const mobile = isMobileDevice();
        const funnelType = mobile ? data?.mobile?.funnelType : data?.desktop?.funnelType;
        if (funnelType === 'SITE') {
          setRedirecting(true);
          router.replace('/agendamento');
          onClose();
          return;
        }
        if (funnelType === 'WHATSAPP') {
          // Via WhatsApp: vai direto para o chat; a captação (nome, CPF, idade, anamnese) é feita no próprio WhatsApp
          const number = data?.whatsappNumberForUrl ?? (data?.whatsappNumber?.replace(/\D/g, '') || '5521999999999');
          const defaultMessage = 'Olá, gostaria de agendar uma consulta.';
          const url = `https://wa.me/${number}?text=${encodeURIComponent(defaultMessage)}`;
          setRedirecting(true);
          window.open(url, '_blank', 'noopener,noreferrer');
          onClose();
          return;
        }
        setConfig(data);
      })
      .catch(() =>
        setConfig({
          mobile: { funnelType: 'SITE' },
          desktop: { funnelType: 'SITE' },
          whatsappNumber: '+5521999999999',
          whatsappNumberForUrl: '5521999999999',
          whatsappPrefillTemplate: 'Olá, me chamo {{name}}.\n\nPatologias selecionadas:\n{{pathologies}}',
        })
      )
      .finally(() => setLoading(false));
  }, [isOpen, router, onClose]);

  const togglePathology = (pathology: string) => {
    setSelectedPathologies((prev) =>
      prev.includes(pathology) ? prev.filter((p) => p !== pathology) : [...prev, pathology]
    );
  };

  const handleFalarComMedico = () => {
    const trimmedName = name.trim() || 'Visitante';
    const template = config?.whatsappPrefillTemplate ?? 'Olá, me chamo {{name}}.\n\nPatologias selecionadas:\n{{pathologies}}';
    const message = buildPrefillMessage(template, trimmedName, selectedPathologies);
    const number = config?.whatsappNumberForUrl ?? '5521999999999';
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setStep('next-steps');
  };

  const handleVoltar = () => {
    onClose();
  };

  if (!isOpen) return null;

  if (loading || redirecting) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
        onClick={handleVoltar}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1" />
          </div>

          {step === 'next-steps' ? (
            <>
              <div className="bg-green-50 px-6 py-6 text-center">
                <div className="flex justify-center mb-3">
                  <span className="flex items-center justify-center w-14 h-14 rounded-full bg-green-200 text-green-700">
                    <CheckCircle size={28} />
                  </span>
                </div>
                <h2 id="modal-title" className="text-lg font-bold text-gray-900">
                  Próximos passos
                </h2>
                <p className="text-sm text-gray-600 mt-2 text-left max-w-sm mx-auto">
                  Abra o <strong>WhatsApp</strong> (aba ou app que abrimos para você), envie a mensagem que já está pronta. Nossa equipe responderá em breve com as orientações e o link para pagamento e agendamento.
                </p>
              </div>
              <div className="px-6 py-5">
                <Button
                  onClick={handleVoltar}
                  className="w-full bg-green-600 hover:bg-green-700 text-white border-0"
                >
                  Entendi, fechar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 px-6 py-5 text-center">
                <div className="flex justify-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700">
                    <User size={20} />
                  </span>
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700">
                    <Leaf size={20} />
                  </span>
                </div>
                <h1 id="modal-title" className="text-lg font-bold text-gray-900">
                  Falta pouco para você iniciar sua jornada!
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Preencha seus dados e fale com um médico especialista.
                </p>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div>
                  <label htmlFor="agendar-nome" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome *
                  </label>
                  <input
                    id="agendar-nome"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você se chama?"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
                  />
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Para qual condição você busca um tratamento?
                  </span>
                  {selectedPathologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedPathologies.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1.5 bg-gray-50/50">
                    {PATHOLOGIES.map((pathology) => (
                      <label
                        key={pathology}
                        className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-green-50/80"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPathologies.includes(pathology)}
                          onChange={() => togglePathology(pathology)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-800">{pathology}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleFalarComMedico}
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white border-0"
                  >
                    <MessageSquare size={18} />
                    Falar com médico
                  </Button>
                  <button
                    type="button"
                    onClick={handleVoltar}
                    className="px-4 py-2.5 border-2 border-green-600 text-green-600 font-medium rounded-lg hover:bg-green-50 transition"
                  >
                    Voltar à página inicial
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500">
                  Prefere o formulário completo?{' '}
                  <Link href="/agendamento" className="text-green-600 hover:underline font-medium" onClick={onClose}>
                    Agendar no site
                  </Link>
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
