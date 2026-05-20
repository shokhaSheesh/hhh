import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
    let raw = '';
    try {
      const err = await res.json() as Record<string, unknown>;
      raw = ((err['description'] ?? err['message'] ?? '') as string).toLowerCase();
    } catch { /* ignore */ }

    let msg = "Xatolik yuz berdi. Qaytadan urinib ko'ring";
    if (res.status === 404 || raw.includes('not found') || raw.includes('cannot get user')) {
      msg = "Login yoki parol noto'g'ri";
    } else if (res.status === 401 || raw.includes('invalid password') || raw.includes('unauthenticated') || raw.includes('wrong password')) {
      msg = "Login yoki parol noto'g'ri";
    } else if (res.status === 403 || raw.includes('permission') || raw.includes('forbidden')) {
      msg = "Kirish huquqi yo'q";
    } else if (res.status >= 500) {
      msg = "Server xatosi. Keyinroq urinib ko'ring";
    }
    throw new Error(msg);
  }

  const raw      = await res.json() as Record<string, unknown>;
  const response = (raw['data'] as Record<string, unknown>)?.['response'] as Record<string, unknown> | undefined;
  const token    = response?.['token'] as Record<string, unknown> | undefined;

  const access_token  = token?.['access_token']  as string | undefined;
  const refresh_token = token?.['refresh_token'] as string | undefined;

  if (!access_token) throw new Error('Server javobi noto\'g\'ri. Qaytadan urinib ko\'ring');

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

  const hasError = errorMsg !== null;

  function clearError() {
    if (errorMsg) setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const session = await doLogin(loginVal.trim(), password);
      login(session);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMsg(msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')
        ? "Internet aloqasi yo'q. Ulanishni tekshiring"
        : msg || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">

      {/* ── Left — form ──────────────────────────────────────────────────── */}
      <div className="flex w-full flex-col lg:w-1/2">

        {/* Logo */}
        <div className="px-12 py-8">
          <img src="/wolter-logo.png" alt="WOLTER" className="h-7" />
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center px-12 pb-16">
          <div className="w-full max-w-sm">

            <div className="mb-10 space-y-2">
              <p className="text-center text-lg font-semibold text-gray-500">Xush kelibsiz!</p>
              <h1 className="text-center text-2xl font-semibold leading-8 text-white">
                Wolter — Har qadamda<br />energiya
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">
                  Login <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={loginVal}
                  onChange={(e) => { setLoginVal(e.target.value); clearError(); }}
                  placeholder="Loginni kiriting"
                  className={`w-full rounded-xl border px-4 py-3 text-base text-white outline-none transition-colors ${
                    hasError
                      ? 'border-red-500/60 bg-red-500/10 placeholder-red-400/60 focus:border-red-500'
                      : 'border-gray-700 bg-gray-900/60 placeholder-gray-600 focus:border-gray-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">
                  Parol <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    placeholder="Parolni kiriting"
                    className={`w-full rounded-xl border px-4 py-3 pr-12 text-base text-white outline-none transition-colors ${
                      hasError
                        ? 'border-red-500/60 bg-red-500/10 placeholder-red-400/60 focus:border-red-500'
                        : 'border-gray-700 bg-gray-900/60 placeholder-gray-600 focus:border-gray-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                  >
                    {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-lime py-3 text-base font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
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

      {/* ── Right — image panel ───────────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-1/2 p-6">
        <div className="relative h-full overflow-hidden rounded-3xl">
          <img
            src="/station-mockup.png"
            alt="Wolter station"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

    </div>
  );
}
