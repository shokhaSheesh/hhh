import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Clock, X } from 'lucide-react';

interface Props {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  withTime?:    boolean;
}

const DAY_NAMES = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const MONTHS    = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const MONTHS_SHORT = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];

function parseValue(value: string, withTime: boolean): { date: Date | null; hh: string; mm: string } {
  if (!value) return { date: null, hh: '23', mm: '59' };
  try {
    if (withTime) {
      const [datePart, timePart = '23:59'] = value.split('T');
      const [y, mo, d] = datePart.split('-').map(Number);
      const date = new Date(y, mo - 1, d);
      const [hh = '23', mm = '59'] = timePart.split(':');
      return { date: isNaN(date.getTime()) ? null : date, hh: hh.padStart(2,'0'), mm: mm.padStart(2,'0') };
    } else {
      const [y, mo, d] = value.split('-').map(Number);
      const date = new Date(y, mo - 1, d);
      return { date: isNaN(date.getTime()) ? null : date, hh: '00', mm: '00' };
    }
  } catch {
    return { date: null, hh: '23', mm: '59' };
  }
}

function toOutput(date: Date, hh: string, mm: string, withTime: boolean): string {
  const y  = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d  = String(date.getDate()).padStart(2, '0');
  return withTime ? `${y}-${mo}-${d}T${hh}:${mm}` : `${y}-${mo}-${d}`;
}

