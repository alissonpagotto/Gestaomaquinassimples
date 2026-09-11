import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Loader2, 
  ChevronDown, 
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

export interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  initialName?: string;
  editingSupplier?: Supplier | null;
  zIndexClass?: string;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  editingSupplier = null,
  zIndexClass = 'z-70',
}) => {
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(editingSupplier || null);
  const [registrationTimestamp, setRegistrationTimestamp] = useState<string>(new Date().toISOString());

  // Form states
  const [cnpjOrCpf, setCnpjOrCpf] = useState('');
  const [name, setName] = useState(initialName);
  const [tradeName, setTradeName] = useState('');
  const [category, setCategory] = useState('Combustível');
  const [stateRegistration, setStateRegistration] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('PR');
  const [notes, setNotes] = useState('');

  // Status and feedback
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const populateForm = (sup: Supplier) => {
    setName(sup.name || '');
    setTradeName(sup.tradeName || '');
    setCategory(sup.category || 'Combustível');
    setCnpjOrCpf(sup.cnpjOrCpf ? formatCpfCnpj(sup.cnpjOrCpf) : '');
    setStateRegistration(sup.stateRegistration || '');
    setPhone(sup.phone ? formatPhone(sup.phone) : '');
    setEmail(sup.email || '');
    setZipCode(sup.zipCode ? formatCep(sup.zipCode) : '');
    setAddress(sup.address || '');
    setNeighborhood(sup.neighborhood || '');
    setCity(sup.city || '');
    setState(sup.state || 'PR');
    setNotes(sup.notes || '');
  };

  const resetForm = () => {
    setName(initialName || '');
    setTradeName('');
    setCategory('Combustível');
    setCnpjOrCpf('');
    setStateRegistration('');
    setPhone('');
    setEmail('');
    setZipCode('');
    setAddress('');
    setNeighborhood('');
    setCity('');
    setState('PR');
    setNotes('');
  };

  useEffect(() => {
    if (isOpen) {
      if (editingSupplier) {
        setActiveSupplier(editingSupplier);
        populateForm(editingSupplier);
      } else {
        setActiveSupplier(null);
        resetForm();
        setRegistrationTimestamp(new Date().toISOString());
      }
      setFeedback(null);
    }
  }, [isOpen, editingSupplier, initialName]);

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
      setFeedback({ type: 'error', message: 'Digite 14 dígitos de CNPJ para buscar na Receita Federal.' });
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
      setFeedback({ type: 'error', message: 'Erro ao consultar CNPJ na Receita Federal.' });
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

  const handleCancel = () => {
    if (activeSupplier) {
      populateForm(activeSupplier);
      setFeedback({ type: 'success', message: 'Alterações revertidas para os dados salvos.' });
    } else {
      resetForm();
      setFeedback({ type: 'success', message: 'Formulário limpo com sucesso.' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, informe a Razão Social ou Nome do fornecedor.' });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const now = new Date().toISOString();
    const isEditing = !!activeSupplier;
    const supplierId = activeSupplier?.id || `sup_${Date.now()}`;

    const savedSupplier: Supplier = {
      id: supplierId,
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
      notes: notes.trim() || undefined,
      createdAt: activeSupplier?.createdAt || registrationTimestamp,
      updatedAt: isEditing ? now : undefined,
    };

    onSave(savedSupplier);
    setActiveSupplier(savedSupplier);
    setFeedback({
      type: 'success',
      message: isEditing ? '✅ Dados do fornecedor atualizados com sucesso!' : '✅ Fornecedor cadastrado com sucesso!'
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const formatDateTimeBR = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-3 sm:p-4 bg-[#0a8bc1]/85 backdrop-blur-xs overflow-y-auto`}>
      <div className="bg-[#0a8bc1] rounded-2xl w-[90vw] max-w-6xl shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="px-5 py-3 bg-[#0963cb] text-white flex items-center justify-between relative">
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
            Cadastro Fornecedor
          </h3>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`px-5 py-2 text-xs sm:text-sm font-bold text-white flex items-center justify-between shadow-xs transition ${
            feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-100 flex-shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button 
              type="button"
              onClick={() => setFeedback(null)} 
              className="text-white/80 hover:text-white px-2 py-0.5 rounded-sm hover:bg-white/20 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 bg-[#0a8bc1] max-h-[92vh] overflow-y-auto">
          
          {/* Card 1: Dados Principais & Contato */}
          <div className="bg-[#b0d2ed] p-3 sm:p-3.5 rounded-xl border border-[#96c1e5] shadow-2xs space-y-2.5">
            {/* Linha 1: CNPJ/CPF (Auto-preenchimento), Razão Social / Nome, Nome Fantasia */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-black uppercase tracking-wider">
                    CNPJ OU CPF (AUTO-PREENCHIMENTO)
                  </label>
                  {isLoadingCnpj && (
                    <span className="text-[10px] text-black font-bold flex items-center space-x-1">
                      <Loader2 className="w-3 h-3 animate-spin text-[#0963cb]" />
                      <span>Buscando...</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={cnpjOrCpf}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                    maxLength={18}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb] pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => searchCnpj()}
                    disabled={isLoadingCnpj}
                    title="Buscar dados deste fornecedor na Receita Federal"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-black hover:text-[#0963cb] rounded-md transition cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  RAZÃO SOCIAL / NOME <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  NOME FANTASIA
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>
            </div>

            {/* Linha 2: Categoria Principal, Inscrição Estadual e WhatsApp / Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  CATEGORIA PRINCIPAL
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white text-black focus:ring-2 focus:ring-[#0963cb] font-medium appearance-none pr-8 cursor-pointer"
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
                  <ChevronDown className="w-4 h-4 text-black absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  INSCRIÇÃO ESTADUAL
                </label>
                <input
                  type="text"
                  value={stateRegistration}
                  onChange={(e) => setStateRegistration(formatIE(e.target.value))}
                  maxLength={18}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  WHATSAPP / TELEFONE
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={15}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Endereço & Localização */}
          <div className="bg-[#b0d2ed] p-3 sm:p-3.5 rounded-xl border border-[#96c1e5] shadow-2xs space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-black uppercase tracking-wider">
                    CEP
                  </label>
                  {isLoadingCep && (
                    <span className="text-[10px] text-black font-bold flex items-center space-x-1">
                      <Loader2 className="w-3 h-3 animate-spin text-[#0963cb]" />
                      <span>Buscando...</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0963cb] pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => searchCep()}
                    disabled={isLoadingCep}
                    title="Buscar endereço deste CEP"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-black hover:text-[#0963cb] rounded-md transition cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  ENDEREÇO / LOGRADOURO
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  BAIRRO / COMUNIDADE
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  CIDADE
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  ESTADO (UF)
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium uppercase focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Informações Complementares & Observações */}
          <div className="bg-[#b0d2ed] p-3 sm:p-3.5 rounded-xl border border-[#96c1e5] shadow-2xs space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  E-MAIL COMERCIAL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0963cb]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  OBSERVAÇÕES / DADOS BANCÁRIOS / PIX
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 bg-white text-black text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0963cb] resize-none h-10 sm:h-11 leading-snug"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2.5 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Auditoria Automática (Canto inferior esquerdo) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-black">
              <span className="inline-flex items-center space-x-1">
                <span className="font-bold text-black">Cadastrado em:</span>
                <span className="text-black/80">
                  {activeSupplier?.createdAt ? (formatDateTimeBR(activeSupplier.createdAt) || '—') : formatDateTimeBR(registrationTimestamp)}
                </span>
              </span>
              <span className="text-black/40 hidden sm:inline">•</span>
              <span className="inline-flex items-center space-x-1">
                <span className="font-bold text-black">Alterado em:</span>
                <span className="text-black/80">
                  {activeSupplier?.updatedAt ? (formatDateTimeBR(activeSupplier.updatedAt) || 'Sem alterações') : 'Sem alterações'}
                </span>
              </span>
            </div>

            {/* Ações (Canto inferior direito: [Cancelar] [Sair] [Salvar Fornecedor]) */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-2.5">
              <button
                type="button"
                onClick={handleCancel}
                title="Descartar alterações não salvas"
                className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer border border-stone-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Fechar janela de cadastro"
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer border border-stone-300"
              >
                Sair
              </button>
              <button
                type="submit"
                className="px-5 sm:px-6 py-2 rounded-xl bg-[#0963cb] hover:bg-[#0852a8] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
              >
                {activeSupplier ? 'Salvar Fornecedor' : 'Salvar Fornecedor'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default SupplierModal;
