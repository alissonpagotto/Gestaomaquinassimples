import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Wallet, 
  Landmark, 
  CreditCard, 
  DollarSign, 
  Sparkles, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle,
  QrCode,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { BankAccount } from '../../types';
import { formatCurrencyBRL } from '../../lib/storage';
import { formatarMoeda, desformatarMoeda } from '../../lib/formatters';
import { BankCombobox } from './BankCombobox';
import { BRAZILIAN_BANKS } from './brazilianBanks';

export interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: BankAccount | null;
  onSave: (account: Omit<BankAccount, 'id'> & { id?: string }) => void;
}

// Opções rápidas de paleta de cores para identificar a conta
const COLOR_PRESETS = [
  { label: 'BB Amarelo', color: '#eab308' },
  { label: 'Bradesco Vermelho', color: '#dc2626' },
  { label: 'Itaú Laranja', color: '#ea580c' },
  { label: 'Santander Vermelho', color: '#e11d48' },
  { label: 'Caixa Azul', color: '#0284c7' },
  { label: 'Nubank Roxo', color: '#8b5cf6' },
  { label: 'Inter Laranja', color: '#f97316' },
  { label: 'Sicredi Verde', color: '#16a34a' },
  { label: 'Sicoob Esmeralda', color: '#059669' },
  { label: 'Teal Agrícola', color: '#0d9488' },
  { label: 'Azul Institucional', color: '#0963cb' },
  { label: 'Cinza / Caixa Sede', color: '#475569' },
];

/**
 * Aplica máscara de acordo com o tipo de chave PIX selecionado
 */
