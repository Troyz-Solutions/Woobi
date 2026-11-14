/**
 * Woobi - Core Capture Module
 * ClothingSegmentation.js
 * 
 * $0 Cost Client-Side On-Device Background Removal & Exact HD Fabric Color Extraction.
 * Runs 100% locally in the browser with zero external API calls or cloud dependencies.
 * Preserves 100% native capture resolution and extracts true garment fabric tones.
 */

/**
 * Calculates Euclidean distance in RGB color space
 */
export function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Weighted Euclidean distance (closer to human perception)
  const rMean = (r1 + r2) / 2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );
}

/**
 * Calculates perceived relative luminance (0 to 100)
 */
export function getLuminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 2.55;
}

/**
 * Converts RGB numbers to hex string '#RRGGBB'
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts hex string or number to integer hex (e.g. 0xRRGGBB)
 */
export function toHexInt(color) {
  if (typeof color === 'number') return color;
  if (typeof color === 'string') {
    const clean = color.replace(/^#|^0x/, '');
    const parsed = parseInt(clean, 16);
    return isNaN(parsed) ? 0x243242 : parsed;
  }
  return 0x243242;
}

/**
 * Samples perimeter background color and distribution
 */
export function sampleBackgroundFromPerimeter(imageData, width, height, marginRatio = 0.05) {
  const data = imageData.data;
  const marginX = Math.max(2, Math.floor(width * marginRatio));
  const marginY = Math.max(2, Math.floor(height * marginRatio));

  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  const samples = [];

  function addPixel(x, y) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    totalR += r;
    totalG += g;
    totalB += b;
    samples.push({ r, g, b });
    count++;
  }

  // Top & bottom margins
  for (let y = 0; y < marginY; y++) {
    for (let x = 0; x < width; x += 2) addPixel(x, y);
  }
  for (let y = height - marginY; y < height; y++) {
    for (let x = 0; x < width; x += 2) addPixel(x, y);
  }
  // Left & right margins
  for (let y = marginY; y < height - marginY; y += 2) {
    for (let x = 0; x < marginX; x++) addPixel(x, y);
    for (let x = width - marginX; x < width; x++) addPixel(x, y);
  }

  if (count === 0) return { r: 240, g: 240, b: 240, variance: 15 };

  const meanR = totalR / count;
  const meanG = totalG / count;
  const meanB = totalB / count;

  let varSum = 0;
  for (const s of samples) {
    const dist = colorDistance(s.r, s.g, s.b, meanR, meanG, meanB);
    varSum += dist * dist;
  }
  const variance = Math.sqrt(varSum / count);

  return {
    r: meanR,
    g: meanG,
    b: meanB,
    variance: Math.max(12, variance)
  };
}

/**
 * Extracts exact HD Dominant Fabric Color from foreground garment pixels.
 * Automatically excludes deep shadows (L < 18) and specular glare/reflections (L > 94).
 */
export function extractExactHDColor(imageData, mask = null) {
  const data = imageData.data;
  const totalPixels = data.length / 4;

  // 16x16x16 3D Color Histogram for dominant color extraction
  const binSize = 16;
  const binCount = 256 / binSize; // 16 bins per channel
  const hist = new Map();

  let validCount = 0;
  let sumR = 0, sumG = 0, sumB = 0;

  for (let i = 0; i < totalPixels; i++) {
    // If mask is provided, skip background pixels (mask[i] === 0)
    if (mask && mask[i] < 128) continue;

    const idx = i * 4;
    const a = data[idx + 3];
    if (a < 128) continue; // Skip transparent pixels

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const lum = getLuminance(r, g, b);
    // Ignore deep crease shadows and extreme specular highlights
    if (lum < 16 || lum > 94) continue;

    const rBin = Math.floor(r / binSize);
    const gBin = Math.floor(g / binSize);
    const bBin = Math.floor(b / binSize);
    const key = (rBin << 8) | (gBin << 4) | bBin;

    const entry = hist.get(key) || { count: 0, rTotal: 0, gTotal: 0, bTotal: 0 };
    entry.count++;
    entry.rTotal += r;
    entry.gTotal += g;
    entry.bTotal += b;
    hist.set(key, entry);

    sumR += r;
    sumG += g;
    sumB += b;
    validCount++;
  }

  if (validCount === 0 || hist.size === 0) {
    // Fallback: neutral refined navy
    return {
      hex: '#243242',
      intHex: 0x243242,
      rgb: { r: 36, g: 50, b: 66 },
      luminance: 35
    };
  }

  // Find the mode bin with highest frequency
  let dominantBin = null;
  let maxCount = -1;

  for (const entry of hist.values()) {
    if (entry.count > maxCount) {
      maxCount = entry.count;
      dominantBin = entry;
    }
  }

  const finalR = Math.round(dominantBin.rTotal / dominantBin.count);
  const finalG = Math.round(dominantBin.gTotal / dominantBin.count);
  const finalB = Math.round(dominantBin.bTotal / dominantBin.count);

  const hex = rgbToHex(finalR, finalG, finalB);
  const intHex = toHexInt(hex);
  const luminance = Math.round(getLuminance(finalR, finalG, finalB));

  return {
    hex,
    intHex,
    rgb: { r: finalR, g: finalG, b: finalB },
    luminance,
    samplesCount: validCount
  };
}

