import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { menuPermissions, session } = useAuth();
  const loaded      = Object.keys(menuPermissions).length > 0;
  const loginPerms  = session?.permissions ?? [];
  const allAccess   = loginPerms.length === 0; // super admin → no restrictions

  function canRead(menuId: string): boolean {
    if (!loaded) return true;
    return menuPermissions[menuId] !== false;
  }

  function checkCrud(tableSlug: string, action: 'write' | 'update' | 'delete'): boolean {
    if (allAccess) return true;
    const p = loginPerms.find((p) => p.table_slug === tableSlug);
    if (!p) return true; // slug not in list → permissive
    return p[action] === 'Yes';
  }

  return {
    canRead,
    canWrite:  (slug: string) => checkCrud(slug, 'write'),
    canUpdate: (slug: string) => checkCrud(slug, 'update'),
    canDelete: (slug: string) => checkCrud(slug, 'delete'),
  };
}
