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
 * Samples perimeter background color and distribution across borders and corners.
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
 * Prunes disconnected foreground clutter, background objects, bedside clutter, or hanger fragments
 * by retaining only the primary central garment component.
 */
export function pruneDisconnectedBackgroundDebris(mask, width, height) {
  const total = width * height;
  const visited = new Uint8Array(total);
  let maxComponentSize = 0;
  let maxComponentLabel = 0;
  const labels = new Int32Array(total);
  let currentLabel = 1;
  const queue = new Int32Array(total);

  for (let i = 0; i < total; i++) {
    if (mask[i] === 0 || visited[i] === 1) continue;
    let head = 0, tail = 0;
    queue[tail++] = i;
    visited[i] = 1;
    labels[i] = currentLabel;
    let size = 0;

    while (head < tail) {
      const idx = queue[head++];
      size++;
      const x = idx % width;
      const y = Math.floor(idx / width);

      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1
      ];

      for (const n of neighbors) {
        if (n !== -1 && mask[n] > 0 && visited[n] === 0) {
          visited[n] = 1;
          labels[n] = currentLabel;
          queue[tail++] = n;
        }
      }
    }

    if (size > maxComponentSize) {
      maxComponentSize = size;
      maxComponentLabel = currentLabel;
    }
    currentLabel++;
  }

  // Prune any disconnected debris that is less than 15% of the primary garment
  const minKeepSize = Math.max(50, maxComponentSize * 0.15);
  for (let i = 0; i < total; i++) {
    if (mask[i] > 0 && labels[i] !== maxComponentLabel && maxComponentSize > 100) {
      mask[i] = 0;
    }
  }

  return mask;
}

/**
 * Calculates garment orientation angle (deskew angle) and centroid from mask.
 */
export function calculateGarmentOrientation(mask, width, height) {
  let m00 = 0, m10 = 0, m01 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] > 0) {
        m00++;
        m10 += x;
        m01 += y;
      }
    }
  }

  if (m00 === 0) return { angle: 0, centroid: { x: width / 2, y: height / 2 }, pixelCount: 0 };

  const cx = m10 / m00;
  const cy = m01 / m00;

  let u20 = 0, u02 = 0, u11 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] > 0) {
        const dx = x - cx;
        const dy = y - cy;
        u20 += dx * dx;
        u02 += dy * dy;
        u11 += dx * dy;
      }
    }
  }

  const theta = 0.5 * Math.atan2(2 * u11, u20 - u02);
  let deg = (theta * 180) / Math.PI;

  // Normalize towards closest vertical axis (0 degrees)
  if (deg > 45) deg -= 90;
  if (deg < -45) deg += 90;

  return {
    angle: deg,
    centroid: { x: cx, y: cy },
    pixelCount: m00
  };
}

/**
 * Neutralizes harsh fold and crease shadow lines in garment fabric while preserving
 * authentic fabric grain, colors, logos, and textures.
 */
export function neutralizeCreaseShadows(imageData, mask, options = {}) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const intensity = options.intensity !== undefined ? options.intensity : 0.85;

  const lumMap = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (mask && mask[i] === 0) continue;
    const idx = i * 4;
    lumMap[i] = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  const radius = Math.max(2, Math.min(10, Math.floor(width / 60)));
  const smoothLum = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask && mask[idx] === 0) continue;

      let sum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy += 2) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 2) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const nIdx = ny * width + nx;
          if (mask && mask[nIdx] === 0) continue;
          sum += lumMap[nIdx];
          count++;
        }
      }
      smoothLum[idx] = count > 0 ? (sum / count) : lumMap[idx];
    }
  }

  let correctedCount = 0;
  for (let i = 0; i < width * height; i++) {
    if (mask && mask[i] === 0) continue;

    const currLum = lumMap[i];
    const targetLum = smoothLum[i];

    if (currLum > 10 && targetLum > 15 && currLum < targetLum * 0.88) {
      const boost = 1 + (targetLum / currLum - 1) * intensity;
      const idx = i * 4;

      data[idx] = Math.min(255, Math.round(data[idx] * boost));
      data[idx + 1] = Math.min(255, Math.round(data[idx + 1] * boost));
      data[idx + 2] = Math.min(255, Math.round(data[idx + 2] * boost));
      correctedCount++;
    }
  }

  return {
    creasesCorrected: correctedCount,
    data
  };
}

/**
 * Real-time Analyzer: detects whether the cloth is folded flat, tilted, or wrinkled.
 * Provides user-friendly live feedback for the camera viewfinder.
 */
