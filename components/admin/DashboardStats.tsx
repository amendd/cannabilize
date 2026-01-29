'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, FileText, DollarSign } from 'lucide-react';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalPrescriptions: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const statCards = [
    {
      title: 'Pacientes',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Consultas',
      value: stats.totalConsultations,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Receitas',
      value: stats.totalPrescriptions,
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      title: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
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
