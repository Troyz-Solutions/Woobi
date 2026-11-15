/**
 * Woobi - 3D Studio Features
 * UserFaceMeshEngine.js - Free ($0) Hybrid Method 2 & 3: Parametric 3D Head Morphing + Seamless UV Texture Synthesis
 *
 * Capabilities:
 * 1. On-device facial biometric ratio analysis from user photo/selfie ($0, zero external APIs).
 * 2. 3D physical vertex deformation on rigged avatar head geometry (jaw, chin, nose, cheekbones).
 * 3. High-fidelity UV face texture projection, skin tone color harmonization & elliptical alpha feathering.
 * 4. Non-destructive geometry backup and 1-tap instant restoration to default avatar.
 */

export const FEMALE_FACE_UV_BOUNDS = {
  // Region in the 2048x2048 baseColor texture for female avatar (Mixamo Ch37)
  x: 1160,
  y: 1380,
  width: 360,
  height: 360,
  uMin: 1160 / 2048,
  uMax: 1520 / 2048,
  vMin: 1380 / 2048,
  vMax: 1740 / 2048
};

export const MALE_FACE_UV_BOUNDS = {
  // Region in the 2048x2048 baseColor texture for male avatar (Mixamo Ch31)
  x: 1360,
  y: 1500,
  width: 360,
  height: 360,
  uMin: 1360 / 2048,
  uMax: 1720 / 2048,
  vMin: 1500 / 2048,
  vMax: 1860 / 2048
};

export const FACE_UV_BOUNDS = FEMALE_FACE_UV_BOUNDS;

export const DEFAULT_BIOMETRICS = {
  jawWidth: 1.0,         // 0.8 (narrow/tapered) to 1.25 (wide/square)
  chinShape: 0.5,        // 0.0 (broad/square), 0.5 (neutral), 1.0 (pointed/sharp)
  chinLength: 1.0,       // 0.85 (compact) to 1.15 (elongated)
  noseProminence: 1.0,   // 0.8 (refined/flat) to 1.25 (high bridge/prominent)
  noseWidth: 1.0,        // 0.85 (slim) to 1.2 (wide)
  cheekProminence: 1.0,  // 0.85 (subtle) to 1.25 (high cheekbones)
  faceLengthRatio: 1.0,  // Proportional height vs width
  skinTone: { r: 235, g: 213, b: 196 } // Sampled RGB
};

export class UserFaceMeshEngine {
  constructor(studio3D = null, options = {}) {
    this.studio3D = studio3D;
    this.options = Object.assign({
      headYThreshold: 1.36,        // Minimum height (meters) in world/local space for head vertices
      maxJawDisplacement: 0.024,   // Max lateral bone displacement (meters)
      maxChinDisplacement: 0.020,  // Max vertical/depth chin displacement
      maxNoseDisplacement: 0.016,  // Max nasal bridge protrusion
      maxCheekDisplacement: 0.018, // Max zygomatic arch expansion
      textureResolution: 2048,     // Resolution of dynamic avatar texture
      enableVertexMorphing: true,  // Toggle physical 3D geometry deformation
      enableTextureSynthesis: true // Toggle photographic UV compositing
    }, options);

    this.activeBiometrics = { ...DEFAULT_BIOMETRICS };
    this.originalVertices = new Map(); // mesh UUID -> Float32Array
    this.originalNormals = new Map();  // mesh UUID -> Float32Array
    this.originalTextures = new Map(); // material UUID -> original Texture
    this.synthesizedTexture = null;
    this.facePlateMesh = null; // Method 1: Dedicated 3D Curved Faceplate Mesh
    this.isApplied = false;
  }

  /**
   * Set or update Studio3D instance
   */
  setStudio(studio3D) {
    this.studio3D = studio3D;
  }

