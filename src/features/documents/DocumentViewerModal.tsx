import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import { FileViewerContent } from './fileViewer';
import type { Document } from '@/types/documents';

const LANGS = [
  { code: 'UZ', key: 'files_uz' as const },
  { code: 'RU', key: 'files_ru' as const },
  { code: 'EN', key: 'files_en' as const },
];

interface Props {
  doc:     Document;
  onClose: () => void;
}

export default function DocumentViewerModal({ doc, onClose }: Props) {
  const firstAvailable = LANGS.find((l) => doc[l.key]?.[0]);
  const [tab, setTab] = useState(firstAvailable?.code ?? 'UZ');

  const currentLang = LANGS.find((l) => l.code === tab)!;
  const fileUrl = doc[currentLang.key]?.[0];

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 flex flex-col m-4 mt-6 flex-1 overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4 shrink-0">
          <h2 className="truncate text-base font-semibold text-Color-Grey-Grey-950">
            {doc.name_uz || doc.name_ru || doc.name_en || 'Hujjat'}
          </h2>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex gap-1">
              {LANGS.map(({ code, key }) => {
                const available = !!doc[key]?.[0];
                return (
                  <button
                    key={code}
                    onClick={() => available && setTab(code)}
                    disabled={!available}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-30 ${
                      tab === code ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark' : 'text-Color-Grey-Grey-500 hover:text-Color-Grey-Grey-950'
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>

            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-Color-Grey-Grey-200 px-3 py-1.5 text-xs font-medium text-Color-Grey-Grey-600 transition-colors hover:border-Color-Primary-Primary/40 hover:text-Color-Primary-Primary"
              >
                <ExternalLink className="h-3 w-3" />
                Yuklab olish
              </a>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-Color-Grey-Grey-500 hover:bg-Color-Grey-Grey-50 hover:text-Color-Grey-Grey-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-hidden bg-Color-Grey-Grey-50">
          {fileUrl
            ? <FileViewerContent url={fileUrl} />
            : <div className="flex h-full items-center justify-center text-sm text-Color-Grey-Grey-500">Bu tilda fayl mavjud emas</div>
          }
        </div>
      </div>
    </div>,
    document.body,
  );
}
