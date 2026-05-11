export interface ProductResponse {
  id:                    string;
  title:                 string;
  sku:                   string;
  slug:                  string;
  price:                 string;
  isFeatured:            boolean;
  isNew:                 boolean;
  isTrending:            boolean;
  specificationsSummary: string;
  description:           string;
  features:              string;
  stock:                 number;
  warranty:              Warranty;
  brand:                 Brand;
  categories:            Brand[];
  images:                string[];
  specifications:        Specification[];
  videos:                string[];
}

export interface Brand {
  id:               string;
  name:             string;
  slug:             string;
  backgroundColor?: string;
  imageUrl:         null | string;
  image?:           null | string;
}

export interface Specification {
  group:       string;
  description: string;
}

export interface Warranty {
  months:      number;
  description: string;
}
