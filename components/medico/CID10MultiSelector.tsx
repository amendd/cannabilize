'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { searchCID10, findCID10ByCode, type CID10Code } from '@/lib/cid10-data';

interface CID10MultiSelectorProps {
  value?: string[] | string;
  onChange: (codes: string[], lastSelected?: { code: string; description: string } | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function CID10MultiSelector({
  value,
  onChange,
  disabled = false,
  required = false,
}: CID10MultiSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CID10Code[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<CID10Code[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value -> internal selected list
  useEffect(() => {
    const codes = Array.isArray(value) ? value : value ? [value] : [];
    const normalized = codes
      .map((c) => c?.trim())
      .filter(Boolean) as string[];

    const unique = Array.from(new Set(normalized));
    const mapped = unique.map((code) => {
      const found = findCID10ByCode(code);
      if (found) return found;
      return { code, description: '', category: '' } as CID10Code;
    });
    setSelected(mapped);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const emitChange = (next: CID10Code[], lastSelected?: CID10Code | null) => {
    onChange(
      next.map((c) => c.code),
      lastSelected ? { code: lastSelected.code, description: lastSelected.description } : null
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchResults = searchCID10(query);
    setResults(searchResults);
    setIsOpen(true);
  };

  const handleSelect = (code: CID10Code) => {
    if (selected.some((s) => s.code === code.code)) {
      setIsOpen(false);
      setSearchQuery('');
      setResults([]);
      return;
    }
    const next = [...selected, code];
    setSelected(next);
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
    emitChange(next, code);
    inputRef.current?.focus();
  };

  const removeCode = (code: string) => {
    const next = selected.filter((c) => c.code !== code);
    setSelected(next);
    emitChange(next, null);
  };

  const clearAll = () => {
    setSelected([]);
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    emitChange([], null);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        CID-10 {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim().length > 0 && results.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          placeholder="Buscar CID-10 e adicionar (ex: G50.9, epilepsia, dor neuropática...)"
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${
            required && selected.length === 0 ? 'border-red-300' : ''
          }`}
        />

        {selected.length > 0 && !disabled && (
          <button
            type="button"
            onClick={clearAll}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Limpar todos"
          >
            <X size={18} />
          </button>
        )}

        {/* Chips */}
        {selected.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.map((c) => (
              <span
                key={c.code}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-sm text-blue-900"
              >
                <span className="font-semibold">{c.code}</span>
                {c.description ? (
                  <span className="text-blue-800">{c.description}</span>
                ) : null}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeCode(c.code)}
                    className="text-blue-700 hover:text-blue-900"
                    aria-label={`Remover ${c.code}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <p className="text-xs text-gray-600">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="py-1">
              {results.map((code) => {
                const already = selected.some((s) => s.code === code.code);
                return (
                  <button
                    key={code.code}
                    type="button"
                    onClick={() => handleSelect(code)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                      already ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary">{code.code}</span>
                          {already && <Check size={16} className="text-green-600" />}
                        </div>
                        <p className="text-sm text-gray-700">{code.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{code.category}</p>
                      </div>
                      <div className="text-xs text-gray-500">{already ? 'Adicionado' : 'Adicionar'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {isOpen && results.length === 0 && searchQuery.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              Nenhum código CID-10 encontrado para "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {required && selected.length === 0 && (
        <p className="mt-1 text-xs text-red-600">Selecione pelo menos um CID-10</p>
      )}
    </div>
  );
}

