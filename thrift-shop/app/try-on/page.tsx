'use client';

/**
 * ============================================================
 *  VIRTUAL FITTING ROOM — Mery Rose
 * ============================================================
 *  A customer uploads a photo, picks a piece from the catalogue
 *  and sees it on themselves.
 *
 *  The important part is the GARMENT TYPE. The try-on models are
 *  told which part of the body to replace ("upper", "lower" or
 *  "overall"); without that, a dress comes back looking like a
 *  top. The type is detected from the product's category and name
 *  (lib/garments.ts) and can be corrected by the customer.
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { classifyGarment, garmentHint } from '../../lib/garments';
import { type Mask, resultMatchesType } from '../../lib/tryon-mask';

type Status = 'idle' | 'running' | 'done' | 'error';

interface TryOnProduct {
  id: number;
  name: string;
  brand?: string;
  category: string;
  images: string[];
}

const COMPANY_ID = Number(process.env.NEXT_PUBLIC_COMPANY_ID || 2);

const MASK_LABELS: Record<Mask, string> = {
  upper: 'Top / jacket',
  lower: 'Skirt / trousers',
  overall: 'Dress / one-piece',
  accessory: 'Accessory',
};

/** The chips above the product grid. */
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Dresses', label: 'Dresses' },
  { id: 'Tops', label: 'Tops' },
  { id: 'Bottoms', label: 'Bottoms' },
  { id: 'Shoes', label: 'Shoes' },
  { id: 'Bags', label: 'Bags' },
  { id: 'Accessories', label: 'Accessories' },
];

