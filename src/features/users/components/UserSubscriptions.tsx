import { ChevronRight } from 'lucide-react';

// userId will be wired to real API later
const MOCK = {
  type:         'Pay As You Go',
  amount:       '20 000 so\'m',
  startDate:    '03.03.2026',
  nextPayment:  '20.04.2026',
  autoPayment:  'Yoqilgan',
  notifications:'Yoqilgan',
};

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-dark-surface p-4">
      <p className="mb-1.5 text-xs text-gray-500">{label}</p>
      <div className="text-sm font-medium text-white">{children}</div>
    </div>
  );
}

export function UserSubscriptions({ userId: _userId }: { userId: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-dark-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-border bg-gray-900/40 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Obuna holati</h3>
        <button className="inline-flex items-center gap-1 rounded-lg bg-[#D1F22D] px-3 py-1 text-xs font-semibold text-black transition-opacity hover:opacity-90">
          Batafsil <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* 2×3 grid separated by 1px dividers */}
      <div className="grid grid-cols-2 gap-px bg-gray-800">
        <Cell label="Obuna turi">
          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            {MOCK.type}
          </span>
        </Cell>
        <Cell label="Obuna summasi">{MOCK.amount}</Cell>
        <Cell label="Obunaga ulangan sana">{MOCK.startDate}</Cell>
        <Cell label="Keyingi to'lov sanasi">{MOCK.nextPayment}</Cell>
        <Cell label="Avtomatik to'lov">{MOCK.autoPayment}</Cell>
        <Cell label="Bildirishnomalar">{MOCK.notifications}</Cell>
      </div>
    </div>
  );
}
