import React, { useState, useMemo } from 'react';
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
  Tag,
  Landmark,
  UserCheck,
  RotateCcw,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Expense, BankAccount, Employee, PaymentMethod } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';
import { PaymentSettlementModal } from './PaymentSettlementModal';
import { useConfirm } from '../../context/ConfirmContext';

interface PayablesTabProps {
  expenses: Expense[];
  bankAccounts?: BankAccount[];
  employees?: Employee[];
  onToggleStatus: (id: string) => void;
  onSettleExpense?: (params: {
    expenseId: string;
    paymentDate: string;
    paidByEmployeeId: string;
    paidByEmployeeName: string;
    bankAccountId: string;
    bankAccountName: string;
    paymentMethod: PaymentMethod;
    authenticationCode?: string;
    notes?: string;
  }) => void;
  onReverseExpense?: (id: string) => void;
  onEditExpense?: (exp: Expense) => void;
  onViewReceipt?: (exp: Expense) => void;
  onNewExpense?: () => void;
}

export const PayablesTab: React.FC<PayablesTabProps> = ({
  expenses,
  bankAccounts = [],
  employees = [],
  onToggleStatus,
  onSettleExpense,
  onReverseExpense,
  onEditExpense,
  onViewReceipt,
  onNewExpense,
}) => {
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago'>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // Filtro opcional por intervalo de datas
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal de Baixa de Pagamento
  const [settlementExpense, setSettlementExpense] = useState<Expense | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Month filter list based on current system date
  const monthFilterOptions = useMemo(() => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const options: { key: string; label: string; year: number; month: number }[] = [];

    for (let offset = -1; offset <= 5; offset++) {
      const d = new Date(currentYear, currentMonth + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = monthNames[m];
      options.push({ key, label, year: y, month: m });
    }

    return options;
  }, []);

  const pendingExpenses = expenses.filter((e) => e.status === 'pendente');
  const paidExpenses = expenses.filter((e) => e.status === 'pago');

  const totalPending = pendingExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalPaid = paidExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalGeneral = expenses.reduce((acc, e) => acc + e.amount, 0);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredExpenses = expenses.filter((e) => {
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;

    // Monthly filter based on dueDate (or date as fallback)
    let matchesMonth = true;
    if (selectedMonthKey) {
      const targetDate = e.dueDate || e.date;
      if (targetDate) {
        matchesMonth = targetDate.startsWith(selectedMonthKey);
      } else {
        matchesMonth = false;
      }
    }

    // Intervalo de datas personalizado (se informado)
    let matchesDateRange = true;
    const targetDate = e.dueDate || e.date;
    if (startDate && targetDate && targetDate < startDate) matchesDateRange = false;
    if (endDate && targetDate && targetDate > endDate) matchesDateRange = false;

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      (e.supplier && e.supplier.toLowerCase().includes(q)) ||
      (e.categoryName && e.categoryName.toLowerCase().includes(q)) ||
      (e.paidByEmployeeName && e.paidByEmployeeName.toLowerCase().includes(q)) ||
      (e.bankAccountName && e.bankAccountName.toLowerCase().includes(q));

    return matchesStatus && matchesMonth && matchesDateRange && matchesSearch;
  });

  // Handler para clique no botão de status ou liquidar
  const handleActionClick = (exp: Expense) => {
    if (exp.status === 'pago') {
      // Se já está pago, confirma o estorno
      handleReverseClick(exp);
    } else {
      // Se está pendente, abre o modal de baixa com responsável e banco
      setSettlementExpense(exp);
      setIsSettlementModalOpen(true);
    }
  };

  const handleReverseClick = async (exp: Expense) => {
    const bankMsg = exp.bankAccountName ? ` O saldo de ${formatCurrencyBRL(exp.amount)} será devolvido à conta ${exp.bankAccountName}.` : '';
    const isConfirmed = await confirm({
      title: 'Estornar Pagamento da Despesa',
      message: `Deseja realmente estornar o pagamento de "${exp.description}" (${formatCurrencyBRL(exp.amount)})?${bankMsg} O status voltará para "A Pagar".`,
      confirmLabel: 'Sim, Estornar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });

    if (isConfirmed) {
      if (onReverseExpense) {
        onReverseExpense(exp.id);
      } else {
        onToggleStatus(exp.id);
      }
    }
  };

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
              {pendingExpenses.length} títulos aguardando liquidação
            </p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0 border border-amber-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between text-black">
          <div>
            <span className="text-[11px] font-black text-black uppercase tracking-wider block">
              Liquidadas (Pagas)
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5 font-['Outfit']">
              {formatCurrencyBRL(totalPaid)}
            </div>
            <p className="text-[11px] text-black/70 font-medium">
              {paidExpenses.length} despesas baixadas no banco
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
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 text-black">
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

          {/* Divisor sutil entre status e meses */}
          <div className="h-4 w-px bg-slate-300 mx-0.5 shrink-0 hidden sm:block" />

          {/* Botões de Filtro por Mês */}
          {monthFilterOptions.map((m) => {
            const isSelected = selectedMonthKey === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonthKey(isSelected ? null : m.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-black hover:bg-slate-200'
                }`}
                title={`Filtrar por ${m.label}/${m.year}`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-black absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar fornecedor, despesa, responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-black placeholder-slate-400 outline-none focus:ring-1 focus:ring-sky-600 font-medium"
            />
          </div>

          {onNewExpense && (
            <button
              type="button"
              onClick={onNewExpense}
              className="px-3 py-1.5 bg-[#0963cb] hover:bg-blue-700 text-white text-xs font-black rounded-lg transition shadow-2xs shrink-0 flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Nova Despesa</span>
            </button>
          )}
        </div>
      </div>

      {/* Payables List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-black text-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Vencimento</th>
                <th className="py-2.5 px-3">Fornecedor / Descrição</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Responsável / Banco</th>
                <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => {
                  const isPaid = exp.status === 'pago';
                  const dueDateVal = exp.dueDate || exp.date || '';
                  const isOverdue = !isPaid && dueDateVal && dueDateVal < todayStr;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition">
                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleActionClick(exp)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border ${
                            isPaid
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                          }`}
                          title={isPaid ? 'Clique para estornar o pagamento' : 'Clique para registrar a baixa do pagamento'}
                        >
                          {isPaid ? (
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

                      {/* Vencimento com Identificação de Atraso */}
                      <td className="py-2.5 px-3 font-bold text-black whitespace-nowrap text-xs">
                        <div className="font-mono">
                          {dueDateVal ? formatDateBR(dueDateVal) : '—'}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            Vencida
                          </span>
                        )}
                        {isPaid && exp.paymentDate && (
                          <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                            Pago em {formatDateBR(exp.paymentDate)}
                          </div>
                        )}
                      </td>

                      {/* Fornecedor / Descrição */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-black text-xs">
                          {exp.supplier || 'Sem fornecedor informado'}
                        </div>
                        <div className="text-[11px] text-black/75 font-medium">
                          {exp.description}
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-2.5 px-3 text-black">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-black border border-slate-200 text-[11px] font-bold">
                          {exp.categoryName || 'Geral'}
                        </span>
                      </td>

                      {/* Responsável pelo Pagamento & Banco de Débito */}
                      <td className="py-2.5 px-3 text-black text-xs">
                        {isPaid ? (
                          <div className="space-y-0.5">
                            {exp.paidByEmployeeName && (
                              <div className="flex items-center space-x-1 font-bold text-emerald-900 text-[11px]">
                                <UserCheck className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span className="truncate" title={`Quem pagou: ${exp.paidByEmployeeName}`}>
                                  {exp.paidByEmployeeName}
                                </span>
                              </div>
                            )}
                            {exp.bankAccountName && (
                              <div className="flex items-center space-x-1 text-stone-600 text-[10px] font-semibold">
                                <Landmark className="w-3 h-3 text-[#0963cb] shrink-0" />
                                <span className="truncate" title={`Debitado de: ${exp.bankAccountName}`}>
                                  {exp.bankAccountName}
                                </span>
                              </div>
                            )}
                            {!exp.paidByEmployeeName && !exp.bankAccountName && (
                              <span className="text-stone-400 text-[11px] italic">Pago sem registro</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-stone-500 font-medium">
                            {exp.bankAccountName ? (
                              <span className="flex items-center space-x-1 text-stone-600">
                                <Landmark className="w-3 h-3 text-[#0963cb] shrink-0" />
                                <span>Previsto: {exp.bankAccountName}</span>
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">A definir na baixa</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-2.5 px-3 text-right font-black text-black whitespace-nowrap text-xs font-['Outfit']">
                        {formatCurrencyBRL(exp.amount)}
                      </td>

                      {/* Ações */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          id={`btn-acao-baixa-${exp.id}`}
                          onClick={() => handleActionClick(exp)}
                          className={`text-[11px] font-black px-2.5 py-1 rounded-lg border transition cursor-pointer shadow-2xs ${
                            isPaid
                              ? 'border-slate-300 text-stone-700 hover:bg-slate-100'
                              : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isPaid ? 'Estornar' : 'Liquidar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
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

      {/* Modal de Baixa de Pagamento */}
      {isSettlementModalOpen && settlementExpense && (
        <PaymentSettlementModal
          isOpen={isSettlementModalOpen}
          onClose={() => {
            setIsSettlementModalOpen(false);
            setSettlementExpense(null);
          }}
          expense={settlementExpense}
          bankAccounts={bankAccounts}
          employees={employees}
          onConfirmSettlement={(params) => {
            if (onSettleExpense) {
              onSettleExpense(params);
            } else {
              onToggleStatus(params.expenseId);
            }
            setIsSettlementModalOpen(false);
            setSettlementExpense(null);
          }}
        />
      )}
    </div>
  );
};
