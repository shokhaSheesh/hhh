import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { createTariffType } from '@/features/tariffs/hooks/useTariffs';

const INPUT = 'w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400';
const LABEL = 'block text-xs font-medium text-Color-Grey-Grey-600 mb-1.5';

interface Props {
  onClose:   () => void;
  onSuccess: () => void;
}

export function TariffTypeFormModal({ onClose, onSuccess }: Props) {
  const [name,     setName]     = useState('');
  const [dayCount, setDayCount] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const canSubmit = name.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await createTariffType(name.trim(), Number(dayCount) || 0);
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

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Yangi tarif turi</h2>
            <p className="mt-0.5 text-xs text-Color-Grey-Grey-600">Nomi va davomiyligini kiriting</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form id="tariff-type-form" onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className={LABEL}>
              Nomi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Oylik, Haftalik, Cheksiz"
              className={INPUT}
              autoFocus
            />
          </div>

          <div>
            <label className={LABEL}>Davomiyligi (kunlar)</label>
            <input
              type="number"
              min={0}
              value={dayCount}
              onChange={(e) => setDayCount(e.target.value)}
              placeholder="0 — cheksiz uchun"
              className={INPUT}
            />
            <p className="mt-1.5 text-xs text-Color-Grey-Grey-500">0 kiriting — cheksiz muddatli tarif uchun</p>
          </div>

          {error && (
            <div className="rounded-xl border border-Color-Danger-Danger-Accent bg-Color-Danger-Danger-Soft px-4 py-2.5 text-xs text-Color-Danger-Danger-Accent">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-Color-Grey-Grey-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-Color-Grey-Grey-200 px-5 py-2.5 text-sm font-semibold text-Color-Grey-Grey-700 transition-colors hover:bg-Color-Grey-Grey-50 disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="tariff-type-form"
            disabled={loading || saved || !canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-Color-Primary-Primary px-6 py-2.5 text-sm font-bold text-Color-Dark-Constant-Dark transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saved ? (
              <><Check className="h-4 w-4" /> Saqlandi!</>
            ) : loading ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-Color-Dark-Constant-Dark border-t-transparent" /> Saqlanmoqda…</>
            ) : (
              'Yaratish'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
