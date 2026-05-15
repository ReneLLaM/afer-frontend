export interface BannerResponse {
  id:          string;
  title:       string;
  description: string;
  image:       string;
  ctaLabel:    string;
  order:       number;
  isActive:    boolean;
  startsAt:    Date;
  endsAt:      Date;
  categories:  string[];
  products:    string[];
  brands:      string[];
}
