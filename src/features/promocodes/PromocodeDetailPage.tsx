import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Ticket, Trash2 } from 'lucide-react';
import PromocodeForm, { type PromocodeFormValues, buildPayload } from './components/PromocodeForm';
import { updatePromocode, deletePromocode } from './hooks/usePromocodes';
import { usePermissions } from '@/hooks/usePermissions';
import type { Promocode } from '@/types/promocodes';

export default function PromocodeDetailPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const promocode   = (location.state as { promocode?: Promocode } | null)?.promocode ?? null;
  const { canUpdate, canDelete } = usePermissions();

  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState<string | null>(null);
  const [saved,      setSaved]      = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const handleSave = async (values: PromocodeFormValues) => {
    if (!promocode) return;
    setSaving(true); setSaveErr(null);
    try {
      await updatePromocode(promocode.guid, buildPayload(values));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!promocode) return;
    setDeleting(true);
    try {
      await deletePromocode(promocode.guid);
      navigate('/payments/promo-codes');
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "O'chirishda xatolik");
      setConfirmDel(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!promocode) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-500">Promokod ma'lumotlari topilmadi</p>
        <button
          onClick={() => navigate('/payments/promo-codes')}
          className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5"
        >
          Orqaga
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/10">
            <Ticket className="h-5 w-5 text-brand-lime" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-semibold tracking-widest text-white">
                {promocode.key}
              </h1>
              {promocode.status ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Faol
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                  Nofaol
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-400">Promokod tafsilotlari</p>
          </div>
        </div>

        {canDelete('promocodes') && (
          confirmDel ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">O'chirilsinmi?</span>
              <button onClick={handleDelete} disabled={deleting}
                className="rounded-xl bg-red-500/20 px-4 py-2 font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-50">
                {deleting ? "O'chirilmoqda…" : 'Ha'}
              </button>
              <button onClick={() => setConfirmDel(false)}
                className="rounded-xl border border-gray-700 px-4 py-2 font-semibold text-gray-400 hover:bg-white/5">
                Yo'q
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)}
              className="group/del inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-400 transition-colors hover:border-red-500/50 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
              O'chirish
            </button>
          )
        )}
      </div>

      {/* Form card */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Ma'lumotlarni tahrirlash</h2>
        </div>
        <div className="p-6">
          {saveErr && (
            <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{saveErr}</p>
          )}
          <PromocodeForm
            initial={promocode}
            onSave={canUpdate('promocodes') ? handleSave : () => {}}
            onCancel={() => navigate('/payments/promo-codes')}
            saveLabel={saved ? 'Saqlandi!' : saving ? 'Saqlanmoqda…' : 'Saqlash'}
            saving={saving || saved}
          />
        </div>
      </div>
    </div>
  );
}
