'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';

type Category = 'tops' | 'bottoms' | 'one-pieces';

interface TryOnProduct {
  id: number;
  name: string;
  category: string;
  images: string[];
}

// Map a free-text product category to one of FASHN's three buckets.
function toFashnCategory(raw: string): Category {
  const c = (raw || '').toLowerCase();
  if (/(dress|gown|jumpsuit|romper|one-?piece|swimsuit|cheongsam|bodysuit|set)/.test(c)) {
    return 'one-pieces';
  }
  if (/(skirt|short|pant|trouser|jean|legging|bottom)/.test(c)) {
    return 'bottoms';
  }
  return 'tops';
}

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
  const [category, setCategory] = useState<Category>('one-pieces');
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getProducts({ companyId: 2, limit: 100 });
        const list = (res?.products || []).filter(
          (p: TryOnProduct) => Array.isArray(p.images) && p.images.length > 0,
        );
        setProducts(list);
      } catch {
        // non-fatal; user can still upload but won't have products
      }
    })();
  }, []);

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
    setCategory(toFashnCategory(p.category));
    setResult(null);
    setStatus('idle');
    setMessage('');
  };

  const runTryOn = useCallback(async () => {
    if (!selfie || !selected) return;
    setStatus('running');
    setResult(null);
    setMessage('Creating your try-on… this usually takes 10–20 seconds.');

    try {
      const res = await fetch(
        'https://thrift-shop-backend-production.up.railway.app/api/tryon',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_image: selfie,
            garment_image: selected.images[0],
            category,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || data.error || !data.image) {
        throw new Error(data?.error || 'The try-on could not be generated. Try another photo.');
      }
      setResult(data.image);
      setStatus('done');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }, [selfie, selected, category]);

  const canRun = selfie && selected && status !== 'running';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <a href="/products" className="text-sm text-[#8B1538] hover:underline">← Back to shop</a>
        <h1 className="text-3xl font-serif text-gray-900 mt-3">Virtual Try-On</h1>
        <p className="text-gray-500 mb-8">Upload your photo, pick an item, and see it on you.</p>

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
                  <span className="text-gray-400 text-sm text-center px-4">Tap to upload a full-body photo</span>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
            </label>
            <p className="text-xs text-gray-400 mt-2">Best results: a clear, front-facing, full-body photo.</p>
          </div>

          {/* Step 2: product */}
          <div className="border rounded-2xl p-4">
            <h2 className="font-semibold mb-3">2. Pick an item</h2>
            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProduct(p)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                    selected?.id === p.id ? 'border-[#8B1538]' : 'border-transparent hover:border-gray-200'
                  }`}
                  title={p.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {selected && (
              <div className="mt-3 text-sm">
                <p className="font-medium truncate">{selected.name}</p>
                <label className="text-xs text-gray-500 block mt-2">Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full border rounded-lg px-2 py-1 text-sm mt-1"
                >
                  <option value="tops">Top</option>
                  <option value="bottoms">Bottom</option>
                  <option value="one-pieces">Dress / one-piece</option>
                </select>
              </div>
            )}
          </div>

          {/* Step 3: result */}
          <div className="border rounded-2xl p-4">
            <h2 className="font-semibold mb-3">3. Result</h2>
            <div className="aspect-[3/4] rounded-xl border flex items-center justify-center overflow-hidden bg-gray-50">
              {status === 'running' && (
                <div className="text-center px-4">
                  <div className="w-8 h-8 border-2 border-[#8B1538] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-gray-500">{message}</p>
                </div>
              )}
              {status !== 'running' && result && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result} alt="Try-on result" className="w-full h-full object-cover" />
              )}
              {status !== 'running' && !result && (
                <span className="text-gray-400 text-sm text-center px-4">Your try-on will appear here.</span>
              )}
            </div>
            {result && (
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-[#8B1538] hover:underline mt-2"
              >
                Open full size
              </a>
            )}
          </div>
        </div>

        {message && status === 'error' && (
          <p className="text-red-600 text-sm mt-4">{message}</p>
        )}

        <button
          onClick={runTryOn}
          disabled={!canRun}
          className="mt-8 w-full md:w-auto px-8 py-3 rounded-full text-white font-semibold transition disabled:opacity-40"
          style={{ backgroundColor: '#8B1538' }}
        >
          {status === 'running' ? 'Generating…' : 'Try it on me'}
        </button>
        {(!selfie || !selected) && (
          <p className="text-xs text-gray-400 mt-2">Add your photo and pick an item to enable the button.</p>
        )}
      </div>
    </div>
  );
}
