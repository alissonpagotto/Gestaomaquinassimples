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
  Weight,
  Printer,
  ShieldCheck,
  Landmark,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Machinery, Employee, FuelLog, MaintenanceLog, Expense, ServiceOrder, SilageOrder } from '../../types';
import { 
  formatCurrencyBRL, 
  formatDateBR, 
  getStoredVehicleSystemCategories, 
  saveStoredVehicleSystemCategories,
  getStoredVehicleOwnershipRegimes,
  saveStoredVehicleOwnershipRegimes,
  getStoredCompanyProfile
} from '../../lib/storage';
import { calculateVehicleConsumptionMetrics } from '../../lib/fleetMetrics';
import { VehicleCategoriesModal } from './VehicleCategoriesModal';
import { VehicleOwnershipModal } from './VehicleOwnershipModal';
import { VehicleHistoryDreTab } from './VehicleHistoryDreTab';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { PrintDocumentOptions } from '../../lib/printService';
import { 
  generateVehicleRegistrationPrintHtml, 
  generateVehicleHistoryPrintHtml 
} from './vehiclePrintTemplates';

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
  const [fleetNumber, setFleetNumber] = useState('');
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

  // 4. Controle Patrimonial, Impostos & Taxas (FIPE, IPVA & Licenciamento)
  const [fipeValue, setFipeValue] = useState('');
  const [ipvaBaseValue, setIpvaBaseValue] = useState('');
  const [ipvaRatePercent, setIpvaRatePercent] = useState('2'); // Default 2% (comum em veículos utilitários/caminhões/agrícola)
  const [ipvaInstallmentsCount, setIpvaInstallmentsCount] = useState('1'); // 1x até 5x
  const [licensingValue, setLicensingValue] = useState('');
  const [ipvaFinancialStatus, setIpvaFinancialStatus] = useState<'pendente' | 'lancado'>('pendente');
  const [licensingFinancialStatus, setLicensingFinancialStatus] = useState<'pendente' | 'lancado'>('pendente');
  const [isLaunchingIpva, setIsLaunchingIpva] = useState(false);
  const [isLaunchingLicensing, setIsLaunchingLicensing] = useState(false);

  // Computed IPVA Total
  const computedIpvaTotal = useMemo(() => {
    const base = parseFloat(ipvaBaseValue) || 0;
    const rate = parseFloat(ipvaRatePercent) || 0;
    if (base > 0 && rate > 0) {
      return (base * (rate / 100));
    }
    return 0;
  }, [ipvaBaseValue, ipvaRatePercent]);

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

  // Print Modal States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintDocumentOptions | null>(null);

  // Helper to compile the active/current vehicle object (merging form fields or editingVehicle)
  const buildCurrentVehicleSnapshot = (): Machinery => {
    const formattedModel = model.trim() || plate.trim() || fleetNumber.trim() || serialNumber.trim() || 'Veículo / Equipamento';
    const formattedBrand = brand.trim() || 'Agrícola';
    const formattedName = `${formattedBrand} ${formattedModel}`.trim();

    const selectedEmpObjects = activeEmployees.filter(emp => selectedDriverIds.includes(emp.id));
    const assignedNames = selectedEmpObjects.map(emp => emp.name);
    const compiledDriverString = assignedNames.join(', ');

    let finalCoupledName = coupledTrailerName;
    if (compositionType === 'cavalo') {
      if (customTrailerText.trim()) {
        finalCoupledName = customTrailerText.trim();
      } else if (coupledTrailerId && coupledTrailerId !== 'outro') {
        const found = candidateTrailers.find(t => t.id === coupledTrailerId);
        if (found) {
          finalCoupledName = `${found.licensePlateOrSerial || ''} - ${found.model || found.name}`.trim();
        }
      }
    }

    const finalKmPerLiter = consumptionMetrics.avgKmPerLiter !== null 
      ? consumptionMetrics.avgKmPerLiter 
      : editingVehicle?.averageConsumptionKmPerLiter;

    const finalLitersPerHour = consumptionMetrics.avgLitersPerHour !== null 
      ? consumptionMetrics.avgLitersPerHour 
      : editingVehicle?.averageConsumptionLitersPerHour;

    const numInstallments = parseInt(installmentsCount, 10) || 0;
    const numInstallmentVal = parseFloat(installmentValue) || 0;

    return {
      id: editingVehicle ? editingVehicle.id : `veh_${Date.now()}`,
      name: formattedName,
      model: formattedModel,
      brand: formattedBrand,
      year: year ? parseInt(year, 10) : undefined,
      renavam: renavam.trim() || undefined,
      color: color.trim() || undefined,
      fleetNumber: fleetNumber.trim() || undefined,
      categoryType: categoryType || 'forrageira',
      status: status || 'disponivel',
      ownership: ownership || 'proprio',
      compositionType,
      coupledTrailerId: coupledTrailerId || undefined,
      coupledTrailerName: finalCoupledName || undefined,
      vehicleTypeDetailed: vehicleTypeDetailed.trim() || undefined,
      taraWeightKg: taraWeightKg ? parseFloat(taraWeightKg) : undefined,
      capacityLoadKg: capacityLoadKg ? parseFloat(capacityLoadKg) : undefined,
      grossWeightKg: computedPbt > 0 ? computedPbt : undefined,
      serialNumber: serialNumber.trim() || undefined,
      ownerName: ownerName.trim() || undefined,
      ownerDocument: ownerDocument.trim() || undefined,
      secondaryOwnerName: secondaryOwnerName.trim() || undefined,
      secondaryOwnerDocument: secondaryOwnerDocument.trim() || undefined,
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
      // 4. Controle Patrimonial, Impostos & Taxas
      fipeValue: fipeValue ? parseFloat(fipeValue) : undefined,
      ipvaBaseValue: ipvaBaseValue ? parseFloat(ipvaBaseValue) : undefined,
      ipvaRatePercent: ipvaRatePercent ? parseFloat(ipvaRatePercent) : undefined,
      ipvaTotalAmount: computedIpvaTotal > 0 ? computedIpvaTotal : undefined,
      ipvaInstallmentsCount: ipvaInstallmentsCount ? parseInt(ipvaInstallmentsCount, 10) : undefined,
      ipvaFinancialStatus,
      licensingValue: licensingValue ? parseFloat(licensingValue) : undefined,
      licensingFinancialStatus,
      capacityM3: capacityM3 ? parseFloat(capacityM3) : undefined,
      fuelCapacityLiters: fuelCapacityLiters ? parseFloat(fuelCapacityLiters) : undefined,
      licensePlateOrSerial: (plate.trim() || serialNumber.trim() || fleetNumber.trim()).toUpperCase(),
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
  };

  // Handler for "Imprimir Cadastro"
  const handlePrintCadastro = () => {
    const currentVehicle = buildCurrentVehicleSnapshot();
    const company = getStoredCompanyProfile();

    const selectedEmpObjects = activeEmployees.filter(emp => selectedDriverIds.includes(emp.id));
    const assignedNames = selectedEmpObjects.map(emp => emp.name);

    const vehicleTitle = currentVehicle.fleetNumber 
      ? `FROTA Nº ${currentVehicle.fleetNumber} - ${currentVehicle.name || currentVehicle.model}`
      : `${currentVehicle.name || currentVehicle.model}`;

    const subtitle = `Placa/Série: ${currentVehicle.licensePlateOrSerial || '--'} | Categoria: ${currentVehicle.categoryType || 'Equipamento'} | Regime: ${currentVehicle.ownership || 'Próprio'}`;

    const contentHtml = generateVehicleRegistrationPrintHtml(currentVehicle, company, assignedNames);

    setPrintOptions({
      company,
      title: `FICHA CADASTRAL DO VEÍCULO / MÁQUINA`,
      subtitle: `${vehicleTitle} — ${subtitle}`,
      documentType: 'CADASTRO DE VEÍCULO',
      contentHtml,
      showSignatures: true,
      signatureLabels: ['Responsável pela Frota / Operação', 'Diretoria / Gerência Geral'],
      whatsappText: `🚜 *${company.tradeName?.toUpperCase() || 'SILAGEM ZÉ BUSCA-PÉ'}*\n📋 *FICHA CADASTRAL DO VEÍCULO*\n🚛 *Veículo:* ${vehicleTitle}\n🔢 *Placa/Série:* ${currentVehicle.licensePlateOrSerial || '--'}\n⚙️ *Status:* ${currentVehicle.status?.toUpperCase() || 'DISPONÍVEL'}\n\n_Documento gerado via Silagem Fácil Pro_`,
    });
    setIsPrintModalOpen(true);
  };

  // Handler for "Imprimir Histórico"
  const handlePrintHistorico = () => {
    const currentVehicle = buildCurrentVehicleSnapshot();
    const company = getStoredCompanyProfile();

    const vehicleTitle = currentVehicle.fleetNumber 
      ? `FROTA Nº ${currentVehicle.fleetNumber} - ${currentVehicle.name || currentVehicle.model}`
      : `${currentVehicle.name || currentVehicle.model}`;

    const subtitle = `Placa/Série: ${currentVehicle.licensePlateOrSerial || '--'} | Relatório Consolidado de Consumo, Manutenções & DRE`;

    const contentHtml = generateVehicleHistoryPrintHtml(
      currentVehicle,
      company,
      fuelLogs,
      maintenanceLogs,
      expenses,
      services,
      orders,
      employees
    );

    setPrintOptions({
      company,
      title: `RELATÓRIO HISTÓRICO, CONSUMO & DRE OPERACIONAL`,
      subtitle: `${vehicleTitle} — ${subtitle}`,
      documentType: 'HISTÓRICO & DRE DO VEÍCULO',
      contentHtml,
      showSignatures: true,
      signatureLabels: ['Encarregado de Manutenção / Abastecimento', 'Controladoria / Gestão Financeira'],
      whatsappText: `🚜 *${company.tradeName?.toUpperCase() || 'SILAGEM ZÉ BUSCA-PÉ'}*\n📊 *RELATÓRIO DE HISTÓRICO & DRE DO VEÍCULO*\n🚛 *Veículo:* ${vehicleTitle}\n🔢 *Placa/Série:* ${currentVehicle.licensePlateOrSerial || '--'}\n\n_Relatório consolidado via Silagem Fácil Pro_`,
    });
    setIsPrintModalOpen(true);
  };

  useEffect(() => {
    if (editingVehicle) {
      setFleetNumber(editingVehicle.fleetNumber || '');
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
      
      // 4. Controle Patrimonial, Impostos & Taxas
      setFipeValue(editingVehicle.fipeValue !== undefined ? String(editingVehicle.fipeValue) : '');
      setIpvaBaseValue(editingVehicle.ipvaBaseValue !== undefined ? String(editingVehicle.ipvaBaseValue) : '');
      setIpvaRatePercent(editingVehicle.ipvaRatePercent !== undefined ? String(editingVehicle.ipvaRatePercent) : '2');
      setIpvaInstallmentsCount(editingVehicle.ipvaInstallmentsCount ? String(editingVehicle.ipvaInstallmentsCount) : '1');
      setLicensingValue(editingVehicle.licensingValue !== undefined ? String(editingVehicle.licensingValue) : '');
      setIpvaFinancialStatus(editingVehicle.ipvaFinancialStatus || 'pendente');
      setLicensingFinancialStatus(editingVehicle.licensingFinancialStatus || 'pendente');
      
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
      setFleetNumber('');
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

      // 4. Controle Patrimonial, Impostos & Taxas
      setFipeValue('');
      setIpvaBaseValue('');
      setIpvaRatePercent('2');
      setIpvaInstallmentsCount('1');
      setLicensingValue('');
      setIpvaFinancialStatus('pendente');
      setLicensingFinancialStatus('pendente');
      setIsLaunchingIpva(false);
      setIsLaunchingLicensing(false);

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

  // Launch IPVA directly into Contas a Pagar
  const handleLaunchIpva = () => {
    if (!onAddExpense) {
      alert('Módulo financeiro indisponível para lançamento direto.');
      return;
    }
    const totalIpva = computedIpvaTotal;
    if (totalIpva <= 0) {
      alert('Informe o Valor Base Venal e a Alíquota do IPVA para calcular o valor antes de lançar.');
      return;
    }

    const vName = `${brand.trim() || 'Veículo'} ${model.trim() || plate.trim() || 'Frota'}`.trim();
    const vIdentifier = (plate.trim() || serialNumber.trim() || fleetNumber.trim() || 'S/N').toUpperCase();
    const installments = Math.max(1, parseInt(ipvaInstallmentsCount, 10) || 1);
    const installmentVal = parseFloat((totalIpva / installments).toFixed(2));
    const today = new Date();
    const currentYear = year ? parseInt(year, 10) : today.getFullYear();
    const vehicleId = editingVehicle?.id || `veh_${Date.now()}`;

    for (let i = 1; i <= installments; i++) {
      // Due dates: IPVA usually starting next month or spaced by 30 days
      const targetDate = new Date(today.getFullYear(), today.getMonth() + (i - 1), 20);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dueDate = `${yyyy}-${mm}-${dd}`;

      onAddExpense({
        description: installments > 1 
          ? `IPVA ${currentYear} - Parcela ${i}/${installments} - ${vName} (${vIdentifier})`
          : `IPVA ${currentYear} (Cota Única) - ${vName} (${vIdentifier})`,
        amount: installmentVal,
        category: 'IPVA / Impostos de Frotas',
        dueDate,
        status: 'pendente',
        paymentMethod: 'boleto',
        supplier: 'SEFAZ / Detran - Secretaria da Fazenda',
        machineryId: vehicleId,
        machineryName: vName,
        notes: `Imposto IPVA exercício ${currentYear} para o veículo ${vName} (Placa/Identificador: ${vIdentifier}). Valor Venal Base: R$ ${parseFloat(ipvaBaseValue).toFixed(2)}, Alíquota: ${ipvaRatePercent}%. Parcela ${i} de ${installments}.`,
      });
    }

    setIpvaFinancialStatus('lancado');
    setIsLaunchingIpva(true);
    setTimeout(() => setIsLaunchingIpva(false), 3000);
  };

  // Launch Licensing directly into Contas a Pagar
  const handleLaunchLicensing = () => {
    if (!onAddExpense) {
      alert('Módulo financeiro indisponível para lançamento direto.');
      return;
    }
    const val = parseFloat(licensingValue) || 0;
    if (val <= 0) {
      alert('Informe o valor da Taxa de Licenciamento Anual antes de lançar.');
      return;
    }

    const vName = `${brand.trim() || 'Veículo'} ${model.trim() || plate.trim() || 'Frota'}`.trim();
    const vIdentifier = (plate.trim() || serialNumber.trim() || fleetNumber.trim() || 'S/N').toUpperCase();
    const today = new Date();
    const currentYear = year ? parseInt(year, 10) : today.getFullYear();
    const vehicleId = editingVehicle?.id || `veh_${Date.now()}`;

    // Due date in 30 days
    const targetDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dueDate = `${yyyy}-${mm}-${dd}`;

    onAddExpense({
      description: `Taxa de Licenciamento Anual ${currentYear} - ${vName} (${vIdentifier})`,
      amount: val,
      category: 'Licenciamento / Taxas Detran',
      dueDate,
      status: 'pendente',
      paymentMethod: 'boleto',
      supplier: 'Detran - Departamento Estadual de Trânsito',
      machineryId: vehicleId,
      machineryName: vName,
      notes: `Taxa anual de licenciamento CRLV exercício ${currentYear} para o veículo ${vName} (Placa/Identificador: ${vIdentifier}).`,
    });

    setLicensingFinancialStatus('lancado');
    setIsLaunchingLicensing(true);
    setTimeout(() => setIsLaunchingLicensing(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() && !serialNumber.trim() && !fleetNumber.trim()) {
      alert('Por favor, informe ao menos a Placa, o Nº de Série ou o Nº da Frota do veículo.');
      return;
    }

    const formattedModel = model.trim() || plate.trim() || fleetNumber.trim() || serialNumber.trim();
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
      fleetNumber: fleetNumber.trim() || undefined,
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

      // 4. Controle Patrimonial, Impostos & Taxas
      fipeValue: fipeValue ? parseFloat(fipeValue) : undefined,
      ipvaBaseValue: ipvaBaseValue ? parseFloat(ipvaBaseValue) : undefined,
      ipvaRatePercent: ipvaRatePercent ? parseFloat(ipvaRatePercent) : undefined,
      ipvaTotalAmount: computedIpvaTotal > 0 ? computedIpvaTotal : undefined,
      ipvaInstallmentsCount: ipvaInstallmentsCount ? parseInt(ipvaInstallmentsCount, 10) : undefined,
      ipvaFinancialStatus,
      licensingValue: licensingValue ? parseFloat(licensingValue) : undefined,
      licensingFinancialStatus,

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
      <div 
        className="bg-[#b0d2ed] rounded-2xl max-w-4xl w-full shadow-2xl border border-blue-300 overflow-hidden flex flex-col max-h-[92vh]"
        style={{ backgroundColor: '#b0d2ed' }}
      >
        
        {/* Header - Solid Blue #0963cb with White Text */}
        <div 
          className="px-5 sm:px-6 py-3.5 bg-[#0963cb] text-white flex items-center justify-between shrink-0 shadow-xs"
          style={{ backgroundColor: '#0963cb', color: '#ffffff' }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 
                className="text-base sm:text-lg font-bold text-white font-['Outfit']"
                style={{ color: '#ffffff' }}
              >
                {editingVehicle ? 'Editar Veículo / Máquina' : 'Cadastrar Novo Veículo / Máquina'}
              </h3>
              <p 
                className="text-[11px] text-white/90"
                style={{ color: '#ffffff' }}
              >
                Gestão de dados cadastrais, dados de propriedade, pesos e controle de compra
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Fechar"
            style={{ color: '#ffffff' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs Bar with Print Action Buttons */}
        <div 
          className="p-2.5 sm:p-3 bg-[#b0d2ed] border-b border-blue-300 flex flex-wrap items-center justify-between gap-2.5 shrink-0"
          style={{ backgroundColor: '#b0d2ed' }}
        >
          {/* Central Tabs: Dados & Histórico */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto max-w-md bg-white/70 p-1 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('dados')}
              className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'dados'
                  ? 'bg-[#0963cb] text-white shadow-xs'
                  : 'text-stone-700 hover:text-black'
              }`}
              style={activeTab === 'dados' ? { backgroundColor: '#0963cb', color: '#ffffff' } : {}}
            >
              <Car className="w-4 h-4" />
              <span>Dados do Veículo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-[#0963cb] text-white shadow-xs'
                  : 'text-stone-700 hover:text-black'
              }`}
              style={activeTab === 'historico' ? { backgroundColor: '#0963cb', color: '#ffffff' } : {}}
            >
              <Clock className="w-4 h-4" />
              <span>Histórico, Consumo & DRE</span>
            </button>
          </div>

          {/* Action Buttons: Imprimir Cadastro & Imprimir Histórico */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrintCadastro}
              title="Imprimir Ficha Cadastral do Veículo"
              className="px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs border border-stone-300 cursor-pointer text-black hover:bg-[#b0d2ed] active:scale-95"
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
            >
              <Printer className="w-4 h-4 text-black" style={{ color: '#000000' }} />
              <span className="text-black font-extrabold whitespace-nowrap" style={{ color: '#000000' }}>
                Imprimir Cadastro
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrintHistorico}
              title="Imprimir Relatório de Histórico, Consumo e DRE"
              className="px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs border border-stone-300 cursor-pointer text-black hover:bg-[#b0d2ed] active:scale-95"
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
            >
              <Printer className="w-4 h-4 text-black" style={{ color: '#000000' }} />
              <span className="text-black font-extrabold whitespace-nowrap" style={{ color: '#000000' }}>
                Imprimir Histórico
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: DADOS DO VEÍCULO */}
        {activeTab === 'dados' && (
          <form 
            onSubmit={handleSubmit} 
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#b0d2ed]"
            style={{ backgroundColor: '#b0d2ed' }}
          >
            
            {/* SEÇÃO 1: IDENTIFICAÇÃO BÁSICA (CARD BRANCO) */}
            <div className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#0963cb]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]" style={{ color: '#000000' }}>
                  1. IDENTIFICAÇÃO DO VEÍCULO / MÁQUINA
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* 1º: Placa do Veículo */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                  />
                </div>

                {/* 2º: Nº da Frota */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Nº da Frota
                  </label>
                  <input
                    type="text"
                    value={fleetNumber}
                    onChange={(e) => setFleetNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                  />
                </div>

                {/* 3º: Nº de Série (Chassi / Fabricante) */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Nº de Série (Chassi / Fabricante)
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                  />
                </div>

                {/* 4º: Código RENAVAM */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Código RENAVAM
                  </label>
                  <input
                    type="text"
                    value={renavam}
                    onChange={(e) => setRenavam(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                  />
                </div>
              </div>

              {/* Marca, Modelo, Ano, Cor */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Marca
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Ano de Fabricação
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Cor
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                  />
                </div>
              </div>

              {/* Categoria Geral e Status Operacional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Categoria Geral do Sistema - Lista Editável */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#000000]" style={{ color: '#000000' }}>
                      Categoria Geral do Sistema
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoriesModalOpen(true)}
                      className="text-[11px] text-[#0963cb] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs cursor-pointer"
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
                      className="p-2 border border-stone-300 bg-white hover:bg-stone-50 rounded-xl text-[#0963cb] transition cursor-pointer shrink-0 shadow-xs"
                      title="Incluir nova categoria ou excluir existente"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Status Operacional
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="operacional">Operacional (Em Atividade / Campo)</option>
                    <option value="em_manutencao">Em Manutenção / Oficina</option>
                    <option value="parado">Parado / Sinistro / Aguardando Peças</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: PROPRIEDADE & NO NOME DE QUEM (CARD BRANCO) */}
            <div className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-[#0963cb]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]" style={{ color: '#000000' }}>
                    Propriedade & Documentação ("No Nome de Quem")
                  </h4>
                </div>
                <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                  <span className="text-[11px] text-stone-600 font-semibold">Regime:</span>
                  <select
                    value={ownership}
                    onChange={(e) => {
                      if (e.target.value === '__manage__') {
                        setIsRegimesModalOpen(true);
                      } else {
                        setOwnership(e.target.value);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-[#000000] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0963cb] cursor-pointer shadow-xs"
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
                    className="p-1 border border-stone-300 bg-white hover:bg-stone-50 rounded-lg text-[#0963cb] transition cursor-pointer shrink-0 shadow-xs"
                    title="Incluir novo regime ou excluir opções da lista"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Titular Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Está no Nome de Quem (Razão Social ou Nome do Proprietário)
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                  />
                  <p className="text-[10px] text-stone-600 mt-1">Nome constante no documento do veículo</p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    CNPJ ou CPF do Proprietário
                  </label>
                  <input
                    type="text"
                    value={ownerDocument}
                    onChange={(e) => setOwnerDocument(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0963cb] shadow-xs"
                  />
                  <p className="text-[10px] text-stone-600 mt-1">Permite veículos no CPF e no CNPJ da empresa</p>
                </div>
              </div>

              {/* Segundo Proprietário / Sócio (Opcional) */}
              {showSecondaryOwner ? (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#000000]" style={{ color: '#000000' }}>
                      Segundo Proprietário / Coproprietário / Sócio
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSecondaryOwner(false);
                        setSecondaryOwnerName('');
                        setSecondaryOwnerDocument('');
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
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
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-[#000000] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={secondaryOwnerDocument}
                        onChange={(e) => setSecondaryOwnerDocument(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-[#000000] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSecondaryOwner(true)}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#0963cb] font-bold hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Possui mais de um sócio / coproprietário? Adicionar segundo titular</span>
                </button>
              )}
            </div>

            {/* SEÇÃO 3: CONTROLE DE PESO (TARA & LOTAÇÃO) E MEDIÇÕES (CARD BRANCO) */}
            <div className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center space-x-2">
                <Weight className="w-4 h-4 text-[#0963cb]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]" style={{ color: '#000000' }}>
                  Controle de Pesos, Capacidade & Odômetro/Horímetro
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Tara (kg) */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Tara (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={taraWeightKg}
                      onChange={(e) => setTaraWeightKg(e.target.value)}
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      kg
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-1">Peso do veículo vazio sem carga</p>
                </div>

                {/* Lotação (kg) */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Lotação (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={capacityLoadKg}
                      onChange={(e) => setCapacityLoadKg(e.target.value)}
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      kg
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-1">Carga máxima útil permitida</p>
                </div>

                {/* PBT Calculado */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-[#000000] uppercase" style={{ color: '#000000' }}>
                    PBT Calculado (Tara + Lotação)
                  </span>
                  <div className="text-lg font-black text-[#0963cb] font-mono mt-0.5">
                    {computedPbt > 0 ? `${computedPbt.toLocaleString('pt-BR')} kg` : '--'}
                  </div>
                  <span className="text-[10px] text-stone-600">
                    {computedPbt > 0 ? `Equivale a ${(computedPbt / 1000).toFixed(1)} toneladas` : 'Informe Tara e Lotação'}
                  </span>
                </div>
              </div>

              {/* Volume M3, Horímetro e Odômetro */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* Capacidade M³ */}
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center space-x-1 text-[#000000]" style={{ color: '#000000' }}>
                    <Layers className="w-3.5 h-3.5 text-[#0963cb]" />
                    <span>Capacidade Caçamba (m³)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={capacityM3}
                      onChange={(e) => setCapacityM3(e.target.value)}
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      m³
                    </span>
                  </div>
                </div>

                {/* Horímetro Atual */}
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center space-x-1 text-[#000000]" style={{ color: '#000000' }}>
                    <Clock className="w-3.5 h-3.5 text-[#0963cb]" />
                    <span>Horímetro Atual (Horas)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={hourMeter}
                      onChange={(e) => setHourMeter(e.target.value)}
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      h
                    </span>
                  </div>
                </div>

                {/* Odômetro Atual */}
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center space-x-1 text-[#000000]" style={{ color: '#000000' }}>
                    <Gauge className="w-3.5 h-3.5 text-[#0963cb]" />
                    <span>Odômetro Atual (KM)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={currentKm}
                      onChange={(e) => setCurrentKm(e.target.value)}
                      className="w-full px-3.5 py-2 pr-12 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      km
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: CONTROLE DE COMPRA, NOTA FISCAL & FINANCIAMENTO (CARD BRANCO) */}
            <div className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-[#0963cb]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]" style={{ color: '#000000' }}>
                    Controle de Compra, Nota Fiscal & Financiamento
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-stone-700">Modalidade:</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-stone-200">
                    <button
                      type="button"
                      onClick={() => setIsFinanced(false)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        !isFinanced ? 'bg-[#0963cb] text-white shadow-xs' : 'text-stone-700 hover:text-black'
                      }`}
                    >
                      À Vista
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFinanced(true)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        isFinanced ? 'bg-[#0963cb] text-white shadow-xs' : 'text-stone-700 hover:text-black'
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
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Valor de Compra (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseValue}
                      onChange={(e) => setPurchaseValue(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                  </div>
                </div>

                {/* Nota Fiscal de Compra */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Nota Fiscal de Compra
                  </label>
                  <input
                    type="text"
                    value={purchaseInvoiceNumber}
                    onChange={(e) => setPurchaseInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                  />
                </div>

                {/* Data da Compra */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                  />
                </div>

                {/* Fornecedor / Vendedor */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Concessionária / Vendedor
                  </label>
                  <input
                    type="text"
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                  />
                </div>
              </div>

              {/* Chave de Acesso e Anexo da Nota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Chave de Acesso da NF-e (44 dígitos)
                  </label>
                  <input
                    type="text"
                    value={purchaseInvoiceKey}
                    onChange={(e) => setPurchaseInvoiceKey(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Anexar Arquivo da Nota Fiscal (PDF ou Imagem)
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-[#000000] text-xs font-bold flex items-center space-x-1.5 cursor-pointer">
                      <Paperclip className="w-3.5 h-3.5 text-[#0963cb]" />
                      <span>Selecionar Arquivo...</span>
                      <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,image/*" />
                    </label>
                    {purchaseAttachmentName && (
                      <span className="text-xs text-[#0963cb] font-medium truncate max-w-xs flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{purchaseAttachmentName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SE FINANCIADO / PARCELADO */}
              {isFinanced && (
                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#000000] flex items-center space-x-1.5" style={{ color: '#000000' }}>
                      <CreditCard className="w-4 h-4 text-[#0963cb]" />
                      <span>Condições do Financiamento / Parcelamento</span>
                    </span>
                    {editingVehicle?.installmentsGenerated && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-[#0963cb]">
                        Parcelas já lançadas no Contas a Pagar
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Quantidade de parcelas */}
                    <div>
                      <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                        Qtd. de Parcelas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={installmentsCount}
                        onChange={(e) => handleInstallmentsCountChange(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-[#000000] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                      />
                    </div>

                    {/* Valor da parcela */}
                    <div>
                      <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                        Valor da Parcela (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={installmentValue}
                        onChange={(e) => setInstallmentValue(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-[#000000] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                      />
                    </div>

                    {/* Data 1º Vencimento */}
                    <div>
                      <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                        1º Vencimento
                      </label>
                      <input
                        type="date"
                        value={firstInstallmentDueDate}
                        onChange={(e) => setFirstInstallmentDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-[#000000] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                      />
                    </div>

                    {/* Banco / Financeira */}
                    <div>
                      <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                        Banco / Instituição
                      </label>
                      <input
                        type="text"
                        value={financialInstitution}
                        onChange={(e) => setFinancialInstitution(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-[#000000] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                      />
                    </div>
                  </div>

                  {/* Automação: Incluir no Contas a Pagar */}
                  {!editingVehicle?.installmentsGenerated && (
                    <div className="pt-2 border-t border-blue-200/80 flex items-start space-x-2.5">
                      <input
                        type="checkbox"
                        id="generatePayablesCheck"
                        checked={generatePayables}
                        onChange={(e) => setGeneratePayables(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#0963cb] focus:ring-[#0963cb] cursor-pointer"
                      />
                      <label htmlFor="generatePayablesCheck" className="text-xs text-[#000000] cursor-pointer" style={{ color: '#000000' }}>
                        <strong className="text-[#0963cb]">
                          Incluir as parcelas no Contas a Pagar automaticamente
                        </strong>
                        <span className="block text-[11px] text-stone-600">
                          O sistema irá gerar as {installmentsCount || 'X'} despesas mensais sequenciais no módulo financeiro vinculadas à aquisição deste veículo.
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO 4: CONTROLE PATRIMONIAL, IMPOSTOS & TAXAS (FUNDO BRANCO, LABELS EM PRETO #000000) */}
            <div className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#0963cb]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]" style={{ color: '#000000' }}>
                    4. Controle Patrimonial, Impostos & Taxas
                  </h4>
                </div>
                <span className="text-[11px] text-stone-600 font-medium">
                  Ativo Imobilizado, Avaliação FIPE e Tributos da Frota
                </span>
              </div>

              {/* Grid dos Campos de Avaliação e IPVA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Valor Comercial Tabela FIPE (R$) */}
                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Valor Comercial Tabela FIPE (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={fipeValue}
                      onChange={(e) => setFipeValue(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                  </div>
                </div>

                {/* 2. Valor Base para IPVA (R$) */}
                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Valor Base para IPVA (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={ipvaBaseValue}
                      onChange={(e) => setIpvaBaseValue(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                  </div>
                </div>

                {/* 3. Alíquota IPVA (%) */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Alíquota IPVA (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 2"
                      value={ipvaRatePercent}
                      onChange={(e) => setIpvaRatePercent(e.target.value)}
                      className="w-full px-3 py-2 pr-7 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      %
                    </span>
                  </div>
                </div>

                {/* 4. Valor Total IPVA (R$) - Calculado Automaticamente */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Total IPVA (R$)
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-stone-300 bg-stone-100 text-[#000000] text-xs sm:text-sm font-black text-[#0963cb] flex items-center h-[38px]">
                    {computedIpvaTotal > 0 
                      ? computedIpvaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'R$ 0,00'}
                  </div>
                </div>
              </div>

              {/* Linha de Parcelamento e Licenciamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* 5. Qtd. Parcelas IPVA */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Qtd. Parcelas IPVA
                  </label>
                  <select
                    value={ipvaInstallmentsCount}
                    onChange={(e) => setIpvaInstallmentsCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                  >
                    <option value="1">1x (À Vista / Cota Única)</option>
                    <option value="2">2x mensais</option>
                    <option value="3">3x mensais</option>
                    <option value="4">4x mensais</option>
                    <option value="5">5x mensais</option>
                  </select>
                </div>

                {/* 6. Valor do Licenciamento Anual (R$) */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#000000]" style={{ color: '#000000' }}>
                    Valor do Licenciamento (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={licensingValue}
                      onChange={(e) => setLicensingValue(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                    />
                  </div>
                </div>

                {/* 7. Ação de Lançar IPVA no Financeiro */}
                <div className="flex flex-col justify-end">
                  <span className="block text-[10px] font-bold text-stone-500 mb-1">
                    Integração Contas a Pagar
                  </span>
                  {ipvaFinancialStatus === 'lancado' ? (
                    <div className="h-[38px] px-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center space-x-1.5 text-emerald-800 text-xs font-black">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>IPVA Lançado no Financeiro</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLaunchIpva}
                      disabled={computedIpvaTotal <= 0}
                      className="h-[38px] px-3 rounded-xl border border-stone-300 bg-white hover:bg-[#b0d2ed] text-[#000000] text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Landmark className="w-4 h-4 text-[#000000]" />
                      <span>💰 Lançar IPVA no Financeiro</span>
                    </button>
                  )}
                </div>

                {/* 8. Ação de Lançar Licenciamento no Financeiro */}
                <div className="flex flex-col justify-end">
                  <span className="block text-[10px] font-bold text-stone-500 mb-1">
                    Taxa Anual CRLV
                  </span>
                  {licensingFinancialStatus === 'lancado' ? (
                    <div className="h-[38px] px-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center space-x-1.5 text-emerald-800 text-xs font-black">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Licenciamento Lançado</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLaunchLicensing}
                      disabled={!licensingValue || parseFloat(licensingValue) <= 0}
                      className="h-[38px] px-3 rounded-xl border border-stone-300 bg-white hover:bg-[#b0d2ed] text-[#000000] text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DollarSign className="w-4 h-4 text-[#000000]" />
                      <span>💰 Lançar Licenciamento</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO 5: MOTORISTAS / OPERADORES (CARD BRANCO) */}
            <div className="p-4 bg-white rounded-xl border border-blue-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold flex items-center space-x-1.5 text-[#000000]" style={{ color: '#000000' }}>
                  <Users className="w-4 h-4 text-[#0963cb]" />
                  <span>Motoristas & Operadores Vinculados (Múltiplos)</span>
                </label>
                <span className="text-[11px] font-semibold text-stone-600">
                  {selectedDriverIds.length} selecionado(s)
                </span>
              </div>

              {/* Chips of selected employees */}
              <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-stone-50 border border-stone-200 rounded-xl">
                {selectedDriverIds.length === 0 ? (
                  <span className="text-xs text-stone-500 italic py-1 px-1">
                    Nenhum motorista ou operador selecionado. Escolha na lista abaixo:
                  </span>
                ) : (
                  selectedDriverIds.map((id) => {
                    const emp = activeEmployees.find(e => e.id === id);
                    if (!emp) return null;
                    return (
                      <span
                        key={emp.id}
                        className="inline-flex items-center space-x-1.5 py-1 px-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[#0963cb] text-xs font-bold shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#0963cb]" />
                        <span>{emp.name}</span>
                        <span className="text-[10px] text-stone-600 font-normal">
                          ({emp.role})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDriver(emp.id)}
                          className="hover:bg-blue-100 rounded-full p-0.5 transition cursor-pointer text-[#0963cb]"
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
                    placeholder="Pesquisar funcionário..."
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                  />
                  {filteredEmployeeSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-stone-100">
                      {filteredEmployeeSuggestions.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleToggleDriver(emp.id)}
                          className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center justify-between text-xs transition cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#000000]">{emp.name}</span>
                            <span className="text-stone-500 text-[11px]">({emp.role})</span>
                          </div>
                          <span className="text-[#0963cb] font-bold flex items-center space-x-1">
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
                            ? 'bg-[#0963cb] text-white border-[#0963cb] font-bold'
                            : 'bg-white border-stone-200 text-[#000000] hover:border-[#0963cb] font-medium'
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

            {/* SEÇÃO 6: MÉDIAS DE CONSUMO AUTOMÁTICAS (CARD BRANCO) */}
            <div className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0963cb] text-white flex items-center justify-center">
                    <Fuel className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#000000]" style={{ color: '#000000' }}>
                      Médias de Consumo de Combustível
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      Calculadas automaticamente com base nos registros de abastecimento
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#0963cb]">
                  Cálculo Automático
                </span>
              </div>

              {/* Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-600">
                      Média por Km (km/L)
                    </span>
                    <div className="text-lg font-black text-[#0963cb] font-['Outfit']">
                      {consumptionMetrics.avgKmPerLiter !== null 
                        ? `${consumptionMetrics.avgKmPerLiter.toLocaleString('pt-BR')} km/L` 
                        : (editingVehicle?.averageConsumptionKmPerLiter 
                            ? `${editingVehicle.averageConsumptionKmPerLiter.toLocaleString('pt-BR')} km/L`
                            : 'Aguardando Abastecimento')}
                    </div>
                  </div>
                  <Gauge className="w-6 h-6 text-[#0963cb]/60" />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-600">
                      Média por Horas (L/h)
                    </span>
                    <div className="text-lg font-black text-amber-600 font-['Outfit']">
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

            {/* SEÇÃO 7: OBSERVAÇÕES (CARD BRANCO) */}
            <div className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-[#000000]" style={{ color: '#000000' }}>
                Observações Adicionais
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-[#000000] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] resize-none shadow-xs"
              />
            </div>

            {/* Actions / Rodapé */}
            <div 
              className="p-4 bg-white rounded-xl border border-blue-200/80 shadow-xs flex items-center justify-end space-x-2.5"
            >
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-[#000000] text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs"
                style={{ color: '#000000' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0963cb] hover:bg-[#074ea3] text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center space-x-2 cursor-pointer active:scale-95"
                style={{ backgroundColor: '#0963cb', color: '#ffffff' }}
              >
                <Save className="w-4 h-4 text-white" />
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

      {/* Modal de Pré-visualização e Impressão Oficial do Veículo */}
      {printOptions && (
        <PrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          options={printOptions}
        />
      )}
    </div>
  );
};
