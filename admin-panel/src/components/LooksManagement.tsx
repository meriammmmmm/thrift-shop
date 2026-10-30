import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-wild-skylark-9834.fly.dev/api';

const OCCASIONS = [
  { id: 'casual', label: 'Casual Day', icon: 'fa-sun' },
  { id: 'work', label: 'Work / Office', icon: 'fa-briefcase' },
  { id: 'date', label: 'Date Night', icon: 'fa-heart' },
  { id: 'party', label: 'Party', icon: 'fa-glass-cheers' },
  { id: 'travel', label: 'Travel', icon: 'fa-plane' },
  { id: 'weekend', label: 'Weekend', icon: 'fa-leaf' },
  { id: 'formal', label: 'Formal Event', icon: 'fa-champagne-glasses' },
];

/**
 * Pull the first usable image out of whatever shape the column holds.
 *
 * Product images have been stored three different ways over the years: a real
 * array, a JSON-encoded array, and — for a batch of imported rows — a
 * JSON-encoded array that was then JSON-encoded *again*. The nested form
 * starts with a quote rather than a bracket, which is why those rows used to
 * render as a broken image.
 */
const firstImage = (images: any): string | null => {
  let value: any = images;

  for (let depth = 0; depth < 3; depth++) {
    if (Array.isArray(value)) {
      const first = value.find((entry) => typeof entry === 'string' && entry.trim());
      return typeof first === 'string' ? first.trim() : null;
    }

    if (typeof value !== 'string') return null;

    const raw = value.trim();
    if (!raw) return null;

    if (raw.startsWith('[') || raw.startsWith('"')) {
      try {
        value = JSON.parse(raw);
        continue;
      } catch {
        return null;
      }
    }

    return raw;
  }

  return null;
};

/**
 * The API serves a look's stored photo from its own path (`/looks/1/worn-image`).
 * The admin panel is served from a different origin, so that path has to be
 * made absolute before it is used as an image source.
 */
const absoluteUrl = (src: string | null | undefined): string | null => {
  if (!src) return null;
  if (src.startsWith('/')) return `${API_BASE_URL.replace(/\/$/, '')}${src}`;
  return src;
};

/** A photo already stored on the server — the path the API handed back. */
const isStoredPhoto = (src: string | null | undefined): boolean =>
  Boolean(src && src.startsWith('/looks/'));

interface LookPiece {
  product_id: number;
  name: string;
  price: number;
  category: string;
  color: string;
  image: string | null;
}

interface Look {
  id: number;
  name: string;
  occasion: string;
  tagline: string;
  worn_image: string;
  is_active: boolean;
  display_order: number;
  items: LookPiece[];
}

interface CatalogProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  color: string;
  image: string | null;
}

interface LooksManagementProps {
  authToken: string;
}

const emptyDraft = {
  id: 0,
  name: '',
  occasion: 'party',
  tagline: '',
  worn_image: '',
  is_active: true,
  display_order: 0,
  items: [] as number[],
};

type Draft = typeof emptyDraft;

