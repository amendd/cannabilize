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
    ...chartData.map(d => d.consultations),
    1
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-display">
        Consultas por mês
      </h3>
      <div className="space-y-4" role="img" aria-label="Gráfico de consultas por mês (barras empilhadas: total e concluídas)">
        {chartData.map((item, index) => {
          const totalWidth = (item.consultations / maxValue) * 100;
          const completedWidth = item.consultations > 0
            ? (item.completed / item.consultations) * 100
            : 0;

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
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                {/* Barra empilhada: concluídas (verde) à esquerda, restante (azul) à direita */}
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${totalWidth * (completedWidth / 100)}%` }}
                  aria-label={`${item.completed} consultas concluídas em ${item.month}`}
                />
                <div
                  className="h-full bg-blue-400 transition-all"
                  style={{ width: `${totalWidth * (1 - completedWidth / 100)}%` }}
                  aria-label={`${item.consultations - item.completed} consultas não concluídas em ${item.month}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-sm text-gray-600">Concluídas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded" />
          <span className="text-sm text-gray-600">Não concluídas</span>
        </div>
      </div>
    </div>
  );
}
