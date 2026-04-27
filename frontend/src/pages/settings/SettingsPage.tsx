import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { href: '/settings/users', label: 'Users' },
  { href: '/settings/roles', label: 'Roles & Permissions' },
  { href: '/settings/integrations', label: 'Integrations' },
];

export default function SettingsPage() {
  return (
    <div className="flex gap-8">
      <aside className="w-48 flex-shrink-0">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Settings</h2>
        <nav className="space-y-0.5">
          {NAV.map(item => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
