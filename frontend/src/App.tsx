import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AccountProvider } from './context/AccountContext';
import { AccountSwitcher } from './components/AccountSwitcher';
import { accountApi } from './api/accountApi';

const primaryNav = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/campaigns/live', label: 'Live Campaigns' },
  { to: '/app/campaigns', label: 'All Campaigns' },
  { to: '/app/links', label: 'Instagram Links' },
  { to: '/app/campaign-analyzer', label: 'Campaign Link Analyzer' },
  { to: '/app/content-performance', label: 'Content Performance' },
  { to: '/app/audience', label: 'Audience Analytics' },
  { to: '/app/reports', label: 'Reports' },
];

const secondaryNav = [
  { to: '/app/accounts', label: 'Accounts', icon: '👤' },
  { to: '/app/compare-accounts', label: 'Compare Accounts', icon: '⚔️' },
  { to: '/app/growth', label: 'Growth Analytics', icon: '📈' },
  { to: '/app/reels', label: 'Reel Analytics', icon: '🎬' },
  { to: '/app/stories', label: 'Story Analytics', icon: '📸' },
  { to: '/app/ai-studio', label: 'AI Studio', icon: '✨' },
  { to: '/app/competitors', label: 'Competitors', icon: '🎯' },
  { to: '/app/calendar', label: 'Calendar', icon: '📅' },
  { to: '/app/hashtags', label: 'Hashtags', icon: '🏷️' },
  { to: '/app/best-time', label: 'Best Time', icon: '⏰' },
  { to: '/app/settings', label: 'Settings', icon: '⚙️' },
];

function AppContent() {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    accountName: '',
    username: '',
    displayName: '',
    appId: '10928374829104',
    appSecret: 'app_sec_demo_98234190',
    accessToken: 'EAACEdEose0cBA1923849182390182390123890123890',
    isDefault: false,
  });

  const isLoggedIn = !!(localStorage.getItem('token') || localStorage.getItem('auth_token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountApi.createAccount({
        accountName: addForm.accountName,
        username: addForm.username || addForm.accountName.toLowerCase().replace(/\s+/g, '_'),
        displayName: addForm.displayName || addForm.accountName,
        appId: addForm.appId,
        appSecret: addForm.appSecret,
        accessToken: addForm.accessToken,
        isDefault: addForm.isDefault,
      });
      setIsAddModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to connect account');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <nav className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-16 items-center gap-2">
            <div className="flex items-center space-x-1 lg:space-x-2 overflow-x-auto py-1">
              <NavLink to="/app/dashboard" className="flex-shrink-0 flex items-center mr-1 lg:mr-3">
                <h1 className="text-base lg:text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 whitespace-nowrap tracking-tight">
                  Instagram Analytics
                </h1>
              </NavLink>

              <div className="flex items-center space-x-1">
                {primaryNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}

                {/* More Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg whitespace-nowrap flex items-center gap-1 transition-all"
                  >
                    <span>More</span>
                    <span className="text-[10px]">▼</span>
                  </button>

                  {isMoreOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs"
                      onMouseLeave={() => setIsMoreOpen(false)}
                    >
                      {secondaryNav.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMoreOpen(false)}
                          className={({ isActive }) =>
                            `px-4 py-2 flex items-center gap-2 font-medium transition-all ${
                              isActive
                                ? 'bg-violet-600/20 text-violet-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`
                          }
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <AccountSwitcher onOpenAddModal={() => setIsAddModalOpen(true)} />
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl shadow-md transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Connect Instagram Account</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account / Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nike Football"
                  value={addForm.accountName}
                  onChange={(e) => setAddForm({ ...addForm, accountName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Instagram Handle (@username)</label>
                <input
                  type="text"
                  placeholder="e.g. nikefootball"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Meta Access Token</label>
                <input
                  type="password"
                  placeholder="EAACEdEose0cBA..."
                  value={addForm.accessToken}
                  onChange={(e) => setAddForm({ ...addForm, accessToken: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addForm.isDefault}
                  onChange={(e) => setAddForm({ ...addForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-0 bg-slate-950 cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-slate-300 cursor-pointer">
                  Set as default active Instagram account
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-600/25"
                >
                  Connect Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AccountProvider>
      <AppContent />
    </AccountProvider>
  );
}
