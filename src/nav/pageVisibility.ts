/**
 * Sidebar / App ortak sayfa görünürlük kuralları.
 * CEO holding görünümünde marka modül filtresi menüyü boğmaz.
 */

export const ALWAYS_VISIBLE = new Set<string>([
  'hub',
  'komuta',
  'campus',
  'brief',
  'crudops',
  'extremepark',
  'agentbridge',
  'familycamp',
  'openmall',
  'marketos',
  'lifecoach',
  'athleteos',
  'stayring',
  'campuscore',
  'sportbridge',
  'agentqueue',
  'greenpulse',
  'campusbrief',
  'agentfleet',
  'culturescene',
  'brands',
  'guests',
  'notifications',
  'settings',
  'ops',
  'metrics',
  'docs',
  'audit',
  'ajanlar',
  'ollama',
  'olympospass',
  'jobs',
  'chef',
  'crew',
  'vision',
  'kds',
  'recipes',
  'menu',
  'inventory',
  'shifts',
  'field',
  'empire',
  'staybook',
  'hearth',
  'sanctum',
  'studio',
  'verdant',
  'bazaar',
  'weather',
  'readiness',
])

export type BrandLike = {
  id: string
  modules?: string[]
}

/** Holding markası veya CEO rolü → tüm rol sayfaları açık */
export function isHoldingView(role?: string | null, brandId?: string | null): boolean {
  if (role === 'ceo') return true
  return brandId === 'brand_likya'
}

export function isPageVisible(
  id: string,
  allowedPages: string[],
  modules: Set<string>,
  opts: { role?: string | null; brand?: BrandLike | null },
): boolean {
  if (!allowedPages.includes(id)) return false
  if (ALWAYS_VISIBLE.has(id)) return true
  if (isHoldingView(opts.role, opts.brand?.id)) return true
  if (!opts.brand) return true
  return modules.has(id)
}
