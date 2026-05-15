export interface Slide {
  id: string;
  title: string;
  description?: string;
  image: string;
  ctaLabel?: string;
  ctaLink?: string;
  queryParams?: any;
}
