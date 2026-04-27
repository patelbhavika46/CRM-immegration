import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',     permission: null },
  { label: 'Leads',         href: '/leads',         permission: 'leads.view' },
  { label: 'Clients',       href: '/clients',       permission: 'clients.view' },
  { label: 'Applicants',    href: '/applicants',    permission: 'applicants.view' },
  { label: 'Opportunities', href: '/opportunities', permission: 'opportunities.view' },
  { label: 'Activities',    href: '/activities',    permission: 'activities.view' },
  { label: 'Reports',       href: '/reports',       permission: 'reports.view' },
  { label: 'Settings',      href: '/settings',      permission: 'users.manage' },
];

export default function Sidebar() {
  const { can } = useAuthStore();

  const visible = navItems.filter((item) => !item.permission || can(item.permission));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-900">Immigration CRM</h1>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {visible.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
