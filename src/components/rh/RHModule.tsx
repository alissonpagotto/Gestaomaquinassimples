import React, { useState, useMemo } from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  AlertCircle, 
  DollarSign, 
  UserSquare2,
  UserCheck,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  Employee, 
  PayrollRecord, 
  VacationRecord, 
  LeaveRecord, 
  SalaryAdvance,
  CompanyProfile 
} from '../../types';
import { RHDashboardTab } from './RHDashboardTab';
import { PayrollTab } from './PayrollTab';
import { VacationsTab } from './VacationsTab';
import { LeavesTab } from './LeavesTab';
import { AdvancesTab } from './AdvancesTab';
import { PayslipModal } from './PayslipModal';
import { EmployeesModule } from '../employees/EmployeesModule';

interface RHModuleProps {
  employees: Employee[];
  payrolls: PayrollRecord[];
  vacations: VacationRecord[];
  leaves: LeaveRecord[];
  advances: SalaryAdvance[];
  companyProfile: CompanyProfile;
  initialSubTab?: RHTabType;
  onSaveEmployees: (employees: Employee[]) => void;
  onSavePayrolls: (payrolls: PayrollRecord[]) => void;
  onSaveVacations: (vacations: VacationRecord[]) => void;
  onSaveLeaves: (leaves: LeaveRecord[]) => void;
  onSaveAdvances: (advances: SalaryAdvance[]) => void;
  onNavigateToEmployees?: () => void;
}

export type RHTabType = 'dashboard' | 'funcionarios' | 'folha' | 'ferias' | 'afastamentos' | 'adiantamentos';

