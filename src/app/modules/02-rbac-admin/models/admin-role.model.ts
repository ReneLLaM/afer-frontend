import { Permission } from './admin-permission.model';

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  permissions?: Permission[];
  createdAt: string;
}

export interface RolesResponse {
  data: Role[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
}
