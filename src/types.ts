export interface CompanyProfile {
  corporateName: string; // Razão Social (ex: silagemteste02)
  tradeName: string; // Nome Fantasia (ex: Silagem Teste 02)
  cnpjCpf: string; // CNPJ / CPF (ex: 578.722.222-2)
  stateRegistration?: string; // Inscrição Estadual
  phone: string; // Telefone de Contato (ex: (22) 22222-2888)
  email: string; // E-mail Comercial (ex: silagemteste02@gmail.com)
  loginEmail?: string; // E-mail de Login
  zipCode: string; // CEP (ex: 85680-000)
  address: string; // Endereço (ex: sem estrada)
  number: string; // Número (ex: sn)
  neighborhood: string; // Bairro (ex: sem bairro)
  city: string; // Cidade (ex: Boa Esperança do Iguaçu)
  state: string; // Estado UF (ex: PR)
  logoUrl?: string; // Logotipo da Empresa (data URL or image URL)
  activitySector?: string; // GESTÃO AGRÍCOLA
  representativeName?: string; // Nome do Representante Responsável
  representativeCpf?: string; // CPF do Representante Responsável
  bankName?: string; // Nome do Banco
  bankAgency?: string; // Agência
  bankAccount?: string; // Conta Corrente
  pixKeyType?: 'cnpj' | 'cpf' | 'email' | 'telefone' | 'aleatoria' | string; // Tipo de Chave PIX
  pixKey?: string; // Chave PIX
}

export type ExpenseStatus = 'pago' | 'pendente' | 'atrasado' | 'agendado';

export type PaymentMethod = 
  | 'pix' 
  | 'boleto' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'transferencia' 
  | 'dinheiro' 
  | 'safra_prazo';

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  isCustom?: boolean;
}

export interface CostCenter {
  id: string;
  name: string;
  type: 'safra' | 'maquinario' | 'talhao' | 'instalacao' | 'geral';
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  supplier: string;
  costCenterId?: string;
  costCenterName?: string;
  machineryId?: string;
  machineryName?: string;
  employeeId?: string;
  employeeName?: string;
  teamId?: string;
  teamName?: string;
  employeeApportionment?: string;
  invoiceNumber?: string;
  receiptUrl?: string; // Data URL or filename
  receiptName?: string;
  notes?: string;
  quantity?: number;
  unit?: string; // 'litros', 'horas', 'unidades', 'sc', 'kg', etc.
  unitPrice?: number;
  nfeItems?: any[]; // Array completo de itens/sub-produtos da NF-e (cProd, xProd, qCom, vUnCom, vProd, etc.)
  isRecurring?: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  farmName: string;
  cpfCnpj?: string;
  zipCode?: string;
  address?: string;
  neighborhood?: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  areaHectares?: number;
  accessRoute?: string;
  cattleType: 'leite' | 'corte' | 'misto' | 'confinamento' | 'outro';
  headCount?: number;
  monthlyDemandTons?: number;
  status: 'lead' | 'contatado' | 'proposta' | 'cliente_ativo' | 'inativo';
  notes?: string;
  totalPurchasedTons?: number;
  totalSpent?: number;
  createdAt: string;
}

export interface SilageOrder {
  id: string;
  orderNumber?: string;
  clientId: string;
  clientName: string;
  farmName: string;
  productType: 'Milho Grão Úmido' | 'Milho Planta Inteira' | 'Sorgo Forrageiro' | 'Capiaçu' | 'Aveia / Azevém';
  tons: number;
  pricePerTon: number;
  totalAmount: number;
  deliveryDate: string;
  freightType: 'CIF' | 'FOB';
  freightCost?: number;
  status: 'orcamento' | 'confirmado' | 'em_entrega' | 'entregue' | 'cancelado';
  paymentStatus: 'pendente' | 'parcial' | 'pago';
  machineryId?: string;
  machineryPlateOrName?: string;
  driverId?: string;
  driverName?: string;
  notes?: string;
  createdAt: string;
}

