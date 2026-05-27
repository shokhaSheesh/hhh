import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Gift, ChevronLeft, ChevronRight, AlertCircle, Users,
  Plus, Check, X, ChevronDown, Search, Pencil, Trash2, type LucideIcon,
} from 'lucide-react';
import { useCoupons, useUserCoupons, extractArray } from './hooks/useCouponFetches';
import { usePermissions } from '@/hooks/usePermissions';
import { rootApi } from '@/api/client';
import UserFilter, { type UserOption } from '@/components/UserFilter';
import type { Coupon, UserCoupon } from '@/types/coupons';

const LIMIT = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Shared components ────────────────────────────────────────────────────────

function Pagination({ page, hasMore, onChange }: {
  page: number; hasMore: boolean; onChange: (p: number) => void;
}) {
  if (page === 1 && !hasMore) return null;
  return (
    <div className="flex items-center justify-end gap-2 border-t border-Color-Grey-Grey-200 px-6 py-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-Color-Grey-Grey-200 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-50 disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[2rem] text-center text-xs text-Color-Grey-Grey-600">{page}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={!hasMore}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-Color-Grey-Grey-200 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-50 disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-4 flex-1 animate-pulse rounded bg-Color-Grey-Grey-200" />
          ))}
        </div>
      ))}
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastItem { id: number; message: string; ok: boolean; }
let _tid = 0;

