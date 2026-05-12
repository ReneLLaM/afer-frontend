export interface CategoriesResponse {
  data: Datum[];
}

export interface Datum {
  id:          string;
  name:        string;
  slug:        string;
  description: string;
  image:       string;
  order:       number;
  level:       number;
  status:      string;
  isFeatured:  boolean;
  children:    Datum[];
}
