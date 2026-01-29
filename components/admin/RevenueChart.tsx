'use client';

import { useEffect, useState } from 'react';

interface RevenueChartData {
  period: string;
  revenue: number;
}

interface RevenueChartProps {
  data?: RevenueChartData[];
  period?: string;
}

export default function RevenueChart({ data, period = 'month' }: RevenueChartProps) {
  const [chartData, setChartData] = useState<RevenueChartData[]>([]);

  useEffect(() => {
    if (data) {
      setChartData(data);
    }
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Carregando gráfico de receitas...
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  const minRevenue = Math.min(...chartData.map(d => d.revenue));
  const range = maxRevenue - minRevenue || 1;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-display">
        Receita por {period === 'day' ? 'Dia' : period === 'month' ? 'Mês' : 'Ano'}
      </h3>
      <div className="space-y-4" role="img" aria-label={`Gráfico de receita por ${period}`}>
        {chartData.map((item, index) => {
          const percentage = ((item.revenue - minRevenue) / range) * 100;
          const barHeight = Math.max(percentage, 5); // Mínimo de 5% para visibilidade

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.period}</span>
                <span className="text-green-600 font-semibold">
                  R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${barHeight}%` }}
                  aria-label={`R$ ${item.revenue.toLocaleString('pt-BR')} em ${item.period}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {chartData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total no período:</span>
            <span className="text-lg font-bold text-green-600">
              R$ {chartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
