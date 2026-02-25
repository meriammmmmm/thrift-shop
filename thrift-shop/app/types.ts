export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  brand: string;
  size: string;
  category: string;
  condition: 'Like New' | 'Excellent' | 'Good' | 'Fair';
  color: string;
  inStock: boolean;
  material?: string;
  measurements?: {
    chest?: string;
    waist?: string;
    length?: string;
    sleeve?: string;
  };
  careInstructions?: string[];
  tags?: string[];
  seller?: {
    name: string;
    rating: number;
    location: string;
  };
  company?: {
    id: number;
    name: string;
    description: string;
  };
  dateAdded: string;
  views: number;
  likes: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export interface WishlistItem {
  id: number;
  productId: number;
}

export interface FilterOptions {
  category: string[];
  size: string[];
  brand: string[];
  priceRange: [number, number];
  condition: string[];
  color: string[];
}
