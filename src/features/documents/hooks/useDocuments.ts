import { useState, useEffect } from 'react';
import { rootApi, uploadFile } from '@/api/client';
import type { Document, DocumentsListResponse } from '@/types/documents';

interface UseDocumentsParams {
  page:  number;
  limit: number;
}

interface UseDocumentsResult {
  documents: Document[];
  total:     number;
  loading:   boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useDocuments({ page, limit }: UseDocumentsParams): UseDocumentsResult {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [tick,      setTick]      = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const offset = (page - 1) * limit;

    rootApi
      .get<DocumentsListResponse>(`/v2/items/documents?from-ofs=true&offset=${offset}&limit=${limit}`)
      .then((res) => {
        if (cancelled) return;
        setDocuments(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, tick]);

  return { documents, total, loading, error, refetch };
}

export interface DocumentPayload {
  name_uz:       string;
  name_ru:       string;
  name_en:       string;
  text_uz:       string;
  text_ru:       string;
  text_en:       string;
  files_uz:      string[];
  files_ru:      string[];
  files_en:      string[];
  document_type: string[];
}

export async function createDocument(data: DocumentPayload): Promise<void> {
  await rootApi.post('/v2/items/documents?from-ofs=true', {
    data,
    disable_faas: true,
  });
}

export async function updateDocument(guid: string, data: DocumentPayload): Promise<void> {
  await rootApi.put('/v2/items/documents?from-ofs=true', {
    data: { guid, ...data },
    disable_faas: true,
  });
}

export async function deleteDocument(guid: string): Promise<void> {
  await rootApi.delete(`/v2/items/documents/${guid}?from-ofs=true`, { data: { data: {} } });
}

export async function uploadDocumentFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await uploadFile('/v1/files/folder_upload?folder_name=media', fd) as Record<string, unknown>;
  const data = res?.data as Record<string, unknown> | undefined;
  const link = data?.link as string | undefined;
  if (!link) throw new Error('Fayl URL topilmadi');
  return `https://cdn.u-code.io/${link}`;
}
