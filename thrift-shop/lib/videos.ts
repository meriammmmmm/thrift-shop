/**
 * The videos of the shop.
 *
 * A clip is attached to a product in the admin panel and lives behind the
 * backend, which serves it with range support so the browser can play and
 * seek it. The storefront only ever holds the links.
 */

export interface VideoProduct {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  brand: string;
  category: string;
  image: string | null;
}

export interface ShopVideo {
  id: number;
  product_id: number;
  title: string | null;
  mime: string;
  size: number;
  is_active: boolean;
  display_order: number;
  /** The clip itself. */
  video_url: string;
  /** The still shown before the clip is played, when there is one. */
  poster_url: string | null;
  product: VideoProduct;
}

/** The clips of a company, in the order the admin panel gave them. */
export async function fetchVideos(
  apiUrl: string,
  companyId: number | string,
): Promise<ShopVideo[]> {
  try {
    const response = await fetch(`${apiUrl}/videos?companyId=${companyId}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'default',
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data = await response.json();
    const videos: ShopVideo[] = data.videos || [];

    // A piece that is hidden in the shop is not shown with its video either.
    return videos.filter((video) => video.is_active && video.product);
  } catch {
    return [];
  }
}

/** The clip of a given piece, when it has one. */
export function videoForProduct(
  videos: ShopVideo[],
  productId: number,
): ShopVideo | undefined {
  return videos.find((video) => video.product_id === productId);
}
