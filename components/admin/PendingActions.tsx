'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, FileText, Shield } from 'lucide-react';

export default function PendingActions() {
  const [pending, setPending] = useState({
    consultations: 0,
    prescriptions: 0,
    anvisa: 0,
  });

  useEffect(() => {
    fetch('/api/admin/pending')
      .then(res => res.json())
      .then(data => setPending(data))
      .catch(err => console.error(err));
  }, []);

  const actions = [
    {
      title: 'Consultas Pendentes',
      count: pending.consultations,
      icon: AlertCircle,
      link: '/admin/consultas?status=SCHEDULED',
      color: 'bg-blue-500',
    },
    {
      title: 'Receitas para Emitir',
      count: pending.prescriptions,
      icon: FileText,
      link: '/admin/prescriptions?status=pending',
      color: 'bg-purple-500',
    },
    {
      title: 'Autorizações ANVISA',
      count: pending.anvisa,
      icon: Shield,
      link: '/admin/anvisa?status=PENDING',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Link
            key={index}
            href={action.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${action.color} p-3 rounded-lg`}>
                <Icon size={24} className="text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{action.count}</span>
            </div>
            <p className="text-gray-600">{action.title}</p>
          </Link>
        );
      })}
    </div>
  );
}
