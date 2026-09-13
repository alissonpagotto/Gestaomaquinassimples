import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Plus } from 'lucide-react';

interface ManageableMultiSelectProps {
  id?: string;
  label?: string;
  values: string[];
  onChange: (newValues: string[]) => void;
  options: string[];
  onOptionsChange: (newOptions: string[]) => void;
  placeholder?: string;
  newItemPlaceholder?: string;
  className?: string;
}

export const ManageableMultiSelect: React.FC<ManageableMultiSelectProps> = ({
  id,
  label,
  values = [],
  onChange,
  options,
  onOptionsChange,
  placeholder = 'Selecione um ou mais cargos...',
  newItemPlaceholder = 'Novo cargo...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown ao clicar fora do componente
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

  // Alterna a seleção de uma opção
  const handleToggleOption = (opt: string) => {
    const isAlreadySelected = values.some(
      v => v.toLowerCase() === opt.toLowerCase()
    );

    let updated: string[];
    if (isAlreadySelected) {
      updated = values.filter(v => v.toLowerCase() !== opt.toLowerCase());
    } else {
      updated = [...values, opt];
    }
    onChange(updated);
  };

  // Remove tag específica
  const handleRemoveTag = (e: React.MouseEvent, optToRemove: string) => {
    e.stopPropagation();
    const updated = values.filter(v => v.toLowerCase() !== optToRemove.toLowerCase());
    onChange(updated);
  };

  // Cadastra novo item no rodapé do menu
  const handleAddNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    // Adiciona na lista de opções se ainda não existir
    if (!options.some(opt => opt.toLowerCase() === trimmed.toLowerCase())) {
      const updatedOpts = [...options, trimmed].sort((a, b) => a.localeCompare('pt-BR'));
      onOptionsChange(updatedOpts);
    }

    // Seleciona automaticamente o novo cargo adicionado
    if (!values.some(v => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...values, trimmed]);
    }

    setNewItemText('');
  };

  // Exclui uma opção cadastrada da lista
  const handleDeleteOption = (e: React.MouseEvent, optToDelete: string) => {
    e.stopPropagation();
    const updatedOpts = options.filter(opt => opt !== optToDelete);
    onOptionsChange(updatedOpts);
    if (values.some(v => v.toLowerCase() === optToDelete.toLowerCase())) {
      onChange(values.filter(v => v.toLowerCase() !== optToDelete.toLowerCase()));
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} id={id}>
      {label && (
        <label className="block text-xs font-bold text-black mb-1">
          {label}
        </label>
      )}

      {/* Caixa de disparo do Dropdown com as Tags selecionadas */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[38px] flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-black text-xs sm:text-sm font-medium focus-within:ring-1 focus-within:ring-[#0963cb] focus-within:border-[#0963cb] transition cursor-pointer"
      >
        <div className="flex-1 flex flex-wrap gap-1.5 items-center">
          {values.length === 0 ? (
            <span className="text-stone-400 text-xs sm:text-sm select-none">
              {placeholder}
            </span>
          ) : (
            values.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-100 text-[#0963cb] border border-sky-200 select-none transition shadow-2xs"
              >
                <span>{val}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveTag(e, val)}
                  className="p-0.5 hover:bg-sky-200/80 rounded transition cursor-pointer text-[#0963cb]"
                  title={`Remover cargo ${val}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Menu com Opções e Rodapé de Adição */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[260px] bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Cabeçalho informativo curto */}
          <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
            <span>Selecione múltiplos cargos</span>
            {values.length > 0 && (
              <span className="text-[#0963cb] font-bold">
                {values.length} selecionado{values.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Lista de Opções */}
          <div className="max-h-52 overflow-y-auto divide-y divide-stone-100 no-scrollbar">
            {options.map((opt) => {
              const isSelected = values.some(
                v => v.toLowerCase() === opt.toLowerCase()
              );
              return (
                <div
                  key={opt}
                  onClick={() => handleToggleOption(opt)}
                  className={`group flex items-center justify-between px-3 py-2 text-xs sm:text-sm cursor-pointer transition ${
                    isSelected
                      ? 'bg-sky-50/80 text-[#0963cb] font-semibold'
                      : 'text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    {/* Checkbox customizado */}
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition ${
                        isSelected
                          ? 'bg-[#0963cb] border-[#0963cb] text-white'
                          : 'border-stone-300 bg-white group-hover:border-stone-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{opt}</span>
                  </div>

                  {/* Botão para excluir a opção customizada se necessário */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteOption(e, opt)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-rose-500 rounded transition cursor-pointer shrink-0"
                    title="Excluir opção"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-stone-400 italic text-center">
                Nenhum cargo cadastrado
              </div>
            )}
          </div>

          {/* Rodapé: Input "Novo cargo..." e Botão "+ Adicionar" */}
          <div className="p-2 border-t border-stone-200 bg-stone-50 flex items-center gap-1.5">
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
              className="flex-1 px-2.5 py-1 text-xs bg-white border border-stone-300 rounded-lg text-black outline-none focus:ring-1 focus:ring-[#0963cb]"
            />
            <button
              type="button"
              onClick={() => handleAddNew()}
              disabled={!newItemText.trim()}
              className="shrink-0 inline-flex items-center space-x-0.5 px-2.5 py-1 text-xs font-semibold text-[#0963cb] hover:text-[#0852a8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition rounded"
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
