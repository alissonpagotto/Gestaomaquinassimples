import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Trash2, 
  MessageCircle,
} from 'lucide-react';
import { Supplier } from '../../types';
import { cleanDigits } from '../../lib/formatters';
import { SupplierModal } from './SupplierModal';
import { useConfirm } from '../../context/ConfirmContext';

interface SuppliersModuleProps {

  suppliers: Supplier[];
  onSaveSuppliers: (suppliers: Supplier[]) => void;
}

export const SuppliersModule: React.FC<SuppliersModuleProps> = ({
  suppliers,
  onSaveSuppliers,
}) => {
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredSuppliers = suppliers.filter(sup =>
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sup.tradeName && sup.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sup.city && sup.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sup.cnpjOrCpf && sup.cnpjOrCpf.includes(searchTerm))
  );

  const handleDelete = async (id: string) => {
    const sup = suppliers.find(s => s.id === id);
    const isConfirmed = await confirm({
      title: 'Excluir Fornecedor',
      message: sup?.name
        ? `Deseja realmente excluir o fornecedor "${sup.name}"?`
        : 'Deseja realmente excluir este fornecedor?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      onSaveSuppliers(suppliers.filter(s => s.id !== id));
    }
  };


  const getCategoryBadge = (cat: string) => {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
        {cat}
      </span>
    );
  };

  return (
    <div id="suppliers-module" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <h2 className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight font-['Outfit']">
            Fornecedores & Parceiros Agrícolas
          </h2>
          <p className="text-xs text-black dark:text-stone-400 mt-0.5 font-bold">
            Cadastro e gestão de fornecedores de insumos, peças e serviços
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#009688] hover:bg-[#00796b] text-white shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Fornecedor</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar fornecedor por razão social, CNPJ, categoria ou cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#009688] outline-none"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => (
          <div 
            key={sup.id}
            className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-slate-400 dark:border-stone-800 rounded-xl p-5 space-y-3 shadow-xs hover:border-slate-500 transition flex flex-col justify-between text-black dark:text-white"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-black dark:text-stone-100 text-sm">
                    {sup.name}
                  </h3>
                  {sup.tradeName && sup.tradeName !== sup.name && (
                    <p className="text-xs text-black/90 dark:text-stone-400 font-bold">
                      {sup.tradeName}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/80 dark:bg-emerald-950 text-black dark:text-emerald-300 border border-slate-300 dark:border-emerald-800">
                  {sup.category}
                </span>
              </div>

              <div className="space-y-1 text-xs text-black dark:text-stone-400 pt-2 border-t border-slate-400/60 dark:border-stone-800">
                {sup.cnpjOrCpf && (
                  <div className="flex items-center space-x-2">
                    <Building className="w-3.5 h-3.5 text-black dark:text-stone-400 shrink-0" />
                    <span className="text-black dark:text-stone-300 font-semibold">CNPJ/CPF: {sup.cnpjOrCpf}</span>
                  </div>
                )}
                {sup.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-black dark:text-stone-400 shrink-0" />
                    <span className="text-black dark:text-stone-300 font-semibold">{sup.phone}</span>
                  </div>
                )}
                {sup.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-black dark:text-stone-400 shrink-0" />
                    <span className="truncate text-black dark:text-stone-300 font-semibold">{sup.email}</span>
                  </div>
                )}
                {(sup.city || sup.state) && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-black dark:text-stone-400 shrink-0" />
                    <span className="text-black dark:text-stone-300 font-semibold">
                      {sup.address ? `${sup.address} - ` : ''}
                      {sup.city}{sup.state ? `/${sup.state}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-400/60 dark:border-stone-800">
              <span className="text-[10px] text-black/80 dark:text-stone-400 font-bold">
                ID: {sup.id}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(sup.id)}
                className="p-1 text-black hover:text-rose-700 dark:text-stone-400 dark:hover:text-rose-500 transition rounded cursor-pointer"
                title="Excluir fornecedor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* WhatsApp button */}
            {sup.phone && cleanDigits(sup.phone).length >= 10 && (
              <a
                href={`https://wa.me/55${cleanDigits(sup.phone)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 w-full py-2 bg-white/80 dark:bg-emerald-950/50 hover:bg-white dark:hover:bg-emerald-900/50 text-black dark:text-emerald-300 text-xs font-black rounded-lg transition flex items-center justify-center space-x-1.5 border border-slate-300 dark:border-emerald-800/60 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-black dark:text-emerald-400" />
                <span>Conversar no WhatsApp</span>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Reusable Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(newSup) => {
          onSaveSuppliers([...suppliers, newSup]);
        }}
      />

    </div>
  );
};
