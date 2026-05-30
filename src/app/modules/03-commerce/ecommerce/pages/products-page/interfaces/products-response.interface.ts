export interface ProductsResponse {
  data: Datum[];
  meta: Meta;
}

export interface Datum {
  id: string;
  title: string;
  sku: string;
  slug: string;
  price: string;
  isFeatured: boolean;
  isNew: boolean;
  isTrending: boolean;
  brand: Brand;
  categories: Category[];
  images: string[];
  isFavorite: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  imageUrl?: string | null;
}

export interface Meta {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
}
