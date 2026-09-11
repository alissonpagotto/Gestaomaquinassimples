import React, { useState, useEffect } from 'react';
import { 
  Expense, 
  ExpenseCategory, 
  CostCenter, 
  Client, 
  SilageOrder, 
  Machinery, 
  CropSeason,
  Employee,
  FleetTeam,
  Supplier,
  InventoryItem,
  ServiceOrder,
  FuelLog,
  MaintenanceLog,
  ExpenseStatus,
  CompanyProfile,
  BankAccount,
  ThirdPartySettlement,
  PayrollRecord,
  VacationRecord,
  LeaveRecord,
  SalaryAdvance
} from './types';
import { 
  getStoredExpenses, 
  saveStoredExpenses,
  getStoredCategories,
  saveStoredCategories,
  getStoredCostCenters,
  saveStoredCostCenters,
  getStoredClients,
  saveStoredClients,
  getStoredOrders,
  saveStoredOrders,
  getStoredMachineries,
  saveStoredMachineries,
  getStoredSeasons,
  saveStoredSeasons,
  getStoredEmployees,
  saveStoredEmployees,
  getStoredFleetTeams,
  saveStoredFleetTeams,
  getStoredSuppliers,
  saveStoredSuppliers,
  getStoredInventory,
  saveStoredInventory,
  getStoredServices,
  saveStoredServices,
  getStoredFuelLogs,
  saveStoredFuelLogs,
  getStoredMaintenanceLogs,
  saveStoredMaintenanceLogs,
  getStoredCompanyProfile,
  saveStoredCompanyProfile,
  getStoredBankAccounts,
  saveStoredBankAccounts,
  getStoredSettlements,
  saveStoredSettlements,
  getStoredPayrolls,
  saveStoredPayrolls,
  getStoredVacations,
  saveStoredVacations,
  getStoredLeaves,
  saveStoredLeaves,
  getStoredSalaryAdvances,
  saveStoredSalaryAdvances,
  resetAllSystemData,
  formatCurrencyBRL
} from './lib/storage';
import { useConfirm } from './context/ConfirmContext';


import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MainDashboard } from './components/dashboard/MainDashboard';

import { PlusCircle, Sparkles } from 'lucide-react';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { ExpenseReceiptViewer } from './components/expenses/ExpenseReceiptViewer';
import { ExpenseCategoriesModal } from './components/expenses/ExpenseCategoriesModal';
import { AiExpenseParserModal } from './components/ai/AiExpenseParserModal';

import { CrmModule } from './components/crm/CrmModule';
import { ClientModal } from './components/crm/ClientModal';
import { OrderModal } from './components/crm/OrderModal';
import { OrdersList } from './components/crm/OrdersList';

import { FinancialSummary } from './components/financial/FinancialSummary';
import { NfeModule } from './components/nfe/NfeModule';
import { FleetModule } from './components/fleet/FleetModule';
import { EmployeesModule } from './components/employees/EmployeesModule';
import { RHModule } from './components/rh/RHModule';
import { ServicesModule } from './components/services/ServicesModule';
import { VendaModule } from './components/vendas/VendaModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { SuppliersModule } from './components/suppliers/SuppliersModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { CompanySettingsView } from './components/settings/CompanySettingsView';

import { QuickMemoModal } from './components/quick/QuickMemoModal';
import { TrialInfoModal } from './components/quick/TrialInfoModal';
import { LovableIntegrationModal } from './components/integration/LovableIntegrationModal';
import { useAuth } from './context/AuthContext';
import { uploadAllDataToFirestore, fetchAllDataFromFirestore } from './lib/firebaseSync';

