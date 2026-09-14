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
  formattedLine: string;
  serviceType?: string;
  vehiclePrefix?: string;
  workName?: string;
  loads?: number;
  totalM3?: number;
  hours?: number;
  hourlyRate?: number;
}

export interface EmployeeMonthCommissions {
  total: number;
  count: number;
  breakdown: CommissionItemBreakdown[];
}

/**
 * Formata a linha de conferência operacional no padrão do resumo de custos da operação:
 * "[Tipo_Serviço] [Prefixo_Veículo] ([Nome_Trabalho]) — [Qtd_Cargas] Cargas ([Qtd_m³] m³) — Cobrança por Horas: [Qtd_Horas]h x R$ [Valor_Hora]/h — Total: R$ [Valor_Total]"
 * 
 * Exemplos esperados:
 * - "Transp. AKU (Nilton Par) — 16 Cargas (576.0 m³) — Cobrança por Horas: 12h x R$ 60,00/h — Total: R$ 720,00"
 * - "Comissão Trator (DIEGO TRATO) — Cobrança por Horas: 11h x R$ 61,36/h — Total: R$ 675,00"
 */
export const formatCommissionItemLine = (item: {
  serviceType: string;
  vehiclePrefix?: string;
  workName: string;
  loads?: number;
  totalM3?: number;
  hours?: number;
  hourlyRate?: number;
  totalAmount: number;
}): string => {
  const parts: string[] = [];

  // 1. [Tipo_Serviço] [Prefixo_Veículo] ([Nome_Trabalho])
  const prefix = item.vehiclePrefix && item.vehiclePrefix.trim() ? ` ${item.vehiclePrefix.trim()}` : '';
  const head = `${item.serviceType.trim()}${prefix} (${(item.workName || 'Operação').trim()})`;
  parts.push(head);

  // 2. [Qtd_Cargas] Cargas ([Qtd_m³] m³) (se houver transporte de cargas)
  if (typeof item.loads === 'number' && item.loads > 0) {
    const m3Formatted = (item.totalM3 || 0).toFixed(1);
    parts.push(`${item.loads} Cargas (${m3Formatted} m³)`);
  }

  // 3. Cobrança por Horas: [Qtd_Horas]h x R$ [Valor_Hora]/h
  const hours = item.hours || 0;
  const rate = item.hourlyRate && item.hourlyRate > 0
    ? item.hourlyRate
    : (hours > 0 && item.totalAmount > 0 ? item.totalAmount / hours : 0);

  if (hours > 0 && rate > 0) {
    const hoursFormatted = hours % 1 === 0 ? hours.toFixed(0) : hours.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    const rateFormatted = rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    parts.push(`Cobrança por Horas: ${hoursFormatted}h x R$ ${rateFormatted}/h`);
  } else if (item.hourlyRate && item.hourlyRate > 0 && item.totalAmount > 0) {
    const derivedHours = item.totalAmount / item.hourlyRate;
    const hoursFormatted = derivedHours % 1 === 0 ? derivedHours.toFixed(0) : derivedHours.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    const rateFormatted = item.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    parts.push(`Cobrança por Horas: ${hoursFormatted}h x R$ ${rateFormatted}/h`);
  }

  // 4. Total: R$ [Valor_Total]
  const totalFormatted = (item.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  parts.push(`Total: R$ ${totalFormatted}`);

  return parts.join(' — ');
};

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
        const roundedAmount = Number(amount.toFixed(2));
        const hours = service.forageDrumHours || service.forageEngineHours || 0;
        const hourlyRate = service.forageCommissionRate || (hours > 0 ? roundedAmount / hours : 0);
        const workName = service.clientName || service.farmName || 'Operação';
        const vehiclePrefix = service.forageHarvesterName ? service.forageHarvesterName.trim() : '';
        const serviceType = 'Comissão Ensiladeira';
        const formattedLine = formatCommissionItemLine({
          serviceType,
          vehiclePrefix,
          workName,
          hours,
          hourlyRate,
          totalAmount: roundedAmount,
        });

        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador Ensiladeira (Principal)',
          amount: roundedAmount,
          description: formattedLine,
          formattedLine,
          serviceType,
          vehiclePrefix,
          workName,
          hours,
          hourlyRate,
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
        const roundedAmount = Number(amount.toFixed(2));
        const hours = service.forageDrumHours || service.forageEngineHours || 0;
        const hourlyRate = employee.commissionPerHour || (hours > 0 ? roundedAmount / hours : 0);
        const workName = service.clientName || service.farmName || 'Operação';
        const vehiclePrefix = service.forageHarvesterName ? service.forageHarvesterName.trim() : '';
        const serviceType = 'Comissão 2º Op. Ensiladeira';
        const formattedLine = formatCommissionItemLine({
          serviceType,
          vehiclePrefix,
          workName,
          hours,
          hourlyRate,
          totalAmount: roundedAmount,
        });

        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador Ensiladeira (2º Operador)',
          amount: roundedAmount,
          description: formattedLine,
          formattedLine,
          serviceType,
          vehiclePrefix,
          workName,
          hours,
          hourlyRate,
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
        const roundedAmount = Number(amount.toFixed(2));
        let hours = service.tractorOperatorHours || service.tractorHours || 0;
        const hourlyRate = service.tractorOperatorCommissionRate || (hours > 0 ? roundedAmount / hours : 0);
        if (hours === 0 && hourlyRate > 0 && roundedAmount > 0) {
          hours = Math.round((roundedAmount / hourlyRate) * 100) / 100;
        }
        const workName = service.clientName || service.farmName || service.tractorName || 'Operação';
        const serviceType = 'Comissão Trator';
        const formattedLine = formatCommissionItemLine({
          serviceType,
          workName,
          hours,
          hourlyRate,
          totalAmount: roundedAmount,
        });

        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador Trator / Compactação (Principal)',
          amount: roundedAmount,
          description: formattedLine,
          formattedLine,
          serviceType,
          workName,
          hours,
          hourlyRate,
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
        const roundedAmount = Number(amount.toFixed(2));
        let hours = service.tractorOperatorHours || service.tractorHours || 0;
        const hourlyRate = employee.commissionPerHour || (hours > 0 ? roundedAmount / hours : 0);
        if (hours === 0 && hourlyRate > 0 && roundedAmount > 0) {
          hours = Math.round((roundedAmount / hourlyRate) * 100) / 100;
        }
        const workName = service.clientName || service.farmName || service.tractorName || 'Operação';
        const serviceType = 'Comissão 2º Op. Trator';
        const formattedLine = formatCommissionItemLine({
          serviceType,
          workName,
          hours,
          hourlyRate,
          totalAmount: roundedAmount,
        });

        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador Trator / Compactação (2º Operador)',
          amount: roundedAmount,
          description: formattedLine,
          formattedLine,
          serviceType,
          workName,
          hours,
          hourlyRate,
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
          const roundedAmount = Number(truck.driverCommission.toFixed(2));
          const loads = truck.tripLoads ?? (truck as any).loads ?? 0;
          const totalM3 = truck.totalM3 ?? ((truck.capacityM3 || 0) * (loads || 0));
          let hours = truck.truckHours ?? truck.driverHours ?? 0;
          const hourlyRate = truck.driverCommissionRate ?? truck.truckHourlyRate ?? (hours > 0 ? roundedAmount / hours : 0);
          if (hours === 0 && hourlyRate > 0 && roundedAmount > 0) {
            hours = Math.round((roundedAmount / hourlyRate) * 100) / 100;
          }
          const vehiclePrefix = (truck.plate || truck.truckName || `Caminhão #${index + 1}`).trim();
          const workName = service.clientName || service.farmName || 'Operação';
          const serviceType = 'Transp.';
          const formattedLine = formatCommissionItemLine({
            serviceType,
            vehiclePrefix,
            workName,
            loads,
            totalM3,
            hours,
            hourlyRate,
            totalAmount: roundedAmount,
          });

          breakdown.push({
            serviceId: service.id,
            orderNumber: service.orderNumber,
            clientName: service.clientName,
            farmName: service.farmName,
            date: serviceDisplayDate,
            role: 'Motorista Transporte (Frota Própria)',
            amount: roundedAmount,
            description: formattedLine,
            formattedLine,
            serviceType,
            vehiclePrefix,
            workName,
            loads,
            totalM3,
            hours,
            hourlyRate,
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
        const roundedAmount = Number(service.driverCostAllocated.toFixed(2));
        const hours = service.tractorHours || service.forageDrumHours || 0;
        const hourlyRate = hours > 0 ? roundedAmount / hours : 0;
        const workName = service.clientName || service.farmName || 'Operação';
        const serviceType = 'Comissão Operação';
        const formattedLine = formatCommissionItemLine({
          serviceType,
          workName,
          hours,
          hourlyRate,
          totalAmount: roundedAmount,
        });

        breakdown.push({
          serviceId: service.id,
          orderNumber: service.orderNumber,
          clientName: service.clientName,
          farmName: service.farmName,
          date: serviceDisplayDate,
          role: 'Operador de Campo',
          amount: roundedAmount,
          description: formattedLine,
          formattedLine,
          serviceType,
          workName,
          hours,
          hourlyRate,
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
