import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteUser } from '../hooks/useUserMutations';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import type { User } from '@/types/user';

function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  } catch { return iso; }
}

function fmtGender(gender: string[]) {
  if (!gender?.length) return '—';
  const map: Record<string, string> = { male: 'Erkak', female: 'Ayol' };
  return map[gender[0]] ?? gender[0];
}

function fmtLanguage(langs: string[]) {
  if (!langs?.length) return '—';
  const map: Record<string, string> = { uz: "O'zbekcha", ru: 'Ruscha', en: 'Inglizcha' };
  return map[langs[0]] ?? langs[0];
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-Color-Grey-Grey-200 py-3 last:border-0">
      <span className="shrink-0 text-sm text-Color-Grey-Grey-600">{label}</span>
      <span className={['text-right text-sm font-medium text-Color-Grey-Grey-950', mono ? 'font-mono' : ''].join(' ')}>
        {value || '—'}
      </span>
    </div>
  );
}

interface Props {
  user:      User;
  onDeleted: () => void;
}

export function UserProfile({ user, onDeleted }: Props) {
  const initials          = user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const [modalOpen,   setModalOpen]   = useState(false);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(user.guid);
      onDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "O'chirishda xatolik yuz berdi");
      setIsDeleting(false);
    }
  }

  return (
    <>
      {modalOpen && (
        <DeleteConfirmModal
          userName={user.name}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => { setModalOpen(false); setDeleteError(null); }}
        />
      )}

      <div className="flex h-full flex-col p-5">
        {/* Avatar + name */}
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={user.photo}
              alt={user.name}
              className="h-20 w-20 rounded-xl object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <div
              className="hidden h-20 w-20 items-center justify-center rounded-xl bg-Color-Grey-Grey-200 text-2xl font-bold text-Color-Grey-Grey-700"
              aria-hidden
            >
              {initials}
            </div>
          </div>
          <p className="text-center text-base font-semibold capitalize text-Color-Grey-Grey-950">
            {user.name.toLowerCase()}
          </p>
        </div>

        {/* Field rows */}
        <div className="flex-1">
          <Row label="Telefon raqami"   value={user.phone}                     mono />
          <Row label="Pasport seriyasi" value={user.passport_serial_number}    mono />
          <Row label="Jinsi"            value={fmtGender(user.gender)}              />
          <Row label="JSHSHIR"          value={user.pinfl ?? '—'}             mono />
          <Row label="Ilova tili"       value={fmtLanguage(user.app_language)}      />
          <Row label="Tug'ilgan sanasi" value={fmtDate(user.birth_date)}            />
        </div>

        {/* Delete button */}
        <button
          onClick={() => { setDeleteError(null); setModalOpen(true); }}
          className="mt-6 flex items-center gap-2 text-sm font-medium text-Color-Danger-Danger-Accent transition-opacity hover:opacity-70"
        >
          <Trash2 className="h-4 w-4" />
          Foydalanuvchini o'chirish
        </button>
      </div>
    </>
  );
}
