import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  Expense, 
  Client, 
  SilageOrder, 
  Machinery, 
  ServiceOrder, 
  CompanyProfile 
} from '../types';

export interface SyncStats {
  expenses: number;
  clients: number;
  orders: number;
  machineries: number;
  services: number;
}

export async function uploadAllDataToFirestore(
  userId: string,
  data: {
    expenses: Expense[];
    clients: Client[];
    orders: SilageOrder[];
    machineries: Machinery[];
    services: ServiceOrder[];
    companyProfile?: CompanyProfile;
  }
): Promise<SyncStats> {
  const stats: SyncStats = {
    expenses: 0,
    clients: 0,
    orders: 0,
    machineries: 0,
    services: 0,
  };

  // Sync Expenses
  for (const item of data.expenses) {
    try {
      await setDoc(doc(db, 'expenses', item.id), {
        id: item.id,
        description: item.description || 'Despesa',
        amount: Number(item.amount) || 0,
        categoryId: item.categoryId || 'cat_geral',
        categoryName: item.categoryName || 'Geral',
        categoryColor: item.categoryColor || '#10b981',
        dueDate: item.dueDate || new Date().toISOString().split('T')[0],
        status: item.status || 'pago',
        paymentMethod: item.paymentMethod || 'pix',
        supplier: item.supplier || 'Fornecedor',
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      stats.expenses++;
    } catch (e) {
      console.error('Error uploading expense to Firestore:', e);
    }
  }

  // Sync Clients
  for (const client of data.clients) {
    try {
      await setDoc(doc(db, 'clients', client.id), {
        id: client.id,
        name: client.name || 'Cliente',
        farmName: client.farmName || '',
        phone: client.phone || '',
        city: client.city || '',
        state: client.state || '',
        status: client.status || 'cliente_ativo',
        cattleType: client.cattleType || 'leite',
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      stats.clients++;
    } catch (e) {
      console.error('Error uploading client to Firestore:', e);
    }
  }

  // Sync Orders
  for (const order of data.orders) {
    try {
      await setDoc(doc(db, 'orders', order.id), {
        id: order.id,
        clientId: order.clientId,
        clientName: order.clientName || 'Cliente',
        farmName: order.farmName || '',
        productType: order.productType || 'Milho Planta Inteira',
        tons: Number(order.tons) || 0,
        pricePerTon: Number(order.pricePerTon) || 0,
        totalAmount: Number(order.totalAmount) || 0,
        deliveryDate: order.deliveryDate || new Date().toISOString().split('T')[0],
        status: order.status || 'confirmado',
        paymentStatus: order.paymentStatus || 'pendente',
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      stats.orders++;
    } catch (e) {
      console.error('Error uploading order to Firestore:', e);
    }
  }

  // Sync Machinery
  for (const mach of data.machineries) {
    try {
      await setDoc(doc(db, 'machinery', mach.id), {
        id: mach.id,
        name: mach.name || 'Máquina',
        model: mach.model || '',
        brand: mach.brand || '',
        status: mach.status || 'operacional',
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      stats.machineries++;
    } catch (e) {
      console.error('Error uploading machinery to Firestore:', e);
    }
  }

  // Sync Services
  for (const srv of data.services) {
    try {
      await setDoc(doc(db, 'services', srv.id), {
        id: srv.id,
        clientId: srv.clientId || 'default',
        clientName: srv.clientName || '',
        status: srv.status || 'finalizada',
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      stats.services++;
    } catch (e) {
      console.error('Error uploading service to Firestore:', e);
    }
  }

  // Sync Company Profile
  if (data.companyProfile) {
    try {
      await setDoc(doc(db, 'companies', userId), {
        tradeName: data.companyProfile.tradeName || 'Silagem Teste',
        corporateName: data.companyProfile.corporateName || '',
        cnpjCpf: data.companyProfile.cnpjCpf || '',
        phone: data.companyProfile.phone || '',
        email: data.companyProfile.email || '',
        city: data.companyProfile.city || '',
        state: data.companyProfile.state || '',
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error('Error uploading company profile to Firestore:', e);
    }
  }

  return stats;
}

export async function fetchAllDataFromFirestore(userId: string) {
  try {
    const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
    const clientsQuery = query(collection(db, 'clients'), where('userId', '==', userId));
    const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));
    const machineryQuery = query(collection(db, 'machinery'), where('userId', '==', userId));

    const [expensesSnap, clientsSnap, ordersSnap, machinerySnap] = await Promise.all([
      getDocs(expensesQuery),
      getDocs(clientsQuery),
      getDocs(ordersQuery),
      getDocs(machineryQuery),
    ]);

    const expenses: Expense[] = [];
    expensesSnap.forEach(d => expenses.push(d.data() as Expense));

    const clients: Client[] = [];
    clientsSnap.forEach(d => clients.push(d.data() as Client));

    const orders: SilageOrder[] = [];
    ordersSnap.forEach(d => orders.push(d.data() as SilageOrder));

    const machineries: Machinery[] = [];
    machinerySnap.forEach(d => machineries.push(d.data() as Machinery));

    return {
      expenses,
      clients,
      orders,
      machineries
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'user_data_bundle');
  }
}
