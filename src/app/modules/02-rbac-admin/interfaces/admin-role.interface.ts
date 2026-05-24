import type { Permission } from './admin-permission.interface';
import type { PermissionSlug } from '../../../core/constants/permissions';
import type { ApiListMeta } from '../../../shared/interfaces/list-meta.interface';

export type RoleSortBy = 'name' | 'slug' | 'isSystem' | 'createdAt' | 'updatedAt';
export type RoleTypeFilter = 'system' | 'user';

export interface AuditUserRef {
  id: string;
  fullName: string;
}

export interface AuditInfo {
  createdBy: AuditUserRef | null;
  updatedBy: AuditUserRef | null;
  deletedBy: AuditUserRef | null;
}

export interface RolePermissionSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface AdminRoleBase {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface AdminRoleListItem extends AdminRoleBase {
  audit: AuditInfo;
  permissions: string[];
}

export interface AdminRoleDetail extends AdminRoleBase {
  audit: AuditInfo;
  permissions: string[];
  permissionSlugs: PermissionSlug[];
}

export interface AdminRoleMutationResult extends AdminRoleBase {
  permissions: Permission[] | RolePermissionSummary[];
  createdBy?: string | AuditUserRef | null;
  updatedBy?: string | AuditUserRef | null;
  deletedBy?: string | AuditUserRef | null;
}

export interface AdminRoleDeleteResult {
  success: boolean;
  message: string;
  role: {
    id: string;
    name: string;
    slug: string;
    deletedAt: string | null;
    deletedBy: AuditUserRef | null;
  };
}

export interface AdminRolesQuery {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: RoleSortBy;
  order?: 'ASC' | 'DESC';
  roleType?: RoleTypeFilter;
  showDeleted?: boolean;
}

export interface CreateAdminRoleDto {
  name: string;
  description: string;
  isActive?: boolean;
  permissionIds?: string[];
  permissionSlugs?: PermissionSlug[];
}

export interface UpdateAdminRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
  permissionSlugs?: PermissionSlug[];
}

export interface AdminRolesResponse {
  data: AdminRoleListItem[];
  meta: ApiListMeta;
}

export type Role = AdminRoleListItem;
export type RolesResponse = AdminRolesResponse;
