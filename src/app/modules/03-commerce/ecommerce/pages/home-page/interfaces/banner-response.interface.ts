export interface BannerResponse {
  id:          string;
  title:       string;
  description: string;
  image:       string;
  imageKey?:   string;
  imageUrl?:   string;
  ctaLabel:    string;
  order:       number;
  isActive:    boolean;
  startsAt:    Date;
  endsAt:      Date;
  categories:  string[];
  products:    string[];
  brands:      string[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?:      boolean;
}
