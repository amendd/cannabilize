'use client';

import { useEffect, useState } from 'react';
import { Calendar, FileText, Clock, CheckCircle } from 'lucide-react';

interface PatientDashboardProps {
  patientId: string;
}

export default function PatientDashboard({ patientId }: PatientDashboardProps) {
  const [stats, setStats] = useState({
    totalConsultations: 0,
    completedConsultations: 0,
    totalPrescriptions: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetch(`/api/patients/${patientId}/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, [patientId]);

  const statCards = [
    {
      title: 'Consultas Realizadas',
      value: stats.totalConsultations,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Consultas Concluídas',
      value: stats.completedConsultations,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Receitas Emitidas',
      value: stats.totalPrescriptions,
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      title: 'Pagamentos Pendentes',
      value: stats.pendingPayments,
      icon: Clock,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