/**
 * Performs client-side on-device background removal ($0 cost).
 * Uses perimeter background sampling and flood-fill connectivity to remove background
 * while protecting the garment fabric, preserving 100% native resolution.
 */
export function removeBackgroundOnDevice(imageData, options = {}) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const totalPixels = width * height;

  const bg = sampleBackgroundFromPerimeter(imageData, width, height, options.marginRatio || 0.05);
  const baseThreshold = options.threshold || Math.max(30, bg.variance * 2.2);

  // Mask array: 255 = garment (keep), 0 = background (remove)
  const mask = new Uint8Array(totalPixels);
  mask.fill(255); // Default to keep

  // Queue for Breadth-First Flood Fill from outer edges
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  // Seed boundary pixels
  function trySeed(x, y) {
    const idx = y * width + x;
    if (mask[idx] === 0) return;
    const px = idx * 4;
    const dist = colorDistance(data[px], data[px + 1], data[px + 2], bg.r, bg.g, bg.b);
    if (dist < baseThreshold) {
      mask[idx] = 0;
      queue[qTail++] = idx;
    }
  }

  for (let x = 0; x < width; x++) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  // Flood fill inward along background
  while (qHead < qTail) {
    const currIdx = queue[qHead++];
    const cx = currIdx % width;
    const cy = Math.floor(currIdx / width);

    const neighbors = [
      cx > 0 ? currIdx - 1 : -1,
      cx < width - 1 ? currIdx + 1 : -1,
      cy > 0 ? currIdx - width : -1,
      cy < height - 1 ? currIdx + width : -1
    ];

    for (const nIdx of neighbors) {
      if (nIdx === -1 || mask[nIdx] === 0) continue;
      const px = nIdx * 4;
      const dist = colorDistance(data[px], data[px + 1], data[px + 2], bg.r, bg.g, bg.b);
      if (dist < baseThreshold) {
        mask[nIdx] = 0;
        queue[qTail++] = nIdx;
      }
    }
  }

  // Apply mask with 1-pixel soft antialiasing / feathering
  const resultData = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const px = idx * 4;

      if (mask[idx] === 0) {
        // Pure background -> transparent
        resultData[px + 3] = 0;
      } else {
        // Check for boundary feathering
        let bgNeighborCount = 0;
        if (x > 0 && mask[idx - 1] === 0) bgNeighborCount++;
        if (x < width - 1 && mask[idx + 1] === 0) bgNeighborCount++;
        if (y > 0 && mask[idx - width] === 0) bgNeighborCount++;
        if (y < height - 1 && mask[idx + width] === 0) bgNeighborCount++;

        if (bgNeighborCount > 0) {
          // Antialiased edge
          resultData[px + 3] = Math.max(64, Math.round(255 - bgNeighborCount * 45));
        }
      }
    }
  }

  // Extract HD color from garment
  const hdColor = extractExactHDColor(imageData, mask);

  return {
    segmentedData: resultData,
    mask,
    hdColor,
    width,
    height
  };
}

/**
 * Browser helper: processes a source canvas or image element directly
 */
export function processCanvasGarment(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = removeBackgroundOnDevice(imgData, options);

  // Write back to a transparent canvas at 100% native resolution
  const outCanvas = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
  if (outCanvas) {
    outCanvas.width = canvas.width;
    outCanvas.height = canvas.height;
    const outCtx = outCanvas.getContext('2d');
    const newImgData = outCtx.createImageData(canvas.width, canvas.height);
    newImgData.data.set(result.segmentedData);
    outCtx.putImageData(newImgData, 0, 0);

    return {
      canvas: outCanvas,
      dataUrl: outCanvas.toDataURL('image/png'),
      hdColor: result.hdColor,
      width: canvas.width,
      height: canvas.height
    };
  }

  return {
    segmentedData: result.segmentedData,
    hdColor: result.hdColor,
    width: canvas.width,
    height: canvas.height
  };
}