const LooksManagement: React.FC<LooksManagementProps> = ({ authToken }) => {
  const [looks, setLooks] = useState<Look[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    }),
    [authToken]
  );

  const loadLooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/looks`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load looks (${res.status})`);
      const data = await res.json();
      setLooks((data.looks || []).map((l: any) => ({ ...l, is_active: l.is_active === true || l.is_active === 1 })));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Could not load looks');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products?limit=200`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.products || data;
      setCatalog(
        list.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category || '',
          color: p.color || '',
          image: firstImage(p.images),
        }))
      );
    } catch {
      /* picker simply stays empty */
    }
  }, [authHeaders]);

  useEffect(() => {
    loadLooks();
    loadCatalog();
  }, [loadLooks, loadCatalog]);

  /* ---------------------------------------------------------------- upload */

  const handleWornImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError('Please pick an image under 6 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => (prev ? { ...prev, worn_image: String(reader.result) } : prev));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  /* ----------------------------------------------------------------- save */

  const saveLook = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError('Give the look a name');
      return;
    }
    if (draft.items.length === 0) {
      setError('Add at least one piece to the look');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: draft.name,
        occasion: draft.occasion,
        tagline: draft.tagline,
        wornImage: draft.worn_image || null,
        isActive: draft.is_active,
        displayOrder: draft.display_order,
        items: draft.items,
      };

      const res = await fetch(
        draft.id ? `${API_BASE_URL}/looks/${draft.id}` : `${API_BASE_URL}/looks`,
        {
          method: draft.id ? 'PUT' : 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setDraft(null);
      setError(null);
      await loadLooks();
    } catch (err: any) {
      setError(err.message || 'Could not save the look');
    } finally {
      setSaving(false);
    }
  };

  const toggleLook = async (look: Look) => {
    try {
      const res = await fetch(`${API_BASE_URL}/looks/${look.id}/toggle`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Toggle failed');
      await loadLooks();
    } catch (err: any) {
      setError(err.message || 'Could not update visibility');
    }
  };

  const deleteLook = async (look: Look) => {
    if (!window.confirm(`Delete "${look.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/looks/${look.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      await loadLooks();
    } catch (err: any) {
      setError(err.message || 'Could not delete the look');
    }
  };

  /* ------------------------------------------------------------- helpers */

  const openCreate = () => {
    setError(null);
    setSearch('');
    setDraft({ ...emptyDraft });
  };

  const openEdit = (look: Look) => {
    setError(null);
    setSearch('');
    setDraft({
      id: look.id,
      name: look.name || '',
      occasion: look.occasion || 'party',
      tagline: look.tagline || '',
      worn_image: look.worn_image || '',
      is_active: look.is_active,
      display_order: look.display_order ?? 0,
      items: (look.items || []).map((i) => i.product_id),
    });
  };

  const pieceById = (id: number) => catalog.find((p) => p.id === id);
  const orderOf = (id: number) => draft?.items.indexOf(id) ?? -1;

  const toggleItem = (id: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const has = prev.items.includes(id);
      return { ...prev, items: has ? prev.items.filter((x) => x !== id) : [...prev.items, id] };
    });
  };

  const moveItem = (id: number, direction: -1 | 1) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      const index = items.indexOf(id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= items.length) return prev;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...prev, items };
    });
  };

  const filteredCatalog = catalog.filter((p) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.color.toLowerCase().includes(term)
    );
  });

  /* ------------------------------------------------------------------ UI */

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shop the Look</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a photo of the complete outfit being worn, then pick the pieces that make it up.
            Active looks appear in the storefront's &ldquo;The Complete Look&rdquo; section.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: '#731528' }}
        >
          <i className="fas fa-plus mr-2" /> New Look
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm py-10 text-center">Loading looks…</p>
      ) : looks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <i className="fas fa-tshirt text-4xl text-gray-300 mb-4 block" />
          <p className="text-gray-500">No looks yet.</p>
          <button onClick={openCreate} className="mt-4 text-sm font-medium" style={{ color: '#731528' }}>
            Create your first look
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {looks.map((look) => (
            <div key={look.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative aspect-[4/5] bg-gray-100">
                {look.worn_image ? (
                  <img src={absoluteUrl(look.worn_image) || ''} alt={look.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <i className="fas fa-image text-3xl mb-2" />
                    <span className="text-xs">No outfit photo yet</span>
                  </div>
                )}
                <span
                  className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white ${
                    look.is_active ? 'bg-green-600' : 'bg-gray-500'
                  }`}
                >
                  {look.is_active ? 'Live' : 'Hidden'}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{look.name}</h3>
                {look.tagline && <p className="text-xs text-gray-500 mt-0.5">{look.tagline}</p>}

                <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-3 mb-2">
                  {look.items.length} {look.items.length === 1 ? 'piece' : 'pieces'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {look.items.map((item) => (
                    <span
                      key={item.product_id}
                      title={item.name}
                      className="w-9 h-11 rounded overflow-hidden bg-gray-100 border border-gray-200"
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : null}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEdit(look)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleLook(look)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50"
                  >
                    {look.is_active ? 'Hide' : 'Publish'}
                  </button>
                  <button
                    onClick={() => deleteLook(look)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------ modal */}
      {draft && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {draft.id ? 'Edit look' : 'New look'}
              </h2>
              <button onClick={() => setDraft(null)} className="text-gray-400 hover:text-gray-700">
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* ---------------------------------------------- outfit photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo of the complete outfit being worn
                </label>
                <div className="flex gap-4">
                  <div className="w-40 h-52 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    {draft.worn_image ? (
                      <img src={absoluteUrl(draft.worn_image) || ''} alt="Outfit preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <i className="fas fa-user-dress text-3xl" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block">
                      <span className="inline-block px-4 py-2 rounded-lg text-sm border border-gray-300 cursor-pointer hover:bg-gray-50">
                        <i className="fas fa-upload mr-2" /> Upload photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleWornImageUpload(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <input
                      type="url"
                      value={draft.worn_image.startsWith('data:') || isStoredPhoto(draft.worn_image) ? '' : draft.worn_image}
                      onChange={(e) => setDraft({ ...draft, worn_image: e.target.value })}
                      placeholder="…or paste an image URL"
                      className="mt-3 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                    {isStoredPhoto(draft.worn_image) && (
                      <p className="text-xs text-gray-500 mt-2">
                        A photo is already uploaded for this look — upload a new one to replace it.
                      </p>
                    )}
                    {draft.worn_image && (
                      <button
                        onClick={() => setDraft({ ...draft, worn_image: '' })}
                        className="mt-2 text-xs text-red-600 hover:underline"
                      >
                        Remove photo
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      Without a photo the storefront composes a flat-lay from the individual pieces instead.
                    </p>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Look name</label>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. After-Dark Black"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
                  <select
                    value={draft.occasion}
                    onChange={(e) => setDraft({ ...draft, occasion: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    {OCCASIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  value={draft.tagline}
                  onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                  placeholder="One line describing the vibe"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              {/* ------------------------------------------------- the pieces */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  The pieces in this look
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {draft.items.length} selected — use the arrows to set the wear order
                  </span>
                </label>

                {draft.items.length > 0 && (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-3">
                    {draft.items.map((id, index) => {
                      const product = pieceById(id);
                      return (
                        <div key={id} className="flex items-center gap-3 p-2">
                          <span className="text-xs text-gray-400 w-5 text-center">{index + 1}</span>
                          <div className="w-8 h-10 rounded overflow-hidden bg-gray-100 shrink-0">
                            {product?.image && (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-800 truncate">{product?.name || `Product #${id}`}</p>
                            <p className="text-xs text-gray-400">
                              {product?.category || '—'} · {product?.color || '—'}
                            </p>
                          </div>
                          <button
                            onClick={() => moveItem(id, -1)}
                            disabled={index === 0}
                            className="w-7 h-7 rounded border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-50"
                            aria-label="Move up"
                          >
                            <i className="fas fa-arrow-up" />
                          </button>
                          <button
                            onClick={() => moveItem(id, 1)}
                            disabled={index === draft.items.length - 1}
                            className="w-7 h-7 rounded border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-50"
                            aria-label="Move down"
                          >
                            <i className="fas fa-arrow-down" />
                          </button>
                          <button
                            onClick={() => toggleItem(id)}
                            className="w-7 h-7 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50"
                            aria-label="Remove piece"
                          >
                            <i className="fas fa-times" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name, category or colour…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mb-3"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                  {filteredCatalog.length === 0 && (
                    <p className="text-xs text-gray-400 col-span-full py-4 text-center">
                      {catalog.length === 0 ? 'Loading products…' : 'No products match that search.'}
                    </p>
                  )}
                  {filteredCatalog.map((product) => {
                    const selected = draft.items.includes(product.id);
                    const position = orderOf(product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleItem(product.id)}
                        className={`text-left rounded-lg overflow-hidden border-2 transition-all ${
                          selected ? 'border-[#731528] shadow-md' : 'border-transparent hover:border-gray-300'
                        }`}
                        title={product.name}
                      >
                        <div className="relative aspect-[3/4] bg-gray-100">
                          {product.image && (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          )}
                          {selected && (
                            <span
                              className="absolute top-1 right-1 w-5 h-5 rounded-full text-white text-[11px] grid place-items-center"
                              style={{ backgroundColor: '#731528' }}
                            >
                              {position + 1}
                            </span>
                          )}
                        </div>
                        <div className="p-1.5">
                          <p className="text-[11px] text-gray-700 leading-tight line-clamp-2">{product.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                Show this look on the storefront
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setDraft(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveLook}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: '#731528' }}
              >
                {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Create look'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LooksManagement;