export interface Machinery {
  id: string;
  name: string;
  model: string;
  brand: string;
  year?: number;
  renavam?: string; // RENAVAM
  color?: string; // Cor do veículo
  ownership?: 'proprio' | 'terceirizado' | 'alugado' | 'arrendado' | string; // Propriedade / Regime
  capacityM3?: number; // Capacidade de Carga / Caçamba em m³
  hourMeter?: number; // Horímetro atual
  currentKm?: number; // Odômetro KM atual
  averageConsumptionLitersPerHour?: number; // Média de consumo calculada em Litros/Hora (L/h)
  averageConsumptionKmPerLiter?: number; // Média de consumo calculada em Km/Litro (km/L)
  licensePlateOrSerial?: string;
  status: 'operacional' | 'em_manutencao' | 'parado' | 'disponivel';
  lastMaintenanceDate?: string;
  operatorOrDriver?: string; // Responsável / Motoristas (texto compilado para compatibilidade)
  assignedDriverIds?: string[]; // IDs dos motoristas/operadores vinculados da lista de funcionários
  assignedDrivers?: string[]; // Nomes dos motoristas/operadores vinculados
  revisionStatus?: string; // Revisão
  reaisNotes?: string;
  accumulatedCost?: number; // Acumulado R$
  categoryType?: 'caminhao' | 'ensiladeira' | 'forrageira' | 'trator' | 'onibus' | 'utilitario' | 'reboque' | 'outro' | string;
  fuelCapacityLiters?: number;
  currentFuelPercentage?: number;
  purchaseDate?: string;
  notes?: string;
  totalFuelExpenses?: number;
  totalMaintenanceExpenses?: number;
  vehicleTypeId?: string;
  customAxleConfig?: VehicleAxleConfig;
  installedTires?: TireItem[];
  lastTireRotationDate?: string;
  lastTireRotationKm?: number;
  lastTireRotationHourMeter?: number;

  // Composição e Tipo Específico
  compositionType?: 'veiculo_simples' | 'cavalo' | 'reboque' | 'outro'; // 'Cavalo', 'Reboque', 'Veículo Simples'
  coupledTrailerId?: string; // ID do reboque engatado (quando for Cavalo)
  coupledTrailerName?: string; // Placa / Identificação do reboque engatado
  vehicleTypeDetailed?: string; // Truck, Bi-trem, Rodotrem, Cavalo Mecânico, etc.

  // Controle de Peso
  taraWeightKg?: number; // Tara (kg) - Peso do veículo vazio
  capacityLoadKg?: number; // Lotação (kg) - Capacidade de carga útil máxima
  grossWeightKg?: number; // PBT (kg) - Peso Bruto Total = Tara + Lotação

  // Identificação e Série (focado em tratores e ensiladeiras sem RENAVAM)
  serialNumber?: string; // Nº de Série do Chassi / Fabricante (totalmente editável)

  // Propriedade & No Nome de Quem
  ownerName?: string; // Razão Social / Nome de quem está no documento
  ownerDocument?: string; // CNPJ ou CPF do titular do documento
  secondaryOwnerName?: string; // Segundo Proprietário / Sócio (se houver)
  secondaryOwnerDocument?: string; // CNPJ ou CPF do segundo titular

  // Controle de Compra, Nota Fiscal e Financiamento
  purchaseInvoiceNumber?: string; // Número da Nota Fiscal de Compra
  purchaseInvoiceKey?: string; // Chave de Acesso da NF-e
  purchaseValue?: number; // Valor de Compra do Veículo (R$)
  purchaseSupplier?: string; // Fornecedor / Concessionária / Vendedor
  purchaseInvoiceAttachment?: { name: string; url?: string; uploadedAt?: string };
  isFinancedOrInstallments?: boolean; // Compra parcelada / Financiamento
  installmentsCount?: number; // Quantidade de parcelas
  installmentValue?: number; // Valor de cada parcela (R$)
  firstInstallmentDueDate?: string; // Data de vencimento da 1ª parcela
  financialInstitution?: string; // Banco ou Instituição Financeira
  installmentsGenerated?: boolean; // Indicador se as parcelas já foram incluídas no Contas a Pagar
}

export interface EmployeeAttachment {
  name: string;
  url?: string;
  fileData?: string; // base64 or object URL
  uploadedAt?: string;
  size?: number;
}

export type EmployeeRole = 
  | 'Operador de Ensiladeira'
  | 'Operador de forrageira'
  | 'Operador de trator'
  | 'Tratorista'
  | 'Motorista de Caminhão'
  | 'Motorista'
  | 'Auxiliar'
  | 'Administrador'
  | 'Mecanico Especialista'
  | 'mecanico_especialista'
  | 'Mecânico'
  | string;

