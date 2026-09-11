import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Car, 
  Save, 
  Plus, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  Fuel, 
  Wrench, 
  UserCheck, 
  Users, 
  Layers, 
  Info,
  DollarSign,
  Tag,
  Check,
  FileText,
  Receipt,
  Truck,
  Building,
  CreditCard,
  Link2,
  Paperclip,
  CheckCircle2,
  Calendar,
  Weight
} from 'lucide-react';
import { Machinery, Employee, FuelLog, MaintenanceLog, Expense, ServiceOrder, SilageOrder } from '../../types';
import { 
  formatCurrencyBRL, 
  formatDateBR, 
  getStoredVehicleSystemCategories, 
  saveStoredVehicleSystemCategories,
  getStoredVehicleOwnershipRegimes,
  saveStoredVehicleOwnershipRegimes
} from '../../lib/storage';
import { calculateVehicleConsumptionMetrics } from '../../lib/fleetMetrics';
import { VehicleCategoriesModal } from './VehicleCategoriesModal';
import { VehicleOwnershipModal } from './VehicleOwnershipModal';
import { VehicleHistoryDreTab } from './VehicleHistoryDreTab';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Machinery) => void;
  editingVehicle: Machinery | null;
  employees: Employee[];
  fuelLogs?: FuelLog[];
  maintenanceLogs?: MaintenanceLog[];
  machineries?: Machinery[];
  expenses?: Expense[];
  services?: ServiceOrder[];
  orders?: SilageOrder[];
  onAddExpense?: (expense: any) => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingVehicle,
  employees,
  fuelLogs = [],
  maintenanceLogs = [],
  machineries = [],
  expenses,
  services,
  orders,
  onAddExpense,
}) => {
  // Active Tab: 'dados' (Dados do Veículo) vs 'historico' (Histórico do Veículo)
  const [activeTab, setActiveTab] = useState<'dados' | 'historico'>('dados');

  // Form Fields - Basic Identification
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [renavam, setRenavam] = useState('');
  const [color, setColor] = useState('');
  const [categoryType, setCategoryType] = useState<string>('Forrageira / Ensiladeira');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [status, setStatus] = useState<Machinery['status']>('disponivel');
  const [ownership, setOwnership] = useState<string>('Próprio');
  const [regimesList, setRegimesList] = useState<string[]>([]);
  const [isRegimesModalOpen, setIsRegimesModalOpen] = useState(false);

  useEffect(() => {
    const loadedCats = getStoredVehicleSystemCategories();
    setCategoriesList(loadedCats);
    if (!editingVehicle && loadedCats.length > 0 && !categoryType) {
      setCategoryType(loadedCats[0]);
    }

    const loadedRegimes = getStoredVehicleOwnershipRegimes();
    setRegimesList(loadedRegimes);
    if (!editingVehicle && loadedRegimes.length > 0) {
      setOwnership(loadedRegimes[0]);
    }
  }, [isOpen]);

  const handleSaveCategories = (updated: string[]) => {
    setCategoriesList(updated);
    saveStoredVehicleSystemCategories(updated);
  };

  const handleSaveRegimes = (updated: string[]) => {
    setRegimesList(updated);
    saveStoredVehicleOwnershipRegimes(updated);
  };

  // Composition & Detailed Type
  const [compositionType, setCompositionType] = useState<Machinery['compositionType']>('veiculo_simples');
  const [coupledTrailerId, setCoupledTrailerId] = useState('');
  const [coupledTrailerName, setCoupledTrailerName] = useState('');
  const [customTrailerText, setCustomTrailerText] = useState('');
  const [vehicleTypeDetailed, setVehicleTypeDetailed] = useState('');

  // Weights & Capacity
  const [taraWeightKg, setTaraWeightKg] = useState('');
  const [capacityLoadKg, setCapacityLoadKg] = useState('');
  const [capacityM3, setCapacityM3] = useState('');
  const [fuelCapacityLiters, setFuelCapacityLiters] = useState('');
  const [hourMeter, setHourMeter] = useState('');
  const [currentKm, setCurrentKm] = useState('');

  // Serial Number (especially tractors/machines without renavam)
  const [serialNumber, setSerialNumber] = useState('');

  // Ownership Details ("No Nome de Quem")
  const [ownerName, setOwnerName] = useState('');
  const [ownerDocument, setOwnerDocument] = useState('');
  const [showSecondaryOwner, setShowSecondaryOwner] = useState(false);
  const [secondaryOwnerName, setSecondaryOwnerName] = useState('');
  const [secondaryOwnerDocument, setSecondaryOwnerDocument] = useState('');

  // Purchase & Financing
  const [purchaseValue, setPurchaseValue] = useState('');
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState('');
  const [purchaseInvoiceKey, setPurchaseInvoiceKey] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseAttachmentName, setPurchaseAttachmentName] = useState('');
  const [isFinanced, setIsFinanced] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [installmentValue, setInstallmentValue] = useState('');
  const [firstInstallmentDueDate, setFirstInstallmentDueDate] = useState('');
  const [financialInstitution, setFinancialInstitution] = useState('');
  const [generatePayables, setGeneratePayables] = useState(true);
  const [installmentsCreatedFeedback, setInstallmentsCreatedFeedback] = useState(false);

  // Multiple Assigned Drivers / Operators
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');

  // Revision & Notes
  const [revisionStatus, setRevisionStatus] = useState('');
  const [notes, setNotes] = useState('');

  // Candidate trailers from machineries (reboques, carretas, implementos)
  const candidateTrailers = useMemo(() => {
    return machineries.filter(m => 
      m.id !== editingVehicle?.id && 
      (m.compositionType === 'reboque' || m.categoryType === 'reboque' || m.categoryType === 'outro')
    );
  }, [machineries, editingVehicle]);

  // Calculate real-time consumption metrics from fuel logs
  const consumptionMetrics = useMemo(() => {
    if (!editingVehicle) {
      return {
        totalLiters: 0,
        totalFuelCost: 0,
        fuelLogsCount: 0,
        avgKmPerLiter: null,
        avgLitersPerHour: null,
      };
    }
    return calculateVehicleConsumptionMetrics(editingVehicle.id, fuelLogs);
  }, [editingVehicle, fuelLogs]);

  // Vehicle specific fuel logs
  const vehicleFuelLogs = useMemo(() => {
    if (!editingVehicle) return [];
    return fuelLogs
      .filter((f) => f.machineryId === editingVehicle.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [editingVehicle, fuelLogs]);

  // Vehicle specific maintenance logs
  const vehicleMaintenanceLogs = useMemo(() => {
    if (!editingVehicle) return [];
    return maintenanceLogs
      .filter((m) => m.machineryId === editingVehicle.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [editingVehicle, maintenanceLogs]);

  useEffect(() => {
    if (editingVehicle) {
      setPlate(editingVehicle.licensePlateOrSerial || '');
      setBrand(editingVehicle.brand || '');
      setModel(editingVehicle.model || '');
      setYear(editingVehicle.year ? String(editingVehicle.year) : '');
      setRenavam(editingVehicle.renavam || '');
      setColor(editingVehicle.color || '');
      const categoryMap: Record<string, string> = {
        forrageira: 'Forrageira / Ensiladeira',
        ensiladeira: 'Ensiladeira Autopropelida',
        caminhao: 'Caminhão (Basculante / Silagem / Graneleiro)',
        trator: 'Trator Agrícola',
        reboque: 'Transbordo / Reboque / Carreta',
        utilitario: 'Veículo Utilitário / Apoio',
        onibus: 'Ônibus / Van de Equipe',
        outro: 'Outro Equipamento',
      };
      setCategoryType(
        editingVehicle.categoryType
          ? (categoryMap[editingVehicle.categoryType] || editingVehicle.categoryType)
          : 'Forrageira / Ensiladeira'
      );
      setStatus(editingVehicle.status || 'disponivel');
      const ownershipMap: Record<string, string> = {
        proprio: 'Próprio',
        terceirizado: 'De Terceiros',
        alugado: 'Alugado / Locação',
        arrendado: 'Arrendado / Financiado'
      };
      setOwnership(
        editingVehicle.ownership
          ? (ownershipMap[editingVehicle.ownership] || editingVehicle.ownership)
          : 'Próprio'
      );
      
      // Composition & type
      setCompositionType(editingVehicle.compositionType || 'veiculo_simples');
      setCoupledTrailerId(editingVehicle.coupledTrailerId || '');
      setCoupledTrailerName(editingVehicle.coupledTrailerName || '');
      setCustomTrailerText('');
      setVehicleTypeDetailed(editingVehicle.vehicleTypeDetailed || '');

      // Weights & capacities
      setTaraWeightKg(editingVehicle.taraWeightKg ? String(editingVehicle.taraWeightKg) : '');
      setCapacityLoadKg(editingVehicle.capacityLoadKg ? String(editingVehicle.capacityLoadKg) : '');
      setCapacityM3(editingVehicle.capacityM3 !== undefined ? String(editingVehicle.capacityM3) : '');
      setFuelCapacityLiters(editingVehicle.fuelCapacityLiters !== undefined ? String(editingVehicle.fuelCapacityLiters) : '');
      setHourMeter(editingVehicle.hourMeter !== undefined ? String(editingVehicle.hourMeter) : '');
      setCurrentKm(editingVehicle.currentKm !== undefined ? String(editingVehicle.currentKm) : '');

      // Serial
      setSerialNumber(editingVehicle.serialNumber || '');

      // Owner details
      setOwnerName(editingVehicle.ownerName || '');
      setOwnerDocument(editingVehicle.ownerDocument || '');
      setSecondaryOwnerName(editingVehicle.secondaryOwnerName || '');
      setSecondaryOwnerDocument(editingVehicle.secondaryOwnerDocument || '');
      setShowSecondaryOwner(Boolean(editingVehicle.secondaryOwnerName || editingVehicle.secondaryOwnerDocument));

      // Purchase & Financing
      setPurchaseValue(editingVehicle.purchaseValue ? String(editingVehicle.purchaseValue) : '');
      setPurchaseInvoiceNumber(editingVehicle.purchaseInvoiceNumber || '');
      setPurchaseInvoiceKey(editingVehicle.purchaseInvoiceKey || '');
      setPurchaseDate(editingVehicle.purchaseDate || '');
      setPurchaseSupplier(editingVehicle.purchaseSupplier || '');
      setPurchaseAttachmentName(editingVehicle.purchaseInvoiceAttachment?.name || '');
      setIsFinanced(Boolean(editingVehicle.isFinancedOrInstallments));
      setInstallmentsCount(editingVehicle.installmentsCount ? String(editingVehicle.installmentsCount) : '');
      setInstallmentValue(editingVehicle.installmentValue ? String(editingVehicle.installmentValue) : '');
      setFirstInstallmentDueDate(editingVehicle.firstInstallmentDueDate || '');
      setFinancialInstitution(editingVehicle.financialInstitution || '');
      setGeneratePayables(!editingVehicle.installmentsGenerated);
      
      // Drivers
      if (editingVehicle.assignedDriverIds && editingVehicle.assignedDriverIds.length > 0) {
        setSelectedDriverIds(editingVehicle.assignedDriverIds);
      } else if (editingVehicle.operatorOrDriver) {
        const existingNames = editingVehicle.operatorOrDriver.split(',').map(s => s.trim().toLowerCase());
        const matchedIds = employees
          .filter(emp => existingNames.includes(emp.name.toLowerCase()))
          .map(emp => emp.id);
        setSelectedDriverIds(matchedIds);
      } else {
        setSelectedDriverIds([]);
      }

      setRevisionStatus(editingVehicle.revisionStatus || 'Em dia');
      setNotes(editingVehicle.notes || editingVehicle.reaisNotes || '');
      setActiveTab('dados');
    } else {
      // Defaults for new vehicle
      setPlate('');
      setBrand('');
      setModel('');
      setYear(new Date().getFullYear().toString());
      setRenavam('');
      setColor('');
      setCategoryType('forrageira');
      setStatus('disponivel');
      setOwnership('proprio');

      setCompositionType('veiculo_simples');
      setCoupledTrailerId('');
      setCoupledTrailerName('');
      setCustomTrailerText('');
      setVehicleTypeDetailed('');

      setTaraWeightKg('');
      setCapacityLoadKg('');
      setCapacityM3('');
      setFuelCapacityLiters('');
      setHourMeter('');
      setCurrentKm('');

      setSerialNumber('');

      setOwnerName('');
      setOwnerDocument('');
      setSecondaryOwnerName('');
      setSecondaryOwnerDocument('');
      setShowSecondaryOwner(false);

      setPurchaseValue('');
      setPurchaseInvoiceNumber('');
      setPurchaseInvoiceKey('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPurchaseSupplier('');
      setPurchaseAttachmentName('');
      setIsFinanced(false);
      setInstallmentsCount('');
      setInstallmentValue('');
      setFirstInstallmentDueDate('');
      setFinancialInstitution('');
      setGeneratePayables(true);
      setInstallmentsCreatedFeedback(false);

      setSelectedDriverIds([]);
      setRevisionStatus('Em dia');
      setNotes('');
      setActiveTab('dados');
    }
  }, [editingVehicle, isOpen, employees]);

  // Active employees available for driver/operator assignment
  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status !== 'inativo');
  }, [employees]);

  // Filtered employees by search
  const filteredEmployeeSuggestions = useMemo(() => {
    if (!driverSearchQuery.trim()) return [];
    return activeEmployees.filter(emp => 
      !selectedDriverIds.includes(emp.id) &&
      (emp.name.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
       emp.role.toLowerCase().includes(driverSearchQuery.toLowerCase()))
    );
  }, [activeEmployees, selectedDriverIds, driverSearchQuery]);

  const handleToggleDriver = (empId: string) => {
    if (selectedDriverIds.includes(empId)) {
      setSelectedDriverIds(selectedDriverIds.filter(id => id !== empId));
    } else {
      setSelectedDriverIds([...selectedDriverIds, empId]);
      setDriverSearchQuery('');
    }
  };

  const handleRemoveDriver = (empId: string) => {
    setSelectedDriverIds(selectedDriverIds.filter(id => id !== empId));
  };

  // Helper for PBT calculation
  const computedPbt = useMemo(() => {
    const tara = parseFloat(taraWeightKg) || 0;
    const lotacao = parseFloat(capacityLoadKg) || 0;
    return tara + lotacao;
  }, [taraWeightKg, capacityLoadKg]);

  // Suggest installment value if purchaseValue and count are entered
  const handleInstallmentsCountChange = (val: string) => {
    setInstallmentsCount(val);
    const count = parseInt(val, 10);
    const totalP = parseFloat(purchaseValue);
    if (count > 0 && totalP > 0 && !installmentValue) {
      setInstallmentValue((totalP / count).toFixed(2));
    }
  };

  // File upload simulation for purchase invoice
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPurchaseAttachmentName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() && !serialNumber.trim()) {
      alert('Por favor, informe ao menos a Placa ou o Nº de Série do veículo.');
      return;
    }

    const formattedModel = model.trim() || plate.trim() || serialNumber.trim();
    const formattedBrand = brand.trim() || 'Agrícola';
    const formattedName = `${formattedBrand} ${formattedModel}`.trim();

    // Compile driver names
    const selectedEmpObjects = activeEmployees.filter(emp => selectedDriverIds.includes(emp.id));
    const assignedNames = selectedEmpObjects.map(emp => emp.name);
    const compiledDriverString = assignedNames.join(', ');

    // Coupled trailer logic
    let finalCoupledId = coupledTrailerId;
    let finalCoupledName = coupledTrailerName;
    if (compositionType === 'cavalo') {
      if (customTrailerText.trim()) {
        finalCoupledName = customTrailerText.trim();
        finalCoupledId = 'custom';
      } else if (coupledTrailerId && coupledTrailerId !== 'outro') {
        const found = candidateTrailers.find(t => t.id === coupledTrailerId);
        if (found) {
          finalCoupledName = `${found.licensePlateOrSerial || ''} - ${found.model || found.name}`.trim();
        }
      }
    } else {
      finalCoupledId = undefined as any;
      finalCoupledName = undefined as any;
    }

    // Use automatically calculated consumption or preserve existing
    const finalKmPerLiter = consumptionMetrics.avgKmPerLiter !== null 
      ? consumptionMetrics.avgKmPerLiter 
      : editingVehicle?.averageConsumptionKmPerLiter;

    const finalLitersPerHour = consumptionMetrics.avgLitersPerHour !== null 
      ? consumptionMetrics.avgLitersPerHour 
      : editingVehicle?.averageConsumptionLitersPerHour;

    const numInstallments = parseInt(installmentsCount, 10) || 0;
    const numInstallmentVal = parseFloat(installmentValue) || 0;

    const willGenerateInstallments = Boolean(
      isFinanced && 
      generatePayables && 
      numInstallments > 0 && 
      numInstallmentVal > 0 && 
      onAddExpense && 
      !editingVehicle?.installmentsGenerated
    );

    const vehicleData: Machinery = {
      id: editingVehicle ? editingVehicle.id : `veh_${Date.now()}`,
      name: formattedName,
      model: formattedModel,
      brand: formattedBrand,
      year: year ? parseInt(year, 10) : undefined,
      renavam: renavam.trim() || undefined,
      color: color.trim() || undefined,
      categoryType: categoryType || 'forrageira',
      status: status || 'disponivel',
      ownership: ownership || 'proprio',
      
      // Composition & Types
      compositionType,
      coupledTrailerId: finalCoupledId || undefined,
      coupledTrailerName: finalCoupledName || undefined,
      vehicleTypeDetailed: vehicleTypeDetailed.trim() || undefined,

      // Weights
      taraWeightKg: taraWeightKg ? parseFloat(taraWeightKg) : undefined,
      capacityLoadKg: capacityLoadKg ? parseFloat(capacityLoadKg) : undefined,
      grossWeightKg: computedPbt > 0 ? computedPbt : undefined,

      // Serial
      serialNumber: serialNumber.trim() || undefined,

      // Ownership ("No nome de quem")
      ownerName: ownerName.trim() || undefined,
      ownerDocument: ownerDocument.trim() || undefined,
      secondaryOwnerName: secondaryOwnerName.trim() || undefined,
      secondaryOwnerDocument: secondaryOwnerDocument.trim() || undefined,

      // Purchase & Financing
      purchaseValue: purchaseValue ? parseFloat(purchaseValue) : undefined,
      purchaseInvoiceNumber: purchaseInvoiceNumber.trim() || undefined,
      purchaseInvoiceKey: purchaseInvoiceKey.trim() || undefined,
      purchaseDate: purchaseDate || undefined,
      purchaseSupplier: purchaseSupplier.trim() || undefined,
      purchaseInvoiceAttachment: purchaseAttachmentName ? { name: purchaseAttachmentName, uploadedAt: new Date().toISOString() } : undefined,
      isFinancedOrInstallments: isFinanced,
      installmentsCount: isFinanced && numInstallments > 0 ? numInstallments : undefined,
      installmentValue: isFinanced && numInstallmentVal > 0 ? numInstallmentVal : undefined,
      firstInstallmentDueDate: isFinanced ? firstInstallmentDueDate : undefined,
      financialInstitution: isFinanced ? financialInstitution.trim() : undefined,
      installmentsGenerated: editingVehicle?.installmentsGenerated || willGenerateInstallments,

      // Capacity & Meters
      capacityM3: capacityM3 ? parseFloat(capacityM3) : undefined,
      fuelCapacityLiters: fuelCapacityLiters ? parseFloat(fuelCapacityLiters) : undefined,
      licensePlateOrSerial: (plate.trim() || serialNumber.trim()).toUpperCase(),
      hourMeter: hourMeter ? parseFloat(hourMeter) : (editingVehicle?.hourMeter || 0),
      currentKm: currentKm ? parseFloat(currentKm) : (editingVehicle?.currentKm || undefined),
      averageConsumptionKmPerLiter: finalKmPerLiter,
      averageConsumptionLitersPerHour: finalLitersPerHour,
      operatorOrDriver: compiledDriverString,
      assignedDriverIds: selectedDriverIds,
      assignedDrivers: assignedNames,
      revisionStatus: revisionStatus.trim() || 'Em dia',
      notes: notes.trim() || undefined,
      reaisNotes: notes.trim() || undefined,
      accumulatedCost: editingVehicle ? editingVehicle.accumulatedCost : 0,
      totalFuelExpenses: editingVehicle?.totalFuelExpenses || 0,
      totalMaintenanceExpenses: editingVehicle?.totalMaintenanceExpenses || 0,
      lastMaintenanceDate: editingVehicle?.lastMaintenanceDate || new Date().toISOString().split('T')[0],
      currentFuelPercentage: editingVehicle?.currentFuelPercentage || 100,
    };

    // Automatically generate installments in Contas a Pagar if requested
    if (willGenerateInstallments && onAddExpense) {
      const baseDueDate = firstInstallmentDueDate || new Date().toISOString().split('T')[0];
      const [bYear, bMonth, bDay] = baseDueDate.split('-').map(Number);

      for (let i = 1; i <= numInstallments; i++) {
        // Calculate each month's date cleanly
        const targetDate = new Date(bYear, (bMonth - 1) + (i - 1), bDay || 10);
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const instDueDate = `${yyyy}-${mm}-${dd}`;

        onAddExpense({
          description: `Parcela ${i}/${numInstallments} - Financiamento ${formattedName} (${(plate || serialNumber).toUpperCase()})`,
          amount: numInstallmentVal,
          category: 'Financiamento de Veículos / Frotas',
          dueDate: instDueDate,
          status: 'pendente',
          paymentMethod: 'boleto',
          supplier: financialInstitution.trim() || purchaseSupplier.trim() || ownerName.trim() || 'Banco / Financeira',
          invoiceNumber: purchaseInvoiceNumber.trim() || undefined,
          machineryId: vehicleData.id,
          machineryName: formattedName,
          notes: `Parcelamento de aquisição do veículo ${formattedName} (Placa/Série: ${(plate || serialNumber).toUpperCase()}). Parcela ${i} de ${numInstallments}. NF Compra: ${purchaseInvoiceNumber.trim() || 'N/A'}.`,
        });
      }
    }

    onSave(vehicleData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header matching design */}
        <div className="px-5 sm:px-6 py-3.5 bg-cyan-100 dark:bg-cyan-950/70 border-b border-cyan-200 dark:border-cyan-900 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-cyan-950 dark:text-cyan-100 font-['Outfit']">
                {editingVehicle ? 'Editar Veículo / Máquina' : 'Cadastrar Novo Veículo / Máquina'}
              </h3>
              <p className="text-[11px] text-cyan-900/70 dark:text-cyan-200/70">
                Gestão de dados cadastrais, dados de propriedade, pesos e controle de compra
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-cyan-900 dark:text-cyan-200 hover:bg-cyan-200/60 dark:hover:bg-cyan-900/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="p-3 bg-stone-100/90 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700/80 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-2 w-full max-w-md bg-stone-200/80 dark:bg-stone-900/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('dados')}
              className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'dados'
                  ? 'bg-white dark:bg-stone-800 text-cyan-900 dark:text-cyan-300 shadow-xs border border-cyan-500/20'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Dados do Veículo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-white dark:bg-stone-800 text-cyan-900 dark:text-cyan-300 shadow-xs border border-cyan-500/20'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Histórico, Consumo & DRE</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DADOS DO VEÍCULO */}
        {activeTab === 'dados' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            
            {/* SEÇÃO: IDENTIFICAÇÃO BÁSICA (Placa, Nº de Série, Marca, Modelo, Ano, RENAVAM, Cor) */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="Ex: AAA0002 ou ABC-1234"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs"
                  />
                  <p className="text-[10px] text-black mt-1">Opcional para máquinas agrícolas</p>
                </div>

                {/* Nº DE SÉRIE - Totalmente Editável (especial para tratores e ensiladeiras) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center justify-between">
                    <span>Nº de Série (Chassi / Fabricante)</span>
                    <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">Editável</span>
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Ex: CH-98745231 / JD-8520-2023"
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-cyan-500/40 dark:border-cyan-600/40 bg-cyan-50/20 dark:bg-cyan-950/20 text-stone-900 dark:text-stone-100 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs"
                  />
                  <p className="text-[10px] text-cyan-700 dark:text-cyan-300 mt-1">Para tratores, ensiladeiras e implementos s/ RENAVAM</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Código RENAVAM
                  </label>
                  <input
                    type="text"
                    value={renavam}
                    onChange={(e) => setRenavam(e.target.value)}
                    placeholder="Código RENAVAM (se houver)"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs"
                  />
                </div>
              </div>

              {/* Marca, Modelo, Ano, Cor */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Claas, Mercedes, John Deere"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: Jaguar 860, Axor 3131"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Ano de Fabricação
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ex: 2023"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Cor
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ex: Branco / Verde"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs"
                  />
                </div>
              </div>

              {/* Categoria Geral e Status Operacional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Categoria Geral do Sistema - Lista Editável */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      Categoria Geral do Sistema
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoriesModalOpen(true)}
                      className="text-[11px] text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                      title="Gerenciar lista: incluir novas ou excluir opções"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Editar Lista</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={categoryType}
                      onChange={(e) => {
                        if (e.target.value === '__manage__') {
                          setIsCategoriesModalOpen(true);
                        } else {
                          setCategoryType(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs cursor-pointer"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      {!categoriesList.includes(categoryType) && categoryType && (
                        <option value={categoryType}>{categoryType}</option>
                      )}
                      <option disabled>──────────</option>
                      <option value="__manage__">+ Incluir ou Excluir Categorias da Lista...</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsCategoriesModalOpen(true)}
                      className="p-2 border border-stone-300 dark:border-stone-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-xl text-cyan-700 dark:text-cyan-400 transition cursor-pointer shrink-0 shadow-xs"
                      title="Incluir nova categoria ou excluir existente"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Status Operacional
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 shadow-xs"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="operacional">Operacional (Em Atividade / Campo)</option>
                    <option value="em_manutencao">Em Manutenção / Oficina</option>
                    <option value="parado">Parado / Sinistro / Aguardando Peças</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: PROPRIEDADE & NO NOME DE QUEM (RAZÃO SOCIAL / NOME + CNPJ/CPF) */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Propriedade & Documentação ("No Nome de Quem")
                  </h4>
                </div>
                <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                  <span className="text-[11px] text-stone-500 font-semibold">Regime:</span>
                  <select
                    value={ownership}
                    onChange={(e) => {
                      if (e.target.value === '__manage__') {
                        setIsRegimesModalOpen(true);
                      } else {
                        setOwnership(e.target.value);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-xs"
                  >
                    {regimesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    {!regimesList.includes(ownership) && ownership && (
                      <option value={ownership}>{ownership}</option>
                    )}
                    <option disabled>──────────</option>
                    <option value="__manage__">+ Incluir ou Excluir Regimes...</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsRegimesModalOpen(true)}
                    className="p-1 border border-stone-300 dark:border-stone-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-emerald-700 dark:text-emerald-400 transition cursor-pointer shrink-0 shadow-xs"
                    title="Incluir novo regime ou excluir opções da lista"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Titular Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Está no Nome de Quem (Razão Social ou Nome do Proprietário)
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ex: Agropecuária Silva Ltda ou João da Silva"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Nome constante no documento do veículo</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    CNPJ ou CPF do Proprietário
                  </label>
                  <input
                    type="text"
                    value={ownerDocument}
                    onChange={(e) => setOwnerDocument(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00 ou 000.000.000-00"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Permite veículos no CPF e no CNPJ da empresa</p>
                </div>
              </div>

              {/* Segundo Proprietário / Sócio (Opcional) */}
              {showSecondaryOwner ? (
                <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Segundo Proprietário / Coproprietário / Sócio
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSecondaryOwner(false);
                        setSecondaryOwnerName('');
                        setSecondaryOwnerDocument('');
                      }}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Remover segundo titular
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={secondaryOwnerName}
                        onChange={(e) => setSecondaryOwnerName(e.target.value)}
                        placeholder="Nome / Razão Social do segundo sócio..."
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={secondaryOwnerDocument}
                        onChange={(e) => setSecondaryOwnerDocument(e.target.value)}
                        placeholder="CPF ou CNPJ do segundo titular..."
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSecondaryOwner(true)}
                  className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Possui mais de um sócio / coproprietário? Adicionar segundo titular</span>
                </button>
              )}
            </div>

            {/* SEÇÃO 4: CONTROLE DE PESO (TARA & LOTAÇÃO) E MEDIÇÕES */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 space-y-3.5">
              <div className="flex items-center space-x-2">
                <Weight className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Controle de Pesos, Capacidade & Odômetro/Horímetro
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Tara (kg) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Tara (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={taraWeightKg}
                      onChange={(e) => setTaraWeightKg(e.target.value)}
                      placeholder="Ex: 8500"
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      kg
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">Peso do veículo vazio sem carga</p>
                </div>

                {/* Lotação (kg) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Lotação (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={capacityLoadKg}
                      onChange={(e) => setCapacityLoadKg(e.target.value)}
                      placeholder="Ex: 14500"
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      kg
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">Carga máxima útil permitida</p>
                </div>

                {/* PBT Calculado */}
                <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-stone-500 uppercase">
                    PBT Calculado (Tara + Lotação)
                  </span>
                  <div className="text-lg font-black text-sky-700 dark:text-sky-300 font-mono mt-0.5">
                    {computedPbt > 0 ? `${computedPbt.toLocaleString('pt-BR')} kg` : '--'}
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {computedPbt > 0 ? `Equivale a ${(computedPbt / 1000).toFixed(1)} toneladas` : 'Informe Tara e Lotação'}
                  </span>
                </div>
              </div>

              {/* Volume M3, Horímetro e Odômetro */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* Capacidade M³ */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Capacidade Caçamba (m³)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={capacityM3}
                      onChange={(e) => setCapacityM3(e.target.value)}
                      placeholder="Ex: 40.0"
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      m³
                    </span>
                  </div>
                </div>

                {/* Horímetro Atual */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Horímetro Atual (Horas)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={hourMeter}
                      onChange={(e) => setHourMeter(e.target.value)}
                      placeholder="Ex: 4500"
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      h
                    </span>
                  </div>
                </div>

                {/* Odômetro Atual */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center space-x-1">
                    <Gauge className="w-3.5 h-3.5 text-sky-600" />
                    <span>Odômetro Atual (KM)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={currentKm}
                      onChange={(e) => setCurrentKm(e.target.value)}
                      placeholder="Ex: 148500"
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      km
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 5: CONTROLE DE COMPRA, NOTA FISCAL & FINANCIAMENTO (INTEGRAÇÃO CONTAS A PAGAR) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 via-stone-50 to-stone-100 dark:from-emerald-950/20 dark:via-stone-900 dark:to-stone-800 border border-emerald-300/60 dark:border-emerald-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Controle de Compra, Nota Fiscal & Financiamento
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Modalidade:</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-stone-200 dark:bg-stone-800">
                    <button
                      type="button"
                      onClick={() => setIsFinanced(false)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        !isFinanced ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      À Vista
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFinanced(true)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        isFinanced ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      Parcelado / Financiado
                    </button>
                  </div>
                </div>
              </div>

              {/* Dados da Nota de Compra e Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Valor de Compra */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Valor de Compra (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseValue}
                      onChange={(e) => setPurchaseValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-black font-['Outfit'] focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Nota Fiscal de Compra */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Nota Fiscal de Compra
                  </label>
                  <input
                    type="text"
                    value={purchaseInvoiceNumber}
                    onChange={(e) => setPurchaseInvoiceNumber(e.target.value)}
                    placeholder="Ex: NF-e 12345"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Data da Compra */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Fornecedor / Vendedor */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Concessionária / Vendedor
                  </label>
                  <input
                    type="text"
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    placeholder="Ex: MacPonta, Concessionária..."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Chave de Acesso e Anexo da Nota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Chave de Acesso da NF-e (44 dígitos)
                  </label>
                  <input
                    type="text"
                    value={purchaseInvoiceKey}
                    onChange={(e) => setPurchaseInvoiceKey(e.target.value)}
                    placeholder="Chave de 44 dígitos da NF-e (opcional)"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Anexar Arquivo da Nota Fiscal (PDF ou Imagem)
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Selecionar Arquivo...</span>
                      <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,image/*" />
                    </label>
                    {purchaseAttachmentName && (
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-xs flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{purchaseAttachmentName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SE FINANCIADO / PARCELADO */}
              {isFinanced && (
                <div className="p-3.5 bg-white dark:bg-stone-800 rounded-xl border border-emerald-300 dark:border-emerald-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center space-x-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Condições do Financiamento / Parcelamento</span>
                    </span>
                    {editingVehicle?.installmentsGenerated && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Parcelas já lançadas no Contas a Pagar
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Quantidade de parcelas */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Qtd. de Parcelas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={installmentsCount}
                        onChange={(e) => handleInstallmentsCountChange(e.target.value)}
                        placeholder="Ex: 36"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Valor da parcela */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Valor da Parcela (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={installmentValue}
                        onChange={(e) => setInstallmentValue(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Data 1º Vencimento */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        1º Vencimento
                      </label>
                      <input
                        type="date"
                        value={firstInstallmentDueDate}
                        onChange={(e) => setFirstInstallmentDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Banco / Financeira */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Banco / Instituição
                      </label>
                      <input
                        type="text"
                        value={financialInstitution}
                        onChange={(e) => setFinancialInstitution(e.target.value)}
                        placeholder="Ex: Banco do Brasil, John Deere Fin..."
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Automação: Incluir no Contas a Pagar */}
                  {!editingVehicle?.installmentsGenerated && (
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-700/60 flex items-start space-x-2.5">
                      <input
                        type="checkbox"
                        id="generatePayablesCheck"
                        checked={generatePayables}
                        onChange={(e) => setGeneratePayables(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="generatePayablesCheck" className="text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                        <strong className="text-emerald-800 dark:text-emerald-300">
                          Incluir as parcelas no Contas a Pagar automaticamente
                        </strong>
                        <span className="block text-[11px] text-stone-500">
                          O sistema irá gerar as {installmentsCount || 'X'} despesas mensais sequenciais no módulo financeiro vinculadas à aquisição deste veículo.
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO 6: MOTORISTAS / OPERADORES (Múltipla Seleção) */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Motoristas & Operadores Vinculados (Múltiplos)</span>
                </label>
                <span className="text-[11px] font-semibold text-stone-500">
                  {selectedDriverIds.length} selecionado(s)
                </span>
              </div>

              {/* Chips of selected employees */}
              <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl">
                {selectedDriverIds.length === 0 ? (
                  <span className="text-xs text-stone-400 italic py-1 px-1">
                    Nenhum motorista ou operador selecionado. Escolha na lista abaixo:
                  </span>
                ) : (
                  selectedDriverIds.map((id) => {
                    const emp = activeEmployees.find(e => e.id === id);
                    if (!emp) return null;
                    return (
                      <span
                        key={emp.id}
                        className="inline-flex items-center space-x-1.5 py-1 px-2.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700 text-cyan-950 dark:text-cyan-200 text-xs font-bold shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                        <span>{emp.name}</span>
                        <span className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80 font-normal">
                          ({emp.role})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDriver(emp.id)}
                          className="hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-full p-0.5 transition cursor-pointer text-cyan-800 dark:text-cyan-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>

              {/* Employee Selection Search */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={driverSearchQuery}
                    onChange={(e) => setDriverSearchQuery(e.target.value)}
                    placeholder="🔍 Digite para pesquisar funcionário por nome ou cargo..."
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />
                  {filteredEmployeeSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredEmployeeSuggestions.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleToggleDriver(emp.id)}
                          className="w-full text-left px-3.5 py-2 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 flex items-center justify-between text-xs transition cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-stone-800 dark:text-stone-200">{emp.name}</span>
                            <span className="text-stone-500 text-[11px]">({emp.role})</span>
                          </div>
                          <span className="text-cyan-600 font-bold flex items-center space-x-1">
                            <Plus className="w-3 h-3" />
                            <span>Adicionar</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {activeEmployees.slice(0, 10).map((emp) => {
                    const isSelected = selectedDriverIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleToggleDriver(emp.id)}
                        className={`text-xs py-1 px-2.5 rounded-lg border transition flex items-center space-x-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-600 text-white border-cyan-600 font-bold'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-cyan-400 font-medium'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-stone-400" />}
                        <span>{emp.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SEÇÃO 7: MÉDIAS DE CONSUMO AUTOMÁTICAS */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/80 via-emerald-50/40 to-stone-50 dark:from-cyan-950/40 dark:to-stone-900 border border-cyan-200/80 dark:border-cyan-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                    <Fuel className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Médias de Consumo de Combustível
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Calculadas automaticamente com base nos registros de abastecimento
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                  Cálculo Automático
                </span>
              </div>

              {/* Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                      Média por Km (km/L)
                    </span>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                      {consumptionMetrics.avgKmPerLiter !== null 
                        ? `${consumptionMetrics.avgKmPerLiter.toLocaleString('pt-BR')} km/L` 
                        : (editingVehicle?.averageConsumptionKmPerLiter 
                            ? `${editingVehicle.averageConsumptionKmPerLiter.toLocaleString('pt-BR')} km/L`
                            : 'Aguardando Abastecimento')}
                    </div>
                  </div>
                  <Gauge className="w-6 h-6 text-emerald-500/60" />
                </div>

                <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                      Média por Horas (L/h)
                    </span>
                    <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-['Outfit']">
                      {consumptionMetrics.avgLitersPerHour !== null 
                        ? `${consumptionMetrics.avgLitersPerHour.toLocaleString('pt-BR')} L/h` 
                        : (editingVehicle?.averageConsumptionLitersPerHour 
                            ? `${editingVehicle.averageConsumptionLitersPerHour.toLocaleString('pt-BR')} L/h`
                            : 'Aguardando Abastecimento')}
                    </div>
                  </div>
                  <Clock className="w-6 h-6 text-amber-500/60" />
                </div>
              </div>
            </div>

            {/* SEÇÃO 8: OBSERVAÇÕES */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Observações Adicionais
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pneus trocados em 08/2026. Lâminas e contra-faca afiadas. Manutenção agendada para 5.000h."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 resize-none shadow-xs"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-md shadow-cyan-700/20 transition flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Veículo</span>
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: HISTÓRICO, CONSUMO & DRE */}
        {activeTab === 'historico' && (
          <VehicleHistoryDreTab
            vehicle={editingVehicle}
            employees={employees}
            fuelLogs={fuelLogs}
            maintenanceLogs={maintenanceLogs}
            expenses={expenses}
            services={services}
            orders={orders}
            onAddExpense={onAddExpense}
            onClose={onClose}
          />
        )}

      </div>

      {/* Modal para Gerenciar (Incluir / Excluir / Editar) Categorias da Lista */}
      <VehicleCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categoriesList}
        onSaveCategories={handleSaveCategories}
        onSelectCategory={(cat) => setCategoryType(cat)}
      />

      {/* Modal para Gerenciar (Incluir / Excluir / Editar) Regimes da Lista */}
      <VehicleOwnershipModal
        isOpen={isRegimesModalOpen}
        onClose={() => setIsRegimesModalOpen(false)}
        regimes={regimesList}
        onSaveRegimes={handleSaveRegimes}
        onSelectRegime={(reg) => setOwnership(reg)}
      />
    </div>
  );
};