export const RHModule: React.FC<RHModuleProps> = ({
  employees,
  payrolls,
  vacations,
  leaves,
  advances,
  companyProfile,
  initialSubTab,
  onSaveEmployees,
  onSavePayrolls,
  onSaveVacations,
  onSaveLeaves,
  onSaveAdvances,
  onNavigateToEmployees,
}) => {
  const [activeTab, setActiveTab] = useState<RHTabType>(initialSubTab || 'dashboard');
  const [currentMonthRef, setCurrentMonthRef] = useState<string>('09/2026');

  // Ordenação automática e permanente de A a Z dos colaboradores para o RH
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => 
      (a.name || (a as any).nome_funcionario || '').localeCompare(b.name || (b as any).nome_funcionario || '', 'pt-BR')
    );
  }, [employees]);

  // Payslip Modal State
  const [viewingPayslip, setViewingPayslip] = useState<PayrollRecord | null>(null);

  const selectedPayslipEmployee = viewingPayslip 
    ? sortedEmployees.find(e => e.id === viewingPayslip.employeeId)
    : undefined;

  const handleOpenNewPayroll = () => {
    setActiveTab('folha');
  };

  const handleOpenNewVacation = () => {
    setActiveTab('ferias');
  };

  const handleOpenNewLeave = () => {
    setActiveTab('afastamentos');
  };

  const handleOpenNewAdvance = () => {
    setActiveTab('adiantamentos');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Header com Título e Subtítulo */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Recursos Humanos
          </h1>
          <p className="text-xs text-white/90 font-medium">
            Quadro de funcionários, folha de pagamento, férias e afastamentos
          </p>
        </div>

        {activeTab !== 'funcionarios' && (
          <button
            type="button"
            onClick={() => setActiveTab('funcionarios')}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-blue-200/80 dark:border-stone-800 bg-[#87AFE3] dark:bg-stone-900 text-black dark:text-white hover:bg-blue-200/60 dark:hover:bg-stone-800 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <UserSquare2 className="w-3.5 h-3.5 text-black dark:text-sky-400" />
            <span>Cadastros & CNH</span>
          </button>
        )}
      </div>

      {/* Navegação por Abas */}
      <div className="no-print crm-card bg-[#87AFE3] dark:bg-stone-900 rounded-xl border border-blue-200/80 dark:border-stone-800 p-1.5 flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto shadow-xs">
        
        {/* Aba 1: Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-blue-100/70 dark:bg-stone-800 text-black dark:text-stone-300 hover:bg-blue-100 dark:hover:bg-stone-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {/* Aba 2: Funcionários */}
        <button
          type="button"
          onClick={() => setActiveTab('funcionarios')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'funcionarios'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-blue-100/70 dark:bg-stone-800 text-black dark:text-stone-300 hover:bg-blue-100 dark:hover:bg-stone-700'
          }`}
        >
          <UserSquare2 className="w-3.5 h-3.5" />
          <span>Funcionários</span>
        </button>

        {/* Aba 3: Folha de Pagamento */}
        <button
          type="button"
          onClick={() => setActiveTab('folha')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'folha'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-blue-100/70 dark:bg-stone-800 text-black dark:text-stone-300 hover:bg-blue-100 dark:hover:bg-stone-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Folha de Pagamento</span>
        </button>

        {/* Aba 4: Férias */}
        <button
          type="button"
          onClick={() => setActiveTab('ferias')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'ferias'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-blue-100/70 dark:bg-stone-800 text-black dark:text-stone-300 hover:bg-blue-100 dark:hover:bg-stone-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Férias</span>
        </button>

        {/* Aba 5: Afastamentos */}
        <button
          type="button"
          onClick={() => setActiveTab('afastamentos')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'afastamentos'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-blue-100/70 dark:bg-stone-800 text-black dark:text-stone-300 hover:bg-blue-100 dark:hover:bg-stone-700'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Afastamentos</span>
        </button>

        {/* Aba 6: Adiantamentos */}
        <button
          type="button"
          onClick={() => setActiveTab('adiantamentos')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'adiantamentos'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-blue-100/70 dark:bg-stone-800 text-black dark:text-stone-300 hover:bg-blue-100 dark:hover:bg-stone-700'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Adiantamentos</span>
        </button>

      </div>

      {/* Renderização do Conteúdo de Cada Aba */}
      {activeTab === 'dashboard' && (
        <RHDashboardTab
          employees={sortedEmployees}
          payrolls={payrolls}
          vacations={vacations}
          leaves={leaves}
          advances={advances}
          currentMonthRef={currentMonthRef}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
          }}
          onOpenNewPayroll={handleOpenNewPayroll}
          onOpenNewVacation={handleOpenNewVacation}
          onOpenNewLeave={handleOpenNewLeave}
          onOpenNewAdvance={handleOpenNewAdvance}
          onViewPayslip={(p) => setViewingPayslip(p)}
        />
      )}

      {activeTab === 'funcionarios' && (
        <EmployeesModule
          employees={sortedEmployees}
          onSaveEmployees={onSaveEmployees}
        />
      )}

      {activeTab === 'folha' && (
        <PayrollTab
          employees={sortedEmployees}
          payrolls={payrolls}
          advances={advances}
          currentMonthRef={currentMonthRef}
          onChangeMonthRef={setCurrentMonthRef}
          onSavePayrolls={onSavePayrolls}
          onViewPayslip={(p) => setViewingPayslip(p)}
        />
      )}

      {activeTab === 'ferias' && (
        <VacationsTab
          employees={sortedEmployees}
          vacations={vacations}
          onSaveVacations={onSaveVacations}
        />
      )}

      {activeTab === 'afastamentos' && (
        <LeavesTab
          employees={sortedEmployees}
          leaves={leaves}
          onSaveLeaves={onSaveLeaves}
        />
      )}

      {activeTab === 'adiantamentos' && (
        <AdvancesTab
          employees={sortedEmployees}
          advances={advances}
          currentMonthRef={currentMonthRef}
          onSaveAdvances={onSaveAdvances}
        />
      )}

      {/* Modal de Holerite / Recibo de Salário */}
      <PayslipModal
        payroll={viewingPayslip}
        employee={selectedPayslipEmployee}
        companyProfile={companyProfile}
        isOpen={!!viewingPayslip}
        onClose={() => setViewingPayslip(null)}
      />

    </div>
  );
};
