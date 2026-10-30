/**
 * Flags coming from the API arrive in two shapes: SQLite hands back 0/1 and
 * Postgres hands back true/false. Comparing them with `!== 0` silently treats
 * a Postgres `false` as "on", so both spellings are read in one place.
 */
export function toBooleanFlag(value: unknown, fallback = false): boolean {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

  return fallback;
}