export type Cargo = EmployeeRole;

export type EmployeeRegistrationType = 
  | 'Funcionário' 
  | 'Prestador de Serviço' 
  | 'Operador de Máquinas' 
  | 'Motorista' 
  | 'Diarista / Safrista' 
  | 'Mecanico Especialista' 
  | 'mecanico_especialista' 
  | string;

export interface Employee {
  id: string;
  name: string;
  registrationType?: EmployeeRegistrationType;
  role: EmployeeRole; // 'Operador de Ensiladeira', 'Tratorista', 'Motorista de Caminhão', 'Mecânico', 'Mecanico Especialista', etc.
  cpf?: string;
  rg?: string; // Número do RG
  birthDate?: string; // Data de Nascimento
  pis?: string; // Número do PIS
  photoUrl?: string; // Foto de perfil
  phone: string;
  baseSalary?: number; // Salário Base (R$)
  contractType?: 'Registrado (CLT)' | 'Diarista / Safrista' | 'PJ / Prestador de Serviço' | 'Autônomo' | 'Comissionado' | string;
  admissionDate?: string; // Data de Admissão
  terminationDate?: string; // Data de Demissão
  active?: boolean; // Funcionário ativo (toggle)
  receivesCommission?: boolean; // Recebe comissão (toggle)
  commissionPerHour?: number; // Por hora (R$/h)
  commissionPerAlqueire?: number; // Por alqueire (R$/alq)
  commissionPerHectare?: number; // Por hectare (R$/ha)
  cnhNumber?: string;
  cnhCategory?: string; // 'A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'
  cnhExpiration?: string; // YYYY-MM-DD
  cnhUpgradeDT?: boolean; // Opção para "Melhorar categoria (DT)"
  cnhUpgradeCategory?: string; // Ex: 'A', 'A + C', 'A + D', 'A + E', 'C', 'D', 'E'
  status: 'ativo' | 'ferias' | 'afastado' | 'inativo';
  salary?: number;
  teamId?: string; // ID da equipe à qual pertence (ex: 'team_maq_02')
  
  // Informações Financeiras / Pagamento
  paymentLocation?: string; // Local de Recebimento
  bankPixKey?: string; // Banco / Chave PIX
  bankAgency?: string; // Agência (Ag.)
  bankAccount?: string; // Conta Corrente (C.C.)

  // Anexos de Retorno e Documentos
  admissionExamDoc?: EmployeeAttachment; // Exame Admissional
  experienceContractDoc?: EmployeeAttachment; // Contrato de Experiência
  generalDocs?: EmployeeAttachment; // Documentos Gerais (RE + CNH)
  signedRegistrationDoc?: EmployeeAttachment; // Cadastro Assinado (Ficha com assinatura)
}

export interface FleetTeam {
  id: string;
  name: string; // Ex: 'Maq 02', 'Maq 03', 'Maq 04', 'Maq 05', 'Equipe Silagem 01'
  headerBgColor: string; // Cor do cabeçalho da coluna
  columnBgColor: string; // Cor de fundo da coluna
  borderColor?: string;
  machineryId?: string; // Máquina vinculada (opcional)
  machineryName?: string;
  leaderId?: string; // Líder / Encarregado
  notes?: string;
  order?: number;
  createdAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  category: string; // 'Combustível', 'Peças & Oficinas', 'Sementes & Insumos', 'Lonas & Embalagens'
  cnpjOrCpf?: string;
  stateRegistration?: string;
  phone: string;
  email?: string;
  zipCode?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'combustivel' | 'lona_embalagem' | 'inoculante' | 'sementes' | 'adubo' | 'pecas' | 'outro';
  quantity: number;
  unit: string;
  minQuantity: number;
  unitCost: number;
  location?: string;
  code?: string;
  fiscalName?: string;
  barcode?: string;
  profitMargin?: number;
  salePrice?: number;
  maxQuantity?: number;
}

