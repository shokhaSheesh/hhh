import { useState, useEffect } from 'react';
import { rootApi } from '@/api/client';
import type { Faq, FaqListResponse } from '@/types/faq';

export interface FaqPayload {
  question_uz: string;
  question_ru: string;
  question_en: string;
  answer_uz:   string;
  answer_ru:   string;
  answer_en:   string;
}

export function useFaq(tick = 0) {
  const [faqs,    setFaqs]    = useState<Faq[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    rootApi
      .get<FaqListResponse>('/v2/items/frequently_asked_questions?from-ofs=true&offset=0&limit=100')
      .then((res) => {
        if (cancelled) return;
        setFaqs(res.data.data.response ?? []);
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

  return { faqs, total, loading, error };
}

export async function createFaq(data: FaqPayload): Promise<void> {
  await rootApi.post('/v2/items/frequently_asked_questions?from-ofs=true', {
    data,
    disable_faas: true,
  });
}

export async function updateFaq(guid: string, data: FaqPayload): Promise<void> {
  await rootApi.put('/v2/items/frequently_asked_questions?from-ofs=true', {
    data: { guid, ...data },
    disable_faas: true,
  });
}

export async function deleteFaq(guid: string): Promise<void> {
  await rootApi.delete(`/v2/items/frequently_asked_questions/${guid}?from-ofs=true`, { data: { data: {} } });
}
