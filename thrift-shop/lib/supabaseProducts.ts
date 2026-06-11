// Reads product + company data directly from Supabase (PostgREST Data API).
// Only product READS go through here; cart/orders/auth still use the backend API.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oiwvvxyewszwwfnvsnza.supabase.co';

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_D4ikc6D7BJTYDL39P6WMew_hrx8jrtN';

// This Supabase project holds a single store's catalog (Mery Rose = company 2).
// The old deployment sometimes requests company 1 (which has no products), so we
// pin the storefront to this id. Override with NEXT_PUBLIC_STORE_COMPANY_ID if needed.
const STORE_COMPANY_ID = Number(process.env.NEXT_PUBLIC_STORE_COMPANY_ID || '2');

// Toggle: set NEXT_PUBLIC_PRODUCTS_SOURCE=backend to fall back to the old REST backend.
export function useSupabaseProducts(): boolean {
  return (process.env.NEXT_PUBLIC_PRODUCTS_SOURCE || 'supabase') !== 'backend';
}

// Some columns are stored as text holding JSON (images, tags, measurements,
// care_instructions). Parse them safely so the shape matches the old backend.
function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapProduct(row: Record<string, unknown>) {
  return {
    ...row,
    images: parseJson<string[]>(row.images, []),
    tags: parseJson<string[]>(row.tags, []),
    care_instructions: parseJson<string[]>(row.care_instructions, []),
    measurements: parseJson<Record<string, string>>(row.measurements, {}),
    in_stock:
      row.in_stock === 1 || row.in_stock === true || row.in_stock === '1' ? 1 : 0,
    reservation_status: row.reservation_status || 'available',
    company: null,
  };
}

async function supabaseGet(path: string, withCount = false) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(withCount ? { Prefer: 'count=exact' } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase request failed: ${res.status}`);
  }
  const data = await res.json();
  const range = res.headers.get('content-range'); // e.g. "0-49/78"
  const total = range && range.includes('/') ? parseInt(range.split('/')[1], 10) : data.length;
  return { data, total };
}

async function fetchCompany(companyId: number) {
  try {
    const { data } = await supabaseGet(
      `companies?select=*&id=eq.${companyId}&limit=1`,
    );
    return Array.isArray(data) && data.length ? data[0] : null;
  } catch {
    return null;
  }
}

interface ProductParams {
  page?: number;
  limit?: number;
}

export async function getCompanyProductsFromSupabase(
  requestedCompanyId: number,
  params: ProductParams = {},
) {
  // Always serve this store's catalog (see STORE_COMPANY_ID note above).
  // The requested id is honored only if a store override is not configured.
  const companyId = STORE_COMPANY_ID || requestedCompanyId;
  const limit = params.limit ?? 100;
  const page = params.page ?? 1;
  const offset = (page - 1) * limit;

  const query =
    `products?select=*&company_id=eq.${companyId}` +
    `&order=display_order.asc,id.asc&limit=${limit}&offset=${offset}`;

  const company = await fetchCompany(companyId);
  const { data, total } = await supabaseGet(query, true);

  const products = (Array.isArray(data) ? data : []).map(mapProduct);

  return {
    company,
    products,
    pagination: {
      page,
      limit,
      total,
      pages: limit ? Math.ceil(total / limit) : 1,
    },
  };
}

export async function getProductFromSupabase(id: string) {
  const { data } = await supabaseGet(`products?select=*&id=eq.${id}&limit=1`);
  if (!Array.isArray(data) || data.length === 0) {
    throw Object.assign(new Error('Product not found'), { status: 404 });
  }
  return mapProduct(data[0]);
}
