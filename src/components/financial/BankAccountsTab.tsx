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
  DollarSign
} from 'lucide-react';
import { BankAccount } from '../../types';
import { formatCurrencyBRL } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';

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

  // Form State
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('Banco do Brasil');
  const [accountType, setAccountType] = useState<BankAccount['accountType']>('corrente');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('0');
  const [pixKey, setPixKey] = useState('');
  const [color, setColor] = useState('#009688');

  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  const handleOpenModal = (acc?: BankAccount) => {
    if (acc) {
      setEditingAccount(acc);
      setName(acc.name);
      setBankName(acc.bankName);
      setAccountType(acc.accountType);
      setAgency(acc.agency || '');
      setAccountNumber(acc.accountNumber || '');
      setBalance(acc.balance.toString());
      setPixKey(acc.pixKey || '');
      setColor(acc.color || '#009688');
    } else {
      setEditingAccount(null);
      setName('');
      setBankName('Banco do Brasil');
      setAccountType('corrente');
      setAgency('');
      setAccountNumber('');
      setBalance('0');
      setPixKey('');
      setColor('#009688');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBalance = parseFloat(balance) || 0;

    if (editingAccount) {
      const updated = accounts.map((a) =>
        a.id === editingAccount.id
          ? {
              ...a,
              name: name.trim(),
              bankName: bankName.trim(),
              accountType,
              agency: agency.trim(),
              accountNumber: accountNumber.trim(),
              balance: numBalance,
              pixKey: pixKey.trim(),
              color,
            }
          : a
      );
      onSaveAccounts(updated);
    } else {
      const newAcc: BankAccount = {
        id: `bank_${Date.now()}`,
        name: name.trim(),
        bankName: bankName.trim(),
        accountType,
        agency: agency.trim(),
        accountNumber: accountNumber.trim(),
        balance: numBalance,
        pixKey: pixKey.trim(),
        color,
      };
      onSaveAccounts([...accounts, newAcc]);
    }
    setIsModalOpen(false);
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
        return 'Caixa Físico / Espécie';
      default:
        return 'Conta Bancária';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Balance */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-black">
        <div>
          <span className="text-xs font-black text-black uppercase tracking-wider">
            Saldo Consolidado em Contas
          </span>
          <div className="text-2xl sm:text-3xl font-black text-black mt-1 font-['Outfit']">
            {formatCurrencyBRL(totalBalance)}
          </div>
          <p className="text-xs text-black/80 font-medium mt-0.5">
            Total disponível somando contas correntes, cooperativas de crédito e caixa sede
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Conta</span>
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition text-black"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold"
                    style={{ backgroundColor: acc.color || '#009688' }}
                  >
                    {acc.accountType === 'caixa_fisico' ? (
                      <Wallet className="w-5 h-5" />
                    ) : (
                      <Landmark className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-black text-sm">
                      {acc.name}
                    </h4>
                    <p className="text-xs text-black/80 font-medium">
                      {acc.bankName}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-black border border-slate-200">
                  {getAccountTypeLabel(acc.accountType)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-black text-black uppercase tracking-wider">
                  Saldo Disponível
                </span>
                <div className={`text-xl font-black font-['Outfit'] ${acc.balance >= 0 ? 'text-black' : 'text-rose-600'}`}>
                  {formatCurrencyBRL(acc.balance)}
                </div>
              </div>

              <div className="space-y-1 text-xs text-black pt-1 font-medium">
                {acc.agency && acc.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-black/70">Ag / Conta:</span>
                    <span className="font-bold text-black">
                      Ag: {acc.agency} | CC: {acc.accountNumber}
                    </span>
                  </div>
                )}
                {acc.pixKey && (
                  <div className="flex justify-between items-center">
                    <span className="text-black/70">Chave PIX:</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
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
                className="p-2 text-black hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                title="Editar Conta"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(acc.id)}
                className="p-2 text-black hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Excluir Conta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Cadastrar / Editar Conta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária / Caixa'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nome Identificador da Conta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Banco do Brasil - Safra, Sicredi, Caixa Dinheiro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Instituição Financeira
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Banco do Brasil, Sicredi, Sicoob"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] outline-none"
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="poupanca">Poupança</option>
                    <option value="aplicacao">Aplicação / Renda Fixa</option>
                    <option value="caixa_fisico">Caixa Físico / Sede</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Agência
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 0458-2"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Número da Conta
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 28.940-1"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Saldo Inicial / Atual (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Chave PIX (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="CNPJ, E-mail ou Telefone"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#009688] hover:bg-[#00796b] text-white shadow-xs"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
