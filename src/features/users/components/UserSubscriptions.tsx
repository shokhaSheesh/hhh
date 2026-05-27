import { useEffect, useState } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Subscription, SubscriptionsListResponse } from '@/types/subscriptions';

const subscriptionsApi = createApi(VIEW.subscriptions);

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  if (/^\d{2}\.\d{2}\.\d{4}/.test(iso)) return iso.split(' ')[0];
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(iso));
  } catch { return iso; }
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n) + " so'm";
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-Color-Grey-Grey-50 p-4 outline outline-1 outline-offset-[-0.5px] outline-Color-Grey-Grey-200">
      <p className="mb-1.5 text-xs text-Color-Grey-Grey-600">{label}</p>
      <div className="text-sm font-medium text-Color-Grey-Grey-950">{children}</div>
    </div>
  );
}

export function UserSubscriptions({ userGuid }: { userGuid: string }) {
  const [sub,     setSub]     = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    subscriptionsApi
      .post<SubscriptionsListResponse>('/subscriptions/items/list', {
        data: { users_id: userGuid, offset: 0, limit: 1 },
      })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data?.response ?? [];
        setSub(list[0] ?? null);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userGuid]);

  return (
    <div className="overflow-hidden rounded-xl border border-Color-Grey-Grey-200">
      <div className="border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-Color-Grey-Grey-950">Obuna holati</h3>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-px bg-Color-Grey-Grey-200">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-Color-Grey-Grey-50 p-4 space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-Color-Grey-Grey-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-Color-Grey-Grey-200" />
            </div>
          ))}
        </div>
      ) : !sub ? (
        <p className="px-4 py-6 text-sm text-Color-Grey-Grey-600">Faol obuna topilmadi</p>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-Color-Grey-Grey-200 [&>*:first-child]:rounded-tl-none [&>*:nth-child(2)]:rounded-tr-none [&>*:nth-last-child(2)]:rounded-bl-none [&>*:last-child]:rounded-br-none">
          <Cell label="Holati">
            {sub.active ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-Color-Info-Info bg-Color-Info-Info-Soft px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-950">
                <span className="h-1.5 w-1.5 rounded-full bg-Color-Info-Info" />
                Faol
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                <span className="h-1.5 w-1.5 rounded-full bg-Color-Grey-Grey-400" />
                Nofaol
              </span>
            )}
          </Cell>
          <Cell label="Tarif">
            <span className="inline-flex items-center rounded-full bg-Color-Warning-Warning px-2.5 py-0.5 text-xs font-semibold text-Color-Light-Constant-White">
              {sub.tariffs_id_data?.name ?? '—'}
            </span>
          </Cell>
          <Cell label="Summa">{fmtAmount(sub.final_amount)}</Cell>
          <Cell label="Almashtirishlar">
            {sub.used_swap_count != null ? `${sub.used_swap_count} ta` : '—'}
          </Cell>
          <Cell label="Ulangan sana">{fmtDate(sub.active_from)}</Cell>
          <Cell label="Tugash sanasi">
            {sub.active_to ? fmtDate(sub.active_to) : 'Cheksiz'}
          </Cell>
        </div>
      )}
    </div>
  );
}
