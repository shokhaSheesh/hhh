import { useState, useRef, useEffect } from 'react';
import { X, Search, RefreshCw, Loader2 } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import { createApi, VIEW } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import type { User, UsersListResponse } from '@/types/user';
import type { Promocode } from '@/types/promocodes';

const usersApi = createApi(VIEW.users);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromocodeFormValues {
  key:                string;
  discountType:       'percentage' | 'amount';
  discountValue:      number | '';
  valid_until:        string;
  users_id:           string | null;
  user_count:         number | '';
  use_count_per_user: number | '';
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULTS: PromocodeFormValues = {
  key:                '',
  discountType:       'percentage',
  discountValue:      '',
  valid_until:        '',
  users_id:           null,
  user_count:         '',
  use_count_per_user: 1,
};

const INPUT = 'w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function randomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function toDatetimeLocal(s: string): string {
  const [datePart, timePart] = s.split(' ');
  const [day, month, year]   = datePart.split('.');
  return `${year}-${month}-${day}T${timePart}`;
}

export function formatValidUntil(s: string): string | null {
  if (!s) return null;
  const [datePart, timePart] = s.split('T');
  const [year, month, day]   = datePart.split('-');
  return `${day}.${month}.${year} ${timePart}`;
}

export function buildPayload(v: PromocodeFormValues) {
  const raw = v.discountValue === '' ? 0 : Number(v.discountValue);
  return {
    key:                 v.key,
    amount:              v.discountType === 'amount'     ? Math.round(raw) : null,
    discount_percentage: v.discountType === 'percentage' ? Math.min(100, Math.max(0, raw)) : null,
    valid_until:         formatValidUntil(v.valid_until),
    users_id:            v.users_id,
    user_count:          v.user_count         !== '' ? Number(v.user_count)         : null,
    use_count_per_user:  v.use_count_per_user !== '' ? Number(v.use_count_per_user) : 1,
    infinite:            false,
    special:             false,
    status:              true,
  };
}