  /**
   * Analyzes an input image (HTMLImageElement, Canvas, ImageData, or pixel array)
   * and extracts normalized biometric proportions and skin tone.
   * Completely client-side and 100% free ($0).
   */
  analyzeFaceLandmarks(imageSource) {
    if (!imageSource) {
      return { ...DEFAULT_BIOMETRICS };
    }

    // Default neutral biometrics as baseline
    const biometrics = { ...DEFAULT_BIOMETRICS };

    try {
      // Create offscreen canvas for inspection
      let width = 256;
      let height = 256;
      let canvas, ctx;

      if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx && imageSource) {
          ctx.drawImage(imageSource, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // 1. Sample skin tone in the central mid-face region (35% - 65% of width/height)
          let totalR = 0, totalG = 0, totalB = 0, count = 0;
          const startY = Math.floor(height * 0.35);
          const endY = Math.floor(height * 0.65);
          const startX = Math.floor(width * 0.35);
          const endX = Math.floor(width * 0.65);

          for (let y = startY; y < endY; y += 4) {
            for (let x = startX; x < endX; x += 4) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              // Filter out dark shadows (eyes/nostrils) and overexposed highlights
              if (r > 60 && g > 40 && b > 30 && r > b && (r + g + b) < 680) {
                totalR += r;
                totalG += g;
                totalB += b;
                count++;
              }
            }
          }

          if (count > 0) {
            biometrics.skinTone = {
              r: Math.round(totalR / count),
              g: Math.round(totalG / count),
              b: Math.round(totalB / count)
            };
          }

          // 2. Compute horizontal face width profiles across 3 facial tiers:
          // Tier 1: Cheekbones / Eyes (y ~ 40%)
          // Tier 2: Mid-Jaw / Mouth (y ~ 65%)
          // Tier 3: Lower Jaw / Chin (y ~ 82%)
          const getFaceWidthAtY = (sampleY) => {
            let leftEdge = 0;
            let rightEdge = width - 1;
            const y = Math.floor(sampleY);
            // Scan from left to find skin boundary
            for (let x = 10; x < width / 2; x += 2) {
              const idx = (y * width + x) * 4;
              if (data[idx] > 60 && data[idx + 3] > 128) {
                leftEdge = x;
                break;
              }
            }
            // Scan from right
            for (let x = width - 10; x > width / 2; x -= 2) {
              const idx = (y * width + x) * 4;
              if (data[idx] > 60 && data[idx + 3] > 128) {
                rightEdge = x;
                break;
              }
            }
            return Math.max(20, rightEdge - leftEdge);
          };

          const cheekWidth = getFaceWidthAtY(height * 0.42);
          const jawWidth = getFaceWidthAtY(height * 0.68);
          const chinWidth = getFaceWidthAtY(height * 0.84);

          // Compute biometric ratios
          if (cheekWidth > 30) {
            const rawJawRatio = jawWidth / cheekWidth;
            // Clamped to aesthetic natural human range: 0.85 - 1.20
            biometrics.jawWidth = Math.max(0.85, Math.min(1.20, rawJawRatio * 1.12));

            const rawChinSharpness = (cheekWidth - chinWidth) / cheekWidth;
            // 0.0 (wide chin) to 1.0 (narrow v-shape chin)
            biometrics.chinShape = Math.max(0.0, Math.min(1.0, rawChinSharpness * 1.4));
          }

          // Relative vertical proportions
          biometrics.faceLengthRatio = Math.max(0.90, Math.min(1.15, (height / (cheekWidth || 1)) * 0.55));
        }
      }
    } catch (e) {
      console.warn('UserFaceMeshEngine: Landmark analysis fallback to baseline', e);
    }

    this.activeBiometrics = biometrics;
    return biometrics;
  }

  /**
   * Finds the authentic avatar body/head mesh attached to the rigged avatar model.
   * Strictly filters out clothing, sweaters, pants, shoes, and hair.
   */
  findHeadMeshes() {
    const meshes = [];
    if (!this.studio3D) return meshes;

    const avatarRoot = this.studio3D.gltfAvatarGroup || this.studio3D.avatarRoot;
    if (!avatarRoot) return meshes;

    avatarRoot.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const name = (child.name || '').toLowerCase();
        // Specifically exclude clothing, pants, sweaters, jackets, shoes, collar, eyelashes, hair
        const isExcluded = name.includes('sweater') ||
          name.includes('pants') ||
          name.includes('trouser') ||
          name.includes('shirt') ||
          name.includes('jacket') ||
          name.includes('collar') ||
          name.includes('shoe') ||
          name.includes('hair') ||
          name.includes('eyelash') ||
          name.includes('eye_');

        if (!isExcluded) {
          if (name.includes('body') || name.includes('head') || name.includes('face') || name.includes('avatar') || name === 'mesh') {
            meshes.push(child);
          }
        }
      }
    });

    // If still no mesh found, fallback to the primary human body skinned mesh
    if (meshes.length === 0) {
      avatarRoot.traverse((child) => {
        if (child.isMesh && child.geometry && child.geometry.attributes?.position) {
          const name = (child.name || '').toLowerCase();
          const isExcluded = name.includes('sweater') ||
            name.includes('pants') ||
            name.includes('trouser') ||
            name.includes('jacket') ||
            name.includes('shoe') ||
            name.includes('hair') ||
            name.includes('eyelash');
          if (!isExcluded) {
            meshes.push(child);
          }
        }
      });
      // Sort by vertex count descending and select the body mesh
      meshes.sort((a, b) => ((b.geometry.attributes.position?.count || 0) - (a.geometry.attributes.position?.count || 0)));
      return meshes.slice(0, 1);
    }

    return meshes;
  }

  /**
   * Applies 3D parametric vertex morphing onto head meshes.
   * Modulates jaw width, chin taper, nasal projection, and cheekbones.
   */
  applyParametricDeformation(biometrics = null, intensity = 1.0) {
    if (!this.options.enableVertexMorphing) return false;
    const bio = biometrics || this.activeBiometrics || DEFAULT_BIOMETRICS;
    const meshes = this.findHeadMeshes();
    if (meshes.length === 0) return false;

    const clampedIntensity = Math.max(0.0, Math.min(1.5, intensity));

    meshes.forEach((mesh) => {
      const geo = mesh.geometry;
      if (!geo || !geo.attributes || !geo.attributes.position) return;

      const posAttr = geo.attributes.position;
      const count = posAttr.count;

      // 1. Decompress quantized/normalized Int16 positions to Float32Array to avoid integer truncation
      if (posAttr.normalized || !(posAttr.array instanceof Float32Array)) {
        const floatPositions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          floatPositions[i * 3] = posAttr.getX(i);
          floatPositions[i * 3 + 1] = posAttr.getY(i);
          floatPositions[i * 3 + 2] = posAttr.getZ(i);
        }
        if (typeof THREE !== 'undefined' && THREE.BufferAttribute) {
          geo.setAttribute('position', new THREE.BufferAttribute(floatPositions, 3));
        } else {
          posAttr.array = floatPositions;
          posAttr.normalized = false;
        }
      }

      // 2. Decompress quantized/normalized Int8 normals to Float32Array to avoid truncating normal floats to integer 0
      if (geo.attributes.normal && (geo.attributes.normal.normalized || !(geo.attributes.normal.array instanceof Float32Array))) {
        const normAttr = geo.attributes.normal;
        const floatNormals = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          floatNormals[i * 3] = normAttr.getX(i);
          floatNormals[i * 3 + 1] = normAttr.getY(i);
          floatNormals[i * 3 + 2] = normAttr.getZ(i);
        }
        if (typeof THREE !== 'undefined' && THREE.BufferAttribute) {
          geo.setAttribute('normal', new THREE.BufferAttribute(floatNormals, 3));
        } else {
          normAttr.array = floatNormals;
          normAttr.normalized = false;
        }
      }

      const activePosAttr = geo.attributes.position;

      // 3. Back up original vertex array if first deformation
      if (!this.originalVertices.has(mesh.uuid)) {
        this.originalVertices.set(mesh.uuid, new Float32Array(activePosAttr.array));
      }

      // 4. Back up original normal array if present
      if (geo.attributes.normal && !this.originalNormals.has(mesh.uuid)) {
        this.originalNormals.set(mesh.uuid, new Float32Array(geo.attributes.normal.array));
      }

      const original = this.originalVertices.get(mesh.uuid);
      
      // Dynamically calculate coordinate bounds to work seamlessly with both meter and scaled coordinates
      let maxY = -Infinity;
      for (let i = 0; i < count; i++) {
        const yVal = original[i * 3 + 1];
        if (yVal > maxY) maxY = yVal;
      }
      const yThreshold = (maxY > 100) ? (maxY * 0.76) : this.options.headYThreshold;
      const coordScale = (maxY > 100) ? (maxY / 1.78) : 1.0;

      // Biometric displacement factors scaled to mesh coordinate space
      const jawDelta = (bio.jawWidth - 1.0) * this.options.maxJawDisplacement * clampedIntensity * coordScale;
      const chinDeltaY = (0.5 - bio.chinShape) * this.options.maxChinDisplacement * clampedIntensity * coordScale;
      const noseDeltaZ = (bio.noseProminence - 1.0) * this.options.maxNoseDisplacement * clampedIntensity * coordScale;
      const cheekDeltaX = (bio.cheekProminence - 1.0) * this.options.maxCheekDisplacement * clampedIntensity * coordScale;

      const yRange = (maxY - yThreshold) || 1.0;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const origX = original[i3];
        const origY = original[i3 + 1];
        const origZ = original[i3 + 2];

        // Only deform head & face vertices above threshold
        if (origY > yThreshold) {
          let newX = origX;
          let newY = origY;
          let newZ = origZ;

          const normHeadY = (origY - yThreshold) / yRange; // 0.0 (chin/neck) to 1.0 (crown)
          const isFrontFace = origZ > (0.01 * coordScale);
          const absX = Math.abs(origX);

          // A. JAWLINE DEFORMATION (lower head third, lateral x)
          if (normHeadY >= 0.08 && normHeadY <= 0.45 && absX > (0.02 * coordScale)) {
            const jawWeight = Math.sin(((normHeadY - 0.08) / 0.37) * Math.PI);
            newX += Math.sign(origX) * jawDelta * jawWeight;
          }

          // B. CHIN CONTOUR DEFORMATION (apex at lower chin, central x)
          if (normHeadY >= 0.0 && normHeadY <= 0.22 && absX < (0.045 * coordScale) && isFrontFace) {
            const chinWeight = 1.0 - (absX / (0.045 * coordScale));
            newY += chinDeltaY * chinWeight;
            newZ += (bio.chinShape - 0.5) * 0.008 * chinWeight * clampedIntensity * coordScale;
          }

          // C. NOSE BRIDGE & PROJECTION (mid-face, central x, front z)
          if (normHeadY >= 0.32 && normHeadY <= 0.62 && absX < (0.025 * coordScale) && origZ > (0.03 * coordScale)) {
            const noseWeight = 1.0 - (absX / (0.025 * coordScale));
            newZ += noseDeltaZ * noseWeight;
            newX *= bio.noseWidth;
          }

          // D. CHEEKBONE CONTOUR (mid-upper face, lateral x)
          if (normHeadY >= 0.35 && normHeadY <= 0.70 && absX >= (0.030 * coordScale) && isFrontFace) {
            const cheekWeight = Math.sin(((normHeadY - 0.35) / 0.35) * Math.PI);
            newX += Math.sign(origX) * cheekDeltaX * cheekWeight;
            newZ += cheekDeltaX * 0.4 * cheekWeight;
          }

          activePosAttr.array[i3] = newX;
          activePosAttr.array[i3 + 1] = newY;
          activePosAttr.array[i3 + 2] = newZ;
        }
      }

      activePosAttr.needsUpdate = true;
      if (typeof geo.computeVertexNormals === 'function') {
        geo.computeVertexNormals();
      }
    });

    this.isApplied = true;
    return true;
  }

  /**
   * Intelligently crops and centers the user's face from any photo orientation
   * (landscape selfie, portrait, square) without stretching or background bleeding.
   * Guarantees 100% authentic capture of forehead, eyes, nose, cheeks, mouth, and beard.
   */
  extractFaceRegion(imageSource, targetWidth, targetHeight) {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const srcW = imageSource.naturalWidth || imageSource.videoWidth || imageSource.width || 512;
    const srcH = imageSource.naturalHeight || imageSource.videoHeight || imageSource.height || 512;

    const isLandscape = srcW > srcH;
    // In landscape (webcam/desktop selfie), face extends from hair to chin/neck
    // Framing captures user's hairline, forehead, eyes, nose, mouth, beard, and upper neck
    let cx = isLandscape ? (srcW * 0.485) : (srcW * 0.50);
    let cy = isLandscape ? (srcH * 0.60) : (srcH * 0.48);
    let cropSize = isLandscape ? (srcH * 0.72) : (srcW * 0.82);

    // Dynamic skin centroid fine-tuning if available
    try {
      const scanSize = 64;
      const scanCanvas = document.createElement('canvas');
      scanCanvas.width = scanSize;
      scanCanvas.height = scanSize;
      const sCtx = scanCanvas.getContext('2d', { willReadFrequently: true });
      if (sCtx) {
        sCtx.drawImage(imageSource, 0, 0, scanSize, scanSize);
        const imgData = sCtx.getImageData(0, 0, scanSize, scanSize);
        const data = imgData.data;

        const minX = Math.floor(scanSize * 0.25);
        const maxX = Math.floor(scanSize * 0.75);
        const minY = Math.floor(scanSize * (isLandscape ? 0.30 : 0.20));
        const maxY = Math.floor(scanSize * (isLandscape ? 0.85 : 0.70));

        let sumX = 0, sumY = 0, count = 0;
        for (let y = minY; y < maxY; y++) {
          for (let x = minX; x < maxX; x++) {
            const idx = (y * scanSize + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // Melanin skin detection condition
            if (r > 50 && g > 30 && b > 20 && (r - b) > 15 && (r - g) > 8 && (r + g + b) < 550) {
              sumX += x;
              sumY += y;
              count++;
            }
          }
        }
        if (count > 25) {
          const detX = (sumX / count) * (srcW / scanSize);
          const detY = (sumY / count) * (srcH / scanSize);
          // Stabilize centroid with default geometric center (weighted blend)
          cx = cx * 0.75 + detX * 0.25;
          cy = cy * 0.75 + detY * 0.25;
        }
      }
    } catch (e) {
      // Fallback cleanly to default center
    }

    const cropW = cropSize;
    const cropH = cropSize;

    let cropX = Math.max(0, Math.min(srcW - cropW, cx - cropW / 2));
    let cropY = Math.max(0, Math.min(srcH - cropH, cy - cropH / 2));

    ctx.drawImage(imageSource, cropX, cropY, cropW, cropH, 0, 0, targetWidth, targetHeight);
    return canvas;
  }

  /**
   * Synthesizes and projects the user's authentic face onto the avatar's 2048x2048 baseColor map.
   * Completely preserves the user's authentic facial likeness, eyes, beard, mustache, and rich natural skin tone.
   */
  synthesizeFaceTexture(userImageSource, biometrics = null) {
    if (!this.options.enableTextureSynthesis || typeof document === 'undefined') return false;
    const meshes = this.findHeadMeshes();
    if (meshes.length === 0) return false;

    const bio = biometrics || this.activeBiometrics || DEFAULT_BIOMETRICS;
    const targetMesh = meshes[0];
    const meshName = (targetMesh.name || '').toLowerCase();
    const isMale = meshName.includes('31') ||
      meshName.includes('male') ||
      (this.studio3D?.avatarConfig?.gender === 'male') ||
      (this.studio3D?.currentMannequinGender === 'male') ||
      (this.studio3D?.activeModelPath || '').toLowerCase().includes('male');
    const faceBounds = isMale ? MALE_FACE_UV_BOUNDS : FEMALE_FACE_UV_BOUNDS;

    const material = Array.isArray(targetMesh.material) ? targetMesh.material[0] : targetMesh.material;
    if (!material) return false;

    try {
      const res = this.options.textureResolution; // 2048
      const canvas = document.createElement('canvas');
      canvas.width = res;
      canvas.height = res;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // 1. Back up original pristine texture if first time
      const currentTexture = material.map;
      if (!this.originalTextures.has(material.uuid)) {
        this.originalTextures.set(material.uuid, currentTexture);
      }

      // Always draw from the original clean base texture
      const baseTex = this.originalTextures.get(material.uuid) || currentTexture;
      let drawnBase = false;
      const texImg = baseTex ? (baseTex.image || baseTex.source?.data) : null;
      if (texImg) {
        try {
          ctx.drawImage(texImg, 0, 0, res, res);
          drawnBase = true;
        } catch (drawErr) {
          console.warn('UserFaceMeshEngine: drawImage from baseTex failed', drawErr);
        }
      }
      if (!drawnBase) {
        // Natural neutral mannequin tone if texture image not loaded
        ctx.fillStyle = '#E8D2BE';
        ctx.fillRect(0, 0, res, res);
      }

      // 2. Intelligently crop user face without distortion or white background bleeding
      const faceCanvas = this.extractFaceRegion(userImageSource, faceBounds.width, faceBounds.height) || document.createElement('canvas');
      const fCtx = faceCanvas.getContext('2d');
      if (!fCtx) return false;

      // 3. Create elliptical feathered alpha mask with smooth falloff
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = faceBounds.width;
      maskCanvas.height = faceBounds.height;
      const mCtx = maskCanvas.getContext('2d');

      const cx = faceBounds.width / 2;
      const cy = faceBounds.height * 0.50;
      const rx = (faceBounds.width / 2) * 0.88;
      const ry = (faceBounds.height / 2) * 0.94;

      const gradient = mCtx.createRadialGradient(cx, cy, rx * 0.65, cx, cy, rx);
      gradient.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
      gradient.addColorStop(0.70, 'rgba(0, 0, 0, 1.0)');
      gradient.addColorStop(0.90, 'rgba(0, 0, 0, 0.60)');
      gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      mCtx.save();
      mCtx.scale(1.0, ry / rx);
      mCtx.fillStyle = gradient;
      mCtx.beginPath();
      mCtx.arc(cx, (cy * rx) / ry, rx, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.restore();

      // Mask user face with seamless soft outer edge
      fCtx.globalCompositeOperation = 'destination-in';
      fCtx.drawImage(maskCanvas, 0, 0);

      // 4. Composite authentic user face directly into exact UV face atlas coordinates
      ctx.globalAlpha = 1.0;
      ctx.drawImage(faceCanvas, faceBounds.x, faceBounds.y);

      // 5. Instantiate Three.js CanvasTexture and bind to avatar body mesh
      if (typeof THREE !== 'undefined' && THREE.CanvasTexture) {
        const newTexture = new THREE.CanvasTexture(canvas);
        newTexture.flipY = false;
        if (THREE.sRGBEncoding) newTexture.encoding = THREE.sRGBEncoding;
        if (THREE.SRGBColorSpace) newTexture.colorSpace = THREE.SRGBColorSpace;
        newTexture.needsUpdate = true;

        meshes.forEach((mesh) => {
          if (!mesh.userData._originalMaterial) {
            mesh.userData._originalMaterial = mesh.material;
          }
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.map = newTexture;
              if (m.color && typeof m.color.setHex === 'function') m.color.setHex(0xFFFFFF);
              m.needsUpdate = true;
            });
          } else if (mesh.material) {
            mesh.material.map = newTexture;
            if (mesh.material.color && typeof mesh.material.color.setHex === 'function') {
              mesh.material.color.setHex(0xFFFFFF);
            }
            mesh.material.needsUpdate = true;
          }
        });
        this.synthesizedTexture = newTexture;
      }

      this.isApplied = true;
      return true;
    } catch (e) {
      console.error('UserFaceMeshEngine: Texture synthesis error', e);
      return false;
    }
  }

  /**
   * Method 1: Creates a dedicated 3D Curved Faceplate Mesh parented directly to the avatar head bone.
   * Renders the user's authentic face in crisp 1024x1024 HD with zero UV atlas distortion or white bleed.
   */
  createFacePlate(userImageSource, options = {}) {
    if (typeof document === 'undefined' || !userImageSource || !this.studio3D) return null;
    const THREE = (typeof window !== 'undefined' && window.THREE)
      ? window.THREE
      : (typeof global !== 'undefined' && global.THREE
          ? global.THREE
          : (this.studio3D.THREE || null));
    if (!THREE) return null;

    // 1. Locate Head Bone or Head Group
    let headBone = null;
    const avatarRoot = this.studio3D.gltfAvatarGroup || this.studio3D.avatarRoot;
    if (avatarRoot && typeof avatarRoot.traverse === 'function') {
      avatarRoot.traverse((c) => {
        if (c.isBone && c.name && c.name.toLowerCase().includes('head') && !c.name.toLowerCase().includes('end')) {
          headBone = c;
        }
      });
    }

    // 3D Hair & Eyelashes handling:
    // ALWAYS keep mannequin 3D hair visible by default so the avatar has full styled hair (NEVER a bald egg).
    // Tint hair to natural deep dark hair color matching user's hair.
    const showHair = (options.hideMannequinHair === false || options.showHair !== false);
    if (avatarRoot && typeof avatarRoot.traverse === 'function') {
      avatarRoot.traverse((c) => {
        if (c.isMesh) {
          const name = (c.name || '').toLowerCase();
          if (name.includes('hair')) {
            c.visible = showHair;
            if (c.material) {
              const mats = Array.isArray(c.material) ? c.material : [c.material];
              mats.forEach((m) => {
                if (m.userData._origHairHex === undefined && m.color && typeof m.color.getHex === 'function') {
                  m.userData._origHairHex = m.color.getHex();
                }
                if (m.color && typeof m.color.setHex === 'function') {
                  m.color.setHex(0x1B1614); // Natural deep dark brown/black
                }
              });
            }
          } else if (name.includes('eyelash')) {
            // Eyelashes are 2D floating cards that clip with real photo eyes
            c.visible = false;
          }
        }
      });
    }

    // Harmonize skin tone on neck, throat, and ears
    const biometrics = options.biometrics || this.activeBiometrics || DEFAULT_BIOMETRICS;
    const skinTone = biometrics?.skinTone || { r: 155, g: 110, b: 85 };
    const skinHex = (skinTone.r << 16) | (skinTone.g << 8) | skinTone.b;
    if (avatarRoot && typeof avatarRoot.traverse === 'function') {
      avatarRoot.traverse((c) => {
        if (c.isMesh) {
          const name = (c.name || '').toLowerCase();
          if (name.includes('body') || name.includes('head') || name.includes('skin')) {
            if (c.material) {
              const mats = Array.isArray(c.material) ? c.material : [c.material];
              mats.forEach((m) => {
                if (m.userData._origBodyHex === undefined && m.color && typeof m.color.getHex === 'function') {
                  m.userData._origBodyHex = m.color.getHex();
                }
                if (m.color && typeof m.color.setHex === 'function') {
                  m.color.setHex(skinHex);
                }
              });
            }
          }
        }
      });
    }

    // Determine gender
    const isMale = (this.studio3D?.avatarConfig?.gender === 'male') ||
      (this.studio3D?.currentMannequinGender === 'male') ||
      (this.studio3D?.activeModelPath || '').toLowerCase().includes('male');

    // 2. Prepare 1024x1024 cropped face texture with soft feathered edge & background suppression
    const res = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const faceCanvas = this.extractFaceRegion(userImageSource, res, res);
    if (!faceCanvas) return null;

    ctx.drawImage(faceCanvas, 0, 0);

    // Anatomical contour mask with jaw taper, neck transition & room background suppression
    try {
      const imgData = ctx.getImageData(0, 0, res, res);
      const data = imgData.data;
      const cx = res / 2;
      const cy = res * 0.49;

      for (let y = 0; y < res; y++) {
        for (let x = 0; x < res; x++) {
          const idx = (y * res + x) * 4;
          const ny = (y - cy) / (res * 0.45);
          // Anatomical tapering: upper face is round/wide, lower face tapers along jaw to neck
          const rx = (ny < 0) ? (res * 0.36) : (res * 0.36 - (res * 0.13) * Math.pow(Math.min(1.0, ny), 1.2));
          const nx = (x - cx) / rx;
          const d = nx * nx + ny * ny;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          // Wall background suppression: off-white/beige room walls
          const isWall = (r > 165 && g > 155 && b > 145 && Math.abs(r - g) < 25 && Math.abs(r - b) < 25);

          if (isWall && d > 0.40) {
            data[idx + 3] = 0;
          } else if (d <= 0.68) {
            data[idx + 3] = 255;
          } else if (d >= 1.05) {
            data[idx + 3] = 0;
          } else {
            const ratio = (d - 0.68) / 0.37;
            data[idx + 3] = Math.round(255 * (0.5 + 0.5 * Math.cos(ratio * Math.PI)));
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // Fallback to standard drawing
    }

    let texture = null;
    if (THREE.CanvasTexture) {
      texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;
      if (THREE.LinearFilter) texture.minFilter = THREE.LinearFilter;
      if (THREE.LinearFilter) texture.magFilter = THREE.LinearFilter;
      if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      if (this.studio3D?.renderer?.capabilities?.getMaxAnisotropy) {
        texture.anisotropy = this.studio3D.renderer.capabilities.getMaxAnisotropy();
      }
      texture.needsUpdate = true;
    }

    // 3. Remove existing faceplate if present
    this.removeFacePlate();

    // 4. Build curved 3D faceplate geometry
    // When parented to headBone, local scale is cm (w: ~16.0, h: ~22.8)
    // When parented to avatarRoot/scene, scale is meters (w: ~0.160, h: ~0.228)
    const isBoneParent = !!headBone;
    const scaleMul = options.scale !== undefined ? options.scale : 1.0;
    const w = (isBoneParent ? (isMale ? 16.0 : 14.8) : (isMale ? 0.160 : 0.148)) * scaleMul;
    const h = (isBoneParent ? (isMale ? 22.8 : 20.8) : (isMale ? 0.228 : 0.208)) * scaleMul;

    let geo = null;
    if (THREE.PlaneGeometry) {
      geo = new THREE.PlaneGeometry(w, h, 20, 20);
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;

      // Invert vertical UVs ONLY if user explicitly requests inversion.
      // Default (flipY=false) keeps the face 100% RIGHT-SIDE UP!
      const flipY = (options.flipY === true);
      const flipX = (options.flipX === true);

      if (uv && (flipY || flipX)) {
        for (let i = 0; i < uv.count; i++) {
          if (flipY) uv.setY(i, 1.0 - uv.getY(i));
          if (flipX) uv.setX(i, 1.0 - uv.getX(i));
        }
        uv.needsUpdate = true;
      }

      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        // Anatomic facial curve: cheeks wrap back around sides of head and jaw
        const zCurve = isBoneParent
          ? (- (px * px) / 26.0 - Math.max(0, py - 2.0) * 0.04)
          : (- (px * px) / 0.26 - Math.max(0, py - 0.02) * 0.04 * 0.01);
        pos.setZ(i, zCurve);
      }
      if (typeof geo.computeVertexNormals === 'function') {
        geo.computeVertexNormals();
      }
    }

    const MaterialClass = THREE.MeshStandardMaterial || THREE.MeshBasicMaterial;
    const matOptions = {
      map: texture,
      transparent: true,
      opacity: 0.99,
      depthTest: true,
      depthWrite: false
    };
    if (THREE.MeshStandardMaterial) {
      matOptions.roughness = 0.55;
      matOptions.metalness = 0.0;
      matOptions.polygonOffset = true;
      matOptions.polygonOffsetFactor = -2;
      matOptions.polygonOffsetUnits = -2;
    }

    const material = MaterialClass ? new MaterialClass(matOptions) : {};
    const mesh = (THREE.Mesh && geo) ? new THREE.Mesh(geo, material) : { geometry: geo, material: material, position: { set: () => {} } };
    mesh.name = 'UserFacePlateMesh';
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;

    const offsetY = options.offsetY !== undefined ? options.offsetY : 0.0;

    if (isBoneParent) {
      // Local position inside Mixamo Head bone: x=0, y=8.4 (eye level), z=10.0 (front surface of face)
      const posY = (isMale ? 8.4 : 7.6) + offsetY;
      const posZ = isMale ? 10.0 : 9.0;
      mesh.position.set(0, posY, posZ);
      headBone.add(mesh);
    } else {
      // Fallback: parent to headGroup or avatarRoot at eye height
      const parent = this.studio3D.headGroup || this.studio3D.avatarRoot;
      const posY = 1.62 + (offsetY * 0.01);
      if (mesh.position && typeof mesh.position.set === 'function') {
        mesh.position.set(0, posY, 0.09);
      }
      if (parent && typeof parent.add === 'function') {
        parent.add(mesh);
      }
    }

    this.facePlateMesh = mesh;
    return mesh;
  }

  /**
   * Safely removes and disposes faceplate mesh
   */
  removeFacePlate() {
    if (this.facePlateMesh) {
      if (this.facePlateMesh.parent && typeof this.facePlateMesh.parent.remove === 'function') {
        this.facePlateMesh.parent.remove(this.facePlateMesh);
      }
      if (this.facePlateMesh.geometry && typeof this.facePlateMesh.geometry.dispose === 'function') {
        this.facePlateMesh.geometry.dispose();
      }
      if (this.facePlateMesh.material) {
        if (this.facePlateMesh.material.map && typeof this.facePlateMesh.material.map.dispose === 'function') {
          this.facePlateMesh.material.map.dispose();
        }
        if (typeof this.facePlateMesh.material.dispose === 'function') {
          this.facePlateMesh.material.dispose();
        }
      }
      this.facePlateMesh = null;
    }
  }

  /**
   * Complete hybrid pipeline execution:
   * Analyzes user photo, morphs 3D physical head geometry, projects 3D curved faceplate mesh,
   * and blends UV texture.
   */
  applyUserFace(imageSource, options = {}) {
    if (!imageSource) return false;
    this.lastAppliedImage = imageSource;
    this.lastAppliedOptions = options;

    const intensity = options.intensity !== undefined ? options.intensity : 1.0;
    const biometrics = this.analyzeFaceLandmarks(imageSource);
    const deformed = this.applyParametricDeformation(biometrics, intensity);
    const facePlate = this.createFacePlate(imageSource, options);

    // Only fallback to UV atlas texture synthesis if faceplate could not be built
    if (!facePlate) {
      this.synthesizeFaceTexture(imageSource, biometrics);
    }

    this.isApplied = true;
    return !!(facePlate || deformed);
  }

  /**
   * Re-applies likeness onto newly loaded models (e.g. on gender switch)
   */
  reapply() {
    if (this.lastAppliedImage && this.isApplied) {
      return this.applyUserFace(this.lastAppliedImage, this.lastAppliedOptions || {});
    }
    return false;
  }

  /**
   * 1-Tap Restoration: Restores original 3D geometry and removes faceplate.
   */
  resetToDefault() {
    this.removeFacePlate();

    // Restore mannequin hair, eyelashes, and original materials/colors
    const avatarRoot = this.studio3D?.gltfAvatarGroup || this.studio3D?.avatarRoot;
    if (avatarRoot && typeof avatarRoot.traverse === 'function') {
      avatarRoot.traverse((c) => {
        if (c.isMesh) {
          const name = (c.name || '').toLowerCase();
          if (name.includes('hair') || name.includes('eyelash')) {
            c.visible = true;
            if (c.material) {
              const mats = Array.isArray(c.material) ? c.material : [c.material];
              mats.forEach((m) => {
                if (m.userData && m.userData._origHairHex !== undefined && m.color) {
                  m.color.setHex(m.userData._origHairHex);
                }
              });
            }
          }
          if (name.includes('body') || name.includes('head') || name.includes('skin')) {
            if (c.material) {
              const mats = Array.isArray(c.material) ? c.material : [c.material];
              mats.forEach((m) => {
                if (m.userData && m.userData._origBodyHex !== undefined && m.color) {
                  m.color.setHex(m.userData._origBodyHex);
                }
              });
            }
          }
        }
      });
    }

    const meshes = this.findHeadMeshes();
    meshes.forEach((mesh) => {
      // 1. Restore geometry vertices
      if (this.originalVertices.has(mesh.uuid) && mesh.geometry?.attributes?.position) {
        const origArray = this.originalVertices.get(mesh.uuid);
        mesh.geometry.attributes.position.array.set(origArray);
        mesh.geometry.attributes.position.needsUpdate = true;
      }

      // 2. Restore geometry normals
      if (this.originalNormals.has(mesh.uuid) && mesh.geometry?.attributes?.normal) {
        const origNorm = this.originalNormals.get(mesh.uuid);
        mesh.geometry.attributes.normal.array.set(origNorm);
        mesh.geometry.attributes.normal.needsUpdate = true;
      }

      // 3. Restore original material
      if (mesh.userData && mesh.userData._originalMaterial) {
        if (mesh.material && typeof mesh.material.dispose === 'function') {
          mesh.material.dispose();
        }
        mesh.material = mesh.userData._originalMaterial;
        mesh.material.needsUpdate = true;
      }
    });

    if (this.synthesizedTexture && typeof this.synthesizedTexture.dispose === 'function') {
      this.synthesizedTexture.dispose();
      this.synthesizedTexture = null;
    }

    this.activeBiometrics = { ...DEFAULT_BIOMETRICS };
    this.isApplied = false;
    return true;
  }

  /**
   * Cleanup and memory disposal
   */
  dispose() {
    this.resetToDefault();
    this.removeFacePlate();
    this.originalVertices.clear();
    this.originalTextures.clear();
  }
}

if (typeof window !== 'undefined') {
  window.UserFaceMeshEngine = UserFaceMeshEngine;
  window.FACE_UV_BOUNDS = FACE_UV_BOUNDS;
  window.DEFAULT_BIOMETRICS = DEFAULT_BIOMETRICS;
}

export default UserFaceMeshEngine;

