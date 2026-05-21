// ─── Ucode API constants ──────────────────────────────────────────────────────

const BASE        = 'https://api.admin.u-code.io';
const AUTH_BASE   = 'https://api.auth.u-code.io';
export const PROJECT_ID  = 'cfca2b3a-b0ec-48a0-aa42-fdda6a0ae590';

// Per-feature view base URLs
export const VIEW = {
  users:   `${BASE}/v3/menus/a095fcab-57ad-47b8-805c-82a21dd59ef1/views/fc23d80e-0dc7-4ec7-8572-037fb4f51362/tables`,
  appeals: `${BASE}/v3/menus/cb0dff65-ffc0-4f88-b7bb-703355abd43f/views/75e5959f-87b0-49ca-9753-da74d14d4bdf/tables`,
  swaps:    `${BASE}/v3/menus/d8942801-c771-4907-bc02-a61c2c135859/views/1e0e1277-a910-4b3c-9ed8-2dd9ed4ceebe/tables`,
  stations:     `${BASE}/v3/menus/6e1118c1-b051-4657-80e5-fbea2a4cf6a3/views/8cd98d3d-979e-465f-8b14-b437085d9f86/tables`,
  portBindings: `${BASE}/v3/menus/bbdcb468-87a5-4164-acfe-a2f8f4ca92b8/views/baf79c4b-db5f-421f-8e4a-469be3286e97/tables`,
  tariffs:       `${BASE}/v3/menus/7e938887-d473-4730-814c-ef6a43e55662/views/075bcf42-efd2-4b59-ab12-473e0ddc47f4/tables`,
  promocodes:    `${BASE}/v3/menus/c23f772e-8946-429f-871a-a787216ffc35/views/cbba53e0-4ffa-42a9-b6e2-b8c4e8402e04/tables`,
  notifications:  `${BASE}/v3/menus/a8919382-fafb-49d4-9534-4eb61a0474a2/views/a554c84a-fa13-4058-9db6-3c31fbe8b513/tables`,
  transactions:   `${BASE}/v3/menus/0eebdfa0-bdab-4b3d-ac20-488a0d65a96e/views/95ca99bf-f559-4056-b1ae-dc202a6546fa/tables`,
  cards:          `${BASE}/v3/menus/3abcfab4-6ac3-4848-9fa5-dad6f5bd08ca/views/875690ca-e354-45fd-95ba-d3329262f5fc/tables`,
  batteries:       `${BASE}/v3/menus/96d306f2-c7bf-4f25-86fe-309d1b54fdde/views/00fd8bee-be8d-49f1-be87-d41edb4cabb7/tables`,
  admins:          `${BASE}/v3/menus/d90e55a6-6719-4733-bca1-616d5047c5d0/views/8c4a0ef0-152a-4edf-93eb-9895e5649cc0/tables`,
  userOperations:  `${BASE}/v3/menus/e215f4bd-a8a0-43bd-9c54-eec3ba0a8ef0/views/2746c785-91eb-4afd-8624-ad80215e7e38/tables`,
} as const;

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status:     number;
  statusText: string;

  constructor(status: number, statusText: string, message?: string) {
    super(message ?? `API ${status}: ${statusText}`);
    this.name       = 'ApiError';
    this.status     = status;
    this.statusText = statusText;
  }
}

// ─── Token store — read fresh from localStorage on every request ──────────────

const TOKEN_KEY   = 'wolter_tokens';
const ENV_ID      = import.meta.env.VITE_UCODE_ENV_ID      as string | undefined;
const RESOURCE_ID = import.meta.env.VITE_UCODE_RESOURCE_ID as string | undefined;

interface StoredTokens { access_token: string; refresh_token: string; }

function getTokens(): StoredTokens {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) return JSON.parse(raw) as StoredTokens;
  } catch { /* ignore */ }
  return {
    access_token:  import.meta.env.VITE_UCODE_TOKEN         ?? '',
    refresh_token: import.meta.env.VITE_UCODE_REFRESH_TOKEN ?? '',
  };
}

function saveTokens(t: StoredTokens) {
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(t)); } catch { /* ignore */ }
}

// ─── Token refresh ────────────────────────────────────────────────────────────

interface RefreshResponse { access_token: string; refresh_token: string; }

let _refreshPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const { refresh_token } = getTokens();
  if (!refresh_token) throw new Error('No refresh token available');

  const url = new URL(`${AUTH_BASE}/v2/refresh`);
  url.searchParams.set('project-id', PROJECT_ID);

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(ENV_ID      ? { 'Environment-Id': ENV_ID }      : {}),
      ...(RESOURCE_ID ? { 'Resource-Id':    RESOURCE_ID } : {}),
    },
    body: JSON.stringify({ refresh_token }),
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json() as Record<string, unknown>;
      detail = (err['description'] ?? err['message'] ?? detail) as string;
    } catch { /* ignore */ }
    throw new ApiError(res.status, res.statusText, detail);
  }

  const data = await res.json() as RefreshResponse;
  saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
}

function refreshOnce(): Promise<void> {
  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

// ─── Core request (auto-retries once after token refresh on 401) ──────────────

async function request<T>(
  absoluteUrl: string,
  options: RequestInit = {},
  _retry = true,
): Promise<T> {
  const { access_token, refresh_token } = getTokens();

  const token = access_token
    ? (access_token.startsWith('Bearer ') ? access_token : `Bearer ${access_token}`)
    : undefined;

  const url = new URL(absoluteUrl);
  url.searchParams.set('project-id', PROJECT_ID);

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token  ? { Authorization:    token  } : {}),
      ...(ENV_ID ? { 'environment-id': ENV_ID } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && _retry && refresh_token) {
    try {
      await refreshOnce();
      return request<T>(absoluteUrl, options, false);
    } catch {
      window.dispatchEvent(new Event('auth:session-expired'));
      throw new ApiError(401, 'Unauthorized', 'Sessiya muddati tugadi');
    }
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:session-expired'));
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json() as Record<string, unknown>;
      detail = errJson['description'] as string
        ?? errJson['message'] as string
        ?? JSON.stringify(errJson);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new ApiError(res.status, res.statusText, detail || undefined);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createApi(viewBase: string) {
  const url = (path: string) => `${viewBase}${path}`;
  return {
    get:    <T>(path: string)                => request<T>(url(path)),
    post:   <T>(path: string, body: unknown) => request<T>(url(path), { method: 'POST',   body: JSON.stringify(body) }),
    put:    <T>(path: string, body: unknown) => request<T>(url(path), { method: 'PUT',    body: JSON.stringify(body) }),
    patch:  <T>(path: string, body: unknown) => request<T>(url(path), { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: <T>(path: string)                => request<T>(url(path), { method: 'DELETE' }),
  };
}

export const api = createApi(VIEW.users);

export const authApi = {
  get: <T>(path: string) => request<T>(`${AUTH_BASE}${path}`),
};

export const rootApi = {
  get:    <T>(path: string)                => request<T>(`${BASE}${path}`),
  post:   <T>(path: string, body: unknown) => request<T>(`${BASE}${path}`, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(`${BASE}${path}`, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string, opts?: { data?: unknown; headers?: Record<string, string | undefined> }) =>
    request<T>(`${BASE}${path}`, {
      method: 'DELETE',
      ...(opts?.data !== undefined && opts?.data !== null ? { body: JSON.stringify(opts.data) } : {}),
      headers: opts?.headers as HeadersInit | undefined,
    }),
};
