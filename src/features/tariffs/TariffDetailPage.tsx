import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tag, AlertCircle } from 'lucide-react';
import TariffForm, { type TariffFormValues } from './components/TariffForm';
import { useTariffFacilities } from './hooks/useTariffFacilities';
import type { Tariff, TariffFacility } from '@/types/tariffs';

// ─── Facility row ─────────────────────────────────────────────────────────────

const LANGS: { key: keyof TariffFacility; label: string; flag: string }[] = [
  { key: 'description_uz', label: "O'zbek",  flag: '🇺🇿' },
  { key: 'description_ru', label: 'Русский', flag: '🇷🇺' },
  { key: 'description_en', label: 'English', flag: '🇬🇧' },
];

function FacilityRow({ facility }: { facility: TariffFacility }) {
  return (
    <div className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 p-4">
      <div className="grid grid-cols-3 gap-4">
        {LANGS.map(({ key, label, flag }) => {
          const value = (facility[key] ?? facility.name ?? null) as string | null;
          return (
            <div key={key}>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
                <span>{flag}</span>
                {label}
              </p>
              {value
                ? <p className="text-sm font-medium text-Color-Grey-Grey-950">{value}</p>
                : <p className="text-sm text-Color-Grey-Grey-500">—</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Facilities tab content ───────────────────────────────────────────────────

function FacilitiesTab({ tariffId }: { tariffId: string }) {
  const { facilities, loading, error } = useTariffFacilities(tariffId);

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-Color-Danger-Danger-Accent">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 p-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-Color-Grey-Grey-200" />
                  <div className="h-4 w-32 animate-pulse rounded bg-Color-Grey-Grey-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-Color-Grey-Grey-500">
        <p className="text-sm">Imkoniyatlar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-Color-Grey-Grey-600">{facilities.length} ta imkoniyat</p>
      {facilities.map((f) => (
        <FacilityRow key={f.guid} facility={f} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'facilities';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',       label: "Ma'lumotlar"   },
  { id: 'facilities', label: 'Imkoniyatlar'  },
];

export default function TariffDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tariff   = (location.state as { tariff?: Tariff } | null)?.tariff ?? null;
  const [tab, setTab] = useState<Tab>('info');

  const handleSave = (values: TariffFormValues) => {
    console.log('[TariffDetailPage] updated payload:', values);
    // PUT request will be wired here
  };

  if (!tariff) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-Color-Grey-Grey-600">Tarif ma'lumotlari topilmadi</p>
        <button
          onClick={() => navigate('/payments/tariffs')}
          className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-medium text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-50"
        >
          Tariflar ro'yxatiga qaytish
        </button>
      </div>
    );
  }

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(tariff.color);
  const accent     = isValidHex ? tariff.color : '#d1f22d';
  const accentBg   = accent + '1A';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: accentBg }}>
          <Tag className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">{tariff.name}</h1>
            {tariff.base_tariff && (
              <span className="inline-flex items-center rounded-full border border-Color-Primary-Primary bg-Color-Primary-Primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-Color-Primary-Primary">
                Asosiy
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-sm text-Color-Grey-Grey-600">{tariff.key}</p>
        </div>
      </div>

      {/* Tabbed card */}
      <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        {/* Tab bar */}
        <div className="flex border-b border-Color-Grey-Grey-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-6 py-4 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'text-Color-Grey-Grey-950'
                  : 'text-Color-Grey-Grey-500 hover:text-Color-Grey-Grey-700'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                  style={{ backgroundColor: accent }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="p-6">
          {tab === 'info' && (
            <TariffForm
              initial={tariff}
              onSave={handleSave}
              onCancel={() => navigate('/payments/tariffs')}
            />
          )}
          {tab === 'facilities' && (
            <FacilitiesTab tariffId={tariff.guid} />
          )}
        </div>
      </div>
    </div>
  );
}