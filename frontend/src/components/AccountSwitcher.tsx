import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from '../context/AccountContext';
import type { InstagramAccount } from '../api/accountApi';

interface AccountSwitcherProps {
  onOpenAddModal: () => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ onOpenAddModal }) => {
  const { accounts, selectedAccountId, selectedAccount, isAllAccounts, selectAccount } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (acc: InstagramAccount) => {
    if (acc.connectionStatus === 'CONNECTED') {
      return <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected"></span>;
    }
    if (acc.connectionStatus === 'SYNCING') {
      return <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Syncing"></span>;
    }
    return <span className="w-2 h-2 rounded-full bg-rose-500" title="Error/Disconnected"></span>;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-violet-500/50 hover:bg-slate-800/80 transition-all text-slate-200 shadow-sm"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white text-xs font-bold shadow-sm">
          {isAllAccounts ? '🌐' : selectedAccount?.username?.[0]?.toUpperCase() || 'IG'}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs text-slate-400 font-medium">Instagram Account</span>
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            {isAllAccounts ? 'All Accounts (Combined)' : `@${selectedAccount?.username || selectedAccount?.accountName}`}
            {selectedAccount && getStatusBadge(selectedAccount)}
          </span>
        </div>
        <svg
          className={`w-4 h-4 ml-1 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-slate-800/80 bg-slate-950/50">
            <span className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase block">
              View Analytics Mode
            </span>
            <button
              onClick={() => {
                selectAccount('ALL');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isAllAccounts
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <span>All Accounts (Combined)</span>
              </span>
              {isAllAccounts && <span className="text-violet-400 text-xs font-bold">Active</span>}
            </button>
          </div>

          <div className="p-2 max-h-60 overflow-y-auto">
            <span className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase block">
              Connected Accounts ({accounts.length})
            </span>

            {accounts.length === 0 ? (
              <div className="px-3 py-4 text-center text-slate-500 text-xs">
                No Instagram accounts connected yet.
              </div>
            ) : (
              accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      selectAccount(acc.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all mb-1 ${
                      isSelected
                        ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-violet-400 overflow-hidden flex-shrink-0">
                        {acc.profilePicture ? (
                          <img src={acc.profilePicture} alt={acc.username} className="w-full h-full object-cover" />
                        ) : (
                          (acc.username?.[0] || 'I').toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="font-semibold text-white truncate flex items-center gap-1.5">
                          @{acc.username || acc.accountName}
                          {acc.isDefault && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded font-normal">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {acc.followers ? (acc.followers / 1000).toFixed(1) + 'k' : '0'} followers
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(acc)}
                      {isSelected && <span className="text-violet-400 font-bold">✓</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-slate-800/80 bg-slate-950/50">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAddModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-600/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Instagram Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
