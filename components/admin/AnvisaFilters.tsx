'use client';

interface AnvisaFiltersProps {
  filters: {
    status: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function AnvisaFilters({ filters, onFiltersChange }: AnvisaFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="SUBMITTED">Submetida</option>
            <option value="UNDER_REVIEW">Em Análise</option>
            <option value="APPROVED">Aprovada</option>
            <option value="REJECTED">Rejeitada</option>
          </select>
        </div>
      </div>
    </div>
  );
}