function fmtDisplay(date: Date, hh: string, mm: string, withTime: boolean): string {
  const label = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date);
  return withTime ? `${label}  ${hh}:${mm}` : label;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function getDays(month: Date): (Date | null)[] {
  const y  = month.getFullYear();
  const mo = month.getMonth();
  let dow = new Date(y, mo, 1).getDay() - 1;
  if (dow < 0) dow = 6;
  const days: (Date | null)[] = Array(dow).fill(null);
  for (let d = 1; d <= new Date(y, mo + 1, 0).getDate(); d++) days.push(new Date(y, mo, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Sanani tanlang',
  withTime = false,
}: Props) {
  const parsed = parseValue(value, withTime);

  const [open,     setOpen]     = useState(false);
  const [view,     setView]     = useState<'days' | 'months' | 'years'>('days');
  const [hh,       setHh]       = useState(parsed.hh);
  const [mm,       setMm]       = useState(parsed.mm);
  const [month,    setMonth]    = useState(() => {
    const d = parsed.date ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [yearBase, setYearBase] = useState(() => Math.floor((parsed.date ?? new Date()).getFullYear() / 12) * 12);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const btnRef = useRef<HTMLButtonElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseValue(value, withTime);
    setHh(p.hh);
    setMm(p.mm);
  }, [value, withTime]);

  function openDropdown() {
    if (!btnRef.current) return;
    const r    = btnRef.current.getBoundingClientRect();
    const calH = withTime ? 420 : 360;
    const rawTop = window.innerHeight - r.bottom >= calH ? r.bottom + 6 : r.top - calH - 6;
    const top  = Math.max(8, Math.min(rawTop, window.innerHeight - calH - 8));
    setPos({ top, left: Math.min(r.left, window.innerWidth - 292) });
    setView('days');
    setOpen(true);
  }

  function handleHeaderClick() {
    if (view === 'days') {
      setView('months');
    } else if (view === 'months') {
      setYearBase(Math.floor(month.getFullYear() / 12) * 12);
      setView('years');
    } else {
      setView('months');
    }
  }

  function handleNavLeft() {
    if (view === 'years')   { setYearBase(y => y - 12); return; }
    const y = view === 'months' ? month.getFullYear() - 1 : month.getFullYear();
    const m = view === 'months' ? month.getMonth()        : month.getMonth() - 1;
    setMonth(new Date(y, m, 1));
  }

  function handleNavRight() {
    if (view === 'years')   { setYearBase(y => y + 12); return; }
    const y = view === 'months' ? month.getFullYear() + 1 : month.getFullYear();
    const m = view === 'months' ? month.getMonth()        : month.getMonth() + 1;
    setMonth(new Date(y, m, 1));
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (calRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  function handleDayClick(day: Date) {
    if (withTime) {
      onChange(toOutput(day, hh, mm, true));
    } else {
      onChange(toOutput(day, '00', '00', false));
      setOpen(false);
    }
  }

  function handleMonthSelect(moIndex: number) {
    setMonth(new Date(month.getFullYear(), moIndex, 1));
    setView('days');
  }

  function handleHhChange(raw: string) {
    const val  = Math.min(23, Math.max(0, parseInt(raw, 10) || 0));
    const next = String(val).padStart(2, '0');
    setHh(next);
    if (parsed.date) onChange(toOutput(parsed.date, next, mm, true));
  }

  function handleMmChange(raw: string) {
    const val  = Math.min(59, Math.max(0, parseInt(raw, 10) || 0));
    const next = String(val).padStart(2, '0');
    setMm(next);
    if (parsed.date) onChange(toOutput(parsed.date, hh, next, true));
  }

  const today = new Date();
  const days  = getDays(month);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className="flex w-full items-center gap-2.5 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2.5 text-left text-sm transition-colors hover:border-Color-Grey-Grey-400 focus:border-Color-Grey-Grey-400 focus:outline-none"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-Color-Grey-Grey-500" />
        <span className={parsed.date ? 'flex-1 text-Color-Grey-Grey-950' : 'flex-1 text-Color-Grey-Grey-500'}>
          {parsed.date ? fmtDisplay(parsed.date, hh, mm, withTime) : placeholder}
        </span>
        {parsed.date && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
            className="rounded p-0.5 text-Color-Grey-Grey-400 transition-colors hover:bg-Color-Grey-Grey-200 hover:text-Color-Grey-Grey-950"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={calRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 284 }}
          className="rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl"
        >
          {/* ── Navigation header ──────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button
              type="button"
              onClick={handleNavLeft}
              className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleHeaderClick}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-Color-Grey-Grey-950 transition-colors hover:bg-Color-Grey-Grey-100"
            >
              {view === 'years'
                ? `${yearBase} – ${yearBase + 11}`
                : view === 'months'
                  ? month.getFullYear()
                  : `${MONTHS[month.getMonth()]} ${month.getFullYear()}`}
              <ChevronDown className={`h-3.5 w-3.5 text-Color-Grey-Grey-500 transition-transform ${view !== 'days' ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleNavRight}
              className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* ── Year picker view ────────────────────────────────────────── */}
          {view === 'years' && (
            <div className="grid grid-cols-3 gap-1.5 px-4 pb-4">
              {Array.from({ length: 12 }, (_, i) => yearBase + i).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setMonth(new Date(y, month.getMonth(), 1));
                    setView('months');
                  }}
                  className={[
                    'rounded-xl py-2.5 text-sm font-medium transition-colors',
                    y === month.getFullYear()
                      ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark'
                      : 'text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-100',
                  ].join(' ')}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── Month picker view ───────────────────────────────────────── */}
          {view === 'months' && (
            <div className="grid grid-cols-3 gap-1.5 px-4 pb-4">
              {MONTHS_SHORT.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleMonthSelect(i)}
                  className={[
                    'rounded-xl py-2.5 text-sm font-medium transition-colors',
                    i === month.getMonth()
                      ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark'
                      : 'text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-100',
                  ].join(' ')}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* ── Day picker view ─────────────────────────────────────────── */}
          {view === 'days' && (
            <>
              {/* Day labels */}
              <div className="grid grid-cols-7 px-3">
                {DAY_NAMES.map((n) => (
                  <div key={n} className="py-1.5 text-center text-[11px] font-semibold text-Color-Grey-Grey-500">
                    {n}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
                {days.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const selected = parsed.date ? sameDay(day, parsed.date) : false;
                  const isToday  = sameDay(day, today);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={[
                        'flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium transition-all',
                        selected
                          ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark shadow-sm'
                          : isToday
                            ? 'ring-2 ring-Color-Primary-Primary ring-offset-1 text-Color-Primary-Primary font-bold hover:bg-Color-Primary-Primary/10'
                            : 'text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-100',
                      ].join(' ')}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Time picker */}
              {withTime && (
                <div className="border-t border-Color-Grey-Grey-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-Color-Grey-Grey-600">
                      <Clock className="h-3.5 w-3.5" />
                      Vaqt
                    </div>
                    <div className="flex items-center gap-1">
                      {[{ val: hh, max: 23, set: handleHhChange }, { val: mm, max: 59, set: handleMmChange }].map(
                        (col, ci) => (
                          <div key={ci} className="flex flex-col items-center">
                            <button type="button"
                              onClick={() => col.set(String(parseInt(col.val, 10) + 1))}
                              className="rounded px-2 py-0.5 text-xs text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-100">▲</button>
                            <input
                              type="number" min={0} max={col.max}
                              value={parseInt(col.val, 10)}
                              onChange={(e) => col.set(e.target.value)}
                              className="w-10 rounded-lg border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 py-1 text-center text-sm font-semibold text-Color-Grey-Grey-950 outline-none focus:border-Color-Grey-Grey-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button type="button"
                              onClick={() => col.set(String(parseInt(col.val, 10) - 1))}
                              className="rounded px-2 py-0.5 text-xs text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-100">▼</button>
                            {ci === 0 && <span className="absolute translate-x-[52px] -translate-y-[26px] text-base font-bold text-Color-Grey-Grey-500">:</span>}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-t border-Color-Grey-Grey-200 px-4 py-3">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs text-Color-Grey-Grey-500 transition-colors hover:text-Color-Danger-Danger-Accent"
            >
              Tozalash
            </button>
            {withTime && view === 'days' && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={!parsed.date}
                className="rounded-lg bg-Color-Primary-Primary px-3 py-1.5 text-xs font-semibold text-Color-Dark-Constant-Dark transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Tasdiqlash
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
