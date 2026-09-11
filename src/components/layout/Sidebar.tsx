import React, { useState, useEffect } from 'react';
import { 
  LogOut,
  ChevronRight,
  Sprout,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { CompanyProfile } from '../../types';
import { 
  ReorderMenuModal, 
  ALL_MENU_ITEMS, 
  DEFAULT_MENU_ORDER, 
  MenuItemDef 
} from './ReorderMenuModal';

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  companyProfile?: CompanyProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  companyProfile,
}) => {
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [menuOrder, setMenuOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('silagem_facil_sidebar_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Verify valid items
          const valid = parsed.filter(id => ALL_MENU_ITEMS.some(m => m.id === id));
          if (!valid.includes('venda')) {
            const servIndex = valid.indexOf('servicos');
            if (servIndex !== -1) {
              valid.splice(servIndex + 1, 0, 'venda');
            } else {
              valid.push('venda');
            }
          }
          if (!valid.includes('fiscal')) {
            const finIndex = valid.indexOf('financeiro');
            if (finIndex !== -1) {
              valid.splice(finIndex + 1, 0, 'fiscal');
            } else {
              valid.push('fiscal');
            }
          }
          const missing = ALL_MENU_ITEMS.filter(m => !valid.includes(m.id)).map(m => m.id);
          return [...valid, ...missing];
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_MENU_ORDER;
  });

  const handleSaveOrder = (newOrder: string[]) => {
    setMenuOrder(newOrder);
    try {
      localStorage.setItem('silagem_facil_sidebar_order', JSON.stringify(newOrder));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  // Build sorted navigation list
  const navItems: MenuItemDef[] = menuOrder
    .map(id => ALL_MENU_ITEMS.find(m => m.id === id))
    .filter((item): item is MenuItemDef => Boolean(item));

  return (
    <>
      <aside 
        id="main-sidebar"
        className={`
          no-print fixed inset-y-0 left-0 z-40 w-64 bg-blue-700 dark:bg-stone-900 border-r border-blue-800/60 dark:border-stone-800 flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Section: Logo & Brand */}
        <div className="flex flex-col flex-1 overflow-y-auto bg-blue-700 dark:bg-stone-900 scrollbar-none">
          
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-blue-600/40 dark:border-stone-800 flex items-center space-x-3 cursor-pointer" onClick={() => handleSelect('dashboard')}>
            {companyProfile?.logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-emerald-950/60 border border-white/20 dark:border-emerald-700 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img 
                  src={companyProfile.logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-500 dark:bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30 shrink-0">
                <Sprout className="w-6 h-6 stroke-[2.5]" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-white truncate tracking-tight font-['Outfit']">
                {companyProfile?.tradeName || 'Silagem Fácil'}
              </h2>
              <p className="text-[10px] font-black text-blue-100/80 dark:text-stone-400 tracking-wider uppercase">
                GESTÃO AGRÍCOLA
              </p>
            </div>
          </div>

          {/* Navigation Section Header with Organize Button */}
          <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[11px] font-black text-black dark:text-stone-400 uppercase tracking-wider">
            <span style={{ color: '#000000' }} className="text-black">MENU PRINCIPAL</span>
            <button
              type="button"
              id="btn-sidebar-organize-menu"
              onClick={() => setIsReorderModalOpen(true)}
              className="inline-flex items-center space-x-1 text-[10px] font-bold text-black dark:text-stone-300 hover:text-white hover:bg-blue-600/30 px-1.5 py-0.5 rounded-md transition cursor-pointer"
              title="Personalizar ordem do menu"
            >
              <ArrowUpDown style={{ color: '#000000' }} className="w-3 h-3 text-black dark:text-stone-300" />
              <span style={{ color: '#000000' }} className="text-black">Organizar</span>
            </button>
          </div>

          {/* Navigation List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = 
                activeTab === item.id ||
                (item.id === 'venda' && (activeTab === 'venda' || activeTab === 'vendas')) ||
                (item.id === 'fiscal' && (activeTab === 'nfe_notas' || activeTab === 'nfe_importar')) ||
                (item.id === 'financeiro' && activeTab === 'despesas') ||
                (item.id === 'frotas' && ['veiculos', 'manutencoes', 'combustivel', 'motoristas', 'equipe', 'rodizio', 'rodizio_pneus'].includes(activeTab)) ||
                (item.id === 'rh' && activeTab === 'funcionarios');

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer group
                    ${
                      isActive
                        ? 'bg-blue-500 text-white font-bold shadow-sm shadow-blue-900/30 dark:bg-sky-600 dark:text-white'
                        : 'text-black dark:text-stone-300 hover:bg-blue-600/30 dark:hover:bg-stone-800 hover:text-white dark:hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon 
                      style={!isActive ? { color: '#000000' } : undefined}
                      className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-white' : 'text-black dark:text-stone-400 group-hover:text-white'}`} 
                    />
                    <span 
                      style={!isActive ? { color: '#000000' } : undefined}
                      className={`truncate ${isActive ? 'text-white' : 'text-black'}`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-white shrink-0" />
                  )}

                  {!isActive && item.hasSubmenu && (
                    <ChevronRight className="w-3.5 h-3.5 text-black/70 dark:text-stone-500 group-hover:text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Section: Organize Shortcut & Logout */}
        <div className="p-3 border-t border-blue-600/40 dark:border-stone-800 space-y-1 bg-blue-700 dark:bg-stone-900">
          <button
            type="button"
            onClick={() => setIsReorderModalOpen(true)}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-black dark:text-stone-300 hover:bg-blue-600/30 hover:text-white dark:hover:bg-stone-800 dark:hover:text-white transition cursor-pointer"
          >
            <SlidersHorizontal style={{ color: '#000000' }} className="w-4 h-4 text-black dark:text-stone-300" />
            <span style={{ color: '#000000' }} className="text-black">Organizar Ordem do Menu</span>
          </button>

          <button
            id="btn-sidebar-logout"
            onClick={() => {
              setActiveTab('dashboard');
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#8b2323] hover:bg-rose-600/20 hover:text-white dark:text-rose-400 dark:hover:bg-rose-950/30 transition cursor-pointer"
          >
            <LogOut 
              style={{ color: '#b10e0e' }} 
              className="w-4 h-4 text-[#b10e0e] [&>path:nth-of-type(2)]:stroke-[#cb2b2b] [&>path:nth-of-type(2)]:text-[#cb2b2b]" 
            />
            <span style={{ color: '#8b2323' }} className="text-[#8b2323]">Sair</span>
          </button>
        </div>

      </aside>

      {/* Modal de Reorganização do Menu */}
      <ReorderMenuModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        currentOrder={menuOrder}
        onSaveOrder={handleSaveOrder}
      />
    </>
  );
};
