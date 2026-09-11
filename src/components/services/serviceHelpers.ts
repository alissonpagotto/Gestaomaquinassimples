import { Machinery, Employee } from '../../types';

export const isForrageira = (m: Machinery): boolean => {
  const cat = (m.categoryType || '').toLowerCase();
  const name = (m.name || '').toLowerCase();
  const model = (m.model || '').toLowerCase();
  if (cat.includes('caminhao') || cat.includes('caminhão') || cat.includes('trator')) return false;
  return (
    cat.includes('forrageira') ||
    cat.includes('ensiladeira') ||
    name.includes('forrageira') ||
    name.includes('ensiladeira') ||
    model.includes('claas') ||
    model.includes('jaguar') ||
    model.includes('forrageira')
  );
};

export const isTrator = (m: Machinery): boolean => {
  const cat = (m.categoryType || '').toLowerCase();
  const name = (m.name || '').toLowerCase();
  const model = (m.model || '').toLowerCase();
  if (cat.includes('caminhao') || cat.includes('caminhão') || cat.includes('forrageira') || cat.includes('ensiladeira')) return false;
  return (
    cat.includes('trator') ||
    name.includes('trator') ||
    model.includes('trator') ||
    name.includes('7200j') ||
    name.includes('8030') ||
    name.includes('7815') ||
    name.includes('new holland') ||
    name.includes('massey')
  );
};

export const isCaminhao = (m: Machinery): boolean => {
  const cat = (m.categoryType || '').toLowerCase();
  const name = (m.name || '').toLowerCase();
  const model = (m.model || '').toLowerCase();
  if (cat.includes('trator') || cat.includes('forrageira') || cat.includes('ensiladeira')) return false;
  return (
    cat.includes('caminhao') ||
    cat.includes('caminhão') ||
    name.includes('caminhao') ||
    name.includes('caminhão') ||
    ((m.capacityM3 || 0) > 0)
  );
};

export const findLinkedOperator = (m: Machinery, employees: Employee[]): { id: string; name: string } => {
  // 1. Verifica IDs de motoristas vinculados no cadastro da frota
  if (m.assignedDriverIds && m.assignedDriverIds.length > 0) {
    const emp = employees.find((e) => e.id === m.assignedDriverIds![0]);
    if (emp) return { id: emp.id, name: emp.name };
  }

  // 2. Verifica lista de nomes de motoristas vinculados
  if (m.assignedDrivers && m.assignedDrivers.length > 0) {
    const driverName = m.assignedDrivers[0].trim();
    const emp = employees.find((e) => e.name.toLowerCase() === driverName.toLowerCase());
    if (emp) return { id: emp.id, name: emp.name };
    return { id: '', name: driverName };
  }

  // 3. Verifica campo de texto 'operatorOrDriver' (inclui Terceirizados / Prestadores)
  if (m.operatorOrDriver && m.operatorOrDriver.trim()) {
    const raw = m.operatorOrDriver.trim();
    // Procura por correspondência exata ou parcial com algum funcionário/terceirizado
    const emp = employees.find(
      (e) =>
        e.name.toLowerCase() === raw.toLowerCase() ||
        raw.toLowerCase().includes(e.name.toLowerCase()) ||
        e.name.toLowerCase().includes(raw.toLowerCase())
    );
    if (emp) return { id: emp.id, name: emp.name };
    return { id: '', name: raw };
  }

  return { id: '', name: '' };
};

export const formatEmployeeOptionLabel = (emp: Employee): string => {
  let commissionStr = '';
  if (emp.receivesCommission) {
    if (emp.commissionPerHour && emp.commissionPerHour > 0) {
      commissionStr = ` — R$ ${emp.commissionPerHour.toFixed(2).replace('.', ',')}/h`;
    } else if (emp.commissionPerHectare && emp.commissionPerHectare > 0) {
      commissionStr = ` — R$ ${emp.commissionPerHectare.toFixed(2).replace('.', ',')}/ha`;
    } else if (emp.commissionPerAlqueire && emp.commissionPerAlqueire > 0) {
      commissionStr = ` — R$ ${emp.commissionPerAlqueire.toFixed(2).replace('.', ',')}/alq`;
    }
  }
  const roleLabel = emp.registrationType === 'Prestador de Serviço' 
    ? 'Terceirizado' 
    : (emp.role || 'Operador');
  return `${emp.name} (${roleLabel})${commissionStr}`;
};

export const formatMachineryOptionLabel = (m: Machinery): string => {
  const plate = m.licensePlateOrSerial ? m.licensePlateOrSerial.trim().toUpperCase() : '';
  const nameOrModel = m.name || m.model || 'Equipamento';
  const brand = m.brand ? ` (${m.brand})` : '';
  const cap = m.capacityM3 && m.capacityM3 > 0 ? ` [${m.capacityM3} m³]` : '';
  
  if (plate) {
    return `${plate} — ${nameOrModel}${brand}${cap}`;
  }
  return `${nameOrModel}${brand}${cap}`;
};

export const formatTruckOptionLabel = (m: Machinery): string => {
  const plate = m.licensePlateOrSerial ? m.licensePlateOrSerial.trim().toUpperCase() : '';
  const nameOrModel = m.name || m.model || 'Caminhão';
  const brand = m.brand ? ` (${m.brand})` : '';
  const cap = m.capacityM3 && m.capacityM3 > 0 ? ` [${m.capacityM3} m³]` : '';
  if (plate) {
    return `${plate} — ${nameOrModel}${brand}${cap}`;
  }
  return `${nameOrModel}${brand}${cap}`;
};
