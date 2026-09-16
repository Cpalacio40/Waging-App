/** Public asset URL that respects Vite `base` (e.g. GitHub Pages). */
export function assetUrl(path: string) {
  const normalized = path.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${normalized}`
}
