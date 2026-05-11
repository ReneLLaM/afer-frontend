export interface BrandsResponse {
  data: Datum[];
  meta: Meta;
}

export interface Datum {
  id:          string;
  name:        string;
  slug:        string;
  description: string;
  image:       string;
  order:       number;
  isFeatured:  boolean;
  backgroundColor?: string;
}

export interface Meta {
  total:      number;
  limit:      number;
  offset:     number;
  page:       number;
  totalPages: number;
}
