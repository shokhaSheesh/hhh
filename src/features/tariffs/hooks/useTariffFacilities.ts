import { useState, useEffect } from 'react';
import { rootApi } from '@/api/client';
import type { TariffFacility, TariffFacilitiesResponse } from '@/types/tariffs';

export function useTariffFacilities(tariffId: string, tick = 0) {
  const [facilities, setFacilities] = useState<TariffFacility[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!tariffId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    rootApi
      .get<TariffFacilitiesResponse>('/v2/items/tariff_facilities?from-ofs=true&offset=0&limit=100')
      .then((res) => {
        if (cancelled) return;
        const all = res.data.data.response ?? [];
        setFacilities(all.filter((f) => f.tariffs_id === tariffId));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tariffId, tick]);

  return { facilities, loading, error };
}
