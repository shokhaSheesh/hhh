import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { menuPermissions, session } = useAuth();
  const loaded      = Object.keys(menuPermissions).length > 0;
  const loginPerms  = session?.permissions ?? [];
  const isSuperAdmin = loginPerms.length === 0; // super admin → no restrictions

  function canRead(menuId: string): boolean {
    if (!loaded) return true;           // still fetching → show everything temporarily
    if (isSuperAdmin) return true;      // super admin sees everything
    return menuPermissions[menuId] !== false; // hide only if API explicitly set read: false
  }

  function checkCrud(tableSlug: string, action: 'write' | 'update' | 'delete'): boolean {
    if (isSuperAdmin) return true;
    const p = loginPerms.find((p) => p.table_slug === tableSlug);
    if (!p) return true; // slug not in list → permissive
    return p[action] === 'Yes';
  }

  return {
    isSuperAdmin,
    canRead,
    canWrite:  (slug: string) => checkCrud(slug, 'write'),
    canUpdate: (slug: string) => checkCrud(slug, 'update'),
    canDelete: (slug: string) => checkCrud(slug, 'delete'),
  };
}
