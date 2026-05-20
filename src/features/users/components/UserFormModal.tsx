import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { User } from '@/types/user';
import { createUser, updateUser } from '../hooks/useUserMutations';

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors ${
        on ? 'border-brand-lime bg-brand-lime' : 'border-gray-600 bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-gray-400">{children}</label>;
}

function Input({
  value, onChange, placeholder, type = 'text',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500 focus:ring-1 focus:ring-gray-500/20"
    />
  );
}

function Select({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-gray-500 focus:ring-1 focus:ring-gray-500/20"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-gray-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name:                   string;
  phone:                  string;
  balance:                string;
  address:                string;
  passport_serial_number: string;
  pinfl:                  string;
  birth_date:             string;
  gender:                 string;
  app_language:           string;
  active:                 boolean;
  verified:               boolean;
  client_type_id:         string;
  role_id:                string;
}

const DEFAULT_CLIENT_TYPE_ID = 'fb2274a7-5dd2-4e59-b10b-034ad0d320e2'; // USER
const DEFAULT_ROLE_ID        = '45fa9375-e74e-4847-a188-5708651003e7'; // CLIENT

function toDateInput(iso: string): string {
  if (!iso) return '';
  try { return iso.slice(0, 10); } catch { return ''; }
}

function initForm(user: User | null): FormState {
  if (!user) return {
    name: '', phone: '', balance: '0', address: '',
    passport_serial_number: '', pinfl: '',
    birth_date: '', gender: 'male', app_language: 'uz',
    active: true, verified: true,
    client_type_id: DEFAULT_CLIENT_TYPE_ID,
    role_id:        DEFAULT_ROLE_ID,
  };
  return {
    name:                   user.name,
    phone:                  user.phone ?? '',
    balance:                String(user.balance ?? 0),
    address:                user.address ?? '',
    passport_serial_number: user.passport_serial_number ?? '',
    pinfl:                  user.pinfl ?? '',
    birth_date:             toDateInput(user.birth_date),
    gender:                 user.gender?.[0] ?? 'male',
    app_language:           user.app_language?.[0] ?? 'uz',
    active:                 user.active ?? false,
    verified:               user.verified ?? false,
    client_type_id:         user.client_type_id ?? '',
    role_id:                user.role_id ?? '',
  };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface Props {
  user?:      User | null;   // null/undefined = create mode
  onClose:   () => void;
  onSuccess: () => void;
}

export function UserFormModal({ user, onClose, onSuccess }: Props) {
  const isEdit = Boolean(user);
  const [form,    setForm]    = useState<FormState>(() => initForm(user ?? null));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const birthIso = form.birth_date
      ? new Date(form.birth_date).toISOString()
      : new Date().toISOString();

    const data = {
      phone:                  form.phone.trim(),
      name:                   form.name.trim(),
      status:                 0,
      balance:                Number(form.balance) || 0,
      active:                 form.active,
      verified:               form.verified,
      synced:                 false,
      birth_date:             birthIso,
      gender:                 [form.gender.toLowerCase()],
      app_language:           [form.app_language.toLowerCase()],
      address:                form.address || '',
      passport_serial_number: form.passport_serial_number || '',
      pinfl:                  form.pinfl || '',
      client_type_id:         form.client_type_id || DEFAULT_CLIENT_TYPE_ID,
      role_id:                form.role_id        || DEFAULT_ROLE_ID,
    };

    try {
      if (isEdit && user) {
        await updateUser({
          data: {
            ...data,
            guid:         user.guid,
            user_id_auth: user.user_id_auth || '5a732ce0-2aed-4e8f-b6d6-4082413ddea0',
          },
          disable_faas: false,
        });
      } else {
        await createUser({
          data: { ...data, open_id: crypto.randomUUID() },
          disable_faas: false,
        });
      }
      setSaved(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noma'lum xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-dark-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              {isEdit ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi qo'shish"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {isEdit ? `ID: ${user?.unique_id}` : "Barcha maydonlarni to'ldiring"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <form id="user-form" onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">

              {/* Name */}
              <div>
                <Label>Ism Familiya</Label>
                <Input value={form.name} onChange={(v) => set('name', v)} placeholder="Aziz Karimov" />
              </div>

              {/* Phone */}
              <div>
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(v) => set('phone', v)} placeholder="+998901234567" />
              </div>

              {/* Balance */}
              <div>
                <Label>Balans (so'm)</Label>
                <Input value={form.balance} onChange={(v) => set('balance', v)} placeholder="0" type="number" />
              </div>

              {/* Birth date */}
              <div>
                <Label>Tug'ilgan sana</Label>
                <Input value={form.birth_date} onChange={(v) => set('birth_date', v)} type="date" />
              </div>

              {/* Gender */}
              <div>
                <Label>Jinsi</Label>
                <Select
                  value={form.gender}
                  onChange={(v) => set('gender', v)}
                  options={[
                    { value: 'male',   label: 'Erkak' },
                    { value: 'female', label: 'Ayol'  },
                  ]}
                />
              </div>

              {/* App language */}
              <div>
                <Label>Ilova tili</Label>
                <Select
                  value={form.app_language}
                  onChange={(v) => set('app_language', v)}
                  options={[
                    { value: 'uz', label: "O'zbekcha" },
                    { value: 'en', label: 'English'    },
                    { value: 'ru', label: 'Русский'    },
                  ]}
                />
              </div>

              {/* Address — full width */}
              <div className="col-span-2">
                <Label>Manzil</Label>
                <Input value={form.address} onChange={(v) => set('address', v)} placeholder="Toshkent, Chilonzor tumani..." />
              </div>

              {/* Passport */}
              <div>
                <Label>Pasport seriyasi</Label>
                <Input value={form.passport_serial_number} onChange={(v) => set('passport_serial_number', v)} placeholder="AA1234567" />
              </div>

              {/* PINFL */}
              <div>
                <Label>JSHSHIR (PINFL)</Label>
                <Input value={form.pinfl} onChange={(v) => set('pinfl', v)} placeholder="12345678901234" />
              </div>

              {/* Toggles row */}
              <div className="col-span-2 mt-1 flex items-center gap-8 rounded-xl border border-dark-border bg-gray-900/40 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Toggle on={form.active} onChange={() => set('active', !form.active)} />
                  <div>
                    <p className="text-sm font-medium text-white">Faol</p>
                    <p className="text-xs text-gray-500">Hisob faolligi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle on={form.verified} onChange={() => set('verified', !form.verified)} />
                  <div>
                    <p className="text-sm font-medium text-white">Tasdiqlangan</p>
                    <p className="text-xs text-gray-500">Identifikatsiya holati</p>
                  </div>
                </div>
              </div>

            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-dark-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-dark-border px-5 py-2.5 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/5"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={loading || saved}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-lime px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saqlandi!
              </>
            ) : loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Saqlanmoqda…
              </>
            ) : isEdit ? 'Saqlash' : "Qo'shish"}
          </button>
        </div>
      </div>
    </div>
  );
}