export interface ServiceOrder {
  id: string;
  orderNumber?: string;
  clientName: string;
  clientId?: string;
  farmName?: string;
  serviceType: 'Ensilagem' | 'Colheita' | 'Plantio' | 'Pulverização' | 'Preparo de Solo' | 'Compactação de Silo' | 'Transporte / Frete' | string;
  serviceTab?: string;
  areaHectares?: number;
  tonsEstimated?: number;
  densityKg?: number; // Peso por m³ (Kg) da silagem para cubagem
  weightPerM3Kg?: number; // Peso por m³ (Kg)
  ratePerUnit: number;
  totalAmount: number;
  startDate: string;
  completionDate?: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  machineryId?: string;
  machineryAssigned?: string;
  operatorId?: string;
  operatorAssigned?: string;
  driverId?: string;
  driverName?: string;
  fuelCostAllocated?: number;
  driverCostAllocated?: number;
  notes?: string;

  // Unidade de Área e Valores Base
  areaUnit?: 'hectares' | 'alqueires' | 'hora';
  areaQuantity?: number;
  ratePerAreaUnit?: number;
  baseServiceAmount?: number;
  subtotalArea?: number;

  // Trator / Máquina
  tractorId?: string;
  tractorName?: string;
  tractorOperatorId?: string;
  tractorOperatorName?: string;
  tractorSecondOperatorId?: string;
  tractorSecondOperatorName?: string;
  tractorCalculationMode?: 'horas' | 'area';
  tractorBillingMode?: 'horas' | 'area';
  tractorHours?: number;
  tractorRatePerHour?: number;
  tractorTotalAmount?: number;
  tractorOperatorCommissionMode?: 'horas' | 'area' | 'livre';
  tractorOperatorHours?: number;
  tractorOperatorCommissionRate?: number;
  tractorOperatorCommission?: number;

  // Forrageira / Ensiladeira
  forageHarvesterId?: string;
  forageHarvesterName?: string;
  forageOperatorId?: string;
  forageOperatorName?: string;
  forageSecondOperatorId?: string;
  forageSecondOperatorName?: string;
  forageDrumHours?: number; // Hora do Tambor (H)
  forageEngineHours?: number; // Hora do Motor (H)
  forageCommissionMode?: 'tambor' | 'motor' | 'area' | 'livre'; // Modalidade de comissão da forrageira
  forageCommissionBase?: number; // Base livre da comissão da forrageira
  forageCommissionRate?: number; // Taxa R$ da comissão da forrageira
  forageRatePerHour?: number;
  forageTotalAmount?: number;
  forageOperatorCommission?: number;

  // Frotas / Caminhões
  trucks?: ServiceTruckItem[];
  truckFleetPercentage?: number; // % de distribuição para frotas/caminhões (ex: 10%)
  truckFleetTotalDistributed?: number;
  truckFleetHourlyTotal?: number; // Total cobrado do cliente por horas de frotas (quando Hectares)
  trucksTotalKmAdditional?: number;

  // Frete Prancha
  fretePrancha?: number;
  flatbedFreight?: number;

  // Consumo de Combustível e Alimentação
  fuelEntries?: ServiceFuelEntry[];
  totalFuelCost?: number;
  mealExpenses?: ServiceMealExpense[];
  totalMealCost?: number;

  // Fechamento e DRE da Operação
  totalExpenses?: number; // Total Geral Despesas (comissões e custos adicionais)
  estimatedProfit?: number; // Resultado Final (Lucro Estimado)
}

export interface ServiceFuelEntry {
  vehicleId: string;
  vehicleType: 'forrageira' | 'trator' | 'caminhao' | 'outro';
  vehicleName: string;
  liters: number | '';
  pricePerLiter: number | '';
  subtotal: number;
}

export interface ServiceMealExpense {
  id: string;
  description: string; // ex: 'Café da manhã', 'Almoço', 'Janta', 'Diária'
  date: string; // YYYY-MM-DD
  amount: number | '';
}

