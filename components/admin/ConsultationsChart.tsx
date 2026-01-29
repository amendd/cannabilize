'use client';

import { useEffect, useState } from 'react';

interface ChartData {
  month: string;
  consultations: number;
  completed: number;
}

interface ConsultationsChartProps {
  data?: ChartData[];
}

export default function ConsultationsChart({ data }: ConsultationsChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (data) {
      setChartData(data);
    } else {
      // Dados mockados para demonstração
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
      setChartData(months.map(month => ({
        month,
        consultations: Math.floor(Math.random() * 50) + 20,
        completed: Math.floor(Math.random() * 40) + 15,
      })));
    }
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Carregando gráfico...
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.consultations, d.completed))
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-display">
        Consultas por Mês
      </h3>
      <div className="space-y-4" role="img" aria-label="Gráfico de consultas por mês">
        {chartData.map((item, index) => {
          const consultationPercentage = (item.consultations / maxValue) * 100;
          const completedPercentage = (item.completed / maxValue) * 100;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.month}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    {item.consultations} total
                  </span>
                  <span className="text-green-600">
                    {item.completed} concluídas
                  </span>
                </div>
              </div>
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                {/* Barra de total */}
                <div
                  className="absolute inset-0 bg-blue-500 rounded-full"
                  style={{ width: `${consultationPercentage}%` }}
                  aria-label={`${item.consultations} consultas em ${item.month}`}
                />
                {/* Barra de concluídas (sobreposta) */}
                <div
                  className="absolute inset-0 bg-green-500 rounded-full"
                  style={{ width: `${completedPercentage}%` }}
                  aria-label={`${item.completed} consultas concluídas em ${item.month}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Total</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Concluídas</span>
        </div>
      </div>
    </div>
  );
}
