import React, { useEffect, useState } from 'react';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  testCredentials,
  type InstagramAccount,
  type AccountPayload,
} from '../api/apiClient';

interface FormState {
  accountName: string;
  appId: string;
  appSecret: string;
  accessToken: string;
  tokenExpiresAt: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  accountName: '',
  appId: '',
  appSecret: '',
  accessToken: '',
  tokenExpiresAt: '',
  isActive: true,
};

const getToken = () => localStorage.getItem('token') || '';

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstagramAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAccounts(getToken());
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (acc: InstagramAccount) => {
    setEditing(acc);
    setForm({
      accountName: acc.accountName || '',
      appId: acc.appId || '',
      appSecret: '',
      accessToken: '',
      tokenExpiresAt: acc.tokenExpiresAt ? acc.tokenExpiresAt.substring(0, 10) : '',
      isActive: acc.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const expires = form.tokenExpiresAt ? new Date(form.tokenExpiresAt).toISOString() : null;
      if (editing) {
        const payload: AccountPayload = {
          accountName: form.accountName,
          appId: form.appId || undefined,
          appSecret: form.appSecret || undefined,
          accessToken: form.accessToken || undefined,
          isActive: form.isActive,
          tokenExpiresAt: expires,
        };
        await updateAccount(editing.id, payload, getToken());
        setSuccess('Account updated successfully.');
      } else {
        const payload: AccountPayload = {
          accountName: form.accountName,
          appId: form.appId,
          appSecret: form.appSecret,
          accessToken: form.accessToken,
          tokenExpiresAt: expires,
        };
        await createAccount(payload, getToken());
        setSuccess('Account created successfully.');
      }
      closeDialog();
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (acc: InstagramAccount) => {
    if (!window.confirm(`Delete account "${acc.accountName}"? This cannot be undone.`)) return;
    setError('');
    setSuccess('');
    try {
      await deleteAccount(acc.id, getToken());
      setSuccess('Account deleted.');
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    }
  };

  const handleTest = async (acc: InstagramAccount) => {
    setTesting(acc.id);
    setError('');
    setSuccess('');
    try {
      const result = await testCredentials(acc.id, getToken());
      const valid = result?.valid ?? result?.isValid;
      if (valid === false) {
        setError(`Credentials for "${acc.accountName}" are invalid${result?.message ? ': ' + result.message : '.'}`);
      } else {
        setSuccess(`Credentials for "${acc.accountName}" are valid.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to test credentials');
    } finally {
      setTesting(null);
    }
  };

  const isExpired = (acc: InstagramAccount) =>
    acc.tokenExpiresAt ? new Date(acc.tokenExpiresAt).getTime() < Date.now() : false;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Instagram Accounts</h1>
          <p className="text-gray-500 mt-1">Manage the Graph API credentials used to fetch analytics</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all"
        >
          + Add Account
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-lg">{success}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          No Instagram accounts yet. Click "Add Account" to connect your first set of Graph API credentials.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{acc.accountName}</h3>
                  <p className="text-sm text-gray-400">IG Business ID: {acc.igUserId}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    acc.isActive
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  {acc.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">App ID</span>
                  <span className="font-mono text-gray-700">{acc.appId || '\u2014'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">App Secret</span>
                  <span className="font-mono text-gray-700">
                    {revealed[acc.id] ? acc.appSecret : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Access Token</span>
                  <span className="font-mono text-gray-700 truncate max-w-[55%] text-right">
                    {revealed[acc.id] ? acc.accessToken : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token expiry</span>
                  <span className={isExpired(acc) ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {acc.tokenExpiresAt ? new Date(acc.tokenExpiresAt).toLocaleDateString() : 'No expiry'}
                    {isExpired(acc) ? ' (expired)' : ''}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                <button
                  onClick={() => setRevealed((r) => ({ ...r, [acc.id]: !r[acc.id] }))}
                  className="text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  {revealed[acc.id] ? 'Hide secrets' : 'Show secrets'}
                </button>
                <button
                  onClick={() => handleTest(acc)}
                  disabled={testing === acc.id}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-indigo-300"
                >
                  {testing === acc.id ? 'Testing...' : 'Test credentials'}
                </button>
                <button
                  onClick={() => openEdit(acc)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-800 ml-auto"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(acc)}
                  className="text-sm font-medium text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Account' : 'Add Account'}</h2>
              <button onClick={closeDialog} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Account name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">App ID</label>
                <input
                  type="text"
                  required={!editing}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={form.appId}
                  onChange={(e) => setForm({ ...form, appId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  App Secret {editing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!editing}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={form.appSecret}
                  onChange={(e) => setForm({ ...form, appSecret: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Access Token {editing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!editing}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={form.accessToken}
                  onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Token expiry (optional)</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={form.tokenExpiresAt}
                  onChange={(e) => setForm({ ...form, tokenExpiresAt: e.target.value })}
                />
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Active
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-white transition-all ${
                    submitting
                      ? 'bg-purple-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  }`}
                >
                  {submitting ? 'Saving...' : editing ? 'Save changes' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
