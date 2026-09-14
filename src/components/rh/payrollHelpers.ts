import { Employee, ServiceOrder, PayrollRecord } from '../../types';
import { isThirdPartyDriver, isBrokerEmployee } from './PayrollTab';

export interface CommissionItemBreakdown {
  serviceId: string;
  orderNumber?: string;
  clientName: string;
  farmName?: string;
  date: string;
  role: string;
  amount: number;
  description: string;
}

export interface EmployeeMonthCommissions {
  total: number;
  count: number;
  breakdown: CommissionItemBreakdown[];
}

/**
 * Extrai a competência (MM/YYYY) de uma Ordem de Serviço de Silagem.
 */
export const getServiceMonthRef = (service: Partial<ServiceOrder>): string => {
  const dateStr = (service.completionDate || service.startDate || (service as any).date || '').trim();
  if (!dateStr) return '';

  // Formato YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      return `${month}/${year}`;
    }
  }

  // Formato DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${month}/${year}`;
    }
  }

  return '';
};

/**
 * Apura ativamente todas as comissões devidas a um colaborador em uma determinada competência (ex: "09/2026").
 * 
 * REGRAS DE NEGÓCIO:
 * 1. BLOQUEIO ESTRITO POR TIPO DE VÍNCULO:
 *    - Motoristas com vínculo "Terceirizado" são geridos EXCLUSIVAMENTE pelo Financeiro ("Acertos Terceiros").
 *    - Colaboradores com papel de "Agenciador" são geridos EXCLUSIVAMENTE pelo Financeiro ("Acertos Agenciadores").
 *    - Portanto, para terceirizados e agenciadores, a função retorna SEMPRE 0 na folha do RH.
 * 2. PROVENTOS DE COMISSÃO ELEGÍVEIS:
 *    - Operador de Forrageira / Ensiladeira (Principal e Secundário).
 *    - Operador de Trator & Compactação (Principal e Secundário).
 *    - Motoristas internos / próprios de frotas (comissão de transporte por horas/cargas).
 *    - Operadores alocados na OS com custo/comissão prevista.
 */
