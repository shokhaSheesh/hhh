import { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import {
  createTariff,
  updateTariff,
  useTariffTypes,
  type CreateTariffPayload,
} from '../hooks/useTariffs';
import type { Tariff } from '@/types/tariffs';

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = 'w-full rounded-xl border border-gray-700 bg-[#1E1E2D] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500';
const LABEL = 'block text-xs font-medium text-gray-500 mb-1.5';

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-brand-lime' : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name:              string;
  description:       string;
  key:               string;
  tariff_types_id:   string;
  color:             string;
  amount:            string;
  over_limit_amount: string;
  swap_count:        string;
  free_swap_count:   string;
  daily_swap_limit:  string;
  base_tariff:       boolean;
}

const EMPTY: FormState = {
  name: '', description: '', key: '', tariff_types_id: '',
  color: '#D1F22D', amount: '', over_limit_amount: '',
  swap_count: '', free_swap_count: '', daily_swap_limit: '',
  base_tariff: false,
};

function fromTariff(t: Tariff): FormState {
  return {
    name:              t.name,
    description:       t.description ?? '',
    key:               t.key,
    tariff_types_id:   t.tariff_types_id ?? '',
    color:             t.color || '#D1F22D',
    amount:            String(t.amount),
    over_limit_amount: String(t.over_limit_amount),
    swap_count:        String(t.swap_count),
    free_swap_count:   String(t.free_swap_count ?? 0),
    daily_swap_limit:  String(t.daily_swap_limit),
    base_tariff:       t.base_tariff,
  };
}

// ─── Preset brand colours ─────────────────────────────────────────────────────

const PALETTE = ['#D1F22D', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#64748B'];

// ─── Modal ────────────────────────────────────────────────────────────────────

interface Props {
  tariff?:   Tariff | null;
  onClose:   () => void;
  onSuccess: () => void;
}

export function TariffFormModal({ tariff, onClose, onSuccess }: Props) {
  const isEdit = Boolean(tariff);

  const [form,    setForm]    = useState<FormState>(() => tariff ? fromTariff(tariff) : EMPTY);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const { types: tariffTypes, loading: typesLoading } = useTariffTypes();

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

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(form.color);

  const canSubmit =
    form.name.trim() !== '' &&
    form.key.trim()  !== '' &&
    form.amount      !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const payload: CreateTariffPayload = {
      name:              form.name.trim(),
      description:       form.description.trim(),
      key:               form.key.trim().toLowerCase(),
      color:             isValidHex ? form.color : '#D1F22D',
      tariff_types_id:   form.tariff_types_id.trim(),
      base_tariff:       form.base_tariff,
      amount:            Number(form.amount) || 0,
      over_limit_amount: Number(form.over_limit_amount) || 0,
      swap_count:        Number(form.swap_count) || 0,
      free_swap_count:   Number(form.free_swap_count) || 0,
      daily_swap_limit:  Number(form.daily_swap_limit) || 0,
    };

    try {
      if (isEdit && tariff) {
        await updateTariff({ ...payload, guid: tariff.guid });
      } else {
        await createTariff(payload);
      }
      setSaved(true);
      setTimeout(() => { onSuccess(); onClose(); }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-dark-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              {isEdit ? 'Tarifni tahrirlash' : "Yangi tarif qo'shish"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {isEdit ? `Kalit: ${tariff?.key}` : "Barcha majburiy maydonlarni to'ldiring"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form id="tariff-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">

            {/* Name */}
            <div>
              <label className={LABEL}>
                Tarif nomi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Masalan: Oylik Pro"
                className={INPUT}
              />
            </div>

            {/* Description */}
            <div>
              <label className={LABEL}>Tavsif</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Tarif haqida qisqacha ma'lumot..."
                className={`${INPUT} resize-none`}
              />
            </div>

            {/* Key + Tariff type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>
                  Kalit (slug) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => set('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="premium_monthly"
                  className={`${INPUT} font-mono`}
                />
              </div>
              <div>
                <label className={LABEL}>Tarif turi</label>
                {typesLoading ? (
                  <div className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-700 bg-[#1E1E2D] px-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Yuklanmoqda…</span>
                  </div>
                ) : (
                  <select
                    value={form.tariff_types_id}
                    onChange={(e) => set('tariff_types_id', e.target.value)}
                    className={INPUT}
                  >
                    <option value="" className="bg-gray-900">— Tanlang —</option>
                    {tariffTypes.map((t) => (
                      <option key={t.guid} value={t.guid} className="bg-gray-900">
                        {t.name}{t.day_count ? ` (${t.day_count} kun)` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Financials */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>
                  Narxi (UZS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  placeholder="999000"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Limit oshganda narxi (UZS)</label>
                <input
                  type="number"
                  min={0}
                  value={form.over_limit_amount}
                  onChange={(e) => set('over_limit_amount', e.target.value)}
                  placeholder="30000"
                  className={INPUT}
                />
              </div>
            </div>

            {/* Quotas */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Almashtirish soni</label>
                <input
                  type="number"
                  min={0}
                  value={form.swap_count}
                  onChange={(e) => set('swap_count', e.target.value)}
                  placeholder="60"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Bepul almashtirishlar</label>
                <input
                  type="number"
                  min={0}
                  value={form.free_swap_count}
                  onChange={(e) => set('free_swap_count', e.target.value)}
                  placeholder="5"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Kunlik limit</label>
                <input
                  type="number"
                  min={0}
                  value={form.daily_swap_limit}
                  onChange={(e) => set('daily_swap_limit', e.target.value)}
                  placeholder="3"
                  className={INPUT}
                />
              </div>
            </div>

            {/* Color + Base tariff */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className={LABEL}>Rang</label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => set('color', hex)}
                      className="h-6 w-6 rounded-lg border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: hex,
                        borderColor: form.color === hex ? '#fff' : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="relative h-[42px] w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-gray-700"
                    style={{ backgroundColor: isValidHex ? form.color : '#D1F22D' }}
                  >
                    <input
                      type="color"
                      value={isValidHex ? form.color : '#D1F22D'}
                      onChange={(e) => set('color', e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => set('color', e.target.value)}
                    maxLength={7}
                    placeholder="#D1F22D"
                    className={`${INPUT} font-mono`}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-[#1E1E2D] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Asosiy tarif</p>
                    <p className="text-xs text-gray-500">Yangi foydalanuvchilarga tayinlanadi</p>
                  </div>
                  <Toggle on={form.base_tariff} onChange={() => set('base_tariff', !form.base_tariff)} />
                </div>
              </div>

            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-dark-border px-6 py-4">
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
              form="tariff-form"
              disabled={loading || saved || !canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-lime px-6 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saved ? (
                <><Check className="h-4 w-4" /> Saqlandi!</>
              ) : loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> Saqlanmoqda…</>
              ) : isEdit ? (
                'Saqlash'
              ) : (
                'Tarifni yaratish'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
