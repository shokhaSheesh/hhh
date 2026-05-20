import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { useRoles } from './hooks/useRoles';
import {
  useRolePermissions,
  updateAccess,
  type PermissionItem,
  type PermField,
} from './hooks/useRolePermissions';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; ok: boolean; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-sm ${
            t.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {t.ok ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  function push(message: string, ok: boolean) {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, ok }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }
  return { toasts, push };
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  on,
  saving,
  onClick,
}: {
  on:      boolean;
  saving:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60"
      style={{ background: on ? '' : '' }}
    >
      <div
        className={`absolute inset-0 rounded-full transition-colors duration-200 ${
          on ? 'bg-brand-lime' : 'bg-gray-700'
        }`}
      />
      {saving ? (
        <Loader2 className="relative z-10 m-auto h-3 w-3 animate-spin text-black/60" />
      ) : (
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            on ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      )}
    </button>
  );
}

// ─── Permission row ───────────────────────────────────────────────────────────

function PermRow({
  item,
  roleId,
  clientTypeId,
  onUpdate,
  onError,
}: {
  item:         PermissionItem;
  roleId:       string;
  clientTypeId: string;
  onUpdate:     (id: string, field: PermField, value: 'Yes' | 'No') => void;
  onError:      (prev: PermissionItem) => void;
}) {
  const [saving, setSaving] = useState<PermField | null>(null);

  async function toggle(field: PermField) {
    const next: 'Yes' | 'No' = item[field] === 'Yes' ? 'No' : 'Yes';
    const updated = { ...item, [field]: next };

    // Optimistic
    onUpdate(item.custom_permission_id, field, next);
    setSaving(field);

    try {
      await updateAccess(roleId, clientTypeId, updated);
    } catch {
      onError(item); // rollback
    } finally {
      setSaving(null);
    }
  }

  const fields: PermField[] = ['read', 'write', 'update', 'delete'];

  return (
    <div className="flex items-center border-b border-dark-border px-6 py-3.5 transition-colors last:border-0 hover:bg-white/[0.02]">
      <div className="min-w-0 flex-1 text-sm font-medium text-white">
        {item.title.trim()}
      </div>
      {fields.map((field) => (
        <div key={field} className="flex w-24 justify-center">
          <Toggle
            on={item[field] === 'Yes'}
            saving={saving === field}
            onClick={() => toggle(field)}
          />
        </div>
      ))}
      <div className="flex w-16 items-center justify-end">
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded border border-transparent text-gray-600 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Permissions panel ────────────────────────────────────────────────────────

function PermissionsPanel({
  roleId,
  clientTypeId,
  push,
}: {
  roleId:       string;
  clientTypeId: string;
  push:         (msg: string, ok: boolean) => void;
}) {
  const { items, setItems, loading, error } = useRolePermissions(roleId, clientTypeId);

  function handleUpdate(id: string, field: PermField, value: 'Yes' | 'No') {
    setItems((prev) =>
      prev.map((it) => (it.custom_permission_id === id ? { ...it, [field]: value } : it)),
    );
  }

  function handleError(prev: PermissionItem) {
    setItems((cur) =>
      cur.map((it) =>
        it.custom_permission_id === prev.custom_permission_id ? prev : it,
      ),
    );
    push('Ruxsatnomani saqlashda xatolik yuz berdi', false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand-lime" />
        <span className="text-sm text-gray-400">Yuklanmoqda…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500/60" strokeWidth={1.5} />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-600">
        Bu rol uchun ruxsatlar topilmadi
      </div>
    );
  }

  return (
    <div>
      {/* Column headers */}
      <div className="flex items-center border-b border-dark-border bg-gray-800/40 px-6 py-3">
        <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Menyu
        </div>
        {(['Read', 'Write', 'Update', 'Delete'] as const).map((col) => (
          <div key={col} className="w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
            {col}
          </div>
        ))}
        <div className="w-16" />
      </div>

      {items.map((item) => (
        <PermRow
          key={item.custom_permission_id}
          item={item}
          roleId={roleId}
          clientTypeId={clientTypeId}
          onUpdate={handleUpdate}
          onError={handleError}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { roles, loading: rolesLoading } = useRoles();
  const [selectedId, setSelectedId]      = useState<string | null>(null);
  const { toasts, push }                 = useToasts();

  useEffect(() => {
    if (!selectedId && roles.length > 0) {
      setSelectedId(roles[0].guid);
    }
  }, [roles, selectedId]);

  const selected = roles.find((r) => r.guid === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} />

      {/* ── Role tabs ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rollar</h2>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-brand-lime/40 bg-brand-lime/10 px-3 py-1.5 text-xs font-semibold text-brand-lime transition-colors hover:bg-brand-lime/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Yangi rol
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-6 py-4">
          {rolesLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
          ) : (
            roles.map((role) => (
              <button
                key={role.guid}
                type="button"
                onClick={() => setSelectedId(role.guid)}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedId === role.guid
                    ? 'border-brand-lime bg-brand-lime/10 text-brand-lime'
                    : 'border-dark-border text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                {role.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Permissions matrix ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Ruxsatnomalar matritsasi
              {selected && (
                <span className="ml-2 rounded-full border border-brand-lime/30 bg-brand-lime/10 px-2.5 py-0.5 text-xs font-semibold text-brand-lime">
                  {selected.name}
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Tanlangan rol uchun menyu bo'yicha kirish huquqlari
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Menyu qo'shish
          </button>
        </div>

        {!selected ? (
          <div className="py-20 text-center text-sm text-gray-600">
            Yuqoridan rol tanlang
          </div>
        ) : (
          <PermissionsPanel
            key={selected.guid}
            roleId={selected.guid}
            clientTypeId={selected.client_type_id}
            push={push}
          />
        )}
      </div>
    </div>
  );
}
