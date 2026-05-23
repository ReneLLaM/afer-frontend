import { Role } from './admin-role.interface';
import { Permission } from './admin-permission.interface';

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
