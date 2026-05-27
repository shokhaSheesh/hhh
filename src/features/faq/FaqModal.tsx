import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { createFaq, updateFaq, type FaqPayload } from './hooks/useFaq';
import type { Faq } from '@/types/faq';

const LANGS = ['UZ', 'RU', 'EN'] as const;
type Lang = typeof LANGS[number];

function faqToForm(faq: Faq): FaqPayload {
  return {
    question_uz: faq.question_uz ?? '',
    question_ru: faq.question_ru ?? '',
    question_en: faq.question_en ?? '',
    answer_uz:   faq.answer_uz   ?? '',
    answer_ru:   faq.answer_ru   ?? '',
    answer_en:   faq.answer_en   ?? '',
  };
}

const EMPTY: FaqPayload = {
  question_uz: '', question_ru: '', question_en: '',
  answer_uz:   '', answer_ru:   '', answer_en:   '',
};

interface Props {
  faq?:    Faq;
  onClose: () => void;
  onSaved: () => void;
}

export default function FaqModal({ faq, onClose, onSaved }: Props) {
  const isEdit = !!faq;

  const [form,   setForm]   = useState<FaqPayload>(() => faq ? faqToForm(faq) : EMPTY);
  const [tab,    setTab]    = useState<Lang>('UZ');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  const setField = <K extends keyof FaqPayload>(key: K, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const qKey = `question_${tab.toLowerCase()}` as keyof FaqPayload;
  const aKey = `answer_${tab.toLowerCase()}`   as keyof FaqPayload;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question_uz && !form.question_ru && !form.question_en) {
      setErr('Kamida bitta tilda savol kiriting');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      if (isEdit) {
        await updateFaq(faq.guid, form);
      } else {
        await createFaq(form);
      }
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Xatolik yuz berdi');
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">
            {isEdit ? 'FAQ tahrirlash' : 'Yangi FAQ'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-50 hover:text-Color-Grey-Grey-950">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Lang tabs */}
          <div className="flex gap-1 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 p-1">
            {LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setTab(lang)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  tab === lang ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark' : 'text-Color-Grey-Grey-500 hover:text-Color-Grey-Grey-950'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Question */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Savol ({tab})
            </label>
            <input
              type="text"
              value={form[qKey]}
              onChange={(e) => setField(qKey, e.target.value)}
              placeholder={`Savol matnini kiriting…`}
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400"
            />
          </div>

          {/* Answer */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Javob ({tab})
            </label>
            <textarea
              value={form[aKey]}
              onChange={(e) => setField(aKey, e.target.value)}
              placeholder={`Javob matnini kiriting…`}
              rows={6}
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2.5 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400 resize-none"
            />
          </div>

          {err && (
            <p className="rounded-xl border border-Color-Danger-Danger-Accent bg-Color-Danger-Danger-Soft px-3 py-2.5 text-sm text-Color-Danger-Danger-Accent">{err}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-Color-Grey-Grey-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-medium text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-Color-Primary-Primary px-4 py-2 text-sm font-semibold text-Color-Dark-Constant-Dark disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Saqlash' : "Qo'shish"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
