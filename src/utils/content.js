export function countDescription(count, description = '') {
  const normalizedCount = Number.isFinite(Number(count)) ? Math.max(0, Math.trunc(Number(count))) : 0;
  const copy = String(description).trim().replace(/^\d+(?:\s+|$)/, '').trim();
  return copy ? `${normalizedCount} ${copy}` : String(normalizedCount);
}
