export const CATALOG_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_CATALOG_PAGE_SIZE = 10;

export function parseCatalogPage(value: string | null | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export function parseCatalogLimit(value: string | null | undefined): number {
  const limit = Number(value);
  return CATALOG_PAGE_SIZE_OPTIONS.includes(limit as (typeof CATALOG_PAGE_SIZE_OPTIONS)[number])
    ? limit
    : DEFAULT_CATALOG_PAGE_SIZE;
}

export function toCatalogOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