export function detectGarmentCreasesAndAlignment(imageData, mask = null) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // 1. Calculate orientation & centroid
  let effectiveMask = mask;
  if (!effectiveMask) {
    // Generate fast luminance threshold mask
    effectiveMask = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const a = data[idx + 3];
      if (a >= 128) effectiveMask[i] = 255;
    }
  }

  const orientation = calculateGarmentOrientation(effectiveMask, width, height);
  const isCentered = Math.abs(orientation.centroid.x - width / 2) < width * 0.18;
  const isUpright = Math.abs(orientation.angle) < 6;

  // 2. Measure high-frequency crease / wrinkle density
  let creaseGradientSum = 0;
  let fgPixels = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = y * width + x;
      if (effectiveMask[idx] === 0) continue;

      fgPixels++;
      const pIdx = idx * 4;
      const rightIdx = (idx + 1) * 4;
      const downIdx = (idx + width) * 4;

      const lum = (0.299 * data[pIdx] + 0.587 * data[pIdx + 1] + 0.114 * data[pIdx + 2]);
      const lumR = (0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2]);
      const lumD = (0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2]);

      const grad = Math.abs(lum - lumR) + Math.abs(lum - lumD);
      if (grad > 25) {
        creaseGradientSum++;
      }
    }
  }

  const creaseRatio = fgPixels > 0 ? (creaseGradientSum / fgPixels) : 0;
  const tiltPenalty = Math.min(30, Math.round(Math.abs(orientation.angle) * 2.5));
  const creasePenalty = Math.min(50, Math.round(creaseRatio * 200));

  const flatnessScore = Math.max(40, Math.min(99, 100 - creasePenalty - tiltPenalty));
  const isFlat = flatnessScore >= 80;

  let feedback = '✓ Garment is flat & aligned';
  let status = 'ready';

  if (!isCentered) {
    feedback = '↔️ Center the garment within the guideline outline';
    status = 'align';
  } else if (!isUpright) {
    feedback = '↔️ Straighten garment: align shoulders/waist perpendicular';
    status = 'rotate';
  } else if (!isFlat) {
    feedback = '⚠️ Uneven Folds / Creases: Smooth sleeves & body flat';
    status = 'flatten';
  }

  return {
    flatnessScore,
    isFlat,
    hasCreases: !isFlat,
    angle: Math.round(orientation.angle * 10) / 10,
    centered: isCentered,
    feedback,
    status
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
    const fallbackColor = {
      hex: '#243242',
      intHex: 0x243242,
      rgb: { r: 36, g: 50, b: 66 },
      luminance: 35,
      percent: 100,
      role: 'primary'
    };
    return {
      hex: fallbackColor.hex,
      intHex: fallbackColor.intHex,
      rgb: fallbackColor.rgb,
      luminance: fallbackColor.luminance,
      primary: fallbackColor,
      secondary: null,
      accent: null,
      palette: [fallbackColor],
      isMultiColor: false,
      samplesCount: 0
    };
  }

  // Convert histogram entries to structured color clusters
  const clusters = [];
  for (const entry of hist.values()) {
    const r = Math.round(entry.rTotal / entry.count);
    const g = Math.round(entry.gTotal / entry.count);
    const b = Math.round(entry.bTotal / entry.count);
    const hex = rgbToHex(r, g, b);
    const intHex = toHexInt(hex);
    const lum = Math.round(getLuminance(r, g, b));
    clusters.push({
      count: entry.count,
      percent: Math.round((entry.count / validCount) * 100),
      hex,
      intHex,
      rgb: { r, g, b },
      luminance: lum
    });
  }

  // Sort clusters descending by pixel count
  clusters.sort((a, b) => b.count - a.count);

  // Extract Primary (Dominant Base Color)
  const primary = { ...clusters[0], role: 'primary' };

  // Extract Secondary (Contrast or Pattern Tone, perceptual color distance > 38)
  let secondary = null;
  for (let i = 1; i < clusters.length; i++) {
    const c = clusters[i];
    const dist = colorDistance(primary.rgb.r, primary.rgb.g, primary.rgb.b, c.rgb.r, c.rgb.g, c.rgb.b);
    if (dist > 38 && c.count >= Math.max(8, validCount * 0.05)) {
      secondary = { ...c, role: 'secondary' };
      break;
    }
  }

  // Extract Accent (Third distinct color tone, if present)
  let accent = null;
  if (secondary) {
    for (let i = 1; i < clusters.length; i++) {
      const c = clusters[i];
      if (c.hex === secondary.hex) continue;
      const dist1 = colorDistance(primary.rgb.r, primary.rgb.g, primary.rgb.b, c.rgb.r, c.rgb.g, c.rgb.b);
      const dist2 = colorDistance(secondary.rgb.r, secondary.rgb.g, secondary.rgb.b, c.rgb.r, c.rgb.g, c.rgb.b);
      if (dist1 > 38 && dist2 > 38 && c.count >= Math.max(5, validCount * 0.03)) {
        accent = { ...c, role: 'accent' };
        break;
      }
    }
  }

  const palette = [primary];
  if (secondary) palette.push(secondary);
  if (accent) palette.push(accent);

  return {
    hex: primary.hex,
    intHex: primary.intHex,
    rgb: primary.rgb,
    luminance: primary.luminance,
    primary,
    secondary: secondary || null,
    accent: accent || null,
    palette,
    isMultiColor: !!(secondary && secondary.percent >= 10),
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

  // Prune disconnected background clutter, stray floor items, or hangers
  pruneDisconnectedBackgroundDebris(mask, width, height);

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

  // Lift harsh fold and crease shadows across garment fabric if enabled
  let creaseCorrection = null;
  if (options.neutralizeCreases !== false) {
    creaseCorrection = neutralizeCreaseShadows({ width, height, data: resultData }, mask, options);
  }

  // Analyze fold flatness, wrinkles, and guideline alignment
  const creaseAnalysis = detectGarmentCreasesAndAlignment({ width, height, data: resultData }, mask);

  // Extract HD color from garment
  const hdColor = extractExactHDColor(imageData, mask);

  return {
    segmentedData: resultData,
    mask,
    hdColor,
    creaseAnalysis,
    creasesNeutralized: creaseCorrection ? creaseCorrection.creasesCorrected : 0,
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
      creaseAnalysis: result.creaseAnalysis,
      creasesNeutralized: result.creasesNeutralized,
      mask: result.mask,
      width: canvas.width,
      height: canvas.height
    };
  }

  return {
    segmentedData: result.segmentedData,
    hdColor: result.hdColor,
    creaseAnalysis: result.creaseAnalysis,
    creasesNeutralized: result.creasesNeutralized,
    mask: result.mask,
    width: canvas.width,
    height: canvas.height
  };
}

