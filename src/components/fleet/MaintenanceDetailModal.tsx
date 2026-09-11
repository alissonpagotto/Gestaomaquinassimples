import React from 'react';
import { 
  X, 
  Printer, 
  Wrench, 
  MapPin, 
  UserCheck, 
  Package, 
  FileText, 
  CreditCard, 
  DollarSign, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Truck
} from 'lucide-react';
import { MaintenanceLog, Machinery, CompanyProfile } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface MaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: MaintenanceLog | null;
  machinery?: Machinery;
  companyProfile?: CompanyProfile;
}

export const MaintenanceDetailModal: React.FC<MaintenanceDetailModalProps> = ({
  isOpen,
  onClose,
  log,
  machinery,
  companyProfile,
}) => {
  if (!isOpen || !log) return null;

  const handlePrint = () => {
    window.print();
  };

  const getLocationBadge = (loc?: MaintenanceLog['location']) => {
    switch (loc) {
      case 'roca':
        return { label: 'Roça (Lavoura / Campo)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300' };
      case 'estrada':
        return { label: 'Estrada (Socorro Rodoviário)', bg: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300' };
      case 'oficina_interna':
        return { label: 'Oficina Interna (Barracão)', bg: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300' };
      case 'oficina_externa':
        return { label: 'Oficina Externa / Concessionária', bg: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300' };
      default:
        return { label: 'Oficina Interna', bg: 'bg-stone-100 text-stone-700 border-stone-300' };
    }
  };

  const getExecutorBadge = (type?: MaintenanceLog['executorType']) => {
    switch (type) {
      case 'equipe_propria':
        return 'Equipe Própria / Próprio Operador';
      case 'mecanico_interno':
        return 'Mecânico Interno da Empresa';
      case 'mecanico_campo':
        return 'Mecânico Terceiro em Campo (Socorro)';
      case 'mecanica_terceirizada':
        return 'Oficina Mecânica Terceirizada';
      default:
        return 'Mecânica Interna';
    }
  };

  const locBadge = getLocationBadge(log.location);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Não impresso ou adaptado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-['Outfit']">
                Ordem de Serviço: {log.osNumber || log.id}
              </h3>
              <p className="text-xs text-stone-500">
                Laudo Técnico & Detalhamento da Manutenção
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir OS</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível / Visualizável */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-stone-900 dark:text-stone-100" id="printable-os">
          
          {/* Cabeçalho da Empresa */}
          <div className="flex justify-between items-start border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-lg font-black font-['Outfit'] text-indigo-700">
                {companyProfile?.corporateName || 'SILAGEM FÁCIL - GESTÃO AGRÍCOLA'}
              </h2>
              <p className="text-xs text-stone-500">
                CNPJ: {companyProfile?.cnpjCpf || '578.722.222-2'} • {companyProfile?.city || 'Boa Esperança do Iguaçu'} - {companyProfile?.state || 'PR'}
              </p>
              <p className="text-xs text-stone-500">
                Telefone: {companyProfile?.phone || '(46) 99999-0000'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-black text-stone-900 dark:text-stone-100 block">
                {log.osNumber || log.id}
              </span>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Data: {formatDateBR(log.date)}
              </span>
            </div>
          </div>

          {/* Dados do Veículo & Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Veículo / Máquina</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{log.machineryPlateOrName}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Tipo & Categoria</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{log.type.toUpperCase()} • {log.serviceCategory}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Horímetro / KM</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{log.currentHourMeterOrKm || '-'}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Status Atual</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {log.status === 'concluida' ? '✓ Concluída' : log.status === 'em_andamento' ? '⏳ Em Andamento' : log.status === 'aguardando_pecas' ? '📦 Aguardando Peças' : log.status}
              </span>
            </div>
          </div>

          {/* Cenário Operacional: Local & Executante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-stone-500 font-bold uppercase text-[10px]">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Local da Manutenção</span>
              </div>
              <div className="pt-1">
                <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs border ${locBadge.bg}`}>
                  {locBadge.label}
                </span>
                {log.locationDetails && (
                  <p className="text-stone-600 dark:text-stone-400 mt-1 font-medium italic">
                    Ref: {log.locationDetails}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-stone-500 font-bold uppercase text-[10px]">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Responsável pela Execução</span>
              </div>
              <div className="pt-1">
                <div className="font-bold text-stone-900 dark:text-stone-100">
                  {getExecutorBadge(log.executorType)}
                </div>
                <div className="text-stone-600 dark:text-stone-400 font-medium">
                  {log.workshopOrMechanic}
                </div>
              </div>
            </div>
          </div>

          {/* Descrição do Diagnóstico */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Diagnóstico / Descrição dos Serviços
            </h4>
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/30 rounded-xl border border-stone-200 dark:border-stone-800 text-xs leading-relaxed text-stone-800 dark:text-stone-200">
              {log.description}
            </div>
          </div>

          {/* Tabela de Peças & Insumos */}
          {log.partsItems && log.partsItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Peças & Insumos Aplicados
              </h4>
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Origem</th>
                      <th className="py-2 px-3">Descrição da Peça</th>
                      <th className="py-2 px-3 text-right">Qtd</th>
                      <th className="py-2 px-3 text-right">Unitário</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {log.partsItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          {item.origin === 'almoxarifado_interno' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">Almoxarifado</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Compra Ext.</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-stone-800 dark:text-stone-200">
                          {item.description}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatCurrencyBRL(item.unitCost)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrencyBRL(item.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dados Fiscais (NF-e) & Financeiros */}
          {(log.nfeLink || log.financialConditions) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {log.nfeLink && log.nfeLink.nfeNumber && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Vínculo Fiscal (NF-e)</span>
                  <div className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    Nota Nº: {log.nfeLink.nfeNumber} (Série {log.nfeLink.nfeSeries || '1'})
                  </div>
                  {log.nfeLink.nfeAccessKey && (
                    <div className="text-[10px] font-mono text-stone-500 break-all">
                      Chave: {log.nfeLink.nfeAccessKey}
                    </div>
                  )}
                  {log.nfeLink.supplierName && (
                    <div className="text-stone-600 dark:text-stone-400 font-medium text-[11px]">
                      Fornecedor: {log.nfeLink.supplierName}
                    </div>
                  )}
                </div>
              )}

              {log.financialConditions && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Condição Financeira</span>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                    Prazo: {log.financialConditions.paymentTerm.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-stone-600 dark:text-stone-400">
                    Forma: {log.financialConditions.paymentMethod.toUpperCase()} • 1º Venc: {formatDateBR(log.financialConditions.firstDueDate)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Totais */}
          <div className="flex justify-end pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Subtotal Peças:</span>
                <span className="font-mono font-bold">{formatCurrencyBRL(log.partsCost)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Mão de Obra:</span>
                <span className="font-mono font-bold">{formatCurrencyBRL(log.laborCost)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-indigo-700 dark:text-indigo-400 pt-1 border-t border-stone-200 dark:border-stone-700">
                <span>Total Geral:</span>
                <span className="font-mono">{formatCurrencyBRL(log.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Assinaturas / Laudo de Campo */}
          <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-stone-300">
            <div className="text-center">
              <div className="border-t border-stone-400 pt-2 text-xs font-bold text-stone-700">
                Mecânico / Prestador do Serviço
              </div>
              <span className="text-[10px] text-stone-500">{log.workshopOrMechanic}</span>
            </div>
            <div className="text-center">
              <div className="border-t border-stone-400 pt-2 text-xs font-bold text-stone-700">
                Motorista / Responsável pela Frota
              </div>
              <span className="text-[10px] text-stone-500">Visto de Liberação do Equipamento</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