export const getEmployeeMonthCommissions = (
  employeeId: string,
  referenceMonth: string,
  services: ServiceOrder[],
  employees: Employee[]
): EmployeeMonthCommissions => {
  const employee = employees.find(e => e.id === employeeId);
  if (!employee) {
    return { total: 0, count: 0, breakdown: [] };
  }

  // 1. BLOQUEIO ESTRITO POR TIPO DE VÍNCULO (Regra 3 do usuário)
  if (isThirdPartyDriver(employee) || isBrokerEmployee(employee)) {
    return { total: 0, count: 0, breakdown: [] };
  }

  const breakdown: CommissionItemBreakdown[] = [];
  const empName = (employee.name || '').trim().toLowerCase();

  services.forEach((service) => {
    // Validação da competência
    const serviceCompetencia = getServiceMonthRef(service);
    if (serviceCompetencia !== referenceMonth) {
      return;
    }

    const serviceDisplayDate = service.completionDate || service.startDate || (service as any).date || '';
    const osIdentificador = service.orderNumber ? `OS #${service.orderNumber}` : `OS ${service.id.slice(-6).toUpperCase()}`;

    // A) OPERADOR PRINCIPAL FORRAGEIRA
    const isPrimaryForage = 
      service.forageOperatorId === employeeId || 
      (Boolean(service.forageOperatorName) && service.forageOperatorName!.trim().toLowerCase() === empName);

    if (isPrimaryForage) {
      let amount = 0;
      if (typeof service.forageOperatorCommissionP1 === 'number' && service.forageOperatorCommissionP1 > 0) {
        amount = service.forageOperatorCommissionP1;
      } else if (service.forageSecondOperatorId || (service.forageSecondOperatorName && service.forageSecondOperatorName.trim())) {
        const p2Comm = service.forageOperatorCommissionP2 || 0;
        amount = Math.max(0, (service.forageOperatorCommission || 0) - p2Comm);
      } else {
        amount = service.forageOperatorCommission || 0;
      }

      if (amount > 0) {
        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador Ensiladeira (Principal)',
          amount: Number(amount.toFixed(2)),
          description: `${osIdentificador} - Operação da Forrageira (${service.forageHarvesterName || 'Ensiladeira'})`,
        });
      }
    }

    // B) SEGUNDO OPERADOR FORRAGEIRA
    const isSecondForage = 
      service.forageSecondOperatorId === employeeId || 
      (Boolean(service.forageSecondOperatorName) && service.forageSecondOperatorName!.trim().toLowerCase() === empName);

    if (isSecondForage) {
      let amount = 0;
      if (typeof service.forageOperatorCommissionP2 === 'number' && service.forageOperatorCommissionP2 > 0) {
        amount = service.forageOperatorCommissionP2;
      } else {
        const base = service.forageDrumHours || service.forageEngineHours || service.areaQuantity || service.areaHectares || 0;
        const rate = employee.commissionPerHour || employee.commissionPerHectare || employee.commissionPerAlqueire || 0;
        if (rate > 0 && base > 0) {
          amount = Number((rate * base).toFixed(2));
        }
      }

      if (amount > 0) {
        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador Ensiladeira (2º Operador)',
          amount: Number(amount.toFixed(2)),
          description: `${osIdentificador} - Apoio Ensiladeira (${service.forageHarvesterName || 'Forrageira'})`,
        });
      }
    }

    // C) OPERADOR PRINCIPAL TRATOR / COMPACTAÇÃO
    const isPrimaryTractor = 
      service.tractorOperatorId === employeeId || 
      (Boolean(service.tractorOperatorName) && service.tractorOperatorName!.trim().toLowerCase() === empName);

    if (isPrimaryTractor) {
      let amount = 0;
      if (typeof service.tractorOperatorCommissionP1 === 'number' && service.tractorOperatorCommissionP1 > 0) {
        amount = service.tractorOperatorCommissionP1;
      } else if (service.tractorSecondOperatorId || (service.tractorSecondOperatorName && service.tractorSecondOperatorName.trim())) {
        const p2Comm = service.tractorOperatorCommissionP2 || 0;
        amount = Math.max(0, (service.tractorOperatorCommission || 0) - p2Comm);
      } else {
        amount = service.tractorOperatorCommission || 0;
      }

      if (amount > 0) {
        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador Trator / Compactação (Principal)',
          amount: Number(amount.toFixed(2)),
          description: `${osIdentificador} - Compactação do Silo (${service.tractorName || 'Trator'})`,
        });
      }
    }

    // D) SEGUNDO OPERADOR TRATOR / COMPACTAÇÃO
    const isSecondTractor = 
      service.tractorSecondOperatorId === employeeId || 
      (Boolean(service.tractorSecondOperatorName) && service.tractorSecondOperatorName!.trim().toLowerCase() === empName);

    if (isSecondTractor) {
      let amount = 0;
      if (typeof service.tractorOperatorCommissionP2 === 'number' && service.tractorOperatorCommissionP2 > 0) {
        amount = service.tractorOperatorCommissionP2;
      } else {
        const base = service.tractorHours || service.tractorOperatorHours || service.areaQuantity || 0;
        const rate = employee.commissionPerHour || 0;
        if (rate > 0 && base > 0) {
          amount = Number((rate * base).toFixed(2));
        }
      }

      if (amount > 0) {
        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador Trator / Compactação (2º Operador)',
          amount: Number(amount.toFixed(2)),
          description: `${osIdentificador} - Apoio Compactação (${service.tractorName || 'Trator'})`,
        });
      }
    }

    // E) MOTORISTA INTERNO / PRÓPRIO DE FROTAS & TRANSPORTE
    if (Array.isArray(service.trucks)) {
      service.trucks.forEach((truck, index) => {
        // Pular se for caminhão explicitamente de terceiro (já apurado no Financeiro)
        const isThirdPartyVehicle = 
          truck.ownership === 'terceirizado' || 
          (truck.truckName || '').toLowerCase().includes('terceir');
        if (isThirdPartyVehicle) return;

        const isDriver = 
          truck.primaryDriverId === employeeId || 
          (Boolean(truck.primaryDriverName) && truck.primaryDriverName!.trim().toLowerCase() === empName);

        if (isDriver && typeof truck.driverCommission === 'number' && truck.driverCommission > 0) {
          breakdown.push({
            serviceId: service.id,
            orderNumber: service.orderNumber,
            clientName: service.clientName,
            farmName: service.farmName,
            date: serviceDisplayDate,
            role: 'Motorista Transporte (Frota Própria)',
            amount: Number(truck.driverCommission.toFixed(2)),
            description: `${osIdentificador} - Transporte Silagem (${truck.truckName || truck.plate || `Caminhão #${index + 1}`})`,
          });
        }
      });
    }

    // F) OPERADOR GERAL PREVISTO (Se houver alocação direta)
    const isGenericOperator = 
      service.operatorId === employeeId || 
      (Boolean(service.operatorAssigned) && service.operatorAssigned!.trim().toLowerCase() === empName);

    if (isGenericOperator && !isPrimaryForage && !isPrimaryTractor) {
      if (typeof service.driverCostAllocated === 'number' && service.driverCostAllocated > 0) {
        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador de Campo',
          amount: Number(service.driverCostAllocated.toFixed(2)),
          description: `${osIdentificador} - Operação de Campo`,
        });
      }
    }
  });

  const total = Number(breakdown.reduce((sum, item) => sum + item.amount, 0).toFixed(2));

  return {
    total,
    count: breakdown.length,
    breakdown,
  };
};
