import { SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { getThemePalette } from './themeColors';

/**
 * Generates a square PNG data URL from an HTMLImageElement for PWA icons.
 */
function renderLogoToPngDataUrl(
  img: HTMLImageElement,
  size: number,
  options: { maskable?: boolean; rounded?: boolean; bgColor?: string } = {}
): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const { maskable = false, rounded = false, bgColor = '#ffffff' } = options;

    ctx.save();
    if (rounded && !maskable) {
      const radius = Math.round(size * 0.22);
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();
    }

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Calculate aspect-fit within safe zone
    const padding = maskable ? Math.round(size * 0.12) : Math.round(size * 0.04);
    const drawArea = size - padding * 2;

    const imgRatio = (img.naturalWidth || size) / (img.naturalHeight || size);
    let drawW = drawArea;
    let drawH = drawArea;

    if (imgRatio > 1) {
      drawH = drawArea / imgRatio;
    } else if (imgRatio < 1) {
      drawW = drawArea * imgRatio;
    }

    const offsetX = Math.round((size - drawW) / 2);
    const offsetY = Math.round((size - drawH) / 2);

    ctx.save();
    const innerRadius = Math.round(drawArea * 0.16);
    ctx.beginPath();
    ctx.moveTo(offsetX + innerRadius, offsetY);
    ctx.lineTo(offsetX + drawW - innerRadius, offsetY);
    ctx.quadraticCurveTo(offsetX + drawW, offsetY, offsetX + drawW, offsetY + innerRadius);
    ctx.lineTo(offsetX + drawW, offsetY + drawH - innerRadius);
    ctx.quadraticCurveTo(offsetX + drawW, offsetY + drawH, offsetX + drawW - innerRadius, offsetY + drawH);
    ctx.lineTo(offsetX + innerRadius, offsetY + drawH);
    ctx.quadraticCurveTo(offsetX, offsetY + drawH, offsetX, offsetY + drawH - innerRadius);
    ctx.lineTo(offsetX, offsetY + innerRadius);
    ctx.quadraticCurveTo(offsetX, offsetY, offsetX + innerRadius, offsetY);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    ctx.restore();
    ctx.restore();

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function updateHeadLink(rel: string, href: string, type?: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  if (type) {
    link.type = type;
  } else {
    link.removeAttribute('type');
  }
  link.href = href;
}

function resolveAbsoluteUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

function applyManifestIcons(
  info: SymposiumInfo,
  appTitle: string,
  shortName: string,
  themeHex: string,
  icons: Array<{ src: string; sizes: string; type: string; purpose: string }>
) {
  const origin = window.location.origin;
  const basePath = origin + window.location.pathname.replace(/\/[^/]*$/, '/');

  const dynamicManifest = {
    id: basePath,
    name: appTitle,
    short_name: shortName,
    description: info.subtitle || info.theme || appTitle,
    theme_color: themeHex,
    background_color: '#0f172a',
    display: 'standalone',
    orientation: 'portrait',
    scope: basePath,
    start_url: basePath,
    icons,
  };

  try {
    // Use data: URI instead of blob: URI so browsers can persist and mint PWA icons reliably
    const dataUrl = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dynamicManifest)
    )}`;
    updateHeadLink('manifest', dataUrl);
  } catch {
    // Ignore if manifest update fails
  }
}

/**
 * Dynamically synchronizes the browser favicon, Apple touch icon, theme-color,
 * and PWA Web App Manifest with the active Event Logo (`eventInfo.logoUrl`).
 */
export function syncAppIconWithEventLogo(eventInfo?: SymposiumInfo): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);
  const rawLogoUrl = info.logoUrl || SYMPOSIUM_INFO.logoUrl || './pwa-512x512.png';
  const resolvedLogoUrl = resolveAbsoluteUrl(rawLogoUrl);
  const appTitle = 'MUNAS 5 PBDHI';
  const shortName = 'MUNAS 5 PBDHI';
  const themeHex = palette.primaryHex || '#065f46';

  // 1. Update theme-color and apple-mobile-web-app-title meta tags
  const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (themeMeta) {
    themeMeta.content = themeHex;
  }
  const appleTitleMeta = document.querySelector(
    'meta[name="apple-mobile-web-app-title"]'
  ) as HTMLMetaElement | null;
  if (appleTitleMeta) {
    appleTitleMeta.content = shortName;
  }

  // 2. Immediately set favicon & apple-touch-icon to the resolved event logo
  updateHeadLink('icon', resolvedLogoUrl);
  updateHeadLink('apple-touch-icon', resolvedLogoUrl);

  // 3. Load the event logo into an offscreen image to generate crisp square PNG icons
  const img = new Image();
  if (!resolvedLogoUrl.startsWith('data:')) {
    img.crossOrigin = 'anonymous';
  }

  img.onload = () => {
    const icon192 = renderLogoToPngDataUrl(img, 192, { rounded: true, bgColor: '#ffffff' });
    const icon512 = renderLogoToPngDataUrl(img, 512, { rounded: true, bgColor: '#ffffff' });
    const iconMaskable512 = renderLogoToPngDataUrl(img, 512, {
      maskable: true,
      bgColor: themeHex,
    });
    const appleIcon180 = renderLogoToPngDataUrl(img, 180, { rounded: false, bgColor: '#ffffff' });

    if (icon192) {
      updateHeadLink('icon', icon192, 'image/png');
    }
    if (appleIcon180) {
      updateHeadLink('apple-touch-icon', appleIcon180);
    }

    if (icon192 && icon512 && iconMaskable512) {
      applyManifestIcons(info, appTitle, shortName, themeHex, [
        { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: iconMaskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]);
    }
  };

  // Fallback if an external URL blocks CORS canvas export: still point manifest to the event logo
  img.onerror = () => {
    if (resolvedLogoUrl) {
      const iconType = resolvedLogoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      applyManifestIcons(info, appTitle, shortName, themeHex, [
        { src: resolvedLogoUrl, sizes: '192x192', type: iconType, purpose: 'any' },
        { src: resolvedLogoUrl, sizes: '512x512', type: iconType, purpose: 'any' },
      ]);
    }
  };

  img.src = resolvedLogoUrl;
}
