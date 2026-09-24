import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { accountApi } from '../api/accountApi';
import type { InstagramAccount, CreateAccountPayload } from '../api/accountApi';

interface AccountContextType {
  accounts: InstagramAccount[];
  selectedAccountId: string | 'ALL';
  selectedAccount: InstagramAccount | null;
  isAllAccounts: boolean;
  isLoading: boolean;
  error: string | null;
  selectAccount: (id: string | 'ALL') => void;
  refreshAccounts: () => Promise<void>;
  createAccount: (data: CreateAccountPayload) => Promise<InstagramAccount>;
  setDefaultAccount: (id: string) => Promise<void>;
  syncAccount: (id: string) => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  renameAccountLabel: (id: string, label: string) => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const STORAGE_KEY = 'selected_instagram_account_id';

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'ALL'>(() => {
    return localStorage.getItem(STORAGE_KEY) || 'ALL';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await accountApi.listAccounts();
      setAccounts(data);

      // If selected account is not 'ALL' and no longer exists in list, fallback to default or 'ALL'
      if (selectedAccountId !== 'ALL' && data.length > 0) {
        const exists = data.some((a) => a.id === selectedAccountId);
        if (!exists) {
          const defaultAcc = data.find((a) => a.isDefault) || data[0];
          setSelectedAccountId(defaultAcc.id);
          localStorage.setItem(STORAGE_KEY, defaultAcc.id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError(err.message || 'Failed to load Instagram accounts');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    refreshAccounts();
  }, []);

  const selectAccount = (id: string | 'ALL') => {
    setSelectedAccountId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const handleCreateAccount = async (data: CreateAccountPayload) => {
    const created = await accountApi.createAccount(data);
    await refreshAccounts();
    selectAccount(created.id);
    return created;
  };

  const handleSetDefault = async (id: string) => {
    await accountApi.setDefaultAccount(id);
    await refreshAccounts();
  };

  const handleSync = async (id: string) => {
    await accountApi.syncAccount(id);
    await refreshAccounts();
  };

  const handleDisconnect = async (id: string) => {
    await accountApi.disconnectAccount(id);
    await refreshAccounts();
  };

  const handleDelete = async (id: string) => {
    await accountApi.deleteAccount(id);
    if (selectedAccountId === id) {
      selectAccount('ALL');
    }
    await refreshAccounts();
  };

  const handleRenameLabel = async (id: string, label: string) => {
    await accountApi.renameAccountLabel(id, label);
    await refreshAccounts();
  };

  const selectedAccount =
    selectedAccountId === 'ALL'
      ? null
      : accounts.find((a) => a.id === selectedAccountId) || null;

  const isAllAccounts = selectedAccountId === 'ALL';

  return (
    <AccountContext.Provider
      value={{
        accounts,
        selectedAccountId,
        selectedAccount,
        isAllAccounts,
        isLoading,
        error,
        selectAccount,
        refreshAccounts,
        createAccount: handleCreateAccount,
        setDefaultAccount: handleSetDefault,
        syncAccount: handleSync,
        disconnectAccount: handleDisconnect,
        deleteAccount: handleDelete,
        renameAccountLabel: handleRenameLabel,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
