// Outfit builder storage — localStorage based so it works without backend changes.
// Each outfit is a user-created combination of products with a name and optional description.

import { Product } from '../app/types';

export interface OutfitItem {
  id: number;          // product id
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  size: string;
}

export interface Outfit {
  id: string;          // local uuid
  name: string;
  description?: string;
  occasion?: string;   // optional vibe tag: "Casual", "Date Night", "Work", etc.
  items: OutfitItem[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'mery-rose-outfits-v1';

function readAll(): Outfit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(outfits: Outfit[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));
    // Fire a storage event so other components / tabs update in sync.
    window.dispatchEvent(new CustomEvent('mery-rose:outfits-changed'));
  } catch {
    // ignore quota errors
  }
}

function uid(): string {
  return 'outfit_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function productToOutfitItem(p: Product): OutfitItem {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.images && p.images.length > 0 ? p.images[0] : '',
    category: p.category,
    size: p.size,
  };
}

export function getAllOutfits(): Outfit[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getOutfit(id: string): Outfit | undefined {
  return readAll().find((o) => o.id === id);
}

export function createOutfit(name: string, items: OutfitItem[], opts?: { description?: string; occasion?: string }): Outfit {
  const now = Date.now();
  const outfit: Outfit = {
    id: uid(),
    name: name.trim() || 'Untitled outfit',
    description: opts?.description?.trim() || undefined,
    occasion: opts?.occasion?.trim() || undefined,
    items: items.filter((it) => Boolean(it && it.id)),
    createdAt: now,
    updatedAt: now,
  };
  const all = readAll();
  all.push(outfit);
  writeAll(all);
  return outfit;
}

export function updateOutfit(id: string, patch: Partial<Pick<Outfit, 'name' | 'description' | 'occasion' | 'items'>>): Outfit | undefined {
  const all = readAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  const updated: Outfit = {
    ...all[idx],
    ...patch,
    id: all[idx].id,
    createdAt: all[idx].createdAt,
    updatedAt: Date.now(),
  };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteOutfit(id: string): void {
  const all = readAll().filter((o) => o.id !== id);
  writeAll(all);
}

export function addItemToOutfit(outfitId: string, item: OutfitItem): Outfit | undefined {
  const outfit = getOutfit(outfitId);
  if (!outfit) return undefined;
  // Avoid duplicates
  if (outfit.items.some((i) => i.id === item.id)) return outfit;
  return updateOutfit(outfitId, { items: [...outfit.items, item] });
}

export function removeItemFromOutfit(outfitId: string, itemId: number): Outfit | undefined {
  const outfit = getOutfit(outfitId);
  if (!outfit) return undefined;
  const next = outfit.items.filter((i) => i.id !== itemId);
  return updateOutfit(outfitId, { items: next });
}

export function outfitTotal(outfit: Outfit): number {
  return outfit.items.reduce((sum, it) => sum + (it.price || 0), 0);
}

export function outfitSavings(outfit: Outfit): number {
  return outfit.items.reduce((sum, it) => {
    if (it.originalPrice && it.originalPrice > it.price) {
      return sum + (it.originalPrice - it.price);
    }
    return sum;
  }, 0);
}

// Built-in occasion suggestions shown in the picker.
export const OCCASION_OPTIONS = [
  { id: 'casual',    label: 'Casual Day',   icon: '☀️' },
  { id: 'work',      label: 'Work / Office', icon: '💼' },
  { id: 'date',      label: 'Date Night',   icon: '🌹' },
  { id: 'party',     label: 'Party',        icon: '🎉' },
  { id: 'travel',    label: 'Travel',       icon: '✈️' },
  { id: 'weekend',   label: 'Weekend',      icon: '🌿' },
  { id: 'formal',    label: 'Formal Event', icon: '🥂' },
];