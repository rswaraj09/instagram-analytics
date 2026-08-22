import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/app/analytics', label: 'Dashboard' },
  { to: '/app/growth', label: 'Growth' },
  { to: '/app/audience', label: 'Audience' },
  { to: '/app/reels', label: 'Reels' },
  { to: '/app/stories', label: 'Stories' },
  { to: '/app/ai-studio', label: 'AI Studio' },
  { to: '/app/competitors', label: 'Competitors' },
  { to: '/app/calendar', label: 'Calendar' },
  { to: '/app/hashtags', label: 'Hashtags' },
  { to: '/app/best-time', label: 'Best Time' },
  { to: '/app/ai-insights', label: 'AI Health' },
  { to: '/app/reports', label: 'Reports' },
  { to: '/app/admin', label: 'Admin' },
  { to: '/app/settings', label: 'Settings' },
]

function App() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-6 overflow-x-auto py-2 scrollbar-none">
              <NavLink to="/app/analytics" className="flex-shrink-0 flex items-center mr-2">
                <h1 className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 whitespace-nowrap">
                  Instagram AI Analytics
                </h1>
              </NavLink>
              <div className="flex space-x-1 sm:space-x-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center pl-4 border-l border-gray-100">
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-gray-500 hover:text-rose-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
