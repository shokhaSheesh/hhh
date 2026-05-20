import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthSession, LoginPermission } from '@/types/auth';

const LOGIN_URL  = 'https://api.auth.u-code.io/v3/multicompany/default-login';
const PROJECT_ID = 'cfca2b3a-b0ec-48a0-aa42-fdda6a0ae590';

async function doLogin(login: string, password: string): Promise<AuthSession> {
  const url = new URL(LOGIN_URL);
  url.searchParams.set('project-id', PROJECT_ID);

  const res = await fetch(url.toString(), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username: login, password }),
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json() as Record<string, unknown>;
      msg = (err['description'] ?? err['message'] ?? msg) as string;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const raw      = await res.json() as Record<string, unknown>;
  // Shape: { data: { response: { token, permissions, user_data } } }
  const response = (raw['data'] as Record<string, unknown>)?.['response'] as Record<string, unknown> | undefined;
  const token    = response?.['token'] as Record<string, unknown> | undefined;

  const access_token  = token?.['access_token']  as string | undefined;
  const refresh_token = token?.['refresh_token'] as string | undefined;

  if (!access_token) throw new Error('Serverdan token olinmadi');

  // permissions lives at data.response.permissions
  const permissions = (response?.['permissions'] ?? []) as LoginPermission[];

  return { access_token, refresh_token: refresh_token ?? '', login, permissions };
}

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const session = await doLogin(loginVal.trim(), password);
      login(session);
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Noma'lum xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-lime shadow-lg shadow-brand-lime/20">
            <Zap className="h-7 w-7 text-black" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Wolter Admin</h1>
            <p className="mt-1 text-sm text-gray-500">Hisobingizga kiring</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Login</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginVal}
                onChange={(e) => setLoginVal(e.target.value)}
                placeholder="Email yoki telefon"
                className="w-full rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500 focus:ring-1 focus:ring-gray-500/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Parol</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500 focus:ring-1 focus:ring-gray-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-brand-lime py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Kirilmoqda…
                </span>
              ) : 'Kirish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
