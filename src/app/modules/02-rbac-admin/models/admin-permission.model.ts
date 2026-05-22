export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description: string | null;
  createdAt: string;
}

export interface PermissionsResponse {
  data: Permission[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
}
