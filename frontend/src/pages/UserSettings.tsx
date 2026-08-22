import React, { useState, useEffect } from 'react';

export const UserSettings: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setProfile(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/user/profile/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: password, enable2FA })
      });
      if (res.ok) {
        setMsg('Security settings updated successfully!');
        setPassword('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account and all associated Instagram data? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8080/api/user/profile/delete-account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.clear();
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Profile & Account Security</h2>
        <p className="text-sm text-gray-500">Manage password, 2-Factor Authentication, multi-account settings, and data privacy options.</p>
      </div>

      {profile && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 max-w-xl space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">{profile.fullName || 'Instagram Creator'}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <span className="inline-block mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase">
              Role: {profile.role}
            </span>
          </div>

          {msg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl">
              {msg}
            </div>
          )}

          <form onSubmit={handleUpdateSecurity} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Update Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-gray-100">
              <div>
                <span className="text-sm font-bold text-gray-900">Two-Factor Authentication (2FA)</span>
                <p className="text-xs text-gray-500">Add an extra layer of login security.</p>
              </div>
              <input
                type="checkbox"
                checked={enable2FA}
                onChange={(e) => setEnable2FA(e.target.checked)}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Save Security Changes
            </button>
          </form>

          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-rose-600 uppercase">Danger Zone</h4>
            <p className="text-xs text-gray-500 mt-1 mb-3">Permanently erase your account, access tokens, and stored analytics dataset.</p>
            <button
              onClick={handleDeleteAccount}
              className="bg-rose-50 border border-rose-200 text-rose-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-rose-100 transition-all cursor-pointer"
            >
              🗑️ Delete Account & All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
