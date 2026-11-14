/**
 * Woobi 3D Studio - Mirror Reflection Pipeline
 * Manages the offscreen WebGL render target and virtual reflection camera
 * for the illuminated grooming mirror.
 */

export class MirrorReflection {
  constructor(options = {}) {
    this.resolution = options.resolution || 512;
    this.renderTarget = null;
    this.mirrorCamera = null;
    this.mirrorMesh = null;
    this.auxiliaryMirrorMesh = null;
    this.scene = null;
    this.isContextLost = false;
    this.mirrorPosition = options.mirrorPosition || { x: 1.15, y: 1.65, z: -2.80 };
    this.lookAtPosition = options.lookAtPosition || { x: 0.0, y: 1.15, z: 0.0 };
    this.fov = options.fov || 34;
    this.near = options.near || 0.15;
    this.far = options.far || 40;
  }

  setAuxiliaryMirrorMesh(mesh) {
    this.auxiliaryMirrorMesh = mesh;
  }

  /**
   * Initializes the reflection pipeline and binds the texture to the mirror mesh.
   */
  init(THREE, scene, mirrorMesh) {
    if (!THREE || !scene) return;
    this.scene = scene;
    this.mirrorMesh = mirrorMesh;

    try {
      const format = (typeof THREE.RGBAFormat !== 'undefined') ? THREE.RGBAFormat : (THREE.RGBFormat || 1022);
      this.renderTarget = new THREE.WebGLRenderTarget(this.resolution, this.resolution, {
        format: format,
        generateMipmaps: false,
        minFilter: THREE.LinearFilter || 1006,
        magFilter: THREE.LinearFilter || 1006
      });

      // True optical planar reflection camera with realistic perspective matching room distance
      this.mirrorCamera = new THREE.PerspectiveCamera(this.fov, 0.62, this.near, this.far);
      if (this.mirrorCamera.position && typeof this.mirrorCamera.position.set === 'function') {
        this.mirrorCamera.position.set(this.mirrorPosition.x, this.mirrorPosition.y, this.mirrorPosition.z);
      }
      if (typeof this.mirrorCamera.lookAt === 'function') {
        this.mirrorCamera.lookAt(this.lookAtPosition.x, this.lookAtPosition.y, this.lookAtPosition.z);
      }
      scene.add(this.mirrorCamera);

      if (this.mirrorMesh) {
        this.bindMirrorMesh(this.mirrorMesh, THREE);
      }
    } catch (err) {
      console.warn('[MirrorReflection] Failed to initialize WebGL render target:', err);
    }
  }

  /**
   * Binds a mirror mesh (either procedural or loaded from GLB) to the reflection texture,
   * generating UV texture coordinates if missing from the mesh geometry.
   */
  bindMirrorMesh(mesh, THREEInstance = null) {
    if (!mesh) return;
    this.mirrorMesh = mesh;

    const THREE = THREEInstance || (typeof window !== 'undefined' ? window.THREE : null);

    // Ensure planar UVs with optical horizontal reflection flip
    if (THREE && mesh.geometry && mesh.geometry.attributes?.position && (!mesh.geometry.attributes?.uv || mesh.userData?.forcePlanarUV) && typeof THREE.BufferAttribute !== 'undefined') {
      const pos = mesh.geometry.attributes.position;
      if (typeof mesh.geometry.computeBoundingBox === 'function') {
        mesh.geometry.computeBoundingBox();
      }
      const bb = mesh.geometry.boundingBox;
      const minX = bb ? bb.min.x : -0.505;
      const maxX = bb ? bb.max.x : 0.505;
      const minY = bb ? bb.min.y : 0;
      const maxY = bb ? bb.max.y : 1.625;
      const spanX = (maxX - minX) || 1.0;
      const spanY = (maxY - minY) || 1.0;

      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        // Horizontal flip for true optical mirror reflection
        uvs[i * 2] = 1.0 - ((x - minX) / spanX);
        uvs[i * 2 + 1] = (y - minY) / spanY;
      }
      mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }

