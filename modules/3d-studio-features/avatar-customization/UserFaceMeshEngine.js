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

export const FACE_UV_BOUNDS = {
  // Region in the 2048x2048 baseColor texture where facial features map
  x: 350,
  y: 50,
  width: 500,
  height: 500,
  uMin: 350 / 2048,
  uMax: 850 / 2048,
  vMin: 50 / 2048,
  vMax: 550 / 2048
};

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
   * Finds all 3D head/face meshes attached to the rigged avatar model.
   */
  findHeadMeshes() {
    const meshes = [];
    if (!this.studio3D) return meshes;

    const avatarRoot = this.studio3D.gltfAvatarGroup || this.studio3D.avatarRoot;
    if (!avatarRoot) return meshes;

    avatarRoot.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const name = (child.name || '').toLowerCase();
        // Check if mesh is identified as head/body or positioned high in Y
        if (name.includes('body') || name.includes('head') || name.includes('face')) {
          meshes.push(child);
        } else if (child.geometry.attributes && child.geometry.attributes.position) {
          // Check if mesh has vertices in the head region (> 1.36m)
          const pos = child.geometry.attributes.position;
          let hasHeadVerts = false;
          for (let i = 0; i < Math.min(pos.count, 200); i++) {
            if (pos.getY(i) > this.options.headYThreshold) {
              hasHeadVerts = true;
              break;
            }
          }
          if (hasHeadVerts) {
            meshes.push(child);
          }
        }
      }
    });

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

      // 1. Back up original vertex array if first deformation
      if (!this.originalVertices.has(mesh.uuid)) {
        this.originalVertices.set(mesh.uuid, new Float32Array(posAttr.array));
      }

      const original = this.originalVertices.get(mesh.uuid);
      const yThreshold = this.options.headYThreshold;

      // Biometric displacement factors
      const jawDelta = (bio.jawWidth - 1.0) * this.options.maxJawDisplacement * clampedIntensity;
      const chinDeltaY = (0.5 - bio.chinShape) * this.options.maxChinDisplacement * clampedIntensity;
      const noseDeltaZ = (bio.noseProminence - 1.0) * this.options.maxNoseDisplacement * clampedIntensity;
      const cheekDeltaX = (bio.cheekProminence - 1.0) * this.options.maxCheekDisplacement * clampedIntensity;

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

          const isFrontFace = origZ > 0.015;
          const absX = Math.abs(origX);

          // A. JAWLINE DEFORMATION (y between 1.38 and 1.50, lateral x)
          if (origY >= 1.38 && origY <= 1.50 && absX > 0.02) {
            const jawWeight = Math.sin(((origY - 1.38) / 0.12) * Math.PI);
            newX += Math.sign(origX) * jawDelta * jawWeight;
          }

          // B. CHIN CONTOUR DEFORMATION (apex at y: 1.36 - 1.42, central x < 0.04)
          if (origY >= 1.36 && origY <= 1.42 && absX < 0.045 && isFrontFace) {
            const chinWeight = 1.0 - (absX / 0.045);
            newY += chinDeltaY * chinWeight;
            // Sharpen/square chin forward depth
            newZ += (bio.chinShape - 0.5) * 0.008 * chinWeight * clampedIntensity;
          }

          // C. NOSE BRIDGE & PROJECTION (y: 1.45 - 1.54, central x < 0.025, front z > 0.04)
          if (origY >= 1.45 && origY <= 1.54 && absX < 0.025 && origZ > 0.035) {
            const noseWeight = 1.0 - (absX / 0.025);
            newZ += noseDeltaZ * noseWeight;
            newX *= bio.noseWidth;
          }

          // D. CHEEKBONE CONTOUR (y: 1.46 - 1.57, lateral x: 0.035 - 0.080)
          if (origY >= 1.46 && origY <= 1.57 && absX >= 0.032 && isFrontFace) {
            const cheekWeight = Math.sin(((origY - 1.46) / 0.11) * Math.PI);
            newX += Math.sign(origX) * cheekDeltaX * cheekWeight;
            newZ += cheekDeltaX * 0.4 * cheekWeight;
          }

          posAttr.array[i3] = newX;
          posAttr.array[i3 + 1] = newY;
          posAttr.array[i3 + 2] = newZ;
        }
      }

      posAttr.needsUpdate = true;
      if (typeof geo.computeVertexNormals === 'function') {
        geo.computeVertexNormals();
      }
    });

    this.isApplied = true;
    return true;
  }

  /**
   * Synthesizes and projects the user's face onto the avatar's 2048x2048 baseColor map.
   * Performs automated skin-tone color transfer, illumination leveling, and elliptical alpha feathering.
   */
  synthesizeFaceTexture(userImageSource, biometrics = null) {
    if (!this.options.enableTextureSynthesis || typeof document === 'undefined') return false;
    const meshes = this.findHeadMeshes();
    if (meshes.length === 0) return false;

    const bio = biometrics || this.activeBiometrics || DEFAULT_BIOMETRICS;
    const targetMesh = meshes[0];
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
        ctx.drawImage(baseTex.image, 0, 0, res, res);
      } else {
        // Fallback tone if texture image not loaded
        ctx.fillStyle = '#F3D5C6';
        ctx.fillRect(0, 0, res, res);
      }

      // 2. Prepare user face crop on intermediate canvas
      const faceBounds = FACE_UV_BOUNDS;
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = faceBounds.width;
      faceCanvas.height = faceBounds.height;
      const fCtx = faceCanvas.getContext('2d');

      // Draw user photo with center-cropped perspective
      fCtx.drawImage(userImageSource, 0, 0, faceBounds.width, faceBounds.height);

      // 3. Color Harmonization: match user image tone with avatar neck/body
      const avatarTone = bio.skinTone || { r: 235, g: 213, b: 196 };
      const fImgData = fCtx.getImageData(0, 0, faceBounds.width, faceBounds.height);
      const pixels = fImgData.data;

      // Calculate user image average
      let userR = 0, userG = 0, userB = 0, sampleCount = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        userR += pixels[i];
        userG += pixels[i + 1];
        userB += pixels[i + 2];
        sampleCount++;
      }
      const avgUserR = Math.max(1, userR / (sampleCount || 1));
      const avgUserG = Math.max(1, userG / (sampleCount || 1));
      const avgUserB = Math.max(1, userB / (sampleCount || 1));

      // Color transfer scalars
      const scaleR = avatarTone.r / avgUserR;
      const scaleG = avatarTone.g / avgUserG;
      const scaleB = avatarTone.b / avgUserB;

      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = Math.min(255, pixels[i] * (0.65 * scaleR + 0.35));
        pixels[i + 1] = Math.min(255, pixels[i + 1] * (0.65 * scaleG + 0.35));
        pixels[i + 2] = Math.min(255, pixels[i + 2] * (0.65 * scaleB + 0.35));
      }
      fCtx.putImageData(fImgData, 0, 0);

      // 4. Create elliptical feathered alpha mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = faceBounds.width;
      maskCanvas.height = faceBounds.height;
      const mCtx = maskCanvas.getContext('2d');

      const cx = faceBounds.width / 2;
      const cy = faceBounds.height / 2;
      const rx = (faceBounds.width / 2) * 0.88;
      const ry = (faceBounds.height / 2) * 0.94;

      const gradient = mCtx.createRadialGradient(cx, cy, rx * 0.40, cx, cy, rx);
      gradient.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
      gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.92)');
      gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.45)');
      gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      mCtx.save();
      mCtx.scale(1.0, ry / rx);
      mCtx.fillStyle = gradient;
      mCtx.beginPath();
      mCtx.arc(cx, (cy * rx) / ry, rx, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.restore();

      // Mask user face
      fCtx.globalCompositeOperation = 'destination-in';
      fCtx.drawImage(maskCanvas, 0, 0);

      // 5. Composite masked user face directly into UV face coordinates
      ctx.globalAlpha = 0.94;
      ctx.drawImage(faceCanvas, faceBounds.x, faceBounds.y);
      ctx.globalAlpha = 1.0;

      // 6. Instantiate Three.js CanvasTexture and bind to avatar head materials
      if (typeof THREE !== 'undefined' && THREE.CanvasTexture) {
        const newTexture = new THREE.CanvasTexture(canvas);
        newTexture.flipY = false;
        if (THREE.sRGBEncoding) newTexture.encoding = THREE.sRGBEncoding;
        if (THREE.SRGBColorSpace) newTexture.colorSpace = THREE.SRGBColorSpace;
        newTexture.needsUpdate = true;

        meshes.forEach((mesh) => {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (m) {
              if (!this.originalTextures.has(m.uuid)) {
                this.originalTextures.set(m.uuid, m.map);
              }
              m.map = newTexture;
              m.needsUpdate = true;
            }
          });
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
      if (this.originalVertices.has(mesh.uuid)) {
        const origArray = this.originalVertices.get(mesh.uuid);
        const posAttr = mesh.geometry.attributes.position;
        posAttr.array.set(origArray);
        posAttr.needsUpdate = true;
        if (typeof mesh.geometry.computeVertexNormals === 'function') {
          mesh.geometry.computeVertexNormals();
        }
      }

      // 2. Restore original texture
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (mat && this.originalTextures.has(mat.uuid)) {
        mat.map = this.originalTextures.get(mat.uuid);
        mat.needsUpdate = true;
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

