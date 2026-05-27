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
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();
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
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-Color-Grey-Grey-200 bg-Color-Light-Light px-6">
      {/* Left: toggle + breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="cursor-pointer rounded-xl border border-Color-Grey-Grey-200 p-2 text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-Color-Grey-Grey-400" />
                )}
                <span
                  className={[
                    'text-sm font-sans',
                    i === crumbs.length - 1
                      ? 'font-semibold text-Color-Grey-Grey-950'
                      : 'text-Color-Grey-Grey-600',
                  ].join(' ')}
                >
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Right: language, bell, theme toggle, settings, avatar, logout */}
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-Color-Grey-Grey-200 px-3 py-2 text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950 transition-colors"
          >
            <Globe className="h-4 w-4 text-Color-Grey-Grey-500" />
            <span className="text-sm font-sans">{selectedLang.label}</span>
            <ChevronDown className="h-4 w-4 text-Color-Grey-Grey-500" />
          </button>

          {langOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setLangOpen(false)}
                aria-hidden="true"
              />
              <ul className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-[0px_8px_16px_rgba(0,0,0,0.08)]">
                {LANGUAGES.map((lang) => (
                  <li key={lang.code}>
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm font-sans text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50 hover:text-Color-Grey-Grey-950 transition-colors"
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
          className="rounded-xl border border-Color-Grey-Grey-200 p-2 text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-Color-Grey-Grey-200 p-2 text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950 transition-colors"
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Settings */}
        <button
          className="rounded-xl border border-Color-Grey-Grey-200 p-2 text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950 transition-colors"
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
          className="rounded-xl border border-Color-Grey-Grey-200 p-2 text-Color-Grey-Grey-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
          aria-label="Chiqish"
          title="Chiqish"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
