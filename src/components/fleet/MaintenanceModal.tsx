import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Wrench, 
  Save, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  MapPin, 
  UserCheck, 
  Building2, 
  Truck, 
  FileText, 
  CreditCard, 
  Plus, 
  Trash2, 
  Package, 
  ShoppingCart, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  FileCheck2,
  Tag,
  Settings2,
  Users,
  Hammer
} from 'lucide-react';
import { 
  MaintenanceLog, 
  Machinery, 
  Expense, 
  InventoryItem, 
  Supplier, 
  Employee,
  MaintenanceLocation,
  MaintenanceExecutorType,
  MaintenancePartItem,
  MaintenanceLaborItem,
  MaintenanceNfeLink,
  MaintenanceFinancialConditions,
  PaymentMethod,
  MaintenanceCategoryDefinition
} from '../../types';
import { 
  formatCurrencyBRL, 
  getStoredMaintenanceCategories, 
  saveStoredMaintenanceCategories,
  getStoredEmployees
} from '../../lib/storage';
import { MaintenanceCategoriesModal } from './MaintenanceCategoriesModal';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    log: MaintenanceLog, 
    options: {
      createExpense: boolean;
      deductStock: boolean;
      createPurchaseRequest: boolean;
    }
  ) => void;
  editingLog: MaintenanceLog | null;
  machineries: Machinery[];
  inventory?: InventoryItem[];
  suppliers?: Supplier[];
  employees?: Employee[];
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLog,
  machineries,
  inventory = [],
  suppliers = [],
  employees = [],
}) => {
  // Active subtab inside modal for clean navigation
  const [activeTab, setActiveTab] = useState<'geral' | 'pecas' | 'fiscal_financeiro'>('geral');

  // --- DADOS GERAIS ---
  const [osNumber, setOsNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [completionDate, setCompletionDate] = useState('');
  const [machineryId, setMachineryId] = useState('');
  const [type, setType] = useState<MaintenanceLog['type']>('preventiva');
  const [serviceCategory, setServiceCategory] = useState<string>('Troca de Óleo & Filtros');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<MaintenanceLog['status']>('concluida');
  const [currentHourMeterOrKm, setCurrentHourMeterOrKm] = useState('');
  const [nextServiceDue, setNextServiceDue] = useState('');
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- CATEGORIAS DE SERVIÇO DINÂMICAS ---
  const [categoriesList, setCategoriesList] = useState<MaintenanceCategoryDefinition[]>([]);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  useEffect(() => {
    setCategoriesList(getStoredMaintenanceCategories());
  }, [isOpen]);

  const handleSaveCategories = (updated: MaintenanceCategoryDefinition[]) => {
    setCategoriesList(updated);
    saveStoredMaintenanceCategories(updated);
  };

  // --- CARREGAMENTO GLOBAL E SINCRONIZAÇÃO DE FUNCIONÁRIOS ---
  const [storedEmployees, setStoredEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStoredEmployees(getStoredEmployees());
    }
  }, [isOpen]);

  // Lista consolidada de todos os funcionários (via props ou localStorage)
  const allEmployeesList = useMemo(() => {
    if (employees && employees.length > 0) return employees;
    if (storedEmployees.length > 0) return storedEmployees;
    return getStoredEmployees();
  }, [employees, storedEmployees]);

  // Filtragem de mecânicos e prestadores de manutenção:
  // Funcionários ativos cujo Cargo ou Tipo de Cadastro corresponda a Mecânico, Mecânico Especialista, Auxiliar ou Prestador de Serviço
  const mechanicEmployees = useMemo(() => {
    // 1. Filtrar funcionários ativos (não inativos e active !== false)
    const activeList = allEmployeesList.filter(
      emp => emp.status !== 'inativo' && emp.active !== false
    );

    const normalize = (str?: string) => 
      (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // 2. Filtra por Tipo de Cadastro ou Cargo/Função: "Mecanico Especialista", "Auxiliar" ou prestadores de serviço de manutenção
    const filtered = activeList.filter(emp => {
      const role = normalize(emp.role);
      const reg = normalize(emp.registrationType);
      
      const isMechanic = role.includes('mecanic') || reg.includes('mecanic');
      const isAuxiliar = role.includes('auxiliar') || reg.includes('auxiliar');
      const isMaintenanceProvider = 
        (reg.includes('prestador') || role.includes('prestador')) && 
        (role.includes('manutenc') || reg.includes('manutenc') || role.includes('mecanic') || reg.includes('oficina') || role.includes('servico'));
      const isGeneralMaintenance = role.includes('manutenc') || reg.includes('manutenc');

      return isMechanic || isAuxiliar || isMaintenanceProvider || isGeneralMaintenance;
    });

    // Se houver funcionários filtrados específicos, retorna a lista filtrada; 
    // Caso a base não tenha ainda funcionários com esses cargos específicos, exibe todos os funcionários ativos para garantir opções no Select
    return filtered.length > 0 ? filtered : activeList;
  }, [allEmployeesList]);

  // --- LOCAL DA MANUTENÇÃO ---
  const [location, setLocation] = useState<MaintenanceLocation>('oficina_interna');
  const [locationDetails, setLocationDetails] = useState('');

  // --- RESPONSÁVEL PELA EXECUÇÃO (EXECUTANTE) ---
  const [executorType, setExecutorType] = useState<MaintenanceExecutorType>('equipe_propria');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [workshopOrMechanic, setWorkshopOrMechanic] = useState('Mecânica Interna / Própria');

  // --- PEÇAS & INSUMOS ---
  const [partsItems, setPartsItems] = useState<MaintenancePartItem[]>([]);
  const [partsCostManual, setPartsCostManual] = useState('');
  const [usePartsItemList, setUsePartsItemList] = useState(true);

  // --- MÃO DE OBRA (LISTA DINÂMICA DE MECÂNICOS & AVULSO) ---
  const [laborItems, setLaborItems] = useState<MaintenanceLaborItem[]>([]);
  const [laborCost, setLaborCost] = useState('');

  // --- INTEGRAÇÃO FISCAL (NF-e) ---
  const [hasNfe, setHasNfe] = useState(false);
  const [nfeNumber, setNfeNumber] = useState('');
  const [nfeSeries, setNfeSeries] = useState('');
  const [nfeAccessKey, setNfeAccessKey] = useState('');
  const [nfeIssueDate, setNfeIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [nfeSupplierName, setNfeSupplierName] = useState('');
  const [nfeTotalAmount, setNfeTotalAmount] = useState('');

  // --- INTEGRAÇÃO FINANCEIRA (CONTAS A PAGAR) ---
  const [createExpense, setCreateExpense] = useState(true);
  const [paymentTerm, setPaymentTerm] = useState<MaintenanceFinancialConditions['paymentTerm']>('a_vista');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('boleto');
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [financialSupplier, setFinancialSupplier] = useState('');

  // --- SOLICITAÇÃO DE COMPRA (FLUXO A) ---
  const [generatePurchaseRequest, setGeneratePurchaseRequest] = useState(false);
  const [purchaseUrgency, setPurchaseUrgency] = useState<'baixa' | 'media' | 'alta' | 'urgente_veiculo_parado'>('alta');

  // --- BAIXA NO ESTOQUE ---
  const [deductStock, setDeductStock] = useState(true);

  // Preenchimento no carregamento/edição
  useEffect(() => {
    if (editingLog) {
      setOsNumber(editingLog.osNumber || `OS-${editingLog.id.slice(-5).toUpperCase()}`);
      setDate(editingLog.date);
      setCompletionDate(editingLog.completionDate || '');
      setMachineryId(editingLog.machineryId);
      setType(editingLog.type === 'revisao_periodica' ? 'reforma_entressafra' : editingLog.type);
      setServiceCategory(editingLog.serviceCategory);
      setDescription(editingLog.description);
      setStatus(editingLog.status);
      setCurrentHourMeterOrKm(String(editingLog.currentHourMeterOrKm || ''));
      setNextServiceDue(editingLog.nextServiceDueHourMeterOrKm ? String(editingLog.nextServiceDueHourMeterOrKm) : '');
      setNotes(editingLog.notes || '');

      // Local e Executante
      setLocation(editingLog.location || 'oficina_interna');
      setLocationDetails(editingLog.locationDetails || '');
      setExecutorType(editingLog.executorType || 'equipe_propria');
      setWorkshopOrMechanic(editingLog.workshopOrMechanic || editingLog.executorName || 'Mecânica Interna / Própria');

      // Peças
      if (editingLog.partsItems && editingLog.partsItems.length > 0) {
        setPartsItems(editingLog.partsItems);
        setUsePartsItemList(true);
      } else {
        setPartsItems([]);
        setPartsCostManual(editingLog.partsCost ? String(editingLog.partsCost) : '');
        setUsePartsItemList(false);
      }

      // Mão de Obra
      if (editingLog.laborItems && editingLog.laborItems.length > 0) {
        const defaultDateStr = editingLog.date || new Date().toISOString().split('T')[0];
        setLaborItems(editingLog.laborItems.map(item => ({
          ...item,
          date: item.date || item.dataLancamento || defaultDateStr,
          dataLancamento: item.dataLancamento || item.date || defaultDateStr,
        })));
        const internalLaborSum = editingLog.laborItems.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
        const diff = (editingLog.laborCost || 0) - internalLaborSum;
        setLaborCost(diff > 0.01 ? String(Math.round(diff * 100) / 100) : '');
      } else {
        setLaborItems([]);
        setLaborCost(editingLog.laborCost ? String(editingLog.laborCost) : '');
      }

      // NF-e
      if (editingLog.nfeLink && (editingLog.nfeLink.nfeNumber || editingLog.nfeLink.nfeAccessKey)) {
        setHasNfe(true);
        setNfeNumber(editingLog.nfeLink.nfeNumber || '');
        setNfeSeries(editingLog.nfeLink.nfeSeries || '');
        setNfeAccessKey(editingLog.nfeLink.nfeAccessKey || '');
        setNfeIssueDate(editingLog.nfeLink.issueDate || editingLog.date);
        setNfeSupplierName(editingLog.nfeLink.supplierName || '');
        setNfeTotalAmount(editingLog.nfeLink.totalNfeAmount ? String(editingLog.nfeLink.totalNfeAmount) : '');
      } else {
        setHasNfe(false);
      }

      // Financeiro
      if (editingLog.financialConditions) {
        setCreateExpense(editingLog.financialConditions.createAccountsPayable);
        setPaymentTerm(editingLog.financialConditions.paymentTerm);
        setPaymentMethod(editingLog.financialConditions.paymentMethod);
        setFirstDueDate(editingLog.financialConditions.firstDueDate);
        setFinancialSupplier(editingLog.financialConditions.supplierName || '');
      } else {
        setCreateExpense(false);
      }

      setDeductStock(!editingLog.stockDeducted);
    } else {
      // Novo registro
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      setOsNumber(`OS-${year}-${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      setCompletionDate('');
      if (machineries.length > 0) {
        setMachineryId(machineries[0].id);
        if (machineries[0].hourMeter) {
          setCurrentHourMeterOrKm(String(machineries[0].hourMeter));
        } else if (machineries[0].currentKm) {
          setCurrentHourMeterOrKm(String(machineries[0].currentKm));
        }
      }
      setType('preventiva');
      setServiceCategory('Troca de Óleo & Filtros');
      setDescription('');
      setStatus('concluida');
      setLocation('oficina_interna');
      setLocationDetails('');
      setExecutorType('equipe_propria');
      setWorkshopOrMechanic('Mecânica Interna / Própria');
      setPartsItems([]);
      setPartsCostManual('');
      setUsePartsItemList(true);
      setLaborItems([]);
      setLaborCost('');
      setNextServiceDue('');
      setNotes('');
      setHasNfe(false);
      setNfeNumber('');
      setNfeSeries('');
      setNfeAccessKey('');
      setNfeSupplierName('');
      setNfeTotalAmount('');
      setCreateExpense(true);
      setPaymentTerm('a_vista');
      setPaymentMethod('boleto');
      setFirstDueDate(new Date().toISOString().split('T')[0]);
      setFinancialSupplier('');
      setDeductStock(true);
      setGeneratePurchaseRequest(false);
      setPurchaseUrgency('alta');
    }
    setSaveSuccess(false);
  }, [editingLog, isOpen, machineries]);

  // Máscara visual de milhar em tempo real (padrão pt-BR, ex: 5000 vira "5.000"; 12550 vira "12.550")
  const formatThousand = (val: string | number | undefined): string => {
    if (val === undefined || val === null || val === '') return '';
    const digits = String(val).replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Tratamento do input (onChange): remove qualquer caractere não numérico mantendo no estado apenas o número limpo
  const handleThousandInput = (raw: string, setter: (val: string) => void) => {
    const digitsOnly = raw.replace(/\D/g, '');
    setter(digitsOnly);
  };

  // Atualiza veículo e odômetro sugerido
  const handleMachineryChange = (id: string) => {
    setMachineryId(id);
    const mach = machineries.find(m => m.id === id);
    if (mach) {
      if (mach.hourMeter !== undefined && mach.hourMeter !== null) {
        const h = Number(mach.hourMeter);
        setCurrentHourMeterOrKm(!isNaN(h) && h > 0 ? String(h) : '');
      } else if (mach.currentKm !== undefined && mach.currentKm !== null) {
        const k = Number(mach.currentKm);
        setCurrentHourMeterOrKm(!isNaN(k) && k > 0 ? String(k) : '');
      }
      if (mach.assignedDrivers && mach.assignedDrivers.length > 0) {
        setWorkshopOrMechanic(`Operador: ${mach.assignedDrivers.join(', ')}`);
      }
    }
  };

  // Atualização dinâmica do responsável pela execução
  const handleExecutorTypeChange = (newType: MaintenanceExecutorType) => {
    setExecutorType(newType);
    if (newType === 'equipe_propria') {
      const selectedMach = machineries.find(m => m.id === machineryId);
      if (selectedMach?.assignedDrivers?.length) {
        setWorkshopOrMechanic(`Equipe Própria (${selectedMach.assignedDrivers.join(', ')})`);
      } else {
        setWorkshopOrMechanic('Equipe Própria / Motorista');
      }
    } else if (newType === 'mecanico_interno') {
      setWorkshopOrMechanic('Mecânico Interno da Empresa');
    } else if (newType === 'mecanico_campo') {
      setWorkshopOrMechanic('Mecânico Terceiro em Campo (Socorro)');
    } else if (newType === 'mecanica_terceirizada') {
      setWorkshopOrMechanic('Oficina Especializada / Concessionária');
    }
  };

  // --- MÃO DE OBRA INTERNA: ADICIONAR, ATUALIZAR E REMOVER MECÂNICOS ---
  const handleAddLaborItem = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newItem: MaintenanceLaborItem = {
      id: `labor_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      employeeId: '',
      mechanicName: '',
      description: 'Mão de Obra / Manutenção',
      executorType: 'mecanico_interno',
      hours: 1,
      hourlyRate: 0,
      totalCost: 0,
      date: todayStr,
      dataLancamento: todayStr,
    };
    setLaborItems(prev => [...prev, newItem]);
  };

  const handleUpdateLaborItem = (index: number, updates: Partial<MaintenanceLaborItem>) => {
    setLaborItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], ...updates };

      if (updates.employeeId !== undefined) {
        const emp = allEmployeesList.find(e => e.id === updates.employeeId);
        if (emp) {
          item.mechanicName = emp.name;
          if (!item.hourlyRate || item.hourlyRate === 0) {
            if ((emp as any).hourlyRate) {
              item.hourlyRate = parseFloat(String((emp as any).hourlyRate)) || 0;
            } else if ((emp as any).dailyRate) {
              item.hourlyRate = Math.round(((parseFloat(String((emp as any).dailyRate)) || 0) / 8) * 100) / 100;
            } else if (emp.commissionPerHour && emp.commissionPerHour > 0) {
              item.hourlyRate = parseFloat(String(emp.commissionPerHour)) || 0;
            }
          }
        }
      }

      // Sincroniza date e dataLancamento se um deles for atualizado
      if (updates.date !== undefined && updates.dataLancamento === undefined) {
        item.dataLancamento = updates.date;
      } else if (updates.dataLancamento !== undefined && updates.date === undefined) {
        item.date = updates.dataLancamento;
      }

      const hours = typeof item.hours === 'number' ? item.hours : (parseFloat(String(item.hours || 0)) || 0);
      const rate = typeof item.hourlyRate === 'number' ? item.hourlyRate : (parseFloat(String(item.hourlyRate || 0)) || 0);
      item.totalCost = Math.round(hours * rate * 100) / 100;
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveLaborItem = (index: number) => {
    setLaborItems(prev => prev.filter((_, i) => i !== index));
  };

  // Adicionar item de peça à lista
  const handleAddPartItem = () => {
    const newItem: MaintenancePartItem = {
      id: `part_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      description: '',
      origin: 'almoxarifado_interno',
      quantity: 1,
      unit: 'un',
      unitCost: 0,
      totalCost: 0,
    };
    setPartsItems(prev => [...prev, newItem]);
  };

  const handleUpdatePartItem = (index: number, updates: Partial<MaintenancePartItem>) => {
    setPartsItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], ...updates };
      
      // Se mudou para recuperada externa: desvincula de qualquer item de estoque
      if (updates.origin === 'recuperada_externa') {
        item.inventoryItemId = undefined;
        if (!item.quantity) item.quantity = 1;
      }

      // Se selecionou do almoxarifado interno, puxa nome, unidade e custo padrão
      if (updates.inventoryItemId) {
        const stockItem = inventory?.find(i => i.id === updates.inventoryItemId);
        if (stockItem) {
          item.description = stockItem.name;
          item.unit = stockItem.unit;
          item.unitCost = stockItem.unitCost;
        }
      }

      // Se for recuperada externa e atualizou externalServiceCost
      if (item.origin === 'recuperada_externa') {
        if (updates.externalServiceCost !== undefined) {
          item.unitCost = updates.externalServiceCost;
        }
        const qty = item.quantity || 1;
        const cost = item.externalServiceCost !== undefined ? item.externalServiceCost : (item.unitCost || 0);
        item.totalCost = Math.round(qty * cost * 100) / 100;
      } else {
        const qty = item.quantity || 0;
        const cost = item.unitCost || 0;
        item.totalCost = Math.round(qty * cost * 100) / 100;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemovePartItem = (index: number) => {
    setPartsItems(prev => prev.filter((_, i) => i !== index));
  };

  // Cálculo total de peças
  const totalPartsCalculated = usePartsItemList
    ? partsItems.reduce((acc, curr) => acc + (curr.totalCost || 0), 0)
    : parseFloat(partsCostManual) || 0;

  const totalStockPartsCost = partsItems
    .filter(p => p.origin === 'almoxarifado_interno')
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  const totalExternalPartsCost = partsItems
    .filter(p => p.origin === 'externo_compra')
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  const totalRecoveredExternalCost = partsItems
    .filter(p => p.origin === 'recuperada_externa')
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  // Mão de Obra
  const totalInternalLaborCalculated = laborItems.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const totalInternalHoursCalculated = Math.round(laborItems.reduce((acc, curr) => acc + (parseFloat(String(curr.hours || 0)) || 0), 0) * 100) / 100;
  const additionalLabor = parseFloat(laborCost) || 0;
  const totalLaborCalculated = totalInternalLaborCalculated + additionalLabor;

  const grandTotal = totalPartsCalculated + totalLaborCalculated;

  // Itens por categoria
  const externalPartsCount = partsItems.filter(p => p.origin === 'externo_compra').length;
  const internalPartsCount = partsItems.filter(p => p.origin === 'almoxarifado_interno').length;
  const recoveredPartsCount = partsItems.filter(p => p.origin === 'recuperada_externa').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineryId || !description.trim()) {
      alert('Por favor, selecione o veículo e insira a descrição da Ordem de Serviço.');
      return;
    }

    const selectedMach = machineries.find(m => m.id === machineryId);
    const machName = selectedMach 
      ? (selectedMach.licensePlateOrSerial ? `[${selectedMach.licensePlateOrSerial}] ${selectedMach.name || selectedMach.model}` : selectedMach.name)
      : 'Veículo';

    // Determinar resumo de origem das peças
    let partsOriginSummary: MaintenanceLog['partsOriginSummary'] = 'sem_pecas';
    if (usePartsItemList && partsItems.length > 0) {
      if ((externalPartsCount > 0 || recoveredPartsCount > 0) && internalPartsCount > 0) {
        partsOriginSummary = 'misto';
      } else if (externalPartsCount > 0 || recoveredPartsCount > 0) {
        partsOriginSummary = 'externo';
      } else if (internalPartsCount > 0) {
        partsOriginSummary = 'almoxarifado';
      }
    } else if (totalPartsCalculated > 0) {
      partsOriginSummary = 'externo';
    }

    let finalMechanicName = workshopOrMechanic.trim();
    if ((!finalMechanicName || finalMechanicName === 'Mecânica Interna / Própria') && laborItems.length > 0) {
      finalMechanicName = laborItems.map(l => l.mechanicName).filter(Boolean).join(', ');
    }

    // Tratamento rigoroso numérico antes de persistir (previne NaN e string pura)
    const rawMeter = typeof currentHourMeterOrKm === 'number' 
      ? currentHourMeterOrKm 
      : parseInt(String(currentHourMeterOrKm).replace(/\D/g, ''), 10);
    const parsedCurrentHourMeter = !isNaN(rawMeter) && isFinite(rawMeter) ? Number(rawMeter) : 0;

    const rawNext = typeof nextServiceDue === 'number'
      ? nextServiceDue
      : parseInt(String(nextServiceDue).replace(/\D/g, ''), 10);
    const parsedNextServiceDue = !isNaN(rawNext) && isFinite(rawNext) && String(nextServiceDue).trim() !== ''
      ? Number(rawNext)
      : undefined;

    const log: MaintenanceLog = {
      id: editingLog ? editingLog.id : `maint_${Date.now()}`,
      osNumber: osNumber.trim() || `OS-${Date.now().toString().slice(-6)}`,
      date,
      completionDate: completionDate.trim() || undefined,
      machineryId,
      machineryPlateOrName: machName,
      type,
      serviceCategory: serviceCategory === 'Outro' && customCategory.trim() ? customCategory.trim() : serviceCategory,
      location,
      locationDetails: locationDetails.trim() || undefined,
      executorType,
      executorName: finalMechanicName || workshopOrMechanic.trim() || 'Mecânica Interna',
      workshopOrMechanic: finalMechanicName || workshopOrMechanic.trim() || 'Mecânica Interna',
      description: description.trim(),
      partsOriginSummary,
      partsItems: usePartsItemList ? partsItems : undefined,
      laborItems: laborItems.length > 0 ? laborItems : undefined,
      partsCost: totalPartsCalculated,
      laborCost: totalLaborCalculated,
      totalCost: grandTotal,
      currentHourMeterOrKm: parsedCurrentHourMeter,
      nextServiceDueHourMeterOrKm: parsedNextServiceDue,
      status,
      notes: notes.trim() || undefined,
      createdAt: editingLog ? editingLog.createdAt : new Date().toISOString(),
      nfeLink: hasNfe ? {
        nfeNumber: nfeNumber.trim() || undefined,
        nfeSeries: nfeSeries.trim() || undefined,
        nfeAccessKey: nfeAccessKey.trim() || undefined,
        issueDate: nfeIssueDate,
        supplierName: nfeSupplierName.trim() || financialSupplier.trim() || undefined,
        totalNfeAmount: parseFloat(nfeTotalAmount) || grandTotal,
      } : undefined,
      financialConditions: createExpense ? {
        createAccountsPayable: true,
        paymentTerm,
        paymentMethod,
        firstDueDate,
        supplierName: financialSupplier.trim() || finalMechanicName || workshopOrMechanic.trim(),
        notes: `OS ${osNumber} - ${machName}`,
      } : undefined,
    };

    onSave(log, {
      createExpense: createExpense && (status === 'concluida' || status === 'em_andamento') && (totalPartsCalculated > 0 || totalLaborCalculated > 0),
      deductStock: deductStock && internalPartsCount > 0,
      createPurchaseRequest: generatePurchaseRequest || (status === 'aguardando_pecas' && externalPartsCount > 0),
    });

    // Feedback visual temporário de salvamento sem fechar a janela automaticamente
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3500);

    // NOTA: onClose() foi removido daqui para não fechar a modal automaticamente ao salvar.
    // O fechamento definitivo é executado exclusivamente através do botão "Sair / Fechar" ou botão de fechar (X).
  };

  // Mapeamento dinâmico de cores vibrantes e alto contraste para o Status da Ordem
  const getStatusSelectStyle = (currentStatus: string) => {
    switch (currentStatus) {
      case 'aguardando_pecas':
        return 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-500 ring-1 ring-purple-400/40 shadow-xs font-bold';
      case 'em_andamento':
        return 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-500 ring-1 ring-amber-400/40 shadow-xs font-bold';
      case 'concluida':
        return 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-500 ring-1 ring-emerald-400/40 shadow-xs font-bold';
      case 'agendada':
        return 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-500 font-bold shadow-xs';
      case 'cancelada':
        return 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-500 font-bold shadow-xs';
      default:
        return 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700 font-bold';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-1 sm:p-3 overflow-y-auto">
      <div 
        className="bg-white dark:bg-stone-900 rounded-2xl border border-blue-200 dark:border-stone-800 w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Superior em Azul Escuro */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-blue-900/60 dark:border-stone-800 bg-blue-800 dark:bg-stone-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-blue-950/60 text-white flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit']">
                  {editingLog ? `Editar OS: ${editingLog.osNumber || editingLog.id}` : 'Nova Ordem de Serviço (OS)'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/40 text-blue-50 border border-blue-400/40">
                  {osNumber}
                </span>
              </div>
              <p className="text-[11px] text-blue-100/90 dark:text-stone-400">
                Manutenção na Roça, Estrada ou Oficina • Baixa de Estoque • NF-e • Contas a Pagar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white dark:text-stone-400 dark:hover:text-stone-200 rounded-lg hover:bg-blue-700/60 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtabs de Navegação do Formulário (3 Abas Unificadas) */}
        <div className="flex items-center border-b border-blue-200 dark:border-stone-800 px-5 bg-blue-50/70 dark:bg-stone-900 overflow-x-auto gap-2 shrink-0">
          <button
            type="button"
            id="tab-diagnostico-equipe-local"
            onClick={() => setActiveTab('geral')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'geral'
                ? 'border-blue-700 text-blue-800 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-blue-950/70 hover:text-blue-950 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>1. Diagnóstico, Equipe & Local</span>
            {laborItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300 font-bold">
                {laborItems.length} {laborItems.length === 1 ? 'mecânico' : 'mecânicos'}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-pecas-estoque"
            onClick={() => setActiveTab('pecas')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'pecas'
                ? 'border-blue-700 text-blue-800 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-blue-950/70 hover:text-blue-950 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>2. Peças & Estoque</span>
            {partsItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300 font-bold">
                {partsItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-nfe-financeiro"
            onClick={() => setActiveTab('fiscal_financeiro')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'fiscal_financeiro'
                ? 'border-blue-700 text-blue-800 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-blue-950/70 hover:text-blue-950 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. NF-e & Financeiro</span>
            {(hasNfe || createExpense) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 bg-[#0a8bc1]">
          
          {/* ======================================================== */}
          {/* ABA 1 UNIFICADA: DIAGNÓSTICO, EQUIPE & LOCAL (2 COLUNAS) */}
          {/* ======================================================== */}
          {activeTab === 'geral' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3.5 animate-in fade-in duration-150 items-start">
              
              {/* --- COLUNA DA ESQUERDA: DADOS DO VEÍCULO, AFERIÇÃO, DIAGNÓSTICO, LOCAL E EXECUÇÃO --- */}
              <div className="space-y-2">
                {/* Bloco 1: Identificação da OS e Veículo */}
                <div className="p-2.5 bg-blue-50/70 dark:bg-stone-800/40 rounded-xl border border-blue-200 dark:border-stone-800">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {/* Número da OS */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5 truncate">
                        Número da OS
                      </label>
                      <input
                        type="text"
                        value={osNumber}
                        onChange={(e) => setOsNumber(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-mono font-bold text-blue-950 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        placeholder="OS-2026-0001"
                        required
                      />
                    </div>

                    {/* Data da Abertura */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5 truncate">
                        Abertura *
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>

                    {/* Previsão de Término */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5 truncate">
                        Previsão Término
                      </label>
                      <input
                        type="date"
                        value={completionDate}
                        onChange={(e) => setCompletionDate(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>

                    {/* Veículo / Máquina */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5 truncate">
                        Máquina *
                      </label>
                      <select
                        value={machineryId}
                        onChange={(e) => handleMachineryChange(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
                        required
                      >
                        <option value="">Selecione...</option>
                        {machineries.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.licensePlateOrSerial ? `[${m.licensePlateOrSerial}] ` : ''}
                            {m.name || m.model} ({m.categoryType || 'Equipamento'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bloco 2: Aferição e Controle (Horímetro, Próxima Revisão e Status) - REPOSICIONADO */}
                <div className="p-2.5 bg-blue-50/70 dark:bg-stone-800/40 rounded-xl border border-blue-200 dark:border-stone-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5 truncate">
                        Horímetro / KM Atual
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatThousand(currentHourMeterOrKm)}
                        onChange={(e) => handleThousandInput(e.target.value, setCurrentHourMeterOrKm)}
                        placeholder="Ex: 5.000"
                        className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5 truncate">
                        Próxima Revisão (h/KM)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatThousand(nextServiceDue)}
                        onChange={(e) => handleThousandInput(e.target.value, setNextServiceDue)}
                        placeholder="Ex: 6.000"
                        className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5 truncate">
                        Status da Ordem
                      </label>
                      <select
                        id="maintenance-status-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className={`w-full px-2 py-1 border rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-hidden ${getStatusSelectStyle(status)}`}
                      >
                        <option value="concluida" className="bg-white text-emerald-950 dark:bg-stone-900 dark:text-emerald-300 font-bold">✓ Concluída (Liberado)</option>
                        <option value="em_andamento" className="bg-white text-amber-950 dark:bg-stone-900 dark:text-amber-300 font-bold">⏳ Em Andamento</option>
                        <option value="aguardando_pecas" className="bg-white text-purple-950 dark:bg-stone-900 dark:text-purple-300 font-bold">📦 Aguardando Peças</option>
                        <option value="agendada" className="bg-white text-blue-950 dark:bg-stone-900 dark:text-blue-300 font-bold">📅 Agendada</option>
                        <option value="cancelada" className="bg-white text-rose-950 dark:bg-stone-900 dark:text-rose-300 font-bold">✕ Cancelada</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bloco 3: Tipo de Manutenção e Categoria */}
                <div className="p-2.5 bg-blue-50/70 dark:bg-stone-800/40 rounded-xl border border-blue-200 dark:border-stone-800 space-y-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5">
                        Tipo de Manutenção
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: 'preventiva', label: 'Preventiva' },
                          { id: 'corretiva', label: 'Corretiva' },
                          { id: 'preditiva', label: 'Preditiva' },
                          { id: 'reforma_entressafra', label: 'Entressafra' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setType(t.id as any)}
                            className={`py-1 px-1.5 text-[10.5px] font-bold rounded-lg border text-center transition cursor-pointer ${
                              type === t.id || (t.id === 'reforma_entressafra' && (type as any) === 'revisao_periodica')
                                ? 'ring-2 ring-blue-600 bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-stone-800 border-blue-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-blue-100/50'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300">
                          Categoria do Serviço
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCategoriesModalOpen(true)}
                          className="text-[10px] text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                          title="Gerenciar, incluir, editar ou excluir categorias de serviço"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>Gerenciar</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <select
                          value={serviceCategory}
                          onChange={(e) => setServiceCategory(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                        >
                          {categoriesList.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                          {!categoriesList.some(c => c.name === serviceCategory) && serviceCategory && serviceCategory !== 'Outro' && (
                            <option value={serviceCategory}>{serviceCategory}</option>
                          )}
                          <option value="Outro">Outro (Personalizado)</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setIsCategoriesModalOpen(true)}
                          className="p-1 border border-blue-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-blue-100/60 dark:hover:bg-stone-800 rounded-lg text-blue-700 dark:text-blue-400 transition cursor-pointer shrink-0"
                          title="Incluir, editar ou excluir categorias"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {serviceCategory === 'Outro' && (
                    <div>
                      <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5">
                        Especifique a Categoria
                      </label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Ex: Regulagem de Rotor de Craqueador"
                        className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  )}
                </div>

                {/* Bloco 4: Descrição do Problema / Diagnóstico */}
                <div className="p-2.5 bg-blue-50/70 dark:bg-stone-800/40 rounded-xl border border-blue-200 dark:border-stone-800">
                  <label className="block text-[10.5px] font-bold text-blue-900 dark:text-stone-300 mb-0.5">
                    Descrição do Diagnóstico / Serviço Executado *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Troca de óleo da caixa de transmissão e substituição de 4 facas do rotor da ensiladeira que empenaram no talhão 3..."
                    rows={2}
                    className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 resize-none"
                    required
                  />
                </div>

                {/* Bloco 5: Local da Manutenção */}
                <div className="p-2.5 bg-blue-50/70 dark:bg-stone-800/50 rounded-xl border border-blue-200 dark:border-stone-800 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                    <h4 className="text-[10.5px] font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                      Local da Manutenção
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      {
                        id: 'roca',
                        title: 'Roça (Campo)',
                        subtitle: 'Lavoura/Silagem',
                        color: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
                      },
                      {
                        id: 'estrada',
                        title: 'Estrada',
                        subtitle: 'Socorro Vicinal',
                        color: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
                      },
                      {
                        id: 'oficina_interna',
                        title: 'Oficina Interna',
                        subtitle: 'Nosso Barracão',
                        color: 'border-blue-500 bg-blue-100/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300',
                      },
                      {
                        id: 'oficina_externa',
                        title: 'Oficina Externa',
                        subtitle: 'Concessionária/3º',
                        color: 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300',
                      },
                    ].map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => setLocation(loc.id as any)}
                        className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                          location === loc.id
                            ? `${loc.color} ring-2 ring-blue-600 font-bold shadow-xs`
                            : 'bg-white dark:bg-stone-800 border-blue-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-blue-100/40'
                        }`}
                      >
                        <span className="text-xs font-bold block truncate">{loc.title}</span>
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 block truncate">{loc.subtitle}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={locationDetails}
                      onChange={(e) => setLocationDetails(e.target.value)}
                      placeholder={
                        location === 'roca' 
                          ? 'Ponto de referência: Ex: Fazenda Santa Maria - Talhão 08'
                          : location === 'estrada'
                          ? 'Ponto de referência: Ex: BR-163 KM 210 sentido Toledo'
                          : location === 'oficina_interna'
                          ? 'Ponto de referência: Ex: Box 2 do Barracão Principal'
                          : 'Ponto de referência: Ex: Oficina Diesel Power - Toledo/PR'
                      }
                      className="w-full px-2.5 py-1 h-8 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Bloco 6: Modalidade de Execução do Serviço */}
                <div className="p-2.5 bg-blue-50/70 dark:bg-stone-800/50 rounded-xl border border-blue-200 dark:border-stone-800 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <UserCheck className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                    <h4 className="text-[10.5px] font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                      Modalidade de Execução
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'equipe_propria', label: 'Equipe Própria', desc: 'Operador/Equipe' },
                      { id: 'mecanico_interno', label: 'Mecânica Interna', desc: 'Mecânicos base' },
                      { id: 'mecanico_campo', label: 'Socorro Campo', desc: 'Terceiro roça' },
                      { id: 'mecanica_terceirizada', label: 'Oficina Externa', desc: 'Concessionária' },
                    ].map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleExecutorTypeChange(ex.id as any)}
                        className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                          executorType === ex.id
                            ? 'border-blue-600 bg-blue-100 text-blue-950 dark:bg-blue-950/60 dark:text-blue-200 ring-2 ring-blue-600 font-bold shadow-xs'
                            : 'bg-white dark:bg-stone-800 border-blue-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-blue-100/40'
                        }`}
                      >
                        <span className="text-xs font-bold block truncate">{ex.label}</span>
                        <span className="text-[9px] text-stone-500 block truncate">{ex.desc}</span>
                      </button>
                    ))}
                  </div>

                  {(executorType === 'mecanico_campo' || executorType === 'mecanica_terceirizada') && (
                    <div>
                      <input
                        type="text"
                        value={workshopOrMechanic}
                        onChange={(e) => setWorkshopOrMechanic(e.target.value)}
                        placeholder="Nome da Oficina Externa ou Prestador Socorro Terceiro *"
                        className="w-full px-2.5 py-1 h-8 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* --- COLUNA DA DIREITA: EXCLUSIVAMENTE MÃO DE OBRA INTERNA (MECÂNICOS) --- */}
              <div className="space-y-2">
                {/* Bloco 1: MÃO DE OBRA INTERNA (MECÂNICOS) NO TOPO DIREITO */}
                <div className="p-2.5 bg-blue-50/70 dark:bg-stone-800/50 rounded-xl border border-blue-200 dark:border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                      <h4 className="text-[10.5px] font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                        Mão de Obra Interna (Mecânicos)
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLaborItem}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold rounded-lg shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Mecânico</span>
                    </button>
                  </div>

                  {/* Lista dinâmica com amplo espaço vertical */}
                  {laborItems.length === 0 ? (
                    <div className="py-3 px-2.5 text-center border border-dashed border-blue-200 dark:border-stone-800 bg-white dark:bg-stone-800/30 rounded-lg flex flex-col items-center justify-center space-y-1">
                      <Users className="w-4 h-4 text-blue-400" />
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Nenhum mecânico listado nesta OS.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddLaborItem}
                        className="px-2.5 py-0.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                      >
                        + Adicionar Mão de Obra
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                      {laborItems.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="p-2 bg-white dark:bg-stone-800 rounded-xl border border-blue-200 dark:border-stone-700 space-y-1 shadow-xs"
                        >
                          {/* Cabeçalho do Card do Mecânico */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-900 dark:text-stone-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                              <span className="w-4 h-4 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-[9px] font-bold">
                                {index + 1}
                              </span>
                              <span>Mecânico #{index + 1}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveLaborItem(index)}
                              className="p-0.5 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-stone-700 transition cursor-pointer"
                              title="Remover mecânico"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Grid com Seleção de Funcionário, Data, Horas, Valor/h e Subtotal */}
                          <div className="grid grid-cols-12 gap-1.5 items-end">
                            {/* Selecionar Funcionário */}
                            <div className="col-span-12 sm:col-span-4">
                              <label className="block text-[9.5px] font-bold text-stone-500 dark:text-stone-400 mb-0.5">
                                Funcionário / Mecânico
                              </label>
                              <select
                                value={item.employeeId || ''}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  const found = allEmployeesList.find(emp => emp.id === selectedId);
                                  handleUpdateLaborItem(index, { 
                                    employeeId: selectedId,
                                    mechanicName: found ? found.name : (selectedId ? item.mechanicName : '')
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                              >
                                <option value="">Selecione funcionário...</option>
                                {mechanicEmployees.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.name} {emp.role ? `(${emp.role})` : ''}
                                  </option>
                                ))}
                                {item.employeeId && !mechanicEmployees.some(e => e.id === item.employeeId) && (
                                  <option value={item.employeeId}>
                                    {allEmployeesList.find(e => e.id === item.employeeId)?.name || item.mechanicName || 'Funcionário selecionado'}
                                  </option>
                                )}
                              </select>
                              {(!item.employeeId || !allEmployeesList.some(e => e.id === item.employeeId)) && (
                                <input
                                  type="text"
                                  value={item.mechanicName || ''}
                                  onChange={(e) => handleUpdateLaborItem(index, { mechanicName: e.target.value })}
                                  placeholder="Ou nome avulso..."
                                  className="w-full mt-0.5 px-2 py-0.5 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-md text-[10px] text-stone-900 dark:text-stone-100"
                                />
                              )}
                            </div>

                            {/* Data do Lançamento */}
                            <div className="col-span-6 sm:col-span-2">
                              <label className="block text-[9.5px] font-bold text-stone-500 dark:text-stone-400 mb-0.5 text-center">
                                Data
                              </label>
                              <input
                                type="date"
                                value={item.dataLancamento || item.date || new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleUpdateLaborItem(index, { 
                                  dataLancamento: e.target.value,
                                  date: e.target.value 
                                })}
                                title="Data da execução das horas"
                                className="w-full px-1.5 py-1 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-center text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                              />
                            </div>

                            {/* Horas (Aceita Fracionado/Decimal) */}
                            <div className="col-span-3 sm:col-span-2">
                              <label className="block text-[9.5px] font-bold text-stone-500 dark:text-stone-400 mb-0.5 text-center">
                                Horas
                              </label>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={item.hours !== undefined && item.hours !== null ? item.hours : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateLaborItem(index, { hours: val === '' ? 0 : (parseFloat(val) || 0) });
                                }}
                                placeholder="Horas"
                                title="Horas Trabalhadas (aceita decimais ex: 15.3)"
                                className="w-full px-1.5 py-1 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-bold text-center text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                              />
                            </div>

                            {/* Valor da Hora */}
                            <div className="col-span-3 sm:col-span-2">
                              <label className="block text-[9.5px] font-bold text-stone-500 dark:text-stone-400 mb-0.5 text-right">
                                R$ / hora
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.hourlyRate !== undefined && item.hourlyRate !== null ? item.hourlyRate : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateLaborItem(index, { hourlyRate: val === '' ? 0 : (parseFloat(val) || 0) });
                                }}
                                placeholder="R$/h"
                                title="Valor da Hora (R$)"
                                className="w-full px-1.5 py-1 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-bold text-right text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                              />
                            </div>

                            {/* Subtotal */}
                            <div className="col-span-12 sm:col-span-2">
                              <label className="block text-[9.5px] font-bold text-stone-500 dark:text-stone-400 mb-0.5 text-right">
                                Subtotal
                              </label>
                              <div className="px-2 py-1 bg-blue-100/70 dark:bg-blue-950/60 rounded-lg text-xs font-black text-blue-900 dark:text-blue-300 font-mono text-right truncate">
                                {formatCurrencyBRL(item.totalCost || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card de Consolidação da Mão de Obra */}
                  <div className="p-2.5 bg-blue-100/80 dark:bg-blue-950/40 rounded-xl border border-blue-300 dark:border-blue-900/60 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block leading-tight">
                          Total Mão de Obra
                        </span>
                        <span className="text-[10.5px] text-blue-800 dark:text-blue-300 leading-tight">
                          {laborItems.length} mecânico(s) • {totalInternalHoursCalculated}h
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm sm:text-base font-black text-blue-950 dark:text-blue-100 font-['Outfit']">
                        {formatCurrencyBRL(totalInternalLaborCalculated)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: PEÇAS & ESTOQUE (MULTI-ORIGEM) */}
          {/* ======================================================== */}
          {activeTab === 'pecas' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider flex items-center space-x-2">
                    <span>Peças, Insumos & Serviços de Recuperação</span>
                  </h4>
                  <p className="text-xs text-stone-500">
                    Registre peças do estoque interno, compras novas ou peças enviadas para recuperação externa (torno, retífica, solda).
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddPartItem}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Peça / Serviço</span>
                  </button>
                </div>
              </div>

              {/* Tabela / Lista de Peças */}
              {partsItems.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-blue-200 dark:border-stone-800 bg-blue-50/40 dark:bg-stone-800/20 rounded-2xl space-y-3">
                  <Package className="w-8 h-8 mx-auto text-blue-400" />
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                    Nenhuma peça ou serviço externo adicionado nesta OS.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddPartItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                    >
                      + Adicionar Peça / Insumo / Recuperação
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {partsItems.map((item, index) => (
                    <div 
                      key={item.id || index}
                      className={`p-3.5 rounded-2xl border space-y-3 shadow-xs transition ${
                        item.origin === 'recuperada_externa'
                          ? 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50'
                          : item.origin === 'externo_compra'
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                          : 'bg-blue-50/70 dark:bg-stone-800/40 border-blue-200 dark:border-stone-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-blue-900 dark:text-stone-300 uppercase tracking-wider font-mono">
                            Item #{index + 1}
                          </span>
                          {item.origin === 'recuperada_externa' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              Serviço Terceiro / Recuperação
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Seletor de Origem com as 3 opções */}
                          <div className="flex items-center bg-white dark:bg-stone-800 rounded-xl p-0.5 border border-blue-200 dark:border-stone-700 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdatePartItem(index, { origin: 'almoxarifado_interno' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                                item.origin === 'almoxarifado_interno'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                              }`}
                            >
                              <span>📦 Almoxarifado</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePartItem(index, { origin: 'externo_compra' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                                item.origin === 'externo_compra'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                              }`}
                            >
                              <span>🛒 Compra Nova</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePartItem(index, { origin: 'recuperada_externa' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                                item.origin === 'recuperada_externa'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                              }`}
                            >
                              <span>🔧 Recuperada / Torno</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePartItem(index)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-stone-700 transition cursor-pointer"
                            title="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* 1. SE FOR ALMOXARIFADO INTERNO */}
                        {item.origin === 'almoxarifado_interno' && (
                          <>
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                                Item do Estoque (Almoxarifado)
                              </label>
                              <select
                                value={item.inventoryItemId || ''}
                                onChange={(e) => handleUpdatePartItem(index, { inventoryItemId: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                              >
                                <option value="">Selecione do estoque ou digite a descrição ao lado...</option>
                                {inventory.map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.name} (Saldo: {inv.quantity} {inv.unit} | {formatCurrencyBRL(inv.unitCost)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                                Descrição da Peça / Código
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdatePartItem(index, { description: e.target.value })}
                                placeholder="Ex: Filtro de Combustível S10 / Faca 4230..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                                required
                              />
                            </div>
                          </>
                        )}

                        {/* 2. SE FOR COMPRA NOVA EXTERNA */}
                        {item.origin === 'externo_compra' && (
                          <>
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                                Fornecedor / Loja de Peças
                              </label>
                              <div className="flex gap-1.5">
                                <select
                                  value={item.supplierName || ''}
                                  onChange={(e) => handleUpdatePartItem(index, { supplierName: e.target.value })}
                                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                                >
                                  <option value="">Selecione o Fornecedor...</option>
                                  {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.name}>{sup.name} ({sup.category})</option>
                                  ))}
                                  <option value="Loja de Peças da Cidade">Loja de Peças Local</option>
                                  <option value="Concessionária Autorizada">Concessionária Autorizada</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Ou digite..."
                                  value={item.supplierName || ''}
                                  onChange={(e) => handleUpdatePartItem(index, { supplierName: e.target.value })}
                                  className="w-28 px-2 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                                Descrição da Peça Comprada / Código
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdatePartItem(index, { description: e.target.value })}
                                placeholder="Ex: Rolamento Cônico 30210, Correia Dentada..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                                required
                              />
                            </div>
                          </>
                        )}

                        {/* 3. SE FOR RECUPERADA / SERVIÇO EXTERNO (TORNO, RETÍFICA, SOLDA) */}
                        {item.origin === 'recuperada_externa' && (
                          <>
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 mb-0.5 flex items-center space-x-1">
                                <Hammer className="w-3 h-3 text-purple-600" />
                                <span>Prestador / Torno / Retífica Terceira *</span>
                              </label>
                              <input
                                type="text"
                                value={item.serviceProvider || item.supplierName || ''}
                                onChange={(e) => handleUpdatePartItem(index, { 
                                  serviceProvider: e.target.value,
                                  supplierName: e.target.value
                                })}
                                placeholder="Ex: Torneadora Central, Retífica União, Soldas Especiais..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-purple-600"
                                required
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 mb-0.5">
                                Peça / Componente em Recuperação *
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdatePartItem(index, { description: e.target.value })}
                                placeholder="Ex: Cilindro Hidráulico de Elevação, Eixo Traseiro, Cardan..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-purple-600"
                                required
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 mb-0.5">
                                Descrição do Serviço Executado
                              </label>
                              <input
                                type="text"
                                value={item.serviceDescription || ''}
                                onChange={(e) => handleUpdatePartItem(index, { serviceDescription: e.target.value })}
                                placeholder="Ex: Enchimento e usinagem de colo de eixo, embuchamento em bronze..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-purple-600"
                              />
                            </div>
                          </>
                        )}

                        {/* Qtd, Unidade, Preço Unitário, Total */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                            Qtd
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => handleUpdatePartItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                            Unidade
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdatePartItem(index, { unit: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="un">un (Unidade / Serviço)</option>
                            <option value="serv">serv (Serviço)</option>
                            <option value="L">L (Litros)</option>
                            <option value="kg">kg (Quilos)</option>
                            <option value="cx">cx (Caixa)</option>
                            <option value="par">par (Par)</option>
                            <option value="kit">kit (Kit)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                            {item.origin === 'recuperada_externa' ? 'Custo do Serviço (R$)' : 'Valor Unitário (R$)'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost || ''}
                            onChange={(e) => handleUpdatePartItem(index, { unitCost: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                            className={`w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 ${
                              item.origin === 'recuperada_externa'
                                ? 'border-purple-300 dark:border-purple-800 focus:ring-purple-600 font-bold'
                                : 'border-blue-200 dark:border-stone-700 focus:ring-blue-600'
                            }`}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                            Subtotal
                          </label>
                          <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center justify-between ${
                            item.origin === 'recuperada_externa'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300'
                              : 'bg-blue-100/60 dark:bg-stone-800/80 text-blue-900 dark:text-blue-400'
                          }`}>
                            <span>{formatCurrencyBRL(item.totalCost || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bloco de Mão de Obra e Consolidação Financeira Geral */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Mão de Obra Avulsa / Terceira Adicional (R$)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-stone-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {laborItems.length > 0 
                        ? `Aba 1 já possui R$ ${totalInternalLaborCalculated.toFixed(2)} de mão de obra interna consolidada (${laborItems.length} mecânico(s)). Preencha aqui apenas se houver custo avulso extra.`
                        : 'Deixe R$ 0,00 se a mão de obra foi detalhada na Aba 1 ou sem custo extra.'}
                    </p>
                  </div>

                  {/* Resumo Consolidado de Custos da OS */}
                  <div className="bg-white dark:bg-stone-800 p-3.5 rounded-xl border border-blue-200 dark:border-stone-700 space-y-1.5 shadow-2xs">
                    <div className="text-xs font-bold text-blue-950 dark:text-stone-300 flex items-center justify-between">
                      <span>Custo Total Consolidado da OS:</span>
                      <span className="text-lg font-black text-blue-700 dark:text-blue-400 font-['Outfit']">
                        {formatCurrencyBRL(grandTotal)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-blue-100 dark:border-stone-700/60 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-stone-500 block">Peças Novas / Estoque:</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                          {formatCurrencyBRL(
                            partsItems
                              .filter(p => p.origin !== 'recuperada_externa')
                              .reduce((acc, p) => acc + (p.totalCost || 0), 0)
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-purple-700 dark:text-purple-400 font-medium block">Recuperação / Torno:</span>
                        <span className="font-bold text-purple-900 dark:text-purple-300 font-mono">
                          {formatCurrencyBRL(
                            partsItems
                              .filter(p => p.origin === 'recuperada_externa')
                              .reduce((acc, p) => acc + (p.totalCost || 0), 0)
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-800 dark:text-blue-400 font-medium block">M. Obra Interna (Aba 1):</span>
                        <span className="font-bold text-blue-950 dark:text-blue-200 font-mono">
                          {formatCurrencyBRL(totalInternalLaborCalculated)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">M. Obra Extra / Avulsa:</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                          {formatCurrencyBRL(parseFloat(laborCost) || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox de Baixa no Estoque (Apenas para peças internas do almoxarifado) */}
              {internalPartsCount > 0 && (
                <div className="flex items-center space-x-3 p-3.5 bg-blue-100/70 dark:bg-blue-950/30 rounded-xl border border-blue-300 dark:border-blue-900/50">
                  <input
                    type="checkbox"
                    id="deductStock"
                    checked={deductStock}
                    onChange={(e) => setDeductStock(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="deductStock" className="text-xs font-bold text-blue-900 dark:text-blue-200 cursor-pointer">
                    Dar baixa automática nas {internalPartsCount} peça(s) no Almoxarifado Interno ao salvar esta OS. (Itens terceiros/recuperados não afetam o saldo).
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: FISCAL (NF-E), COMPRAS & FINANCEIRO (CONTAS A PAGAR) */}
          {/* ======================================================== */}
          {activeTab === 'fiscal_financeiro' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* FLUXO B: VÍNCULO DE NF-E */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                      Integração Fiscal: Vincular Nota Fiscal (NF-e)
                    </h4>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasNfe}
                      onChange={(e) => setHasNfe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-900 dark:text-stone-300">
                      Possui NF-e Vinculada
                    </span>
                  </label>
                </div>

                {hasNfe && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Número da NF-e
                      </label>
                      <input
                        type="text"
                        value={nfeNumber}
                        onChange={(e) => setNfeNumber(e.target.value)}
                        placeholder="Ex: 000.045.892"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Série
                      </label>
                      <input
                        type="text"
                        value={nfeSeries}
                        onChange={(e) => setNfeSeries(e.target.value)}
                        placeholder="Ex: 1"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Data de Emissão da Nota
                      </label>
                      <input
                        type="date"
                        value={nfeIssueDate}
                        onChange={(e) => setNfeIssueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Chave de Acesso (44 dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={44}
                        value={nfeAccessKey}
                        onChange={(e) => setNfeAccessKey(e.target.value)}
                        placeholder="41260800000000000000550010000458921000458920"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Fornecedor / Razão Social
                      </label>
                      <input
                        type="text"
                        value={nfeSupplierName}
                        onChange={(e) => setNfeSupplierName(e.target.value)}
                        placeholder="Ex: TratorPeças do Iguaçu Ltda"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* INTEGRAÇÃO FINANCEIRA: CONTAS A PAGAR */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                      Integração Financeira: Gerar Lançamento no Contas a Pagar
                    </h4>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createExpense}
                      onChange={(e) => setCreateExpense(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-900 dark:text-stone-300">
                      Lançar no Financeiro
                    </span>
                  </label>
                </div>

                {createExpense && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {/* Condição de Pagamento */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Condição / Prazo de Pagamento
                      </label>
                      <select
                        value={paymentTerm}
                        onChange={(e) => setPaymentTerm(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="a_vista">À Vista (Hoje)</option>
                        <option value="15_dias">15 Dias</option>
                        <option value="30_dias">30 Dias (Boleto/Faturado)</option>
                        <option value="30_60_dias">30 / 60 Dias (2x Parcelas)</option>
                        <option value="30_60_90_dias">30 / 60 / 90 Dias (3x Parcelas)</option>
                        <option value="safra_prazo">Safra a Prazo (Fim da Colheita)</option>
                        <option value="personalizado">Personalizado</option>
                      </select>
                    </div>

                    {/* Forma de Pagamento */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="boleto">Boleto Bancário</option>
                        <option value="pix">PIX / Transferência</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="dinheiro">Dinheiro em Espécie</option>
                        <option value="safra_prazo">Cheque / Safra</option>
                      </select>
                    </div>

                    {/* Data do 1º Vencimento */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        1º Vencimento
                      </label>
                      <input
                        type="date"
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    {/* Fornecedor para o Financeiro */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Credor / Fornecedor do Pagamento
                      </label>
                      <input
                        type="text"
                        value={financialSupplier || workshopOrMechanic}
                        onChange={(e) => setFinancialSupplier(e.target.value)}
                        placeholder="Nome da Oficina ou Fornecedor de Peças"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* FLUXO A: SOLICITAÇÃO DE COMPRA / COTAÇÃO */}
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                        Fluxo de Compras: Gerar Solicitação de Cotação
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Gera pedido no setor de compras para cotar e encomendar as peças externas.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={generatePurchaseRequest}
                    onChange={(e) => setGeneratePurchaseRequest(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                </div>

                {generatePurchaseRequest && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                      Nível de Urgência da Cotação / Compra
                    </label>
                    <select
                      value={purchaseUrgency}
                      onChange={(e) => setPurchaseUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer"
                    >
                      <option value="urgente_veiculo_parado">🚨 Urgente - Veículo Parado na Roça/Estrada</option>
                      <option value="alta">⚡ Alta - Necessário para a Frente de Colheita</option>
                      <option value="media">⚖ Média - Preventiva Programada</option>
                      <option value="baixa">☕ Baixa - Reposição de Almoxarifado</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Observações Internas */}
              <div>
                <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                  Observações Gerais / Histórico
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Peça substituída com garantia de 90 dias da concessionária..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-blue-200 dark:border-stone-800 shrink-0">
            <div className="flex items-center space-x-2 text-xs text-blue-900 dark:text-stone-400">
              <span className="font-bold">Total da OS:</span>
              <span className="text-base font-black text-blue-950 dark:text-stone-100 font-['Outfit']">
                {formatCurrencyBRL(grandTotal)}
              </span>
              {saveSuccess && (
                <span className="ml-3 inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold animate-in fade-in duration-150">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>OS Salva com Sucesso!</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              <button
                type="button"
                id="btn-cancelar-os"
                onClick={onClose}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-blue-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-blue-100/50 dark:hover:bg-stone-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-sair-fechar-os"
                onClick={onClose}
                className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl border border-blue-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-blue-950 dark:text-stone-200 hover:bg-blue-50 dark:hover:bg-stone-700 text-xs font-bold transition cursor-pointer shadow-xs"
                title="Fechar formulário de Ordem de Serviço"
              >
                <X className="w-3.5 h-3.5 text-blue-800 dark:text-stone-400" />
                <span>Sair / Fechar</span>
              </button>
              <button
                type="submit"
                id="btn-salvar-os"
                className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer ${
                  saveSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white animate-pulse" />
                    <span>Salva com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Ordem de Serviço</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Gerenciamento de Categorias de Serviço */}
      <MaintenanceCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categoriesList}
        onSaveCategories={handleSaveCategories}
        onSelectCategory={(catName) => {
          setServiceCategory(catName);
        }}
      />
    </div>
  );
};
