import type { ApiListMeta } from '../../../shared/interfaces/list-meta.interface';
import type { AuditInfo } from './admin-role.interface';

export type ProductStatus = 'active' | 'inactive' | 'deprecated';
export type ProductSortBy =
  | 'title'
  | 'sku'
  | 'slug'
  | 'price'
  | 'isFeatured'
  | 'isNew'
  | 'status'
  | 'minStock'
  | 'maxStock'
  | 'currentStock'
  | 'warrantyMonths'
  | 'createdAt'
  | 'updatedAt'
  | 'brand'
  | 'category';

export interface AdminProductBrandRef {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  imageKey: string | null;
  imageUrl: string | null;
}

export interface AdminProductCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProductImageItem {
  id: string;
  url: string;
  order: number;
}

export interface AdminProductVideoItem {
  id: string;
  url: string;
  order: number;
}

export interface AdminProductSpecificationItem {
  id: string;
  group: string;
  descriptionSpecifications: string;
  order: number;
}

export interface AdminProductBase {
  id: string;
  title: string;
  sku: string;
  slug: string;
  price: string;
  isFeatured: boolean;
  isNew: boolean;
  isTrending: boolean;
  specificationsSummary: string | null;
  description: string;
  features: string;
  status: ProductStatus;
  minStock: number;
  maxStock: number;
  currentStock: number;
  warrantyMonths: number;
  warrantyDescription: string | null;
  brand: AdminProductBrandRef | null;
  categories: AdminProductCategoryRef[];
  images: AdminProductImageItem[];
  videos: AdminProductVideoItem[];
  specifications: AdminProductSpecificationItem[];
}

export interface AdminProductListItem extends AdminProductBase {
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  audit: AuditInfo;
}

export interface AdminProductDetail extends AdminProductBase {
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  audit: AuditInfo;
}

export interface AdminProductsQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  brandId?: string;
  showDeleted?: boolean;
  sortBy?: ProductSortBy;
  order?: 'ASC' | 'DESC';
}

export interface AdminProductImageMutationItem {
  id?: string;
  url?: string;
  order: number;
}

export interface AdminProductVideoMutationItem {
  id?: string;
  url: string;
  order: number;
}

export interface AdminProductSpecificationMutationItem {
  id?: string;
  group: string;
  descriptionSpecifications: string;
  order: number;
}

export interface CreateAdminProductDto {
  title: string;
  sku: string;
  slug?: string;
  price: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  specificationsSummary?: string;
  description: string;
  features: string;
  status?: ProductStatus;
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  warrantyMonths?: number;
  warrantyDescription?: string;
  images?: AdminProductImageMutationItem[];
  specifications?: AdminProductSpecificationMutationItem[];
  categoryIds: string[];
  brandId: string;
  videos?: AdminProductVideoMutationItem[];
}

export interface UpdateAdminProductDto {
  title?: string;
  sku?: string;
  slug?: string;
  price?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  specificationsSummary?: string;
  description?: string;
  features?: string;
  status?: ProductStatus;
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  warrantyMonths?: number;
  warrantyDescription?: string;
  images?: AdminProductImageMutationItem[];
  specifications?: AdminProductSpecificationMutationItem[];
  categoryIds?: string[];
  brandId?: string;
  videos?: AdminProductVideoMutationItem[];
}

export interface AdminProductsResponse {
  data: AdminProductListItem[];
  meta: ApiListMeta;
}

export interface ReorderAdminProductImagesDto {
  imageIds: string[];
}

export interface ReorderAdminProductVideosDto {
  videoIds: string[];
}

export interface ReorderAdminProductSpecificationsDto {
  specificationIds: string[];
}
