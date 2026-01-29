'use client';

import { Download } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  format?: 'csv' | 'json';
}

export default function ExportButton({ data, filename = 'export', format = 'csv' }: ExportButtonProps) {
  const handleExport = () => {
    if (format === 'csv') {
      // Converter para CSV
      if (data.length === 0) return;

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((header) => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
    } else {
      // Exportar JSON
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.json`;
      link.click();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={data.length === 0}
    >
      <Download size={18} />
      Exportar {format.toUpperCase()}
    </Button>
  );
}
