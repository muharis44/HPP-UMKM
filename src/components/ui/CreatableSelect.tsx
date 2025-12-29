import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, X, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CreatableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  onCreateOption?: (inputValue: string) => Promise<Option | null>;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  createLabel?: string;
}

export default function CreatableSelect({
  label,
  value,
  onChange,
  options,
  onCreateOption,
  placeholder = 'Pilih...',
  error,
  disabled,
  createLabel = 'Tambah',
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const showCreateOption =
    onCreateOption &&
    search.trim() &&
    !filteredOptions.some((o) => o.label.toLowerCase() === search.toLowerCase());

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreate = async () => {
    if (!onCreateOption || !search.trim()) return;

    setIsCreating(true);
    try {
      const newOption = await onCreateOption(search.trim());
      if (newOption) {
        onChange(newOption.value);
      }
    } finally {
      setIsCreating(false);
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-left border rounded-lg bg-white
            flex items-center justify-between gap-2
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
            disabled:bg-slate-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-slate-300'}
          `}
        >
          <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <span
                role="button"
                onClick={handleClear}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-slate-200">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari atau ketik untuk tambah..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="max-h-44 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-2 text-left text-sm flex items-center justify-between
                    hover:bg-slate-50 transition-colors
                    ${option.value === value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}
                  `}
                >
                  {option.label}
                  {option.value === value && <Check className="w-4 h-4" />}
                </button>
              ))}

              {filteredOptions.length === 0 && !showCreateOption && (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  Tidak ditemukan
                </div>
              )}

              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-emerald-50 text-emerald-700 border-t border-slate-200"
                >
                  <Plus className="w-4 h-4" />
                  {isCreating ? 'Menambahkan...' : `${createLabel} "${search}"`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
