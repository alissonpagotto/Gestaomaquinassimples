import React, { useRef, useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Moon, 
  Sun, 
  Pencil, 
  Menu,
  Sparkles,
  Cloud,
  RefreshCw,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { 
  CustomizeShortcutsModal, 
  ALL_SHORTCUTS, 
  DEFAULT_SHORTCUT_IDS 
} from './CustomizeShortcutsModal';
import { FirebaseStatusControl } from './FirebaseStatusControl';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenMobileMenu: () => void;
  onOpenQuickMemo?: () => void;
  onOpenTrialInfo?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  onOpenMobileMenu,
  onOpenTrialInfo,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  const [selectedShortcuts, setSelectedShortcuts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('silagem_facil_shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SHORTCUT_IDS;
  });

  const handleSaveShortcuts = (newShortcuts: string[]) => {
    setSelectedShortcuts(newShortcuts);
    try {
      localStorage.setItem('silagem_facil_shortcuts', JSON.stringify(newShortcuts));
    } catch (e) {
      console.error(e);
    }
  };

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
    <div id="top-bar-container" className="no-print sticky top-0 z-30 bg-blue-800 dark:bg-stone-900 border-b border-blue-900/60 dark:border-stone-800 shadow-xs">
      
      {/* Top Banner: Período de Teste matching screenshot */}
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

      {/* Horizontal Carousel & Controls Bar */}
      <div className="px-3 sm:px-4 py-1.5 flex items-center justify-between gap-1.5 bg-blue-800 dark:bg-stone-900">
        
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-blue-100 dark:text-stone-300 hover:bg-blue-700/60 dark:hover:bg-stone-800 transition"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Carousel Container */}
        <div className="flex-1 flex items-center min-w-0 max-w-full overflow-hidden">
          
          {/* Scroll Left Button */}
          <button
            onClick={scrollLeft}
            className="p-1 rounded-full text-blue-200 hover:text-white dark:text-stone-400 dark:hover:text-stone-200 hover:bg-blue-700/60 dark:hover:bg-stone-800 transition shrink-0 cursor-pointer"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Pills List */}
          <div 
            ref={carouselRef}
            className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1 px-1.5 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Customize Shortcuts Button (Pencil Icon) */}
            <button
              id="btn-customize-shortcuts"
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              title="Personalizar atalhos rápidos"
              aria-label="Personalizar atalhos da barra superior"
              className="px-2.5 py-1.5 rounded-lg border border-blue-600/60 dark:border-stone-700 bg-blue-900/60 dark:bg-stone-800 hover:bg-blue-700 dark:hover:bg-stone-700 text-blue-100 hover:text-white dark:text-stone-300 transition shrink-0 cursor-pointer flex items-center justify-center active:scale-95 shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* Nav Pills */}
            {visiblePills.map((pill) => {
              const Icon = pill.icon;
              const isSelected = activeTab === pill.id;
              
              return (
                <button
                  key={pill.id}
                  id={`top-pill-${pill.id}`}
                  onClick={() => setActiveTab(pill.id)}
                  className={`
                    inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 cursor-pointer border
                    ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-400 font-bold shadow-xs dark:bg-sky-600 dark:border-sky-600'
                        : 'bg-blue-900/50 hover:bg-blue-700/70 text-blue-100 hover:text-white border-blue-700/60 dark:bg-stone-800/80 dark:text-stone-200 dark:border-stone-700 dark:hover:bg-stone-700 hover:border-blue-500 dark:hover:border-stone-600'
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : pill.iconColor}`} />
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={scrollRight}
            className="p-1 rounded-full text-blue-200 hover:text-white dark:text-stone-400 dark:hover:text-stone-200 hover:bg-blue-700/60 dark:hover:bg-stone-800 transition shrink-0 cursor-pointer"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>

        {/* Right Tools: Firebase, Notifications & Theme */}
        <div className="flex items-center space-x-2 shrink-0 pl-2 border-l border-blue-700/60 dark:border-stone-800">
          
          {/* Firebase Cloud Sync & Auth status */}
          <FirebaseStatusControl />

          {/* Notification Bell */}
          <button
            onClick={() => setActiveTab('funcionarios')}
            title="Notificações e Avisos de CNH"
            className="relative p-2 rounded-lg text-blue-100 hover:text-white hover:bg-blue-700/60 dark:text-stone-300 dark:hover:bg-stone-800 transition cursor-pointer"
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
            className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-blue-700/60 dark:text-stone-300 dark:hover:bg-stone-800 transition cursor-pointer flex items-center justify-center active:scale-95"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 fill-amber-400/20 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-blue-100 hover:text-white" />
            )}
          </button>

        </div>

      </div>

      {/* Modal to customize shortcuts */}
      <CustomizeShortcutsModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        selectedShortcuts={selectedShortcuts}
        onSave={handleSaveShortcuts}
      />

    </div>
  );
};
