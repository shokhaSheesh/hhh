import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AuthSession } from '@/types/auth';

const STORAGE_KEY      = 'wolter_tokens';
const MENU_PERMS_KEY   = 'wolter_menu_perms';
const BASE             = 'https://api.admin.u-code.io';
const PROJECT_ID       = 'cfca2b3a-b0ec-48a0-aa42-fdda6a0ae590';
const MENUS_PARENT_ID  = 'c57eedc3-a954-4262-a0af-376c65b5a284';

interface RawMenuItem {
  id:   string;
  data: { permission?: { read?: boolean } };
}

async function fetchMenusPage(parentId: string, token: string): Promise<RawMenuItem[]> {
  const url = `${BASE}/v3/menus?parent_id=${parentId}&project-id=${PROJECT_ID}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const json = await res.json() as { data?: { menus?: RawMenuItem[] } };
  return json.data?.menus ?? [];
}

async function fetchMenuPermissions(token: string): Promise<Record<string, boolean>> {
  try {
    // 1. Fetch top-level folders
    const folders = await fetchMenusPage(MENUS_PARENT_ID, token);
    const map: Record<string, boolean> = {};
    for (const f of folders) map[f.id] = f.data?.permission?.read ?? true;

    // 2. Fetch children of every folder in parallel to get item-level permissions
    const childLists = await Promise.all(folders.map(f => fetchMenusPage(f.id, token)));
    for (const children of childLists) {
      for (const item of children) map[item.id] = item.data?.permission?.read ?? true;
    }

    return map;
  } catch {
    return {};
  }
}

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function loadMenuPerms(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(MENU_PERMS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveMenuPerms(perms: Record<string, boolean>) {
  try { localStorage.setItem(MENU_PERMS_KEY, JSON.stringify(perms)); } catch { /* ignore */ }
}

interface AuthContextValue {
  isAuthenticated: boolean;
  session:         AuthSession | null;
  menuPermissions: Record<string, boolean>;
  menuPermsReady:  boolean;
  login:           (session: AuthSession) => void;
  logout:          () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session,          setSession]          = useState<AuthSession | null>(null);
  const [menuPermissions,  setMenuPermissions]  = useState<Record<string, boolean>>(loadMenuPerms);
  const [menuPermsReady,   setMenuPermsReady]   = useState(() => Object.keys(loadMenuPerms()).length > 0);
  const [ready,            setReady]            = useState(false);
  const isFreshLogin                            = useRef(false);

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setMenuPermissions({});
      setMenuPermsReady(false);
      saveMenuPerms({});
      return;
    }
    // On refresh with cached perms: skip the fetch, mark ready immediately.
    const cached = loadMenuPerms();
    if (!isFreshLogin.current && Object.keys(cached).length > 0) {
      isFreshLogin.current = false;
      setMenuPermsReady(true);
      return;
    }
    isFreshLogin.current = false;
    fetchMenuPermissions(session.access_token).then((perms) => {
      saveMenuPerms(perms);
      setMenuPermissions(perms);
      setMenuPermsReady(true);
    });
  }, [session?.access_token]);

  const login = useCallback((s: AuthSession) => {
    isFreshLogin.current = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MENU_PERMS_KEY);
    setSession(null);
    setMenuPermissions({});
    setMenuPermsReady(false);
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, [logout]);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated: session !== null, session, menuPermissions, menuPermsReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
