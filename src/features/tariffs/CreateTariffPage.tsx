import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import TariffForm, { type TariffFormValues } from './components/TariffForm';

export default function CreateTariffPage() {
  const navigate = useNavigate();

  const handleSave = (values: TariffFormValues) => {
    console.log('[CreateTariffPage] new tariff payload:', values);
    // POST request will be wired here
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/10">
          <Plus className="h-5 w-5 text-brand-lime" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Yangi tarif</h1>
          <p className="mt-0.5 text-sm text-gray-400">Yangi obuna rejasini yarating</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Tarif ma'lumotlari</h2>
        </div>
        <div className="p-6">
          <TariffForm
            onSave={handleSave}
            onCancel={() => navigate('/payments/tariffs')}
          />
        </div>
      </div>
    </div>
  );
}
