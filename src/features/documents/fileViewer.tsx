const OFFICE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];
const IMAGE_EXTS  = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];

export function fileExt(url: string): string {
  try {
    const path = new URL(url).pathname;
    // strip UUID prefix like "abc123_filename.docx"
    const name = path.split('/').pop() ?? '';
    return name.replace(/^[0-9a-f-]{36}_/i, '').split('.').pop()?.toLowerCase() ?? '';
  } catch {
    return url.split('.').pop()?.toLowerCase() ?? '';
  }
}

export function fileName(url: string): string {
  try {
    const name = decodeURIComponent(url.split('/').pop() ?? url);
    return name.replace(/^[0-9a-f-]{36}_/i, '');
  } catch {
    return url;
  }
}

type ViewerType = 'image' | 'pdf' | 'office' | 'google' | 'none';

export function viewerType(url: string): ViewerType {
  if (!url) return 'none';
  const ext = fileExt(url);
  if (IMAGE_EXTS.includes(ext))  return 'image';
  if (ext === 'pdf')             return 'pdf';
  if (OFFICE_EXTS.includes(ext)) return 'office';
  return 'google';
}

export function buildViewerUrl(url: string): string | null {
  const type = viewerType(url);
  if (type === 'office') return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  if (type === 'google') return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  return null; // pdf and image are rendered directly
}

// ─── Shared viewer content (renders inside any container) ─────────────────────

export function FileViewerContent({ url }: { url: string }) {
  const type = viewerType(url);
  const ext  = fileExt(url).toUpperCase() || 'FAYL';

  if (type === 'none') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-Color-Grey-Grey-500">
        Fayl mavjud emas
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="flex h-full items-center justify-center bg-Color-Grey-Grey-50 p-4">
        <img
          src={url}
          alt=""
          className="max-h-full max-w-full object-contain rounded-lg"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = 'none';
            el.parentElement!.insertAdjacentHTML(
              'beforeend',
              `<p class="text-sm text-Color-Grey-Grey-600">Rasm yuklanmadi. <a href="${url}" target="_blank" class="underline text-Color-Primary-Primary">Yuklab olish</a></p>`,
            );
          }}
        />
      </div>
    );
  }

  if (type === 'pdf') {
    return (
      <div className="relative h-full w-full">
        <iframe key={url} src={url} className="h-full w-full border-0" title="PDF" />
        {/* fallback shown via absolute overlay if iframe fails — handled by download link in header */}
      </div>
    );
  }

  // office or google viewer — iframes don't fire onerror, so we show a persistent
  // download fallback below the iframe so the user always has an escape hatch.
  const src = buildViewerUrl(url)!;
  return (
    <div className="flex h-full flex-col">
      <iframe key={url} src={src} className="flex-1 w-full border-0" title="Fayl ko'rinishi" />
      <div className="shrink-0 border-t border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-2 text-center">
        <span className="text-xs text-Color-Grey-Grey-600">
          Ko&apos;rinish ishlamasa —{' '}
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-Color-Primary-Primary underline">
            {ext} faylni yuklab oling
          </a>
        </span>
      </div>
    </div>
  );
}
