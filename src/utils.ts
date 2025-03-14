export function createSearchParams(params: any) {
  if (typeof params !== 'object' || params === null) {
    throw new Error('params must be an object');
  }
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
}