function applyPixMask(value: string, type: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random'): string {
  if (!value) return '';
  switch (type) {
    case 'cpf': {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
    case 'cnpj': {
      const digits = value.replace(/\D/g, '').slice(0, 14);
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
    case 'phone': {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      if (!digits) return '';
      if (digits.length <= 2) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      }
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
    case 'email':
      return value.trim().toLowerCase();
    case 'random':
      return value.trim();
    default:
      return value;
  }
}

/**
 * Identifica o tipo de chave PIX caso esteja editando uma conta antiga sem tipo especificado
 */
function detectPixType(key: string): 'cpf' | 'cnpj' | 'phone' | 'email' | 'random' {
  if (!key) return 'cpf';
  const clean = key.trim();
  if (clean.includes('@')) return 'email';
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 14 || clean.includes('/')) return 'cnpj';
  if (clean.includes('(') || clean.includes(')')) return 'phone';
  if (clean.length > 25 && clean.includes('-')) return 'random';
  if (digits.length === 11 && clean.includes('.')) return 'cpf';
  if (digits.length === 11) return 'cpf';
  if (digits.length === 10) return 'phone';
  return 'cpf';
}

export const BankAccountModal: React.FC<BankAccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount,
  onSave,
}) => {
  // Form State
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('Banco do Brasil');
  const [bankCode, setBankCode] = useState<string | undefined>('001');
  const [accountType, setAccountType] = useState<BankAccount['accountType']>('corrente');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountDigit, setAccountDigit] = useState('');
  
  // Saldo e Cheque Especial
  const [balanceInput, setBalanceInput] = useState('0,00');
  const [isNegativeBalance, setIsNegativeBalance] = useState(false);
  const [overdraftInput, setOverdraftInput] = useState('0,00');
  
  // Chave PIX
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'phone' | 'email' | 'random'>('cpf');
  const [pixKey, setPixKey] = useState('');
  
  // Cor
  const [color, setColor] = useState('#009688');
  const [validationError, setValidationError] = useState('');

  // Sincroniza ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;
    setValidationError('');

    if (editingAccount) {
      setName(editingAccount.name || '');
      setBankName(editingAccount.bankName || 'Banco do Brasil');
      setBankCode(editingAccount.bankCode || undefined);
      setAccountType(editingAccount.accountType || 'corrente');
      setAgency(editingAccount.agency || '');
      setAccountNumber(editingAccount.accountNumber || '');
      setAccountDigit(editingAccount.accountDigit || '');

      // Saldo Inicial
      const currentBal = editingAccount.balance || 0;
      setIsNegativeBalance(currentBal < 0);
      const absBal = Math.abs(currentBal);
      setBalanceInput(absBal > 0 ? formatarMoeda(Math.round(absBal * 100)) : '0,00');

      // Limite de Cheque Especial
      const currentOverdraft = editingAccount.overdraftLimit || 0;
      setOverdraftInput(currentOverdraft > 0 ? formatarMoeda(Math.round(currentOverdraft * 100)) : '0,00');

      // PIX
      const pKey = editingAccount.pixKey || '';
      const pType = editingAccount.pixKeyType || detectPixType(pKey);
      setPixKeyType(pType);
      setPixKey(applyPixMask(pKey, pType));

      setColor(editingAccount.color || '#009688');
    } else {
      setName('');
      setBankName('Banco do Brasil');
      setBankCode('001');
      setAccountType('corrente');
      setAgency('');
      setAccountNumber('');
      setAccountDigit('');
      setBalanceInput('0,00');
      setIsNegativeBalance(false);
      setOverdraftInput('0,00');
      setPixKeyType('cpf');
      setPixKey('');
      setColor('#eab308'); // default yellow for BB
    }
  }, [isOpen, editingAccount]);

  // Cálculos dinâmicos em tempo real
  const numericBalance = useMemo(() => {
    const raw = desformatarMoeda(balanceInput);
    return isNegativeBalance ? -raw : raw;
  }, [balanceInput, isNegativeBalance]);

  const numericOverdraft = useMemo(() => {
    return desformatarMoeda(overdraftInput);
  }, [overdraftInput]);

  // Saldo total disponível para uso = Saldo Próprio + Limite Especial
  const totalAvailable = useMemo(() => {
    return Math.round((numericBalance + numericOverdraft) * 100) / 100;
  }, [numericBalance, numericOverdraft]);

  // Manipulador de troca de banco no Combobox
  const handleBankChange = (newBankName: string, newBankCode?: string, suggestedColor?: string) => {
    setBankName(newBankName);
    setBankCode(newBankCode);
    if (suggestedColor && !editingAccount) {
      setColor(suggestedColor);
    }
  };

  // Manipulador de troca do tipo de chave PIX
  const handlePixTypeChange = (newType: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random') => {
    setPixKeyType(newType);
    setPixKey((prev) => applyPixMask(prev, newType));
  };

  const handlePixKeyChange = (val: string) => {
    const formatted = applyPixMask(val, pixKeyType);
    setPixKey(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Por favor, informe o Nome Identificador da Conta.');
      return;
    }

    if (!bankName.trim()) {
      setValidationError('Por favor, selecione ou informe a Instituição Financeira.');
      return;
    }

    onSave({
      ...(editingAccount ? { id: editingAccount.id } : {}),
      name: name.trim(),
      bankName: bankName.trim(),
      bankCode: bankCode || undefined,
      accountType,
      agency: agency.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      accountDigit: accountDigit.trim().toUpperCase() || undefined,
      balance: numericBalance,
      overdraftLimit: numericOverdraft > 0 ? numericOverdraft : undefined,
      pixKey: pixKey.trim() || undefined,
      pixKeyType: pixKey.trim() ? pixKeyType : undefined,
      color,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      id="modal-cadastro-conta-bancaria"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-xs animate-in fade-in"
      style={{ backgroundColor: 'rgba(10, 139, 193, 0.75)' }} // Azul intermediário com transparência
    >
      <div 
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-[#0963cb]/40 my-auto flex flex-col max-h-[94vh]"
        style={{ backgroundColor: '#b0d2ed' }} // Fundo do bloco: Azul claro #b0d2ed
      >
        {/* CABEÇALHO: Azul forte #0963cb com texto e ícone em branco #ffffff */}
        <div 
          className="px-5 py-3.5 flex items-center justify-between shrink-0 shadow-sm"
          style={{ backgroundColor: '#0963cb', color: '#ffffff' }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária / Caixa'}
              </h3>
              <p className="text-xs text-sky-100 font-medium">
                Gestão de contas correntes, cooperativas de crédito e caixa sede
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-fechar-modal-conta"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-black">
          
          {/* Mensagem de Erro de Validação */}
          {validationError && (
            <div 
              id="alerta-validacao-conta"
              className="p-3 bg-rose-100 border border-rose-400 rounded-xl flex items-center space-x-2 text-rose-900 text-xs font-black animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* BLOCO 1: Identificação da Conta & Marcador Visual */}
          <div className="bg-white/95 rounded-2xl p-4 border border-[#96c1e5] shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              
              {/* Nome Identificador da Conta */}
              <div className="sm:col-span-8">
                <label 
                  htmlFor="input-conta-nome" 
                  className="block text-xs font-black text-black mb-1 flex items-center justify-between"
                >
                  <span>
                    Nome Identificador da Conta <span className="text-rose-600">*</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-semibold">Ex: Conta Principal Agro, Caixa Sede</span>
                </label>
                <input
                  id="input-conta-nome"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setValidationError('');
                    setName(e.target.value);
                  }}
                  placeholder="Ex: Banco do Brasil - Fazenda Sede"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white text-black border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] focus:border-[#0963cb] outline-hidden shadow-2xs"
                />
              </div>

              {/* Cor / Marcador Visual */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-black text-black mb-1 flex items-center justify-between">
                  <span>Marcador Visual</span>
                  <span className="text-[10px] text-stone-500 font-semibold">Etiqueta</span>
                </label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-9 h-9 rounded-xl border border-stone-300 shadow-inner flex items-center justify-center text-white shrink-0 font-bold"
                    style={{ backgroundColor: color }}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1">
                    {COLOR_PRESETS.slice(0, 6).map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setColor(preset.color)}
                        className={`w-6 h-6 rounded-lg transition-transform shrink-0 shadow-2xs cursor-pointer ${
                          color === preset.color ? 'ring-2 ring-black scale-110' : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                      title="Escolher outra cor personalizada"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* BLOCO 2: Instituição Financeira & Dados Bancários */}
          <div className="bg-white/95 rounded-2xl p-4 border border-[#96c1e5] shadow-xs space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              
              {/* 1. Instituição Financeira (Combobox Inteligente com busca por código ou nome) */}
              <div className="sm:col-span-7">
                <label className="block text-xs font-black text-black mb-1 flex items-center justify-between">
                  <span>Instituição Financeira <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-stone-500 font-semibold">Busca por código ou nome</span>
                </label>
                <BankCombobox
                  value={bankName}
                  bankCode={bankCode}
                  onChange={handleBankChange}
                />
              </div>

              {/* 2. Tipo de Conta */}
              <div className="sm:col-span-5">
                <label htmlFor="select-tipo-conta" className="block text-xs font-black text-black mb-1">
                  Tipo de Conta / Destinação
                </label>
                <select
                  id="select-tipo-conta"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white text-black border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] outline-hidden shadow-2xs cursor-pointer"
                >
                  <option value="corrente">Conta Corrente (C.C.)</option>
                  <option value="poupanca">Poupança Agro / Pessoal</option>
                  <option value="aplicacao">Aplicação / Renda Fixa</option>
                  <option value="caixa_fisico">Caixa Físico / Espécie Sede</option>
                </select>
              </div>

            </div>

            {/* Agência, Conta e Dígito (DV) */}
            <div className="grid grid-cols-12 gap-2.5 pt-1">
              {/* Agência */}
              <div className="col-span-5 sm:col-span-4">
                <label htmlFor="input-conta-agencia" className="block text-xs font-black text-black mb-1">
                  Agência
                </label>
                <input
                  id="input-conta-agencia"
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="Ex: 1234-5"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white text-black border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] outline-hidden shadow-2xs font-mono"
                />
              </div>

              {/* Número da Conta */}
              <div className="col-span-5 sm:col-span-6">
                <label htmlFor="input-conta-numero" className="block text-xs font-black text-black mb-1">
                  Número da Conta
                </label>
                <input
                  id="input-conta-numero"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ex: 12345678"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white text-black border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] outline-hidden shadow-2xs font-mono"
                />
              </div>

              {/* Dígito (DV) */}
              <div className="col-span-2 sm:col-span-2">
                <label 
                  htmlFor="input-conta-dv" 
                  className="block text-xs font-black text-black mb-1 truncate text-center"
                  title="Dígito Verificador da Conta"
                >
                  Dígito (DV)
                </label>
                <input
                  id="input-conta-dv"
                  type="text"
                  maxLength={2}
                  value={accountDigit}
                  onChange={(e) => setAccountDigit(e.target.value.toUpperCase())}
                  placeholder="X"
                  className="w-full px-2 py-2 text-xs sm:text-sm font-black bg-white text-black border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] outline-hidden shadow-2xs text-center font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* BLOCO 3: Valores, Saldo Inicial e Limite de Cheque Especial */}
          <div className="bg-white/95 rounded-2xl p-4 border border-[#96c1e5] shadow-xs space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Saldo Inicial / Atual */}
              <div>
                <label 
                  htmlFor="input-conta-saldo" 
                  className="block text-xs font-black text-black mb-1 flex items-center justify-between"
                >
                  <span>Saldo Inicial / Atual (R$)</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setIsNegativeBalance(!isNegativeBalance)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight transition cursor-pointer ${
                        isNegativeBalance
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                      title="Alternar entre saldo positivo e saldo negativo (devedor)"
                    >
                      {isNegativeBalance ? '(-) Negativo' : '(+) Positivo'}
                    </button>
                  </div>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/70 font-black text-xs pointer-events-none select-none">
                    {isNegativeBalance ? '- R$' : 'R$'}
                  </span>
                  <input
                    id="input-conta-saldo"
                    type="text"
                    inputMode="numeric"
                    value={balanceInput}
                    onChange={(e) => {
                      const formatted = formatarMoeda(e.target.value);
                      setBalanceInput(formatted || '0,00');
                    }}
                    className={`w-full pl-12 pr-3 py-2 text-xs sm:text-sm font-black bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] outline-hidden shadow-2xs font-mono ${
                      isNegativeBalance ? 'text-rose-600' : 'text-black'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-stone-500 font-medium block mt-1">
                  Saldo existente no extrato bancário desta conta
                </span>
              </div>

              {/* Limite de Cheque Especial (R$) */}
              <div>
                <label 
                  htmlFor="input-conta-cheque-especial" 
                  className="block text-xs font-black text-black mb-1 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#0963cb]" />
                    <span>Limite de Cheque Especial (R$)</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-semibold">Crédito Rotativo</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/70 font-black text-xs pointer-events-none select-none">
                    R$
                  </span>
                  <input
                    id="input-conta-cheque-especial"
                    type="text"
                    inputMode="numeric"
                    value={overdraftInput}
                    onChange={(e) => {
                      const formatted = formatarMoeda(e.target.value);
                      setOverdraftInput(formatted || '0,00');
                    }}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-black bg-white text-black border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] outline-hidden shadow-2xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-stone-500 font-medium block mt-1">
                  Limite concedido pelo banco para cobertura emergencial
                </span>
              </div>

            </div>

            {/* CARD DE PRÉ-VISUALIZAÇÃO: Saldo Total Disponível para Uso */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-blue-50 to-emerald-50 border border-sky-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-950 block">
                  Saldo Total Disponível para Uso
                </span>
                <div className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                  {formatCurrencyBRL(totalAvailable)}
                </div>
              </div>

              <div className="text-xs text-stone-700 font-medium sm:text-right border-t sm:border-t-0 pt-1.5 sm:pt-0 border-sky-200">
                <div className="flex sm:justify-end items-center gap-1.5 text-[11px]">
                  <span>Saldo em Conta:</span>
                  <strong className={numericBalance < 0 ? 'text-rose-700 font-bold' : 'text-black font-bold'}>
                    {formatCurrencyBRL(numericBalance)}
                  </strong>
                </div>
                <div className="flex sm:justify-end items-center gap-1.5 text-[11px]">
                  <span>+ Limite Especial:</span>
                  <strong className="text-emerald-800 font-bold">
                    {formatCurrencyBRL(numericOverdraft)}
                  </strong>
                </div>
                {numericBalance < 0 && numericOverdraft > 0 && (
                  <span className="text-[10px] text-amber-900 font-bold block mt-0.5">
                    ⚠️ Conta operando no cheque especial
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BLOCO 4: Chave PIX Composta (Tipo + Input Mascarado) */}
          <div className="bg-white/95 rounded-2xl p-4 border border-[#96c1e5] shadow-xs space-y-2.5">
            <label className="block text-xs font-black text-black flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#0963cb]" />
                <span>Chave PIX (Opcional)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-semibold">
                Para recebimentos e transferências rápidas
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Select do Tipo de Chave */}
              <div className="sm:col-span-4">
                <select
                  id="select-tipo-chave-pix"
                  value={pixKeyType}
                  onChange={(e) => handlePixTypeChange(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-black bg-white text-black border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] outline-hidden shadow-2xs cursor-pointer"
                >
                  <option value="cpf">CPF (Pessoa Física)</option>
                  <option value="cnpj">CNPJ (Pessoa Jurídica)</option>
                  <option value="phone">Celular (Telefone)</option>
                  <option value="email">E-mail</option>
                  <option value="random">Chave Aleatória (EVP)</option>
                </select>
              </div>

              {/* Input da Chave com Máscara Dinâmica */}
              <div className="sm:col-span-8">
                <input
                  id="input-chave-pix"
                  type={pixKeyType === 'email' ? 'email' : 'text'}
                  value={pixKey}
                  onChange={(e) => handlePixKeyChange(e.target.value)}
                  placeholder={
                    pixKeyType === 'cpf'
                      ? '000.000.000-00'
                      : pixKeyType === 'cnpj'
                      ? '00.000.000/0000-00'
                      : pixKeyType === 'phone'
                      ? '(00) 00000-0000'
                      : pixKeyType === 'email'
                      ? 'financeiro@agro.com.br'
                      : 'Cole ou digite a chave aleatória...'
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white text-black border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0963cb] outline-hidden shadow-2xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* RODAPÉ DO MODAL: Botões de Ação */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-black/15 shrink-0">
            <button
              type="button"
              id="btn-cancelar-modal-conta"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer transition shadow-2xs min-h-[40px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-salvar-conta-bancaria"
              className="px-6 py-2.5 text-xs sm:text-sm font-black rounded-xl bg-[#0963cb] hover:bg-[#0852a8] text-white shadow-md cursor-pointer transition active:scale-98 flex items-center space-x-1.5 min-h-[40px]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{editingAccount ? 'Atualizar Conta' : 'Salvar Conta'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
