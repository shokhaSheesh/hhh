import { useEffect, useState } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { SwapRecord, SwapsListResponse } from '@/types/swaps';

const swapsApi = createApi(VIEW.swaps);

function fmtDate(raw: string | null) {
  if (!raw) return '—';
  if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) return raw;
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(raw));
  } catch { return raw; }
}

const TH = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600';
const TD = 'px-4 py-3 text-sm';

export function UserSwapHistory({ userGuid }: { userGuid: string }) {
  const [swaps,   setSwaps]   = useState<SwapRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    swapsApi
      .post<SwapsListResponse>('/user_battery_bindings/items/list', {
        data: { users_id: userGuid, offset: 0, limit: 2 },
      })
      .then((res) => {
        if (cancelled) return;
        setSwaps(res.data.data.response ?? []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userGuid]);

  return (
    <div className="overflow-hidden rounded-xl border border-Color-Grey-Grey-200">
      <div className="border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-Color-Grey-Grey-950">So'nggi almashtirishlar</h3>
      </div>

      {loading ? (
        <div className="divide-y divide-Color-Grey-Grey-200">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 w-36 animate-pulse rounded bg-Color-Grey-Grey-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-Color-Grey-Grey-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-Color-Grey-Grey-200" />
            </div>
          ))}
        </div>
      ) : swaps.length === 0 ? (
        <p className="px-4 py-6 text-sm text-Color-Grey-Grey-600">Almashtirishlar topilmadi</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-Color-Grey-Grey-50">
              <tr>
                <th className={TH}>Batareya SN</th>
                <th className={TH}>Stansiya</th>
                <th className={TH}>Olindi</th>
                <th className={TH}>Qaytarildi</th>
                <th className={TH}>Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-Color-Grey-Grey-200">
              {swaps.map((s) => {
                const status = s.status[0] ?? 'unbound';
                return (
                  <tr key={s.guid} className="transition-colors hover:bg-Color-Grey-Grey-50">
                    <td className={`${TD} font-mono text-Color-Grey-Grey-950 whitespace-nowrap`}>
                      {s.batteries_id_data?.battery_sn ?? '—'}
                    </td>
                    <td className={`${TD} text-Color-Grey-Grey-950 whitespace-nowrap`}>
                      {s.devices_id_data?.device_name || s.devices_id_data?.device_location || '—'}
                    </td>
                    <td className={`${TD} font-mono text-Color-Grey-Grey-600 whitespace-nowrap`}>{fmtDate(s.unbound_at)}</td>
                    <td className={`${TD} font-mono text-Color-Grey-Grey-600 whitespace-nowrap`}>{fmtDate(s.bound_at)}</td>
                    <td className={`${TD} whitespace-nowrap`}>
                      {status === 'bound' ? (
                        <span className="inline-flex items-center rounded-full border border-Color-Success-Success bg-Color-Success-Success-Soft px-2 py-0.5 text-xs font-medium text-Color-Grey-Grey-950">
                          Qaytarildi
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-Color-Warning-Warning bg-Color-Warning-Warning-Soft px-2 py-0.5 text-xs font-medium text-Color-Grey-Grey-950">
                          Qaytarilmadi
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
