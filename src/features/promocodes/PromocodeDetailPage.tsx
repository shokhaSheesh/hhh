import { useLocation, useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import PromocodeForm, { type PromocodeFormValues } from './components/PromocodeForm';
import type { Promocode } from '@/types/promocodes';

export default function PromocodeDetailPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const promocode = (location.state as { promocode?: Promocode } | null)?.promocode ?? null;

  const handleSave = (values: PromocodeFormValues) => {
    console.log('[PromocodeDetailPage] updated payload:', values);
    // PUT request will be wired here
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

      {/* Form card */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Ma'lumotlarni tahrirlash</h2>
        </div>
        <div className="p-6">
          <PromocodeForm
            initial={promocode}
            onSave={handleSave}
            onCancel={() => navigate('/payments/promo-codes')}
          />
        </div>
      </div>
    </div>
  );
}
