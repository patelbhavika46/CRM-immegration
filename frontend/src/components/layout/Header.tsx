import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [menuOpen, setMenuOpen]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clients, applicants, cases…"
        className="flex-1 max-w-md px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="ml-auto flex items-center gap-3">
        {/* Notification bell placeholder */}
        <button className="relative text-slate-500 hover:text-slate-700">
          <span className="text-xl">&#128276;</span>
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <span className="hidden md:block">{user?.full_name}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-lg z-50 text-sm">
              <button
                onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-slate-50"
              >
                My Profile
              </button>
              <hr className="border-slate-100" />
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
