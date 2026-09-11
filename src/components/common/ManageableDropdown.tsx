import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Plus } from 'lucide-react';

interface ManageableDropdownProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onOptionsChange: (newOptions: string[]) => void;
  placeholder?: string;
  newItemPlaceholder?: string;
  className?: string;
  showCheckmark?: boolean;
}

export const ManageableDropdown: React.FC<ManageableDropdownProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  onOptionsChange,
  placeholder = 'Selecione...',
  newItemPlaceholder = 'Novo item...',
  className = '',
  showCheckmark = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  const handleAddNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    if (!options.includes(trimmed)) {
      const updated = [...options, trimmed];
      onOptionsChange(updated);
    }
    onChange(trimmed);
    setNewItemText('');
    setIsOpen(false);
  };

  const handleDeleteOption = (e: React.MouseEvent, optToDelete: string) => {
    e.stopPropagation();
    const updated = options.filter(opt => opt !== optToDelete);
    onOptionsChange(updated);
    if (value === optToDelete) {
      onChange(updated.length > 0 ? updated[0] : '');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} id={id}>
      {label && (
        <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
          {label}
        </label>
      )}

      {/* Button Header Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b] transition cursor-pointer text-left"
      >
        <span className="truncate">{value === 'mecanico_especialista' ? 'Mecanico Especialista' : (value || placeholder)}</span>
        <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu matching the user screenshot */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60 no-scrollbar">
            {options.map((opt) => {
              const isSelected = 
                opt === value || 
                (opt === 'Mecanico Especialista' && value === 'mecanico_especialista') ||
                (opt.toLowerCase() === value.toLowerCase());
              return (
                <div
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`group flex items-center justify-between px-3 py-2 text-xs sm:text-sm cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-stone-900 dark:text-stone-100 font-semibold'
                      : 'text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  
                  <div className="flex items-center space-x-1 shrink-0">
                    {isSelected && showCheckmark && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteOption(e, opt)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-rose-500 rounded transition cursor-pointer"
                      title="Excluir opção"
                    >
                      <X className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              );
            })}

            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-stone-400 italic text-center">
                Nenhuma opção cadastrada
              </div>
            )}
          </div>

          {/* Bottom Add New Option Section */}
          <div className="p-2 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/90 flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNew();
                }
              }}
              placeholder={newItemPlaceholder}
              className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-[#00897b]"
            />
            <button
              type="button"
              onClick={() => handleAddNew()}
              disabled={!newItemText.trim()}
              className="shrink-0 inline-flex items-center space-x-0.5 px-2 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
