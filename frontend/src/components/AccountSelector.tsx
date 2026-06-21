import React, { useEffect, useState } from 'react';
import { getAccounts, type InstagramAccount } from '../api/apiClient';

interface Props {
  value: string;
  onChange: (accountId: string) => void;
  label?: string;
}

const AccountSelector: React.FC<Props> = ({ value, onChange, label = 'Instagram Account' }) => {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    getAccounts(token)
      .then((list) => {
        const active = list.filter((a) => a.isActive);
        setAccounts(active);
        if (active.length > 0 && !value) onChange(active[0].id);
      })
      .catch((err) => console.error('Failed to load accounts:', err))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loaded && accounts.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="text-sm text-gray-400 px-4 py-3 rounded-lg border border-dashed border-gray-200">
          No Instagram accounts yet. Add one on the Accounts page.
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Default / linked account</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.accountName} ({a.igUserId})
          </option>
        ))}
      </select>
    </div>
  );
};

export default AccountSelector;
