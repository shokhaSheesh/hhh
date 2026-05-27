import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { NAV_GROUPS } from '@/config/navigation';
import type { NavItem } from '@/types/navigation';

function itemAccessible(item: NavItem, canRead: (id: string) => boolean, isSuperAdmin: boolean): boolean {
  if (item.alwaysVisible) return true;
  if (isSuperAdmin) return true;
  if (item.menuId) return canRead(item.menuId);
  const slug = item.path.split('/').pop()?.replace(/-/g, '_') ?? '';
  return canRead(slug);
}

function RouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { canRead, isSuperAdmin } = usePermissions();

  if (isSuperAdmin) return <>{children}</>;

  // Find the nav item that matches the current path
  const allItems = NAV_GROUPS.flatMap((g) => g.items);
  const current  = allItems.find((item) =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  // Not a top-level nav item (e.g. a detail page) — allow through
  if (!current) return <>{children}</>;

  if (itemAccessible(current, canRead, isSuperAdmin)) return <>{children}</>;

  // Redirect to the first page this user can actually access
  const firstAllowed = NAV_GROUPS
    .filter((g) => !g.menuId || canRead(g.menuId))
    .flatMap((g) => g.items)
    .find((item) => itemAccessible(item, canRead, isSuperAdmin));

  return <Navigate to={firstAllowed?.path ?? '/login'} replace />;
}

export default function AdminLayout() {
  const { menuPermsReady } = useAuth();
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((c) => !c);
    } else {
      setSidebarOpen((o) => !o);
    }
  };

  if (!menuPermsReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-Color-Grey-Grey-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-Color-Grey-Grey-50">
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={handleMenuClick} />

        <main className="flex-1 overflow-y-auto p-6">
          <RouteGuard>
            <Outlet />
          </RouteGuard>
        </main>
      </div>
    </div>
  );
}
