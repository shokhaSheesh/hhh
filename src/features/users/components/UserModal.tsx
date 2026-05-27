import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { User } from '@/types/user';
import { UserProfile }       from './UserProfile';
import { UserSubscriptions } from './UserSubscriptions';
import { UserSwapHistory }   from './UserSwapHistory';

export function UserModal({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal card */}
      <div className="relative flex w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 shadow-2xl"
           style={{ maxHeight: '88vh' }}>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Foydalanuvchi haqida</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: left profile + right content */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left panel — profile */}
          <div className="w-[270px] shrink-0 overflow-y-auto border-r border-Color-Grey-Grey-200">
            <UserProfile user={user} onDeleted={onDeleted} />
          </div>

          {/* Right panel — subscription + swap history */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-4">
              <UserSubscriptions userGuid={user.guid} />
              <UserSwapHistory   userGuid={user.guid} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
