export interface SlideQueryParams {
  category?: string;
  brand?: string;
  productIds?: string;
  isFeatured?: string;
  isTrending?: string;
  isNew?: string;
}

export interface Slide {
  id: string;
  title: string;
  description?: string;
  image: string;
  ctaLabel?: string;
  ctaLink?: string;
  queryParams?: SlideQueryParams;
}
