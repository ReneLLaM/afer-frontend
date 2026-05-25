import type { ApiListMeta } from '../../../shared/interfaces/list-meta.interface';
import type { AuditInfo, AuditUserRef } from './admin-role.interface';

export type CategoryStatus = 'active' | 'inactive' | 'deprecated';
export type CategorySortBy =
  | 'name'
  | 'slug'
  | 'level'
  | 'order'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'parent';

export interface AdminCategoryRelation {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  imageUrl: string | null;
  imageKey: string | null;
}

export interface AdminCategoryBase {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  order: number;
  level: number;
  status: CategoryStatus;
  isFeatured: boolean;
}

export interface AdminCategoryTreeNode extends AdminCategoryBase {
  children: AdminCategoryTreeNode[];
}

export interface AdminCategoryListItem extends AdminCategoryBase {
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  parent: AdminCategoryRelation | null;
  children: AdminCategoryRelation[];
  audit: AuditInfo;
}

export interface AdminCategoryDetailItem extends AdminCategoryBase {
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  audit: AuditInfo;
}

export interface AdminCategoryDetail {
  category: AdminCategoryDetailItem;
  parent: AdminCategoryBase | null;
  children: AdminCategoryBase[];
  fullTree: AdminCategoryTreeNode;
}

export interface AdminCategoriesQuery {
  limit?: number;
  offset?: number;
  search?: string;
  level?: number;
  parentId?: string;
  status?: CategoryStatus;
  showDeleted?: boolean;
  sortBy?: CategorySortBy;
  order?: 'ASC' | 'DESC';
}

export interface CreateAdminCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  status?: CategoryStatus;
  isFeatured?: boolean;
  parentId?: string | null;
}

export interface UpdateAdminCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  status?: CategoryStatus;
  isFeatured?: boolean;
  parentId?: string | null;
}

export interface ReorderAdminCategoriesDto {
  categoryIds: string[];
}

export interface AdminCategoryDeleteResult {
  success: boolean;
  message: string;
  category: {
    id: string;
    name: string;
    slug: string;
    deletedAt: string | null;
    deletedBy: AuditUserRef | null;
  };
}

export interface AdminCategoriesResponse {
  data: AdminCategoryListItem[];
  meta: ApiListMeta;
}

export interface AdminCategoriesTreeResponse {
  data: AdminCategoryTreeNode[];
}
