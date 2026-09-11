import { supabase, isSupabaseConfigured } from './supabase';
import {
  Client,
  Supplier,
  InventoryItem,
  Expense,
  Machinery,
  Employee,
  SilageOrder,
  ServiceOrder,
  CompanyProfile
} from '../types';

/**
 * Service Layer for Supabase Relational Tables
 * Native PostgreSQL syntax via Supabase JS Client:
 * - clientes
 * - fornecedores
 * - estoque
 * - notas_fiscais
 * - parcelas_financeiras
 * - rh_funcionarios
 * - gestao_frotas
 * - despesas
 * - ordens_servico
 */

export interface SyncStats {
  clientes: number;
  fornecedores: number;
  estoque: number;
  notas_fiscais: number;
  parcelas_financeiras: number;
  rh_funcionarios: number;
  gestao_frotas: number;
  despesas: number;
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------
export async function fetchClientes(): Promise<Client[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetchClientes notice:', error.message);
      return null;
    }
    return data as Client[];
  } catch (err) {
    console.warn('Supabase fetchClientes err:', err);
    return null;
  }
}

export async function upsertCliente(client: Client): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('clientes')
      .upsert({
        id: client.id,
        name: client.name,
        farm_name: client.farmName || '',
        cpf_cnpj: client.cpfCnpj || '',
        state_registration: client.stateRegistration || '',
        phone: client.phone || '',
        email: client.email || '',
        city: client.city || '',
        state: client.state || '',
        address: client.address || '',
        neighborhood: client.neighborhood || '',
        zip_code: client.zipCode || '',
        cattle_type: client.cattleType || 'leite',
        status: client.status || 'cliente_ativo',
        head_count: client.headCount || 0,
        monthly_demand_tons: client.monthlyDemandTons || 0,
        notes: client.notes || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsertCliente notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertCliente err:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Fornecedores
// ---------------------------------------------------------------------------
export async function fetchFornecedores(): Promise<Supplier[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetchFornecedores notice:', error.message);
      return null;
    }
    return data as Supplier[];
  } catch (err) {
    console.warn('Supabase fetchFornecedores err:', err);
    return null;
  }
}

export async function upsertFornecedor(supplier: Supplier): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('fornecedores')
      .upsert({
        id: supplier.id,
        name: supplier.name,
        corporate_name: supplier.tradeName || supplier.name,
        cnpj_cpf: supplier.cnpjOrCpf || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        category: supplier.category || 'Geral',
        city: supplier.city || '',
        state: supplier.state || '',
        address: supplier.address || '',
        status: 'ativo',
        notes: supplier.notes || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsertFornecedor notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertFornecedor err:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Estoque
// ---------------------------------------------------------------------------
export async function fetchEstoque(): Promise<InventoryItem[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetchEstoque notice:', error.message);
      return null;
    }
    return data as InventoryItem[];
  } catch (err) {
    console.warn('Supabase fetchEstoque err:', err);
    return null;
  }
}

export async function upsertEstoqueItem(item: InventoryItem): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('estoque')
      .upsert({
        id: item.id,
        code: item.code || '',
        name: item.name,
        category: item.category || 'Geral',
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'un',
        min_quantity: Number(item.minQuantity) || 0,
        cost_price: Number(item.unitCost) || 0,
        selling_price: Number(item.salePrice || item.wholesalePrice) || 0,
        location: item.location || '',
        supplier: '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsertEstoqueItem notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertEstoqueItem err:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// RH Funcionários
// ---------------------------------------------------------------------------
export async function fetchRhFuncionarios(): Promise<Employee[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('rh_funcionarios')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetchRhFuncionarios notice:', error.message);
      return null;
    }
    return data as Employee[];
  } catch (err) {
    console.warn('Supabase fetchRhFuncionarios err:', err);
    return null;
  }
}

