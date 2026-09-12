import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Wallet, 
  Landmark, 
  CreditCard, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Trash2,
  Edit2,
  DollarSign,
  QrCode,
  Sparkles
} from 'lucide-react';
import { BankAccount } from '../../types';
import { formatCurrencyBRL } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';
import { BankAccountModal } from './BankAccountModal';
import { BankLogoIcon } from './BankLogoIcon';

interface BankAccountsTabProps {
  accounts: BankAccount[];
  onSaveAccounts: (accounts: BankAccount[]) => void;
}

export const BankAccountsTab: React.FC<BankAccountsTabProps> = ({
  accounts,
  onSaveAccounts,
}) => {
  const { confirm } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Totais consolidados
  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalOverdraftLimit = accounts.reduce((acc, a) => acc + (a.overdraftLimit || 0), 0);
  const totalAvailableResources = totalBalance + totalOverdraftLimit;

  const handleOpenModal = (acc?: BankAccount) => {
    setEditingAccount(acc || null);
    setIsModalOpen(true);
  };

  const handleSaveAccount = (accountData: Omit<BankAccount, 'id'> & { id?: string }) => {
    if (accountData.id) {
      const updated = accounts.map((a) =>
        a.id === accountData.id ? ({ ...accountData, id: accountData.id } as BankAccount) : a
      );
      onSaveAccounts(updated);
    } else {
      const newAcc: BankAccount = {
        ...accountData,
        id: `bank_${Date.now()}`,
      } as BankAccount;
      onSaveAccounts([...accounts, newAcc]);
    }
  };

  const handleDelete = async (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    const isConfirmed = await confirm({
      title: 'Excluir Conta Bancária',
      message: acc?.name
        ? `Deseja realmente excluir a conta "${acc.name}" (${acc.bankName})?`
        : 'Deseja realmente excluir esta conta bancária?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      onSaveAccounts(accounts.filter((a) => a.id !== id));
    }
  };

  const getAccountTypeLabel = (type: BankAccount['accountType']) => {
    switch (type) {
      case 'corrente':
        return 'Conta Corrente';
      case 'poupanca':
        return 'Poupança Agro';
      case 'aplicacao':
        return 'Investimento / Aplicação';
      case 'caixa_fisico':
        return 'Caixa Físico / Sede';
      default:
        return 'Conta Bancária';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Balance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-black">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-black uppercase tracking-wider">
              Saldo Consolidado em Contas
            </span>
            {totalOverdraftLimit > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                + Limite Cheque Especial Ativo
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div className="text-2xl sm:text-3xl font-black text-black font-['Outfit']">
              {formatCurrencyBRL(totalAvailableResources)}
            </div>
            {totalOverdraftLimit > 0 && (
              <div className="text-xs text-stone-600 font-semibold">
                (Saldo Próprio: <strong className={totalBalance < 0 ? 'text-rose-600 font-bold' : 'text-black font-bold'}>{formatCurrencyBRL(totalBalance)}</strong> + Limite Especial: <strong className="text-emerald-800 font-bold">{formatCurrencyBRL(totalOverdraftLimit)}</strong>)
              </div>
            )}
          </div>

          <p className="text-xs text-stone-600 font-medium">
            Total disponível somando contas correntes, cooperativas de crédito e caixa sede
          </p>
        </div>

        <button
          type="button"
          id="btn-abrir-nova-conta"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-[#0963cb] hover:bg-[#0852a8] text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Nova Conta</span>
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0963cb] flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-black">Nenhuma conta bancária cadastrada</h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            Cadastre as contas correntes bancárias, cooperativas de crédito (Sicredi, Sicoob, Banco do Brasil) ou o caixa físico da fazenda para controlar saldos e conciliações.
          </p>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0963cb] text-white rounded-xl text-xs font-bold hover:bg-[#0852a8] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Conta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const hasOverdraft = (acc.overdraftLimit || 0) > 0;
            const totalAccAvailable = (acc.balance || 0) + (acc.overdraftLimit || 0);

            return (
              <div
                key={acc.id}
                id={`card-conta-${acc.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition text-black"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 truncate">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs font-black shrink-0 overflow-hidden"
                        style={{ backgroundColor: acc.color || '#009688' }}
                      >
                        {acc.accountType === 'caixa_fisico' ? (
                          <Wallet className="w-5 h-5" />
                        ) : (
                          <BankLogoIcon code={acc.bankCode} name={acc.bankName} size={24} className="text-white" />
                        )}
                      </div>
                      <div className="truncate">
                        <h4 className="font-black text-black text-sm truncate">
                          {acc.name}
                        </h4>
                        <div className="flex items-center space-x-1.5 text-xs text-stone-600 font-bold truncate">
                          {acc.bankCode && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black font-mono bg-stone-100 text-stone-700 border border-stone-200">
                              {acc.bankCode}
                            </span>
                          )}
                          <span className="truncate">{acc.bankName}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-black border border-slate-200 shrink-0">
                      {getAccountTypeLabel(acc.accountType)}
                    </span>
                  </div>

                  {/* Card de Saldo */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-black uppercase tracking-wider">
                        {hasOverdraft ? 'Saldo Total Disponível' : 'Saldo em Conta'}
                      </span>
                      {hasOverdraft && (
                        <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          + Limite Incluso
                        </span>
                      )}
                    </div>

                    <div className={`text-xl font-black font-['Outfit'] ${totalAccAvailable >= 0 ? 'text-black' : 'text-rose-600'}`}>
                      {formatCurrencyBRL(hasOverdraft ? totalAccAvailable : acc.balance)}
                    </div>

                    {hasOverdraft && (
                      <div className="text-[11px] text-stone-600 font-semibold border-t border-slate-200 pt-1.5 flex justify-between items-center">
                        <span>Saldo Próprio: <strong className={acc.balance < 0 ? 'text-rose-600' : 'text-stone-900'}>{formatCurrencyBRL(acc.balance)}</strong></span>
                        <span>Limite: <strong className="text-emerald-800">{formatCurrencyBRL(acc.overdraftLimit || 0)}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Dados Adicionais: Agência, Conta com Dígito e PIX */}
                  <div className="space-y-1.5 text-xs text-black pt-1 font-medium">
                    {(acc.agency || acc.accountNumber) && (
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-semibold">Ag / Conta:</span>
                        <span className="font-bold font-mono text-black">
                          {acc.agency ? `Ag: ${acc.agency}` : ''} 
                          {acc.agency && acc.accountNumber ? ' | ' : ''}
                          {acc.accountNumber ? `CC: ${acc.accountNumber}${acc.accountDigit ? `-${acc.accountDigit}` : ''}` : ''}
                        </span>
                      </div>
                    )}

                    {acc.pixKey && (
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-stone-500 font-semibold shrink-0">
                          PIX {acc.pixKeyType ? `(${acc.pixKeyType.toUpperCase()})` : ''}:
                        </span>
                        <span className="font-mono text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate" title={acc.pixKey}>
                          {acc.pixKey}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(acc)}
                    className="p-2 text-stone-700 hover:text-[#0963cb] hover:bg-sky-50 rounded-xl transition cursor-pointer"
                    title="Editar Conta"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Excluir Conta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastrar / Editar Conta */}
      <BankAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAccount={editingAccount}
        onSave={handleSaveAccount}
      />
    </div>
  );
};
