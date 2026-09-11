import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sprout, 
  DollarSign, 
  Package, 
  TrendingUp, 
  HardHat, 
  Users, 
  ShieldCheck, 
  Car, 
  Wrench, 
  Truck, 
  UserSquare2, 
  UploadCloud, 
  FileSpreadsheet, 
  Settings,
  ReceiptText,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  LucideIcon 
} from 'lucide-react';

export interface ShortcutDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
}

export const ALL_SHORTCUTS: ShortcutDefinition[] = [
  { id: 'servicos', label: 'Serviços', icon: Sprout, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-500' },
  { id: 'venda', label: 'Venda', icon: ShoppingCart, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500' },
  { id: 'despesas', label: 'Despesas', icon: DollarSign, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500' },
  { id: 'estoque', label: 'Estoque', icon: Package, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40', iconColor: 'text-sky-500' },
  { id: 'financeiro', label: 'Financeiro', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-500' },
  { id: 'fiscal', label: 'Fiscal (NF-e)', icon: ReceiptText, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40', iconColor: 'text-sky-500' },
  { id: 'rh', label: 'RH', icon: HardHat, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500' },
  { id: 'clientes', label: 'Clientes', icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40', iconColor: 'text-indigo-500' },
  { id: 'frotas', label: 'Painel Frota', icon: ShieldCheck, color: 'text-stone-700 bg-stone-100 dark:bg-stone-800', iconColor: 'text-slate-600 dark:text-slate-400' },
  { id: 'veiculos', label: 'Veículos', icon: Car, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40', iconColor: 'text-cyan-500' },
  { id: 'manutencoes', label: 'Manutenções', icon: Wrench, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500' },
  { id: 'fornecedores', label: 'Fornecedores', icon: Truck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40', iconColor: 'text-purple-500' },
  { id: 'funcionarios', label: 'Funcionários', icon: UserSquare2, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500' },
  { id: 'nfe_importar', label: 'Importar NF-e', icon: UploadCloud, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40', iconColor: 'text-sky-500' },
  { id: 'relatorios', label: 'Relatórios', icon: FileSpreadsheet, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40', iconColor: 'text-teal-500' },
  { id: 'configuracoes', label: 'Ajustes', icon: Settings, color: 'text-stone-600 bg-stone-100 dark:bg-stone-800', iconColor: 'text-stone-500' },
];

export const DEFAULT_SHORTCUT_IDS = [
  'servicos',
  'venda',
  'despesas',
  'estoque',
  'financeiro',
  'fiscal',
  'rh',
  'clientes',
  'frotas',
  'veiculos',
  'manutencoes',
  'fornecedores',
  'funcionarios',
  'nfe_importar',
  'relatorios',
  'configuracoes',
];

interface CustomizeShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShortcuts: string[];
  onSave: (newSelected: string[]) => void;
}

export const CustomizeShortcutsModal: React.FC<CustomizeShortcutsModalProps> = ({
  isOpen,
  onClose,
  selectedShortcuts,
  onSave,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string[]>(selectedShortcuts);
  const [activeTab, setActiveTab] = useState<'visibilidade' | 'ordem'>('visibilidade');

  useEffect(() => {
    if (isOpen) {
      setCurrentSelected(selectedShortcuts);
    }
  }, [isOpen, selectedShortcuts]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setCurrentSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const moveShortcut = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...currentSelected];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setCurrentSelected(newOrder);
  };

  const handleSavePreferences = () => {
    onSave(currentSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Standardized Solid Teal Bar */}
        <div className="px-5 py-3.5 bg-[#009688] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5" />
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                Personalizar Atalhos do Topo
              </h3>
              <p className="text-[11px] text-teal-100 font-medium">
                Escolha os módulos exibidos e organize a ordem de exibição
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs: Visibilidade vs Ordem */}
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800 px-5 pt-3 bg-stone-50 dark:bg-stone-800/40">
          <button
            type="button"
            onClick={() => setActiveTab('visibilidade')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'visibilidade'
                ? 'border-[#009688] text-[#009688] dark:text-teal-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            1. Selecionar Atalhos ({currentSelected.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ordem')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'ordem'
                ? 'border-[#009688] text-[#009688] dark:text-teal-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            2. Organizar Ordem
          </button>
        </div>

        {/* Shortcuts Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {activeTab === 'visibilidade' ? (
            <>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                SELECIONE OS MÓDULOS DE ACESSO RÁPIDO:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {ALL_SHORTCUTS.map((shortcut) => {
                  const isChecked = currentSelected.includes(shortcut.id);
                  const Icon = shortcut.icon;

                  return (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() => handleToggle(shortcut.id)}
                      className={`
                        w-full px-3.5 py-2.5 rounded-xl border flex items-center space-x-3 transition cursor-pointer text-left select-none
                        ${
                          isChecked
                            ? 'border-[#009688] bg-teal-50/50 dark:bg-teal-950/20 text-stone-900 dark:text-stone-100 shadow-xs'
                            : 'border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                        }
                      `}
                    >
                      {/* Custom Checkbox */}
                      <div className={`
                        w-5 h-5 rounded-md flex items-center justify-center transition shrink-0
                        ${isChecked ? 'bg-[#009688] text-white' : 'border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'}
                      `}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      {/* Shortcut Icon */}
                      <Icon className={`w-4 h-4 shrink-0 ${shortcut.iconColor}`} />

                      {/* Shortcut Label */}
                      <span className={`text-xs font-bold tracking-tight truncate ${isChecked ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>
                        {shortcut.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                ORDENAR ATALHOS ATIVOS (SUBIR / DESCER):
              </label>
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {currentSelected.length === 0 ? (
                  <p className="text-xs text-stone-500 text-center py-6">Nenhum atalho selecionado. Selecione atalhos na aba anterior.</p>
                ) : (
                  currentSelected.map((id, index) => {
                    const def = ALL_SHORTCUTS.find(s => s.id === id);
                    if (!def) return null;
                    const Icon = def.icon;
                    const isFirst = index === 0;
                    const isLast = index === currentSelected.length - 1;

                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/60"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <span className="w-5 h-5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <Icon className={`w-4 h-4 shrink-0 ${def.iconColor}`} />
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                            {def.label}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveShortcut(index, 'up')}
                            disabled={isFirst}
                            className="p-1 rounded-md text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 transition cursor-pointer"
                            title="Subir"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveShortcut(index, 'down')}
                            disabled={isLast}
                            className="p-1 rounded-md text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 transition cursor-pointer"
                            title="Descer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* Actions - Standardized */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setCurrentSelected(DEFAULT_SHORTCUT_IDS)}
              className="inline-flex items-center space-x-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#009688] hover:bg-[#00796b] text-white shadow-xs transition cursor-pointer"
              >
                Salvar Preferências
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
