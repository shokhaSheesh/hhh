import { useEffect } from 'react';
import { X, MapPin, Clock, Wifi, WifiOff, Plus, ImageOff } from 'lucide-react';
import type { Station } from '@/types/stations';
import type { PortBinding } from '@/types/portBindings';
import { useStationPorts } from '../hooks/useStationPorts';

interface Props {
  station: Station;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dark-border/60 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-white">{value}</span>
    </div>
  );
}

// ─── Port cell ────────────────────────────────────────────────────────────────

const CELL_H = 80;

// Static wave path: 2 quadratic-bezier cycles across 56 px, fills to bottom.
// Positioned at top: -8 inside the fill div so it merges seamlessly with the solid fill.
const WAVE_PATH = 'M0,4 Q7,0 14,4 Q21,8 28,4 Q35,0 42,4 Q49,8 56,4 L56,8 L0,8 Z';

function PortBadge({ port }: { port: number }) {
  return (
    <div className="flex w-5 items-center justify-center rounded-full bg-white/20 px-1 py-0.5">
      <span className="text-[10px] font-semibold leading-none text-white">{port}</span>
    </div>
  );
}

function PortCell({ binding }: { binding: PortBinding }) {
  const battery = binding.batteries_id_data;

  /* ── disabled ── */
  if (!binding.enabled_status) {
    return (
      <div
        className="relative w-14 overflow-hidden rounded-xl border border-gray-800 bg-dark-surface opacity-40"
        style={{ height: CELL_H }}
      >
        <div className="absolute left-[10px] top-4 flex w-9 flex-col items-center gap-2">
          <PortBadge port={binding.port} />
          <span className="text-sm font-semibold text-gray-700">—</span>
        </div>
      </div>
    );
  }

  /* ── empty ── */
  if (!battery) {
    return (
      <div
        className="relative w-14 overflow-hidden rounded-xl border border-dashed border-gray-700 bg-dark-surface"
        style={{ height: CELL_H }}
      >
        <div className="absolute left-[10px] top-4 flex w-9 flex-col items-center gap-2">
          <PortBadge port={binding.port} />
          <span className="text-sm font-semibold text-gray-600">—</span>
        </div>
      </div>
    );
  }

  /* ── occupied ── */
  const soc       = Math.min(100, Math.max(0, battery.soc ?? 0));
  const soh       = battery.soh ?? 0;
  const fillH     = (soc / 100) * CELL_H;
  const fillTop   = CELL_H - fillH;
  const fillColor = soc > 80 ? '#22c55e' : soc >= 30 ? '#eab308' : '#ef4444';

  return (
    /* group wrapper has NO overflow so the tooltip can escape the cell */
    <div className="group relative">

      {/* ── visual cell (overflow-hidden for wave clipping) ── */}
      <div
        className="relative w-14 cursor-default overflow-hidden rounded-xl border border-gray-700/50 bg-dark-surface"
        style={{ height: CELL_H }}
      >
        {/* liquid fill */}
        <div
          className="absolute left-0 right-0"
          style={{ top: fillTop, height: fillH, backgroundColor: fillColor, opacity: 0.75 }}
        >
          {/* static wave on top edge */}
          <svg
            className="absolute left-0 w-full"
            style={{ top: -8, fill: fillColor }}
            height={8}
            viewBox="0 0 56 8"
            preserveAspectRatio="none"
          >
            <path d={WAVE_PATH} />
          </svg>
        </div>

        {/* port number + SOC overlay */}
        <div className="absolute left-[10px] top-4 z-10 flex w-9 flex-col items-center gap-1.5">
          <PortBadge port={binding.port} />
          <span className="text-sm font-semibold leading-none text-white">{soc}%</span>
        </div>
      </div>

      {/* ── hover tooltip (sibling — not inside overflow-hidden cell) ── */}
      <div
        className={[
          'pointer-events-none absolute left-full top-1/2 z-[60] ml-2',
          'w-max min-w-max -translate-y-1/2 rounded-lg border border-gray-700 bg-[#16161D] p-3 shadow-xl',
          'opacity-0 invisible transition-all duration-150',
          'group-hover:visible group-hover:opacity-100',
        ].join(' ')}
      >
        <p className="mb-2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Port {binding.port}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">SN</span>
            <span className="whitespace-nowrap font-mono text-[10px] text-white">
              {battery.battery_sn || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">Quvvat</span>
            <span className="text-sm font-semibold" style={{ color: fillColor }}>{soc}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">Sog'lomligi</span>
            <span className="text-sm font-semibold text-white">{soh}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PortSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-14 animate-pulse rounded-xl bg-gray-800/60"
          style={{ height: CELL_H }}
        />
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function StationDetailModal({ station, onClose }: Props) {
  const { ports, loading: portsLoading } = useStationPorts(station.guid);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const isOnline     = station.online_status[0] === 'online';
  const name         = station.device_name || station.device_code;
  const photos       = Array.isArray(station.photo) && station.photo.length > 0 ? station.photo : [];
  const placeholders = Array.from({ length: Math.max(0, 4 - photos.length) });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 flex w-full max-w-[960px] max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">

        {/* ── Modal header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-dark-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isOnline ? 'bg-emerald-500/15' : 'bg-gray-800'}`}>
              {isOnline
                ? <Wifi className="h-4 w-4 text-emerald-400" />
                : <WifiOff className="h-4 w-4 text-gray-500" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Stansiya tafsilotlari: <span className="text-[#D1F22D]">{name}</span>
              </h2>
              <p className="text-xs text-gray-500">{station.device_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body: single scroll container so tooltips are never clipped ── */}
        <div className="flex min-h-0 flex-1 overflow-y-auto">

          {/* ── Left: battery port grid ── */}
          <div className="flex w-[300px] shrink-0 flex-col border-r border-dark-border">
            {/* sticky so port count label stays visible while body scrolls */}
            <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-dark-border/60 bg-dark-surface px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Portlar</h3>
              <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                {station.port_num ?? ports.length} ta
              </span>
            </div>

            {/* Grid — no overflow so tooltip siblings can escape the cell bounds */}
            <div className="p-4">
              {portsLoading ? (
                <PortSkeleton count={station.port_num || 6} />
              ) : ports.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {ports.map((p) => (
                    <PortCell key={p.guid || p.port} binding={p} />
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-xs text-gray-600">Port ma'lumoti topilmadi</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: station info + photo gallery ── */}
          <div className="flex flex-1 flex-col">

            {/* Station info */}
            <div className="border-b border-dark-border px-6 py-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Stansiya ma'lumotlari</h3>
              <InfoRow label="Holati" value={
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  isOnline
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-700 bg-gray-800 text-gray-500'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              } />
              <InfoRow label="Nomi"         value={station.device_name          || '—'} />
              <InfoRow label="Kirill nomi"  value={station.device_name_cyrillic || '—'} />
              <InfoRow label="Manzil"       value={
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0 text-gray-500" />
                  {station.device_location || station.address || '—'}
                </span>
              } />
              <InfoRow label="Shahar"    value={station.city     || '—'} />
              <InfoRow label="Viloyat"   value={station.province || '—'} />
              <InfoRow label="Ish vaqti" value={
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0 text-gray-500" />
                  {station.business_hours || '—'}
                </span>
              } />
              <InfoRow label="Port soni"  value={station.port_num ?? '—'} />
              <InfoRow label="Koordinata" value={
                station.location && station.location !== ',' ? (
                  <a
                    href={`https://maps.google.com/?q=${station.location}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-400 hover:underline"
                  >
                    {station.location}
                  </a>
                ) : '—'
              } />
              <InfoRow label="Yaratilgan"  value={<span className="font-mono text-xs">{fmtDate(station.created_at)}</span>} />
              <InfoRow label="Yangilangan" value={<span className="font-mono text-xs">{fmtDate(station.updated_at)}</span>} />
            </div>

            {/* Photo gallery */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Stansiya rasmlari</h3>
                <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#D1F22D] px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90">
                  <Plus className="h-3.5 w-3.5" />
                  Rasm qo'shish
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {photos.map((url, i) => (
                  <div key={i} className="group/photo relative aspect-[4/3] overflow-hidden rounded-xl border border-dark-border">
                    <img
                      src={url}
                      alt={`Rasm ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/photo:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover/photo:bg-black/20" />
                  </div>
                ))}
                {placeholders.map((_, i) => (
                  <div
                    key={`ph-${i}`}
                    className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 bg-gray-900/40 text-gray-600 transition-colors hover:border-gray-600 hover:bg-gray-900/60"
                  >
                    <ImageOff className="h-6 w-6" />
                    <span className="text-xs">Rasm {photos.length + i + 1}</span>
                  </div>
                ))}
              </div>

              {photos.length === 0 && (
                <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-700 bg-gray-900/30 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-gray-800">
                    <Plus className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Rasm yuklash</p>
                    <p className="mt-0.5 text-xs text-gray-600">PNG, JPG, WEBP · max 5 MB</p>
                  </div>
                  <button className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700">
                    Fayl tanlash
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
