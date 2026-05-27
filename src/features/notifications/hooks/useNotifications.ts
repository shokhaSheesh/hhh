import { useState, useEffect } from 'react';
import { createApi, rootApi, VIEW } from '@/api/client';
import type { Notification, NotificationsListResponse } from '@/types/notifications';

const notificationsApi = createApi(VIEW.notifications);

interface UseNotificationsParams {
  page:     number;
  limit:    number;
  search:   string;
  userId?:  string;
  typeFilter?: string | null;
}

interface UseNotificationsResult {
  notifications: Notification[];
  total:         number;
  loading:       boolean;
  error:         string | null;
}

export function useNotifications({ page, limit, search, userId, typeFilter }: UseNotificationsParams): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = { offset: (page - 1) * limit, limit };
    if (search.trim()) body['search'] = search.trim();
    if (userId) body['users_id'] = userId;
    if (typeFilter) body['type'] = [typeFilter];

    notificationsApi
      .post<NotificationsListResponse>('/notifications/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        setNotifications(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, search, userId, typeFilter]);

  return { notifications, total, loading, error };
}

// ─── Strict type constants ────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  BILDIRISHNOMA: 'notification',
  YANGILIK:      'news',
} as const;

export type NotifUiType = keyof typeof NOTIFICATION_TYPES;

export interface CreateNotificationPayload {
  users_id:   string | null;
  type:       NotifUiType;
  title_uz:   string;
  message_uz: string;
  title_en:   string;
  message_en: string;
  title_ru:   string;
  message_ru: string;
  image:      string;
  file_link:  string;
}

export async function createNotification(p: CreateNotificationPayload): Promise<void> {
  const backendType = p.type === 'YANGILIK' ? 'news' : 'notification';

  await rootApi.post('/v2/items/notifications?from-ofs=true', {
    data: {
      users_id:   p.users_id || null,
      type:       [backendType],
      title_uz:   p.title_uz,
      message_uz: p.message_uz,
      title_en:   p.title_en,
      message_en: p.message_en,
      title_ru:   p.title_ru,
      message_ru: p.message_ru,
      image:      p.image     || '',
      file_link:  p.file_link || '',
      send_at:    new Date().toISOString(),
    },
    disable_faas: true,
  });
}
