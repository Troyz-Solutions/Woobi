/**
 * Engine Harmony - Color Space Utilities
 * Pure ECMAScript mathematical conversions and perceptual color metrics.
 * Supports Hex, sRGB, HSL, and CIE L*a*b* color spaces.
 */

/**
 * Clamps a number between min and max bounds.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Normalizes any Hex string to a standard 6-digit uppercase representation without '#'.
 * @param {string|number} hex
 * @returns {string} 6-character hex string (e.g., "F5EAE0")
 */
export function normalizeHex(hex) {
  if (typeof hex === 'number') {
    return Math.floor(hex).toString(16).padStart(6, '0').toUpperCase();
  }
  if (!hex || typeof hex !== 'string') return '808080';
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return '808080';
  }
  return clean.toUpperCase();
}

/**
 * Converts Hex string or numeric literal to sRGB {r, g, b} in range 0-255.
 * @param {string|number} hex
 * @returns {{r: number, g: number, b: number}}
 */
export function hexToRgb(hex) {
  const norm = normalizeHex(hex);
  const num = parseInt(norm, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Converts sRGB values (0-255) to a formatted '#RRGGBB' hex string.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
export function rgbToHex(r, g, b) {
  const toHex = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts sRGB (0-255) to HSL { h: [0-360), s: [0-100], l: [0-100] }.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{h: number, s: number, l: number}}
 */
export function rgbToHsl(r, g, b) {
  const rf = clamp(r, 0, 255) / 255;
  const gf = clamp(g, 0, 255) / 255;
  const bf = clamp(b, 0, 255) / 255;

  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case rf:
        h = ((gf - bf) / delta) + (gf < bf ? 6 : 0);
        break;
      case gf:
        h = ((bf - rf) / delta) + 2;
        break;
      case bf:
        h = ((rf - gf) / delta) + 4;
        break;
    }
    h = h * 60;
  }

  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts HSL values into sRGB {r, g, b} in range 0-255.
 * @param {number} h [0-360]
 * @param {number} s [0-100]
 * @param {number} l [0-100]
 * @returns {{r: number, g: number, b: number}}
 */
export function hslToRgb(h, s, l) {
  const hNorm = ((h % 360) + 360) % 360;
  const sFrac = clamp(s, 0, 100) / 100;
  const lFrac = clamp(l, 0, 100) / 100;

  if (sFrac === 0) {
    const gray = Math.round(lFrac * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p, q, t) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = lFrac < 0.5 ? lFrac * (1 + sFrac) : lFrac + sFrac - lFrac * sFrac;
  const p = 2 * lFrac - q;
  const hFrac = hNorm / 360;

  return {
    r: Math.round(hue2rgb(p, q, hFrac + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hFrac) * 255),
    b: Math.round(hue2rgb(p, q, hFrac - 1 / 3) * 255)
  };
}

/**
 * Converts sRGB (0-255) to CIE L*a*b* using standard D65 illuminant.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{l: number, a: number, b: number}}
 */
export function rgbToLab(r, g, b) {
  // 1. Linearize sRGB values (gamma expansion)
  const pivotRgb = c => {
    const norm = c / 255;
    return norm > 0.04045 ? Math.pow((norm + 0.055) / 1.055, 2.4) : norm / 12.92;
  };

  const rLin = pivotRgb(r);
  const gLin = pivotRgb(g);
  const bLin = pivotRgb(b);

  // 2. Convert to CIE XYZ (Observer 2°, D65 reference white)
  const x = (rLin * 0.4124 + gLin * 0.3576 + bLin * 0.1805) / 0.95047;
  const y = (rLin * 0.2126 + gLin * 0.7152 + bLin * 0.0722) / 1.00000;
  const z = (rLin * 0.0193 + gLin * 0.1192 + bLin * 0.9505) / 1.08883;

  // 3. Convert XYZ to L*a*b*
  const pivotXyz = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
  const fx = pivotXyz(x);
  const fy = pivotXyz(y);
  const fz = pivotXyz(z);

  return {
    l: Math.round((116 * fy - 16) * 100) / 100, // Lightness [0, 100]
    a: Math.round((500 * (fx - fy)) * 100) / 100, // Green (-) to Red (+)
    b: Math.round((200 * (fy - fz)) * 100) / 100  // Blue (-) to Yellow (+)
  };
}

/**
 * Calculates CIE76 Delta E color difference between two Lab colors.
 * Values < 2.3 are considered imperceptible to human eye.
 * @param {{l: number, a: number, b: number}} lab1
 * @param {{l: number, a: number, b: number}} lab2
 * @returns {number} Perceptual distance
 */
export function deltaE76(lab1, lab2) {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Computes shortest angular distance between two hues on the 360° color wheel.
 * @param {number} h1 [0-360]
 * @param {number} h2 [0-360]
 * @returns {number} Angular distance [0-180]
 */
export function getHueDifference(h1, h2) {
  const diff = Math.abs((h1 % 360) - (h2 % 360));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Calculates WCAG relative luminance of an sRGB color.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number} Luminance in [0, 1]
 */
export function getRelativeLuminance(r, g, b) {
  const lum = c => {
    const norm = c / 255;
    return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
}

/**
 * Calculates the contrast ratio between two sRGB colors.
 * @param {{r: number, g: number, b: number}} rgb1
 * @param {{r: number, g: number, b: number}} rgb2
 * @returns {number} Contrast ratio from 1.0 to 21.0
 */
export function getContrastRatio(rgb1, rgb2) {
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Classifies color temperature as 'warm', 'cool', or 'neutral'.
 * @param {number} h Hue [0-360]
 * @param {number} s Saturation [0-100]
 * @param {number} l Lightness [0-100]
 * @returns {'warm'|'cool'|'neutral'}
 */
export function getColorTemperature(h, s, l) {
  if (s <= 12 || l <= 10 || l >= 92) {
    return 'neutral';
  }
  // Warm hues: Reds, Oranges, Yellows, Warm Greens (345° to 90°)
  if (h >= 345 || h <= 90) {
    return 'warm';
  }
  // Cool hues: Cyans, Blues, Violets, Cool Greens (150° to 310°)
  if (h >= 150 && h <= 310) {
    return 'cool';
  }
  // Transition hues: Olive green, magenta/burgundy
  return 'neutral';
}

