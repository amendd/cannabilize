'use client';

import { useState, useEffect } from 'react';
import { Video, X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

interface VideoCallWindowProps {
  meetingLink: string | null;
  /** Zoom: link para o host INICIAR a reunião (evita "aguardando host"). Passar apenas para médico. */
  meetingStartUrl?: string | null;
  consultationId: string;
  onStartMeeting?: () => void;
  onOpenExternal?: () => void;
  canStart?: boolean;
  minutesUntil?: number;
  platform?: 'ZOOM' | 'GOOGLE_MEET' | 'OTHER';
}

type WindowMode = 'embedded' | 'floating' | 'fullscreen' | 'minimized';

export default function VideoCallWindow({
  meetingLink,
  meetingStartUrl = null,
  consultationId,
  onStartMeeting,
  onOpenExternal,
  canStart = false,
  minutesUntil,
  platform = 'OTHER',
}: VideoCallWindowProps) {
  const [windowMode, setWindowMode] = useState<WindowMode>('embedded');
  const [isLoading, setIsLoading] = useState(true);

  // Detectar se é Zoom ou Google Meet para ajustar o iframe
  const isZoom = meetingLink?.includes('zoom.us');
  const isGoogleMeet = meetingLink?.includes('meet.google.com') || meetingLink?.includes('meet/');

  // Função para obter URL do iframe (Zoom e Google Meet têm restrições, então usamos fallback)
  const getIframeUrl = () => {
    if (!meetingLink) return null;
    
    // Zoom não permite iframe facilmente, então vamos usar uma abordagem diferente
    // Google Meet também tem restrições, mas podemos tentar
    if (isGoogleMeet) {
      // Tentar usar o link do Google Meet diretamente
      return meetingLink;
    }
    
    // Para outras plataformas ou como fallback
    return meetingLink;
  };

  // Zoom: médico deve abrir meetingStartUrl (host) para INICIAR a reunião; participante usa meetingLink (join)
  const urlToOpen = meetingStartUrl || meetingLink;
  const handleOpenExternal = () => {
    if (urlToOpen) {
      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      onOpenExternal?.();
    }
  };

  const handleStartMeeting = () => {
    if (onStartMeeting) {
      onStartMeeting();
    }
  };

  // Renderizar conteúdo baseado no modo da janela
  const renderContent = () => {
    if (!meetingLink && !canStart) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <div className="text-center">
            <Video className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Reunião não disponível
            </h3>
            {minutesUntil !== undefined && minutesUntil > 0 && (
              <p className="text-sm text-gray-500">
                Disponível em {minutesUntil} {minutesUntil === 1 ? 'minuto' : 'minutos'}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (!meetingLink && canStart) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="text-center">
            <Video className="mx-auto text-green-600 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Pronto para iniciar a consulta
            </h3>
            <Button
              onClick={handleStartMeeting}
              variant="primary"
              className="mt-4"
            >
              <Video size={18} />
              Iniciar Reunião
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              A reunião será aberta nesta janela após ser criada
            </p>
          </div>
        </div>
      );
    }

    if (meetingLink) {
      // Zoom e Google Meet têm restrições de iframe, então mostramos uma opção melhor
      if (isZoom || isGoogleMeet) {
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-center max-w-md">
              <Video className="mx-auto text-blue-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {isZoom ? 'Reunião Zoom' : 'Reunião Google Meet'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {isZoom 
                  ? 'Para melhor experiência, abra a reunião em uma nova janela. Você pode minimizar esta janela e continuar usando a plataforma.'
                  : 'A reunião será aberta em uma nova janela para melhor experiência.'}
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleOpenExternal}
                  variant="primary"
                  className="w-full"
                >
                  <ExternalLink size={18} />
                  Abrir Reunião em Nova Janela
                </Button>
                {windowMode !== 'minimized' && (
                  <button
                    onClick={() => setWindowMode('minimized')}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Minimizar e continuar na plataforma
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Para outras plataformas, tentar iframe
      return (
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-sm">Carregando reunião...</p>
              </div>
            </div>
          )}
          <iframe
            src={getIframeUrl() || ''}
            className="w-full h-full border-0"
            allow="camera; microphone; fullscreen; autoplay"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            title="Video Call"
          />
        </div>
      );
    }

    return null;
  };

  // Renderizar controles da janela
  const renderControls = () => {
    if (!meetingLink && !canStart) return null;

    return (
      <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1">
          <Video size={16} className="text-primary" />
          <span className="text-sm font-medium text-gray-700">
            {meetingLink ? 'Reunião Ativa' : 'Aguardando Início'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {windowMode === 'embedded' && (
            <>
              <button
                onClick={() => setWindowMode('floating')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Separar janela"
              >
                <Maximize2 size={16} className="text-gray-600" />
              </button>
              <button
                onClick={() => setWindowMode('fullscreen')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Tela cheia"
              >
                <Maximize2 size={16} className="text-gray-600" />
              </button>
            </>
          )}
          {windowMode === 'floating' && (
            <>
              <button
                onClick={() => setWindowMode('embedded')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Restaurar"
              >
                <Minimize2 size={16} className="text-gray-600" />
              </button>
              <button
                onClick={() => setWindowMode('fullscreen')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Tela cheia"
              >
                <Maximize2 size={16} className="text-gray-600" />
              </button>
            </>
          )}
          {windowMode === 'fullscreen' && (
            <button
              onClick={() => setWindowMode('embedded')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Sair da tela cheia"
            >
              <Minimize2 size={16} className="text-gray-600" />
            </button>
          )}
          {meetingLink && (
            <button
              onClick={handleOpenExternal}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Abrir em nova janela"
            >
              <ExternalLink size={16} className="text-gray-600" />
            </button>
          )}
          {windowMode !== 'embedded' && (
            <button
              onClick={() => setWindowMode('embedded')}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-red-600"
              title="Fechar"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Modo minimizado
  if (windowMode === 'minimized') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <button
          onClick={() => setWindowMode('embedded')}
          className="bg-primary text-white px-4 py-3 rounded-lg shadow-lg hover:bg-primary-dark transition flex items-center gap-2"
        >
          <Video size={18} />
          <span className="font-medium">Reunião Ativa</span>
          <Maximize2 size={16} />
        </button>
      </motion.div>
    );
  }

  // Modo tela cheia
  if (windowMode === 'fullscreen') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
        >
          {renderControls()}
          <div className="h-[calc(100vh-60px)]">
            {renderContent()}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Modo flutuante
  if (windowMode === 'floating') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-4 right-4 z-50 w-[600px] h-[450px] bg-white rounded-lg shadow-2xl overflow-hidden"
          drag
          dragMomentum={false}
        >
          {renderControls()}
          <div className="h-[calc(100%-60px)]">
            {renderContent()}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Modo embutido (padrão)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      {renderControls()}
      <div className="h-[500px]">
        {renderContent()}
      </div>
    </motion.div>
  );
}
