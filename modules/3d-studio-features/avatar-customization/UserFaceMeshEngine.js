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
  x: 1340,
  y: 80,
  width: 400,
  height: 360,
  uMin: 1340 / 2048,
  uMax: 1740 / 2048,
  vMin: 80 / 2048,
  vMax: 440 / 2048
};

export const MALE_FACE_UV_BOUNDS = {
  // Region in the 2048x2048 baseColor texture for male avatar (Mixamo Ch31)
  x: 1330,
  y: 120,
  width: 420,
  height: 380,
  uMin: 1330 / 2048,
  uMax: 1750 / 2048,
  vMin: 120 / 2048,
  vMax: 500 / 2048
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

    // Scan downscaled image to detect user skin/face centroid
    let cx = srcW * 0.48;
    let cy = srcH * 0.56;

    try {
      const scanSize = 128;
      const scanCanvas = document.createElement('canvas');
      scanCanvas.width = scanSize;
      scanCanvas.height = scanSize;
      const sCtx = scanCanvas.getContext('2d', { willReadFrequently: true });
      if (sCtx) {
        sCtx.drawImage(imageSource, 0, 0, scanSize, scanSize);
        const imgData = sCtx.getImageData(0, 0, scanSize, scanSize);
        const data = imgData.data;
        let sumX = 0, sumY = 0, count = 0;

        for (let y = 10; y < scanSize - 10; y++) {
          for (let x = 10; x < scanSize - 10; x++) {
            const idx = (y * scanSize + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // Genuine human skin condition: distinct warmth/melanin vs background wall
            if (r > 55 && g > 35 && b > 25 && (r - b) > 20 && (r - g) > 10 && (r + g + b) < 600) {
              sumX += x;
              sumY += y;
              count++;
            }
          }
        }
        if (count > 60) {
          cx = (sumX / count) * (srcW / scanSize);
          cy = (sumY / count) * (srcH / scanSize);
        }
      }
    } catch (e) {
      // Fallback to default centering
    }

    // Determine crop window matching target aspect ratio (targetWidth / targetHeight)
    const targetAspect = targetWidth / targetHeight;
    let cropH = Math.min(srcH * 0.74, srcW * 0.74);
    let cropW = cropH * targetAspect;

    if (cropW > srcW) {
      cropW = srcW;
      cropH = cropW / targetAspect;
    }
    if (cropH > srcH) {
      cropH = srcH;
      cropW = cropH * targetAspect;
    }

    // Center crop on face/eyes/nose, shifting slightly down from forehead
    let cropX = Math.max(0, Math.min(srcW - cropW, cx - cropW / 2));
    let cropY = Math.max(0, Math.min(srcH - cropH, cy - cropH * 0.48));

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
      if (baseTex && baseTex.image) {
        try {
          ctx.drawImage(baseTex.image, 0, 0, res, res);
        } catch (drawErr) {
          ctx.fillStyle = isMale ? '#DABEA7' : '#F3D5C6';
          ctx.fillRect(0, 0, res, res);
        }
      } else {
        // Fallback tone if texture image not loaded
        ctx.fillStyle = isMale ? '#DABEA7' : '#F3D5C6';
        ctx.fillRect(0, 0, res, res);
      }

      // 2. Intelligently crop user face without distortion or white background bleeding
      const faceCanvas = this.extractFaceRegion(userImageSource, faceBounds.width, faceBounds.height) || document.createElement('canvas');
      const fCtx = faceCanvas.getContext('2d');
      if (!fCtx) return false;

      // 3. Create elliptical feathered alpha mask with smooth Gaussian falloff
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = faceBounds.width;
      maskCanvas.height = faceBounds.height;
      const mCtx = maskCanvas.getContext('2d');

      const cx = faceBounds.width / 2;
      const cy = faceBounds.height * 0.48;
      const rx = (faceBounds.width / 2) * 0.82;
      const ry = (faceBounds.height / 2) * 0.88;

      const gradient = mCtx.createRadialGradient(cx, cy, rx * 0.42, cx, cy, rx);
      gradient.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
      gradient.addColorStop(0.70, 'rgba(0, 0, 0, 1.0)');
      gradient.addColorStop(0.86, 'rgba(0, 0, 0, 0.55)');
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
      ctx.globalAlpha = 0.98;
      ctx.drawImage(faceCanvas, faceBounds.x, faceBounds.y);
      ctx.globalAlpha = 1.0;

      // 5. Instantiate Three.js CanvasTexture and bind ONLY to avatar body mesh
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
          const clonedMat = (typeof mesh.material?.clone === 'function')
            ? mesh.material.clone()
            : Object.assign({}, mesh.material);
          clonedMat.map = newTexture;
          clonedMat.needsUpdate = true;
          mesh.material = clonedMat;
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
   * Complete hybrid pipeline execution:
   * Analyzes user photo, morphs 3D physical head geometry, and projects seamless UV texture.
   */
  applyUserFace(imageSource, options = {}) {
    if (!imageSource) return false;
    this.lastAppliedImage = imageSource;
    this.lastAppliedOptions = options;

    const intensity = options.intensity !== undefined ? options.intensity : 1.0;
    const biometrics = this.analyzeFaceLandmarks(imageSource);
    const deformed = this.applyParametricDeformation(biometrics, intensity);
    const textured = this.synthesizeFaceTexture(imageSource, biometrics);

    return deformed || textured;
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
   * 1-Tap Restoration: Restores original 3D geometry and original baseColor texture.
   */
  resetToDefault() {
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

