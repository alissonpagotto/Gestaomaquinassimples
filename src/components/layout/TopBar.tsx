import React, { useRef } from 'react';
import { 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Moon, 
  Sun, 
  Menu,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { 
  ALL_SHORTCUTS, 
  DEFAULT_SHORTCUT_IDS 
} from './CustomizeShortcutsModal';
import { SupabaseStatusControl } from './SupabaseStatusControl';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenMobileMenu: () => void;
  onOpenQuickMemo?: () => void;
  onOpenTrialInfo?: () => void;
  selectedShortcuts?: string[];
  onOpenCustomizeShortcuts?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  onOpenMobileMenu,
  onOpenTrialInfo,
  selectedShortcuts = DEFAULT_SHORTCUT_IDS,
  onOpenCustomizeShortcuts,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  // Filter and order shortcuts based on user's active choices
  const visiblePills = selectedShortcuts
    .map(id => ALL_SHORTCUTS.find(s => s.id === id))
    .filter((s): s is typeof ALL_SHORTCUTS[number] => Boolean(s));

  return (
    <div id="top-bar-container" className="no-print sticky top-0 z-30 bg-[#0963cb] border-b border-[#0852a8] shadow-xs">
      
      {/* Top Banner: Período de Teste */}
      <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 px-4 py-1.5 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
        <div className="flex items-center space-x-2 truncate">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="font-semibold truncate">
            Período de teste — restam 5 dias.
          </span>
          <button 
            onClick={onOpenTrialInfo}
            className="underline font-bold hover:text-rose-900 dark:hover:text-rose-100 transition cursor-pointer"
          >
            Ativar agora
          </button>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-rose-600 dark:text-rose-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Silagem Fácil Pro • Modo Completo</span>
        </div>
      </div>

      {/* Horizontal Carousel & Controls Bar: Fundo azul padrão #0963cb */}
      <div className="px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 bg-[#0963cb]">
        
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-white hover:bg-white/15 transition cursor-pointer"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Carousel Container */}
        <div className="flex-1 flex items-center min-w-0 max-w-full overflow-hidden">
          
          {/* Scroll Left Button */}
          <button
            onClick={scrollLeft}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition shrink-0 cursor-pointer"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Pills List - Pure buttons only, no inline edit icons */}
          <div 
            ref={carouselRef}
            className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1 px-1.5 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {visiblePills.map((pill) => {
              const Icon = pill.icon;
              const isSelected = activeTab === pill.id ||
                (pill.id === 'venda' && (activeTab === 'venda' || activeTab === 'vendas')) ||
                (pill.id === 'fiscal' && (activeTab === 'nfe_notas' || activeTab === 'nfe_importar')) ||
                (pill.id === 'frotas' && ['veiculos', 'manutencoes', 'combustivel', 'motoristas', 'equipe', 'rodizio', 'rodizio_pneus'].includes(activeTab));

              return (
                <button
                  key={pill.id}
                  id={`top-pill-${pill.id}`}
                  type="button"
                  onClick={() => setActiveTab(pill.id)}
                  className={`
                    inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition shrink-0 cursor-pointer border select-none
                    ${
                      isSelected
                        ? 'bg-[#b0d2ed] text-[#000000] border-[#91bddf] shadow-xs'
                        : 'bg-[#074ea3]/80 hover:bg-[#074ea3] text-white hover:text-white border-blue-400/30'
                    }
                  `}
                  style={isSelected ? { backgroundColor: '#b0d2ed', color: '#000000' } : undefined}
                >
                  <Icon 
                    className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#000000]' : 'text-blue-100'}`} 
                    style={isSelected ? { color: '#000000' } : undefined}
                  />
                  <span 
                    className={isSelected ? 'text-[#000000] font-bold' : 'text-white'}
                    style={isSelected ? { color: '#000000', fontWeight: 700 } : undefined}
                  >
                    {pill.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={scrollRight}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition shrink-0 cursor-pointer"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>

        {/* Right Tools: Modal de Personalizar Atalhos, Supabase, Notificações e Tema */}
        <div className="flex items-center space-x-1.5 shrink-0 pl-2 border-l border-white/20">
          
          {/* Botão de Atalhos do Topo (Abre o Modal com Checkboxes) */}
          {onOpenCustomizeShortcuts && (
            <button
              type="button"
              id="btn-topbar-customize-shortcuts"
              onClick={onOpenCustomizeShortcuts}
              title="Personalizar Atalhos do Topo"
              aria-label="Personalizar Atalhos do Topo"
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/15 transition cursor-pointer flex items-center justify-center active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Supabase Cloud Sync & DB status */}
          <SupabaseStatusControl />

          {/* Notification Bell */}
          <button
            onClick={() => setActiveTab('funcionarios')}
            title="Notificações e Avisos de CNH"
            className="relative p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/15 transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="btn-theme-toggle"
            type="button"
            onClick={() => setIsDarkMode(prev => !prev)}
            title={isDarkMode ? 'Mudar para modo claro (Light)' : 'Mudar para modo escuro (Dark)'}
            aria-label="Alternar tema claro e escuro"
            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/15 transition cursor-pointer flex items-center justify-center active:scale-95"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 fill-amber-400/20 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-white" />
            )}
          </button>

        </div>

      </div>

    </div>
  );
};

