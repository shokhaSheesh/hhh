import { useState, useEffect } from 'react';
import { X, Ticket } from 'lucide-react';
import PromocodeForm, { type PromocodeFormValues, buildPayload } from './components/PromocodeForm';
import { createPromocode, updatePromocode } from './hooks/usePromocodes';
import type { Promocode } from '@/types/promocodes';

interface Props {
  initial?:   Promocode | null;
  onClose:    () => void;
  onSuccess?: () => void;
}

export default function PromocodeModal({ initial, onClose, onSuccess }: Props) {
  const isEdit = Boolean(initial);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSave = async (values: PromocodeFormValues) => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit && initial) {
        await updatePromocode(initial.guid, buildPayload(values));
      } else {
        await createPromocode(buildPayload(values));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-Color-Primary-Primary/10">
              <Ticket className="h-4 w-4 text-Color-Primary-Primary" />
            </div>
            <h2 className="text-base font-semibold text-Color-Grey-Grey-950">
              {isEdit ? 'Promokodni tahrirlash' : "Promokod qo'shish"}
            </h2>
          </div>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <p className="mb-4 rounded-xl bg-Color-Danger-Danger-Soft px-4 py-2.5 text-sm text-Color-Danger-Danger-Accent">{error}</p>}
          <PromocodeForm
            initial={initial}
            onSave={handleSave}
            onCancel={onClose}
            saveLabel={saving ? 'Saqlanmoqda…' : isEdit ? 'Saqlash' : "Promokodni qo'shish"}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}
