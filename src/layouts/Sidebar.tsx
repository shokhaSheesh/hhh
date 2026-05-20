import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { NAV_GROUPS } from '@/config/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import type { NavGroup, NavItem } from '@/types/navigation';

interface SidebarProps {
  isOpen:      boolean;
  isCollapsed: boolean;
  onClose:     () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onClose }: SidebarProps) {
  const { canRead } = usePermissions();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex flex-shrink-0 flex-col',
          'bg-dark-surface border-r border-dark-border',
          'transition-all duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          isCollapsed ? 'w-16' : 'w-80',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo */}
        <div
          className={[
            'flex shrink-0 items-center border-b border-dark-border',
            isCollapsed ? 'justify-center p-4' : 'justify-between p-6',
          ].join(' ')}
        >
          {isCollapsed ? (
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-lime font-bold text-black text-sm"
            >
              W
            </NavLink>
          ) : (
            <NavLink to="/dashboard" onClick={onClose} className="flex-1 min-w-0">
              <img src="/LogoSection.png" alt="Wolter" className="sidebar-logo" />
            </NavLink>
          )}

          {!isCollapsed && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-white/10 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_GROUPS.filter((g) => !g.menuId || canRead(g.menuId)).map((group: NavGroup) => (
            <div
              key={group.label}
              className={['flex flex-col mb-2', isCollapsed ? 'px-2' : 'px-6'].join(' ')}
            >
              {/* Section label */}
              {isCollapsed ? (
                <div className="my-1 h-px bg-dark-border" />
              ) : (
                <span className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  {group.label}
                </span>
              )}

              {/* Nav items */}
              {group.items.filter((item) => !item.menuId || canRead(item.menuId)).map((item: NavItem) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    [
                      'flex items-center rounded-xl transition-colors duration-150',
                      isCollapsed
                        ? 'justify-center p-2.5'
                        : 'gap-3 px-4 py-2.5',
                      isActive
                        ? 'bg-[#D1F22D] text-black'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={[
                          'shrink-0',
                          isCollapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]',
                          isActive ? 'text-black' : 'text-gray-500',
                        ].join(' ')}
                      />
                      {!isCollapsed && (
                        <span className="text-sm font-semibold leading-6 truncate">
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
