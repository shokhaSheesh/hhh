import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import { createAdmin, updateAdmin, type AdminPayload } from './hooks/useAdmins';
import { useRoles } from './hooks/useRoles';
import { useClientTypes } from './hooks/useClientTypes';
import type { Admin } from '@/types/admins';

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

interface DropdownOption { value: string; label: string; }

function Dropdown({
  value, onChange, options, placeholder, disabled,
}: {
  value:       string;
  onChange:    (v: string) => void;
  options:     DropdownOption[];
  placeholder: string;
  disabled?:   boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  function handleToggle() {
    if (disabled) return;
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (listRef.current && !listRef.current.contains(target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
          open
            ? 'border-Color-Grey-Grey-400 bg-Color-Grey-Grey-50'
            : 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 hover:border-Color-Grey-Grey-400'
        } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      >
        <span className={selected ? 'text-Color-Grey-Grey-950' : 'text-Color-Grey-Grey-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-Color-Grey-Grey-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && rect && createPortal(
        <div
          ref={listRef}
          style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}
          className="overflow-hidden rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl"
        >
          <div className="max-h-48 overflow-y-auto py-1">
            {options.length === 0 ? (
              <p className="px-4 py-3 text-xs text-Color-Grey-Grey-500">Mavjud emas</p>
            ) : (
              options.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? 'bg-Color-Primary-Primary/10 text-Color-Primary-Primary'
                        : 'text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50 hover:text-Color-Grey-Grey-950'
                    }`}
                  >
                    {opt.label}
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface Props {
  initial?:   Admin | null;
  onClose:    () => void;
  onSuccess?: () => void;
}

export default function AdminModal({ initial, onClose, onSuccess }: Props) {
  const isEdit = Boolean(initial);

  const { clientTypes } = useClientTypes();
  const { roles }       = useRoles();

  const [login,        setLogin]        = useState(initial?.login          ?? '');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [clientTypeId, setClientTypeId] = useState(initial?.client_type_id ?? '');
  const [roleId,       setRoleId]       = useState(initial?.role_id        ?? '');
  const [userIdAuth,   setUserIdAuth]   = useState(initial?.user_id_auth   ?? '');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const filteredRoles = clientTypeId
    ? roles.filter((r) => r.client_type_id === clientTypeId)
    : roles;

  useEffect(() => {
    if (clientTypeId && roleId) {
      const stillValid = filteredRoles.some((r) => r.guid === roleId);
      if (!stillValid) setRoleId('');
    }
  }, [clientTypeId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientTypeId) { setError('Platforma tanlanmagan'); return; }
    if (!roleId)        { setError('Rol tanlanmagan');       return; }

    const payload: AdminPayload = {
      login:          login.trim(),
      ...((!isEdit || password) && { password }),
      client_type_id: clientTypeId,
      role_id:        roleId,
      user_id_auth:   userIdAuth.trim(),
    };

    setSaving(true);
    setError(null);
    try {
      if (isEdit && initial) {
        await updateAdmin(initial.guid, payload);
      } else {
        await createAdmin(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400';
  const labelCls = 'mb-1.5 block text-sm font-medium text-Color-Grey-Grey-600';

  const clientTypeOptions: DropdownOption[] = clientTypes.map((ct) => ({ value: ct.guid, label: ct.name }));
  const roleOptions: DropdownOption[]       = filteredRoles.map((r)  => ({ value: r.guid,  label: r.name  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-Color-Primary-Primary/10">
              <ShieldCheck className="h-4 w-4 text-Color-Primary-Primary" />
            </div>
            <h2 className="text-base font-semibold text-Color-Grey-Grey-950">
              {isEdit ? 'Administratorni tahrirlash' : "Administrator qo'shish"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className={labelCls}>Login <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="admin_login"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Parol{' '}
              {isEdit
                ? <span className="text-Color-Grey-Grey-500 font-normal">(ixtiyoriy — o'zgartirish uchun)</span>
                : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required={!isEdit}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "O'zgartirmaslik uchun bo'sh qoldiring" : 'Parolni kiriting'}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-Color-Grey-Grey-500 hover:text-Color-Grey-Grey-700"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Platforma <span className="text-red-500">*</span></label>
              <Dropdown
                value={clientTypeId}
                onChange={setClientTypeId}
                options={clientTypeOptions}
                placeholder="Tanlang…"
              />
            </div>

            <div>
              <label className={labelCls}>Rol <span className="text-red-500">*</span></label>
              <Dropdown
                value={roleId}
                onChange={setRoleId}
                options={roleOptions}
                placeholder={clientTypeId ? 'Tanlang…' : 'Avval platforma'}
                disabled={!clientTypeId}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Auth foydalanuvchi ID</label>
            <input
              type="text"
              value={userIdAuth}
              onChange={(e) => setUserIdAuth(e.target.value)}
              placeholder="UUID (ixtiyoriy)"
              className={inputCls}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-semibold text-Color-Grey-Grey-700 transition-colors hover:bg-Color-Grey-Grey-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-Color-Info-Info-Accent px-5 py-2 text-sm font-bold text-Color-Light-Constant-White transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda…' : isEdit ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
