import React, { useState } from 'react';
import { 
  Cloud, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FirebaseStatusControl: React.FC = () => {
  const { 
    currentUser, 
    loading, 
    isConnectedToFirebase, 
    signIn, 
    signOutUser, 
    isSyncing,
    lastSyncedAt
  } = useAuth();

  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signIn();
    } catch (err: any) {
      setAuthError(err?.message || 'Falha ao conectar conta Google');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setIsOpenMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-1.5 px-2 py-1 text-xs text-stone-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleSignIn}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer shadow-2xs active:scale-95"
          title="Fazer login com Google para salvar dados na nuvem Firebase"
        >
          <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">Conectar Firebase</span>
          <LogIn className="w-3 h-3 ml-0.5" />
        </button>

        {authError && (
          <div className="absolute right-0 top-full mt-1 z-50 w-64 p-2 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] text-rose-700 dark:text-rose-300 shadow-md">
            <div className="flex items-start space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpenMenu(prev => !prev)}
        className="inline-flex items-center space-x-2 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition cursor-pointer text-xs"
        title="Status da nuvem Firebase"
      >
        {currentUser.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt={currentUser.displayName || 'Usuário'} 
            className="w-5 h-5 rounded-full object-cover border border-emerald-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
            {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
          </div>
        )}

        <div className="hidden lg:flex flex-col text-left leading-none">
          <span className="font-semibold text-[11px] truncate max-w-[90px]">
            {currentUser.displayName || currentUser.email?.split('@')[0]}
          </span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Nuvem Ativa
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpenMenu && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg p-3 text-xs space-y-2.5">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-2">
            <p className="font-bold text-stone-800 dark:text-stone-200 truncate">
              {currentUser.displayName || 'Usuário Conectado'}
            </p>
            <p className="text-stone-400 dark:text-stone-500 text-[11px] truncate">
              {currentUser.email}
            </p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                Banco Firestore:
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {isConnectedToFirebase ? 'Online' : 'Conectando...'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-sky-500" />
                Status Sync:
              </span>
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {isSyncing ? 'Sincronizando...' : 'Conectado'}
              </span>
            </div>

            {lastSyncedAt && (
              <p className="text-[10px] text-stone-400 pt-1">
                Último sync: {lastSyncedAt.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer font-semibold text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desconectar da Nuvem</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
