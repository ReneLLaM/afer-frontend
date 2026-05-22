import { Role } from './admin-role.model';
import { Permission } from './admin-permission.model';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles?: Role[];
  permissions?: Permission[];
  createdAt: string;
}

export interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
}
