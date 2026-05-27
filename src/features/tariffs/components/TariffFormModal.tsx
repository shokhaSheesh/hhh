import { useState, useEffect, useRef } from 'react';
import { X, Check, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  createTariff,
  updateTariff,
  useTariffTypes,
  type CreateTariffPayload,
} from '../hooks/useTariffs';
import { useTariffFacilities } from '../hooks/useTariffFacilities';
import { createFacility, updateFacility, deleteFacility, type FacilityUpdatePayload } from '../hooks/useTariffFacilityMutations';
import { usePermissions } from '@/hooks/usePermissions';
import type { Tariff, TariffFacility } from '@/types/tariffs';

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT      = 'w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400';
const INPUT_RO   = 'w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-4 py-2.5 text-sm text-Color-Grey-Grey-500 outline-none cursor-default select-none';
const LABEL      = 'block text-xs font-medium text-Color-Grey-Grey-600 mb-1.5';

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        on ? 'bg-Color-Primary-Primary' : 'bg-Color-Grey-Grey-400'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string; description: string; key: string; tariff_types_id: string;
  color: string; amount: string; over_limit_amount: string;
  swap_count: string; free_swap_count: string; daily_swap_limit: string;
  base_tariff: boolean;
}

const EMPTY: FormState = {
  name: '', description: '', key: '', tariff_types_id: '',
  color: '#D1F22D', amount: '', over_limit_amount: '',
  swap_count: '', free_swap_count: '', daily_swap_limit: '',
  base_tariff: false,
};

function fromTariff(t: Tariff): FormState {
  return {
    name: t.name, description: t.description ?? '', key: t.key,
    tariff_types_id: t.tariff_types_id ?? '', color: t.color || '#D1F22D',
    amount: String(t.amount), over_limit_amount: String(t.over_limit_amount),
    swap_count: String(t.swap_count), free_swap_count: String(t.free_swap_count ?? 0),
    daily_swap_limit: String(t.daily_swap_limit), base_tariff: t.base_tariff,
  };
}

