import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Calendar, Clock, Hash,
  Phone, User, Image as ImageIcon,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types/notifications';

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

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  notification: { label: 'Bildirishnoma', cls: 'border-blue-500/30 bg-blue-500/10 text-blue-400'       },
  news:         { label: 'Yangilik',      cls: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
};

function TypeBadge({ type }: { type: NotificationType[] }) {
  const cfg = TYPE_CONFIG[type[0]] ?? { label: type[0], cls: 'border-gray-700 bg-gray-800 text-gray-400' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

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

// ─── Language tab content ─────────────────────────────────────────────────────

type LangKey = 'uz' | 'ru' | 'en';

const LANG_LABELS: Record<LangKey, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

function LangContent({ n, lang }: { n: Notification; lang: LangKey }) {
  const title   = n[`title_${lang}`   as keyof Notification] as string | null;
  const message = n[`message_${lang}` as keyof Notification] as string | null;

  if (!title && !message) {
    return (
      <p className="py-8 text-center text-sm italic text-gray-600">
        Bu tilda kontent yo'q
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Sarlavha</p>
          <p className="text-lg font-semibold text-white">{title}</p>
        </div>
      )}
      {message && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Xabar</p>
          <p className="whitespace-pre-wrap leading-relaxed text-gray-300">{message}</p>
        </div>
      )}
      {n.image && lang === 'uz' && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Rasm</p>
          <img src={n.image} alt="" className="max-h-64 rounded-xl object-cover" />
        </div>
      )}
    </div>
  );
}

// ─── Detail component ─────────────────────────────────────────────────────────

function NotificationDetail({ n }: { n: Notification }) {
  const navigate   = useNavigate();
  const [tab, setTab] = useState<LangKey>('uz');

  const availableLangs = (['uz', 'ru', 'en'] as LangKey[]).filter(
    (l) => n[`title_${l}` as keyof Notification] || n[`message_${l}` as keyof Notification],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/notifications')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-dark-border bg-dark-surface text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-white">
                {n.title_uz ?? n.title_ru ?? n.title_en ?? 'Bildirishnoma'}
              </h1>
              <TypeBadge type={n.type} />
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              <Clock className="mr-1 inline h-3 w-3" />
              {fmtDate(n.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left 2 cols — content */}
        <div className="col-span-2 space-y-5">

          {/* Language tab card */}
          <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
            {/* Tab switcher */}
            <div className="flex border-b border-dark-border">
              {(['uz', 'ru', 'en'] as LangKey[]).map((l) => {
                const has = availableLangs.includes(l);
                return (
                  <button
                    key={l}
                    onClick={() => setTab(l)}
                    className={[
                      'flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold transition-colors',
                      tab === l
                        ? 'border-b-2 border-brand-lime text-white'
                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-300',
                      !has ? 'opacity-40' : '',
                    ].join(' ')}
                  >
                    {LANG_LABELS[l]}
                    {has && <span className="h-1.5 w-1.5 rounded-full bg-brand-lime" />}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              <LangContent n={n} lang={tab} />
            </div>
          </div>

          {/* Media card (if image exists) */}
          {n.image && (
            <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
              <div className="flex items-center gap-2 border-b border-dark-border px-6 py-4">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-white">Media</h2>
              </div>
              <div className="p-6">
                <img src={n.image} alt="" className="max-h-80 w-full rounded-xl object-cover" />
              </div>
            </div>
          )}
        </div>

        {/* Right col — metadata + user */}
        <div className="space-y-5">

          {/* Info card */}
          <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
            <div className="border-b border-dark-border px-6 py-4">
              <h2 className="text-sm font-semibold text-white">Tafsilotlar</h2>
            </div>
            <div className="px-5">
              <InfoRow icon={Hash}     label="ID"           value={<span className="font-mono text-xs">{n.guid}</span>} />
              <InfoRow icon={Calendar} label="Yaratilgan"   value={fmtDate(n.created_at)} />
              <InfoRow icon={Clock}    label="Yangilangan"  value={fmtDate(n.updated_at)} />
            </div>
          </div>

          {/* Recipient card */}
          <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
            <div className="border-b border-dark-border px-6 py-4">
              <h2 className="text-sm font-semibold text-white">Qabul qiluvchi</h2>
            </div>

            {n.users_id_data ? (
              <div className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0">
                    <img
                      src={n.users_id_data.photo}
                      alt={n.users_id_data.name}
                      className="h-12 w-12 rounded-2xl object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-brand-lime/10 text-sm font-bold text-brand-lime">
                      {initials(n.users_id_data.name)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold capitalize text-white">
                      {n.users_id_data.name.toLowerCase()}
                    </p>
                    <p className="font-mono text-xs text-gray-400">{n.users_id_data.phone}</p>
                  </div>
                </div>
                <div className="divide-y divide-dark-border/60">
                  <InfoRow icon={User}  label="To'liq ism" value={n.users_id_data.name} />
                  <InfoRow icon={Phone} label="Telefon"    value={n.users_id_data.phone} />
                  <InfoRow icon={Hash}  label="ID"         value={<span className="font-mono text-xs">{n.users_id_data.unique_id}</span>} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lime/10">
                  <Users className="h-6 w-6 text-brand-lime" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-brand-lime">Barchaga</p>
                  <p className="mt-0.5 text-xs text-gray-500">Barcha foydalanuvchilarga yuborilgan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function NotificationDetailPage() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const notification = (location.state as { notification?: Notification } | null)?.notification ?? null;

  if (!notification) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-500">Bildirishnoma ma'lumotlari topilmadi</p>
        <button
          onClick={() => navigate('/notifications')}
          className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5"
        >
          Orqaga
        </button>
      </div>
    );
  }

  return <NotificationDetail n={notification} />;
}
