import type { ApiListMeta } from '../../../shared/interfaces/list-meta.interface';
import type { AuditInfo, AuditUserRef } from './admin-role.interface';

export type BrandStatus = 'active' | 'inactive' | 'deprecated';
export type BrandSortBy =
  | 'name'
  | 'slug'
  | 'order'
  | 'isFeatured'
  | 'status'
  | 'createdAt'
  | 'updatedAt';

export interface AdminBrandBase {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  isFeatured: boolean;
  order: number;
  status: BrandStatus;
  backgroundColor: string | null;
}

export interface AdminBrandListItem extends AdminBrandBase {
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  audit: AuditInfo;
}

export interface AdminBrandDetail extends AdminBrandBase {
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  audit: AuditInfo;
}

export interface AdminBrandsQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: BrandStatus;
  showDeleted?: boolean;
  sortBy?: BrandSortBy;
  order?: 'ASC' | 'DESC';
}

export interface CreateAdminBrandDto {
  name: string;
  slug?: string;
  description?: string;
  isFeatured?: boolean;
  status?: BrandStatus;
  backgroundColor?: string;
}

export interface UpdateAdminBrandDto {
  name?: string;
  slug?: string;
  description?: string;
  isFeatured?: boolean;
  status?: BrandStatus;
  backgroundColor?: string;
}

export interface ReorderAdminBrandsDto {
  brandIds: string[];
}

export interface AdminBrandDeleteResult {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  deletedBy: AuditUserRef | null;
}

export interface AdminBrandsResponse {
  data: AdminBrandListItem[];
  meta: ApiListMeta;
}
