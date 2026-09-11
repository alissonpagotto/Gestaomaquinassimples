import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  DollarSign, 
  Calendar,
  Building,
  Tag
} from 'lucide-react';
import { Expense } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface PayablesTabProps {
  expenses: Expense[];
  onToggleStatus: (id: string) => void;
  onEditExpense?: (exp: Expense) => void;
  onViewReceipt?: (exp: Expense) => void;
  onNewExpense?: () => void;
}

export const PayablesTab: React.FC<PayablesTabProps> = ({
  expenses,
  onToggleStatus,
  onEditExpense,
  onViewReceipt,
  onNewExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago'>('all');

  const pendingExpenses = expenses.filter((e) => e.status === 'pendente');
  const paidExpenses = expenses.filter((e) => e.status === 'pago');

  const totalPending = pendingExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalPaid = paidExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalGeneral = expenses.reduce((acc, e) => acc + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      (e.supplier && e.supplier.toLowerCase().includes(q)) ||
      (e.categoryName && e.categoryName.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-3">
      {/* KPI Cards (Compact) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between text-black">
          <div>
            <span className="text-[11px] font-black text-black uppercase tracking-wider block">
              A Pagar (Pendentes)
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-700 mt-0.5 font-['Outfit']">
              {formatCurrencyBRL(totalPending)}
            </div>
            <p className="text-[11px] text-black/70 font-medium">
              {pendingExpenses.length} títulos pendentes
            </p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0 border border-amber-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between text-black">
          <div>
            <span className="text-[11px] font-black text-black uppercase tracking-wider block">
              Total Já Liquidado
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5 font-['Outfit']">
              {formatCurrencyBRL(totalPaid)}
            </div>
            <p className="text-[11px] text-black/70 font-medium">
              {paidExpenses.length} pagos realizados
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between text-black">
          <div>
            <span className="text-[11px] font-black text-black uppercase tracking-wider block">
              Volume Total de Contas
            </span>
            <div className="text-lg sm:text-xl font-black text-black mt-0.5 font-['Outfit']">
              {formatCurrencyBRL(totalGeneral)}
            </div>
            <p className="text-[11px] text-black/70 font-medium">
              {expenses.length} despesas no total
            </p>
          </div>
          <div className="p-2 rounded-lg bg-slate-100 text-black shrink-0 border border-slate-200">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Bar (Compact) */}
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-black">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-black hover:bg-slate-200'
            }`}
          >
            Todas ({expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pendente')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'pendente'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-black hover:bg-slate-200'
            }`}
          >
            A Pagar ({pendingExpenses.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pago')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'pago'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-black hover:bg-slate-200'
            }`}
          >
            Pagas ({paidExpenses.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-black absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar fornecedor, despesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-black placeholder-slate-400 outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>
      </div>

      {/* Payables List Table (Dense & Compact) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-black text-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Vencimento / Data</th>
                <th className="py-2 px-3">Fornecedor / Descrição</th>
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3">Pagamento</th>
                <th className="py-2 px-3 text-right">Valor (R$)</th>
                <th className="py-2 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(exp.id)}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border ${
                          exp.status === 'pago'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                        }`}
                        title={exp.status === 'pago' ? 'Clique para marcar como Pendente' : 'Clique para marcar como Pago'}
                      >
                        {exp.status === 'pago' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pago</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>A Pagar</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-2 px-3 font-bold text-black whitespace-nowrap text-xs">
                      {formatDateBR(exp.date)}
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-bold text-black text-xs">
                        {exp.supplier || 'Sem fornecedor informado'}
                      </div>
                      <div className="text-[11px] text-black/75 font-medium">
                        {exp.description}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-black">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-black border border-slate-200 text-[11px] font-bold">
                        {exp.categoryName || 'Geral'}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-black font-medium capitalize text-xs">
                      {exp.paymentMethod || 'A Definir'}
                    </td>

                    <td className="py-2 px-3 text-right font-black text-black whitespace-nowrap text-xs font-['Outfit']">
                      {formatCurrencyBRL(exp.amount)}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(exp.id)}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded border transition cursor-pointer ${
                          exp.status === 'pago'
                            ? 'border-slate-300 text-black hover:bg-slate-100'
                            : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {exp.status === 'pago' ? 'Estornar' : 'Liquidar'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-black font-medium text-xs">
                    Nenhuma conta a pagar encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
