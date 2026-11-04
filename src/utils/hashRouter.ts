import { MainTabType } from '../components/MainMenuTabs';

/**
 * Valid SPA navigation tabs mapped directly to URL hashes (`#home`, `#symposium`, etc.).
 * Using URL hashes instead of History API pathnames (`pushState` / `/symposium`) ensures
 * 100% compatibility with static hosts like GitHub Pages (`https://user.github.io/SymposiumApp/#symposium`)
 * without requiring server-side rewrite rules.
 */
export const TAB_HASH_ORDER: MainTabType[] = [
  'home',
  'speaker',
  'workshop',
  'symposium',
  'pameran',
  'venue',
  'jadwal-saya',
  'admin',
];

/**
 * Parses a `window.location.hash` string (e.g. `#symposium` or `#/symposium`) into a valid `MainTabType`.
 * Returns `null` if the hash is empty or does not match a known tab.
 */
export function parseTabFromHash(hash: string): MainTabType | null {
  if (!hash) return null;
  const cleaned = hash
    .replace(/^#\/?/, '')
    .split('?')[0]
    .trim()
    .toLowerCase() as MainTabType;

  if (TAB_HASH_ORDER.includes(cleaned)) {
    return cleaned;
  }
  return null;
}

/**
 * Formats a `MainTabType` into its canonical URL hash (e.g. `#symposium`).
 */
export function formatTabHash(tab: MainTabType): string {
  return `#${tab}`;
}

/**
 * Updates `window.location.hash` for the active tab without triggering full page reloads
 * or modifying `window.location.pathname`.
 */
export function syncTabToUrlHash(tab: MainTabType): void {
  if (typeof window === 'undefined') return;
  const targetHash = formatTabHash(tab);
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

/**
 * Builds a complete shareable URL preserving the GitHub Pages project subpath
 * (e.g. `https://pranowo2304.github.io/SymposiumApp/#symposium`).
 */
export function buildShareableHashUrl(tab: MainTabType = 'home'): string {
  if (typeof window === 'undefined') return '';
  const basePath = `${window.location.origin}${window.location.pathname}`;
  return `${basePath}${formatTabHash(tab)}`;
}
