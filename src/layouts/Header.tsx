import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronRight,
  ChevronDown,
  Bell,
  Settings,
  Globe,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = session?.login
    ? session.login.slice(0, 2).toUpperCase()
    : 'AD';

  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = [
    'Wolter',
    ...segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')),
  ];

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-dark-border bg-dark-surface px-6">
      {/* Left: toggle + breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="cursor-pointer rounded-xl border border-gray-700 p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
                )}
                <span
                  className={[
                    'text-sm font-sans',
                    i === crumbs.length - 1
                      ? 'font-semibold text-white'
                      : 'text-gray-500',
                  ].join(' ')}
                >
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Right: language, notifications, settings, avatar */}
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-sans">{selectedLang.label}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {langOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setLangOpen(false)}
                aria-hidden="true"
              />
              <ul className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-gray-700 bg-dark-surface shadow-2xl shadow-black/40">
                {LANGUAGES.map((lang) => (
                  <li key={lang.code}>
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm font-sans text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      onClick={() => {
                        setSelectedLang(lang);
                        setLangOpen(false);
                      }}
                    >
                      {lang.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Notification bell */}
        <button
          className="rounded-xl border border-gray-700 p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* Settings */}
        <button
          className="rounded-xl border border-gray-700 p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* User avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime ring-1 ring-brand-lime/40">
          <span className="text-xs font-bold text-black">{initials}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="rounded-xl border border-gray-700 p-2 text-gray-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
          aria-label="Chiqish"
          title="Chiqish"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
