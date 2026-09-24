import React, { useState } from 'react';
import { useAccount } from '../context/AccountContext';
import type { InstagramAccount } from '../api/accountApi';

export const AccountsPage: React.FC = () => {
  const {
    accounts,
    isLoading,
    error,
    createAccount,
    setDefaultAccount,
    syncAccount,
    disconnectAccount,
    deleteAccount,
    renameAccountLabel,
    selectAccount,
  } = useAccount();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState<InstagramAccount | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Add Account Form State
  const [addForm, setAddForm] = useState({
    accountName: '',
    username: '',
    displayName: '',
    appId: '10928374829104',
    appSecret: 'app_sec_demo_98234190',
    accessToken: 'EAACEdEose0cBA1923849182390182390123890123890',
    isDefault: false,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!addForm.accountName.trim()) {
      setFormError('Account name is required');
      return;
    }
    try {
      setIsSubmitting(true);
      await createAccount({
        accountName: addForm.accountName,
        username: addForm.username || addForm.accountName.toLowerCase().replace(/\s+/g, '_'),
        displayName: addForm.displayName || addForm.accountName,
        appId: addForm.appId,
        appSecret: addForm.appSecret,
        accessToken: addForm.accessToken,
        isDefault: addForm.isDefault,
      });
      setIsAddModalOpen(false);
      setAddForm({
        accountName: '',
        username: '',
        displayName: '',
        appId: '10928374829104',
        appSecret: 'app_sec_demo_98234190',
        accessToken: 'EAACEdEose0cBA1923849182390182390123890123890',
        isDefault: false,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to connect Instagram account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAccount && renameInput.trim()) {
      await renameAccountLabel(targetAccount.id, renameInput.trim());
      setIsRenameModalOpen(false);
      setTargetAccount(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Instagram Accounts
            </h1>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {accounts.length} Connected
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Connect, monitor, and switch seamlessly between your Instagram profiles & brand channels.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-xl shadow-violet-600/20 transition-all hover:scale-[1.02]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Connect New Account</span>
        </button>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Account Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`relative bg-slate-900/80 border rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between shadow-xl ${
                acc.isDefault
                  ? 'border-violet-500/50 shadow-violet-900/10 ring-1 ring-violet-500/20'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-0.5 shadow-md">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {acc.profilePicture ? (
                          <img src={acc.profilePicture} alt={acc.username} className="w-full h-full object-cover" />
                        ) : (
                          (acc.username?.[0] || 'I').toUpperCase()
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        @{acc.username || acc.accountName}
                        {acc.isDefault && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">{acc.displayName || acc.accountName}</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/90 border border-slate-700">
                    {acc.connectionStatus === 'CONNECTED' && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-emerald-300 text-[11px]">Synced</span>
                      </>
                    )}
                    {acc.connectionStatus === 'SYNCING' && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-amber-300 text-[11px]">Syncing</span>
                      </>
                    )}
                    {acc.connectionStatus === 'DISCONNECTED' && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                        <span className="text-slate-400 text-[11px]">Offline</span>
                      </>
                    )}
                    {acc.connectionStatus === 'ERROR' && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="text-rose-300 text-[11px]">Error</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Dashboard Account Metrics */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 mb-4">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Followers</span>
                    <span className="text-sm font-bold text-white">
                      {(acc.followers / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="text-center border-x border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reach</span>
                    <span className="text-sm font-bold text-white">
                      {(acc.reach / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">ER Rate</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {acc.engagementRate?.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Extra Stats */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-4">
                  <span>Posts: <strong className="text-slate-200">{acc.posts}</strong></span>
                  <span>Reels: <strong className="text-slate-200">{acc.reels}</strong></span>
                  <span>Growth: <strong className="text-emerald-400">+{acc.followerGrowth}</strong></span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      selectAccount(acc.id);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold transition-all text-center"
                  >
                    View Analytics
                  </button>

                  <button
                    onClick={() => syncAccount(acc.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    title="Refresh / Sync Account"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      setTargetAccount(acc);
                      setRenameInput(acc.displayName || acc.accountName);
                      setIsRenameModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    title="Rename Label"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  {!acc.isDefault && (
                    <button
                      onClick={() => setDefaultAccount(acc.id)}
                      className="text-slate-400 hover:text-amber-300 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  {acc.connectionStatus === 'CONNECTED' ? (
                    <button
                      onClick={() => disconnectAccount(acc.id)}
                      className="text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => syncAccount(acc.id)}
                      className="text-emerald-400 hover:underline"
                    >
                      Reconnect
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Remove @${acc.username} from your account?`)) {
                        deleteAccount(acc.id);
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Connect Instagram Account */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Connect Instagram Account</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Label / Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Brand Official"
                  value={addForm.accountName}
                  onChange={(e) => setAddForm({ ...addForm, accountName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Instagram Handle / Username</label>
                <input
                  type="text"
                  placeholder="e.g. brand_official"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">App ID</label>
                <input
                  type="text"
                  value={addForm.appId}
                  onChange={(e) => setAddForm({ ...addForm, appId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">App Secret (AES-256 Encrypted)</label>
                <input
                  type="password"
                  value={addForm.appSecret}
                  onChange={(e) => setAddForm({ ...addForm, appSecret: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Graph API Access Token</label>
                <textarea
                  rows={2}
                  value={addForm.accessToken}
                  onChange={(e) => setAddForm({ ...addForm, accessToken: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="setAsDefaultCheck"
                  checked={addForm.isDefault}
                  onChange={(e) => setAddForm({ ...addForm, isDefault: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="setAsDefaultCheck" className="text-xs text-slate-300">Set as default account</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20"
                >
                  {isSubmitting ? 'Connecting...' : 'Connect Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Label */}
      {isRenameModalOpen && targetAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Rename Account Label</h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                required
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                >
                  Save Label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
