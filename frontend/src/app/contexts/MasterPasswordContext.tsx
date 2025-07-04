'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MasterPasswordContextType {
  masterPassword: string | null;
  setMasterPassword: (password: string) => void;
  clearMasterPassword: () => void;
  isUnlocked: boolean;
  lockTimeout: number | null;
  setLockTimeout: (timeout: number) => void;
}

const MasterPasswordContext = createContext<MasterPasswordContextType | undefined>(undefined);

export function MasterPasswordProvider({ children }: { children: React.ReactNode }) {
  const [masterPassword, setMasterPasswordState] = useState<string | null>(null);
  const [lockTimeout, setLockTimeoutState] = useState<number | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const setMasterPassword = (password: string) => {
    setMasterPasswordState(password);
    
    // Limpa timeout anterior se existir
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Se há um timeout configurado, inicia o timer
    if (lockTimeout) {
      const newTimeoutId = setTimeout(() => {
        clearMasterPassword();
      }, lockTimeout * 60 * 1000); // Converte minutos para milissegundos
      setTimeoutId(newTimeoutId);
    }
  };

  const clearMasterPassword = () => {
    setMasterPasswordState(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  const setLockTimeout = (timeout: number) => {
    setLockTimeoutState(timeout);
    
    // Se há uma senha mestra ativa, reinicia o timer
    if (masterPassword && timeout > 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const newTimeoutId = setTimeout(() => {
        clearMasterPassword();
      }, timeout * 60 * 1000);
      setTimeoutId(newTimeoutId);
    }
  };

  // Limpa timeout quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const value: MasterPasswordContextType = {
    masterPassword,
    setMasterPassword,
    clearMasterPassword,
    isUnlocked: !!masterPassword,
    lockTimeout,
    setLockTimeout
  };

  return (
    <MasterPasswordContext.Provider value={value}>
      {children}
    </MasterPasswordContext.Provider>
  );
}

export function useMasterPassword() {
  const context = useContext(MasterPasswordContext);
  if (context === undefined) {
    throw new Error('useMasterPassword must be used within a MasterPasswordProvider');
  }
  return context;
} 