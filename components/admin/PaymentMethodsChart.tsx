'use client';

import { useEffect, useState } from 'react';

interface PaymentMethodData {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

interface PaymentMethodsChartProps {
  data?: PaymentMethodData[];
}

const METHOD_LABELS: Record<string, string> = {
  'CREDIT_CARD': 'Cartão de Crédito',
  'DEBIT_CARD': 'Cartão de Débito',
  'PIX': 'PIX',
  'BOLETO': 'Boleto',
  'STRIPE': 'Stripe',
  'MERCADO_PAGO': 'Mercado Pago',
  'NÃO INFORMADO': 'Não Informado',
};

const METHOD_COLORS: Record<string, string> = {
  'CREDIT_CARD': 'bg-blue-500',
  'DEBIT_CARD': 'bg-blue-400',
  'PIX': 'bg-green-500',
  'BOLETO': 'bg-yellow-500',
  'STRIPE': 'bg-purple-500',
  'MERCADO_PAGO': 'bg-cyan-500',
  'NÃO INFORMADO': 'bg-gray-500',
};

export default function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const [chartData, setChartData] = useState<PaymentMethodData[]>([]);

  useEffect(() => {
    if (data) {
      setChartData(data);
    }
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Carregando análise de formas de pagamento...
        </div>
      </div>
    );
  }

  const totalRevenue = chartData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-display">
        Análise por Forma de Pagamento
      </h3>
      <div className="space-y-4">
        {chartData.map((item, index) => {
          const label = METHOD_LABELS[item.method] || item.method;
          const color = METHOD_COLORS[item.method] || 'bg-gray-500';

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    {item.count} {item.count === 1 ? 'pagamento' : 'pagamentos'}
                  </span>
                  <span className="text-green-600 font-semibold">
                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-gray-500 text-xs">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-0 ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                  aria-label={`${item.percentage.toFixed(1)}% do total em ${label}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {chartData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="text-lg font-bold text-gray-900">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
