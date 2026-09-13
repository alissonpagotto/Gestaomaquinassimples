import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign,
  Users,
  Sparkles,
  Printer,
  X
} from 'lucide-react';
import { Employee, PayrollRecord, SalaryAdvance } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

// ==========================================
// REGRAS DE NEGÓCIO DA FOLHA DE PAGAMENTO
// ==========================================

// 1. Identificação de Motoristas e Vínculos Terceirizados
// (Regra: Terceirizados são geridos exclusivamente pelo módulo Financeiro - Acerto de Terceiros)
export const isThirdPartyDriver = (emp?: Partial<Employee>): boolean => {
  if (!emp) return false;
  const contract = (emp.contractType || '').toLowerCase().trim();
  const regType = (emp.registrationType || '').toLowerCase().trim();
  const role = (emp.role || '').toLowerCase().trim();

  // Vínculo explicitamente terceirizado
  const isTerceirizado = 
    contract.includes('terceiriz') || 
    regType.includes('terceiriz') || 
    role.includes('terceiriz') ||
    role.includes('terceiro') ||
    role.includes('freteiro');

  const isDriverOrTransport = 
    role.includes('motorista') || 
    role.includes('caminhão') || 
    role.includes('caminhao') ||
    regType.includes('motorista');

  // Motorista com vínculo terceirizado
  if (isDriverOrTransport && isTerceirizado) return true;
  // Qualquer registro cujo contrato seja Terceirizado
  if (contract === 'terceirizado' || contract.startsWith('terceiriz')) return true;
  if (role.includes('motorista terceirizado')) return true;

  return false;
};

// 2. Identificação de Regime Registrado (CLT)
// (Regra: Desconto automático de INSS aplicado unicamente para quem tem registro CLT)
export const isCltContract = (emp?: Partial<Employee>): boolean => {
  if (!emp) return false;
  const contract = (emp.contractType || '').toLowerCase().trim();
  const regType = (emp.registrationType || '').toLowerCase().trim();

  // Regimes sem CLT: Prestador PJ, Diarista, Temporário, Terceirizado, Autônomo
  if (
    contract.includes('pj') || 
    contract.includes('prestador') || 
    contract.includes('diarista') || 
    contract.includes('informal') || 
    contract.includes('autônomo') || 
    contract.includes('autonomo') ||
    contract.includes('terceiriz') ||
    regType.includes('prestador') ||
    regType.includes('diarista')
  ) {
    return false;
  }

  // Registrado (CLT)
  if (
    contract.includes('registrado') || 
    contract.includes('clt') || 
    regType.includes('registrado') || 
    regType.includes('clt')
  ) {
    return true;
  }

  // Padrão default da empresa caso seja "Funcionário" e não especificado regime PJ/Diarista
  if (!contract && (regType === 'funcionário' || regType === 'funcionario')) {
    return true;
  }

  return false;
};

// 3. Cálculo automático do INSS (unicamente para CLT)
export const calculateAutomaticInss = (emp: Partial<Employee> | undefined, salary: number): number => {
  if (!isCltContract(emp)) {
    return 0; // SEM REGISTRO CLT: isento de cálculo automático de INSS no holerite
  }
  // Alíquota média rural/CLT ~8.5%, com teto da previdência de R$ 908,86
  const rate = 0.085;
  const inss = Math.round(salary * rate * 100) / 100;
  return Math.min(inss, 908.86);
};

interface PayrollTabProps {