// Downscale a selfie to keep the upload small and fast (max 1024px).
function fileToDataUrl(file: File, maxSize = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

export default function TryOnPage() {
  const [products, setProducts] = useState<TryOnProduct[]>([]);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selected, setSelected] = useState<TryOnProduct | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  /** null = use what we detected; otherwise the customer overrides it. */
  const [override, setOverride] = useState<Mask | null>(null);
  const [split, setSplit] = useState(50);

  const compareRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getProducts({ companyId: COMPANY_ID, limit: 120 });
        const list = (res?.products || []).filter(
          (p: TryOnProduct) => Array.isArray(p.images) && p.images.length > 0,
        );
        setProducts(list);
      } catch {
        // non-fatal; the customer can still upload a photo
      }
    })();
  }, []);

  /** What kind of garment is this? Detected from category + name. */
  const detected = useMemo(
    () => (selected ? classifyGarment(selected.category, selected.name) : null),
    [selected],
  );

  /** The mask we actually send to the model. */
  const mask: Mask | null = override ?? detected?.mask ?? null;

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filter !== 'all' && !(p.category || '').toLowerCase().includes(filter.toLowerCase())) {
        return false;
      }
      if (!term) return true;
      return (
        (p.name || '').toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)
      );
    });
  }, [products, filter, search]);

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setSelfie(dataUrl);
      setResult(null);
      setStatus('idle');
      setMessage('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not load that photo.');
    }
  };

  const pickProduct = (p: TryOnProduct) => {
    setSelected(p);
    setOverride(null);
    setResult(null);
    setStatus('idle');
    setMessage('');
  };

  /**
   * Run the try-on.
   *
   * The same-origin route ships with the frontend, so it is always the
   * current version; the shared backend is the fallback for deployments
   * where the route is cut short by a platform timeout.
   */
  const runTryOn = useCallback(async () => {
    if (!selfie || !selected || !mask) return;

    setStatus('running');
    setResult(null);
    setMessage('Creating your try-on… the free GPU usually takes 10–30 seconds.');

    const payload = {
      model_image: selfie,
      garment_image: selected.images[0],
      // The mask tells the model which part of the body to replace:
      // 'upper' | 'lower' | 'overall'. Without it a dress comes back a top.
      garment_type: mask,
      garment_description: [selected.name, selected.brand].filter(Boolean).join(' '),
    };

    try {
      let image: string | null = null;
      let failure: Error | null = null;

      /**
       * A result is only acceptable if it was really fitted with the
       * garment type we asked for. A service that answers with "upper" for
       * a dress has painted the torso only — showing that picture would be
       * worse than an error, because the customer would see their dress
       * rendered as a top and think the whole thing is broken.
       */
      const accept = (data: unknown): string | null => {
        const d = data as { image?: string; applied_type?: string; error?: string } | null;
        if (!d?.image) return null;
        if (!resultMatchesType(mask, d.applied_type)) return null;
        return d.image;
      };

      try {
        const res = await fetch('/api/tryon/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        image = accept(data);
        if (!image) {
          const d = data as { error?: string; applied_type?: string };
          failure = new Error(
            d?.applied_type
              ? 'The try-on came back fitted to the wrong part of the body. Please try again.'
              : d?.error || 'The try-on service did not answer.',
          );
        }
      } catch (err) {
        failure = err instanceof Error ? err : new Error('Try-on failed.');
      }

      if (!image) {
        try {
          const res = await api.tryOn(payload);
          image = accept(res);
          if (!image && !failure) failure = new Error('The try-on came back empty.');
        } catch (err) {
          failure = err instanceof Error ? err : failure;
        }
      }

      if (!image) throw failure || new Error('Try-on failed.');

      setResult(image);
      setStatus('done');
      setMessage('');
      setSplit(50);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }, [selfie, selected, mask]);

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `mery-rose-try-on-${selected?.id ?? 'result'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* --- before / after comparison handle --- */
  const updateSplit = (clientX: number) => {
    const el = compareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(100, Math.max(0, pct)));
  };

  const onCompareDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateSplit(e.clientX);
  };

  const onCompareMove = (e: React.PointerEvent) => {
    if (draggingRef.current) updateSplit(e.clientX);
  };

  const onCompareUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const reset = () => {
    setResult(null);
    setStatus('idle');
    setMessage('');
    setSplit(50);
  };

  const blocked = detected ? !detected.supported : false;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm bg-white">
        <div
          className="text-center py-2 px-4 text-xs sm:text-sm font-medium luxury-shimmer text-white overflow-hidden"
          style={{ backgroundColor: '#8B1538' }}
        >
          <span className="inline-block">✨ Next Drop: Friday at 21:00 Tunis Time ✨</span>
        </div>
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-1 sm:gap-3 md:gap-6 h-20 sm:h-24 md:h-28 lg:h-32">
              <div className="flex items-center space-x-1.5 sm:space-x-3 md:space-x-6">
                <button
                  onClick={() => (window.location.href = '/products')}
                  className="text-[9px] sm:text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors whitespace-nowrap tracking-wide"
                >
                  SHOP
                </button>
                <button
                  onClick={() => (window.location.href = '/try-on')}
                  className="text-[9px] sm:text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors whitespace-nowrap tracking-wide"
                >
                  TRY-ON
                </button>
              </div>

              <div
                onClick={() => (window.location.href = '/')}
                className="flex items-center justify-center hover:opacity-90 transition-opacity duration-300 cursor-pointer flex-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/mery-rose-logo.png"
                  alt="Mery Rose"
                  className="w-28 sm:w-44 md:w-56 lg:w-72 h-auto object-contain"
                />
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                <button
                  onClick={() => (window.location.href = '/products')}
                  className="text-[9px] sm:text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors whitespace-nowrap tracking-wide"
                >
                  BACK TO SHOP
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-gray-900">Virtual Fitting Room</h1>
        <p className="text-gray-500 mb-8">
          Upload your photo, pick an item, and see it on you.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Step 1: photo */}
          <div className="border rounded-2xl p-4">
            <h2 className="font-semibold mb-3">1. Your photo</h2>
            <label className="block cursor-pointer">
              <div className="aspect-[3/4] rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 transition">
                {selfie ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selfie} alt="Your photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm text-center px-4">
                    Tap to upload a full-body photo
                  </span>
                )}
              </div>
              {/* A real, visible control — the dashed area alone is easy to miss. */}
              <input
                type="file"
                accept="image/*"
                onChange={onPickPhoto}
                className="mt-3 block w-full text-xs text-gray-500 cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-[#8B1538] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:opacity-90"
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Best results: a clear, front-facing, full-body photo.
            </p>
          </div>

          {/* Step 2: product */}
          <div className="border rounded-2xl p-4">
            <h2 className="font-semibold mb-3">2. Pick an item</h2>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dresses, tops, brands…"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-[#8B1538]"
            />

            <div className="flex flex-wrap gap-1.5 mb-3">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
                    filter === f.id
                      ? 'bg-[#8B1538] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {visibleProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProduct(p)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                    selected?.id === p.id
                      ? 'border-[#8B1538]'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                  title={p.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                </button>
              ))}
              {visibleProducts.length === 0 && (
                <p className="col-span-3 text-sm text-gray-400 py-6 text-center">
                  {products.length === 0 && !search && filter === 'all'
                    ? 'Loading the collection…'
                    : 'No pieces match that search.'}
                </p>
              )}
            </div>

            {selected && detected && (
              <div className="mt-3 text-sm border-t pt-3">
                <p className="font-medium truncate">{selected.name}</p>
                {selected.brand && (
                  <p className="text-[11px] uppercase tracking-wider text-gray-400">
                    {selected.brand}
                  </p>
                )}

                <div
                  className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: detected.supported ? '#8B1538' : '#6b7280',
                    color: '#fff',
                  }}
                >
                  {detected.label}
                  <span className="font-normal normal-case opacity-90">
                    {garmentHint(detected)}
                  </span>
                </div>

                {detected.supported ? (
                  <>
                    <label className="text-xs text-gray-500 block mt-3">Fit as</label>
                    <select
                      value={mask ?? 'upper'}
                      onChange={(e) => setOverride(e.target.value as Mask)}
                      className="w-full border rounded-lg px-2 py-1 text-sm mt-1"
                    >
                      {(Object.keys(MASK_LABELS) as Mask[]).map((m) => (
                        <option key={m} value={m}>
                          {MASK_LABELS[m]}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">
                      We detected this from the product name. Change it if we got it wrong.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    {garmentHint(detected)} Pick a dress, top, bottom or jacket instead.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 3: result */}
          <div className="border rounded-2xl p-4">
            <h2 className="font-semibold mb-3">3. Result</h2>

            {status === 'running' && (
              <div className="aspect-[3/4] rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center px-4">
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-[#8B1538] animate-spin" />
                <p className="text-sm text-gray-600 mt-3">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="aspect-[3/4] rounded-xl bg-red-50 border border-red-100 flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm text-red-700">{message}</p>
                <button
                  onClick={runTryOn}
                  className="mt-4 px-5 py-2 rounded-full bg-[#8B1538] text-white text-sm font-semibold hover:opacity-90"
                >
                  Try again
                </button>
              </div>
            )}

            {status !== 'running' && status !== 'error' && result && selfie && (
              <>
                <div
                  ref={compareRef}
                  onPointerDown={onCompareDown}
                  onPointerMove={onCompareMove}
                  onPointerUp={onCompareUp}
                  onPointerCancel={onCompareUp}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 select-none touch-none cursor-ew-resize"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result} alt="Your try-on" className="absolute inset-0 w-full h-full object-cover" />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selfie} alt="Your photo" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                    style={{ left: `${split}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-[10px] font-bold text-gray-700"
                    style={{ left: `${split}%` }}
                  >
                    ↔
                  </div>
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/55 text-white px-2 py-1 rounded-full">
                    BEFORE
                  </span>
                  <span className="absolute top-2 right-2 text-[10px] font-semibold bg-[#8B1538] text-white px-2 py-1 rounded-full">
                    AFTER
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={download}
                    className="flex-1 px-4 py-2 rounded-full bg-[#8B1538] text-white text-sm font-semibold hover:opacity-90"
                  >
                    Download
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Try another piece
                  </button>
                </div>
              </>
            )}

            {status === 'idle' && !result && (
              <div className="aspect-[3/4] rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm text-gray-500">
                  Your result will appear here.
                </p>
              </div>
            )}

            {status === 'idle' && (
              <button
                onClick={runTryOn}
                disabled={!selfie || !selected || !mask || blocked}
                className="w-full mt-3 px-4 py-3 rounded-full bg-[#8B1538] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Try it on me
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
          Runs on a free shared GPU (CatVTON virtual try-on) — nothing to pay, but the free daily
          quota is small, so a try-on may take up to a minute or briefly fail while the GPU is
          busy.
        </p>
      </div>
    </div>
  );
}
