import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

export interface DateRange {
  from: Date | null;
  to:   Date | null;
}

interface Props {
  value:        DateRange;
  onChange:     (r: DateRange) => void;
  placeholder?: string;
}

const DAY_NAMES    = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const MONTHS       = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const MONTHS_SHORT = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

export default function DateRangePicker({ value, onChange, placeholder = 'Sana tanlang' }: Props) {
  const [open,     setOpen]     = useState(false);
  const [view,     setView]     = useState<'days' | 'months' | 'years'>('days');
  const [hover,    setHover]    = useState<Date | null>(null);
  const [month,    setMonth]    = useState(() => {
    const d = value.from ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [yearBase, setYearBase] = useState(() => Math.floor((value.from ?? new Date()).getFullYear() / 12) * 12);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const btnRef = useRef<HTMLButtonElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  const hasValue = !!(value.from || value.to);

  function openDropdown() {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const calH = 340;
    const top = window.innerHeight - r.bottom >= calH ? r.bottom + 6 : r.top - calH - 6;
    setPos({ top, left: r.left });
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
    if (view === 'years')  { setYearBase(y => y - 12); return; }
    const y = view === 'months' ? month.getFullYear() - 1 : month.getFullYear();
    const m = view === 'months' ? month.getMonth()        : month.getMonth() - 1;
    setMonth(new Date(y, m, 1));
  }

  function handleNavRight() {
    if (view === 'years')  { setYearBase(y => y + 12); return; }
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
      setHover(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  function getDays(): (Date | null)[] {
    const year = month.getFullYear();
    const mo   = month.getMonth();
    let startDow = new Date(year, mo, 1).getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: (Date | null)[] = Array(startDow).fill(null);
    const daysInMonth = new Date(year, mo + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, mo, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }

  function handleDayClick(day: Date) {
    const d = startOfDay(day);
    if (!value.from || (value.from && value.to)) {
      onChange({ from: d, to: null });
    } else {
      const from = startOfDay(value.from);
      if (d < from) {
        onChange({ from: d, to: from });
      } else {
        onChange({ from, to: d });
      }
      setOpen(false);
      setHover(null);
    }
  }

  function handleMonthSelect(moIndex: number) {
    setMonth(new Date(month.getFullYear(), moIndex, 1));
    setView('days');
  }

  function isFrom(day: Date)    { return value.from ? sameDay(day, value.from) : false; }
  function isTo(day: Date)      { return value.to   ? sameDay(day, value.to)   : false; }
  function isInRange(day: Date) {
    const d    = startOfDay(day);
    const from = value.from ? startOfDay(value.from) : null;
    if (!from) return false;
    const effectiveTo = value.to ?? hover;
    if (!effectiveTo) return false;
    const to = startOfDay(effectiveTo);
    const lo = from <= to ? from : to;
    const hi = from <= to ? to : from;
    return d > lo && d < hi;
  }

  function label() {
    if (value.from && value.to) return `${fmt(value.from)} – ${fmt(value.to)}`;
    if (value.from)             return `${fmt(value.from)} –`;
    return placeholder;
  }

  const days = getDays();

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={[
          'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors',
          hasValue
            ? 'border-Color-Primary-Primary bg-Color-Primary-Primary/5 text-Color-Grey-Grey-950'
            : 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 text-Color-Grey-Grey-950 hover:border-Color-Grey-Grey-400',
        ].join(' ')}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-Color-Grey-Grey-500" />
        <span className="whitespace-nowrap">{label()}</span>
        {hasValue && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange({ from: null, to: null }); }}
            className="ml-0.5 rounded p-0.5 text-Color-Grey-Grey-400 hover:bg-Color-Grey-Grey-200 hover:text-Color-Grey-Grey-950"
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
          onMouseLeave={() => setHover(null)}
        >
          {/* Navigation header */}
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

          {/* Year picker view */}
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

          {/* Month picker view */}
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

          {/* Day picker view */}
          {view === 'days' && (
            <>
              {/* Day name headers */}
              <div className="grid grid-cols-7 px-3">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-1.5 text-center text-[11px] font-semibold text-Color-Grey-Grey-500">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
                {days.map((day, i) => {
                  if (!day) return <div key={i} />;

                  const from_     = isFrom(day);
                  const to_       = isTo(day);
                  const range     = isInRange(day);
                  const today     = sameDay(day, new Date());
                  const isPending = value.from && !value.to && hover && sameDay(day, value.from);

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => { if (value.from && !value.to) setHover(day); }}
                      className={[
                        'flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium transition-colors',
                        (from_ || to_ || isPending)
                          ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark shadow-sm'
                          : range
                            ? 'bg-Color-Primary-Primary/15 text-Color-Grey-Grey-950'
                            : today
                              ? 'ring-2 ring-Color-Primary-Primary ring-offset-1 font-bold text-Color-Primary-Primary hover:bg-Color-Primary-Primary/10'
                              : 'text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-100',
                      ].join(' ')}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-Color-Grey-Grey-200 px-4 py-3">
                <span className="text-xs text-Color-Grey-Grey-600">
                  {value.from && value.to
                    ? `${fmt(value.from)} – ${fmt(value.to)}`
                    : value.from
                      ? `${fmt(value.from)} – tugash sanasini tanlang`
                      : ''}
                </span>
                <button
                  type="button"
                  onClick={() => { onChange({ from: null, to: null }); setOpen(false); }}
                  className="text-xs text-Color-Grey-Grey-500 transition-colors hover:text-Color-Danger-Danger-Accent"
                >
                  Tozalash
                </button>
              </div>
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
