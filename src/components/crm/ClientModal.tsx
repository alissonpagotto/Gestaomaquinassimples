import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Search, Loader2 } from 'lucide-react';
import { Client } from '../../types';
import { 
  formatCpfCnpj, 
  formatCep, 
  formatPhone, 
  cleanDigits, 
  fetchAddressByCep, 
  fetchCompanyByCnpj 
} from '../../lib/formatters';

export interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (client: Client) => void;
  onSuccess?: (client: Client) => void;
  editingClient?: Client | null;
  initialName?: string;
  zIndexClass?: string;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  editingClient,
  initialName = '',
  zIndexClass = 'z-[70]',
}) => {
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('PR');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cattleType, setCattleType] = useState<'leite' | 'corte' | 'misto' | 'confinamento' | 'outro'>('leite');
  const [headCount, setHeadCount] = useState<string>('');
  const [monthlyDemandTons, setMonthlyDemandTons] = useState<string>('');
  const [status, setStatus] = useState<'lead' | 'contatado' | 'proposta' | 'cliente_ativo' | 'inativo'>('cliente_ativo');
  const [notes, setNotes] = useState('');

  // Lookup loading states
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setFarmName(editingClient.farmName);
      setCpfCnpj(formatCpfCnpj(editingClient.cpfCnpj || ''));
      setZipCode(formatCep(editingClient.zipCode || ''));
      setAddress(editingClient.address || '');
      setNeighborhood(editingClient.neighborhood || '');
      setCity(editingClient.city);
      setState(editingClient.state);
      setPhone(formatPhone(editingClient.phone));
      setEmail(editingClient.email || '');
      setCattleType(editingClient.cattleType);
      setHeadCount(editingClient.headCount ? editingClient.headCount.toString() : '');
      setMonthlyDemandTons(editingClient.monthlyDemandTons ? editingClient.monthlyDemandTons.toString() : '');
      setStatus(editingClient.status);
      setNotes(editingClient.notes || '');
    } else {
      setName(initialName || '');
      setFarmName('');
      setCpfCnpj('');
      setZipCode('');
      setAddress('');
      setNeighborhood('');
      setCity('');
      setState('PR');
      setPhone('');
      setEmail('');
      setCattleType('leite');
      setHeadCount('');
      setMonthlyDemandTons('');
      setStatus('cliente_ativo');
      setNotes('');
    }
  }, [editingClient, isOpen, initialName]);

  // Handle CNPJ / CPF dynamic typing and auto search
  const handleCpfCnpjChange = async (val: string) => {
    const formatted = formatCpfCnpj(val);
    setCpfCnpj(formatted);
    const digits = cleanDigits(val);
    if (digits.length === 14) {
      await searchCnpj(digits);
    }
  };

  const searchCnpj = async (cnpjDigits?: string) => {
    const digits = cnpjDigits || cleanDigits(cpfCnpj);
    if (digits.length !== 14) {
      setFeedback({ type: 'error', message: 'Digite 14 dígitos para buscar na Receita.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsLoadingCnpj(true);
    setFeedback(null);
    try {
      const res = await fetchCompanyByCnpj(digits);
      if (res.success) {
        if (res.corporateName && !name) setName(res.corporateName);
        if (res.tradeName && !farmName) setFarmName(res.tradeName);
        if (res.phone && !phone) setPhone(formatPhone(res.phone));
        if (res.email && !email) setEmail(res.email);
        if (res.zipCode) setZipCode(formatCep(res.zipCode));
        if (res.street) setAddress(`${res.street}${res.number ? ', Nº ' + res.number : ''}`);
        if (res.neighborhood) setNeighborhood(res.neighborhood);
        if (res.city) setCity(res.city);
        if (res.state) setState(res.state);
        setFeedback({ type: 'success', message: `✅ Dados preenchidos via Receita: ${res.corporateName}` });
      } else {
        setFeedback({ type: 'error', message: res.message || 'CNPJ não encontrado.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha ao buscar CNPJ.' });
    } finally {
      setIsLoadingCnpj(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Handle CEP dynamic typing and auto search
  const handleCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setZipCode(formatted);
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
        setFeedback({ type: 'success', message: `✅ Endereço preenchido: ${res.city}/${res.state}` });
      } else {
        setFeedback({ type: 'error', message: res.message || 'CEP não encontrado.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha ao consultar CEP.' });
    } finally {
      setIsLoadingCep(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Auto calculate estimated monthly demand based on livestock head count
  const handleHeadCountChange = (countStr: string) => {
    setHeadCount(countStr);
    const count = parseInt(countStr);
    if (!isNaN(count) && count > 0) {
      const factor = cattleType === 'leite' ? 0.55 : cattleType === 'confinamento' ? 0.45 : 0.40;
      setMonthlyDemandTons((count * factor).toFixed(0));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !farmName.trim()) {
      alert('Preencha o nome do produtor e da fazenda.');
      return;
    }

    const client: Client = {
      id: editingClient ? editingClient.id : `cli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      farmName: farmName.trim(),
      cpfCnpj: cpfCnpj.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      address: address.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      city: city.trim() || 'Região',
      state: state.trim() || 'PR',
      phone: phone.trim(),
      email: email.trim() || undefined,
      cattleType,
      headCount: headCount ? parseInt(headCount) : undefined,
      monthlyDemandTons: monthlyDemandTons ? parseFloat(monthlyDemandTons) : undefined,
      status,
      notes: notes.trim() || undefined,
      totalPurchasedTons: editingClient?.totalPurchasedTons || 0,
      totalSpent: editingClient?.totalSpent || 0,
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    };

    if (onSuccess) {
      onSuccess(client);
    }
    if (onSave) {
      onSave(client);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto`}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#009688] text-white flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold tracking-tight">
            {editingClient ? 'Editar Produtor / Cliente' : 'Novo Produtor Rural / Pecuarista'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`px-4 py-2 text-xs font-bold text-white flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                NOME DO PRODUTOR / RESPONSÁVEL <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Fontes"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                NOME DA FAZENDA / PROPRIEDADE <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Ex: Fazenda Bela Vista"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
              />
            </div>
          </div>

          {/* CPF / CNPJ and Phone with Auto-formatting and Lookup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                  CPF OU CNPJ (AUTO-BUSCA)
                </label>
                {isLoadingCnpj && (
                  <span className="text-[10px] text-cyan-600 flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Buscando...</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  maxLength={18}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688] pr-9"
                />
                <button
                  type="button"
                  onClick={() => searchCnpj()}
                  disabled={isLoadingCnpj}
                  title="Buscar dados deste CNPJ na Receita Federal"
                  className="absolute right-2 top-2 p-1 text-stone-400 hover:text-[#009688] rounded-md transition"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                WHATSAPP / TELEFONE
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(42) 99823-1144"
                maxLength={15}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
              />
            </div>
          </div>

          {/* CEP, Endereço, Cidade e UF */}
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
                    className="absolute right-2 top-1.5 p-1 text-stone-400 hover:text-emerald-600 rounded-md transition"
                  >
                    <Search className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  ENDEREÇO / LINHA RURAL
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Linha Alto Alegre, Km 04"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-[#009688]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  BAIRRO / COMUNIDADE
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Zona Rural"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-[#009688]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  CIDADE
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Castro"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-[#009688]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  UF / ESTADO
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="PR"
                  maxLength={2}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium uppercase focus:ring-2 focus:ring-[#009688]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                ATIVIDADE PECUÁRIA
              </label>
              <div className="relative">
                <select
                  value={cattleType}
                  onChange={(e) => setCattleType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] font-medium appearance-none pr-8"
                >
                  <option value="leite">Gado de Leite</option>
                  <option value="confinamento">Confinamento de Corte</option>
                  <option value="misto">Gado Misto</option>
                  <option value="corte">Cria & Recria de Corte</option>
                  <option value="outro">Equinos / Ovinos / Outro</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                Nº DE CABEÇAS
              </label>
              <input
                type="number"
                value={headCount}
                onChange={(e) => handleHeadCountChange(e.target.value)}
                placeholder="Ex: 180"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                DEMANDA ESTIMADA (TON/MÊS)
              </label>
              <input
                type="number"
                value={monthlyDemandTons}
                onChange={(e) => setMonthlyDemandTons(e.target.value)}
                placeholder="Ex: 65"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#009688] font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                STATUS NO FUNIL CRM
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-[#009688] appearance-none pr-8"
                >
                  <option value="lead">Lead / Novo Contato</option>
                  <option value="contatado">Contatado / Em Qualificação</option>
                  <option value="proposta">Proposta / Cotação Enviada</option>
                  <option value="cliente_ativo">Cliente Ativo (Comprando)</option>
                  <option value="inativo">Inativo / Pausado</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                E-MAIL (OPCIONAL)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@fazenda.com.br"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-[#009688]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
              OBSERVAÇÕES TÉCNICAS / PREFERÊNCIAS
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Prefere silagem com teor de matéria seca em 33-35%, grãos bem triturados..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-[#009688] resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end space-x-3">
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
              {editingClient ? 'Atualizar Produtor' : 'Salvar Produtor'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// Aliases para uso unificado e flexível em outros módulos
export const NewClientModal = ClientModal;
export const UnifiedClientModal = ClientModal;
export default ClientModal;
