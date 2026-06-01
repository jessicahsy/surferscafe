export function resolvePublicAsset(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

export function getMenuImageUrl(path: string): string {
  return resolvePublicAsset(path);
}