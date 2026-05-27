import { useState, useEffect } from 'react';
import { X, User, Phone, Hash, MessageSquare, Calendar, Clock, Check, Loader2 } from 'lucide-react';
import { updateAppealStatus } from '../hooks/useAppeals';
import type { Appeal, AppealStatus } from '@/types/appeals';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppealStatus, { label: string; dot: string; badge: string }> = {
  new:         { label: 'Yangi',        dot: 'bg-orange-400',          badge: 'border-Color-Warning-Warning bg-Color-Warning-Warning-Soft text-Color-Warning-Warning'   },
  in_progress: { label: 'Jarayonda',    dot: 'bg-amber-400',           badge: 'border-Color-Warning-Warning bg-Color-Warning-Warning-Soft text-Color-Warning-Warning'   },
  solved:      { label: 'Hal qilingan', dot: 'bg-emerald-400',         badge: 'border-Color-Success-Success bg-Color-Success-Success-Soft text-Color-Success-Success'   },
  closed:      { label: 'Yopilgan',     dot: 'bg-Color-Grey-Grey-400', badge: 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 text-Color-Grey-Grey-600'              },
  ignored:     { label: "E'tiborsiz",   dot: 'bg-Color-Grey-Grey-400', badge: 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 text-Color-Grey-Grey-600'              },
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
    <div className="flex items-start gap-3 border-b border-Color-Grey-Grey-200 py-3 last:border-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-Color-Grey-Grey-100">
        <Icon className="h-3.5 w-3.5 text-Color-Grey-Grey-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-Color-Grey-Grey-600">{label}</p>
        <p className="mt-0.5 break-all text-sm font-medium text-Color-Grey-Grey-950">{value}</p>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function AppealModal({ appeal, onClose, onSuccess }: {
  appeal: Appeal; onClose: () => void; onSuccess?: () => void;
}) {
  const currentStatus = (appeal.status[0] ?? 'new') as AppealStatus;
  const [status,  setStatus]  = useState<AppealStatus>(currentStatus);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
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

  const handleSave = async () => {
    setSaving(true); setSaveErr(null);
    try {
      await updateAppealStatus(appeal, status);
      setSaved(true);
      onSuccess?.();
      setTimeout(onClose, 700);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        className="relative flex w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 shadow-2xl"
        style={{ maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-Color-Grey-Grey-950">
              Murojaat{' '}
              <span className="font-mono text-Color-Grey-Grey-600">#{appeal.guid.slice(-8).toUpperCase()}</span>
            </h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left panel — user info + message */}
          <div className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-r border-Color-Grey-Grey-200">
            {/* Avatar + name */}
            <div className="border-b border-Color-Grey-Grey-200 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-Color-Primary-Primary/10 text-base font-bold text-Color-Primary-Primary">
                  {initials(appeal.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold capitalize text-Color-Grey-Grey-950">
                    {appeal.name.toLowerCase()}
                  </p>
                  <p className="font-mono text-xs text-Color-Grey-Grey-600">{appeal.phone}</p>
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
            <div className="border-b border-Color-Grey-Grey-200 p-5">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-Color-Grey-Grey-600" />
                <h3 className="text-sm font-semibold text-Color-Grey-Grey-950">Murojaat matni</h3>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-Color-Grey-Grey-700">
                {appeal.description || <span className="italic text-Color-Grey-Grey-500">Matn yo'q</span>}
              </p>
            </div>

            {/* Status management */}
            <div className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-Color-Grey-Grey-950">Holat boshqaruvi</h3>

              {/* Current badge */}
              <div className="mb-3 flex items-center justify-between rounded-xl bg-Color-Grey-Grey-50 px-4 py-3">
                <span className="text-xs text-Color-Grey-Grey-600">Joriy holat</span>
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
                          ? 'border-Color-Primary-Primary bg-Color-Primary-Primary/10 text-Color-Grey-Grey-950'
                          : 'border-Color-Grey-Grey-200 bg-transparent text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950'
                      }`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
                      {c.label}
                      {active && (
                        <span className="ml-auto rounded-full bg-Color-Primary-Primary/20 px-1.5 py-0.5 text-[10px] font-bold text-Color-Primary-Primary">
                          Joriy
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {saveErr && <p className="mt-2 text-xs text-Color-Danger-Danger-Accent">{saveErr}</p>}
              <button
                onClick={handleSave}
                disabled={saving || saved || status === currentStatus}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-Color-Info-Info-Accent py-2.5 text-sm font-bold text-Color-Light-Constant-White transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saved   ? <><Check className="h-4 w-4" /> Saqlandi!</>
               : saving  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saqlanmoqda…</>
               :           'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