  employees: Employee[];
  payrolls: PayrollRecord[];
  advances: SalaryAdvance[];
  currentMonthRef: string;
  onChangeMonthRef: (month: string) => void;
  onSavePayrolls: (payrolls: PayrollRecord[]) => void;
  onViewPayslip: (payroll: PayrollRecord) => void;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({
  employees,
  payrolls,
  advances,
  currentMonthRef,
  onChangeMonthRef,
  onSavePayrolls,
  onViewPayslip,
}) => {
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [overtimeAmount, setOvertimeAmount] = useState<number>(0);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [inssDiscount, setInssDiscount] = useState<number>(0);
  const [advancesDiscount, setAdvancesDiscount] = useState<number>(0);
  const [otherDiscounts, setOtherDiscounts] = useState<number>(0);
  const [payrollStatus, setPayrollStatus] = useState<'pendente' | 'pago'>('pendente');
  const [notes, setNotes] = useState('');

  // Filtered Payrolls - Exclusão estrita de Terceirizados (gerenciados pelo Financeiro)
  const monthPayrolls = payrolls.filter(p => {
    if (p.referenceMonth !== currentMonthRef) return false;
    const emp = employees.find(e => e.id === p.employeeId);
    if (emp && isThirdPartyDriver(emp)) return false;
    if ((p.employeeRole || '').toLowerCase().includes('terceiriz')) return false;
    return true;
  });

  const filtered = monthPayrolls.filter(p => 
    p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.employeeRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totais
  const totalBase = monthPayrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0);
  const totalOvertimeBonus = monthPayrolls.reduce((sum, p) => sum + (p.overtimeAmount || 0) + (p.bonusAmount || 0), 0);
  const totalDiscounts = monthPayrolls.reduce((sum, p) => sum + (p.inssDiscount || 0) + (p.advancesDiscount || 0) + (p.otherDiscounts || 0), 0);
  const totalNet = monthPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  // Navegação de Mês
  const handlePrevMonth = () => {
    const [month, year] = currentMonthRef.split('/').map(Number);
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onChangeMonthRef(`${String(newMonth).padStart(2, '0')}/${newYear}`);
  };

  const handleNextMonth = () => {
    const [month, year] = currentMonthRef.split('/').map(Number);
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onChangeMonthRef(`${String(newMonth).padStart(2, '0')}/${newYear}`);
  };

  // Auto-fill when employee is selected in Modal
  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      const salary = emp.baseSalary || emp.salary || 3500;
      setBaseSalary(salary);
      
      // REGRA DE NEGÓCIO: Desconto automático de INSS APENAS para regime Registrado (CLT)
      const estimatedInss = calculateAutomaticInss(emp, salary);
      setInssDiscount(estimatedInss);

      // Auto-calculate pending advances for this employee in current month
      const empAdvances = advances.filter(a => a.employeeId === empId && a.referenceMonth === currentMonthRef);
      const totalEmpAdvances = empAdvances.reduce((sum, a) => sum + a.amount, 0);
      setAdvancesDiscount(totalEmpAdvances);
    }
  };

  const handleOpenModal = (payroll?: PayrollRecord) => {
    if (payroll) {
      setEditingPayroll(payroll);
      setSelectedEmployeeId(payroll.employeeId);
      setBaseSalary(payroll.baseSalary);
      setOvertimeAmount(payroll.overtimeAmount || 0);
      setBonusAmount(payroll.bonusAmount || 0);
      setInssDiscount(payroll.inssDiscount || 0);
      setAdvancesDiscount(payroll.advancesDiscount || 0);
      setOtherDiscounts(payroll.otherDiscounts || 0);
      setPayrollStatus(payroll.status);
      setNotes(payroll.notes || '');
    } else {
      setEditingPayroll(null);
      // Selecionar primeiro funcionário ativo NÃO terceirizado
      const firstActive = employees.find(e => e.status === 'ativo' && !isThirdPartyDriver(e));
      if (firstActive) {
        handleSelectEmployee(firstActive.id);
      } else {
        setSelectedEmployeeId('');
        setBaseSalary(0);
        setInssDiscount(0);
        setAdvancesDiscount(0);
      }
      setOvertimeAmount(0);
      setBonusAmount(0);
      setOtherDiscounts(0);
      setPayrollStatus('pendente');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;

    const netSalary = Math.max(0, (baseSalary + overtimeAmount + bonusAmount) - (inssDiscount + advancesDiscount + otherDiscounts));

    if (editingPayroll) {
      const updated = payrolls.map(p => p.id === editingPayroll.id ? {
        ...p,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.role,
        referenceMonth: currentMonthRef,
        baseSalary,
        overtimeAmount,
        bonusAmount,
        inssDiscount,
        advancesDiscount,
        otherDiscounts,
        netSalary,
        status: payrollStatus,
        notes,
      } : p);
      onSavePayrolls(updated);
    } else {
      const newPayroll: PayrollRecord = {
        id: `pay_${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.role,
        referenceMonth: currentMonthRef,
        baseSalary,
        overtimeAmount,
        bonusAmount,
        inssDiscount,
        advancesDiscount,
        otherDiscounts,
        netSalary,
        status: payrollStatus,
        notes,
        createdAt: new Date().toISOString(),
      };
      onSavePayrolls([newPayroll, ...payrolls]);
    }
    setIsModalOpen(false);
  };

  // Gerar folha em lote para todos os ativos que ainda não têm folha neste mês
  // REGRA DE NEGÓCIO:
  // 1. Motoristas com vínculo "Terceirizado" NÃO entram na folha (acerto gerido pelo Financeiro)
  // 2. Desconto de INSS calculado UNICAMENTE para funcionários "Registrado" (CLT)
  const handleBatchGenerate = () => {
    const activeEmployees = employees.filter(e => e.status === 'ativo' && !isThirdPartyDriver(e));
    const existingEmpIds = new Set(monthPayrolls.map(p => p.employeeId));
    const missing = activeEmployees.filter(e => !existingEmpIds.has(e.id));

    if (missing.length === 0) {
      return;
    }

    const newRecords: PayrollRecord[] = missing.map(emp => {
      const salary = emp.salary || emp.baseSalary || 3500;
      
      // REGRA: Apenas colaboradores Registrado (CLT) recebem cálculo automático de INSS
      const inss = calculateAutomaticInss(emp, salary);
      
      const empAdvances = advances.filter(a => a.employeeId === emp.id && a.referenceMonth === currentMonthRef);
      const advTotal = empAdvances.reduce((sum, a) => sum + a.amount, 0);
      const net = Math.max(0, salary - inss - advTotal);

      return {
        id: `pay_${Date.now()}_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.role,
        referenceMonth: currentMonthRef,
        baseSalary: salary,
        overtimeAmount: 0,
        bonusAmount: 0,
        inssDiscount: inss,
        advancesDiscount: advTotal,
        otherDiscounts: 0,
        netSalary: net,
        status: 'pendente',
        createdAt: new Date().toISOString(),
      };
    });

    onSavePayrolls([...newRecords, ...payrolls]);
  };

  const handleToggleStatus = (id: string) => {
    onSavePayrolls(payrolls.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'pago' ? 'pendente' : 'pago';
        return {
          ...p,
          status: nextStatus,
          paymentDate: nextStatus === 'pago' ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return p;
    }));
  };

  const handleDelete = async (id: string) => {
    const item = payrolls.find(p => p.id === id);
    const isConfirmed = await confirm({
      title: 'Excluir Holerite / Folha',
      message: item?.employeeName
        ? `Deseja realmente excluir o lançamento da folha de pagamento de "${item.employeeName}" (${item.referenceMonth})?`
        : 'Deseja realmente excluir este lançamento da folha?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      onSavePayrolls(payrolls.filter(p => p.id !== id));
    }
  };


  const calculatedModalNet = Math.max(0, (baseSalary + overtimeAmount + bonusAmount) - (inssDiscount + advancesDiscount + otherDiscounts));

  return (
    <div className="space-y-3 sm:space-y-4">
      
      {/* Month Selector Bar & Action Controls */}
      <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-black dark:text-white">
        
        {/* Month Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-blue-300 dark:border-stone-700 bg-blue-100/50 dark:bg-stone-800 hover:bg-blue-200/70 dark:hover:bg-stone-700 transition cursor-pointer text-black dark:text-white"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100/70 dark:bg-stone-800 rounded-lg text-xs font-black text-black dark:text-white">
            <span>Competência:</span>
            <span className="text-black dark:text-sky-400 font-black text-sm">{currentMonthRef}</span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-blue-300 dark:border-stone-700 bg-blue-100/50 dark:bg-stone-800 hover:bg-blue-200/70 dark:hover:bg-stone-700 transition cursor-pointer text-black dark:text-white"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleBatchGenerate}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 border border-emerald-400 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-300 font-bold text-xs rounded-lg hover:bg-emerald-600 hover:text-white transition cursor-pointer"
            title="Gera folhas automáticas para todos os colaboradores ativos"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerar Folha em Lote</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lançar Folha</span>
          </button>
        </div>

      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-2.5 shadow-xs text-black dark:text-white">
          <span className="text-[11px] font-black text-black dark:text-stone-300 block uppercase">Salários Base</span>
          <span className="text-sm sm:text-base font-black text-black dark:text-white font-['Outfit']">
            {formatCurrencyBRL(totalBase)}
          </span>
        </div>
        <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-2.5 shadow-xs text-black dark:text-white">
          <span className="text-[11px] font-black text-black dark:text-stone-300 block uppercase">Horas Extras/Bônus</span>
          <span className="text-sm sm:text-base font-black text-black dark:text-emerald-400 font-['Outfit']">
            +{formatCurrencyBRL(totalOvertimeBonus)}
          </span>
        </div>
        <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-2.5 shadow-xs text-black dark:text-white">
          <span className="text-[11px] font-black text-black dark:text-stone-300 block uppercase">Total Deduções</span>
          <span className="text-sm sm:text-base font-black text-black dark:text-rose-400 font-['Outfit']">
            -{formatCurrencyBRL(totalDiscounts)}
          </span>
        </div>
        <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl p-2.5 shadow-xs text-black dark:text-white">
          <span className="text-[11px] font-black text-black dark:text-stone-300 block uppercase">Total Líquido Folha</span>
          <span className="text-sm sm:text-base font-black text-black dark:text-white font-['Outfit']">
            {formatCurrencyBRL(totalNet)}
          </span>
        </div>
      </div>

      {/* Banner Informativo de Regras de Negócio */}
      <div className="crm-card bg-blue-100/80 dark:bg-stone-800/80 border border-blue-300 dark:border-stone-700 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-black dark:text-stone-200">
          <ShieldCheck className="w-4 h-4 text-[#0963cb] shrink-0" />
          <span>
            <strong className="text-black dark:text-white">Filtro de Terceirizados & INSS CLT:</strong> Motoristas e vínculos <strong>Terceirizados</strong> são geridos exclusivamente pelo Financeiro. O cálculo automático de <strong>INSS</strong> aplica-se unicamente a funcionários <strong>Registrado (CLT)</strong>.
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl px-3 py-2 shadow-xs flex items-center justify-between text-black dark:text-white">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-black dark:text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar colaborador ou função..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-blue-300 dark:border-stone-700 rounded-lg bg-blue-100/50 dark:bg-stone-800 text-black dark:text-white placeholder-black/60 dark:placeholder-stone-400 outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>
        <span className="text-xs text-black/85 dark:text-stone-300 font-bold hidden sm:block">
          {filtered.length} holerite(s) na competência {currentMonthRef}
        </span>
      </div>

      {/* Payroll Table */}
      <div className="crm-card bg-[#87AFE3] dark:bg-stone-900 border border-blue-200/80 dark:border-stone-800 rounded-xl overflow-hidden shadow-xs text-black dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-100/60 dark:bg-stone-800 text-[11px] font-black text-black dark:text-white uppercase tracking-wider border-b border-blue-200/80 dark:border-stone-700">
              <tr>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Colaborador</th>
                <th className="py-2 px-3">Cargo / Função</th>
                <th className="py-2 px-3 text-right">Salário Base</th>
                <th className="py-2 px-3 text-right">Proventos (+)</th>
                <th className="py-2 px-3 text-right">INSS (-)</th>
                <th className="py-2 px-3 text-right">Vales/Desc. (-)</th>
                <th className="py-2 px-3 text-right">Líquido a Pagar</th>
                <th className="py-2 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-200/60 dark:divide-stone-800 bg-[#87AFE3] dark:bg-stone-900">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-200/40 dark:hover:bg-stone-800/60 transition">
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id)}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition border ${
                          item.status === 'pago'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                            : 'bg-amber-100 border-amber-300 text-amber-900'
                        }`}
                      >
                        {item.status === 'pago' ? (
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

                    <td className="py-2 px-3">
                      <div className="font-bold text-black dark:text-white text-xs">
                        {item.employeeName}
                      </div>
                      {item.notes && (
                        <div className="text-[10px] text-black/80 dark:text-stone-300 font-medium truncate max-w-xs">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3 text-black/85 dark:text-stone-300 font-medium text-xs">
                      {item.employeeRole}
                    </td>

                    <td className="py-2 px-3 text-right font-medium text-black dark:text-stone-200 text-xs font-['Outfit']">
                      {formatCurrencyBRL(item.baseSalary)}
                    </td>

                    <td className="py-2 px-3 text-right font-bold text-emerald-900 dark:text-emerald-400 text-xs font-['Outfit']">
                      {formatCurrencyBRL((item.overtimeAmount || 0) + (item.bonusAmount || 0))}
                    </td>

                    <td className="py-2 px-3 text-right font-bold text-rose-900 dark:text-rose-400 text-xs font-['Outfit']">
                      {formatCurrencyBRL(item.inssDiscount || 0)}
                    </td>

                    <td className="py-2 px-3 text-right font-bold text-rose-900 dark:text-rose-400 text-xs font-['Outfit']">
                      {formatCurrencyBRL((item.advancesDiscount || 0) + (item.otherDiscounts || 0))}
                    </td>

                    <td className="py-2 px-3 text-right font-black text-black dark:text-white whitespace-nowrap text-xs font-['Outfit']">
                      {formatCurrencyBRL(item.netSalary)}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => onViewPayslip(item)}
                          className="p-1 text-black dark:text-sky-400 hover:bg-blue-200/60 dark:hover:bg-stone-800 rounded transition cursor-pointer"
                          title="Ver / Imprimir Holerite"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(item)}
                          className="p-1 text-black/70 dark:text-stone-400 hover:text-black dark:hover:text-[#009688] hover:bg-blue-200/60 dark:hover:bg-stone-800 rounded transition cursor-pointer"
                          title="Editar Folha"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-black/70 dark:text-stone-400 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          title="Excluir Folha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-black/75 dark:text-stone-400 text-xs">
                    Nenhuma folha de pagamento lançada para a competência {currentMonthRef}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançamento / Edição de Folha */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#b0d2ed] border border-[#0963cb]/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header com azul padrão #0963cb e texto/ícone em branco #ffffff */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0963cb] text-white">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {editingPayroll ? 'Editar Folha de Pagamento' : 'Lançar Folha de Pagamento'} ({currentMonthRef})
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs bg-[#b0d2ed]">
              
              {/* Colaborador - Apenas Colaboradores Elegíveis (Excluindo Motoristas/Vínculos Terceirizados) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-black">
                    Colaborador / Funcionário <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] text-stone-600 font-medium">
                    (Motoristas Terceirizados são geridos no Financeiro)
                  </span>
                </div>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg bg-white text-black outline-none focus:ring-1 focus:ring-[#0963cb] font-medium"
                  required
                >
                  <option value="">Selecione um funcionário...</option>
                  {employees
                    .filter(emp => !isThirdPartyDriver(emp))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role}) - {emp.contractType || 'CLT'} - Salário: {formatCurrencyBRL(emp.salary || emp.baseSalary || 3500)}
                      </option>
                  ))}
                </select>
              </div>

              {/* Grid de Proventos com fundo branco */}
              <div className="p-3.5 bg-white border border-stone-300 rounded-xl space-y-3 shadow-xs">
                <span className="text-[11px] font-black uppercase text-black block tracking-wider">
                  Proventos (Vencimentos)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-black mb-1">
                      Salário Base (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={baseSalary || ''}
                      onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-black font-bold outline-none focus:ring-1 focus:ring-[#0963cb]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-black mb-1">
                      Horas Extras / Safra (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={overtimeAmount || ''}
                      onChange={(e) => setOvertimeAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-black font-medium outline-none focus:ring-1 focus:ring-[#0963cb]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-black mb-1">
                      Bônus / Insalubridade (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bonusAmount || ''}
                      onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-black font-medium outline-none focus:ring-1 focus:ring-[#0963cb]"
                    />
                  </div>
                </div>
              </div>

              {/* Grid de Deduções com fundo branco */}
              <div className="p-3.5 bg-white border border-stone-300 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-black tracking-wider">
                    Deduções (Descontos & Vales)
                  </span>
                  {selectedEmployeeId && (() => {
                    const emp = employees.find(e => e.id === selectedEmployeeId);
                    const isClt = isCltContract(emp);
                    return (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isClt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isClt ? 'Vínculo Registrado (CLT): INSS Automático' : 'Sem Registro CLT: Isento de INSS no Holerite'}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-black">
                        INSS (R$)
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={inssDiscount || ''}
                      onChange={(e) => setInssDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-black font-medium outline-none focus:ring-1 focus:ring-[#0963cb]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-black mb-1">
                      Vales / Adiantamentos (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={advancesDiscount || ''}
                      onChange={(e) => setAdvancesDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-black font-medium outline-none focus:ring-1 focus:ring-[#0963cb]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-black mb-1">
                      Outros Descontos / Faltas (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherDiscounts || ''}
                      onChange={(e) => setOtherDiscounts(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-black font-medium outline-none focus:ring-1 focus:ring-[#0963cb]"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Valor Líquido Preview com fundo branco */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white border border-stone-300 rounded-xl shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-black uppercase block mb-1">Situação do Pagamento:</span>
                  <div className="flex items-center space-x-3 mt-1">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={payrollStatus === 'pendente'}
                        onChange={() => setPayrollStatus('pendente')}
                        className="text-[#0963cb] focus:ring-[#0963cb] accent-[#0963cb] cursor-pointer"
                      />
                      <span className="font-bold text-amber-700">A Pagar</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={payrollStatus === 'pago'}
                        onChange={() => setPayrollStatus('pago')}
                        className="text-[#0963cb] focus:ring-[#0963cb] accent-[#0963cb] cursor-pointer"
                      />
                      <span className="font-bold text-emerald-700">Já Liquidado / Pago</span>
                    </label>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-black uppercase block">Salário Líquido</span>
                  <span className="text-lg sm:text-xl font-black text-[#0963cb]">
                    {formatCurrencyBRL(calculatedModalNet)}
                  </span>
                </div>
              </div>

              {/* Observações Internas (sem placeholder) */}
              <div>
                <label className="block font-bold text-black mb-1">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg bg-white text-black outline-none focus:ring-1 focus:ring-[#0963cb] resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0963cb] hover:bg-[#0852a8] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Salvar Folha
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
