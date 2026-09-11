import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserSquare2, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Phone, 
  Trash2, 
  Edit3, 
  Search, 
  CreditCard, 
  Briefcase, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  X,
  Printer,
  MessageCircle,
  Camera,
  UploadCloud,
  FileText,
  Building2,
  Download,
  FileCheck,
  Paperclip
} from 'lucide-react';
import { Employee, CompanyProfile, EmployeeAttachment, Cargo, EmployeeRole, EmployeeRegistrationType } from '../../types';
import { formatDateBR, checkCnhStatus, formatCurrencyBRL, getStoredCompanyProfile } from '../../lib/storage';
import { formatPhone, formatCpfCnpj, parseCurrencyInput, formatCurrencyInputDisplay } from '../../lib/formatters';
import { ManageableDropdown } from '../common/ManageableDropdown';
import { useConfirm } from '../../context/ConfirmContext';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { PrintDocumentOptions } from '../../lib/printService';
import { PrintableEmployeeSheet } from './PrintableEmployeeSheet';
import { generateEmployeeSheetHtml, generateEmployeeWhatsAppText } from './employeePrintUtils';


const STORAGE_KEYS = {
  REG_TYPES: 'silagem_facil_custom_reg_types_v1',
  ROLES: 'silagem_facil_custom_roles_v1',
  CONTRACT_TYPES: 'silagem_facil_custom_contract_types_v1',
};

const DEFAULT_REG_TYPES = [
  'Funcionário',
  'Motorista Terceirizado',
  'Auxiliar',
  'Operador de Máquinas',
  'Diarista / Safrista',
  'Prestador de Serviço',
  'Mecanico Especialista'
];

const DEFAULT_ROLES = [
  'Motorista',
  'Operador de forrageira',
  'Operador de trator',
  'Auxiliar',
  'Administrador',
  'Mecanico Especialista'
];

const DEFAULT_CONTRACT_TYPES = [
  'Registrado (CLT)',
  'Prestador de Serviço (PJ)',
  'Contrato Temporário',
  'Diarista/Informal'
];

interface EmployeesModuleProps {
  employees: Employee[];
  onSaveEmployees: (employees: Employee[]) => void;
}

