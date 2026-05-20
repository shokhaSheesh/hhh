import { useEffect } from 'react';
import { X, Ticket } from 'lucide-react';
import PromocodeForm, { type PromocodeFormValues } from './components/PromocodeForm';

interface Props {
  onClose: () => void;
}

export default function PromocodeModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSave = (values: PromocodeFormValues) => {
    console.log('[PromocodeModal] new promocode:', values);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-dark-border bg-[#16161D] shadow-2xl">
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-lime/10">
              <Ticket className="h-4 w-4 text-brand-lime" />
            </div>
            <h2 className="text-base font-semibold text-white">Promokod qo'shish</h2>
          </div>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <PromocodeForm
            onSave={handleSave}
            onCancel={onClose}
            saveLabel="Promokodni qo'shish"
          />
        </div>
      </div>
    </div>
  );
}
