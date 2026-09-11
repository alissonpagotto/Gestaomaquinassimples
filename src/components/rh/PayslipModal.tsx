import React from 'react';
import { X, Printer, Download, CheckCircle2, User, Building, Calendar, DollarSign } from 'lucide-react';
import { PayrollRecord, Employee, CompanyProfile } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface PayslipModalProps {
  payroll: PayrollRecord | null;
  employee?: Employee;
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  payroll,
  employee,
  companyProfile,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalEarnings = payroll.baseSalary + payroll.overtimeAmount + payroll.bonusAmount;
  const totalDiscounts = payroll.inssDiscount + payroll.advancesDiscount + payroll.otherDiscounts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Action Header (Non-printable) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Demonstrativo de Pagamento de Salário (Holerite)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#009688]/10 text-[#009688]">
              {payroll.referenceMonth}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Holerite Content */}
        <div className="p-6 sm:p-8 space-y-6 text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-900" id="printable-payslip">
          
          {/* Header Empresa & Empregado */}
          <div className="border border-stone-300 dark:border-stone-700 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 gap-2">
              <div>
                <h2 className="text-base font-black uppercase text-stone-900 dark:text-stone-100">
                  {companyProfile.tradeName || companyProfile.corporateName || 'SILAGEM TESTE 02 - GESTÃO AGRÍCOLA'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  CNPJ: {companyProfile.cnpjCpf || '57.872.222/0001-22'} | {companyProfile.city || 'Boa Esperança do Iguaçu'} - {companyProfile.state || 'PR'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block uppercase">
                  Recibo de Pagamento
                </span>
                <span className="text-sm font-extrabold text-[#009688]">
                  Mês Referência: {payroll.referenceMonth}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Nome do Colaborador:</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">{payroll.employeeName}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Função / Cargo:</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">{payroll.employeeRole}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Admissão:</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {employee?.admissionDate ? formatDateBR(employee.admissionDate) : '01/03/2023'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Situação:</span>
                <span className="font-bold text-emerald-600">
                  {payroll.status === 'pago' ? 'LIQUIDADO' : 'EM PROCESSAMENTO'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Itens (Proventos e Descontos) */}
          <div className="border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase border-b border-stone-300 dark:border-stone-700">
                <tr>
                  <th className="py-2.5 px-3 text-left">Cód.</th>
                  <th className="py-2.5 px-3 text-left">Descrição da Verba</th>
                  <th className="py-2.5 px-3 text-center">Ref.</th>
                  <th className="py-2.5 px-3 text-right">Vencimentos (R$)</th>
                  <th className="py-2.5 px-3 text-right">Descontos (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                <tr>
                  <td className="py-2 px-3 text-stone-400">001</td>
                  <td className="py-2 px-3 font-semibold text-stone-800 dark:text-stone-200">Salário Base Mensal</td>
                  <td className="py-2 px-3 text-center text-stone-500">30d</td>
                  <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(payroll.baseSalary)}
                  </td>
                  <td className="py-2 px-3 text-right text-stone-400">-</td>
                </tr>

                {payroll.overtimeAmount > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-stone-400">012</td>
                    <td className="py-2 px-3 font-semibold text-stone-800 dark:text-stone-200">
                      Horas Extras / Adicional Safra & Colheita
                    </td>
                    <td className="py-2 px-3 text-center text-stone-500">{payroll.overtimeHours ? `${payroll.overtimeHours}h` : '--'}</td>
                    <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyBRL(payroll.overtimeAmount)}
                    </td>
                    <td className="py-2 px-3 text-right text-stone-400">-</td>
                  </tr>
                )}

                {payroll.bonusAmount > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-stone-400">024</td>
                    <td className="py-2 px-3 font-semibold text-stone-800 dark:text-stone-200">
                      Insalubridade / Bônus Produtividade
                    </td>
                    <td className="py-2 px-3 text-center text-stone-500">--</td>
                    <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyBRL(payroll.bonusAmount)}
                    </td>
                    <td className="py-2 px-3 text-right text-stone-400">-</td>
                  </tr>
                )}

                {payroll.inssDiscount > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-stone-400">101</td>
                    <td className="py-2 px-3 font-semibold text-stone-800 dark:text-stone-200">
                      Desconto Previdência Social (INSS)
                    </td>
                    <td className="py-2 px-3 text-center text-stone-500">Oficial</td>
                    <td className="py-2 px-3 text-right text-stone-400">-</td>
                    <td className="py-2 px-3 text-right font-medium text-rose-600 dark:text-rose-400">
                      {formatCurrencyBRL(payroll.inssDiscount)}
                    </td>
                  </tr>
                )}

                {payroll.advancesDiscount > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-stone-400">110</td>
                    <td className="py-2 px-3 font-semibold text-stone-800 dark:text-stone-200">
                      Adiantamento Salarial / Vales do Mês
                    </td>
                    <td className="py-2 px-3 text-center text-stone-500">Vales</td>
                    <td className="py-2 px-3 text-right text-stone-400">-</td>
                    <td className="py-2 px-3 text-right font-medium text-rose-600 dark:text-rose-400">
                      {formatCurrencyBRL(payroll.advancesDiscount)}
                    </td>
                  </tr>
                )}

                {payroll.otherDiscounts > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-stone-400">120</td>
                    <td className="py-2 px-3 font-semibold text-stone-800 dark:text-stone-200">
                      Outros Descontos / Faltas / Farmácia
                    </td>
                    <td className="py-2 px-3 text-center text-stone-500">--</td>
                    <td className="py-2 px-3 text-right text-stone-400">-</td>
                    <td className="py-2 px-3 text-right font-medium text-rose-600 dark:text-rose-400">
                      {formatCurrencyBRL(payroll.otherDiscounts)}
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Totais */}
              <tfoot className="bg-stone-50 dark:bg-stone-800/60 font-bold border-t border-stone-300 dark:border-stone-700">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right text-stone-600 dark:text-stone-400">
                    Totais das Verbas:
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(totalEarnings)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">
                    {formatCurrencyBRL(totalDiscounts)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Resumo Líquido */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 dark:bg-stone-800/50 border border-stone-300 dark:border-stone-700 rounded-xl p-4">
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block uppercase font-bold">
                Total Bruto de Proventos
              </span>
              <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                {formatCurrencyBRL(totalEarnings)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block uppercase font-bold">
                Total de Deduções
              </span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                - {formatCurrencyBRL(totalDiscounts)}
              </span>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-stone-300 dark:border-stone-700 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-[11px] text-[#009688] block uppercase font-black tracking-wider">
                Valor Líquido a Receber
              </span>
              <span className="text-lg font-black text-[#009688]">
                {formatCurrencyBRL(payroll.netSalary)}
              </span>
            </div>
          </div>

          {/* Campo de Assinatura */}
          <div className="pt-6 border-t border-dashed border-stone-300 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-6">
            <div className="text-left w-full sm:w-auto">
              <p>Recebi a importância líquida supra discriminada.</p>
              <p className="mt-1">Data: ____/____/________</p>
            </div>
            <div className="text-center w-full sm:w-72 border-t border-stone-400 pt-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300 block">{payroll.employeeName}</span>
              <span className="text-[10px] text-stone-400">Assinatura do Funcionário</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