export const EmployeesModule: React.FC<EmployeesModuleProps> = ({
  employees,
  onSaveEmployees,
}) => {
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [singleEmployeePrintOptions, setSingleEmployeePrintOptions] = useState<PrintDocumentOptions | null>(null);
  const [isSingleEmployeePrintOpen, setIsSingleEmployeePrintOpen] = useState(false);

  // State for single-employee printable sheet
  const [employeeToPrint, setEmployeeToPrint] = useState<Partial<Employee> | null>(null);

  const activeCompany = useMemo(() => getStoredCompanyProfile(), []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Dynamic Options with persistence
  const [regTypeOptions, setRegTypeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REG_TYPES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (!parsed.includes('Mecanico Especialista')) {
            const updated = [...parsed, 'Mecanico Especialista'];
            localStorage.setItem(STORAGE_KEYS.REG_TYPES, JSON.stringify(updated));
            return updated;
          }
          return parsed;
        }
      }
      return DEFAULT_REG_TYPES;
    } catch {
      return DEFAULT_REG_TYPES;
    }
  });

  const [roleOptions, setRoleOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (!parsed.includes('Mecanico Especialista')) {
            const updated = [...parsed, 'Mecanico Especialista'];
            localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(updated));
            return updated;
          }
          return parsed;
        }
      }
      return DEFAULT_ROLES;
    } catch {
      return DEFAULT_ROLES;
    }
  });

  const [contractTypeOptions, setContractTypeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTRACT_TYPES);
      return saved ? JSON.parse(saved) : DEFAULT_CONTRACT_TYPES;
    } catch {
      return DEFAULT_CONTRACT_TYPES;
    }
  });

  const handleUpdateRegTypeOptions = (newOpts: string[]) => {
    setRegTypeOptions(newOpts);
    localStorage.setItem(STORAGE_KEYS.REG_TYPES, JSON.stringify(newOpts));
  };

  const handleUpdateRoleOptions = (newOpts: string[]) => {
    setRoleOptions(newOpts);
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(newOpts));
  };

  const handleUpdateContractTypeOptions = (newOpts: string[]) => {
    setContractTypeOptions(newOpts);
    localStorage.setItem(STORAGE_KEYS.CONTRACT_TYPES, JSON.stringify(newOpts));
  };

  // Form State
  const [registrationType, setRegistrationType] = useState<EmployeeRegistrationType | string>('Funcionário');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<EmployeeRole | string>('Auxiliar');
  const [cpf, setCpf] = useState<string>('');
  const [rg, setRg] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [pis, setPis] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>('');
  const [phone, setPhone] = useState<string>('');
  const [baseSalary, setBaseSalary] = useState<string>('0,00');
  const [contractType, setContractType] = useState<string>('Registrado (CLT)');
  const [admissionDate, setAdmissionDate] = useState<string>('');
  const [terminationDate, setTerminationDate] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Commission Box State
  const [receivesCommission, setReceivesCommission] = useState<boolean>(false);
  const [commissionPerHour, setCommissionPerHour] = useState<string>('0,00');
  const [commissionPerAlqueire, setCommissionPerAlqueire] = useState<string>('0,00');
  const [commissionPerHectare, setCommissionPerHectare] = useState<string>('0,00');

  // CNH Details (Collapsible / Extended)
  const [showCnhFields, setShowCnhFields] = useState<boolean>(false);
  const [cnhNumber, setCnhNumber] = useState<string>('');
  const [cnhCategory, setCnhCategory] = useState<string>('B');
  const [cnhExpiration, setCnhExpiration] = useState<string>('');
  const [cnhUpgradeDT, setCnhUpgradeDT] = useState<boolean>(false);
  const [cnhUpgradeCategory, setCnhUpgradeCategory] = useState<string>('A');

  // Financial / Payment Info
  const [paymentLocation, setPaymentLocation] = useState<string>('');
  const [bankPixKey, setBankPixKey] = useState<string>('');
  const [bankAgency, setBankAgency] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');

  // Attachments / Documents
  const [admissionExamDoc, setAdmissionExamDoc] = useState<EmployeeAttachment | null>(null);
  const [experienceContractDoc, setExperienceContractDoc] = useState<EmployeeAttachment | null>(null);
  const [generalDocs, setGeneralDocs] = useState<EmployeeAttachment | null>(null);
  const [signedRegistrationDoc, setSignedRegistrationDoc] = useState<EmployeeAttachment | null>(null);

  const cnhReport = checkCnhStatus(employees);

  // Lista de colaboradores filtrada e rigorosamente ordenada de A a Z pelo nome
  const filteredEmployees = useMemo(() => {
    return [...employees]
      .filter(emp =>
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.cpf && emp.cpf.includes(searchTerm)) ||
        (emp.rg && emp.rg.includes(searchTerm)) ||
        (emp.pis && emp.pis.includes(searchTerm)) ||
        (emp.cnhNumber && emp.cnhNumber.includes(searchTerm))
      )
      .sort((a, b) => 
        (a.name || (a as any).nome_funcionario || '').localeCompare(b.name || (b as any).nome_funcionario || '', 'pt-BR')
      );
  }, [employees, searchTerm]);

  // 1. ORDENAÇÃO AUTOMÁTICA DA TABELA (ORDEM ALFABÉTICA A-Z):
  // Garante que a lista de colaboradores seja exibida SEMPRE em ordem alfabética
  const listaOrdenada = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => 
      (a.name || (a as any).nome_funcionario || '').localeCompare(b.name || (b as any).nome_funcionario || '', 'pt-BR')
    );
  }, [filteredEmployees]);

  const handleOpenNew = () => {
    setEditingEmployee(null);
    setRegistrationType('Funcionário');
    setName('');
    setRole('Operador de Ensiladeira');
    setCpf('');
    setRg('');
    setBirthDate('');
    setPis('');
    setPhotoUrl('');
    setPhone('');
    setBaseSalary('0,00');
    setContractType('Registrado (CLT)');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setTerminationDate('');
    setIsActive(true);
    setReceivesCommission(false);
    setCommissionPerHour('0,00');
    setCommissionPerAlqueire('0,00');
    setCommissionPerHectare('0,00');
    setCnhNumber('');
    setCnhCategory('B');
    setCnhExpiration('');
    setCnhUpgradeDT(false);
    setCnhUpgradeCategory('A');
    setPaymentLocation('');
    setBankPixKey('');
    setBankAgency('');
    setBankAccount('');
    setAdmissionExamDoc(null);
    setExperienceContractDoc(null);
    setGeneralDocs(null);
    setSignedRegistrationDoc(null);
    setShowCnhFields(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    const resolvedRegType = emp.registrationType === 'mecanico_especialista' ? 'Mecanico Especialista' : (emp.registrationType || 'Funcionário');
    const resolvedRole = emp.role === 'mecanico_especialista' ? 'Mecanico Especialista' : (emp.role || 'Operador de Ensiladeira');
    setRegistrationType(resolvedRegType);
    setName(emp.name || '');
    setRole(resolvedRole);
    setCpf(emp.cpf || '');
    setRg(emp.rg || '');
    setBirthDate(emp.birthDate || '');
    setPis(emp.pis || '');
    setPhotoUrl(emp.photoUrl || '');
    setPhone(emp.phone || '');
    setBaseSalary(emp.baseSalary !== undefined ? formatCurrencyInputDisplay(emp.baseSalary) : (emp.salary !== undefined ? formatCurrencyInputDisplay(emp.salary) : '0,00'));
    setContractType(emp.contractType || 'Registrado (CLT)');
    setAdmissionDate(emp.admissionDate || '');
    setTerminationDate(emp.terminationDate || '');
    setIsActive(emp.active !== undefined ? emp.active : (emp.status !== 'inativo'));
    setReceivesCommission(emp.receivesCommission || false);
    setCommissionPerHour(emp.commissionPerHour !== undefined ? formatCurrencyInputDisplay(emp.commissionPerHour) : '0,00');
    setCommissionPerAlqueire(emp.commissionPerAlqueire !== undefined ? formatCurrencyInputDisplay(emp.commissionPerAlqueire) : '0,00');
    setCommissionPerHectare(emp.commissionPerHectare !== undefined ? formatCurrencyInputDisplay(emp.commissionPerHectare) : '0,00');
    
    setCnhNumber(emp.cnhNumber || '');
    setCnhCategory(emp.cnhCategory || 'B');
    setCnhExpiration(emp.cnhExpiration || '');
    setCnhUpgradeDT(Boolean(emp.cnhUpgradeDT));
    setCnhUpgradeCategory(emp.cnhUpgradeCategory || 'A');

    setPaymentLocation(emp.paymentLocation || '');
    setBankPixKey(emp.bankPixKey || '');
    setBankAgency(emp.bankAgency || '');
    setBankAccount(emp.bankAccount || '');

    setAdmissionExamDoc(emp.admissionExamDoc || null);
    setExperienceContractDoc(emp.experienceContractDoc || null);
    setGeneralDocs(emp.generalDocs || null);
    setSignedRegistrationDoc(emp.signedRegistrationDoc || null);

    setShowCnhFields(Boolean(emp.cnhNumber || emp.cnhExpiration || emp.cnhUpgradeDT));
    setIsModalOpen(true);
  };

  // Open official print preview modal for a specific employee sheet
  const handleOpenEmployeePrint = (emp: Partial<Employee>) => {
    setEmployeeToPrint(emp);
    const contentHtml = generateEmployeeSheetHtml(emp, activeCompany);
    const whatsappText = generateEmployeeWhatsAppText(emp, activeCompany);
    const empName = emp.name?.trim() || 'Colaborador';
    const companyTradeName = activeCompany.tradeName || 'Silagem Fácil';

    setSingleEmployeePrintOptions({
      title: `Ficha Cadastral & Termo de Admissão - ${empName}`,
      subtitle: `Colaborador: ${empName} • Função: ${emp.role || 'Operador'} • Regime: ${emp.contractType || 'CLT'}`,
      documentType: 'CADASTRO DE FUNCIONÁRIO PARA ASSINATURA',
      company: activeCompany,
      contentHtml,
      showSignatures: true,
      signatureLabels: [
        `Assinatura do Colaborador: ${empName}`,
        `Recursos Humanos - ${companyTradeName}`
      ],
      whatsappText,
    });
    setIsSingleEmployeePrintOpen(true);
  };

  // Helper alias to trigger employee sheet print modal
  const handlePrintEmployeeSheet = (emp: Partial<Employee>) => {
    handleOpenEmployeePrint(emp);
  };

  // Helper to trigger print from current modal form state
  const handlePrintCurrentModalEmployee = () => {
    const parsedSalary = parseCurrencyInput(baseSalary);
    const parsedPerHour = parseCurrencyInput(commissionPerHour);
    const parsedPerAlq = parseCurrencyInput(commissionPerAlqueire);
    const parsedPerHa = parseCurrencyInput(commissionPerHectare);

    const rawRole = role.trim();
    const finalRole = (rawRole === 'mecanico_especialista' ? 'Mecanico Especialista' : rawRole) || 'Operador';
    const rawRegType = registrationType.trim();
    const finalRegType = (rawRegType === 'mecanico_especialista' ? 'Mecanico Especialista' : rawRegType) || 'Funcionário';

    const snapshot: Partial<Employee> = {
      id: editingEmployee?.id || `emp_temp_${Date.now()}`,
      name: name.trim() || 'Nome do Colaborador',
      registrationType: finalRegType,
      role: finalRole,
      cpf: cpf.trim() || undefined,
      rg: rg.trim() || undefined,
      birthDate: birthDate || undefined,
      pis: pis.trim() || undefined,
      photoUrl: photoUrl || undefined,
      phone: phone.trim() || 'Não informado',
      baseSalary: parsedSalary,
      salary: parsedSalary,
      contractType: contractType.trim() || 'Registrado (CLT)',
      admissionDate: admissionDate || undefined,
      terminationDate: terminationDate || undefined,
      active: isActive,
      status: isActive ? 'ativo' : 'inativo',
      receivesCommission,
      commissionPerHour: receivesCommission ? parsedPerHour : 0,
      commissionPerAlqueire: receivesCommission ? parsedPerAlq : 0,
      commissionPerHectare: receivesCommission ? parsedPerHa : 0,
      cnhNumber: cnhNumber.trim() || undefined,
      cnhCategory: cnhNumber.trim() ? cnhCategory : undefined,
      cnhExpiration: cnhExpiration || undefined,
      cnhUpgradeDT,
      cnhUpgradeCategory: cnhUpgradeDT ? cnhUpgradeCategory : undefined,
      paymentLocation: paymentLocation.trim() || undefined,
      bankPixKey: bankPixKey.trim() || undefined,
      bankAgency: bankAgency.trim() || undefined,
      bankAccount: bankAccount.trim() || undefined,
      admissionExamDoc: admissionExamDoc || undefined,
      experienceContractDoc: experienceContractDoc || undefined,
      generalDocs: generalDocs || undefined,
      signedRegistrationDoc: signedRegistrationDoc || undefined,
    };

    handleOpenEmployeePrint(snapshot);
  };

  // Profile Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('A foto deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Document Upload Handler
  const handleFileUpload = (
    field: 'admissionExamDoc' | 'experienceContractDoc' | 'generalDocs' | 'signedRegistrationDoc',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const attachment: EmployeeAttachment = {
        name: file.name,
        fileData: event.target?.result as string,
        uploadedAt: new Date().toISOString(),
        size: file.size,
      };

      if (field === 'admissionExamDoc') setAdmissionExamDoc(attachment);
      if (field === 'experienceContractDoc') setExperienceContractDoc(attachment);
      if (field === 'generalDocs') setGeneralDocs(attachment);
      if (field === 'signedRegistrationDoc') setSignedRegistrationDoc(attachment);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (field: 'admissionExamDoc' | 'experienceContractDoc' | 'generalDocs' | 'signedRegistrationDoc') => {
    if (field === 'admissionExamDoc') setAdmissionExamDoc(null);
    if (field === 'experienceContractDoc') setExperienceContractDoc(null);
    if (field === 'generalDocs') setGeneralDocs(null);
    if (field === 'signedRegistrationDoc') setSignedRegistrationDoc(null);
  };

  const handleDelete = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    const isConfirmed = await confirm({
      title: 'Excluir Funcionário / Colaborador',
      message: emp?.name 
        ? `Deseja realmente remover o colaborador "${emp.name}" do sistema?`
        : 'Deseja realmente remover este colaborador do sistema?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      onSaveEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const rawRole = role.trim();
    const finalRole = (rawRole === 'mecanico_especialista' ? 'Mecanico Especialista' : rawRole) || 'Operador de Ensiladeira';
    
    const rawRegType = registrationType.trim();
    const finalRegType = (rawRegType === 'mecanico_especialista' ? 'Mecanico Especialista' : rawRegType) || 'Funcionário';

    const parsedSalary = parseCurrencyInput(baseSalary);
    const parsedPerHour = parseCurrencyInput(commissionPerHour);
    const parsedPerAlq = parseCurrencyInput(commissionPerAlqueire);
    const parsedPerHa = parseCurrencyInput(commissionPerHectare);

    const employeeData: Partial<Employee> = {
      name: name.trim(),
      registrationType: finalRegType,
      role: finalRole,
      cpf: cpf.trim() || undefined,
      rg: rg.trim() || undefined,
      birthDate: birthDate || undefined,
      pis: pis.trim() || undefined,
      photoUrl: photoUrl || undefined,
      phone: phone.trim(),
      baseSalary: parsedSalary,
      salary: parsedSalary,
      contractType: contractType.trim() || 'Registrado (CLT)',
      admissionDate: admissionDate || undefined,
      terminationDate: terminationDate || undefined,
      active: isActive,
      status: isActive ? (editingEmployee?.status === 'ferias' ? 'ferias' : editingEmployee?.status === 'afastado' ? 'afastado' : 'ativo') : 'inativo',
      receivesCommission,
      commissionPerHour: receivesCommission ? parsedPerHour : 0,
      commissionPerAlqueire: receivesCommission ? parsedPerAlq : 0,
      commissionPerHectare: receivesCommission ? parsedPerHa : 0,
      cnhNumber: cnhNumber.trim() || undefined,
      cnhCategory: cnhNumber.trim() ? cnhCategory : undefined,
      cnhExpiration: cnhExpiration || undefined,
      cnhUpgradeDT,
      cnhUpgradeCategory: cnhUpgradeDT ? cnhUpgradeCategory : undefined,
      paymentLocation: paymentLocation.trim() || undefined,
      bankPixKey: bankPixKey.trim() || undefined,
      bankAgency: bankAgency.trim() || undefined,
      bankAccount: bankAccount.trim() || undefined,
      admissionExamDoc: admissionExamDoc || undefined,
      experienceContractDoc: experienceContractDoc || undefined,
      generalDocs: generalDocs || undefined,
      signedRegistrationDoc: signedRegistrationDoc || undefined,
    };

    if (editingEmployee) {
      const updated = employees.map(emp =>
        emp.id === editingEmployee.id
          ? {
              ...emp,
              ...employeeData,
            }
          : emp
      );
      onSaveEmployees(updated);
    } else {
      const newEmp: Employee = {
        id: `emp_${Date.now()}`,
        name: employeeData.name!,
        role: employeeData.role!,
        phone: employeeData.phone!,
        status: employeeData.status!,
        ...employeeData,
      };
      onSaveEmployees([...employees, newEmp]);
    }
    setIsModalOpen(false);
  };

  const getCnhBadge = (emp: Employee) => {
    if (!emp.cnhExpiration) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
          Sem CNH
        </span>
      );
    }

    const today = new Date();
    const in60Days = new Date();
    in60Days.setDate(today.getDate() + 60);
    const exp = new Date(emp.cnhExpiration);

    if (exp < today) {
      return (
        <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-3 h-3" />
          <span>CNH Vencida ({formatDateBR(emp.cnhExpiration)})</span>
        </span>
      );
    }

    if (exp <= in60Days) {
      return (
        <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-3 h-3" />
          <span>Vence em breve ({formatDateBR(emp.cnhExpiration)})</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
        <CheckCircle2 className="w-3 h-3" />
        <span>CNH Regular ({formatDateBR(emp.cnhExpiration)})</span>
      </span>
    );
  };

  // Formats print HTML for employees list
  const employeesPrintHtml = useMemo(() => {
    const listToPrint = filteredEmployees.length > 0 ? filteredEmployees : employees;
    const totalBaseSalary = listToPrint.reduce((acc, emp) => {
      const sal = emp.baseSalary ?? emp.salary ?? 0;
      return acc + (typeof sal === 'number' ? sal : 0);
    }, 0);

    const activeCount = listToPrint.filter(e => e.active !== false && e.status !== 'inativo').length;
    const now = new Date();
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);

    return `
      <!-- Metrics Overview Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Listado</div>
          <div style="font-size: 13pt; font-weight: 900; color: #0f172a; margin-top: 2px;">${listToPrint.length} colaboradores</div>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #166534; text-transform: uppercase;">Colaboradores Ativos</div>
          <div style="font-size: 13pt; font-weight: 900; color: #15803d; margin-top: 2px;">${activeCount} ativos</div>
        </div>
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #9f1239; text-transform: uppercase;">CNHs Vencidas</div>
          <div style="font-size: 13pt; font-weight: 900; color: #e11d48; margin-top: 2px;">${cnhReport.expiredCount}</div>
        </div>
        <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #115e59; text-transform: uppercase;">Total Salário Base</div>
          <div style="font-size: 12pt; font-weight: 900; color: #0f766e; margin-top: 2px;">${formatCurrencyBRL(totalBaseSalary)}</div>
        </div>
      </div>

      <!-- Employees Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 6px;">
        <thead>
          <tr style="background: #009688; color: #ffffff; text-align: left; font-size: 7.5pt; text-transform: uppercase;">
            <th style="padding: 7px 8px; border: 1px solid #00897b; width: 4%;">#</th>
            <th style="padding: 7px 8px; border: 1px solid #00897b; width: 26%;">Colaborador / Contato</th>
            <th style="padding: 7px 8px; border: 1px solid #00897b; width: 22%;">Cargo & Vínculo</th>
            <th style="padding: 7px 8px; border: 1px solid #00897b; width: 14%; text-align: right;">Salário Base</th>
            <th style="padding: 7px 8px; border: 1px solid #00897b; width: 16%;">Comissões</th>
            <th style="padding: 7px 8px; border: 1px solid #00897b; width: 18%;">CNH / Validade</th>
          </tr>
        </thead>
        <tbody>
          ${listToPrint.map((emp, index) => {
            const isInactive = emp.active === false || emp.status === 'inativo';
            const sal = emp.baseSalary ?? emp.salary ?? 0;
            const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';

            // CNH status label
            let cnhText = '<span style="color: #94a3b8;">Sem CNH</span>';
            if (emp.cnhExpiration) {
              const expDate = new Date(emp.cnhExpiration);
              if (expDate < now) {
                cnhText = `<strong style="color: #e11d48;">VENCIDA (${formatDateBR(emp.cnhExpiration)})</strong><br/><span style="font-size: 7pt; color: #64748b;">Cat. ${emp.cnhCategory || '-'} | Nº ${emp.cnhNumber || '-'}</span>`;
              } else if (expDate <= in60Days) {
                cnhText = `<strong style="color: #d97706;">Vence em breve (${formatDateBR(emp.cnhExpiration)})</strong><br/><span style="font-size: 7pt; color: #64748b;">Cat. ${emp.cnhCategory || '-'} | Nº ${emp.cnhNumber || '-'}</span>`;
              } else {
                cnhText = `<strong style="color: #16a34a;">Regular (${formatDateBR(emp.cnhExpiration)})</strong><br/><span style="font-size: 7pt; color: #64748b;">Cat. ${emp.cnhCategory || '-'} | Nº ${emp.cnhNumber || '-'}</span>`;
              }
            }

            // Commission info
            const comParts: string[] = [];
            if (emp.receivesCommission) {
              if (emp.commissionPerHour && emp.commissionPerHour > 0) comParts.push(`R$ ${emp.commissionPerHour.toFixed(2)}/h`);
              if (emp.commissionPerAlqueire && emp.commissionPerAlqueire > 0) comParts.push(`R$ ${emp.commissionPerAlqueire.toFixed(2)}/alq`);
              if (emp.commissionPerHectare && emp.commissionPerHectare > 0) comParts.push(`R$ ${emp.commissionPerHectare.toFixed(2)}/ha`);
            }
            const comText = comParts.length > 0 
              ? `<span style="color: #b45309; font-weight: 700;">${comParts.join(' | ')}</span>`
              : '<span style="color: #94a3b8;">Sem comissão</span>';

            return `
              <tr style="background: ${rowBg}; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #64748b; text-align: center;">
                  ${index + 1}
                </td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">
                  <strong style="color: #0f172a; font-size: 8.5pt;">${emp.name}</strong>
                  ${isInactive ? ' <span style="display: inline-block; font-size: 6.5pt; font-weight: 800; background: #e2e8f0; color: #475569; padding: 1px 4px; border-radius: 3px;">INATIVO</span>' : ' <span style="display: inline-block; font-size: 6.5pt; font-weight: 800; background: #dcfce7; color: #15803d; padding: 1px 4px; border-radius: 3px;">ATIVO</span>'}
                  <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">
                    ${emp.cpf ? `CPF: ${emp.cpf}` : ''} ${emp.phone ? `| Tel: ${emp.phone}` : ''}
                  </div>
                </td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">
                  <strong style="color: #1e293b;">${emp.role || '-'}</strong>
                  <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">
                    ${emp.contractType || emp.registrationType || 'CLT'} ${emp.admissionDate ? `| Adm: ${formatDateBR(emp.admissionDate)}` : ''}
                  </div>
                </td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">
                  ${formatCurrencyBRL(sal)}
                </td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 7.5pt;">
                  ${comText}
                </td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 7.5pt;">
                  ${cnhText}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: 800; border-top: 2px solid #cbd5e1; font-size: 8.5pt;">
            <td colspan="3" style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #334155; text-transform: uppercase;">
              Total Geral da Folha Base (${listToPrint.length} registros):
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #009688;">
              ${formatCurrencyBRL(totalBaseSalary)}
            </td>
            <td colspan="2" style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b; font-size: 7.5pt;">
              *Comissões variáveis calculadas conforme serviços executados
            </td>
          </tr>
        </tfoot>
      </table>
    `;
  }, [filteredEmployees, employees, cnhReport]);

  // Formats WhatsApp text message
  const employeesWhatsAppText = useMemo(() => {
    const listToPrint = filteredEmployees.length > 0 ? filteredEmployees : employees;
    const now = new Date();
    const dateStr = formatDateBR(now.toISOString().split('T')[0]);
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const activeCount = listToPrint.filter(e => e.active !== false && e.status !== 'inativo').length;

    let text = `🚜 *${activeCompany.tradeName?.toUpperCase() || 'SILAGEM FÁCIL'}*\n`;
    text += `📋 *RELAÇÃO DE FUNCIONÁRIOS, MOTORISTAS & OPERADORES*\n`;
    text += `📅 *Emissão:* ${dateStr} às ${timeStr}\n`;
    text += `👥 *Total:* ${listToPrint.length} colaboradores (${activeCount} ativos)\n`;
    text += `⚠️ *CNHs Vencidas:* ${cnhReport.expiredCount}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    listToPrint.forEach((emp, i) => {
      text += `*${i + 1}. ${emp.name}*\n`;
      text += `   💼 Cargo: ${emp.role || '-'}\n`;
      if (emp.cpf) text += `   📄 CPF: ${emp.cpf}\n`;
      if (emp.phone) text += `   📞 Tel: ${emp.phone}\n`;
      if (emp.cnhExpiration) {
        text += `   🪪 CNH (Cat ${emp.cnhCategory || '-'}): Validade ${formatDateBR(emp.cnhExpiration)}\n`;
      }
      text += `\n`;
    });

    return text;
  }, [filteredEmployees, employees, activeCompany, cnhReport]);

  return (
    <div id="employees-module" className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-white tracking-tight font-['Outfit']">
            Funcionários, Motoristas & Operadores
          </h2>
          <p className="text-xs text-white/90 font-medium mt-0.5">
            Cadastro completo, remuneração, comissões por hectare/alqueire e controle de CNH
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            title="Imprimir relatório completo de funcionários e operadores com logotipo e dados cadastrais"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-black bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-black" />
            <span>Imprimir Lista</span>
          </button>

          {/* New Employee Button */}
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cadastro</span>
          </button>
        </div>
      </div>

      {/* CNH Alert & Staff Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between text-black">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
              CNHs Vencidas
            </span>
            <div className="text-2xl font-black text-rose-700 font-['Outfit'] mt-1">
              {cnhReport.expiredCount}
            </div>
            <p className="text-[11px] text-black/75 font-medium mt-0.5">
              Exige regularização imediata
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center font-black">
            !
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between text-black">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
              CNHs a Vencer (60 dias)
            </span>
            <div className="text-2xl font-black text-amber-700 font-['Outfit'] mt-1">
              {cnhReport.expiringIn60DaysCount}
            </div>
            <p className="text-[11px] text-black/75 font-medium mt-0.5">
              Agendar renovação com motorista
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between text-black">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-black">
              Total de Colaboradores
            </span>
            <div className="text-2xl font-black text-black font-['Outfit'] mt-1">
              {employees.length}
            </div>
            <p className="text-[11px] text-black/75 font-medium mt-0.5">
              {employees.filter(e => e.active !== false && e.status !== 'inativo').length} ativos no momento
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center">
            <UserSquare2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs flex items-center space-x-3 text-black">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo, CPF ou número de CNH..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-black placeholder-slate-400 focus:ring-1 focus:ring-sky-600 outline-none"
          />
        </div>
      </div>

      {/* Employees Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-black uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="py-3 px-4">Nome & Contato</th>
                <th className="py-3 px-4">Cargo / Regime</th>
                <th className="py-3 px-4">Salário Base</th>
                <th className="py-3 px-4">Comissão</th>
                <th className="py-3 px-4">CNH / Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {listaOrdenada.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="font-bold text-black">
                        {emp.name}
                      </div>
                      {emp.active === false || emp.status === 'inativo' ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-black font-bold">
                          INATIVO
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                          ATIVO
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/75 font-medium mt-0.5">
                      {emp.cpf && (
                        <span className="font-mono text-[11px]">CPF: {emp.cpf}</span>
                      )}
                      {emp.phone && (
                        <div className="flex items-center space-x-1 text-black/75">
                          <Phone className="w-3 h-3 text-black/60" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1.5 text-black font-bold">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      <span>{emp.role}</span>
                    </div>
                    <div className="text-[11px] text-black/75 font-medium mt-0.5">
                      {emp.contractType || 'Registrado (CLT)'}
                      {emp.admissionDate && ` • Adm: ${formatDateBR(emp.admissionDate)}`}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-black text-black font-['Outfit']">
                    {formatCurrencyBRL(emp.baseSalary || emp.salary || 0)}
                  </td>

                  <td className="py-3.5 px-4">
                    {emp.receivesCommission ? (
                      <div className="space-y-0.5 text-[11px]">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">
                          Comissão Ativa
                        </span>
                        <div className="text-black/80 font-bold font-['Outfit'] text-[10px]">
                          {emp.commissionPerHour ? `${formatCurrencyBRL(emp.commissionPerHour)}/h ` : ''}
                          {emp.commissionPerAlqueire ? `${formatCurrencyBRL(emp.commissionPerAlqueire)}/alq ` : ''}
                          {emp.commissionPerHectare ? `${formatCurrencyBRL(emp.commissionPerHectare)}/ha` : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-black/60 text-xs font-medium">Sem comissão</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      {emp.cnhNumber ? (
                        <div className="flex items-center space-x-1 text-xs">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span className="font-bold text-black">
                            Cat. {emp.cnhCategory || 'B'}
                          </span>
                        </div>
                      ) : null}
                      {getCnhBadge(emp)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handlePrintEmployeeSheet(emp)}
                        className="p-1.5 text-black hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Imprimir cadastro do funcionário para assinatura"
                      >
                        <Printer className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 text-black hover:text-sky-700 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 text-black hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição de Colaborador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            
            {/* Header - Solid Green Bar */}
            <div className="px-5 py-3 bg-[#00897b] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <UserSquare2 className="w-5 h-5 text-white/90" />
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  {editingEmployee ? 'Editar Cadastro de Funcionário' : 'Novo Cadastro de Funcionário'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Highlight Banner: Imprimir Cadastro */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-900 dark:text-amber-300 font-medium">
                  Pronto para colher assinatura física? Imprima a ficha A4 com termo de responsabilidade e dados cadastrais.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrintCurrentModalEmployee}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir cadastro do funcionário para assinatura</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar bg-[#0a8bc1]">
              
              {/* SECTION 1: DADOS BÁSICOS & FOTO */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-stone-200 dark:border-stone-800">
                  <UserSquare2 className="w-4 h-4 text-[#00897b]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    1. Dados Básicos do Funcionário
                  </h4>
                </div>

                {/* Profile Photo & Primary Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  
                  {/* Photo Upload Thumbnail */}
                  <div className="sm:col-span-3 flex flex-col items-center justify-center p-3 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-center">
                    {photoUrl ? (
                      <div className="relative group">
                        <img 
                          src={photoUrl} 
                          alt="Foto Perfil" 
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[#00897b] shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-sm cursor-pointer"
                          title="Remover foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-400">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}

                    <label className="mt-2.5 inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-[#00897b] bg-[#00897b]/10 hover:bg-[#00897b]/20 rounded-lg cursor-pointer transition">
                      <Camera className="w-3 h-3" />
                      <span>{photoUrl ? 'Alterar foto' : 'Upload de Foto'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                      />
                    </label>
                    <span className="text-[10px] text-stone-400 mt-1">JPG ou PNG até 5MB</span>
                  </div>

                  {/* Basic fields in grid */}
                  <div className="sm:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <ManageableDropdown
                        id="employee-registration-type-dropdown"
                        label="Tipo de Cadastro"
                        value={registrationType}
                        onChange={setRegistrationType}
                        options={regTypeOptions}
                        onOptionsChange={handleUpdateRegTypeOptions}
                        placeholder="Selecione o tipo..."
                        newItemPlaceholder="Novo tipo..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                        Nome completo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome e Sobrenome completo"
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                      />
                    </div>

                    {/* CPF & RG */}
                    <div>
                      <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(formatCpfCnpj(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                        Número do RG
                      </label>
                      <input
                        type="text"
                        value={rg}
                        onChange={(e) => setRg(e.target.value)}
                        placeholder="Ex: 00.000.000-0 SSP/UF"
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                      />
                    </div>

                    {/* Data de Nascimento & PIS */}
                    <div>
                      <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                        Número do PIS / PASEP
                      </label>
                      <input
                        type="text"
                        value={pis}
                        onChange={(e) => setPis(e.target.value)}
                        placeholder="000.00000.00-0"
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DADOS PROFISSIONAIS & CONTRATUAIS */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-stone-200 dark:border-stone-800">
                  <Briefcase className="w-4 h-4 text-[#00897b]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    2. Dados Profissionais & Contrato
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <ManageableDropdown
                      id="employee-role-dropdown"
                      label="Cargo / Função"
                      value={role}
                      onChange={setRole}
                      options={roleOptions}
                      onOptionsChange={handleUpdateRoleOptions}
                      placeholder="Selecione o cargo..."
                      newItemPlaceholder="Novo cargo..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                      Salário Base (R$)
                    </label>
                    <input
                      type="text"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      onBlur={() => {
                        if (baseSalary) {
                          const parsed = parseCurrencyInput(baseSalary);
                          setBaseSalary(formatCurrencyInputDisplay(parsed));
                        }
                      }}
                      placeholder="0,00"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                    />
                  </div>

                  <div>
                    <ManageableDropdown
                      label="Regime de Contratação"
                      value={contractType}
                      onChange={setContractType}
                      options={contractTypeOptions}
                      onOptionsChange={handleUpdateContractTypeOptions}
                      placeholder="Selecione o regime..."
                      newItemPlaceholder="Novo regime..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                      Data de Admissão <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                      Data de Demissão
                    </label>
                    <input
                      type="date"
                      value={terminationDate}
                      onChange={(e) => setTerminationDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`
                      relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                      ${isActive ? 'bg-[#00897b]' : 'bg-stone-300 dark:bg-stone-700'}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                        ${isActive ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                  <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                    Funcionário ativo no quadro de colaboradores
                  </span>
                </div>
              </div>

              {/* SECTION 3: COMISSÃO */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-[#fffdf5] dark:bg-amber-950/20 p-3 space-y-2">
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setReceivesCommission(!receivesCommission)}
                    className={`
                      relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                      ${receivesCommission ? 'bg-[#00897b]' : 'bg-stone-300 dark:bg-stone-700'}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                        ${receivesCommission ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-[#b45309] dark:text-amber-400">
                    Recebe comissão variável sobre produção
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#b45309] dark:text-amber-400 mb-1">
                      Por hora (R$/h)
                    </label>
                    <input
                      type="text"
                      value={commissionPerHour}
                      onChange={(e) => setCommissionPerHour(e.target.value)}
                      onBlur={() => {
                        if (commissionPerHour) {
                          const parsed = parseCurrencyInput(commissionPerHour);
                          setCommissionPerHour(formatCurrencyInputDisplay(parsed));
                        }
                      }}
                      placeholder="0,00"
                      disabled={!receivesCommission}
                      className={`w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b] ${
                        !receivesCommission ? 'opacity-60 cursor-not-allowed bg-stone-100 dark:bg-stone-800' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#b45309] dark:text-amber-400 mb-1">
                      Por alqueire (R$/alq)
                    </label>
                    <input
                      type="text"
                      value={commissionPerAlqueire}
                      onChange={(e) => setCommissionPerAlqueire(e.target.value)}
                      onBlur={() => {
                        if (commissionPerAlqueire) {
                          const parsed = parseCurrencyInput(commissionPerAlqueire);
                          setCommissionPerAlqueire(formatCurrencyInputDisplay(parsed));
                        }
                      }}
                      placeholder="0,00"
                      disabled={!receivesCommission}
                      className={`w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b] ${
                        !receivesCommission ? 'opacity-60 cursor-not-allowed bg-stone-100 dark:bg-stone-800' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#b45309] dark:text-amber-400 mb-1">
                      Por hectare (R$/ha)
                    </label>
                    <input
                      type="text"
                      value={commissionPerHectare}
                      onChange={(e) => setCommissionPerHectare(e.target.value)}
                      onBlur={() => {
                        if (commissionPerHectare) {
                          const parsed = parseCurrencyInput(commissionPerHectare);
                          setCommissionPerHectare(formatCurrencyInputDisplay(parsed));
                        }
                      }}
                      placeholder="0,00"
                      disabled={!receivesCommission}
                      className={`w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b] ${
                        !receivesCommission ? 'opacity-60 cursor-not-allowed bg-stone-100 dark:bg-stone-800' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: CNH & MELHORAR CATEGORIA (DT) */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCnhFields(!showCnhFields)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-[#00897b]" />
                    <span>Carteira de Habilitação (CNH) & Opção de Melhorar Categoria (DT)</span>
                  </div>
                  {showCnhFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showCnhFields && (
                  <div className="p-4 bg-white dark:bg-stone-900 space-y-4 border-t border-stone-200 dark:border-stone-800 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                          Nº CNH
                        </label>
                        <input
                          type="text"
                          value={cnhNumber}
                          onChange={(e) => setCnhNumber(e.target.value)}
                          placeholder="00000000000"
                          className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                          CATEGORIA CNH ATUAL
                        </label>
                        <select
                          value={cnhCategory}
                          onChange={(e) => setCnhCategory(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                        >
                          <option value="A">A (Moto / Veículo 2 rodas)</option>
                          <option value="B">B (Carro / Utilitário leve)</option>
                          <option value="C">C (Caminhão / Trator agrícola)</option>
                          <option value="D">D (Ônibus / Van)</option>
                          <option value="E">E (Carreta / Articulado)</option>
                          <option value="AB">AB (Moto + Carro)</option>
                          <option value="AC">AC (Moto + Caminhão)</option>
                          <option value="AD">AD (Moto + Ônibus)</option>
                          <option value="AE">AE (Moto + Carreta)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                          VALIDADE CNH
                        </label>
                        <input
                          type="date"
                          value={cnhExpiration}
                          onChange={(e) => setCnhExpiration(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                        />
                      </div>
                    </div>

                    {/* Sub-bloco: Melhorar categoria (DT) */}
                    <div className="p-3 bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="cnh-upgrade-checkbox"
                            checked={cnhUpgradeDT}
                            onChange={(e) => setCnhUpgradeDT(e.target.checked)}
                            className="w-4 h-4 text-[#00897b] rounded border-stone-300 focus:ring-[#00897b] cursor-pointer"
                          />
                          <label htmlFor="cnh-upgrade-checkbox" className="text-xs font-bold text-sky-900 dark:text-sky-300 cursor-pointer">
                            Melhorar categoria (DT)
                          </label>
                        </div>
                        <span className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
                          Incentivo de evolução / plano de habilitação
                        </span>
                      </div>

                      {cnhUpgradeDT && (
                        <div className="pt-2 border-t border-sky-200 dark:border-sky-900/50 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                          <div>
                            <label className="block text-[10px] font-bold text-sky-950 dark:text-sky-300 uppercase tracking-wider mb-1">
                              Categoria Alvo / Associação (DT):
                            </label>
                            <select
                              value={cnhUpgradeCategory}
                              onChange={(e) => setCnhUpgradeCategory(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-sky-300 dark:border-sky-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                            >
                              <option value="A">A (Habilitação para Motocicletas)</option>
                              <option value="A + C">A + C (Moto + Caminhão)</option>
                              <option value="A + D">A + D (Moto + Ônibus/Van)</option>
                              <option value="A + E">A + E (Moto + Carreta/Bitrem)</option>
                              <option value="C">C (Caminhão / Trator)</option>
                              <option value="D">D (Ônibus / Van)</option>
                              <option value="E">E (Carreta / Articulado)</option>
                              <option value="Outra Associação">Outra Associação Personalizada</option>
                            </select>
                          </div>
                          <div className="flex items-center text-[11px] text-sky-800 dark:text-sky-300 pt-3">
                            Indica que o colaborador está em processo de alteração ou evolução de categoria junto ao DETRAN.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: INFORMAÇÕES DE PAGAMENTO / RECEBIMENTO */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-stone-200 dark:border-stone-800">
                  <Building2 className="w-4 h-4 text-[#00897b]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    3. Informações de Pagamento / Recebimento
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                      Local de Recebimento
                    </label>
                    <input
                      type="text"
                      value={paymentLocation}
                      onChange={(e) => setPaymentLocation(e.target.value)}
                      placeholder="Ex: Conta Bancária / Sede / Fazenda"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                      Banco / Chave PIX
                    </label>
                    <input
                      type="text"
                      value={bankPixKey}
                      onChange={(e) => setBankPixKey(e.target.value)}
                      placeholder="Ex: Banco do Brasil / PIX CPF"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                      Agência (Ag.)
                    </label>
                    <input
                      type="text"
                      value={bankAgency}
                      onChange={(e) => setBankAgency(e.target.value)}
                      placeholder="0000-0"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                      Conta Corrente (C.C.)
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="00000-0"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00897b]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: ANEXOS & ARQUIVOS DE RETORNO (PDF/IMAGEM) */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-stone-200 dark:border-stone-800">
                  <Paperclip className="w-4 h-4 text-[#00897b]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    4. Anexos & Documentos de Retorno (PDF / Imagem)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Item 1: Exame Admissional */}
                  <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-800/30 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-stone-500" />
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          Exame Admissional (ASO)
                        </span>
                      </div>
                      {admissionExamDoc && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Anexado
                        </span>
                      )}
                    </div>

                    {admissionExamDoc ? (
                      <div className="flex items-center justify-between text-xs bg-white dark:bg-stone-800 p-2 rounded-lg border border-stone-200 dark:border-stone-700">
                        <span className="truncate max-w-[180px] font-medium text-stone-700 dark:text-stone-300" title={admissionExamDoc.name}>
                          {admissionExamDoc.name}
                        </span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <a 
                            href={admissionExamDoc.fileData} 
                            download={admissionExamDoc.name} 
                            className="text-[#00897b] hover:underline flex items-center text-[11px]"
                          >
                            <Download className="w-3.5 h-3.5 mr-0.5" /> Baixar
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('admissionExamDoc')}
                            className="text-rose-600 hover:text-rose-700 p-1"
                            title="Remover anexo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center space-x-2 px-3 py-2 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition">
                        <UploadCloud className="w-4 h-4 text-stone-500" />
                        <span>Upload ASO (PDF ou Imagem)</span>
                        <input
                          type="file"
                          accept=".pdf, image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('admissionExamDoc', e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Item 2: Contrato de Experiência */}
                  <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-800/30 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-stone-500" />
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          Contrato de Experiência
                        </span>
                      </div>
                      {experienceContractDoc && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Anexado
                        </span>
                      )}
                    </div>

                    {experienceContractDoc ? (
                      <div className="flex items-center justify-between text-xs bg-white dark:bg-stone-800 p-2 rounded-lg border border-stone-200 dark:border-stone-700">
                        <span className="truncate max-w-[180px] font-medium text-stone-700 dark:text-stone-300" title={experienceContractDoc.name}>
                          {experienceContractDoc.name}
                        </span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <a 
                            href={experienceContractDoc.fileData} 
                            download={experienceContractDoc.name} 
                            className="text-[#00897b] hover:underline flex items-center text-[11px]"
                          >
                            <Download className="w-3.5 h-3.5 mr-0.5" /> Baixar
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('experienceContractDoc')}
                            className="text-rose-600 hover:text-rose-700 p-1"
                            title="Remover anexo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center space-x-2 px-3 py-2 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition">
                        <UploadCloud className="w-4 h-4 text-stone-500" />
                        <span>Upload Contrato (PDF ou Imagem)</span>
                        <input
                          type="file"
                          accept=".pdf, image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('experienceContractDoc', e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Item 3: Documentos Gerais (RE + CNH) */}
                  <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-800/30 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-stone-500" />
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          Documentos Gerais (RE + CNH)
                        </span>
                      </div>
                      {generalDocs && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Anexado
                        </span>
                      )}
                    </div>

                    {generalDocs ? (
                      <div className="flex items-center justify-between text-xs bg-white dark:bg-stone-800 p-2 rounded-lg border border-stone-200 dark:border-stone-700">
                        <span className="truncate max-w-[180px] font-medium text-stone-700 dark:text-stone-300" title={generalDocs.name}>
                          {generalDocs.name}
                        </span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <a 
                            href={generalDocs.fileData} 
                            download={generalDocs.name} 
                            className="text-[#00897b] hover:underline flex items-center text-[11px]"
                          >
                            <Download className="w-3.5 h-3.5 mr-0.5" /> Baixar
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('generalDocs')}
                            className="text-rose-600 hover:text-rose-700 p-1"
                            title="Remover anexo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center space-x-2 px-3 py-2 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition">
                        <UploadCloud className="w-4 h-4 text-stone-500" />
                        <span>Upload RE + CNH (PDF ou Imagem)</span>
                        <input
                          type="file"
                          accept=".pdf, image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('generalDocs', e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Item 4: Upload do Cadastro Assinado (Retorno) */}
                  <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-800/30 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-[#00897b]" />
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          Ficha Cadastral Assinada (Retorno)
                        </span>
                      </div>
                      {signedRegistrationDoc && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Anexado
                        </span>
                      )}
                    </div>

                    {signedRegistrationDoc ? (
                      <div className="flex items-center justify-between text-xs bg-white dark:bg-stone-800 p-2 rounded-lg border border-stone-200 dark:border-stone-700">
                        <span className="truncate max-w-[180px] font-medium text-stone-700 dark:text-stone-300" title={signedRegistrationDoc.name}>
                          {signedRegistrationDoc.name}
                        </span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <a 
                            href={signedRegistrationDoc.fileData} 
                            download={signedRegistrationDoc.name} 
                            className="text-[#00897b] hover:underline flex items-center text-[11px]"
                          >
                            <Download className="w-3.5 h-3.5 mr-0.5" /> Baixar
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('signedRegistrationDoc')}
                            className="text-rose-600 hover:text-rose-700 p-1"
                            title="Remover anexo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center space-x-2 px-3 py-2 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition">
                        <UploadCloud className="w-4 h-4 text-[#00897b]" />
                        <span>Upload Ficha Assinada Digitalizada</span>
                        <input
                          type="file"
                          accept=".pdf, image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('signedRegistrationDoc', e)}
                        />
                      </label>
                    )}
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handlePrintCurrentModalEmployee}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir cadastro do funcionário para assinatura</span>
                </button>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-[#00897b] hover:bg-[#00796b] text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal with Company Logo & Cadastral Data (Full Staff Roster) */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        options={{
          title: 'Relação de Funcionários, Motoristas & Operadores',
          subtitle: 'Quadro geral de colaboradores, cargos, remunerações e controle de CNH',
          documentType: 'RELATÓRIO CADASTRAL DE COLABORADORES',
          company: activeCompany,
          contentHtml: employeesPrintHtml,
          signatureLabels: ['Gestor de Recursos Humanos / Operações', 'Diretoria / Responsável Legal'],
          whatsappText: employeesWhatsAppText,
        }}
      />

      {/* Print Preview Modal for Single Employee Registration Sheet (with Direct Print, PDF Download, WhatsApp) */}
      {singleEmployeePrintOptions && (
        <PrintPreviewModal
          isOpen={isSingleEmployeePrintOpen}
          onClose={() => setIsSingleEmployeePrintOpen(false)}
          options={singleEmployeePrintOptions}
        />
      )}

      {/* Single Employee Printable Sheet (renders in DOM, styled by @media print) */}
      <PrintableEmployeeSheet 
        employee={employeeToPrint} 
        companyProfile={activeCompany} 
      />

    </div>
  );
};

