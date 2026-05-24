import type { ApiListMeta } from '../../../shared/interfaces/list-meta.interface';
import type { AuditInfo, AuditUserRef } from './admin-role.interface';

export type UserStatus = 'active' | 'inactive' | 'blocked';
export type UserGender = 'male' | 'female' | 'undefined';
export type UserSortBy =
  | 'email'
  | 'fullName'
  | 'phone'
  | 'gender'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'lastLoginAt';

export interface AdminUserRoleListItem {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
}

export interface AdminUserRoleDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  assignedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  permissions: AdminUserRolePermission[];
}

export interface AdminUserRolePermission {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description: string | null;
}

export interface AdminUserDirectPermission extends AdminUserRolePermission {
  grantedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

export interface AdminUserBase {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  gender: UserGender | null;
  status: UserStatus;
}

export interface AdminUserListItem extends AdminUserBase {
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  emailVerified: boolean;
  isGoogleUser: boolean;
  lastLoginAt: string | null;
  audit: AuditInfo;
  roles: AdminUserRoleListItem[];
}

export interface AdminUserDetail extends AdminUserBase {
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  hasPassword: boolean;
  isGoogleUser: boolean;
  audit: AuditInfo;
  roles: AdminUserRoleDetail[];
  permissions: AdminUserDirectPermission[];
}

export interface AdminUserCreateResult extends AdminUserBase {
  createdAt: string;
  audit: {
    createdBy: AuditUserRef | null;
  };
}

export interface AdminUserDeleteResult {
  success: boolean;
  message: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    deletedAt: string;
    deletedBy: AuditUserRef | null;
  };
}

export interface AdminUsersQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: UserStatus;
  roleId?: string;
  sortBy?: UserSortBy;
  order?: 'ASC' | 'DESC';
  showDeleted?: boolean;
}

export interface CreateAdminUserDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  gender?: UserGender;
  roles?: Array<{
    roleId: string;
    startsAt?: string;
    expiresAt?: string;
  }>;
  permissions?: Array<{
    permissionId: string;
    startsAt?: string;
    expiresAt?: string;
  }>;
}

export interface UpdateAdminUserDto {
  email?: string;
  fullName?: string;
  phone?: string;
  gender?: UserGender;
  status?: UserStatus;
}

export interface UpdateAdminUserAccessPermissionDto {
  permissionId: string;
  startsAt?: string;
  expiresAt?: string;
}

export interface UpdateAdminUserAccessRoleDto {
  roleId: string;
  startsAt?: string;
  expiresAt?: string;
}

export interface UpdateAdminUserAccessDto {
  roles?: UpdateAdminUserAccessRoleDto[];
  permissions?: UpdateAdminUserAccessPermissionDto[];
}

export interface AdminUsersResponse {
  data: AdminUserListItem[];
  meta: ApiListMeta;
}

export type User = AdminUserListItem;
export type UsersResponse = AdminUsersResponse;
