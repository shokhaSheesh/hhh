import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  placeholder: string;
  options: FilterOption[];
  value: string | null;
  onChange: (v: string | null) => void;
}

export function FilterDropdown({ placeholder, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = value ? (options.find((o) => o.value === value) ?? null) : null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !listRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 160) });
    }
    setOpen((v) => !v);
  };

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
          selected
            ? 'border-Color-Info-Info-Accent bg-Color-Info-Info-Soft font-medium text-Color-Info-Info-Accent'
            : 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 text-Color-Grey-Grey-950 hover:border-Color-Grey-Grey-400'
        }`}
      >
        {selected ? selected.label : placeholder}
        {selected ? (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
            className="rounded p-0.5 hover:bg-Color-Info-Info-Accent/20"
          >
            <X className="h-3 w-3" />
          </span>
        ) : (
          <ChevronDown className={`h-4 w-4 text-Color-Grey-Grey-600 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && pos && createPortal(
        <div
          ref={listRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width, zIndex: 9999 }}
          className="overflow-hidden rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light py-1 shadow-2xl"
        >
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors ${
              !value ? 'font-semibold text-Color-Grey-Grey-950' : 'text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-50'
            }`}
          >
            Hammasi
            {!value && <Check className="ml-auto h-3.5 w-3.5 text-Color-Primary-Primary" />}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors ${
                opt.value === value
                  ? 'bg-Color-Grey-Grey-50 font-semibold text-Color-Grey-Grey-950'
                  : 'text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50'
              }`}
            >
              {opt.label}
              {opt.value === value && <Check className="ml-auto h-3.5 w-3.5 text-Color-Primary-Primary" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
