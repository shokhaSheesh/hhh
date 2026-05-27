import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { NAV_GROUPS } from '@/config/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/contexts/ThemeContext';
import type { NavGroup, NavItem } from '@/types/navigation';

interface SidebarProps {
  isOpen:      boolean;
  isCollapsed: boolean;
  onClose:     () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onClose }: SidebarProps) {
  const { canRead, isSuperAdmin } = usePermissions();
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/LogoSectionDark.png' : '/LogoSection.png';
  const dashboardMenuId   = NAV_GROUPS[0]?.menuId;
  const canViewDashboard  = !dashboardMenuId || canRead(dashboardMenuId);

  function isItemVisible(item: NavItem): boolean {
    if (item.alwaysVisible) return true;
    if (item.menuId) return canRead(item.menuId);
    // auto-derive slug from path: /payments/user-operations → user_operations
    const slug = item.path.split('/').pop()?.replace(/-/g, '_') ?? '';
    return canRead(slug);
  }

  const visibleGroups = NAV_GROUPS
    .filter((g) => !g.menuId || canRead(g.menuId))
    .map((g) => ({ ...g, items: g.items.filter(isItemVisible) }))
    .filter((g) => g.items.length > 0);

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
          'bg-Color-Light-Light border-r border-Color-Grey-Grey-200',
          'transition-all duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          isCollapsed ? 'w-16' : 'w-80',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo */}
        <div
          className={[
            'flex shrink-0 items-center border-b border-Color-Grey-Grey-200',
            isCollapsed ? 'justify-center p-4' : 'justify-between p-6',
          ].join(' ')}
        >
          {isCollapsed ? (
            canViewDashboard ? (
              <NavLink
                to="/dashboard"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-lime font-bold text-black text-sm"
              >
                W
              </NavLink>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-lime font-bold text-black text-sm">
                W
              </div>
            )
          ) : (
            canViewDashboard ? (
              <NavLink to="/dashboard" onClick={onClose} className="flex-1 min-w-0">
                <img src={logoSrc} alt="Wolter" className="sidebar-logo" />
              </NavLink>
            ) : (
              <div className="flex-1 min-w-0">
                <img src={logoSrc} alt="Wolter" className="sidebar-logo" />
              </div>
            )
          )}

          {!isCollapsed && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-100 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto py-4">
          {visibleGroups.map((group: NavGroup) => (
            <div
              key={group.label}
              className={['flex flex-col mb-2', isCollapsed ? 'px-2' : 'px-6'].join(' ')}
            >
              {/* Section label */}
              {isCollapsed ? (
                <div className="my-1 h-px bg-Color-Grey-Grey-200" />
              ) : (
                <span className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-Color-Grey-Grey-600">
                  {group.label}
                </span>
              )}

              {/* Nav items */}
              {group.items.map((item: NavItem) => (
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
                        ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark'
                        : 'text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={[
                          'shrink-0',
                          isCollapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]',
                          isActive ? 'text-Color-Dark-Constant-Dark' : 'text-Color-Grey-Grey-600',
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
