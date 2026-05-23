export interface ListQueryParams {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  order: 'ASC' | 'DESC' | '';
  [key: string]: string | number;
}

export const DEFAULT_LIST_LIMIT = 10;

export function readListParams(
  snapshot: Record<string, string | string[] | undefined>,
  defaults: Partial<ListQueryParams> = {},
): ListQueryParams {
  const page = Number(snapshot['page'] ?? defaults.page ?? 1);
  const limit = Number(snapshot['limit'] ?? defaults.limit ?? DEFAULT_LIST_LIMIT);
  const search = String(snapshot['search'] ?? defaults.search ?? '');
  const sortBy = String(snapshot['sortBy'] ?? defaults.sortBy ?? '');
  const orderRaw = snapshot['order'] ?? defaults.order ?? '';
  const order =
    orderRaw === 'ASC' || orderRaw === 'DESC' ? orderRaw : ('' as const);

  const base: ListQueryParams = { page, limit, search, sortBy, order };

  for (const [key, value] of Object.entries(snapshot)) {
    if (['page', 'limit', 'search', 'sortBy', 'order'].includes(key)) continue;
    if (value === undefined || value === null) continue;
    base[key] = Array.isArray(value) ? value[0] : String(value);
  }

  return base;
}

export function buildListQueryPatch(
  current: Record<string, string | string[] | undefined>,
  patch: Record<string, string | number | null | undefined>,
): Record<string, string> {
  const merged = { ...current, ...patch };
  const updated: Record<string, string> = {};

  for (const [key, value] of Object.entries(merged)) {
    if (value === null || value === undefined || value === '') continue;
    updated[key] = Array.isArray(value) ? value[0] : String(value);
  }

  return updated;
}

export function areSameQueryParams(
  a: Record<string, string | string[] | undefined>,
  b: Record<string, string | string[] | undefined>,
): boolean {
  const normalize = (params: Record<string, string | string[] | undefined>): Record<string, string> => {
    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') continue;
      normalized[key] = Array.isArray(value) ? value[0] : String(value);
    }

    return normalized;
  };

  const left = normalize(a);
  const right = normalize(b);
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every((key) => right[key] === left[key]);
}

export function toApiOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function sortDirectionFromOrder(order: string): 'asc' | 'desc' | null {
  const o = order.toLowerCase();
  if (o === 'asc' || o === 'desc') return o;
  return null;
}
