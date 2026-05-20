import { useLocation, useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import TariffForm, { type TariffFormValues } from './components/TariffForm';
import type { Tariff } from '@/types/tariffs';

export default function TariffDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tariff   = (location.state as { tariff?: Tariff } | null)?.tariff ?? null;

  const handleSave = (values: TariffFormValues) => {
    console.log('[TariffDetailPage] updated payload:', values);
    // PUT request will be wired here
  };

  if (!tariff) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-500">Tarif ma'lumotlari topilmadi</p>
        <button
          onClick={() => navigate('/payments/tariffs')}
          className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5"
        >
          Tariflar ro'yxatiga qaytish
        </button>
      </div>
    );
  }

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(tariff.color);
  const accentBg   = isValidHex ? tariff.color + '1A' : 'rgba(209,242,45,0.1)';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: accentBg }}
        >
          <Tag className="h-5 w-5" style={{ color: tariff.color }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{tariff.name}</h1>
            {tariff.base_tariff && (
              <span className="inline-flex items-center rounded-full border border-brand-lime/30 bg-brand-lime/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-lime">
                Asosiy
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-sm text-gray-400">{tariff.key}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Tarif ma'lumotlari</h2>
        </div>
        <div className="p-6">
          <TariffForm
            initial={tariff}
            onSave={handleSave}
            onCancel={() => navigate('/payments/tariffs')}
          />
        </div>
      </div>
    </div>
  );
}
