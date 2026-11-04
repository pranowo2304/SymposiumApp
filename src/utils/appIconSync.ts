import { SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { getThemePalette } from './themeColors';

let currentManifestBlobUrl: string | null = null;

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

    // Calculate aspect-fit or aspect-fill within safe zone
    const padding = maskable ? Math.round(size * 0.1) : Math.round(size * 0.04);
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

    // Optional rounded inner frame for photo logos
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

/**
 * Dynamically synchronizes the browser favicon, Apple touch icon, theme-color,
 * and PWA Web App Manifest with the active Event Logo (`eventInfo.logoUrl`).
 */
export function syncAppIconWithEventLogo(eventInfo?: SymposiumInfo): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);
  const logoUrl = info.logoUrl || SYMPOSIUM_INFO.logoUrl || './pwa-192x192.png';
  const appTitle = info.title || SYMPOSIUM_INFO.title;
  const shortName = appTitle.length > 15 ? appTitle.split('&')[0].trim().slice(0, 15) : appTitle;

  // 1. Update theme-color and apple-mobile-web-app-title meta tags
  const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (themeMeta && palette.primaryHex) {
    themeMeta.content = palette.primaryHex;
  }
  const appleTitleMeta = document.querySelector(
    'meta[name="apple-mobile-web-app-title"]'
  ) as HTMLMetaElement | null;
  if (appleTitleMeta) {
    appleTitleMeta.content = shortName;
  }

  // 2. Immediately set favicon & apple-touch-icon to the logoUrl as fallback
  updateHeadLink('icon', logoUrl);
  updateHeadLink('apple-touch-icon', logoUrl);

  // 3. Load the event logo into an offscreen image to generate crisp square PNG icons
  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    const icon192 = renderLogoToPngDataUrl(img, 192, { rounded: true, bgColor: '#ffffff' });
    const icon512 = renderLogoToPngDataUrl(img, 512, { rounded: true, bgColor: '#ffffff' });
    const iconMaskable512 = renderLogoToPngDataUrl(img, 512, {
      maskable: true,
      bgColor: palette.primaryHex || '#065f46',
    });
    const appleIcon180 = renderLogoToPngDataUrl(img, 180, { rounded: false, bgColor: '#ffffff' });

    if (icon192) {
      updateHeadLink('icon', icon192, 'image/png');
    }
    if (appleIcon180) {
      updateHeadLink('apple-touch-icon', appleIcon180);
    }

    // Update Web App Manifest dynamically if custom PNGs were generated
    if (icon192 && icon512 && iconMaskable512) {
      const origin = window.location.origin;
      const basePath = origin + window.location.pathname.replace(/\/[^/]*$/, '/');

      const dynamicManifest = {
        id: basePath,
        name: appTitle,
        short_name: shortName,
        description: info.subtitle || info.theme || appTitle,
        theme_color: palette.primaryHex || '#065f46',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: basePath,
        start_url: basePath,
        icons: [
          {
            src: icon192,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: icon512,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: iconMaskable512,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      };

      try {
        if (currentManifestBlobUrl) {
          URL.revokeObjectURL(currentManifestBlobUrl);
        }
        const blob = new Blob([JSON.stringify(dynamicManifest)], {
          type: 'application/manifest+json',
        });
        currentManifestBlobUrl = URL.createObjectURL(blob);
        updateHeadLink('manifest', currentManifestBlobUrl);
      } catch {
        // Ignore if Blob URL creation fails
      }
    }
  };

  img.src = logoUrl;
}