export interface ServiceTruckItem {
  id: string;
  machineryId?: string;
  truckName?: string;
  plate?: string;
  primaryDriverId?: string;
  primaryDriverName?: string;
  secondaryDriverId?: string;
  secondaryDriverName?: string;
  capacityM3?: number;
  tripLoads?: number; // Nº de Cargas
  totalM3?: number; // Calculado (Capacidade x Cargas)
  driverHours?: number; // Horas motorista
  driverHourSource?: 'tambor' | 'motor' | 'manual'; // 'Usar Tambor' / 'Usar Motor'
  additionalKm?: number; // KM Adicional (quando Alqueires)
  ratePerKm?: number; // R$ / KM
  totalAdditionalKm?: number; // Total Adicional KM (calculado)
  truckHours?: number; // Horas Trabalhadas do Caminhão (modalidade Hectares)
  truckHourlyRate?: number; // Valor por Hora (R$) do Caminhão cobrado do cliente (modalidade Hectares)
  truckTotalCost?: number; // Custo calculado: Horas Trabalhadas * Valor por Hora
  driverCommissionMode?: 'horas' | 'cargas' | 'livre'; // Modo de comissão do motorista
  driverCommissionBase?: number | ''; // Base livre digitada quando modo é 'livre'
  driverCommissionRate?: number; // R$/hora ou R$/carga
  driverCommission?: number; // Comissão informativa do motorista
  distributedValue?: number; // Valor proporcional m³ da distribuição da frota
  ratioPercent?: number; // % de participação no volume total da frota
}

export interface CropSeason {
  id: string;
  name: string; // Ex: "Safra Verão 2025/2026"
  crop: string; // "Milho", "Sorgo"
  plantedHectares: number;
  estimatedTons: number;
  harvestedTons?: number;
  status: 'planejamento' | 'plantio' | 'desenvolvimento' | 'colheita' | 'finalizada';
  startDate: string;
  endDate?: string;
}

export interface FuelLog {
  id: string;
  date: string; // YYYY-MM-DD
  machineryId: string;
  machineryPlateOrName: string;
  fuelType: 'Diesel S10' | 'Diesel Comum' | 'Arla 32' | 'Gasolina' | 'Etanol';
  liters: number;
  pricePerLiter: number;
  totalAmount: number;
  currentHourMeterOrKm: number;
  previousHourMeterOrKm?: number;
  currentKm?: number;
  previousKm?: number;
  currentHourMeter?: number;
  previousHourMeter?: number;
  averageCalculated?: number; // km/L ou L/h geral
  averageKmPerLiter?: number; // Média calculada desta abastecida em km/L
  averageLitersPerHour?: number; // Média calculada desta abastecida em L/h
  driverOrOperator?: string;
  driverIds?: string[];
  supplierStation?: string; // Posto / Fazenda
  notes?: string;
  expenseId?: string; // Linked financial expense
  createdAt: string;
}

export type MaintenanceLocation = 'estrada' | 'roca' | 'oficina_interna' | 'oficina_externa';

export interface MaintenanceCategoryDefinition {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isSystem?: boolean;
}

export type MaintenanceExecutorType = 
  | 'equipe_propria' 
  | 'mecanico_interno' 
  | 'mecanico_campo' 
  | 'mecanica_terceirizada';

export interface MaintenancePartItem {
  id: string;
  description: string;
  origin: 'almoxarifado_interno' | 'externo_compra' | 'recuperada_externa';
  inventoryItemId?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplierId?: string;
  supplierName?: string;
  serviceProvider?: string;
  invoiceNumber?: string;
  requiresPurchase?: boolean;
  serviceDescription?: string;
  externalServiceCost?: number;
}

export interface MaintenanceLaborItem {
  id: string;
  description?: string;
  employeeId?: string;
  executorType?: MaintenanceExecutorType;
  mechanicName?: string;
  hours?: number;
  hourlyRate?: number;
  totalCost: number;
  date?: string; // Data em que as horas foram trabalhadas
  dataLancamento?: string; // Data do lançamento das horas
}

export interface MaintenanceNfeLink {
  nfeNumber?: string;
  nfeSeries?: string;
  nfeAccessKey?: string;
  issueDate?: string;
  supplierCnpj?: string;
  supplierName?: string;
  totalNfeAmount?: number;
  xmlFileName?: string;
}

export interface MaintenanceFinancialConditions {
  createAccountsPayable: boolean;
  paymentTerm: 'a_vista' | '15_dias' | '30_dias' | '30_60_dias' | '30_60_90_dias' | 'safra_prazo' | 'personalizado';
  paymentMethod: PaymentMethod;
  installmentsCount?: number;
  firstDueDate: string;
  supplierName?: string;
  notes?: string;
}

