'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { searchCID10, findCID10ByCode, type CID10Code } from '@/lib/cid10-data';

interface CID10SelectorProps {
  value?: string;
  onChange: (code: string, description: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function CID10Selector({
  value,
  onChange,
  disabled = false,
  required = false,
}: CID10SelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CID10Code[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<CID10Code | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar código selecionado quando value mudar
  useEffect(() => {
    if (value) {
      const code = findCID10ByCode(value);
      if (code) {
        setSelectedCode(code);
        setSearchQuery(`${code.code} - ${code.description}`);
      } else {
        setSearchQuery(value);
      }
    } else {
      setSelectedCode(null);
      setSearchQuery('');
    }
  }, [value]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchResults = searchCID10(query);
    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
  };

  const handleSelect = (code: CID10Code) => {
    setSelectedCode(code);
    setSearchQuery(`${code.code} - ${code.description}`);
    setIsOpen(false);
    onChange(code.code, code.description);
  };

  const handleClear = () => {
    setSelectedCode(null);
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    onChange('', '');
    inputRef.current?.focus();
  };

  const displayValue = selectedCode 
    ? `${selectedCode.code} - ${selectedCode.description}`
    : searchQuery;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        CID-10 {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={18} 
          />
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length > 0 && results.length > 0) {
                setIsOpen(true);
              }
            }}
            disabled={disabled}
            placeholder="Buscar CID-10 (ex: G50.9, dor neuropática, epilepsia...)"
            className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${
              required && !selectedCode ? 'border-red-300' : ''
            }`}
          />
          {selectedCode && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <p className="text-xs text-gray-600">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="py-1">
              {results.map((code) => (
                <button
                  key={code.code}
                  type="button"
                  onClick={() => handleSelect(code)}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                    selectedCode?.code === code.code ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-primary">{code.code}</span>
                        {selectedCode?.code === code.code && (
                          <Check size={16} className="text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{code.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{code.category}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há resultados */}
        {isOpen && results.length === 0 && searchQuery.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              Nenhum código CID-10 encontrado para "{searchQuery}"
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              Tente buscar por código (ex: G50.9) ou descrição (ex: dor neuropática)
            </p>
          </div>
        )}
      </div>

      {required && !selectedCode && (
        <p className="mt-1 text-xs text-red-600">CID-10 é obrigatório</p>
      )}
    </div>
  );
}
