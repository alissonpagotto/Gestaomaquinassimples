import React, { useState } from 'react';
import { 
  ArrowDownRight, 
  Receipt, 
  Users, 
  Tractor, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  PlusCircle, 
  FolderSync, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Calendar,
  Truck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { 
  Expense, 
  Client, 
  Machinery, 
  Employee, 
  SilageOrder, 
  ServiceOrder,
  InventoryItem
} from '../../types';
import { formatCurrencyBRL, formatDateBR, checkCnhStatus } from '../../lib/storage';

interface MainDashboardProps {
  expenses: Expense[];
  clients: Client[];
  machineries: Machinery[];
  employees: Employee[];
  orders: SilageOrder[];
  services?: ServiceOrder[];
  inventory?: InventoryItem[];
  onNavigate: (tab: string) => void;
  onNewExpense: () => void;
  onOpenAiParser: () => void;
  onOpenIntegration: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  expenses,
  clients,
  machineries,
  employees,
  orders,
  services = [],
  inventory = [],
  onNavigate,
  onNewExpense,
  onOpenAiParser,
  onOpenIntegration,
}) => {
  const [showActiveCharts, setShowActiveCharts] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'mes_atual' | 'todos'>('todos');

  // Calculate current month expenses
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const currentMonthExpenses = expenses.filter(e => e.dueDate?.startsWith(currentMonthStr));
  const currentMonthTotal = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const currentMonthCount = currentMonthExpenses.length;

  // Total expenses
  const totalExpensesAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpensesCount = expenses.length;

  // Clients count
  const clientsCount = clients.length;

  // Machinery & fleet operators count
  const machineriesCount = machineries.length;
  const operatorsCount = employees.length;

  // CNH Status
  const cnhReport = checkCnhStatus(employees);

  // Categories breakdown for chart view
  const categoryTotals: { [name: string]: { total: number; color: string } } = {};
  expenses.forEach(e => {
    if (!categoryTotals[e.categoryName]) {
      categoryTotals[e.categoryName] = { total: 0, color: e.categoryColor || '#10b981' };
    }
    categoryTotals[e.categoryName].total += e.amount;
  });

  return (
    <div id="main-dashboard-view" className="space-y-3.5">
      
      {/* Top 4 Stat Cards Row matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* Card 1: DESPESAS DO MÊS */}
        <div 
          id="stat-card-despesas-mes"
          onClick={() => onNavigate('despesas')}
          className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-3.5 shadow-xs hover:border-blue-300 dark:hover:border-stone-700 transition flex items-center justify-between cursor-pointer group text-black dark:text-white"
        >
          <div>
            <span className="text-[10px] font-black tracking-wider text-black dark:text-stone-300 uppercase block">
              DESPESAS DO MÊS
            </span>
            <div className="text-xl font-black text-black dark:text-white mt-0.5 font-['Outfit']">
              {formatCurrencyBRL(currentMonthTotal)}
            </div>
            <span className="text-[11px] font-bold text-black/80 dark:text-stone-400 block">
              {currentMonthCount} lançamentos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition shrink-0">
            <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 2: TOTAL DESPESAS */}
        <div 
          id="stat-card-total-despesas"
          onClick={() => onNavigate('despesas')}
          className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-3.5 shadow-xs hover:border-blue-300 dark:hover:border-stone-700 transition flex items-center justify-between cursor-pointer group text-black dark:text-white"
        >
          <div>
            <span className="text-[10px] font-black tracking-wider text-black dark:text-stone-300 uppercase block">
              TOTAL DESPESAS
            </span>
            <div className="text-xl font-black text-black dark:text-white mt-0.5 font-['Outfit']">
              {formatCurrencyBRL(totalExpensesAmount)}
            </div>
            <span className="text-[11px] font-bold text-black/80 dark:text-stone-400 block">
              {totalExpensesCount} registros
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition shrink-0">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: CLIENTES */}
        <div 
          id="stat-card-clientes"
          onClick={() => onNavigate('clientes')}
          className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-3.5 shadow-xs hover:border-blue-300 dark:hover:border-stone-700 transition flex items-center justify-between cursor-pointer group text-black dark:text-white"
        >
          <div>
            <span className="text-[10px] font-black tracking-wider text-black dark:text-stone-300 uppercase block">
              CLIENTES
            </span>
            <div className="text-xl font-black text-black dark:text-white mt-0.5 font-['Outfit']">
              {clientsCount}
            </div>
            <span className="text-[11px] font-bold text-black/80 dark:text-stone-400 block">
              {clientsCount} cadastrados
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 group-hover:scale-105 transition shrink-0">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: FROTAS */}
        <div 
          id="stat-card-frotas"
          onClick={() => onNavigate('frotas')}
          className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-3.5 shadow-xs hover:border-blue-300 dark:hover:border-stone-700 transition flex items-center justify-between cursor-pointer group text-black dark:text-white"
        >
          <div>
            <span className="text-[10px] font-black tracking-wider text-black dark:text-stone-300 uppercase block">
              FROTAS
            </span>
            <div className="text-xl font-black text-black dark:text-white mt-0.5 font-['Outfit']">
              {machineriesCount}
            </div>
            <span className="text-[11px] font-bold text-black/80 dark:text-stone-400 block">
              {operatorsCount} motoristas/operadores
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition shrink-0">
            <Tractor className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

      </div>

      {/* Main Content Grid: Left 2/3 (Data & Migration / Charts) and Right 1/3 (Status da Frota) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* Left Section: 2 Columns */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Main Container: Dashed placeholder or Active visual charts */}
          <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-4 sm:p-5 shadow-xs text-black dark:text-white">
            
            {!showActiveCharts ? (
              /* Screenshot Migration Box Layout */
              <div className="flex flex-col items-center justify-center text-center py-6 px-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-black mb-2.5">
                  <BarChart3 className="w-5 h-5" />
                </div>
                
                <h3 className="text-sm font-bold text-black max-w-md">
                  Gráficos e tabelas da safra & custos operacionais
                </h3>
                
                <p className="text-xs text-black/80 font-medium mt-1 max-w-md">
                  Acompanhe custos por safra, consumo de diesel das ensiladeiras, contratos de venda e fluxo financeiro.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
                  <button
                    id="btn-toggle-dash-charts"
                    onClick={() => setShowActiveCharts(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Visualizar Gráficos & Métricas</span>
                  </button>

                  <button
                    id="btn-dash-import-data"
                    onClick={onOpenIntegration}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-black border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <FolderSync className="w-3.5 h-3.5 text-amber-500" />
                    <span>Migração & Lovable</span>
                  </button>

                  <button
                    id="btn-dash-new-exp-sec"
                    onClick={onNewExpense}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Lançar Despesa</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Analytics & Category Breakdown View */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-black font-['Outfit']">
                      Distribuição de Despesas Operacionais
                    </h3>
                    <p className="text-xs text-black/80 font-medium">
                      Detalhamento por categoria de custo na produção e logística da silagem
                    </p>
                  </div>
                  <button
                    onClick={() => setShowActiveCharts(false)}
                    className="text-xs font-semibold text-black hover:text-black/80 px-2.5 py-1 rounded bg-slate-100 transition"
                  >
                    Voltar ao modo padrão
                  </button>
                </div>

                {/* Category Progress Bars */}
                <div className="space-y-3.5">
                  {Object.entries(categoryTotals).length > 0 ? (
                    Object.entries(categoryTotals).map(([name, { total, color }]) => {
                      const percentage = totalExpensesAmount > 0 ? (total / totalExpensesAmount) * 100 : 0;
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-black font-bold flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                              <span>{name}</span>
                            </span>
                            <span className="font-bold text-black">
                              {formatCurrencyBRL(total)} <span className="text-black/60 font-normal">({percentage.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div 
                              className="h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%`, backgroundColor: color }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-black/70">Nenhum lançamento registrado.</p>
                  )}
                </div>

                {/* Quick Recent Expenses List preview */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-black uppercase tracking-wider">
                      Últimos Lançamentos
                    </h4>
                    <button
                      onClick={() => onNavigate('despesas')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                    >
                      <span>Ver todas</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {expenses.slice(0, 4).map((exp) => (
                      <div 
                        key={exp.id} 
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-black truncate">
                            {exp.description}
                          </p>
                          <span className="text-[11px] text-black/75 font-medium">
                            {exp.supplier || 'Sem fornecedor'} • {formatDateBR(exp.dueDate)}
                          </span>
                        </div>
                        <span className="font-black text-black shrink-0">
                          {formatCurrencyBRL(exp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Quick Shortcuts Bar below main box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onNavigate('despesas')}
              className="p-2.5 crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl hover:border-blue-400 transition text-left cursor-pointer group shadow-xs text-black dark:text-white"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-black dark:text-white">Despesas</p>
              <p className="text-[10px] text-black/75 dark:text-stone-400 font-medium">Lançamentos</p>
            </button>

            <button
              onClick={() => onNavigate('servicos')}
              className="p-2.5 crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl hover:border-blue-400 transition text-left cursor-pointer group shadow-xs text-black dark:text-white"
            >
              <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                <Tractor className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-black dark:text-white">Serviços</p>
              <p className="text-[10px] text-black/75 dark:text-stone-400 font-medium">Ensilagem</p>
            </button>

            <button
              onClick={() => onNavigate('estoque')}
              className="p-2.5 crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl hover:border-blue-400 transition text-left cursor-pointer group shadow-xs text-black dark:text-white"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-black dark:text-white">Estoque</p>
              <p className="text-[10px] text-black/75 dark:text-stone-400 font-medium">Insumos</p>
            </button>

            <button
              onClick={() => onNavigate('clientes')}
              className="p-2.5 crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl hover:border-blue-400 transition text-left cursor-pointer group shadow-xs text-black dark:text-white"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                <Users className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-black dark:text-white">Clientes</p>
              <p className="text-[10px] text-black/75 dark:text-stone-400 font-medium">Produtores</p>
            </button>
          </div>

        </div>

        {/* Right Section: 1 Column - Status da Frota (matching screenshot exactly) */}
        <div className="space-y-3">
          <div 
            id="card-status-frota"
            className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-4 shadow-xs text-black dark:text-white"
          >
            
            {/* Header: Status da Frota */}
            <div className="flex items-center space-x-2 pb-3 border-b border-blue-200/60 dark:border-stone-800">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-black dark:text-white font-['Outfit']">
                Status da Frota
              </h3>
            </div>

            {/* Alert Cards Container */}
            <div className="space-y-2 mt-3">
              
              {/* Red Card: CNH(s) Vencida(s) */}
              <div 
                id="alert-cnh-vencida"
                onClick={() => onNavigate('funcionarios')}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl p-2.5 flex items-center justify-between transition shadow-xs cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs">!</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight">
                      {cnhReport.expiredCount} CNH(s) Vencida(s)
                    </h4>
                    <p className="text-[10px] text-rose-100 leading-tight">
                      Regularização necessária
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition" />
              </div>

              {/* Amber Card: CNH(s) a Vencer */}
              <div 
                id="alert-cnh-a-vencer"
                onClick={() => onNavigate('funcionarios')}
                className="bg-amber-400 hover:bg-amber-500 text-stone-950 rounded-xl p-2.5 flex items-center justify-between transition shadow-xs cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-stone-900" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight">
                      {cnhReport.expiringIn60DaysCount} CNH(s) a Vencer
                    </h4>
                    <p className="text-[10px] text-stone-800 leading-tight">
                      Próximos 60 dias
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-900/80 group-hover:translate-x-0.5 transition" />
              </div>

            </div>

            {/* Footer status text */}
            <div className="mt-3 pt-2.5 border-t border-blue-200/60 dark:border-stone-800">
              {cnhReport.expiredCount === 0 && cnhReport.expiringIn60DaysCount === 0 ? (
                <div className="flex items-center space-x-1.5 text-[11px] text-black/75 dark:text-stone-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Nenhum alerta de CNH pendente.</span>
                </div>
              ) : (
                <div className="space-y-1 text-[11px]">
                  <span className="font-bold text-rose-600 block">
                    Motoristas com CNH próxima do vencimento:
                  </span>
                  {cnhReport.expiringEmployees.map(emp => (
                    <div key={emp.id} className="flex justify-between text-black dark:text-stone-200 font-medium">
                      <span className="truncate pr-1">{emp.name}</span>
                      <span className="font-bold shrink-0">{formatDateBR(emp.cnhExpiration)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Button to fleet management */}
            <button
              onClick={() => onNavigate('frotas')}
              className="w-full mt-3 py-1.5 px-2.5 bg-blue-100/70 hover:bg-blue-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-black dark:text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer border border-blue-200/80 dark:border-stone-700"
            >
              <Truck className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Ver Gestão de Frotas</span>
            </button>

          </div>

          {/* Quick Machinery Status Widget */}
          <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-5 shadow-xs text-black dark:text-white">
            <h4 className="text-xs font-black text-black dark:text-stone-300 uppercase tracking-wider mb-3">
              Máquinas no Pátio / Operação
            </h4>
            <div className="space-y-2">
              {machineries.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-blue-50/70 dark:bg-stone-800 border border-blue-200/60 dark:border-stone-700">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-black dark:text-white truncate">{m.name}</p>
                    <span className="text-[11px] text-black/75 dark:text-stone-400 font-medium">{m.hourMeter}h de uso</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === 'operacional' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {m.status === 'operacional' ? 'Operacional' : 'Manutenção'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
