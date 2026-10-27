// Reads product + company data from the Fly.io backend API
// All product operations now go through the backend

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-wild-skylark-9834.fly.dev/api';

// Company ID for this storefront
const STORE_COMPANY_ID = Number(process.env.NEXT_PUBLIC_COMPANY_ID || '2');

// Always use backend now (kept for backward compatibility)
export function useSupabaseProducts(): boolean {
  return false; // Always use backend
}

// The database stores `images`, `tags` and `care_instructions` as JSON-encoded
// strings, but some rows come back already decoded. Parsing is best-effort: one
// malformed row must not throw away the whole product list.
function parseJsonField(value: unknown): any {
  if (value == null) return null;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapProduct(row: Record<string, unknown>) {
  const images = parseJsonField(row.images);
  const tags = parseJsonField(row.tags);
  const careInstructions = parseJsonField(row.care_instructions);
  const measurements = parseJsonField(row.measurements);

  return {
    ...row,
    images: (Array.isArray(images) ? images : (typeof images === 'string' ? [images] : (images ? [images] : [])))
      .filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0),
    tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? [tags] : []),
    care_instructions: Array.isArray(careInstructions) ? careInstructions : (typeof careInstructions === 'string' ? [careInstructions] : []),
    measurements: (measurements && typeof measurements === 'object') ? measurements : {},
    in_stock: row.in_stock === 1 || row.in_stock === true || row.in_stock === '1' ? 1 : 0,
    reservation_status: row.reservation_status || 'available',
    company: row.company || null,
  };
}

async function backendGet(path: string) {
  const res = await fetch(`${BACKEND_API_URL}/${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'default',
  });
  
  if (!res.ok) {
    throw new Error(`Backend request failed: ${res.status}`);
  }
  
  return await res.json();
}

async function fetchCompany(companyId: number) {
  try {
    const response = await backendGet(`companies/public/active`);
    const companies = response.companies || [];
    return companies.find((c: any) => c.id === companyId) || null;
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
  // Use the configured company ID for this storefront
  const companyId = STORE_COMPANY_ID || requestedCompanyId;
  const limit = params.limit ?? 100;
  const page = params.page ?? 1;

  try {
    // Fetch products for this company
    const response = await backendGet(
      `products?companyId=${companyId}&page=${page}&limit=${limit}`
    );

    // Fetch company info in parallel
    const company = await fetchCompany(companyId);

    const products = (response.products || []).map(mapProduct);
    const total = response.pagination?.total || products.length;

    return {
      company,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: response.pagination?.pages || Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching products from backend:', error);
    return {
      company: null,
      products: [],
      pagination: { page: 1, limit, total: 0, pages: 0 },
    };
  }
}

export async function getProductFromSupabase(id: string) {
  try {
    const product = await backendGet(`products/${id}`);
    if (!product || !product.id) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }
    return mapProduct(product);
  } catch (error) {
    throw Object.assign(new Error('Product not found'), { status: 404 });
  }
}