export interface MaintenancePurchaseRequest {
  id: string;
  osId: string;
  osNumber?: string;
  vehicleId?: string;
  vehiclePlateOrName: string;
  status: 'cotacao' | 'aprovado' | 'comprado' | 'entregue';
  urgency: 'baixa' | 'media' | 'alta' | 'urgente_veiculo_parado';
  items: {
    description: string;
    quantity: number;
    unit: string;
    estimatedCost?: number;
    estimatedUnitCost?: number;
    suggestedSupplier?: string;
  }[];
  requestedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  osNumber?: string; // Ex: OS-2026-0012
  date: string; // YYYY-MM-DD
  completionDate?: string; // Previsão de Término / Conclusão (Data)
  machineryId: string;
  machineryPlateOrName: string;
  type: 'preventiva' | 'corretiva' | 'preditiva' | 'revisao_periodica' | 'reforma_entressafra';
  serviceCategory: 
    | 'Troca de Óleo & Filtros'
    | 'Facas & Contra-Faca (Ensiladeira)'
    | 'Pneus, Rodas & Esteiras'
    | 'Motor & Transmissão'
    | 'Sistema Hidráulico'
    | 'Freios & Embreagem'
    | 'Elétrica & Ar-Condicionado'
    | 'Solda, Funilaria & Estrutura'
    | 'Outro'
    | string;
  location?: MaintenanceLocation; // Estrada, Roça (Campo), Oficina Interna, Oficina Externa
  locationDetails?: string; // ex: Fazenda Boa Vista - Talhão 4
  executorType?: MaintenanceExecutorType; // Interno: Equipe Própria / Mecânico Interno; Externo: Mecânico em Campo / Mecânica Terceirizada
  executorName?: string; // Nome do mecânico/operador/oficina
  description: string;
  workshopOrMechanic: string;
  partsOriginSummary?: 'almoxarifado' | 'externo' | 'misto' | 'sem_pecas';
  partsItems?: MaintenancePartItem[];
  laborItems?: MaintenanceLaborItem[];
  partsCost: number;
  laborCost: number;
  totalCost: number;
  currentHourMeterOrKm: number;
  nextServiceDueHourMeterOrKm?: number;
  status: 'concluida' | 'em_andamento' | 'agendada' | 'aguardando_pecas' | 'cancelada';
  nfeLink?: MaintenanceNfeLink;
  financialConditions?: MaintenanceFinancialConditions;
  purchaseRequestId?: string;
  stockDeducted?: boolean;
  expenseIds?: string[];
  notes?: string;
  expenseId?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountType: 'corrente' | 'poupanca' | 'aplicacao' | 'caixa_fisico';
  agency?: string;
  accountNumber?: string;
  balance: number;
  pixKey?: string;
  color?: string;
}

export interface ThirdPartySettlement {
  id: string;
  thirdPartyName: string;
  role: 'Freteiro / Caminhão' | 'Operador Terceirizado' | 'Prestador de Serviço' | 'Aluguel de Máquina';
  date: string;
  description: string;
  tons?: number;
  trips?: number;
  hours?: number;
  rate: number;
  totalAmount: number;
  deductions?: number;
  netAmount: number;
  status: 'pendente' | 'pago' | 'parcial';
  machineryPlateOrName?: string;
  phone?: string;
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  referenceMonth: string; // MM/YYYY (ex: '09/2026')
  baseSalary: number;
  overtimeHours?: number;
  overtimeAmount: number; // Horas extras / diárias de safra
  bonusAmount: number; // Insalubridade, bônus safra, etc.
  inssDiscount: number;
  advancesDiscount: number; // Vales e adiantamentos descontados
  otherDiscounts: number; // Faltas, atrasos, convênios
  netSalary: number;
  status: 'pendente' | 'pago';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
}

export interface VacationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  acquisitionPeriodStart?: string;
  acquisitionPeriodEnd?: string;
  startDate: string;
  endDate: string;
  daysCount: number; // 30, 20, etc.
  sellDaysCount: number; // Abono pecuniário (dias vendidos, ex: 10)
  baseSalary: number;
  oneThirdBonus: number; // 1/3 Constitucional
  pecuniaryAllowance: number; // Valor do abono pecuniário
  thirteenthAdvance: boolean; // Adiantamento de 50% do 13º
  thirteenthAmount?: number;
  totalAmount: number;
  status: 'agendado' | 'em_gozo' | 'concluido' | 'cancelado';
  notes?: string;
  createdAt: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Atestado Médico' | 'Acidente de Trabalho (CAT)' | 'Licença Maternidade/Paternidade' | 'Auxílio Doença / INSS' | 'Licença Não Remunerada' | 'Outro';
  startDate: string;
  endDate?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  daysCount: number;
  cid?: string;
  doctorName?: string;
  status: 'ativo' | 'finalizado';
  notes?: string;
  createdAt: string;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceMonth: string; // MM/YYYY (ex: '09/2026')
  status: 'pendente' | 'descontado';
  reason?: string;
  notes?: string;
  createdAt: string;
}

