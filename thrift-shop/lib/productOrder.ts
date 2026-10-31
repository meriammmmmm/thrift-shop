/**
 * The order the admin dragged the pieces into.
 *
 * The shop asks the backend for `sortBy=custom`, which returns the pieces by
 * the place the admin panel gave them. This comparator keeps that order on the
 * client as well: a piece that has no place yet goes last, and every other
 * piece keeps the order it arrived in.
 */
export function compareByShopOrder(
  a: { displayOrder?: number | null },
  b: { displayOrder?: number | null },
): number {
  const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return 0;
}
