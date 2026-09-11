import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Loader2, 
  Building2, 
  Truck, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';
import { Supplier } from '../../types';
import { 
  formatCpfCnpj, 
  formatIE, 
  formatCep, 
  formatPhone, 
  cleanDigits, 
  fetchAddressByCep, 
  fetchCompanyByCnpj 
} from '../../lib/formatters';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  initialName?: string;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
}) => {
  const [name, setName] = useState(initialName);
  const [tradeName, setTradeName] = useState('');
  const [category, setCategory] = useState('Combustível');
  const [cnpjOrCpf, setCnpjOrCpf] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('PR');

  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (initialName) {
      setName(initialName);
    }
  }, [initialName]);

  const handleCnpjChange = async (val: string) => {
    const masked = formatCpfCnpj(val);
    setCnpjOrCpf(masked);
    const digits = cleanDigits(val);
    if (digits.length === 14) {
      await searchCnpj(digits);
    }
  };

  const searchCnpj = async (cnpjDigits?: string) => {
    const digits = cnpjDigits || cleanDigits(cnpjOrCpf);
    if (digits.length !== 14) {
      setFeedback({ type: 'error', message: 'Digite 14 dígitos de CNPJ para buscar na Receita.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsLoadingCnpj(true);
    setFeedback(null);
    try {
      const res = await fetchCompanyByCnpj(digits);
      if (res.success) {
        if (res.corporateName) setName(res.corporateName);
        if (res.tradeName) setTradeName(res.tradeName);
        if (res.phone) setPhone(formatPhone(res.phone));
        if (res.email) setEmail(res.email);
        if (res.zipCode) setZipCode(formatCep(res.zipCode));
        if (res.street) setAddress(`${res.street}${res.number ? ', ' + res.number : ''}`);
        if (res.neighborhood) setNeighborhood(res.neighborhood);
        if (res.city) setCity(res.city);
        if (res.state) setState(res.state);
        setFeedback({ type: 'success', message: `✅ Dados preenchidos via Receita: ${res.corporateName}` });
      } else {
        setFeedback({ type: 'error', message: res.message || 'CNPJ não encontrado na Receita.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao consultar CNPJ.' });
    } finally {
      setIsLoadingCnpj(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleCepChange = async (val: string) => {
    const masked = formatCep(val);
    setZipCode(masked);
    const digits = cleanDigits(val);
    if (digits.length === 8) {
      await searchCep(digits);
    }
  };

  const searchCep = async (cepDigits?: string) => {
    const digits = cepDigits || cleanDigits(zipCode);
    if (digits.length !== 8) {
      setFeedback({ type: 'error', message: 'Digite um CEP completo com 8 dígitos.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsLoadingCep(true);
    setFeedback(null);
    try {
      const res = await fetchAddressByCep(digits);
      if (res.success) {
        if (res.street) setAddress(res.street);
        if (res.neighborhood) setNeighborhood(res.neighborhood);
        if (res.city) setCity(res.city);
        if (res.state) setState(res.state);
        setFeedback({ type: 'success', message: `✅ CEP localizado: ${res.city}/${res.state}` });
      } else {
        setFeedback({ type: 'error', message: res.message || 'CEP não localizado.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao consultar CEP.' });
    } finally {
      setIsLoadingCep(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe a Razão Social ou Nome do fornecedor.');
      return;
    }

    const newSupplier: Supplier = {
      id: `sup_${Date.now()}`,
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      category,
      cnpjOrCpf: cnpjOrCpf.trim() || undefined,
      stateRegistration: stateRegistration.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      address: address.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
    };

    onSave(newSupplier);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#009688] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-white" />
            <h3 className="text-base sm:text-lg font-bold tracking-tight">
              Novo Fornecedor
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback notification */}
        {feedback && (
          <div className={`px-4 py-2 text-xs font-bold text-white flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            <span>{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* CNPJ / CPF with auto-lookup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                CNPJ OU CPF (AUTO-PREENCHIMENTO)
              </label>
              {isLoadingCnpj && (
                <span className="text-[10px] text-cyan-600 flex items-center space-x-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Consultando Receita...</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={cnpjOrCpf}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0001-00 ou 000.000.000-00"
                maxLength={18}
                className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688] pr-9"
              />
              <button
                type="button"
                onClick={() => searchCnpj()}
                disabled={isLoadingCnpj}
                title="Buscar dados do fornecedor na Receita"
                className="absolute right-2 top-2 p-1 text-stone-400 hover:text-[#009688] rounded-md transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
              RAZÃO SOCIAL / NOME <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Restaurante Itamarati Ltda"
              className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                NOME FANTASIA
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: Restaurante Itamarati"
                className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                CATEGORIA PRINCIPAL
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
              >
                <option value="Combustível">Combustível & Arla</option>
                <option value="Alimentação & Restaurante">Alimentação & Restaurante</option>
                <option value="Peças & Oficinas">Peças & Manutenção</option>
                <option value="Lonas & Embalagens">Lonas & Embalagens</option>
                <option value="Sementes & Insumos">Sementes & Defensivos</option>
                <option value="Inoculantes">Inoculantes & Nutrição</option>
                <option value="Transporte & Frete">Transporte & Frete</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                INSCRIÇÃO ESTADUAL
              </label>
              <input
                type="text"
                value={stateRegistration}
                onChange={(e) => setStateRegistration(formatIE(e.target.value))}
                placeholder="Isento ou nº IE"
                maxLength={18}
                className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                TELEFONE / WHATSAPP
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(42) 3232-0000"
                maxLength={15}
                className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
              E-MAIL COMERCIAL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendas@fornecedor.com.br"
              className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
            />
          </div>

          {/* CEP & Endereço */}
          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                    CEP
                  </label>
                  {isLoadingCep && (
                    <span className="text-[10px] text-emerald-600 flex items-center space-x-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Buscando...</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-[#009688] pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => searchCep()}
                    disabled={isLoadingCep}
                    title="Buscar endereço deste CEP"
                    className="absolute right-2 top-1.5 p-1 text-stone-400 hover:text-emerald-600 rounded-md transition cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  ENDEREÇO / LOGRADOURO
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Presidente Vargas, 500"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-[#009688]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  CIDADE
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Castro"
                  className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  ESTADO (UF)
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="PR"
                  maxLength={2}
                  className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium uppercase focus:outline-none focus:ring-2 focus:ring-[#009688]"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#156f33] hover:bg-[#0e5224] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
