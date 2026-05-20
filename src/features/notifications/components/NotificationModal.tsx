import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, Users, Upload, Check } from 'lucide-react';
import { createApi, VIEW } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import {
  createNotification,
  type NotifUiType,
} from '../hooks/useNotifications';
import type { User, UsersListResponse } from '@/types/user';

const usersApi = createApi(VIEW.users);

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTIF_TABS: { key: NotifUiType; label: string }[] = [
  { key: 'BILDIRISHNOMA', label: 'Bildirishnoma' },
  { key: 'YANGILIK',      label: 'Yangilik'      },
];

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  type:       NotifUiType;
  title_uz:   string;
  message_uz: string;
  title_en:   string;
  message_en: string;
  title_ru:   string;
  message_ru: string;
  file_link:  string;
  users_id:   string | null;
}

const EMPTY_FORM: FormState = {
  type:       'BILDIRISHNOMA',
  title_uz:   '', message_uz: '',
  title_en:   '', message_en: '',
  title_ru:   '', message_ru: '',
  file_link:  '',
  users_id:   null,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = 'w-full rounded-xl border border-dark-border bg-[#1E1E2D] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500';
const LABEL = 'block text-xs font-medium text-gray-500 mb-1.5';

// ─── Language column ──────────────────────────────────────────────────────────

interface LangColProps {
  header:      string;
  titleVal:    string;
  messageVal:  string;
  titlePh:     string;
  messagePh:   string;
  onTitle:     (v: string) => void;
  onMessage:   (v: string) => void;
}

function LangColumn({ header, titleVal, messageVal, titlePh, messagePh, onTitle, onMessage }: LangColProps) {
  const titleEmpty   = !titleVal.trim();
  const messageEmpty = !messageVal.trim();

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-dark-border bg-gray-900/30 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">{header}</span>
        {(titleEmpty || messageEmpty) && (
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        )}
      </div>

      {/* Title */}
      <div>
        <label className={LABEL}>
          Sarlavha / Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={titleVal}
          onChange={(e) => onTitle(e.target.value)}
          placeholder={titlePh}
          className={INPUT}
        />
      </div>

      {/* Message */}
      <div>
        <label className={LABEL}>
          Xabar / Message <span className="text-red-500">*</span>
        </label>
        <textarea
          value={messageVal}
          onChange={(e) => onMessage(e.target.value)}
          rows={4}
          placeholder={messagePh}
          className={`${INPUT} resize-none`}
        />
      </div>
    </div>
  );
}

// ─── User select ──────────────────────────────────────────────────────────────

function UserSelect({ value, onChange }: {
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
      .then((res) => { if (!cancelled) { setResults(res.data.data.response ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedSearch, open]);

  const pick  = (u: User) => { setSelected(u); onChange(u.guid); setOpen(false); setSearch(''); };
  const clear = () => { setSelected(null); onChange(null); };

  if (selected ?? (value && !selected)) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dark-border bg-[#1E1E2D] px-4 py-2.5">
        <div>
          <p className="text-sm font-medium text-white">{selected?.name || value}</p>
          {selected?.phone && <p className="text-xs text-gray-500">{selected.phone}</p>}
        </div>
        <button type="button" onClick={clear} className="text-gray-500 transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Mijozni qidirish..."
        className={`${INPUT} pl-9`}
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-dark-border bg-[#16161D] shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Qidirmoqda…</span>
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-600">Mijoz topilmadi</p>
          ) : (
            results.map((u) => (
              <button key={u.guid} type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(u)}
                className="flex w-full flex-col items-start px-4 py-2.5 text-left transition-colors hover:bg-white/5"
              >
                <span className="text-sm font-medium text-white">{u.name || '—'}</span>
                <span className="text-xs text-gray-500">{u.phone}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function NotificationModal({ onClose }: { onClose: () => void }) {
  const [form,    setForm]    = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const isNews = form.type === 'YANGILIK';

  const canSubmit =
    form.title_uz.trim()   !== '' &&
    form.message_uz.trim() !== '' &&
    form.title_en.trim()   !== '' &&
    form.message_en.trim() !== '' &&
    form.title_ru.trim()   !== '' &&
    form.message_ru.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      await createNotification({
        type:       form.type,
        users_id:   !isNews ? form.users_id : null,
        title_uz:   form.title_uz.trim(),
        message_uz: form.message_uz.trim(),
        title_en:   form.title_en.trim(),
        message_en: form.message_en.trim(),
        title_ru:   form.title_ru.trim(),
        message_ru: form.message_ru.trim(),
        image:      '',
        file_link:  isNews ? form.file_link.trim() : '',
      });
      setSaved(true);
      setTimeout(onClose, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Kontent qo'shish</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notification type tabs */}
        <div className="flex shrink-0 border-b border-dark-border">
          {NOTIF_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set('type', key)}
              className={[
                'px-6 py-3 text-sm font-semibold transition-colors',
                form.type === key
                  ? 'border-b-2 border-brand-lime text-white'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto">

          {/* 3-column language grid */}
          <div className="flex gap-4 p-6">
            <LangColumn
              header="O'zbekcha"
              titleVal={form.title_uz}
              messageVal={form.message_uz}
              titlePh="Sarlavhani kiriting"
              messagePh="Xabar matnini kiriting"
              onTitle={(v) => set('title_uz', v)}
              onMessage={(v) => set('message_uz', v)}
            />
            <LangColumn
              header="English"
              titleVal={form.title_en}
              messageVal={form.message_en}
              titlePh="Enter the title"
              messagePh="Enter the message"
              onTitle={(v) => set('title_en', v)}
              onMessage={(v) => set('message_en', v)}
            />
            <LangColumn
              header="Русский"
              titleVal={form.title_ru}
              messageVal={form.message_ru}
              titlePh="Введите заголовок"
              messagePh="Введите сообщение"
              onTitle={(v) => set('title_ru', v)}
              onMessage={(v) => set('message_ru', v)}
            />
          </div>

          {/* File / link — Yangilik only */}
          {isNews && (
            <div className="grid grid-cols-2 gap-4 border-t border-dark-border px-6 py-5">
              <div>
                <label className={LABEL}>Fayl</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-dark-border bg-[#1E1E2D] px-4 py-3 transition-colors hover:border-gray-500">
                  <Upload className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="text-sm text-gray-500">Fayl yuklash</span>
                  <input type="file" className="sr-only" />
                </label>
              </div>
              <div>
                <label className={LABEL}>Havola</label>
                <input
                  type="url"
                  value={form.file_link}
                  onChange={(e) => set('file_link', e.target.value)}
                  placeholder="Havola manzilini kiriting"
                  className={INPUT}
                />
              </div>
            </div>
          )}

          {/* Recipient — Bildirishnoma only */}
          {!isNews && (
            <div className="border-t border-dark-border px-6 py-5">
              <label className={LABEL}>Qabul qiluvchi (ixtiyoriy)</label>
              <UserSelect
                value={form.users_id}
                onChange={(id) => set('users_id', id)}
              />
              {!form.users_id && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600">
                  <Users className="h-3 w-3" />
                  Tanlanmasa — barcha foydalanuvchilarga yuboriladi
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-dark-border px-6 py-4">
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-gray-700 px-6 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading || saved || !canSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-lime px-6 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saved ? (
                  <><Check className="h-4 w-4" /> Saqlandi!</>
                ) : loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> Saqlanmoqda…</>
                ) : (
                  'Saqlash'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
