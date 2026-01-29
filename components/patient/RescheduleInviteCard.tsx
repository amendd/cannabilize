'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Check, X, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface RescheduleInvite {
  id: string;
  consultationId: string;
  currentScheduledAt: string;
  newScheduledAt: string;
  newScheduledDate: string;
  newScheduledTime: string;
  message: string | null;
  status: string;
  expiresAt: string;
  doctor: {
    id: string;
    name: string;
  };
}

interface RescheduleInviteCardProps {
  invite: RescheduleInvite;
  onRespond?: () => void;
}

export default function RescheduleInviteCard({
  invite,
  onRespond,
}: RescheduleInviteCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(invite.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expirado');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [invite.expiresAt]);

  const handleRespond = async (action: 'ACCEPT' | 'REJECT') => {
    try {
      setResponding(true);
      
      // Se estiver em modo de impersonação, passar patientId como query param
      const patientId = typeof window !== 'undefined' 
        ? sessionStorage.getItem('admin_impersonated_patient_id')
        : null;
      
      const url = patientId
        ? `/api/reschedule-invites/${invite.id}/respond?patientId=${patientId}`
        : `/api/reschedule-invites/${invite.id}/respond`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao responder convite');
      }

      if (action === 'ACCEPT') {
        toast.success('Consulta remarcada com sucesso!');
      } else {
        toast.success('Convite recusado');
      }

      onRespond?.();
    } catch (error: any) {
      console.error('Erro ao responder convite:', error);
      toast.error(error.message || 'Erro ao responder convite');
    } finally {
      setResponding(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = new Date() > new Date(invite.expiresAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-6 shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Clock className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Oportunidade de Adiantar Consulta
            </h3>
            <p className="text-sm text-gray-600">
              Dr(a). {invite.doctor.name} sugeriu um horário mais próximo
            </p>
          </div>
        </div>
        {!isExpired && (
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Tempo restante</div>
            <div className="text-lg font-bold text-primary">{timeRemaining}</div>
          </div>
        )}
      </div>

      {/* Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar size={16} />
            <span className="text-sm font-medium">Horário Atual</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {formatDateTime(invite.currentScheduledAt)}
          </p>
        </div>

        <div className="bg-primary/10 rounded-lg p-4 border-2 border-primary/30">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Clock size={16} />
            <span className="text-sm font-medium">Novo Horário Proposto</span>
          </div>
          <p className="text-sm font-bold text-primary">
            {formatDateTime(invite.newScheduledAt)}
          </p>
        </div>
      </div>

      {/* Mensagem do Médico */}
      {invite.message && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <p className="text-sm text-gray-700">
            <strong>💬 Mensagem do médico:</strong>
          </p>
          <p className="text-sm text-gray-600 mt-1">{invite.message}</p>
        </div>
      )}

      {/* Aviso de Expiração */}
      {isExpired && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Este convite expirou</span>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      {!isExpired && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleRespond('REJECT')}
            disabled={responding}
            className="flex-1"
          >
            <X size={18} />
            Recusar
          </Button>
          <Button
            variant="primary"
            onClick={() => handleRespond('ACCEPT')}
            loading={responding}
            disabled={responding}
            className="flex-1"
          >
            <Check size={18} />
            Aceitar Convite
          </Button>
        </div>
      )}
    </motion.div>
  );
}
