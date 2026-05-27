import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Loader2, FileText, Eye, Trash2, Upload } from 'lucide-react';
import { createDocument, updateDocument, uploadDocumentFile, type DocumentPayload } from './hooks/useDocuments';
import { fileName, FileViewerContent } from './fileViewer';
import type { Document } from '@/types/documents';

// ─── Document type dropdown ───────────────────────────────────────────────────

const DOC_TYPES = [
  { value: 'terms_of_use',   label: 'Foydalanish shartlari' },
  { value: 'privacy_policy', label: 'Maxfiylik siyosati' },
];

function TypeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 });
  const btnRef          = useRef<HTMLButtonElement>(null);
  const selected        = DOC_TYPES.find((d) => d.value === value);

  const openDropdown = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); open ? setOpen(false) : openDropdown(); }}
        className="flex w-full items-center justify-between rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2.5 text-sm text-Color-Grey-Grey-950 outline-none transition-colors focus:border-Color-Grey-Grey-400"
      >
        <span className={selected ? 'text-Color-Grey-Grey-950' : 'text-Color-Grey-Grey-500'}>
          {selected?.label ?? 'Turini tanlang…'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-Color-Grey-Grey-500" />
      </button>

      {open && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="overflow-hidden rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-xl"
        >
          {DOC_TYPES.map((dt) => (
            <button
              key={dt.value}
              type="button"
              onMouseDown={() => { onChange(dt.value); setOpen(false); }}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-Color-Grey-Grey-50 ${
                dt.value === value ? 'text-Color-Primary-Primary' : 'text-Color-Grey-Grey-700'
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── File card (existing file) ────────────────────────────────────────────────

function FileCard({ url, onRemove }: { url: string; onRemove: () => void }) {
  const [previewing, setPreviewing] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2">
        <FileText className="h-4 w-4 shrink-0 text-Color-Primary-Primary" />
        <span className="flex-1 min-w-0 truncate font-mono text-xs text-Color-Grey-Grey-700" title={fileName(url)}>
          {fileName(url)}
        </span>
        <button
          type="button"
          onClick={() => setPreviewing(true)}
          className="rounded p-1 text-Color-Grey-Grey-500 hover:text-Color-Primary-Primary transition-colors"
          title="Ko'rish"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-Color-Grey-Grey-500 hover:text-Color-Danger-Danger-Accent transition-colors"
          title="O'chirish"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {previewing && createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewing(false)} />
          <div className="relative z-10 flex flex-col flex-1 overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-5 py-3 shrink-0">
              <span className="truncate text-sm font-medium text-Color-Grey-Grey-950">{fileName(url)}</span>
              <button onClick={() => setPreviewing(false)} className="rounded-lg p-1.5 text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-50 hover:text-Color-Grey-Grey-950">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-Color-Grey-Grey-50">
              <FileViewerContent url={url} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANGS = ['UZ', 'RU', 'EN'] as const;
type Lang = typeof LANGS[number];

function fileKey(lang: Lang) {
  return `files_${lang.toLowerCase()}` as 'files_uz' | 'files_ru' | 'files_en';
}

function docToForm(doc: Document): DocumentPayload {
  return {
    name_uz:       doc.name_uz ?? '',
    name_ru:       doc.name_ru ?? '',
    name_en:       doc.name_en ?? '',
    text_uz:       doc.text_uz ?? '',
    text_ru:       doc.text_ru ?? '',
    text_en:       doc.text_en ?? '',
    files_uz:      doc.files_uz?.length ? [...doc.files_uz] : [],
    files_ru:      doc.files_ru?.length ? [...doc.files_ru] : [],
    files_en:      doc.files_en?.length ? [...doc.files_en] : [],
    document_type: doc.document_type ?? [],
  };
}

const EMPTY: DocumentPayload = {
  name_uz: '', name_ru: '', name_en: '',
  text_uz: '', text_ru: '', text_en: '',
  files_uz: [], files_ru: [], files_en: [],
  document_type: [],
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface Props {
  doc?:    Document;
  onClose: () => void;
  onSaved: () => void;
}

export default function DocumentModal({ doc, onClose, onSaved }: Props) {
  const isEdit = !!doc;

  const [form,      setForm]      = useState<DocumentPayload>(() => doc ? docToForm(doc) : EMPTY);
  const [textTab,   setTextTab]   = useState<Lang>('UZ');
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState<string | null>(null);
  const [uploading, setUploading] = useState<Partial<Record<Lang, boolean>>>({});

  const setField = <K extends keyof DocumentPayload>(key: K, val: DocumentPayload[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const removeFile = (lang: Lang) => setField(fileKey(lang), []);
  const setFileUrl = (lang: Lang, url: string) => setField(fileKey(lang), url ? [url] : []);
  const getFileUrl = (lang: Lang) => form[fileKey(lang)][0] ?? '';

  const handleFileUpload = async (lang: Lang, file: File) => {
    setUploading((u) => ({ ...u, [lang]: true }));
    setErr(null);
    try {
      const url = await uploadDocumentFile(file);
      setFileUrl(lang, url);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Fayl yuklanmadi');
    } finally {
      setUploading((u) => ({ ...u, [lang]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.document_type.length) { setErr("Hujjat turini tanlang"); return; }
    setSaving(true);
    setErr(null);
    try {
      if (isEdit) {
        await updateDocument(doc.guid, form);
      } else {
        await createDocument(form);
      }
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">
            {isEdit ? 'Hujjatni tahrirlash' : 'Yangi hujjat'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-50 hover:text-Color-Grey-Grey-950">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
              Hujjat turi
            </label>
            <TypeDropdown
              value={form.document_type[0] ?? ''}
              onChange={(v) => setField('document_type', [v])}
            />
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Nomi</label>
            <div className="space-y-2">
              {LANGS.map((lang) => {
                const key = `name_${lang.toLowerCase()}` as 'name_uz' | 'name_ru' | 'name_en';
                return (
                  <div key={lang} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 rounded bg-Color-Grey-Grey-100 px-1.5 py-1 text-center font-mono text-[10px] font-bold text-Color-Grey-Grey-600">
                      {lang}
                    </span>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      placeholder={`Nomi (${lang})`}
                      className="flex-1 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Files */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Fayllar</label>
            <div className="space-y-2">
              {LANGS.map((lang) => {
                const url = getFileUrl(lang);
                return (
                  <div key={lang} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 rounded bg-Color-Grey-Grey-100 px-1.5 py-1 text-center font-mono text-[10px] font-bold text-Color-Grey-Grey-600">
                      {lang}
                    </span>
                    {url ? (
                      <div className="flex-1">
                        <FileCard url={url} onRemove={() => removeFile(lang)} />
                      </div>
                    ) : uploading[lang] ? (
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0 text-Color-Primary-Primary" />
                        <span className="text-xs text-Color-Grey-Grey-600">Yuklanmoqda…</span>
                      </div>
                    ) : (
                      <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-Color-Grey-Grey-300 bg-Color-Grey-Grey-50 px-3 py-2 text-xs text-Color-Grey-Grey-600 transition-colors hover:border-Color-Grey-Grey-400 hover:text-Color-Grey-Grey-950">
                        <Upload className="h-4 w-4 shrink-0" />
                        <span>Fayl tanlang…</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(lang, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Text (tabbed) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Matn</label>
              <div className="flex gap-1">
                {LANGS.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTextTab(lang)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      textTab === lang ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark' : 'text-Color-Grey-Grey-500 hover:text-Color-Grey-Grey-950'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            {LANGS.map((lang) => {
              const key = `text_${lang.toLowerCase()}` as 'text_uz' | 'text_ru' | 'text_en';
              return (
                <textarea
                  key={lang}
                  hidden={textTab !== lang}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={`Matn (${lang}) — Markdown qabul qilinadi`}
                  rows={8}
                  className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-3 py-2.5 font-mono text-xs text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400 resize-none"
                />
              );
            })}
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
