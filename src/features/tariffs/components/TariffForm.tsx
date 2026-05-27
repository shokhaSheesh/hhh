import { useState } from 'react';
import type { Tariff } from '@/types/tariffs';

// ─── Value shape ──────────────────────────────────────────────────────────────

export interface TariffFormValues {
  name:              string;
  amount:            number | '';
  color:             string;
  day_count:         number | '';
  daily_swap_limit:  number | '';
  swap_count:        number | '';
  over_limit_amount: number | '';
  base_tariff:       boolean;
}

const DEFAULTS: TariffFormValues = {
  name:              '',
  amount:            '',
  color:             '#D1F22D',
  day_count:         '',
  daily_swap_limit:  '',
  swap_count:        '',
  over_limit_amount: '',
  base_tariff:       false,
};

function fromTariff(t: Tariff): TariffFormValues {
  return {
    name:              t.name,
    amount:            t.amount,
    color:             t.color,
    day_count:         t.tariff_types_id_data?.day_count ?? '',
    daily_swap_limit:  t.daily_swap_limit,
    swap_count:        t.swap_count,
    over_limit_amount: t.over_limit_amount,
    base_tariff:       t.base_tariff,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">{label}</label>
      {children}
    </div>
  );
}

const INPUT = 'w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-Color-Primary-Primary' : 'bg-Color-Grey-Grey-400'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface Props {
  initial?:   Tariff | null;
  onSave:     (values: TariffFormValues) => void;
  onCancel:   () => void;
  saveLabel?: string;
}

export default function TariffForm({ initial, onSave, onCancel, saveLabel = 'Saqlash' }: Props) {
  const [values, setValues] = useState<TariffFormValues>(
    initial ? fromTariff(initial) : DEFAULTS,
  );

  const set = <K extends keyof TariffFormValues>(key: K, val: TariffFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[TariffForm] payload:', values);
    onSave(values);
  };

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(values.color);
  const previewColor = isValidHex ? values.color : 'transparent';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Name */}
      <Field label="Tarif nomi">
        <input
          type="text"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Masalan: Oylik Pro"
          required
          className={INPUT}
        />
      </Field>

      {/* Amount + Duration + Color */}
      <div className="grid grid-cols-[1fr_160px_1fr] gap-4">
        <Field label="Narxi (UZS)">
          <input
            type="number"
            min={0}
            value={values.amount}
            onChange={(e) => set('amount', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="999000"
            required
            className={INPUT}
          />
        </Field>

        <Field label="Muddat (kun)">
          <input
            type="number"
            min={1}
            value={values.day_count}
            onChange={(e) => set('day_count', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="30"
            required
            className={INPUT}
          />
        </Field>

        <Field label="Rang">
          <div className="flex items-center gap-2">
            {/* Colored swatch — transparent color picker sits on top */}
            <div
              className="relative h-[42px] w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-Color-Grey-Grey-200"
              style={{ backgroundColor: previewColor }}
            >
              <input
                type="color"
                value={isValidHex ? values.color : '#000000'}
                onChange={(e) => set('color', e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <input
              type="text"
              value={values.color}
              onChange={(e) => set('color', e.target.value)}
              maxLength={7}
              placeholder="#D1F22D"
              className={`${INPUT} font-mono`}
            />
            <div
              className="h-5 w-5 shrink-0 rounded-full border border-Color-Grey-Grey-200"
              style={{ backgroundColor: previewColor }}
            />
          </div>
        </Field>
      </div>

      {/* Numeric trio */}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Kunlik limit">
          <input
            type="number"
            min={0}
            value={values.daily_swap_limit}
            onChange={(e) => set('daily_swap_limit', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="3"
            required
            className={INPUT}
          />
        </Field>

        <Field label="Almashtirish soni">
          <input
            type="number"
            min={0}
            value={values.swap_count}
            onChange={(e) => set('swap_count', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="60"
            required
            className={INPUT}
          />
        </Field>

        <Field label="Limit narxi (UZS)">
          <input
            type="number"
            min={0}
            value={values.over_limit_amount}
            onChange={(e) => set('over_limit_amount', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="30000"
            required
            className={INPUT}
          />
        </Field>
      </div>

      {/* Base tariff toggle */}
      <div className="flex items-center justify-between rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-Color-Grey-Grey-950">Asosiy tarif</p>
          <p className="mt-0.5 text-xs text-Color-Grey-Grey-600">Bu tarif yangi foydalanuvchilarga avtomatik tayinlanadi</p>
        </div>
        <Toggle checked={values.base_tariff} onChange={(v) => set('base_tariff', v)} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-Color-Grey-Grey-200 px-5 py-2.5 text-sm font-semibold text-Color-Grey-Grey-700 transition-colors hover:bg-Color-Grey-Grey-50"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          className="rounded-xl bg-Color-Primary-Primary px-5 py-2.5 text-sm font-semibold text-Color-Dark-Constant-Dark transition-opacity hover:opacity-90"
        >
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