export async function upsertRhFuncionario(employee: Employee): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('rh_funcionarios')
      .upsert({
        id: employee.id,
        name: employee.name,
        role: employee.role || '',
        cpf: employee.cpf || '',
        phone: employee.phone || '',
        email: '',
        status: employee.status || 'ativo',
        registration_type: employee.registrationType || 'Funcionário',
        salary: Number(employee.baseSalary || employee.salary) || 0,
        admission_date: employee.admissionDate || '',
        driver_license: employee.cnhNumber || '',
        license_category: employee.cnhCategory || '',
        license_expiry: employee.cnhExpiration || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsertRhFuncionario notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertRhFuncionario err:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Gestão de Frotas & Maquinários
// ---------------------------------------------------------------------------
export async function fetchGestaoFrotas(): Promise<Machinery[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('gestao_frotas')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetchGestaoFrotas notice:', error.message);
      return null;
    }
    return data as Machinery[];
  } catch (err) {
    console.warn('Supabase fetchGestaoFrotas err:', err);
    return null;
  }
}

export async function upsertGestaoFrota(vehicle: Machinery): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('gestao_frotas')
      .upsert({
        id: vehicle.id,
        name: vehicle.name,
        model: vehicle.model || '',
        brand: vehicle.brand || '',
        year: vehicle.year || null,
        license_plate: vehicle.licensePlateOrSerial || '',
        status: vehicle.status || 'operacional',
        category_type: vehicle.categoryType || 'trator',
        ownership: vehicle.ownership || 'proprio',
        current_km: vehicle.currentKm || 0,
        hour_meter: vehicle.hourMeter || 0,
        operator_driver: vehicle.operatorOrDriver || '',
        accumulated_cost: vehicle.accumulatedCost || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsertGestaoFrota notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertGestaoFrota err:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Notas Fiscais & Parcelas Financeiras
// ---------------------------------------------------------------------------
export async function upsertNotaFiscal(nfe: {
  id: string;
  number: string;
  series?: string;
  accessKey?: string;
  supplier: string;
  cnpjCpf?: string;
  issueDate: string;
  totalAmount: number;
  items?: any[];
}): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('notas_fiscais')
      .upsert({
        id: nfe.id,
        number: nfe.number,
        series: nfe.series || '1',
        access_key: nfe.accessKey || '',
        supplier: nfe.supplier,
        cnpj_cpf: nfe.cnpjCpf || '',
        issue_date: nfe.issueDate,
        total_amount: Number(nfe.totalAmount) || 0,
        items_json: nfe.items || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsertNotaFiscal notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertNotaFiscal err:', err);
    return false;
  }
}

export async function upsertParcelaFinanceira(parcela: {
  id: string;
  type: 'pagar' | 'receber';
  title: string;
  amount: number;
  due_date: string;
  status: 'pago' | 'pendente' | 'atrasado';
  client_or_supplier?: string;
  reference_id?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('parcelas_financeiras')
      .upsert({
        id: parcela.id,
        type: parcela.type,
        title: parcela.title,
        amount: Number(parcela.amount) || 0,
        due_date: parcela.due_date,
        status: parcela.status,
        client_or_supplier: parcela.client_or_supplier || '',
        reference_id: parcela.reference_id || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsertParcelaFinanceira notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertParcelaFinanceira err:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Despesas
// ---------------------------------------------------------------------------
export async function fetchDespesas(): Promise<Expense[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .order('due_date', { ascending: false });

    if (error) {
      console.warn('Supabase fetchDespesas notice:', error.message);
      return null;
    }
    return data as Expense[];
  } catch (err) {
    console.warn('Supabase fetchDespesas err:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Full System Sync to Supabase
// ---------------------------------------------------------------------------
export async function syncAllDataToSupabase(payload: {
  clientes?: Client[];
  fornecedores?: Supplier[];
  estoque?: InventoryItem[];
  rh_funcionarios?: Employee[];
  gestao_frotas?: Machinery[];
  despesas?: Expense[];
  companyProfile?: CompanyProfile;
}): Promise<SyncStats> {
  const stats: SyncStats = {
    clientes: 0,
    fornecedores: 0,
    estoque: 0,
    notas_fiscais: 0,
    parcelas_financeiras: 0,
    rh_funcionarios: 0,
    gestao_frotas: 0,
    despesas: 0,
  };

  if (!isSupabaseConfigured) {
    console.info('Supabase credentials not yet configured. Data saved locally.');
    return stats;
  }

  // 1. Clientes
  if (payload.clientes && payload.clientes.length > 0) {
    for (const c of payload.clientes) {
      const ok = await upsertCliente(c);
      if (ok) stats.clientes++;
    }
  }

  // 2. Fornecedores
  if (payload.fornecedores && payload.fornecedores.length > 0) {
    for (const f of payload.fornecedores) {
      const ok = await upsertFornecedor(f);
      if (ok) stats.fornecedores++;
    }
  }

  // 3. Estoque
  if (payload.estoque && payload.estoque.length > 0) {
    for (const item of payload.estoque) {
      const ok = await upsertEstoqueItem(item);
      if (ok) stats.estoque++;
    }
  }

  // 4. RH Funcionários
  if (payload.rh_funcionarios && payload.rh_funcionarios.length > 0) {
    for (const emp of payload.rh_funcionarios) {
      const ok = await upsertRhFuncionario(emp);
      if (ok) stats.rh_funcionarios++;
    }
  }

  // 5. Gestão de Frotas
  if (payload.gestao_frotas && payload.gestao_frotas.length > 0) {
    for (const v of payload.gestao_frotas) {
      const ok = await upsertGestaoFrota(v);
      if (ok) stats.gestao_frotas++;
    }
  }

  // 6. Despesas & Parcelas
  if (payload.despesas && payload.despesas.length > 0) {
    for (const d of payload.despesas) {
      try {
        const { error } = await supabase
          .from('despesas')
          .upsert({
            id: d.id,
            description: d.description || 'Despesa',
            amount: Number(d.amount) || 0,
            category_name: d.categoryName || 'Geral',
            category_color: d.categoryColor || '#10b981',
            due_date: d.dueDate || new Date().toISOString().split('T')[0],
            payment_date: d.paymentDate || null,
            status: d.status || 'pago',
            payment_method: d.paymentMethod || 'pix',
            supplier: d.supplier || 'Fornecedor',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (!error) {
          stats.despesas++;

          // Também alimenta tabela relacional de parcelas_financeiras
          await upsertParcelaFinanceira({
            id: `parc_${d.id}`,
            type: 'pagar',
            title: d.description,
            amount: Number(d.amount) || 0,
            due_date: d.dueDate,
            status: d.status === 'pago' ? 'pago' : d.status === 'atrasado' ? 'atrasado' : 'pendente',
            client_or_supplier: d.supplier,
            reference_id: d.id
          });
          stats.parcelas_financeiras++;
        }
      } catch (err) {
        console.warn('Error syncing despesa:', err);
      }
    }
  }

  return stats;
}

/**
 * Fetch all initial data from Supabase
 */
export async function fetchAllDataFromSupabase() {
  if (!isSupabaseConfigured) return null;

  try {
    const [
      clientesRes,
      fornecedoresRes,
      estoqueRes,
      rhRes,
      frotasRes,
      despesasRes
    ] = await Promise.all([
      supabase.from('clientes').select('*').limit(500),
      supabase.from('fornecedores').select('*').limit(500),
      supabase.from('estoque').select('*').limit(500),
      supabase.from('rh_funcionarios').select('*').limit(500),
      supabase.from('gestao_frotas').select('*').limit(500),
      supabase.from('despesas').select('*').limit(500),
    ]);

    return {
      clientes: clientesRes.data || [],
      fornecedores: fornecedoresRes.data || [],
      estoque: estoqueRes.data || [],
      rh_funcionarios: rhRes.data || [],
      gestao_frotas: frotasRes.data || [],
      despesas: despesasRes.data || [],
    };
  } catch (err) {
    console.warn('Supabase fetchAllDataFromSupabase notice:', err);
    return null;
  }
}
