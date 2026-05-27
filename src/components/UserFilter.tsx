import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '@/api/client';
import type { UsersListResponse } from '@/types/user';

export interface UserOption { guid: string; name: string; phone: string; }

export default function UserFilter({ onSelect }: { onSelect: (u: UserOption | null) => void }) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState<UserOption[]>([]);
  const [open,     setOpen]     = useState(false);
  const [selected, setSelected] = useState<UserOption | null>(null);
  const [loading,  setLoading]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.post<UsersListResponse>('/users/items/list', {
          data: { offset: 0, limit: 10, search: q.trim() },
        });
        const list = (res.data.data.response ?? []).map((u) => ({
          guid:  u.guid,
          name:  u.name  ?? '',
          phone: u.phone ?? '',
        }));
        setResults(list);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
  };

  const pick = (u: UserOption) => {
    setSelected(u);
    setQuery('');
    setOpen(false);
    setResults([]);
    onSelect(u);
  };

  const clear = () => {
    setSelected(null);
    setQuery('');
    onSelect(null);
  };

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-Color-Primary-Primary bg-Color-Primary-Primary/10 px-3 py-2">
        <span className="text-sm font-medium text-Color-Grey-Grey-950">{selected.name}</span>
        <span className="text-xs text-Color-Grey-Grey-600">{selected.phone}</span>
        <button onClick={clear} className="ml-1 rounded p-0.5 text-Color-Grey-Grey-600 hover:text-Color-Grey-Grey-950">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-Color-Grey-Grey-500" />
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Ism yoki telefon bo'yicha..."
        className="w-72 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 py-2 pl-9 pr-4 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-Color-Grey-Grey-500">...</span>
      )}
      {open && results.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-xl">
          {results.map((u) => (
            <button
              key={u.guid}
              type="button"
              onMouseDown={() => pick(u)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-Color-Grey-Grey-50"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-Color-Primary-Primary/10 text-xs font-bold text-Color-Dark-Constant-Dark">
                {u.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-Color-Grey-Grey-950">{u.name || '—'}</p>
                <p className="text-xs text-Color-Grey-Grey-600">{u.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && query.trim() && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light px-3 py-3 text-xs text-Color-Grey-Grey-500 shadow-xl">
          Foydalanuvchi topilmadi
        </div>
      )}
    </div>
  );
}
