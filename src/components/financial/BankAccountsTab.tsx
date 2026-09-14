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
  Sparkles,
  FileText,
  Link2
} from 'lucide-react';
import { BankAccount, Expense, BankTransaction, Employee, ExpenseCategory, CorporateCard } from '../../types';
import { formatCurrencyBRL, formatDateBR, getStoredExpenses, saveStoredExpenses } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';
import { BankAccountModal } from './BankAccountModal';
import { BankLogoIcon } from './BankLogoIcon';
import { BankAccountStatementModal } from './BankAccountStatementModal';
import { BankIntegrationCard } from './BankIntegrationCard';

interface BankAccountsTabProps {
  accounts: BankAccount[];
  onSaveAccounts: (accounts: BankAccount[]) => void;
  expenses?: Expense[];
  employees?: Employee[];
  transactions?: BankTransaction[];
  onSaveTransactions?: (transactions: BankTransaction[]) => void;
  onAddExpenseFromBankBill?: (expense: Partial<Expense>) => void;
  onLinkExpensesToAccount?: (expenseIds: string[], accountId: string) => void;
  categories?: ExpenseCategory[];
}

export const BankAccountsTab: React.FC<BankAccountsTabProps> = ({
  accounts,
  onSaveAccounts,
  expenses = [],
  employees = [],
  transactions = [],
  onSaveTransactions,
  onAddExpenseFromBankBill,
  onLinkExpensesToAccount,
  categories = [],
}) => {
  const { confirm } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Extrato Modal State
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementAccountId, setStatementAccountId] = useState<string>('todas');

  // Totais consolidados
  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalOverdraftLimit = accounts.reduce((acc, a) => acc + (a.overdraftLimit || 0), 0);
  const totalAvailableResources = totalBalance + totalOverdraftLimit;

  const handleOpenModal = (acc?: BankAccount) => {
    setEditingAccount(acc || null);
    setIsModalOpen(true);
  };

  const handleOpenStatement = (accountId?: string) => {
    setStatementAccountId(accountId || (accounts[0]?.id || 'todas'));
    setIsStatementOpen(true);
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

  // Manipulador para provisionamento automático de fatura de cartão de crédito corporativo em Contas a Pagar
  const handleProvisionCardInvoice = ({
    card,
    account,
    amount,
    dueDate,
    description,
  }: {
    card: CorporateCard;
    account?: BankAccount;
    amount: number;
    dueDate: string;
    description: string;
  }) => {
    const newExpense: Expense = {
      id: `exp_card_inv_${card.id}_${Date.now()}`,
      description,
      amount,
      categoryId: 'cat_cartao',
      categoryName: 'Fatura de Cartão Corporativo',
      categoryColor: '#8b5cf6',
      dueDate,
      date: new Date().toISOString().split('T')[0],
      status: 'pendente',
      paymentMethod: 'boleto',
      supplier: account ? `${account.bankName} - Cartão Corporativo (${card.name})` : `Cartão Corporativo (${card.name})`,
      bankAccountId: account?.id,
      bankAccountName: account?.name || account?.bankName,
      employeeId: card.responsibleEmployeeId,
      employeeName: card.responsibleEmployeeName,
      corporateCardId: card.id,
      corporateCardName: card.name,
      notes: `Fatura de cartão corporativo provisionada automaticamente para quitação em ${formatDateBR(dueDate)}. Limite Total: ${formatCurrencyBRL(card.totalLimit)}. Titular: ${card.responsibleEmployeeName || 'Não especificado'}.`,
      createdAt: new Date().toISOString(),
    };

    if (onAddExpenseFromBankBill) {
      onAddExpenseFromBankBill(newExpense);
    } else {
      const currentExpenses = getStoredExpenses();
      saveStoredExpenses([newExpense, ...currentExpenses]);
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

  // Manipulador de novos lançamentos manuais no extrato
  const handleAddTransaction = (newTxData: Omit<BankTransaction, 'id' | 'createdAt'>) => {
    const newTx: BankTransaction = {
      ...newTxData,
      id: `tx_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTx, ...transactions];
    if (onSaveTransactions) {
      onSaveTransactions(updatedTransactions);
    }

    // Se for lançamento manual, atualiza também o saldo da conta
    if (newTx.bankAccountId) {
      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === newTx.bankAccountId) {
          const delta = newTx.type === 'entrada' ? newTx.amount : -newTx.amount;
          return {
            ...acc,
            balance: acc.balance + delta,
          };
        }
        return acc;
      });
      onSaveAccounts(updatedAccounts);
    }
  };

  // Manipulador de importação de transações bancárias (OFX / CSV)
  const handleImportBankTransactions = (newTxs: Omit<BankTransaction, 'id' | 'createdAt'>[]) => {
    const formatted: BankTransaction[] = newTxs.map((t, idx) => ({
      ...t,
      id: `tx_imp_${Date.now()}_${idx}`,
      createdAt: new Date().toISOString(),
    }));

    const updatedTransactions = [...formatted, ...transactions];
    if (onSaveTransactions) {
      onSaveTransactions(updatedTransactions);
    }

    // Atualiza os saldos das contas impactadas
    if (newTxs.length > 0) {
      const updatedAccounts = accounts.map((acc) => {
        const matchingTxs = newTxs.filter((tx) => tx.bankAccountId === acc.id);
        if (matchingTxs.length > 0) {
          const netDelta = matchingTxs.reduce((sum, tx) => {
            return sum + (tx.type === 'entrada' ? tx.amount : -tx.amount);
          }, 0);
          return {
            ...acc,
            balance: acc.balance + netDelta,
          };
        }
        return acc;
      });
      onSaveAccounts(updatedAccounts);
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
    <div className="space-y-5">
      {/* Header & Total Balance */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-black">
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão de Ver Extrato Bancário */}
          <button
            type="button"
            id="btn-abrir-extrato-geral"
            onClick={() => handleOpenStatement()}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm rounded-xl border border-stone-300 transition shadow-2xs cursor-pointer active:scale-95"
            title="Abrir Extrato de Contas Bancárias"
          >
            <FileText className="w-4 h-4 text-[#0963cb]" />
            <span>Extrato de Contas Bancárias</span>
          </button>

          {/* Botão de Cadastrar Nova Conta */}
          <button
            type="button"
            id="btn-abrir-nova-conta"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#0963cb] hover:bg-[#0852a8] text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Nova Conta</span>
          </button>
        </div>
      </div>

      {/* NOVO CARD DE INTEGRAÇÃO: "Inserir as contas do Banco" com vinculação direta */}
      <BankIntegrationCard
        accounts={accounts}
        selectedAccountId={statementAccountId !== 'todas' ? statementAccountId : undefined}
        onSelectAccount={(id) => setStatementAccountId(id)}
        expenses={expenses}
        categories={categories}
        onAddExpenseFromBankBill={onAddExpenseFromBankBill}
        onImportBankTransactions={handleImportBankTransactions}
        onLinkExpensesToAccount={onLinkExpensesToAccount}
      />

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0963cb] flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-black">Nenhuma conta bancária cadastrada</h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            Cadastre as contas correntes bancárias, cooperativas de crédito (Sicredi, Sicoob, Banco do Brasil, Caixa, Itaú, Bradesco, Santander, Cresol) ou o caixa físico da fazenda para controlar saldos e conciliações.
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
        <div className={`grid gap-3 ${
          accounts.length === 1 
            ? 'grid-cols-1 max-w-md' 
            : accounts.length === 2 
              ? 'grid-cols-1 sm:grid-cols-2' 
              : accounts.length === 3 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {accounts.map((acc) => {
            const hasOverdraft = (acc.overdraftLimit || 0) > 0;
            const totalAccAvailable = (acc.balance || 0) + (acc.overdraftLimit || 0);

            return (
              <div
                key={acc.id}
                id={`card-conta-${acc.id}`}
                className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-slate-300 hover:shadow-xs transition text-black"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 truncate min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs font-black shrink-0 overflow-hidden"
                        style={{ backgroundColor: acc.color || '#009688' }}
                      >
                        {acc.accountType === 'caixa_fisico' ? (
                          <Wallet className="w-4 h-4" />
                        ) : (
                          <BankLogoIcon code={acc.bankCode} name={acc.bankName} size={18} className="text-white" />
                        )}
                      </div>
                      <div className="truncate min-w-0">
                        <h4 className="font-extrabold text-black text-xs sm:text-[13px] leading-tight truncate">
                          {acc.name}
                        </h4>
                        <div className="flex items-center space-x-1 text-[10px] text-stone-500 font-semibold truncate leading-tight mt-0.5">
                          {acc.bankCode && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold font-mono bg-stone-100 text-stone-600 border border-stone-200">
                              {acc.bankCode}
                            </span>
                          )}
                          <span className="truncate">{acc.bankName}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-stone-700 border border-slate-200 shrink-0 leading-none">
                      {getAccountTypeLabel(acc.accountType)}
                    </span>
                  </div>

                  {/* Card de Saldo Compacto */}
                  <div className="p-2 sm:p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-stone-500 uppercase tracking-wider">
                        {hasOverdraft ? 'Saldo Total Disponível' : 'Saldo em Conta'}
                      </span>
                      {hasOverdraft && (
                        <span className="text-[8.5px] font-black uppercase text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                          + Limite
                        </span>
                      )}
                    </div>

                    <div className={`text-base sm:text-lg font-black font-['Outfit'] leading-tight ${totalAccAvailable >= 0 ? 'text-black' : 'text-rose-600'}`}>
                      {formatCurrencyBRL(hasOverdraft ? totalAccAvailable : acc.balance)}
                    </div>

                    {hasOverdraft && (
                      <div className="text-[9.5px] sm:text-[10px] text-stone-600 font-medium border-t border-slate-200/70 pt-1 flex justify-between items-center leading-tight">
                        <span>Saldo Próprio: <strong className={acc.balance < 0 ? 'text-rose-600' : 'text-stone-900'}>{formatCurrencyBRL(acc.balance)}</strong></span>
                        <span>Limite: <strong className="text-emerald-800">{formatCurrencyBRL(acc.overdraftLimit || 0)}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dados da Base e Ações Integradas */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {/* Dados de Ag/Conta e PIX compactos */}
                  {((acc.agency || acc.accountNumber) || acc.pixKey || (acc.corporateCards && acc.corporateCards.length > 0)) && (
                    <div className="space-y-1 text-[10px] text-stone-600 leading-tight">
                      {(acc.agency || acc.accountNumber) && (
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-stone-400 font-semibold text-[9.5px]">Ag/Conta:</span>
                          <span className="font-bold font-mono text-stone-800 text-[10.5px] truncate">
                            {acc.agency ? `Ag: ${acc.agency}` : ''} 
                            {acc.agency && acc.accountNumber ? ' | ' : ''}
                            {acc.accountNumber ? `CC: ${acc.accountNumber}${acc.accountDigit ? `-${acc.accountDigit}` : ''}` : ''}
                          </span>
                        </div>
                      )}

                      {acc.pixKey && (
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-stone-400 font-semibold text-[9.5px] shrink-0">
                            PIX{acc.pixKeyType ? ` (${acc.pixKeyType.toUpperCase()})` : ''}:
                          </span>
                          <span className="font-mono text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 truncate max-w-[160px]" title={acc.pixKey}>
                            {acc.pixKey}
                          </span>
                        </div>
                      )}

                      {acc.corporateCards && acc.corporateCards.length > 0 && (
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-purple-700 font-semibold text-[9.5px] flex items-center gap-1">
                            <CreditCard className="w-2.5 h-2.5 text-purple-600" />
                            <span>{acc.corporateCards.length} {acc.corporateCards.length === 1 ? 'Cartão' : 'Cartões'}:</span>
                          </span>
                          <span className="font-mono text-[9px] font-bold text-purple-900 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                            {formatCurrencyBRL(acc.corporateCards.reduce((s, c) => s + (c.usedLimit || 0), 0))} util.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Barra de Ações Integrada */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenStatement(acc.id)}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#0963cb] hover:text-blue-800 hover:bg-blue-50/80 px-2 py-1 rounded-md transition cursor-pointer active:scale-95"
                      title="Ver Extrato da Conta"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Ver Extrato</span>
                    </button>

                    <div className="flex items-center space-x-0.5">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(acc)}
                        className="p-1 text-stone-500 hover:text-[#0963cb] hover:bg-sky-50 rounded-md transition cursor-pointer"
                        title="Editar Conta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(acc.id)}
                        className="p-1 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        title="Excluir Conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
        employees={employees}
        expenses={expenses}
        onProvisionCardInvoice={handleProvisionCardInvoice}
      />

      {/* Modal Extrato de Contas Bancárias (com busca obrigatória por intervalo de datas) */}
      <BankAccountStatementModal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        accounts={accounts}
        selectedAccountId={statementAccountId}
        expenses={expenses}
        transactions={transactions}
        employees={employees}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
};
