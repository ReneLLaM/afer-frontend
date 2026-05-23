/** Meta de paginación compartida entre app-data-table y app-pagination */
export interface ListMeta {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
}

export interface ApiListMeta extends ListMeta {
  offset: number;
}

export function toListMeta(meta: ApiListMeta): ListMeta {
  return {
    total: meta.total,
    limit: meta.limit,
    page: meta.page,
    totalPages: Math.max(1, meta.totalPages),
  };
}
