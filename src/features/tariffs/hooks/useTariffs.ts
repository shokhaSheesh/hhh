import { useState, useEffect } from 'react';
import { createApi, rootApi, VIEW } from '@/api/client';
import type { Tariff, TariffsListResponse, TariffType, TariffTypesResponse } from '@/types/tariffs';

const tariffsApi = createApi(VIEW.tariffs);

// ─── List ─────────────────────────────────────────────────────────────────────

interface UseTariffsResult {
  tariffs: Tariff[];
  total:   number;
  loading: boolean;
  error:   string | null;
}

export function useTariffs(tick = 0): UseTariffsResult {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    tariffsApi
      .post<TariffsListResponse>('/tariffs/items/list', { data: { offset: 0, limit: 100 } })
      .then((res) => {
        if (cancelled) return;
        setTariffs(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { tariffs, total, loading, error };
}

// ─── Tariff types ─────────────────────────────────────────────────────────────

interface UseTariffTypesResult {
  types:   TariffType[];
  loading: boolean;
}

export function useTariffTypes(tick = 0): UseTariffTypesResult {
  const [types,   setTypes]   = useState<TariffType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    rootApi
      .get<TariffTypesResponse>('/v2/items/tariff_types?from-ofs=true&offset=0&limit=50')
      .then((res) => {
        if (cancelled) return;
        setTypes(res.data.data.response ?? []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { types, loading };
}

export async function createTariffType(name: string, dayCount: number): Promise<void> {
  await rootApi.post('/v2/items/tariff_types?from-ofs=true', {
    data: { name, day_count: Number(dayCount) || 0 },
    disable_faas: true,
  });
}

export async function deleteTariffType(guid: string): Promise<void> {
  await rootApi.delete(`/v2/items/tariff_types/${guid}?from-ofs=true`);
}

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreateTariffPayload {
  name:              string;
  description:       string;
  key:               string;
  color:             string;
  tariff_types_id:   string;
  base_tariff:       boolean;
  amount:            number;
  swap_count:        number;
  free_swap_count:   number;
  daily_swap_limit:  number;
  over_limit_amount: number;
}

export interface UpdateTariffPayload extends CreateTariffPayload {
  guid: string;
}

export async function updateTariff(payload: UpdateTariffPayload): Promise<void> {
  await rootApi.put('/v2/items/tariffs?from-ofs=true', {
    data: {
      guid:              payload.guid,
      name:              payload.name,
      description:       payload.description,
      key:               payload.key.trim().toLowerCase(),
      color:             payload.color || '#D1F22D',
      tariff_types_id:   payload.tariff_types_id,
      base_tariff:       Boolean(payload.base_tariff),
      amount:            Number(payload.amount) || 0,
      swap_count:        Number(payload.swap_count) || 0,
      free_swap_count:   Number(payload.free_swap_count) || 0,
      daily_swap_limit:  Number(payload.daily_swap_limit) || 0,
      over_limit_amount: Number(payload.over_limit_amount) || 0,
    },
    disable_faas: true,
  });
}

export async function deleteTariff(guid: string): Promise<void> {
  await rootApi.delete(`/v2/items/tariffs/${guid}?from-ofs=true`);
}

export async function createTariff(payload: CreateTariffPayload): Promise<void> {
  await rootApi.post('/v2/items/tariffs?from-ofs=true', {
    data: {
      name:              payload.name,
      description:       payload.description,
      key:               payload.key.trim().toLowerCase(),
      color:             payload.color || '#D1F22D',
      tariff_types_id:   payload.tariff_types_id,
      base_tariff:       Boolean(payload.base_tariff),
      amount:            Number(payload.amount) || 0,
      swap_count:        Number(payload.swap_count) || 0,
      free_swap_count:   Number(payload.free_swap_count) || 0,
      daily_swap_limit:  Number(payload.daily_swap_limit) || 0,
      over_limit_amount: Number(payload.over_limit_amount) || 0,
    },
    disable_faas: true,
  });
}