export function fromPromocode(p: Promocode): PromocodeFormValues {
  const isPercentage = p.discount_percentage != null && p.discount_percentage > 0;
  return {
    key:                p.key,
    discountType:       isPercentage ? 'percentage' : 'amount',
    discountValue:      isPercentage ? p.discount_percentage! : (p.amount ?? ''),
    valid_until:        p.valid_until ? toDatetimeLocal(p.valid_until) : '',
    users_id:           p.users_id,
    user_count:         p.user_count ?? '',
    use_count_per_user: p.use_count_per_user,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
        {label}
        {hint && <span className="normal-case font-normal text-Color-Grey-Grey-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Single user search ───────────────────────────────────────────────────────

function UserSelect({
  value,
  onChange,
}: {
  value:    string | null;
  onChange: (id: string | null) => void;
}) {
  const [search,   setSearch]   = useState('');
  const [open,     setOpen]     = useState(false);
  const [results,  setResults]  = useState<User[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const wrapRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    const body: Record<string, unknown> = { offset: 0, limit: 15 };
    if (debouncedSearch.trim()) body['search'] = debouncedSearch.trim();

    usersApi
      .post<UsersListResponse>('/users/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        setResults(res.data.data.response ?? []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedSearch, open]);

  const pick = (u: User) => {
    setSelected(u);
    onChange(u.guid);
    setOpen(false);
    setSearch('');
  };

  const clear = () => {
    setSelected(null);
    onChange(null);
  };

  if (selected ?? (value && !selected)) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5">
        <div>
          <p className="text-sm font-medium text-Color-Grey-Grey-950">{selected?.name || value}</p>
          {selected?.phone && <p className="text-xs text-Color-Grey-Grey-600">{selected.phone}</p>}
        </div>
        <button type="button" onClick={clear}
          className="text-Color-Grey-Grey-500 transition-colors hover:text-Color-Grey-Grey-950">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-Color-Grey-Grey-500" />
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Mijozni qidirish..."
        className={`${INPUT} pl-9`}
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-Color-Grey-Grey-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Qidirmoqda…</span>
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-Color-Grey-Grey-500">Mijoz topilmadi</p>
          ) : (
            results.map((u) => (
              <button key={u.guid} type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(u)}
                className="flex w-full flex-col items-start px-4 py-2.5 text-left transition-colors hover:bg-Color-Grey-Grey-50"
              >
                <span className="text-sm font-medium text-Color-Grey-Grey-950">{u.name || '—'}</span>
                <span className="text-xs text-Color-Grey-Grey-600">{u.phone}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface Props {
  initial?:   Promocode | null;
  onSave:     (values: PromocodeFormValues) => void;
  onCancel:   () => void;
  saveLabel?: string;
  saving?:    boolean;
}

export default function PromocodeForm({ initial, onSave, onCancel, saveLabel = 'Saqlash', saving = false }: Props) {
  const [form, setForm] = useState<PromocodeFormValues>(
    initial ? fromPromocode(initial) : DEFAULTS,
  );

  const set = <K extends keyof PromocodeFormValues>(key: K, val: PromocodeFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Key with inset randomizer */}
      <Field label="Nomi">
        <div className="relative">
          <input
            type="text"
            value={form.key}
            onChange={(e) => set('key', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="HAYITLIK20"
            required
            maxLength={20}
            className={`${INPUT} pr-12 font-mono tracking-widest`}
          />
          <button
            type="button"
            title="Tasodifiy kod yaratish"
            onClick={() => set('key', randomKey())}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </Field>

      {/* Discount type + value */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Turi">
          <div className="flex overflow-hidden rounded-xl border border-Color-Grey-Grey-200">
            {(['percentage', 'amount'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('discountType', t)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  form.discountType === t ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark' : 'bg-Color-Grey-Grey-50 text-Color-Grey-Grey-500 hover:text-Color-Grey-Grey-950'
                }`}
              >
                {t === 'percentage' ? 'Foizli' : 'Summa'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Qiymati">
          <div className="relative">
            <input
              type="number"
              min={0}
              max={form.discountType === 'percentage' ? 100 : undefined}
              value={form.discountValue}
              onChange={(e) => set('discountValue', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={form.discountType === 'percentage' ? '20' : '30000'}
              required
              className={`${INPUT} pr-14`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-Color-Grey-Grey-100 px-2 py-0.5 text-[11px] font-bold text-Color-Grey-Grey-600">
              {form.discountType === 'percentage' ? '%' : 'UZS'}
            </span>
          </div>
        </Field>
      </div>

      {/* Valid until */}
      <Field label="Tugash sanasi">
        <DatePicker
          value={form.valid_until}
          onChange={(v) => set('valid_until', v)}
          placeholder="Sanani tanlang"
          withTime
        />
      </Field>

      {/* Single user select */}
      <Field label="Mijoz" hint="(ixtiyoriy)">
        <UserSelect
          value={form.users_id}
          onChange={(id) => set('users_id', id)}
        />
      </Field>

      {/* Usage limits */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Umumiy limit">
          <input
            type="number" min={1} value={form.user_count}
            onChange={(e) => set('user_count', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="50" className={INPUT}
          />
        </Field>
        <Field label="Har bir foydalanuvchi">
          <input
            type="number" min={1} value={form.use_count_per_user}
            onChange={(e) => set('use_count_per_user', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="1" className={INPUT}
          />
        </Field>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-Color-Grey-Grey-200 px-5 py-2.5 text-sm font-semibold text-Color-Grey-Grey-700 transition-colors hover:bg-Color-Grey-Grey-50">
          Bekor qilish
        </button>
        <button type="submit" disabled={saving}
          className="rounded-xl bg-Color-Primary-Primary px-5 py-2.5 text-sm font-bold text-Color-Dark-Constant-Dark transition-opacity hover:opacity-90 disabled:opacity-50">
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
