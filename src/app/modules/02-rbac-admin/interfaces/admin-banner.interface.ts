import type { ApiListMeta } from '../../../shared/interfaces/list-meta.interface';
import type { AuditInfo, AuditUserRef } from './admin-role.interface';

export type BannerSortBy =
  | 'title'
  | 'order'
  | 'isActive'
  | 'startsAt'
  | 'endsAt'
  | 'createdAt'
  | 'updatedAt';

export interface AdminBannerBase {
  id: string;
  title: string;
  description: string | null;
  image: string;
  imageUrl: string;
  ctaLabel: string | null;
  order: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface AdminBannerCategoryRef {
  id: string;
  name: string;
  slug: string | null;
}

export interface AdminBannerBrandRef {
  id: string;
  name: string;
  slug: string | null;
}

export interface AdminBannerProductRef {
  id: string;
  title: string;
  slug: string | null;
  sku: string | null;
}

export interface AdminBannerListItem extends AdminBannerBase {
  createdAt: string;
  deletedAt: string | null;
}

export interface AdminBannerDetail extends AdminBannerBase {
  imageKey: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  categoriesIds: string[];
  productsIds: string[];
  brandsIds: string[];
  categories: AdminBannerCategoryRef[];
  products: AdminBannerProductRef[];
  brands: AdminBannerBrandRef[];
  categoriesCount: number;
  productsCount: number;
  brandsCount: number;
  audit: AuditInfo;
}

export interface AdminBannersQuery {
  limit?: number;
  offset?: number;
  search?: string;
  isActive?: boolean;
  showDeleted?: boolean;
  sortBy?: BannerSortBy;
  order?: 'ASC' | 'DESC';
}

export interface CreateAdminBannerDto {
  title: string;
  description?: string;
  ctaLabel?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  categoriesIds?: string[];
  productsIds?: string[];
  brandsIds?: string[];
}

export interface UpdateAdminBannerDto {
  title?: string;
  description?: string;
  ctaLabel?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  categoriesIds?: string[];
  productsIds?: string[];
  brandsIds?: string[];
}

export interface ReorderAdminBannersDto {
  bannerIds: string[];
}

export interface AdminBannerDeleteResult {
  success: boolean;
  message: string;
  deletedBy: AuditUserRef | null;
}

export interface AdminBannersResponse {
  data: AdminBannerListItem[];
  meta: ApiListMeta;
}
