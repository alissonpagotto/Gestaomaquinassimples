import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, testConnection } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isConnectedToFirebase: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  isSyncing: boolean;
  setIsSyncing: (val: boolean) => void;
  lastSyncedAt: Date | null;
  setLastSyncedAt: (val: Date | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnectedToFirebase, setIsConnectedToFirebase] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    // Test connection
    testConnection().then((connected) => {
      setIsConnectedToFirebase(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Sign in failed', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out failed', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isConnectedToFirebase,
        signIn,
        signOutUser,
        isSyncing,
        setIsSyncing,
        lastSyncedAt,
        setLastSyncedAt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