// ==========================================
// MÓDULO DE PNEUS E RODÍZIO DA FROTA
// ==========================================

export type AxleTireType = 'single' | 'dual';
export type AxleFunction = 'direcional' | 'tracao' | 'truck_livre' | 'agricola_dianteiro' | 'agricola_traseiro' | 'reboque';

export interface AxleDefinition {
  axleNumber: number; // 1, 2, 3, etc.
  name: string; // "1º Eixo (Dianteiro/Direcional)", "2º Eixo (Tração)", etc.
  type: AxleTireType; // 'single' (2 pneus) ou 'dual' (4 pneus)
  function: AxleFunction;
  tirePositions: string[]; // ex: ['1E', '1D'] ou ['2EE', '2EI', '2DI', '2DD']
}

export interface VehicleAxleConfig {
  code: string;
  name: string;
  totalAxles: number;
  totalTires: number;
  axles: AxleDefinition[];
}

export interface VehicleTypeDefinition {
  id: string;
  name: string;
  categoryKey: string;
  defaultAxleConfig: VehicleAxleConfig;
  isCustom?: boolean;
  description?: string;
}

export type TireCondition = 'novo' | 'excelente' | 'bom' | 'atencao' | 'critico' | 'descarte';

export type TireStatus = 'em_uso' | 'estoque' | 'estepe' | 'reforma' | 'descartado';

export interface TireItem {
  id: string;
  position: string; // '1E', '1D', '2EE', '2EI', '2DI', '2DD', '3EE', '3EI', '3DI', '3DD', 'estoque', 'reforma', etc.
  positionName: string;
  fireNumber: string; // Código de Fogo / Matrícula (ex: 'P-104' ou '#0442')
  brand: string; // 'Michelin', 'Pirelli', 'Bridgestone', 'Goodyear', etc.
  model?: string;
  size?: string; // '295/80 R22.5', '710/70 R38', etc.
  treadDepthMm: number; // Sulco atual em mm (ex: 12.5)
  originalTreadDepthMm?: number; // Sulco original novo em mm (ex: 18.0)
  pressurePsi?: number; // Pressão em PSI (ex: 110)
  status: TireStatus;
  currentKm?: number;
  retreadCount?: number; // 0 = Novo, 1 = 1ª Recapagem, 2 = 2ª Recapagem
  installationKm?: number;
  installationHourMeter?: number;
  installationDate?: string;
  notes?: string;
  // Informações de Reforma / Recape
  reformWorkshop?: string;
  reformSentDate?: string;
  reformCost?: number;
  // Informações de Descarte / Baixa
  discardReason?: string;
  discardDate?: string;
  discardNotes?: string;
  discardedBy?: string;
}

export type RotationPatternType = 
  | 'mesmo_eixo'        // Inversão de lado no mesmo eixo (paralelo)
  | 'cruzado_x'          // Cruzado em X (Dianteira cruza com Traseira)
  | 'eixos_diferentes'   // Direto Frente <-> Traseira (mesmo lado)
  | 'tracao_duplo'       // Rodízio Interno x Externo nos eixos de tração
  | 'personalizado';     // Troca livre / manual

export interface TireMovement {
  tireId?: string;
  fireNumber: string;
  fromPosition: string;
  toPosition: string;
  treadDepthMm?: number;
}

export interface TireRotationLog {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  date: string;
  kmAtRotation?: number;
  hourMeterAtRotation?: number;
  rotationType: RotationPatternType;
  rotationTypeName: string;
  operatorName?: string;
  serviceProvider?: string;
  cost?: number;
  tireMovements: TireMovement[];
  inspections?: { position: string; fireNumber: string; treadDepthMm: number; pressurePsi?: number }[];
  notes?: string;
  createdAt: string;
}