const PALETTE = ['#D1F22D', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#64748B'];

// ─── Facilities ───────────────────────────────────────────────────────────────

const LANGS: { key: keyof TariffFacility; formKey: keyof FacilityUpdatePayload; label: string; flag: string }[] = [
  { key: 'description_uz', formKey: 'description_uz', label: "O'zbek",  flag: '🇺🇿' },
  { key: 'description_ru', formKey: 'description_ru', label: 'Русский', flag: '🇷🇺' },
  { key: 'description_en', formKey: 'description_en', label: 'English', flag: '🇬🇧' },
];

function FacilityRow({
  facility, tariffId, editMode, canEdit, canDel,
  saveTick, onSaved, onDeleted,
}: {
  facility:  TariffFacility;
  tariffId:  string;
  editMode:  boolean;
  canEdit:   boolean;
  canDel:    boolean;
  saveTick:  number;
  onSaved:   () => void;
  onDeleted: () => void;
}) {
  const [form,       setForm]       = useState<FacilityUpdatePayload>({
    description_uz: facility.description_uz ?? '',
    description_ru: facility.description_ru ?? '',
    description_en: facility.description_en ?? '',
  });

  const [saveErr,    setSaveErr]    = useState<string | null>(null);
  const [saved,      setSaved]      = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const handleSave = async () => {
    setSaveErr(null);
    try {
      await updateFacility(facility.guid, tariffId, form);
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved(); }, 800);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally { }
  };

  // Fire save when footer button increments the tick
  const prevTick = useRef(saveTick);
  useEffect(() => {
    if (saveTick === prevTick.current) return;
    prevTick.current = saveTick;
    handleSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTick]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFacility(facility.guid);
      onDeleted();
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "O'chirishda xatolik");
      setConfirmDel(false);
    } finally { setDeleting(false); }
  };

  const borderCls = saved
    ? 'border-Color-Success-Success bg-Color-Success-Success-Soft'
    : 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50';

  // ── Edit mode ──
  if (editMode && canEdit) {
    return (
      <div className={`rounded-xl border p-4 transition-colors ${borderCls}`}>
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {LANGS.map(({ formKey, label, flag }) => (
                <div key={formKey}>
                  <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
                    <span>{flag}</span> {label}
                  </label>
                  <input type="text" value={form[formKey]}
                    onChange={(e) => setForm((p) => ({ ...p, [formKey]: e.target.value }))}
                    className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400" />
                </div>
              ))}
            </div>

            {saveErr && <p className="text-xs text-Color-Danger-Danger-Accent">{saveErr}</p>}

            {canDel && (
              <div className="flex items-center">
                {confirmDel ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-Color-Grey-Grey-600">O'chirilsinmi?</span>
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="rounded-lg bg-Color-Danger-Danger-Soft px-3 py-1 font-semibold text-Color-Danger-Danger-Accent hover:bg-red-100 disabled:opacity-50">
                      {deleting ? "O'chirilmoqda…" : 'Ha'}
                    </button>
                    <button type="button" onClick={() => setConfirmDel(false)}
                      className="rounded-lg border border-Color-Grey-Grey-200 px-3 py-1 font-semibold text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-50">
                      Yo'q
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDel(true)}
                    className="rounded-lg border border-Color-Grey-Grey-200 p-1.5 text-Color-Grey-Grey-500 transition-colors hover:border-red-300 hover:text-Color-Danger-Danger-Accent">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    );
  }

  // ── View mode ──
  return (
    <div className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 p-4">
      <div className="grid grid-cols-3 gap-4">
        {LANGS.map(({ key, label, flag }) => {
          const value = (facility[key] ?? null) as string | null;
          return (
            <div key={String(key)}>
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
                <span>{flag}</span> {label}
              </p>
              {value ? <p className="text-sm font-medium text-Color-Grey-Grey-950">{value}</p>
                     : <p className="text-sm text-Color-Grey-Grey-500">—</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewFacilityRow({ tariffId, onSaved, onCancel }: {
  tariffId: string; onSaved: () => void; onCancel: () => void;
}) {
  const [form,   setForm]   = useState<FacilityUpdatePayload>({ description_uz: '', description_ru: '', description_en: '' });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setErr(null);
    try { await createFacility(tariffId, form); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik yuz berdi'); }
    finally   { setSaving(false); }
  };

  return (
    <div className="rounded-xl border border-Color-Primary-Primary bg-Color-Primary-Primary/10 p-4">
      <div className="grid grid-cols-3 gap-4">
        {LANGS.map(({ formKey, label, flag }) => (
          <div key={formKey}>
            <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              <span>{flag}</span> {label}
            </label>
            <input type="text" autoFocus={formKey === 'description_uz'}
              value={form[formKey]} onChange={(e) => setForm((p) => ({ ...p, [formKey]: e.target.value }))}
              placeholder="..." className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400" />
          </div>
        ))}
      </div>
      {err && <p className="mt-2 text-xs text-Color-Danger-Danger-Accent">{err}</p>}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={saving}
          className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-1.5 text-xs font-semibold text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-50 disabled:opacity-50">
          Bekor
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-Color-Primary-Primary px-4 py-1.5 text-xs font-bold text-Color-Dark-Constant-Dark hover:opacity-90 disabled:opacity-50">
          {saving
            ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" /> Saqlanmoqda…</>
            : <><Check className="h-3 w-3" /> Qo'shish</>}
        </button>
      </div>
    </div>
  );
}

function FacilitiesTab({ tariffId, editMode, saveTick }: { tariffId: string; editMode: boolean; saveTick: number }) {
  const { canWrite, canUpdate, canDelete } = usePermissions();
  const [tick, setTick]                = useState(0);
  const [adding, setAdding]            = useState(false);
  const { facilities, loading, error } = useTariffFacilities(tariffId, tick);

  const refetch = () => setTick((n) => n + 1);

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-Color-Danger-Danger-Accent">
        <AlertCircle className="h-4 w-4 shrink-0" />{error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 p-4">
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-14 animate-pulse rounded bg-Color-Grey-Grey-200" />
                  <div className="h-4 w-28 animate-pulse rounded bg-Color-Grey-Grey-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const canEdit = canUpdate('tariff_facilities');
  const canDel  = canDelete('tariff_facilities');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-Color-Grey-Grey-600">{facilities.length} ta imkoniyat</p>
        {editMode && canWrite('tariff_facilities') && !adding && (
          <button type="button" onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-Color-Grey-Grey-200 px-3 py-1.5 text-xs font-semibold text-Color-Grey-Grey-700 transition-colors hover:border-Color-Primary-Primary hover:text-Color-Primary-Primary">
            <Plus className="h-3.5 w-3.5" /> Qo'shish
          </button>
        )}
      </div>

      {facilities.map((f) => (
        <FacilityRow
          key={f.guid}
          facility={f}
          tariffId={tariffId}
          editMode={editMode}
          canEdit={canEdit}
          canDel={canDel}
          saveTick={saveTick}
          onSaved={refetch}
          onDeleted={refetch}
        />
      ))}

      {adding && (
        <NewFacilityRow
          tariffId={tariffId}
          onSaved={() => { setAdding(false); refetch(); }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'facilities';

interface Props {
  tariff?:   Tariff | null;
  viewOnly?: boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

export function TariffFormModal({ tariff, viewOnly = false, onClose, onSuccess }: Props) {
  const isEdit = Boolean(tariff);

  const [tab,          setTab]          = useState<Tab>('info');
  const [form,         setForm]         = useState<FormState>(() => tariff ? fromTariff(tariff) : EMPTY);
  const [loading,      setLoading]      = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [facilityTick, setFacilityTick] = useState(0);

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
  const accent     = isValidHex ? form.color : '#D1F22D';

  const canSubmit = form.name.trim() !== '' && form.key.trim() !== '' && form.amount !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || viewOnly) return;
    setLoading(true);
    setError(null);
    const payload: CreateTariffPayload = {
      name: form.name.trim(), description: form.description.trim(),
      key: form.key.trim().toLowerCase(), color: isValidHex ? form.color : '#D1F22D',
      tariff_types_id: form.tariff_types_id.trim(), base_tariff: form.base_tariff,
      amount: Number(form.amount) || 0, over_limit_amount: Number(form.over_limit_amount) || 0,
      swap_count: Number(form.swap_count) || 0, free_swap_count: Number(form.free_swap_count) || 0,
      daily_swap_limit: Number(form.daily_swap_limit) || 0,
    };
    try {
      if (isEdit && tariff) { await updateTariff({ ...payload, guid: tariff.guid }); }
      else                  { await createTariff(payload); }
      setSaved(true);
      setTimeout(() => { onSuccess(); onClose(); }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const inp = (extra = '') => viewOnly ? `${INPUT_RO} ${extra}` : `${INPUT} ${extra}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-Color-Grey-Grey-950">
              {viewOnly ? tariff?.name : isEdit ? 'Tarifni tahrirlash' : "Yangi tarif qo'shish"}
            </h2>
            <p className="mt-0.5 text-xs text-Color-Grey-Grey-600">
              {viewOnly ? `Kalit: ${tariff?.key}` : isEdit ? `Kalit: ${tariff?.key}` : "Barcha majburiy maydonlarni to'ldiring"}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar — only when viewing/editing an existing tariff */}
        {isEdit && (
          <div className="flex shrink-0 border-b border-Color-Grey-Grey-200">
            {(['info', 'facilities'] as Tab[]).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
                  tab === t ? 'text-Color-Grey-Grey-950' : 'text-Color-Grey-Grey-500 hover:text-Color-Grey-Grey-700'
                }`}>
                {t === 'info' ? "Ma'lumotlar" : 'Imkoniyatlar'}
                {tab === t && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                    style={{ backgroundColor: accent }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        {tab === 'info' ? (
          <form id="tariff-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="space-y-5 p-6">

              <div>
                <label className={LABEL}>Tarif nomi {!viewOnly && <span className="text-red-500">*</span>}</label>
                <input type="text" value={form.name} readOnly={viewOnly}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Masalan: Oylik Pro" className={inp()} />
              </div>

              <div>
                <label className={LABEL}>Tavsif</label>
                <textarea value={form.description} readOnly={viewOnly}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3} placeholder="Tarif haqida qisqacha ma'lumot..."
                  className={`${inp()} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Kalit (slug) {!viewOnly && <span className="text-red-500">*</span>}</label>
                  <input type="text" value={form.key} readOnly={viewOnly}
                    onChange={(e) => set('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="premium_monthly" className={inp('font-mono')} />
                </div>
                <div>
                  <label className={LABEL}>Tarif turi</label>
                  {typesLoading ? (
                    <div className="flex h-[42px] items-center gap-2 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4">
                      <Loader2 className="h-4 w-4 animate-spin text-Color-Grey-Grey-500" />
                      <span className="text-sm text-Color-Grey-Grey-500">Yuklanmoqda…</span>
                    </div>
                  ) : viewOnly ? (
                    <div className={INPUT_RO}>
                      {tariffTypes.find((t) => t.guid === form.tariff_types_id)?.name ?? '—'}
                    </div>
                  ) : (
                    <select value={form.tariff_types_id}
                      onChange={(e) => set('tariff_types_id', e.target.value)} className={INPUT}>
                      <option value="" className="bg-Color-Light-Light">— Tanlang —</option>
                      {tariffTypes.map((t) => (
                        <option key={t.guid} value={t.guid} className="bg-Color-Light-Light">
                          {t.name}{t.day_count ? ` (${t.day_count} kun)` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Narxi (UZS) {!viewOnly && <span className="text-red-500">*</span>}</label>
                  <input type={viewOnly ? 'text' : 'number'} min={0} value={form.amount} readOnly={viewOnly}
                    onChange={(e) => set('amount', e.target.value)} placeholder="999000" className={inp()} />
                </div>
                <div>
                  <label className={LABEL}>Limit oshganda narxi (UZS)</label>
                  <input type={viewOnly ? 'text' : 'number'} min={0} value={form.over_limit_amount} readOnly={viewOnly}
                    onChange={(e) => set('over_limit_amount', e.target.value)} placeholder="30000" className={inp()} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL}>Almashtirish soni</label>
                  <input type={viewOnly ? 'text' : 'number'} min={0} value={form.swap_count} readOnly={viewOnly}
                    onChange={(e) => set('swap_count', e.target.value)} placeholder="60" className={inp()} />
                </div>
                <div>
                  <label className={LABEL}>Bepul almashtirishlar</label>
                  <input type={viewOnly ? 'text' : 'number'} min={0} value={form.free_swap_count} readOnly={viewOnly}
                    onChange={(e) => set('free_swap_count', e.target.value)} placeholder="5" className={inp()} />
                </div>
                <div>
                  <label className={LABEL}>Kunlik limit</label>
                  <input type={viewOnly ? 'text' : 'number'} min={0} value={form.daily_swap_limit} readOnly={viewOnly}
                    onChange={(e) => set('daily_swap_limit', e.target.value)} placeholder="3" className={inp()} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Rang</label>
                  {viewOnly ? (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg border border-Color-Grey-Grey-200"
                        style={{ backgroundColor: isValidHex ? form.color : '#D1F22D' }} />
                      <span className="font-mono text-sm text-Color-Grey-Grey-600">{form.color}</span>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex flex-wrap gap-2">
                        {PALETTE.map((hex) => (
                          <button key={hex} type="button" onClick={() => set('color', hex)}
                            className="h-6 w-6 rounded-lg border-2 transition-transform hover:scale-110"
                            style={{ backgroundColor: hex, borderColor: form.color === hex ? '#fff' : 'transparent' }} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative h-[42px] w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-Color-Grey-Grey-200"
                          style={{ backgroundColor: isValidHex ? form.color : '#D1F22D' }}>
                          <input type="color" value={isValidHex ? form.color : '#D1F22D'}
                            onChange={(e) => set('color', e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                        </div>
                        <input type="text" value={form.color} onChange={(e) => set('color', e.target.value)}
                          maxLength={7} placeholder="#D1F22D" className={`${INPUT} font-mono`} />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-between rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-Color-Grey-Grey-950">Asosiy tarif</p>
                      <p className="text-xs text-Color-Grey-Grey-600">Yangi foydalanuvchilarga tayinlanadi</p>
                    </div>
                    <Toggle on={form.base_tariff} onChange={() => set('base_tariff', !form.base_tariff)}
                      disabled={viewOnly} />
                  </div>
                </div>
              </div>

            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <FacilitiesTab tariffId={tariff!.guid} editMode={!viewOnly} saveTick={facilityTick} />
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-Color-Grey-Grey-200 px-6 py-4">
          {error ? <p className="text-xs text-Color-Danger-Danger-Accent">{error}</p> : <span />}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} disabled={loading}
              className="rounded-xl border border-Color-Grey-Grey-200 px-6 py-2.5 text-sm font-semibold text-Color-Grey-Grey-700 transition-colors hover:bg-Color-Grey-Grey-50 disabled:opacity-50">
              {viewOnly ? 'Yopish' : 'Bekor qilish'}
            </button>
            {!viewOnly && tab === 'info' && (
              <button type="submit" form="tariff-form" disabled={loading || saved || !canSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-Color-Primary-Primary px-6 py-2.5 text-sm font-bold text-Color-Dark-Constant-Dark transition-opacity hover:opacity-90 disabled:opacity-50">
                {saved   ? <><Check className="h-4 w-4" /> Saqlandi!</>
               : loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> Saqlanmoqda…</>
               : isEdit  ? 'Saqlash'
               :           'Tarifni yaratish'}
              </button>
            )}
            {!viewOnly && tab === 'facilities' && (
              <button type="button" onClick={() => setFacilityTick((n) => n + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-Color-Primary-Primary px-6 py-2.5 text-sm font-bold text-Color-Dark-Constant-Dark transition-opacity hover:opacity-90">
                Saqlash
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