export default function App() {
  // State Initialization from LocalStorage
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredExpenses());
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => getStoredCategories());
  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => getStoredCostCenters());
  const [clients, setClients] = useState<Client[]>(() => getStoredClients());
  const [orders, setOrders] = useState<SilageOrder[]>(() => getStoredOrders());
  const [machineries, setMachineries] = useState<Machinery[]>(() => getStoredMachineries());
  const [seasons, setSeasons] = useState<CropSeason[]>(() => getStoredSeasons());
  const [employees, setEmployees] = useState<Employee[]>(() => getStoredEmployees());
  const [fleetTeams, setFleetTeams] = useState<FleetTeam[]>(() => getStoredFleetTeams());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredSuppliers());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStoredInventory());
  const [services, setServices] = useState<ServiceOrder[]>(() => getStoredServices());
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => getStoredFuelLogs());
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => getStoredMaintenanceLogs());
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => getStoredCompanyProfile());
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => getStoredBankAccounts());
  const [settlements, setSettlements] = useState<ThirdPartySettlement[]>(() => getStoredSettlements());
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(() => getStoredPayrolls());
  const [vacations, setVacations] = useState<VacationRecord[]>(() => getStoredVacations());
  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => getStoredLeaves());
  const [advances, setAdvances] = useState<SalaryAdvance[]>(() => getStoredSalaryAdvances());

  const { confirm } = useConfirm();
  const { currentUser, setIsSyncing, setLastSyncedAt } = useAuth();

  const handleSyncFirebase = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await uploadAllDataToFirestore(currentUser.uid, {
        expenses,
        clients,
        orders,
        machineries,
        services,
        companyProfile
      });
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Failed to sync to Firebase:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // When user logs in, if cloud data exists, fetch it and populate
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    (async () => {
      try {
        const cloudData = await fetchAllDataFromFirestore(currentUser.uid);
        if (cloudData && isMounted) {
          if (cloudData.expenses?.length > 0) {
            setExpenses(prev => {
              const existingIds = new Set(prev.map(e => e.id));
              const newItems = cloudData.expenses.filter(e => !existingIds.has(e.id));
              return [...prev, ...newItems];
            });
          }
          if (cloudData.clients?.length > 0) {
            setClients(prev => {
              const existingIds = new Set(prev.map(c => c.id));
              const newItems = cloudData.clients.filter(c => !existingIds.has(c.id));
              return [...prev, ...newItems];
            });
          }
          if (cloudData.orders?.length > 0) {
            setOrders(prev => {
              const existingIds = new Set(prev.map(o => o.id));
              const newItems = cloudData.orders.filter(o => !existingIds.has(o.id));
              return [...prev, ...newItems];
            });
          }
          if (cloudData.machineries?.length > 0) {
            setMachineries(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const newItems = cloudData.machineries.filter(m => !existingIds.has(m.id));
              return [...prev, ...newItems];
            });
          }
          setLastSyncedAt(new Date());
        }
      } catch (e) {
        console.error('Error fetching initial cloud data:', e);
      }
    })();
    return () => { isMounted = false; };
  }, [currentUser?.uid]);

  const handleSaveBankAccounts = (newAccounts: BankAccount[]) => {

    setBankAccounts(newAccounts);
    saveStoredBankAccounts(newAccounts);
  };

  const handleSaveSettlements = (newSettlements: ThirdPartySettlement[]) => {
    setSettlements(newSettlements);
    saveStoredSettlements(newSettlements);
  };

  const handleSavePayrolls = (newPayrolls: PayrollRecord[]) => {
    setPayrolls(newPayrolls);
    saveStoredPayrolls(newPayrolls);
  };

  const handleSaveVacations = (newVacations: VacationRecord[]) => {
    setVacations(newVacations);
    saveStoredVacations(newVacations);
  };

  const handleSaveLeaves = (newLeaves: LeaveRecord[]) => {
    setLeaves(newLeaves);
    saveStoredLeaves(newLeaves);
  };

  const handleSaveAdvances = (newAdvances: SalaryAdvance[]) => {
    setAdvances(newAdvances);
    saveStoredSalaryAdvances(newAdvances);
  };

  // Active Navigation Tab (Defaults to 'dashboard' matching the requested view)
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // UI state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('silagem_facil_theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<Expense | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isAiParserOpen, setIsAiParserOpen] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isQuickMemoOpen, setIsQuickMemoOpen] = useState(false);
  const [isTrialInfoOpen, setIsTrialInfoOpen] = useState(false);

  // Apply dark mode class to html
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('silagem_facil_theme', 'dark');
      } catch (err) {
        console.error(err);
      }
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('silagem_facil_theme', 'light');
      } catch (err) {
        console.error(err);
      }
    }
  }, [isDarkMode]);

  // Sync to localStorage
  useEffect(() => { saveStoredExpenses(expenses); }, [expenses]);
  useEffect(() => { saveStoredCategories(categories); }, [categories]);
  useEffect(() => { saveStoredCostCenters(costCenters); }, [costCenters]);
  useEffect(() => { saveStoredClients(clients); }, [clients]);
  useEffect(() => { saveStoredOrders(orders); }, [orders]);
  useEffect(() => { saveStoredMachineries(machineries); }, [machineries]);
  useEffect(() => { saveStoredSeasons(seasons); }, [seasons]);
  useEffect(() => { saveStoredEmployees(employees); }, [employees]);
  useEffect(() => { saveStoredFleetTeams(fleetTeams); }, [fleetTeams]);
  useEffect(() => { saveStoredSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { saveStoredInventory(inventory); }, [inventory]);
  useEffect(() => { saveStoredServices(services); }, [services]);
  useEffect(() => { saveStoredFuelLogs(fuelLogs); }, [fuelLogs]);
  useEffect(() => { saveStoredMaintenanceLogs(maintenanceLogs); }, [maintenanceLogs]);
  useEffect(() => { saveStoredCompanyProfile(companyProfile); }, [companyProfile]);

  // Reload everything when imported from backup
  const handleDataReload = () => {
    setExpenses(getStoredExpenses());
    setCategories(getStoredCategories());
    setCostCenters(getStoredCostCenters());
    setClients(getStoredClients());
    setOrders(getStoredOrders());
    setMachineries(getStoredMachineries());
    setSeasons(getStoredSeasons());
    setEmployees(getStoredEmployees());
    setFleetTeams(getStoredFleetTeams());
    setSuppliers(getStoredSuppliers());
    setInventory(getStoredInventory());
    setServices(getStoredServices());
    setFuelLogs(getStoredFuelLogs());
    setMaintenanceLogs(getStoredMaintenanceLogs());
    setCompanyProfile(getStoredCompanyProfile());
  };

  const handleResetAllData = () => {
    resetAllSystemData();
    setExpenses([]);
    setClients([]);
    setOrders([]);
    setMachineries([]);
    setEmployees([]);
    setFleetTeams([]);
    setSuppliers([]);
    setInventory([]);
    setServices([]);
    setFuelLogs([]);
    setMaintenanceLogs([]);
    setBankAccounts([]);
    setSettlements([]);
    setPayrolls([]);
    setVacations([]);
    setLeaves([]);
    setAdvances([]);
  };

  // Expense Handlers
  const handleSaveExpense = (newOrUpdated: Expense | Expense[]) => {
    if (Array.isArray(newOrUpdated)) {
      setExpenses((prev) => [...newOrUpdated, ...prev]);
    } else {
      setExpenses((prev) => {
        const index = prev.findIndex((e) => e.id === newOrUpdated.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = newOrUpdated;
          return updated;
        }
        return [newOrUpdated, ...prev];
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Despesa',
      message: 'Deseja realmente excluir este lançamento de despesa do sistema?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleToggleExpenseStatus = (id: string, newStatus: ExpenseStatus) => {
    const today = new Date().toISOString().split('T')[0];
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: newStatus,
              paymentDate: newStatus === 'pago' ? (e.paymentDate || today) : undefined,
            }
          : e
      )
    );
  };

  const handleDuplicateExpense = (expense: Expense) => {
    const duplicated: Expense = {
      ...expense,
      id: `exp_${Date.now()}_copy`,
      description: `${expense.description} (Cópia)`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [duplicated, ...prev]);
  };

  // Client Handlers
  const handleSaveClient = (client: Client) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = client;
        return updated;
      }
      return [client, ...prev];
    });
  };

  const handleDeleteClient = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Cliente / Produtor',
      message: 'Deseja realmente excluir este produtor da sua base CRM?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleUpdateClientStatus = (clientId: string, status: Client['status']) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, status } : c))
    );
  };

  // Order Handlers
  const handleSaveOrder = (order: SilageOrder) => {
    setOrders((prev) => [order, ...prev]);
  };

  const handleDeleteOrder = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Pedido',
      message: 'Deseja realmente excluir este pedido de silagem do sistema?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
  };


  const handleUpdateOrderStatus = (id: string, status: SilageOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  };

  const handleUpdatePaymentStatus = (id: string, paymentStatus: SilageOrder['paymentStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, paymentStatus } : o))
    );
  };

  return (
    <div className="min-h-screen bg-blue-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-blue-200 selection:text-blue-900">
      
      {/* Left Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        companyProfile={companyProfile}
      />

      {/* Backdrop for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Body Area with left padding for desktop sidebar */}
      <div 
        style={{ backgroundColor: '#16438e' }}
        className="lg:pl-64 flex flex-col flex-1 min-h-screen bg-[#16438e] dark:bg-stone-950"
      >
        
        {/* Top Bar with Trial Notice and Horizontal Pill Carousel */}
        <TopBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenQuickMemo={() => setIsQuickMemoOpen(true)}
          onOpenTrialInfo={() => setIsTrialInfoOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main 
          id="crm-main-content"
          className={`flex-1 p-3 sm:p-4 lg:p-5 w-full ${
            ['frotas', 'veiculos', 'manutencoes', 'combustivel', 'motoristas', 'equipe', 'rodizio', 'rodizio_pneus'].includes(activeTab)
              ? 'max-w-none px-2 sm:px-4 lg:px-6'
              : 'max-w-7xl mx-auto'
          }`}
        >
          
          {/* TAB 1: Main Dashboard (Matching Screenshot) */}
          {activeTab === 'dashboard' && (
            <MainDashboard
              expenses={expenses}
              clients={clients}
              machineries={machineries}
              employees={employees}
              orders={orders}
              services={services}
              inventory={inventory}
              onNavigate={(tab) => setActiveTab(tab)}
              onNewExpense={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              onOpenAiParser={() => setIsAiParserOpen(true)}
              onOpenIntegration={() => setIsIntegrationModalOpen(true)}
            />
          )}

          {/* TAB: Serviços de Silagem & Colheita */}
          {activeTab === 'servicos' && (
            <ServicesModule
              services={services}
              machineries={machineries}
              employees={employees}
              clients={clients}
              companyProfile={companyProfile}
              onSaveServices={setServices}
              onSaveClients={setClients}
            />
          )}

          {/* TAB: Venda (Vendas Agrícolas, Fornecimento de Silagem e Contratos) */}
          {(activeTab === 'venda' || activeTab === 'vendas') && (
            <VendaModule
              services={services}
              machineries={machineries}
              employees={employees}
              clients={clients}
              companyProfile={companyProfile}
              onSaveServices={setServices}
              onSaveClients={setClients}
            />
          )}

          {/* TAB: Estoque & Insumos */}
          {activeTab === 'estoque' && (
            <InventoryModule
              inventory={inventory}
              onSaveInventory={setInventory}
            />
          )}

          {/* TAB: Financeiro (Consolidado, Despesas, Contas, A Pagar, A Receber, Acertos, Exportar) */}
          {(activeTab === 'financeiro' || activeTab === 'despesas') && (
            <FinancialSummary
              expenses={expenses}
              orders={orders}
              seasons={seasons}
              services={services}
              bankAccounts={bankAccounts}
              settlements={settlements}
              categories={categories}
              costCenters={costCenters}
              employees={employees}
              fleetTeams={fleetTeams}
              machineries={machineries}
              companyProfile={companyProfile}
              initialSubTab={activeTab === 'despesas' ? 'despesas' : undefined}
              onSaveBankAccounts={handleSaveBankAccounts}
              onSaveSettlements={handleSaveSettlements}
              onToggleExpenseStatus={handleToggleExpenseStatus}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setIsExpenseModalOpen(true);
              }}
              onNewExpense={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onViewReceipt={(exp) => setViewingReceiptExpense(exp)}
              onDuplicateExpense={handleDuplicateExpense}
              onOpenAiParser={() => setIsAiParserOpen(true)}
            />
          )}

          {/* TAB: Fiscal (NF-e, Notas Fiscais Eletrônicas, Importação XML) */}
          {(activeTab === 'fiscal' || activeTab === 'nfe_importar' || activeTab === 'nfe_notas') && (
            <div id="fiscal-module-container" className="space-y-6">
              <NfeModule
                expenses={expenses}
                companyProfile={companyProfile}
                viewMode="import"
                inventory={inventory}
                onSaveInventory={(updatedInv) => setInventory(updatedInv)}
                onDeleteExpense={(idOrNumber) => {
                  setExpenses((prev) => prev.filter((e) => e.id !== idOrNumber && e.invoiceNumber !== idOrNumber));
                }}
                onAddExpenseFromNfe={(newExp) => {
                  const created: Expense = {
                    id: newExp.id || `exp_nfe_${Date.now()}`,
                    description: newExp.description || 'Despesa Importada via NF-e',
                    amount: newExp.amount || 0,
                    categoryId: newExp.categoryId || 'cat_combustivel',
                    categoryName: categories.find(c => c.id === newExp.categoryId)?.name || 'Combustível & Arla (Diesel)',
                    categoryColor: categories.find(c => c.id === newExp.categoryId)?.color || '#d97706',
                    dueDate: newExp.dueDate || new Date().toISOString().split('T')[0],
                    status: newExp.status || 'pago',
                    paymentMethod: newExp.paymentMethod || 'boleto',
                    supplier: newExp.supplier || 'Fornecedor NF-e',
                    invoiceNumber: newExp.invoiceNumber || 'NF-e',
                    notes: newExp.notes,
                    nfeItems: newExp.nfeItems,
                    createdAt: newExp.createdAt || new Date().toISOString(),
                  };
                  handleSaveExpense(created);
                }}
              />
            </div>
          )}

          {/* TAB: RH (Recursos Humanos: Dashboard, Funcionários, Folha, Férias, Afastamentos, Adiantamentos) */}
          {(activeTab === 'rh' || activeTab === 'funcionarios') && (
            <RHModule
              employees={employees}
              payrolls={payrolls}
              vacations={vacations}
              leaves={leaves}
              advances={advances}
              companyProfile={companyProfile}
              initialSubTab={activeTab === 'funcionarios' ? 'funcionarios' : undefined}
              onSaveEmployees={setEmployees}
              onSavePayrolls={handleSavePayrolls}
              onSaveVacations={handleSaveVacations}
              onSaveLeaves={handleSaveLeaves}
              onSaveAdvances={handleSaveAdvances}
            />
          )}

          {/* TAB 7: Relatórios */}
          {activeTab === 'relatorios' && (
            <ReportsModule
              expenses={expenses}
              orders={orders}
              services={services}
              companyProfile={companyProfile}
              fuelLogs={fuelLogs}
              clients={clients}
              machineries={machineries}
              seasons={seasons}
            />
          )}

          {/* TAB 8: Clientes CRM */}
          {activeTab === 'clientes' && (
            <CrmModule
              clients={clients}
              orders={orders}
              onNewClient={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              onEditClient={(c) => {
                setEditingClient(c);
                setIsClientModalOpen(true);
              }}
              onDeleteClient={handleDeleteClient}
              onNewOrder={(clientId) => {
                setIsOrderModalOpen(true);
              }}
              onUpdateClientStatus={handleUpdateClientStatus}
            />
          )}

          {/* TAB: Fornecedores */}
          {activeTab === 'fornecedores' && (
            <SuppliersModule
              suppliers={suppliers}
              onSaveSuppliers={setSuppliers}
            />
          )}

          {/* TAB: Gestão de Frotas / Veículos / Manutenções / Motoristas / Equipe / Combustível / Rodízio */}
          {(activeTab === 'frotas' || activeTab === 'veiculos' || activeTab === 'manutencoes' || activeTab === 'combustivel' || activeTab === 'motoristas' || activeTab === 'equipe' || activeTab === 'rodizio' || activeTab === 'rodizio_pneus') && (
            <FleetModule
              machineries={machineries}
              employees={employees}
              teams={fleetTeams}
              fuelLogs={fuelLogs}
              maintenanceLogs={maintenanceLogs}
              expenses={expenses}
              inventory={inventory}
              suppliers={suppliers}
              services={services}
              orders={orders}
              companyProfile={companyProfile}
              initialSubTab={
                activeTab === 'veiculos' ? 'veiculos' :
                activeTab === 'motoristas' ? 'motoristas' :
                activeTab === 'equipe' ? 'equipe' :
                activeTab === 'combustivel' ? 'combustivel' :
                activeTab === 'manutencoes' ? 'manutencoes' :
                (activeTab === 'rodizio' || activeTab === 'rodizio_pneus') ? 'rodizio' : undefined
              }
              onSaveMachineries={setMachineries}
              onSaveEmployees={setEmployees}
              onSaveTeams={setFleetTeams}
              onSaveFuelLogs={setFuelLogs}
              onSaveMaintenanceLogs={setMaintenanceLogs}
              onSaveInventory={setInventory}
              onSaveServices={setServices}
              onSaveOrders={setOrders}
              onAddExpense={(newExp) => {
                const created: Expense = {
                  id: `exp_fleet_${Date.now()}`,
                  description: newExp.description || 'Despesa de Frota',
                  amount: newExp.amount || 0,
                  categoryId: newExp.category?.toLowerCase().includes('combust') ? 'cat_combustivel' : 'cat_manutencao',
                  categoryName: newExp.category || 'Gestão de Frotas',
                  categoryColor: newExp.category?.toLowerCase().includes('combust') ? '#d97706' : '#6366f1',
                  dueDate: newExp.dueDate || newExp.date || new Date().toISOString().split('T')[0],
                  status: (newExp.status as any) || 'pago',
                  paymentMethod: (newExp.paymentMethod as any) || 'pix',
                  supplier: newExp.supplier || 'Fornecedor',
                  invoiceNumber: newExp.invoiceNumber,
                  notes: newExp.notes,
                  createdAt: new Date().toISOString(),
                };
                handleSaveExpense(created);
              }}
            />
          )}

          {/* TAB 12: Configurações da Empresa & Lovable Sync */}
          {activeTab === 'configuracoes' && (
            <CompanySettingsView
              companyProfile={companyProfile}
              onSaveCompanyProfile={(updated) => {
                setCompanyProfile(updated);
                saveStoredCompanyProfile(updated);
              }}
              categories={categories}
              costCenters={costCenters}
              onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
              onOpenIntegrationModal={() => setIsIntegrationModalOpen(true)}
              onResetAllData={handleResetAllData}
              onSyncFirebase={handleSyncFirebase}
            />
          )}

        </main>
      </div>

      {/* Global Modals */}
      
      {/* Expense Modal (Create & Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        categories={categories}
        costCenters={costCenters}
        machineries={machineries}
        employees={employees}
        teams={fleetTeams}
        suppliers={suppliers}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        onSaveCategories={setCategories}
        onSaveCostCenters={setCostCenters}
        onSaveEmployees={setEmployees}
        onSaveTeams={setFleetTeams}
        onSaveSuppliers={setSuppliers}
      />

      {/* Receipt / Invoice Viewer Modal */}
      <ExpenseReceiptViewer
        expense={viewingReceiptExpense}
        onClose={() => setViewingReceiptExpense(null)}
      />

      {/* Category & Cost Center Manager Modal */}
      <ExpenseCategoriesModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onSaveCategories={setCategories}
        costCenters={costCenters}
        onSaveCostCenters={setCostCenters}
      />

      {/* AI Fast Entry Modal */}
      <AiExpenseParserModal
        isOpen={isAiParserOpen}
        onClose={() => setIsAiParserOpen(false)}
        onAddExpense={(exp) => handleSaveExpense(exp)}
        categories={categories}
        costCenters={costCenters}
        machineries={machineries}
      />

      {/* Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClient}
        editingClient={editingClient}
      />

      {/* Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrder}
        clients={clients}
      />

      {/* Lovable Integration / Import Modal */}
      <LovableIntegrationModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
        onDataImported={handleDataReload}
      />

      {/* Quick Memo Modal */}
      <QuickMemoModal
        isOpen={isQuickMemoOpen}
        onClose={() => setIsQuickMemoOpen(false)}
      />

      {/* Trial Info Modal */}
      <TrialInfoModal
        isOpen={isTrialInfoOpen}
        onClose={() => setIsTrialInfoOpen(false)}
      />

    </div>
  );
}
