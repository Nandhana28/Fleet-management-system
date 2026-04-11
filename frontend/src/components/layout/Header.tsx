import { Link, useLocation } from 'react-router-dom'
import { useAlerts } from '../../hooks/useAlerts'

export default function Header() {
  const { data: alerts } = useAlerts()
  const location = useLocation()

  const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/agent', label: 'AI Agent' },
  { path: '/settings', label: 'Settings' },
  ]

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-teal-600">FleetPulse</h1>
        <nav className="flex gap-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm px-3 py-1 rounded transition-colors ${
                location.pathname === item.path
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {alerts && alerts.length > 0 && (
          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
            {alerts.length} Alerts
          </span>
        )}
      </div>
    </header>
  )
}