    if (this.renderTarget) {
      if (THREE && typeof THREE.MeshBasicMaterial !== 'undefined') {
        mesh.material = new THREE.MeshBasicMaterial({
          map: this.renderTarget.texture,
          toneMapped: false
        });
        mesh.material.map = this.renderTarget.texture;
      } else if (mesh.material) {
        mesh.material.map = this.renderTarget.texture;
        if (mesh.material.color && typeof mesh.material.color.setHex === 'function') {
          mesh.material.color.setHex(0xFFFFFF);
        }
        mesh.material.needsUpdate = true;
      }
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
  }

  /**
   * Safely updates the reflection texture using the provided renderer.
   */
  update(renderer, scene, mainCamera = null) {
    if (!renderer || !this.renderTarget || !this.mirrorCamera || this.isContextLost) return;

    if (this.mirrorMesh) {
      this.mirrorMesh.visible = false; // Hide mirror surface to prevent feedback loop
    }
    if (this.auxiliaryMirrorMesh) {
      this.auxiliaryMirrorMesh.visible = false;
    }

    try {
      // Calculate true mirror position in world coordinates safely without throwing
      let pX = this.mirrorPosition ? (this.mirrorPosition.x || 1.15) : 1.15;
      let pY = this.mirrorPosition ? (this.mirrorPosition.y || 1.65) : 1.65;
      let pZ = this.mirrorPosition ? (this.mirrorPosition.z || -2.85) : -2.85;

      if (this.mirrorMesh && this.mirrorMesh.matrixWorld) {
        if (typeof this.mirrorMesh.updateMatrixWorld === 'function') {
          this.mirrorMesh.updateMatrixWorld(true);
        }
        const m = this.mirrorMesh.matrixWorld.elements;
        if (m && m.length >= 15 && !isNaN(m[12]) && !isNaN(m[13]) && !isNaN(m[14])) {
          pX = m[12];
          pY = m[13];
          pZ = m[14];
        }
      }

      // Position mirror camera directly at the mirror plane inside the room facing the avatar
      if (this.mirrorCamera.position && typeof this.mirrorCamera.position.set === 'function') {
        this.mirrorCamera.position.set(pX, pY, pZ + 0.06);
      }
      if (typeof this.mirrorCamera.lookAt === 'function') {
        this.mirrorCamera.lookAt(this.lookAtPosition.x, this.lookAtPosition.y, this.lookAtPosition.z);
      }
      this.mirrorCamera.fov = 34;
      this.mirrorCamera.near = 0.15;
      this.mirrorCamera.far = 40.0;
      if (typeof this.mirrorCamera.updateProjectionMatrix === 'function') {
        this.mirrorCamera.updateProjectionMatrix();
      }

      renderer.setRenderTarget(this.renderTarget);
      renderer.clear();
      renderer.render(scene, this.mirrorCamera);
      renderer.setRenderTarget(null);
    } catch (err) {
      console.warn('[MirrorReflection] Error rendering mirror reflection:', err);
    } finally {
      if (this.mirrorMesh) {
        this.mirrorMesh.visible = true;
      }
      if (this.auxiliaryMirrorMesh) {
        this.auxiliaryMirrorMesh.visible = true;
      }
    }
  }

  handleContextLost() {
    this.isContextLost = true;
  }

  handleContextRestored(THREE) {
    this.isContextLost = false;
    if (this.scene && this.mirrorMesh) {
      this.init(THREE, this.scene, this.mirrorMesh);
    }
  }

  dispose() {
    if (this.mirrorCamera && this.scene) {
      this.scene.remove(this.mirrorCamera);
      this.mirrorCamera = null;
    }
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
    this.mirrorMesh = null;
    this.scene = null;
  }
}

export default MirrorReflection;
