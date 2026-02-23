'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { playNewConsultationSound, playConsultationStartingSound } from '@/lib/doctor-alert-sounds';

const POLL_INTERVAL_MS = 60 * 1000; // 1 minuto

interface ConsultationItem {
  id: string;
  scheduledAt: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: string;
  patient: { name: string };
}

function useDoctorAlerts() {
  const { data: session, status } = useSession();
  const knownIdsRef = useRef<Set<string>>(new Set());
  const firstFetchDoneRef = useRef(false);
  const alerted5MinRef = useRef<Set<string>>(new Set());
  const alerted1MinRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (status !== 'authenticated') return;
    const role = session?.user?.role;
    const isDoctor = role === 'DOCTOR';
    const isAdminImpersonating =
      role === 'ADMIN' &&
      typeof window !== 'undefined' &&
      !!sessionStorage.getItem('admin_impersonated_doctor_id');
    if (!isDoctor && !isAdminImpersonating) return;

    const consultationsUrl =
      isAdminImpersonating && typeof window !== 'undefined'
        ? `/api/doctors/me/consultations?doctorId=${sessionStorage.getItem('admin_impersonated_doctor_id')}`
        : '/api/doctors/me/consultations';

    const alertSoundUrl =
      isAdminImpersonating && typeof window !== 'undefined'
        ? `/api/doctors/me/alert-sound?doctorId=${sessionStorage.getItem('admin_impersonated_doctor_id')}`
        : '/api/doctors/me/alert-sound';

    const poll = async () => {
      try {
        // Respeitar configuração global (admin) e preferência do médico (mutado)
        let alertsEnabled = true;
        try {
          const prefRes = await fetch(alertSoundUrl);
          if (prefRes.ok) {
            const pref = await prefRes.json();
            alertsEnabled = pref.globalEnabled === true && pref.muted !== true;
          }
        } catch {
          // manter alertsEnabled true se falhar
        }

        const res = await fetch(consultationsUrl);
        if (!res.ok) return;
        const consultations: ConsultationItem[] = await res.json();

        const now = new Date();

        // 1) Nova consulta agendada
        const currentIds = new Set(consultations.map((c) => c.id));
        if (firstFetchDoneRef.current) {
          currentIds.forEach((id) => {
            if (!knownIdsRef.current.has(id) && alertsEnabled) {
              playNewConsultationSound();
              toast('Nova consulta agendada!', {
                icon: '📅',
                duration: 5000,
              });
            }
          });
        } else {
          firstFetchDoneRef.current = true;
        }
        knownIdsRef.current = new Set([...knownIdsRef.current, ...currentIds]);

        // 2) Consulta próxima do início (5 min e 1 min)
        if (!alertsEnabled) return;

        consultations.forEach((c) => {
          if (c.status !== 'SCHEDULED') return;
          const dateStr = c.scheduledDate || new Date(c.scheduledAt).toISOString().split('T')[0];
          const timeStr =
            c.scheduledTime || new Date(c.scheduledAt).toTimeString().slice(0, 5);
          const consultationDateTime = new Date(`${dateStr}T${timeStr}`);
          const remainingMs = consultationDateTime.getTime() - now.getTime();
          const remainingMin = remainingMs / (60 * 1000);
          const patientName = c.patient?.name || 'Paciente';

          if (remainingMin > 5) return;

          if (remainingMin > 1 && remainingMin <= 5) {
            if (!alerted5MinRef.current.has(c.id)) {
              alerted5MinRef.current.add(c.id);
              playConsultationStartingSound();
              toast(`Consulta em 5 minutos: ${patientName}`, {
                icon: '⏰',
                duration: 6000,
              });
            }
            return;
          }

          if (remainingMin > 0 && remainingMin <= 1) {
            if (!alerted1MinRef.current.has(c.id)) {
              alerted1MinRef.current.add(c.id);
              playConsultationStartingSound();
              toast(`Consulta em 1 minuto: ${patientName}`, {
                icon: '🔔',
                duration: 6000,
              });
            }
          }
        });
      } catch {
        // Silenciar erros de rede no polling
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, session?.user?.role]);
}

/**
 * Provider que roda o polling de alertas para o médico (nova consulta + consulta próxima).
 * Não renderiza nada; apenas usa efeitos.
 */
export default function DoctorAlertsProvider() {
  useDoctorAlerts();
  return null;
}