function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl ${
          t.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
               : 'border-red-300 bg-red-50 text-red-600'
        }`}>
          {t.ok ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Create Coupon modal ──────────────────────────────────────────────────────

function CouponModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [key,         setKey]         = useState('');
  const [description, setDescription] = useState('');
  const [amount,      setAmount]      = useState('');
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) { setErr("Kupon Nomi majburiy"); return; }
    setSaving(true);
    setErr(null);
    try {
      await rootApi.post('/v2/items/coupons?from-ofs=true', {
        data: {
          key:         key.trim(),
          description: description.trim() || '',
          amount:      amount ? Number(amount) : 0,
        },
        disable_faas: true,
      });
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Yangi kupon</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Kupon Nomi <span className="text-Color-Danger-Danger-Accent">*</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="SUMMER20"
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none focus:border-Color-Grey-Grey-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Tavsif</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kupon tavsifi"
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none focus:border-Color-Grey-Grey-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Miqdor (UZS)</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none focus:border-Color-Grey-Grey-400"
            />
          </div>
          {err && <p className="text-sm text-Color-Danger-Danger-Accent">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-semibold text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-Color-Info-Info-Accent px-4 py-2 text-sm font-bold text-Color-Light-Constant-White hover:opacity-90 disabled:opacity-50">
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirm({ message, onConfirm, onCancel, loading }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-Color-Danger-Danger-Soft">
            <Trash2 className="h-5 w-5 text-Color-Danger-Danger-Accent" />
          </div>
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">O'chirishni tasdiqlang</h2>
          <p className="mt-1.5 text-sm text-Color-Grey-Grey-600">{message}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-Color-Grey-Grey-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-semibold text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50 disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "O'chirilmoqda…" : "O'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Coupon modal ────────────────────────────────────────────────────────

function EditCouponModal({ coupon, onClose, onSaved }: { coupon: Coupon; onClose: () => void; onSaved: () => void }) {
  const [key,         setKey]         = useState(coupon.key ?? '');
  const [description, setDescription] = useState(coupon.description ?? '');
  const [amount,      setAmount]      = useState(coupon.amount != null ? String(coupon.amount) : '');
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) { setErr("Kupon nomi majburiy"); return; }
    setSaving(true);
    setErr(null);
    try {
      await rootApi.put('/v2/items/coupons?from-ofs=true', {
        data: {
          guid:        coupon.guid,
          key:         key.trim(),
          description: description.trim(),
          amount:      amount ? Number(amount) : 0,
        },
        disable_faas: true,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Kuponni tahrirlash</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Kupon Nomi <span className="text-Color-Danger-Danger-Accent">*</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none focus:border-Color-Grey-Grey-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Tavsif</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none focus:border-Color-Grey-Grey-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Miqdor (UZS)</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none focus:border-Color-Grey-Grey-400"
            />
          </div>
          {err && <p className="text-sm text-Color-Danger-Danger-Accent">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-semibold text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-Color-Info-Info-Accent px-4 py-2 text-sm font-bold text-Color-Light-Constant-White hover:opacity-90 disabled:opacity-50">
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Coupon select dropdown ───────────────────────────────────────────────────

interface CouponOption { guid: string; key: string | null; description: string | null; amount: number | null; }

function CouponSelect({ value, onSelect }: {
  value: CouponOption | null;
  onSelect: (opt: CouponOption) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [options, setOptions] = useState<CouponOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pos,     setPos]     = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    rootApi
      .get<unknown>('/v2/items/coupons?from-ofs=true&offset=0&limit=200')
      .then((res) => {
        if (cancelled) return;
        setOptions(extractArray<CouponOption>(res));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleOpen() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen((v) => !v);
  }

  const q = query.toLowerCase();
  const filtered = options.filter((o) =>
    (o.key?.toLowerCase().includes(q) ?? false) ||
    (o.description?.toLowerCase().includes(q) ?? false)
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center justify-between rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-left text-sm outline-none focus:border-Color-Grey-Grey-400"
      >
        {value ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="rounded border border-Color-Primary-Primary/30 bg-Color-Primary-Primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-Color-Primary-Primary shrink-0">
              {value.key ?? '—'}
            </span>
            <span className="truncate text-Color-Grey-Grey-700">{value.description || ''}</span>
          </span>
        ) : (
          <span className="text-Color-Grey-Grey-500">Kupon tanlang…</span>
        )}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-Color-Grey-Grey-500" />
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl"
        >
          <div className="flex items-center gap-2 border-b border-Color-Grey-Grey-200 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-Color-Grey-Grey-500" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qidirish…"
              className="w-full bg-transparent text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-xs text-Color-Grey-Grey-500">Yuklanmoqda…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-Color-Grey-Grey-500">Topilmadi</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.guid}
                  type="button"
                  onClick={() => { onSelect(opt); setOpen(false); setQuery(''); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-Color-Grey-Grey-50"
                >
                  <span className="rounded border border-Color-Primary-Primary/30 bg-Color-Primary-Primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-Color-Primary-Primary shrink-0">
                    {opt.key ?? '—'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-Color-Grey-Grey-950">{opt.description || '—'}</span>
                    {opt.amount != null && opt.amount > 0 && (
                      <span className="font-mono text-xs text-Color-Grey-Grey-600">
                        {opt.amount.toLocaleString('ru-RU')} UZS
                      </span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Create User Coupon modal ─────────────────────────────────────────────────

function UserCouponModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [selectedUser,   setSelectedUser]   = useState<UserOption | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponOption | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [err,            setErr]            = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser)   { setErr("Foydalanuvchi tanlang"); return; }
    if (!selectedCoupon) { setErr("Kupon tanlang"); return; }
    setSaving(true);
    setErr(null);
    try {
      await rootApi.post('/v2/items/user_coupons?from-ofs=true', {
        data: {
          users_id:   selectedUser.guid,
          coupons_id: selectedCoupon.guid,
        },
        disable_faas: true,
      });
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Foydalanuvchiga kupon berish</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Foydalanuvchi <span className="text-Color-Danger-Danger-Accent">*</span>
            </label>
            <UserFilter onSelect={setSelectedUser} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Kupon <span className="text-Color-Danger-Danger-Accent">*</span>
            </label>
            <CouponSelect value={selectedCoupon} onSelect={setSelectedCoupon} />
          </div>
          {err && <p className="text-sm text-Color-Danger-Danger-Accent">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-semibold text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-Color-Info-Info-Accent px-4 py-2 text-sm font-bold text-Color-Light-Constant-White hover:opacity-90 disabled:opacity-50">
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit User Coupon modal ───────────────────────────────────────────────────

function EditUserCouponModal({ uc, onClose, onSaved }: { uc: UserCoupon; onClose: () => void; onSaved: () => void }) {
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(
    uc.users_id
      ? { guid: uc.users_id, name: uc.users_id_data?.name ?? '', phone: uc.users_id_data?.phone ?? '' }
      : null
  );
  const [selectedCoupon, setSelectedCoupon] = useState<CouponOption | null>(
    uc.coupons_id
      ? { guid: uc.coupons_id, key: uc.coupons_id_data?.key ?? null, description: uc.coupons_id_data?.description ?? null, amount: uc.coupons_id_data?.amount ?? null }
      : null
  );
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser)   { setErr("Foydalanuvchi tanlang"); return; }
    if (!selectedCoupon) { setErr("Kupon tanlang"); return; }
    setSaving(true);
    setErr(null);
    try {
      await rootApi.put('/v2/items/user_coupons?from-ofs=true', {
        data: {
          guid:       uc.guid,
          users_id:   selectedUser.guid,
          coupons_id: selectedCoupon.guid,
        },
        disable_faas: true,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Foydalanuvchi kuponini tahrirlash</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Foydalanuvchi <span className="text-Color-Danger-Danger-Accent">*</span>
            </label>
            {selectedUser && (
              <div className="mb-1.5 flex items-center gap-2 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-Color-Primary-Primary/10 text-xs font-bold text-Color-Primary-Primary">
                  {initials(selectedUser.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold capitalize text-Color-Grey-Grey-950">{selectedUser.name.toLowerCase()}</p>
                  <p className="font-mono text-xs text-Color-Grey-Grey-600">{selectedUser.phone}</p>
                </div>
              </div>
            )}
            <UserFilter onSelect={setSelectedUser} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Kupon <span className="text-Color-Danger-Danger-Accent">*</span>
            </label>
            <CouponSelect value={selectedCoupon} onSelect={setSelectedCoupon} />
          </div>
          {err && <p className="text-sm text-Color-Danger-Danger-Accent">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-semibold text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-Color-Info-Info-Accent px-4 py-2 text-sm font-bold text-Color-Light-Constant-White hover:opacity-90 disabled:opacity-50">
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Coupons tab ──────────────────────────────────────────────────────────────

function CouponRow({ coupon, onEdit, onDelete }: { coupon: Coupon; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4 transition-colors hover:bg-Color-Grey-Grey-50">
      {/* Key */}
      <div className="w-40 shrink-0">
        {coupon.key ? (
          <span className="rounded-md border border-Color-Primary-Primary/30 bg-Color-Primary-Primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-Color-Primary-Primary">
            {coupon.key}
          </span>
        ) : (
          <span className="text-xs text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm text-Color-Grey-Grey-700">{coupon.description || '—'}</p>
      </div>

      {/* Amount */}
      <div className="w-36 shrink-0 text-right">
        {coupon.amount != null && coupon.amount > 0 ? (
          <span className="font-mono text-sm font-semibold text-Color-Grey-Grey-950">
            {coupon.amount.toLocaleString('ru-RU')} UZS
          </span>
        ) : (
          <span className="text-xs text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Created */}
      <div className="w-40 shrink-0 text-sm text-Color-Grey-Grey-600">
        {fmtDate(coupon.created_at)}
      </div>

      {/* Actions */}
      <div className="w-20 shrink-0 flex justify-end gap-1">
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Danger-Danger-Soft hover:text-Color-Danger-Danger-Accent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

const COUPON_HEADERS = [
  { label: 'Kupon Nomi',  cls: 'w-40 shrink-0'           },
  { label: 'Tavsif',      cls: 'flex-1 min-w-0'           },
  { label: 'Miqdor',      cls: 'w-36 shrink-0 text-right' },
  { label: 'Yaratilgan',  cls: 'w-40 shrink-0'           },
  { label: '',            cls: 'w-20 shrink-0'            },
] as const;

function CouponsTab() {
  const { canWrite, canUpdate, canDelete } = usePermissions();
  const [page, setPage]                   = useState(1);
  const [tick, setTick]                   = useState(0);
  const [modalOpen, setModal]             = useState(false);
  const [editing, setEditing]             = useState<Coupon | null>(null);
  const [deleting, setDeleting]           = useState<Coupon | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts, setToasts]               = useState<ToastItem[]>([]);

  const { items, hasMore, loading, error } = useCoupons({ page, limit: LIMIT, tick });

  function pushToast(message: string, ok: boolean) {
    const id = ++_tid;
    setToasts((t) => [...t, { id, message, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  async function confirmDelete(coupon: Coupon) {
    setDeleteLoading(true);
    try {
      // fetch all user_coupons linked to this coupon and delete them first
      const res = await rootApi.get<unknown>(`/v2/items/user_coupons?from-ofs=true&offset=0&limit=1000`);
      const linked = extractArray<{ guid: string; coupons_id: string | null }>(res)
        .filter((uc) => uc.coupons_id === coupon.guid);

      await Promise.all(
        linked.map((uc) =>
          rootApi.delete(`/v2/items/user_coupons/${uc.guid}?from-ofs=true`, { data: { data: {} } })
        )
      );

      await rootApi.delete(`/v2/items/coupons/${coupon.guid}?from-ofs=true`, { data: { data: {} } });
      setDeleting(null);
      setTick((n) => n + 1);
      pushToast(
        linked.length > 0
          ? `Kupon va ${linked.length} ta foydalanuvchi kuponi o'chirildi`
          : "Kupon o'chirildi",
        true
      );
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Xatolik yuz berdi", false);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <ToastStack toasts={toasts} />
      {modalOpen && (
        <CouponModal
          onClose={() => setModal(false)}
          onCreated={() => { setTick((n) => n + 1); pushToast("Kupon yaratildi", true); }}
        />
      )}
      {editing && (
        <EditCouponModal
          coupon={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setTick((n) => n + 1); pushToast("Kupon yangilandi", true); }}
        />
      )}
      {deleting && (
        <DeleteConfirm
          message={`"${deleting.key ?? deleting.guid}" kuponi o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.`}
          onConfirm={() => confirmDelete(deleting)}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
      <div className="rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-Color-Grey-Grey-950">Kuponlar jadvali</h2>
          {canWrite('coupons') && (
            <button
              onClick={() => setModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-4 py-2 text-xs font-bold text-Color-Light-Constant-White hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Yangi kupon
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-6 py-3">
              {COUPON_HEADERS.map(({ label, cls }) => (
                <div key={label} className={cls}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">{label}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <SkeletonRows cols={5} />
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="h-10 w-10 text-Color-Danger-Danger-Accent" strokeWidth={1.5} />
                <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">Kuponlar topilmadi</div>
            ) : (
              items.map((c) => (
                <CouponRow
                  key={c.guid}
                  coupon={c}
                  onEdit={canUpdate('coupons') ? () => setEditing(c) : undefined}
                  onDelete={canDelete('coupons') ? () => setDeleting(c) : undefined}
                />
              ))
            )}
          </div>
        </div>

        {!loading && !error && (
          <Pagination page={page} hasMore={hasMore} onChange={(p) => { setPage(p); window.scrollTo(0, 0); }} />
        )}
      </div>
    </>
  );
}

// ─── User coupons tab ─────────────────────────────────────────────────────────

function UserCouponRow({ uc, onEdit, onDelete }: { uc: UserCoupon; onEdit?: () => void; onDelete?: () => void }) {
  const user   = uc.users_id_data;
  const coupon = uc.coupons_id_data;

  return (
    <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4 transition-colors hover:bg-Color-Grey-Grey-50">
      {/* User */}
      <div className="w-56 shrink-0 min-w-0">
        {user ? (
          <div className="flex items-center gap-2.5">
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-Color-Primary-Primary/10 text-xs font-bold text-Color-Primary-Primary"
              style={{ display: user.photo ? undefined : 'flex' }}
            >
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold capitalize text-Color-Grey-Grey-950">{user.name.toLowerCase()}</p>
              <p className="font-mono text-xs text-Color-Grey-Grey-600">{user.phone}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Coupon key */}
      <div className="w-36 shrink-0">
        {coupon?.key ? (
          <span className="rounded-md border border-Color-Primary-Primary/30 bg-Color-Primary-Primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-Color-Primary-Primary">
            {coupon.key}
          </span>
        ) : (
          <span className="font-mono text-xs text-Color-Grey-Grey-600">
            {uc.coupons_id?.slice(-8).toUpperCase() ?? '—'}
          </span>
        )}
      </div>

      {/* Coupon description */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm text-Color-Grey-Grey-600">{coupon?.description || '—'}</p>
      </div>

      {/* Coupon amount */}
      <div className="w-36 shrink-0 text-right">
        {coupon?.amount != null && coupon.amount > 0 ? (
          <span className="font-mono text-sm font-semibold text-Color-Grey-Grey-950">
            {coupon.amount.toLocaleString('ru-RU')} UZS
          </span>
        ) : (
          <span className="text-xs text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Created */}
      <div className="w-40 shrink-0 text-sm text-Color-Grey-Grey-600">
        {fmtDate(uc.created_at)}
      </div>

      {/* Actions */}
      <div className="w-20 shrink-0 flex justify-end gap-1">
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Danger-Danger-Soft hover:text-Color-Danger-Danger-Accent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

const USER_COUPON_HEADERS = [
  { label: 'Foydalanuvchi', cls: 'w-56 shrink-0'           },
  { label: 'Kupon kodi',    cls: 'w-36 shrink-0'           },
  { label: 'Tavsif',        cls: 'flex-1 min-w-0'           },
  { label: 'Miqdor',        cls: 'w-36 shrink-0 text-right' },
  { label: 'Yaratilgan',    cls: 'w-40 shrink-0'           },
  { label: '',              cls: 'w-20 shrink-0'            },
] as const;

function UserCouponsTab() {
  const { canWrite, canUpdate, canDelete } = usePermissions();
  const [page, setPage]                   = useState(1);
  const [tick, setTick]                   = useState(0);
  const [modalOpen, setModal]             = useState(false);
  const [editing, setEditing]             = useState<UserCoupon | null>(null);
  const [deleting, setDeleting]           = useState<UserCoupon | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts, setToasts]               = useState<ToastItem[]>([]);

  const { items, hasMore, loading, error } = useUserCoupons({ page, limit: LIMIT, tick });

  function pushToast(message: string, ok: boolean) {
    const id = ++_tid;
    setToasts((t) => [...t, { id, message, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  async function confirmDelete(uc: UserCoupon) {
    setDeleteLoading(true);
    try {
      await rootApi.delete(`/v2/items/user_coupons/${uc.guid}?from-ofs=true`, { data: { data: {} } });
      setDeleting(null);
      setTick((n) => n + 1);
      pushToast("Kupon o'chirildi", true);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Xatolik yuz berdi", false);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <ToastStack toasts={toasts} />
      {modalOpen && (
        <UserCouponModal
          onClose={() => setModal(false)}
          onCreated={() => { setTick((n) => n + 1); pushToast("Kupon berildi", true); }}
        />
      )}
      {editing && (
        <EditUserCouponModal
          uc={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setTick((n) => n + 1); pushToast("Kupon yangilandi", true); }}
        />
      )}
      {deleting && (
        <DeleteConfirm
          message={`${deleting.users_id_data?.name ?? 'Foydalanuvchi'} uchun "${deleting.coupons_id_data?.key ?? 'kupon'}" o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.`}
          onConfirm={() => confirmDelete(deleting)}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
      <div className="rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-Color-Grey-Grey-950">Foydalanuvchi kuponlari jadvali</h2>
          {canWrite('user_coupons') && (
            <button
              onClick={() => setModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-4 py-2 text-xs font-bold text-Color-Light-Constant-White hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Kupon berish
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-6 py-3">
              {USER_COUPON_HEADERS.map(({ label, cls }) => (
                <div key={label} className={cls}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">{label}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <SkeletonRows cols={6} />
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="h-10 w-10 text-Color-Danger-Danger-Accent" strokeWidth={1.5} />
                <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
                Foydalanuvchi kuponlari topilmadi
              </div>
            ) : (
              items.map((uc) => (
                <UserCouponRow
                  key={uc.guid}
                  uc={uc}
                  onEdit={canUpdate('user_coupons') ? () => setEditing(uc) : undefined}
                  onDelete={canDelete('user_coupons') ? () => setDeleting(uc) : undefined}
                />
              ))
            )}
          </div>
        </div>

        {!loading && !error && (
          <Pagination page={page} hasMore={hasMore} onChange={(p) => { setPage(p); window.scrollTo(0, 0); }} />
        )}
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'coupons' | 'user_coupons';

export default function CouponsPage() {
  const { canRead }       = usePermissions();
  const [activeTab, setActiveTab] = useState<Tab>('coupons');

  const canCoupons     = canRead('coupons');
  const canUserCoupons = canRead('user_coupons');

  const tabs: { id: Tab; label: string; icon: LucideIcon; allowed: boolean }[] = [
    { id: 'coupons',      label: 'Kuponlar',                icon: Gift,  allowed: canCoupons     },
    { id: 'user_coupons', label: 'Foydalanuvchi Kuponlari', icon: Users, allowed: canUserCoupons },
  ];

  const visibleTabs = tabs.filter((t) => t.allowed);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-Color-Grey-Grey-950">Kuponlar</h1>
        <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Kuponlar va foydalanuvchi kuponlarini boshqarish</p>
      </div>

      {visibleTabs.length > 0 && (
        <div className="flex gap-1 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 p-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark'
                    : 'text-Color-Grey-Grey-500 hover:text-Color-Grey-Grey-950',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'coupons'      && canCoupons     && <CouponsTab />}
      {activeTab === 'user_coupons' && canUserCoupons && <UserCouponsTab />}
    </div>
  );
}
