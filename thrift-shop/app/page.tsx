// Server Component — fetches products at request time so the page
// arrives in the browser with all data already included (zero wait).
import HomeClient from './HomeClient';

async function fetchPageData() {
  try {
    const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'https://backend-wild-skylark-9834.fly.dev/api';
    const COMPANY  = process.env.NEXT_PUBLIC_COMPANY_ID || '2';

    const res = await fetch(
      `${API_URL}/products/company/${COMPANY}?limit=100`,
      {
        // Revalidate every 60 s so Vercel keeps a fresh cache server-side
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return { products: [], company: null };
    return await res.json();
  } catch {
    return { products: [], company: null };
  }
}

export default async function Page() {
  const data = await fetchPageData();
  return <HomeClient initialData={data} />;
}
