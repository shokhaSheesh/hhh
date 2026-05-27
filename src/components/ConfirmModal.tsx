import { createPortal } from 'react-dom';
import { Loader2, Trash2 } from 'lucide-react';

interface Props {
  title:     string;
  message?:  string;
  loading?:  boolean;
  onConfirm: () => void;
  onCancel:  () => void;
}

export default function ConfirmModal({ title, message, loading, onConfirm, onCancel }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!loading ? onCancel : undefined} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-dark-border bg-dark-surface p-6 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
          <Trash2 className="h-5 w-5 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {message && <p className="mt-1.5 text-sm text-gray-400">{message}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-700 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            O&apos;chirish
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
