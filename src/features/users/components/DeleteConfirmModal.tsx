import { AlertTriangle } from 'lucide-react';

interface Props {
  userName:   string;
  isDeleting: boolean;
  error:      string | null;
  onConfirm:  () => void;
  onCancel:   () => void;
}

export function DeleteConfirmModal({ userName, isDeleting, error, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} aria-hidden />

      <div className="relative w-full max-w-md rounded-2xl border border-dark-border bg-dark-surface p-6 shadow-2xl">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
        </div>

        {/* Text */}
        <h3 className="mb-2 text-center text-base font-semibold text-white">
          Hizmatni o'chirishni tasdiqlaysizmi?
        </h3>
        <p className="text-center text-sm leading-relaxed text-gray-400">
          Diqqat! Ushbu foydalanuvchini{' '}
          <span className="font-medium text-white">({userName})</span>{' '}
          o'chirib tashlasangiz, uning barcha ma'lumotlari, balanslari va tizimga kirish
          huquqlari butunlay yo'q qilinadi. Bu amalni ortga qaytarib bo'lmaydi.
        </p>

        {/* Error */}
        {error && (
          <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-center text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-gray-700 bg-transparent px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            Yo'q, bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {isDeleting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Ha, o'chirilsin
          </button>
        </div>
      </div>
    </div>
  );
}
