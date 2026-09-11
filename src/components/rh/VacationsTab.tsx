import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  Palmtree, 
  AlertCircle,
  X,
  DollarSign
} from 'lucide-react';
import { Employee, VacationRecord } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';

interface VacationsTabProps {

  employees: Employee[];
  vacations: VacationRecord[];
  onSaveVacations: (vacations: VacationRecord[]) => void;
}

export const VacationsTab: React.FC<VacationsTabProps> = ({
  employees,
  vacations,
  onSaveVacations,
}) => {
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationRecord | null>(null);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [acquisitionPeriodStart, setAcquisitionPeriodStart] = useState('');
  const [acquisitionPeriodEnd, setAcquisitionPeriodEnd] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState<number>(30);
  const [sellDaysCount, setSellDaysCount] = useState<number>(0);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [oneThirdBonus, setOneThirdBonus] = useState<number>(0);
  const [pecuniaryAllowance, setPecuniaryAllowance] = useState<number>(0);
  const [thirteenthAdvance, setThirteenthAdvance] = useState<boolean>(false);
  const [status, setStatus] = useState<'agendado' | 'em_gozo' | 'concluido' | 'cancelado'>('agendado');
  const [notes, setNotes] = useState('');

  // Filtering
  const filtered = vacations.filter(v => 
    v.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totais
  const emGozoCount = vacations.filter(v => v.status === 'em_gozo').length;
  const agendadasCount = vacations.filter(v => v.status === 'agendado').length;
  const concluidasCount = vacations.filter(v => v.status === 'concluido').length;
  const totalValorFerias = vacations.reduce((sum, v) => sum + (v.totalAmount || 0), 0);

  const calculateVacationAmounts = (salary: number, days: number, sellDays: number, is13th: boolean) => {
    const dailyRate = salary / 30;
    const vacationDaysValue = dailyRate * (days - sellDays);
    const oneThird = Math.round((vacationDaysValue / 3) * 100) / 100;
    const pecuniary = Math.round((dailyRate * sellDays + (dailyRate * sellDays) / 3) * 100) / 100;
    const thirteenth = is13th ? Math.round((salary / 2) * 100) / 100 : 0;
    const total = Math.round((vacationDaysValue + oneThird + pecuniary + thirteenth) * 100) / 100;

    return {
      vacationDaysValue,
      oneThird,
      pecuniary,
      thirteenth,
      total,
    };
  };

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      const salary = emp.salary || 3500;
      setBaseSalary(salary);
      const calc = calculateVacationAmounts(salary, daysCount, sellDaysCount, thirteenthAdvance);
      setOneThirdBonus(calc.oneThird);
      setPecuniaryAllowance(calc.pecuniary);
    }
  };

  const handleDaysChange = (newDays: number, newSellDays: number, new13th: boolean, salary: number) => {
    setDaysCount(newDays);
    setSellDaysCount(newSellDays);
    setThirteenthAdvance(new13th);
    const calc = calculateVacationAmounts(salary, newDays, newSellDays, new13th);
    setOneThirdBonus(calc.oneThird);
    setPecuniaryAllowance(calc.pecuniary);
  };

  const handleOpenModal = (vacation?: VacationRecord) => {
    if (vacation) {
      setEditingVacation(vacation);
      setSelectedEmployeeId(vacation.employeeId);
      setAcquisitionPeriodStart(vacation.acquisitionPeriodStart || '');
      setAcquisitionPeriodEnd(vacation.acquisitionPeriodEnd || '');
      setStartDate(vacation.startDate);
      setEndDate(vacation.endDate);
      setDaysCount(vacation.daysCount);
      setSellDaysCount(vacation.sellDaysCount || 0);
      setBaseSalary(vacation.baseSalary);
      setOneThirdBonus(vacation.oneThirdBonus);
      setPecuniaryAllowance(vacation.pecuniaryAllowance || 0);
      setThirteenthAdvance(vacation.thirteenthAdvance || false);
      setStatus(vacation.status);
      setNotes(vacation.notes || '');
    } else {
      setEditingVacation(null);
      const firstActive = employees.find(e => e.status === 'ativo');
      const salary = firstActive?.salary || 3500;
      if (firstActive) {
        setSelectedEmployeeId(firstActive.id);
        setBaseSalary(salary);
      } else {
        setSelectedEmployeeId('');
        setBaseSalary(0);
      }
      setAcquisitionPeriodStart('2025-01-01');
      setAcquisitionPeriodEnd('2025-12-31');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setDaysCount(30);
      setSellDaysCount(0);
      setThirteenthAdvance(false);
      const calc = calculateVacationAmounts(salary, 30, 0, false);
      setOneThirdBonus(calc.oneThird);
      setPecuniaryAllowance(0);
      setStatus('agendado');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;

    const calc = calculateVacationAmounts(baseSalary, daysCount, sellDaysCount, thirteenthAdvance);

    if (editingVacation) {
      const updated = vacations.map(v => v.id === editingVacation.id ? {
        ...v,
        employeeId: emp.id,
        employeeName: emp.name,
        acquisitionPeriodStart,
        acquisitionPeriodEnd,
        startDate,
        endDate,
        daysCount,
        sellDaysCount,
        baseSalary,
        oneThirdBonus: calc.oneThird,
        pecuniaryAllowance: calc.pecuniary,
        thirteenthAdvance,
        thirteenthAmount: calc.thirteenth,
        totalAmount: calc.total,
        status,
        notes,
      } : v);
      onSaveVacations(updated);
    } else {
      const newVac: VacationRecord = {
        id: `vac_${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        acquisitionPeriodStart,
        acquisitionPeriodEnd,
        startDate,
        endDate,
        daysCount,
        sellDaysCount,
        baseSalary,
        oneThirdBonus: calc.oneThird,
        pecuniaryAllowance: calc.pecuniary,
        thirteenthAdvance,
        thirteenthAmount: calc.thirteenth,
        totalAmount: calc.total,
        status,
        notes,
        createdAt: new Date().toISOString(),
      };
      onSaveVacations([newVac, ...vacations]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const item = vacations.find(v => v.id === id);
    const isConfirmed = await confirm({
      title: 'Excluir Registro de Férias',
      message: item?.employeeName
        ? `Deseja realmente excluir o registro de férias de "${item.employeeName}"?`
        : 'Deseja realmente excluir este registro de férias?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      onSaveVacations(vacations.filter(v => v.id !== id));
    }
  };


  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'agendado' ? 'em_gozo' : currentStatus === 'em_gozo' ? 'concluido' : 'agendado';
    onSaveVacations(vacations.map(v => v.id === id ? { ...v, status: nextStatus as any } : v));
  };

  const currentCalc = calculateVacationAmounts(baseSalary, daysCount, sellDaysCount, thirteenthAdvance);

  return (
    <div className="space-y-3 sm:space-y-4">
      
      {/* Top Header & Actions */}
      <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-black dark:text-white">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-blue-100/70 dark:bg-stone-800 border border-blue-200/80 dark:border-stone-700 text-black dark:text-white">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black dark:text-white">
              Controle e Agendamento de Férias
            </h3>
            <p className="text-xs text-black/85 dark:text-stone-300 font-medium">
              Planejamento de períodos aquisitivos, gozo e 1/3 constitucional
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agendar Férias</span>
        </button>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-2.5 shadow-xs text-black dark:text-white">
          <span className="text-[11px] font-black text-black dark:text-stone-300 block uppercase">Férias Agendadas</span>
          <span className="text-base font-black text-black dark:text-sky-400 font-['Outfit']">
            {agendadasCount} colaborador(es)
          </span>
        </div>
        <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-2.5 shadow-xs text-black dark:text-white">
          <span className="text-[11px] font-black text-black dark:text-stone-300 block uppercase">Em Gozo Atual</span>
          <span className="text-base font-black text-black dark:text-amber-400 font-['Outfit']">
            {emGozoCount} colaborador(es)
          </span>
        </div>
        <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-2.5 shadow-xs text-black dark:text-white">
          <span className="text-[11px] font-black text-black dark:text-stone-300 block uppercase">Concluídas</span>
          <span className="text-base font-black text-black dark:text-emerald-400 font-['Outfit']">
            {concluidasCount} registro(s)
          </span>
        </div>
        <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-2.5 shadow-xs text-black dark:text-white">
          <span className="text-[11px] font-black text-black dark:text-stone-300 block uppercase">Total Férias Lançadas</span>
          <span className="text-base font-black text-black dark:text-white font-['Outfit']">
            {formatCurrencyBRL(totalValorFerias)}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl px-3 py-2 shadow-xs flex items-center justify-between text-black dark:text-white">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-black dark:text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-blue-300 dark:border-stone-700 rounded-lg bg-blue-100/50 dark:bg-stone-800 text-black dark:text-white placeholder-black/60 dark:placeholder-stone-400 outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>
        <span className="text-xs text-black/85 dark:text-stone-300 font-bold hidden sm:block">
          {filtered.length} registro(s) de férias
        </span>
      </div>

      {/* Table */}
      <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl overflow-hidden shadow-xs text-black dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-100/60 dark:bg-stone-800 text-[11px] font-black text-black dark:text-white uppercase tracking-wider border-b border-blue-200/80 dark:border-stone-700">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Colaborador</th>
                <th className="py-2.5 px-3">Período de Gozo</th>
                <th className="py-2.5 px-3 text-center">Dias / Venda</th>
                <th className="py-2.5 px-3 text-right">1/3 Constitucional</th>
                <th className="py-2.5 px-3 text-right">Abono Pecuniário</th>
                <th className="py-2.5 px-3 text-right">Total Férias</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-200/60 dark:divide-stone-800 bg-[#87AFE3] dark:bg-stone-900">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-200/40 dark:hover:bg-stone-800/60 transition">
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition border ${
                          item.status === 'em_gozo'
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : item.status === 'concluido'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                            : 'bg-blue-100 border-blue-300 text-blue-900'
                        }`}
                      >
                        <span>
                          {item.status === 'em_gozo' ? 'Em Gozo' : item.status === 'concluido' ? 'Concluído' : 'Agendado'}
                        </span>
                      </button>
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-bold text-black dark:text-white text-xs">
                        {item.employeeName}
                      </div>
                      {item.acquisitionPeriodStart && (
                        <div className="text-[10px] text-black/80 dark:text-stone-300 font-medium">
                          Aq: {formatDateBR(item.acquisitionPeriodStart)} a {formatDateBR(item.acquisitionPeriodEnd)}
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3 text-black/85 dark:text-stone-300 font-medium text-xs whitespace-nowrap">
                      {formatDateBR(item.startDate)} até {formatDateBR(item.endDate)}
                    </td>

                    <td className="py-2 px-3 text-center text-xs">
                      <span className="font-bold text-black dark:text-white">{item.daysCount} dias</span>
                      {item.sellDaysCount > 0 && (
                        <span className="text-[10px] block text-amber-900 dark:text-amber-300 font-bold">
                          (+ {item.sellDaysCount}d vendidos)
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-3 text-right font-medium text-black dark:text-stone-200 text-xs font-['Outfit']">
                      {formatCurrencyBRL(item.oneThirdBonus)}
                    </td>

                    <td className="py-2 px-3 text-right font-medium text-black dark:text-stone-200 text-xs font-['Outfit']">
                      {item.pecuniaryAllowance ? formatCurrencyBRL(item.pecuniaryAllowance) : '-'}
                    </td>

                    <td className="py-2 px-3 text-right font-black text-black dark:text-white text-xs whitespace-nowrap font-['Outfit']">
                      {formatCurrencyBRL(item.totalAmount)}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(item)}
                          className="p-1 text-black dark:text-sky-400 hover:bg-blue-200/60 dark:hover:bg-stone-800 rounded transition cursor-pointer"
                          title="Editar Férias"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-black/70 dark:text-stone-400 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          title="Excluir Férias"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-black/75 dark:text-stone-400 text-xs">
                    Nenhum registro de férias cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agendar Férias */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-auto">
            
            <div className="flex items-center justify-between px-5 py-3.5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {editingVacation ? 'Editar Férias' : 'Agendar Férias do Colaborador'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs">
              
              {/* Colaborador */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Colaborador / Funcionário *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-[#009688]"
                  required
                >
                  <option value="">Selecione um funcionário...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) - Salário: {formatCurrencyBRL(emp.salary || 3500)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período de Gozo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Data de Início do Gozo *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Data de Término do Gozo *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800"
                    required
                  />
                </div>
              </div>

              {/* Dias e Abono Pecuniário */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700">
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Total de Dias
                  </label>
                  <select
                    value={daysCount}
                    onChange={(e) => handleDaysChange(Number(e.target.value), sellDaysCount, thirteenthAdvance, baseSalary)}
                    className="w-full p-1.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 font-bold"
                  >
                    <option value={30}>30 Dias</option>
                    <option value={20}>20 Dias</option>
                    <option value={15}>15 Dias</option>
                    <option value={10}>10 Dias</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Venda de Dias (Abono)
                  </label>
                  <select
                    value={sellDaysCount}
                    onChange={(e) => handleDaysChange(daysCount, Number(e.target.value), thirteenthAdvance, baseSalary)}
                    className="w-full p-1.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 font-bold"
                  >
                    <option value={0}>0 dias (Sem abono)</option>
                    <option value={10}>10 dias (Vender 10d)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Adiantamento 13º?
                  </label>
                  <select
                    value={thirteenthAdvance ? 'sim' : 'nao'}
                    onChange={(e) => handleDaysChange(daysCount, sellDaysCount, e.target.value === 'sim', baseSalary)}
                    className="w-full p-1.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 font-bold"
                  >
                    <option value="nao">Não adiantar</option>
                    <option value="sim">Sim (+50% 13º)</option>
                  </select>
                </div>
              </div>

              {/* Resumo Financeiro das Férias */}
              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 dark:text-stone-400">1/3 Constitucional:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {formatCurrencyBRL(currentCalc.oneThird)}
                  </span>
                </div>
                {sellDaysCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-400">Abono Pecuniário (10d + 1/3):</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {formatCurrencyBRL(currentCalc.pecuniary)}
                    </span>
                  </div>
                )}
                {thirteenthAdvance && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-400">Adiantamento 13º Salário (50%):</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {formatCurrencyBRL(currentCalc.thirteenth)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-teal-200 dark:border-teal-900/60 flex items-center justify-between">
                  <span className="font-black text-[#009688] uppercase">Total Líquido Férias:</span>
                  <span className="text-base font-black text-[#009688]">
                    {formatCurrencyBRL(currentCalc.total)}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                  Situação das Férias
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 font-bold"
                >
                  <option value="agendado">Agendado</option>
                  <option value="em_gozo">Em Gozo</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Férias programadas para a entressafra..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#009688] hover:bg-[#00796b] text-white font-bold transition shadow-xs"
                >
                  Salvar Férias
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
