'use client';

import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportGeneratorProps {
  consultationId: string;
}

export default function ReportGenerator({ consultationId }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar laudo');
      }

      const data = await response.json();
      
      // Criar link de download
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-${consultationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Laudo gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar laudo');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText size={24} className="text-primary" />
        Gerar Laudo Médico
      </h2>
      <p className="text-gray-600 mb-6">
        Gere um laudo médico completo em PDF com todas as informações da consulta.
      </p>
      <button
        onClick={generateReport}
        disabled={isGenerating}
        className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 flex items-center gap-2"
      >
        <Download size={20} />
        {isGenerating ? 'Gerando...' : 'Gerar Laudo PDF'}
      </button>
    </div>
  );
}
