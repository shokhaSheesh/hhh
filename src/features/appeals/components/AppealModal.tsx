import { useState, useEffect } from 'react';
import { X, User, Phone, Hash, MessageSquare, Calendar, Clock } from 'lucide-react';
import type { Appeal, AppealStatus } from '@/types/appeals';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppealStatus, { label: string; dot: string; badge: string }> = {
  new:         { label: 'Yangi',        dot: 'bg-orange-400',  badge: 'border-orange-500/30 bg-orange-500/10 text-orange-400'    },
  in_progress: { label: 'Jarayonda',    dot: 'bg-amber-400',   badge: 'border-amber-500/30  bg-amber-500/10  text-amber-400'     },
  solved:      { label: 'Hal qilingan', dot: 'bg-emerald-400', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  closed:      { label: 'Yopilgan',     dot: 'bg-gray-500',    badge: 'border-gray-700 bg-gray-800 text-gray-500'                },
};

const ALL_STATUSES: AppealStatus[] = ['new', 'in_progress', 'solved', 'closed'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-dark-border/60 py-3 last:border-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-800">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-0.5 break-all text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function AppealModal({ appeal, onClose }: { appeal: Appeal; onClose: () => void }) {
  const currentStatus = (appeal.status[0] ?? 'new') as AppealStatus;
  const [status, setStatus] = useState<AppealStatus>(currentStatus);
  const cfg = STATUS_CONFIG[status];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => {
    console.log('[AppealModal] status update payload:', {
      guid:   appeal.guid,
      status: [status],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        className="relative flex w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl"
        style={{ maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-dark-border px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">
              Murojaat{' '}
              <span className="font-mono text-gray-400">#{appeal.guid.slice(-8).toUpperCase()}</span>
            </h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left panel — user info + message */}
          <div className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-r border-dark-border">
            {/* Avatar + name */}
            <div className="border-b border-dark-border p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lime/10 text-base font-bold text-brand-lime">
                  {initials(appeal.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold capitalize text-white">
                    {appeal.name.toLowerCase()}
                  </p>
                  <p className="font-mono text-xs text-gray-400">{appeal.phone}</p>
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="px-5">
              <InfoRow icon={User}  label="To'liq ism"  value={appeal.name} />
              <InfoRow icon={Phone} label="Telefon"     value={appeal.phone} />
              <InfoRow icon={Hash}  label="Murojaat ID" value={
                <span className="font-mono text-xs">{appeal.guid}</span>
              } />
              <InfoRow icon={Calendar} label="Yaratilgan"  value={fmtDate(appeal.created_at)} />
              <InfoRow icon={Clock}    label="Yangilangan" value={fmtDate(appeal.updated_at)} />
            </div>
          </div>

          {/* Right panel — message + status */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Message */}
            <div className="border-b border-dark-border p-5">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-white">Murojaat matni</h3>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                {appeal.description || <span className="italic text-gray-600">Matn yo'q</span>}
              </p>
            </div>

            {/* Status management */}
            <div className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Holat boshqaruvi</h3>

              {/* Current badge */}
              <div className="mb-3 flex items-center justify-between rounded-xl bg-gray-900/50 px-4 py-3">
                <span className="text-xs text-gray-500">Joriy holat</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>

              {/* Status buttons */}
              <div className="space-y-2">
                {ALL_STATUSES.map((s) => {
                  const c      = STATUS_CONFIG[s];
                  const active = s === status;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'border-brand-lime/30 bg-brand-lime/10 text-white'
                          : 'border-dark-border bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
                      {c.label}
                      {active && (
                        <span className="ml-auto rounded-full bg-brand-lime/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-lime">
                          Joriy
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSave}
                className="mt-3 w-full rounded-xl bg-brand-lime py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
