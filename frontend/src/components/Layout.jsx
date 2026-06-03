import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ArrowLeftRight, LogOut } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-white">
              Spend<span className="text-primary">Sense</span>
            </span>
            <div className="flex items-center gap-1">
              {links.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === to
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-slate-400 text-sm">
              Hi, <span className="text-white font-medium">{user?.name}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}