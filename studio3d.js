/**
 * AURA / SÉRÉN 3D VIRTUAL FASHION STUDIO ENGINE — PRODUCTION GRADE V2
 * True-to-Reference Studio Architecture, Lighting Contrast, Humanoid Model & Dual-View Mirror
 * Based on Sérén Visual Reference (media_1791534094302.jpg)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Studio3D = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Camera Presets configured specifically for Portrait Mobile Framing (360x800 to 390x844)
  const CAMERA_STATES = {
    STUDIO_OVERVIEW: {
      position: new THREE.Vector3(0, 1.25, 3.25),
      target: new THREE.Vector3(0, 1.02, 0),
      fovLandscape: 46,
      fovPortrait: 58
    },
    WARDROBE_CLOSEUP: {
      position: new THREE.Vector3(-0.55, 1.30, 1.50),
      target: new THREE.Vector3(-0.80, 1.25, -0.15),
      fovLandscape: 42,
      fovPortrait: 48
    },
    AVATAR_FULL_BODY: {
      position: new THREE.Vector3(0, 1.10, 2.10),
      target: new THREE.Vector3(0, 0.95, 0),
      fovLandscape: 38,
      fovPortrait: 44
    },
    AVATAR_DETAIL: {
      position: new THREE.Vector3(0, 1.42, 1.15),
      target: new THREE.Vector3(0, 1.34, 0),
      fovLandscape: 34,
      fovPortrait: 40
    },
    MIRROR_VIEW: {
      position: new THREE.Vector3(0.55, 1.30, 1.50),
      target: new THREE.Vector3(0.80, 1.25, -0.15),
      fovLandscape: 42,
      fovPortrait: 48
    }
  };

  class Studio3DEngine {
    constructor() {
      this.isInitialized = false;
      this.container = null;
      this.canvas = null;
      this.scene = null;
      this.camera = null;
      this.renderer = null;

      // Real-time Mirror Render Pipeline
      this.mirrorRenderTarget = null;
      this.mirrorCamera = null;
      this.mirrorGlassMesh = null;

      // Camera Animation State
      this.currentCameraState = 'STUDIO_OVERVIEW';
      this.targetCameraPos = CAMERA_STATES.STUDIO_OVERVIEW.position.clone();
      this.targetCameraLookAt = CAMERA_STATES.STUDIO_OVERVIEW.target.clone();
      this.currentCameraLookAt = CAMERA_STATES.STUDIO_OVERVIEW.target.clone();

      // Interactive 3D Objects for Raycasting
      this.interactiveObjects = [];
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      // Avatar & Wearable Garment System
      this.avatarGroup = null;
      this.chestGroup = null;
      this.headGroup = null;
      this.garmentMeshes = {
        top: {},
        bottom: {},
        shoes: {}
      };
      this.activeGarments = {
        top: 'tank',
        bottom: 'taupe_wide',
        shoes: 'barefoot'
      };

      // Pointer / Drag State
      this.isPointerDown = false;
      this.pointerStartX = 0;
      this.pointerStartY = 0;
      this.lastPointerX = 0;
      this.lastPointerY = 0;
      this.avatarRotationY = 0;
      this.targetRotationY = 0;
      this.hasDragged = false;

      // Animation Loop
      this.clock = new THREE.Clock();
      this.animationFrameId = null;

      // Callbacks
      this.onObjectClick = null;
    }

    /**
     * Initializes the 3D scene on container and canvas
     */
    init(containerId, canvasId) {
      if (this.isInitialized) {
        this.onResize();
        return;
      }

      this.container = document.getElementById(containerId);
      this.canvas = document.getElementById(canvasId);
      if (!this.container || !this.canvas) {
        console.warn('Studio3D: Container or Canvas element not found', containerId, canvasId);
        return;
      }

      if (typeof THREE === 'undefined') {
        console.error('Studio3D: THREE.js library is not loaded');
        return;
      }

      const rect = this.container.getBoundingClientRect();
      const width = rect.width || this.container.clientWidth || 390;
      const height = rect.height || this.container.clientHeight || 750;

      // 1. Scene with Rich Warm Atmosphere (Calibrated to Luxury Studio palette)
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xF6F0E7); // Warm cream architectural plaster tone
      this.scene.fog = new THREE.Fog(0xF6F0E7, 8, 25); // Subtle distant falloff without washing foreground

      // 2. Camera with Portrait-Optimized Field of View
      const aspect = width / height;
      const isPortrait = aspect < 0.75;
      const initialFov = isPortrait ? CAMERA_STATES.STUDIO_OVERVIEW.fovPortrait : CAMERA_STATES.STUDIO_OVERVIEW.fovLandscape;
      this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 40);
      this.camera.position.copy(CAMERA_STATES.STUDIO_OVERVIEW.position);
      this.currentCameraLookAt.copy(CAMERA_STATES.STUDIO_OVERVIEW.target);
      this.camera.lookAt(this.currentCameraLookAt);

      // 3. WebGL Renderer with ACESFilmic Tone Mapping and Soft PCF Shadows
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (THREE.ACESFilmicToneMapping) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.04; // Calibrated for radiant showroom highlights
      }
      if (THREE.sRGBEncoding) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      // 4. Build Luxury Environment & Architecture matching Sérén Studio Reference
      this.initProceduralTextures();
      this.setupLighting();
      this.buildRoomArchitecture();
      this.buildStagePodium();
      this.buildWardrobeFurniture();
      this.buildDressingVanity();
      this.buildHumanoidAvatar();
      this.setupMirrorRenderPipeline();

      // 5. Setup Touch & Mouse Handlers
      this.setupInteractionHandlers();

      // 6. Start Render Loop
      this.isInitialized = true;
      this.animate = this.animate.bind(this);
      this.animate();

      window.addEventListener('resize', this.onResize.bind(this));
      console.log('Studio3D: Luxury Showroom initialized with PBR architecture & lighting!');
    }

    /**
     * High-Fidelity Procedural PBR Textures
     * Calacatta Gold Marble, Honey Oak Wood Grain, Woven Wool Rug & Bouclé Fabric
     */
    initProceduralTextures() {
      this.textures = {};

      // 1. Polished Italian Calacatta Gold Marble Texture (1024x1024)
      const marbleCanvas = document.createElement('canvas');
      marbleCanvas.width = 1024;
      marbleCanvas.height = 1024;
      const mCtx = marbleCanvas.getContext('2d');

      // Warm ivory cream base
      mCtx.fillStyle = '#F9F7F2';
      mCtx.fillRect(0, 0, 1024, 1024);

      // Subtle atmospheric warmth gradient
      const mGrad = mCtx.createLinearGradient(0, 0, 1024, 1024);
      mGrad.addColorStop(0, 'rgba(248, 243, 233, 0.7)');
      mGrad.addColorStop(0.5, 'rgba(254, 252, 247, 0.4)');
      mGrad.addColorStop(1, 'rgba(243, 237, 226, 0.8)');
      mCtx.fillStyle = mGrad;
      mCtx.fillRect(0, 0, 1024, 1024);

      // Calacatta Gold natural veining (layered flowing spline curves)
      const drawVein = (points, color, width, blur) => {
        mCtx.save();
        mCtx.strokeStyle = color;
        mCtx.lineWidth = width;
        mCtx.lineCap = 'round';
        mCtx.lineJoin = 'round';
        if (blur > 0 && mCtx.filter !== undefined) mCtx.filter = `blur(${blur}px)`;
        mCtx.beginPath();
        mCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          mCtx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        mCtx.stroke();
        mCtx.restore();
      };

      // Broad warm golden amber diffuse ribbons
      drawVein([
        { x: -50, y: 160 }, { x: 260, y: 320 }, { x: 540, y: 260 }, { x: 790, y: 440 }, { x: 1100, y: 640 }
      ], 'rgba(218, 192, 152, 0.26)', 38, 14);

      drawVein([
        { x: 110, y: -40 }, { x: 390, y: 250 }, { x: 680, y: 560 }, { x: 880, y: 820 }, { x: 1080, y: 1090 }
      ], 'rgba(206, 182, 142, 0.22)', 44, 20);

      // Fine branching mineral taupe/golden veins
      drawVein([
        { x: -30, y: 180 }, { x: 250, y: 330 }, { x: 530, y: 275 }, { x: 750, y: 460 }, { x: 1060, y: 650 }
      ], 'rgba(146, 128, 108, 0.36)', 5, 2);

      drawVein([
        { x: 330, y: 300 }, { x: 440, y: 430 }, { x: 620, y: 530 }, { x: 810, y: 570 }
      ], 'rgba(158, 138, 116, 0.28)', 3, 1);

      drawVein([
        { x: 150, y: -20 }, { x: 410, y: 270 }, { x: 670, y: 550 }, { x: 870, y: 810 }, { x: 1060, y: 1070 }
      ], 'rgba(138, 118, 98, 0.32)', 6, 2);

      drawVein([
        { x: 530, y: 400 }, { x: 470, y: 590 }, { x: 390, y: 790 }, { x: 500, y: 1070 }
      ], 'rgba(182, 158, 126, 0.22)', 4, 1.5);

      // Micro mineral specks
      for (let i = 0; i < 350; i++) {
        const sx = Math.random() * 1024;
        const sy = Math.random() * 1024;
        mCtx.fillStyle = Math.random() > 0.5 ? 'rgba(204, 184, 154, 0.15)' : 'rgba(134, 118, 98, 0.08)';
        mCtx.fillRect(sx, sy, Math.random() * 2 + 1, Math.random() * 2 + 1);
      }

      this.textures.marble = new THREE.CanvasTexture(marbleCanvas);
      this.textures.marble.wrapS = THREE.RepeatWrapping;
      this.textures.marble.wrapT = THREE.RepeatWrapping;
      this.textures.marble.repeat.set(2.4, 2.4);

      // Marble Roughness Map (Glossy 0.12 - 0.22 with vein variation)
      const mRoughCanvas = document.createElement('canvas');
      mRoughCanvas.width = 512;
      mRoughCanvas.height = 512;
      const mrCtx = mRoughCanvas.getContext('2d');
      mrCtx.fillStyle = '#222222'; // High gloss baseline ~0.13
      mrCtx.fillRect(0, 0, 512, 512);
      mrCtx.drawImage(marbleCanvas, 0, 0, 512, 512);
      this.textures.marbleRoughness = new THREE.CanvasTexture(mRoughCanvas);
      this.textures.marbleRoughness.wrapS = THREE.RepeatWrapping;
      this.textures.marbleRoughness.wrapT = THREE.RepeatWrapping;
      this.textures.marbleRoughness.repeat.set(2.4, 2.4);

      // 2. Honey Natural Oak Wood Grain Texture (1024x1024)
      const woodCanvas = document.createElement('canvas');
      woodCanvas.width = 1024;
      woodCanvas.height = 1024;
      const wCtx = woodCanvas.getContext('2d');

      wCtx.fillStyle = '#C49764'; // Rich natural honey oak base
      wCtx.fillRect(0, 0, 1024, 1024);

      // Vertical wood grain lines with organic growth ring waves
      for (let x = 0; x < 1024; x += 2) {
        const wave = Math.sin(x * 0.015) * 12 + Math.sin(x * 0.08) * 4;
        const alpha = 0.08 + Math.random() * 0.16;
        const tone = Math.random() > 0.45 ? 'rgba(122, 86, 50, ' + alpha + ')' : 'rgba(238, 204, 162, ' + alpha + ')';
        wCtx.fillStyle = tone;
        wCtx.fillRect(x + wave * 0.2, 0, 1.8, 1024);
      }

      // Wide growth ring bands
      for (let y = 0; y < 1024; y += 48) {
        const rGrad = wCtx.createLinearGradient(0, y, 0, y + 48);
        rGrad.addColorStop(0, 'rgba(132, 92, 54, 0.14)');
        rGrad.addColorStop(0.5, 'rgba(242, 214, 176, 0.16)');
        rGrad.addColorStop(1, 'rgba(112, 78, 44, 0.14)');
        wCtx.fillStyle = rGrad;
        wCtx.fillRect(0, y, 1024, 48);
      }

      this.textures.oak = new THREE.CanvasTexture(woodCanvas);
      this.textures.oak.wrapS = THREE.RepeatWrapping;
      this.textures.oak.wrapT = THREE.RepeatWrapping;
      this.textures.oak.repeat.set(1.5, 2.2);

      // Oak Bump Map
      const wBumpCanvas = document.createElement('canvas');
      wBumpCanvas.width = 512;
      wBumpCanvas.height = 512;
      const wbCtx = wBumpCanvas.getContext('2d');
      wbCtx.fillStyle = '#808080';
      wbCtx.fillRect(0, 0, 512, 512);
      wbCtx.drawImage(woodCanvas, 0, 0, 512, 512);
      this.textures.oakBump = new THREE.CanvasTexture(wBumpCanvas);
      this.textures.oakBump.wrapS = THREE.RepeatWrapping;
      this.textures.oakBump.wrapT = THREE.RepeatWrapping;
      this.textures.oakBump.repeat.set(1.5, 2.2);

      // 3. Circular Woven Wool Rug Texture (512x512)
      const rugCanvas = document.createElement('canvas');
      rugCanvas.width = 512;
      rugCanvas.height = 512;
      const rCtx = rugCanvas.getContext('2d');

      rCtx.fillStyle = '#B4A797';
      rCtx.fillRect(0, 0, 512, 512);

      // Concentric radial woven rings & cross texture
      for (let r = 8; r < 256; r += 3) {
        rCtx.strokeStyle = (r % 6 === 0) ? 'rgba(146, 132, 118, 0.35)' : 'rgba(208, 196, 182, 0.28)';
        rCtx.lineWidth = 1.5;
        rCtx.beginPath();
        rCtx.arc(256, 256, r, 0, Math.PI * 2);
        rCtx.stroke();
      }
      this.textures.rug = new THREE.CanvasTexture(rugCanvas);

      // 4. Cream Bouclé Looped Fabric Texture (512x512)
      const boucleCanvas = document.createElement('canvas');
      boucleCanvas.width = 512;
      boucleCanvas.height = 512;
      const bCtx = boucleCanvas.getContext('2d');

      bCtx.fillStyle = '#F7F3EB';
      bCtx.fillRect(0, 0, 512, 512);

      // Nubby looped yarn clusters
      for (let i = 0; i < 2800; i++) {
        const bx = Math.random() * 512;
        const by = Math.random() * 512;
        const br = Math.random() * 2.8 + 1.2;
        bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(230, 220, 206, 0.45)' : 'rgba(255, 255, 255, 0.65)';
        bCtx.beginPath();
        bCtx.arc(bx, by, br, 0, Math.PI * 2);
        bCtx.fill();
      }
      this.textures.boucle = new THREE.CanvasTexture(boucleCanvas);
      this.textures.boucle.wrapS = THREE.RepeatWrapping;
      this.textures.boucle.wrapT = THREE.RepeatWrapping;
      this.textures.boucle.repeat.set(3, 3);
    }

    /**
     * Advanced Photographic Lighting Architecture
     * Soft warm directional key light, ambient illumination, architectural spots & cove glows
     */
    setupLighting() {
      // Warm, flattering ambient fill
      const ambientLight = new THREE.AmbientLight(0xFFF2E4, 0.46);
      this.scene.add(ambientLight);

      // Primary Key Sunlight (Diagonal morning sunlight casting crisp soft contact shadows from upper left)
      const keyLight = new THREE.DirectionalLight(0xFFF8EE, 1.22);
      keyLight.position.set(-2.8, 4.6, 2.8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      keyLight.shadow.bias = -0.0003;
      const d = 2.4;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      this.scene.add(keyLight);

      // Warm Gentle Fill Light from right
      const fillLight = new THREE.DirectionalLight(0xFDF0E0, 0.32);
      fillLight.position.set(2.6, 3.2, 2.0);
      this.scene.add(fillLight);

      // Golden Rim Light (Soft silhouette on avatar hair, shoulders & stage edge)
      const rimLight = new THREE.DirectionalLight(0xFFD89B, 0.85);
      rimLight.position.set(0, 3.8, -2.4);
      this.scene.add(rimLight);

      // Architectural Ceiling Spotlights (Warm downlights with subtle downward cones)
      // 1. Wardrobe Downlight
      const wardrobeSpot = new THREE.SpotLight(0xFFE8C6, 0.75, 5.5, Math.PI / 4, 0.45, 1.2);
      wardrobeSpot.position.set(-1.0, 3.6, 0.3);
      wardrobeSpot.target.position.set(-0.95, 1.2, -0.15);
      this.scene.add(wardrobeSpot);
      this.scene.add(wardrobeSpot.target);

      // 2. Center Stage Downlight
      const stageSpot = new THREE.SpotLight(0xFFF2DC, 0.65, 6.0, Math.PI / 4.2, 0.45, 1.1);
      stageSpot.position.set(0, 3.8, 0.4);
      stageSpot.target.position.set(0, 0.6, 0);
      this.scene.add(stageSpot);
      this.scene.add(stageSpot.target);

      // 3. Vanity Downlight
      const vanitySpot = new THREE.SpotLight(0xFFE8C6, 0.70, 5.5, Math.PI / 4, 0.45, 1.2);
      vanitySpot.position.set(1.0, 3.6, 0.3);
      vanitySpot.target.position.set(0.95, 1.2, -0.15);
      this.scene.add(vanitySpot);
      this.scene.add(vanitySpot.target);
    }

    /**
     * Architecture: Polished Calacatta Gold Marble Floor, Layered Ceiling Soffits & Architectural Walls
     */
    buildRoomArchitecture() {
      // 1. Polished Italian Calacatta Gold Marble Flooring
      const floorGeo = new THREE.PlaneGeometry(16, 16);
      const floorMat = new THREE.MeshStandardMaterial({
        map: this.textures.marble,
        roughnessMap: this.textures.marbleRoughness,
        roughness: 0.14, // High-gloss polished stone
        metalness: 0.04,
        color: 0xFFFFFF
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      this.scene.add(floor);

      // 2. Smooth Architectural Cream Plaster Back Wall
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xF2ECE2, // Warm cream architectural plaster
        roughness: 0.88,
        metalness: 0.01,
        side: THREE.BackSide
      });
      const wallGeo = new THREE.CylinderGeometry(6.6, 6.6, 6.8, 48, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
      const backWall = new THREE.Mesh(wallGeo, wallMat);
      backWall.position.set(0, 3.4, 0);
      backWall.receiveShadow = true;
      this.scene.add(backWall);

      // 3. Architectural Center Wall Return / Soft Alcove
      const alcoveWidth = 2.4;
      const alcoveHeight = 3.8;
      const alcoveDepth = 0.28;
      const alcoveMat = new THREE.MeshStandardMaterial({
        color: 0xEEE7DC,
        roughness: 0.85
      });
      const alcoveBody = new THREE.Mesh(
        new THREE.BoxGeometry(alcoveWidth, alcoveHeight, alcoveDepth),
        alcoveMat
      );
      alcoveBody.position.set(0, alcoveHeight / 2, -1.35);
      alcoveBody.receiveShadow = true;
      this.scene.add(alcoveBody);

      // 4. Architectural Ceiling & Layered Soffits
      const ceilingGroup = new THREE.Group();
      ceilingGroup.position.set(0, 3.65, 0);

      // Main ceiling plane
      const ceilingGeo = new THREE.PlaneGeometry(16, 16);
      const ceilingMat = new THREE.MeshStandardMaterial({
        color: 0xF5F0E8,
        roughness: 0.92
      });
      const ceilingPlane = new THREE.Mesh(ceilingGeo, ceilingMat);
      ceilingPlane.rotation.x = Math.PI / 2;
      ceilingGroup.add(ceilingPlane);

      // Recessed cove ceiling soffit
      const soffitMat = new THREE.MeshStandardMaterial({ color: 0xEFEAE0, roughness: 0.88 });
      const soffit = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 3.6), soffitMat);
      soffit.position.set(0, -0.08, 0.15);
      ceilingGroup.add(soffit);

      // Recessed Downlight Fixtures with Champagne Brass Bezels & Glowing Lenses
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xD8B478,
        metalness: 0.88,
        roughness: 0.22
      });
      const lensMat = new THREE.MeshBasicMaterial({ color: 0xFFF2D8 });

      [
        { x: -0.95, z: 0.35 },
        { x: 0, z: 0.45 },
        { x: 0.95, z: 0.35 }
      ].forEach((spot) => {
        const fixture = new THREE.Group();
        fixture.position.set(spot.x, -0.165, spot.z);

        const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.015, 24), brassMat);
        fixture.add(bezel);

        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.018, 24), lensMat);
        fixture.add(lens);

        ceilingGroup.add(fixture);
      });

      // Recessed vertical cove light strip in corner
      const coveLightGeo = new THREE.BoxGeometry(0.03, 3.4, 0.03);
      const coveLightMat = new THREE.MeshBasicMaterial({ color: 0xFFE5B2 });
      const coveLight = new THREE.Mesh(coveLightGeo, coveLightMat);
      coveLight.position.set(-0.48, 1.8, -1.20);
      this.scene.add(coveLight);

      this.scene.add(ceilingGroup);

      // Sérén Studio Cursive Wall Lettering Tag ("Style a kinder you ♡")
      this.buildWallTag();
    }

    /**
     * Builds dynamic 3D canvas texture for cursive wall lettering
     */
    buildWallTag() {
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 512;
      tagCanvas.height = 128;
      const ctx = tagCanvas.getContext('2d');
      ctx.clearRect(0, 0, 512, 128);

      ctx.font = 'italic 34px "Playfair Display", Georgia, serif';
      ctx.fillStyle = 'rgba(132, 114, 95, 0.72)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Style a kinder you', 256, 48);

      ctx.font = '22px sans-serif';
      ctx.fillStyle = 'rgba(152, 130, 110, 0.60)';
      ctx.fillText('♡', 256, 90);

      const texture = new THREE.CanvasTexture(tagCanvas);
      texture.minFilter = THREE.LinearFilter;
      const tagMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.92
      });
      const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), tagMat);
      tagMesh.position.set(0.65, 2.65, -1.20);
      this.scene.add(tagMesh);
    }

    /**
     * Luxury Two-Tier Stage Podium on Woven Wool Area Rug
     * With Radiant Warm 360° Illuminated LED Halo Perimeter Ring
     */
    buildStagePodium() {
      const stageGroup = new THREE.Group();

      // 1. Circular Woven Wool Area Rug under podium
      const rugGeo = new THREE.CircleGeometry(1.22, 64);
      const rugMat = new THREE.MeshStandardMaterial({
        map: this.textures.rug,
        roughness: 0.88,
        metalness: 0.02
      });
      const rugMesh = new THREE.Mesh(rugGeo, rugMat);
      rugMesh.rotation.x = -Math.PI / 2;
      rugMesh.position.y = 0.006;
      rugMesh.receiveShadow = true;
      stageGroup.add(rugMesh);

      // Soft Dark Contact Shadow under rug edge
      const shadowDiscGeo = new THREE.CircleGeometry(1.25, 64);
      const shadowDiscMat = new THREE.MeshBasicMaterial({
        color: 0x362A1E,
        transparent: true,
        opacity: 0.28
      });
      const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.002;
      stageGroup.add(shadowDisc);

      // 2. Lower Tier: Circular Stone Base with Radiant LED Halo Perimeter
      const lowerBaseRadius = 0.94;
      const lowerBaseHeight = 0.045;
      const lowerBaseGeo = new THREE.CylinderGeometry(lowerBaseRadius, lowerBaseRadius, lowerBaseHeight, 64);
      const lowerBaseMat = new THREE.MeshStandardMaterial({
        color: 0xE8DFC9,
        roughness: 0.45,
        metalness: 0.05
      });
      const lowerBase = new THREE.Mesh(lowerBaseGeo, lowerBaseMat);
      lowerBase.position.y = lowerBaseHeight / 2;
      lowerBase.receiveShadow = true;
      stageGroup.add(lowerBase);

      // Radiant Warm 360° Illuminated LED Halo Ring (Golden Amber Glow)
      const ledHaloGeo = new THREE.TorusGeometry(lowerBaseRadius + 0.012, 0.016, 16, 64);
      const ledHaloMat = new THREE.MeshBasicMaterial({
        color: 0xFFE29E
      });
      const ledHalo = new THREE.Mesh(ledHaloGeo, ledHaloMat);
      ledHalo.rotation.x = Math.PI / 2;
      ledHalo.position.y = 0.038;
      stageGroup.add(ledHalo);

      // Downward halo perimeter light illuminating the woven rug
      const haloLight = new THREE.PointLight(0xFFD694, 1.2, 2.5);
      haloLight.position.set(0, 0.06, 0);
      stageGroup.add(haloLight);

      // 3. Upper Tier: Refined Polished White Honed Stone Disc
      const upperRadius = 0.88;
      const upperHeight = 0.075;
      const upperStageGeo = new THREE.CylinderGeometry(upperRadius, upperRadius + 0.015, upperHeight, 64);
      const upperStageMat = new THREE.MeshStandardMaterial({
        color: 0xFAF7F2, // Clean warm honed white stone
        roughness: 0.32,
        metalness: 0.03
      });
      const upperStage = new THREE.Mesh(upperStageGeo, upperStageMat);
      upperStage.position.y = lowerBaseHeight + upperHeight / 2;
      upperStage.receiveShadow = true;
      stageGroup.add(upperStage);

      // Chamfered brass accent ring between upper and lower tiers
      const brassBevelGeo = new THREE.TorusGeometry(upperRadius + 0.008, 0.006, 12, 64);
      const brassBevelMat = new THREE.MeshStandardMaterial({
        color: 0xD8B478,
        metalness: 0.88,
        roughness: 0.22
      });
      const brassBevel = new THREE.Mesh(brassBevelGeo, brassBevelMat);
      brassBevel.rotation.x = Math.PI / 2;
      brassBevel.position.y = lowerBaseHeight;
      stageGroup.add(brassBevel);

      this.scene.add(stageGroup);
    }

    /**
     * LEFT-SIDE LUXURY BUILT-IN NATURAL OAK WARDROBE
     * Floor-to-ceiling cabinetry, trailing ivy plant, luxury boxes, hanging trench/blazers,
     * middle accessory shelf with designer handbags, and lower shoe shelf with designer pumps
     */
    buildWardrobeFurniture() {
      const wardrobeGroup = new THREE.Group();
      wardrobeGroup.position.set(-0.88, 0, -0.06);
      wardrobeGroup.rotation.y = 0.38; // Angled gracefully towards stage

      const oakMat = new THREE.MeshStandardMaterial({
        map: this.textures.oak,
        bumpMap: this.textures.oakBump,
        bumpScale: 0.016,
        color: 0xBD8E5D, // Warm caramelized natural honey oak
        roughness: 0.42,
        metalness: 0.02
      });
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xD8B478,
        metalness: 0.88,
        roughness: 0.22
      });
      const ledGlowMat = new THREE.MeshBasicMaterial({ color: 0xFFF2D0 });

      const width = 1.04;
      const height = 2.65; // Floor-to-ceiling architectural cabinetry
      const depth = 0.52;

      // 1. Cabinetry Frame: Top Header, Vertical Uprights & Base Plinth
      const topCap = new THREE.Mesh(new THREE.BoxGeometry(width, 0.038, depth), oakMat);
      topCap.position.set(0, height - 0.019, 0);
      topCap.castShadow = true;
      wardrobeGroup.add(topCap);

      const sideGeo = new THREE.BoxGeometry(0.038, height, depth);
      const leftSide = new THREE.Mesh(sideGeo, oakMat);
      leftSide.position.set(-width / 2 + 0.019, height / 2, 0);
      leftSide.castShadow = true;
      wardrobeGroup.add(leftSide);

      const rightSide = new THREE.Mesh(sideGeo, oakMat);
      rightSide.position.set(width / 2 - 0.019, height / 2, 0);
      rightSide.castShadow = true;
      wardrobeGroup.add(rightSide);

      // Back Wall Panel
      const backBoard = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.076, height - 0.038, 0.02),
        oakMat
      );
      backBoard.position.set(0, height / 2, -depth / 2 + 0.01);
      backBoard.receiveShadow = true;
      wardrobeGroup.add(backBoard);

      // Base Plinth with Kick-Toe Recessed Glow
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, depth - 0.04), oakMat);
      plinth.position.set(0, 0.07, 0.02);
      plinth.castShadow = true;
      wardrobeGroup.add(plinth);

      // 2. Horizontal Shelf Tiers with Recessed Warm LED Light Strips
      const shelfPositions = [0.14, 0.62, 1.15, 2.18];
      const shelfGeo = new THREE.BoxGeometry(width - 0.076, 0.030, depth - 0.02);

      shelfPositions.forEach((shY) => {
        const shelf = new THREE.Mesh(shelfGeo, oakMat);
        shelf.position.set(0, shY, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        wardrobeGroup.add(shelf);

        // Under-shelf warm recessed LED light strip
        if (shY > 0.14) {
          const ledStrip = new THREE.Mesh(
            new THREE.BoxGeometry(width - 0.09, 0.012, 0.035),
            ledGlowMat
          );
          ledStrip.position.set(0, shY - 0.020, 0.08);
          wardrobeGroup.add(ledStrip);
        }
      });

      // Internal warm ambient shelf lighting
      const shelfLight1 = new THREE.PointLight(0xFFA834, 1.1, 2.6);
      shelfLight1.position.set(0, 2.10, 0.14);
      wardrobeGroup.add(shelfLight1);

      const shelfLight2 = new THREE.PointLight(0xFFA834, 0.85, 2.0);
      shelfLight2.position.set(0, 1.08, 0.14);
      wardrobeGroup.add(shelfLight2);

      const shelfLight3 = new THREE.PointLight(0xFFA834, 0.80, 1.8);
      shelfLight3.position.set(0, 0.55, 0.14);
      wardrobeGroup.add(shelfLight3);

      // 3. TOP SHELF (y = 2.18): Luxury Organizer Boxes & Trailing Greenery
      // Luxury Box 1: Cream Linen with tailored lid
      const boxMatCream = new THREE.MeshStandardMaterial({ color: 0xF4EFE6, roughness: 0.72 });
      const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.32), boxMatCream);
      box1.position.set(-0.33, 2.28, -0.02);
      box1.castShadow = true;
      wardrobeGroup.add(box1);

      // Luxury Box 2: Tall White Hat Box with Brass Pull Ring
      const hatBoxMat = new THREE.MeshStandardMaterial({ color: 0xFAF7F2, roughness: 0.55 });
      const box2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.19, 32), hatBoxMat);
      box2.position.set(-0.08, 2.29, -0.02);
      box2.castShadow = true;
      wardrobeGroup.add(box2);

      const pullRing = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 16), brassMat);
      pullRing.position.set(-0.08, 2.29, 0.105);
      wardrobeGroup.add(pullRing);

      // Luxury Box 3: Dark Olive / Sage Box
      const boxMatOlive = new THREE.MeshStandardMaterial({ color: 0x5C6952, roughness: 0.65 });
      const box3 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.28), boxMatOlive);
      box3.position.set(0.12, 2.27, -0.02);
      box3.castShadow = true;
      wardrobeGroup.add(box3);

      // Trailing Plant in Charcoal Ceramic Planter (Right corner of top shelf)
      const plantGroup = new THREE.Group();
      plantGroup.position.set(0.35, 2.20, 0.06);

      const potMat = new THREE.MeshStandardMaterial({ color: 0x2A2724, roughness: 0.40 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.15, 24), potMat);
      pot.position.y = 0.075;
      plantGroup.add(pot);

      // Lush green crown
      const plantLeafMat = new THREE.MeshStandardMaterial({ color: 0x486640, roughness: 0.60 });
      for (let p = 0; p < 8; p++) {
        const topLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), plantLeafMat);
        topLeaf.scale.set(1.4, 0.25, 0.9);
        topLeaf.position.set(Math.cos(p * 0.8) * 0.07, 0.16 + Math.sin(p * 0.5) * 0.02, Math.sin(p * 0.8) * 0.07);
        plantGroup.add(topLeaf);
      }

      // Cascading ivy vines draping down the right side of the wardrobe
      const vineMat = new THREE.MeshStandardMaterial({ color: 0x3E5936, roughness: 0.62 });
      for (let v = 0; v < 4; v++) {
        const vineLength = 0.45 + v * 0.15;
        const vineX = 0.06 + Math.sin(v) * 0.04;
        const vineZ = 0.04 + Math.cos(v) * 0.04;

        // Tendril stem
        const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.002, vineLength, 8), vineMat);
        vine.position.set(vineX, 0.05 - vineLength / 2, vineZ);
        plantGroup.add(vine);

        // Leaves along the vine
        const numLeaves = 6 + v * 2;
        for (let l = 0; l < numLeaves; l++) {
          const lY = 0.05 - (l / numLeaves) * vineLength;
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), plantLeafMat);
          leaf.scale.set(1.4, 0.18, 0.9);
          leaf.position.set(vineX + (l % 2 === 0 ? 0.025 : -0.025), lY, vineZ + 0.015);
          plantGroup.add(leaf);
        }
      }
      wardrobeGroup.add(plantGroup);

      // 4. HANGING RAIL SECTION (y = 1.45 to 2.15)
      // Brushed Brass Rail
      const railGeo = new THREE.CylinderGeometry(0.012, 0.012, width - 0.08, 16);
      const rail = new THREE.Mesh(railGeo, brassMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, 2.05, 0);
      rail.castShadow = true;
      wardrobeGroup.add(rail);

      // 6 Individual Luxury Garments on Curved Brass Hangers
      const garmentsList = [
        { x: -0.36, color: 0xECE4D6, len: 0.94, name: 'Cream Wool Trench', lapel: true },
        { x: -0.22, color: 0xF7F4EC, len: 0.64, name: 'Draped Silk Blouse', lapel: false },
        { x: -0.07, color: 0x222428, len: 0.76, name: 'Charcoal Tailored Blazer', lapel: true },
        { x: 0.07, color: 0xB6916B, len: 0.88, name: 'Camel Structured Coat', lapel: true },
        { x: 0.21, color: 0xFAF7F2, len: 0.68, name: 'Crisp White Oxford', lapel: false },
        { x: 0.35, color: 0x1A2230, len: 0.72, name: 'Navy Evening Piece', lapel: false }
      ];

      garmentsList.forEach((g) => {
        // Curved brass hanger
        const hanger = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.005, 8, 24, Math.PI), brassMat);
        hanger.position.set(g.x, 2.05, 0);
        wardrobeGroup.add(hanger);

        const hangerHook = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.04, 8), brassMat);
        hangerHook.position.set(g.x, 2.07, 0);
        wardrobeGroup.add(hangerHook);

        // Garment main body with fabric taper
        const fabricMat = new THREE.MeshStandardMaterial({
          color: g.color,
          roughness: 0.76,
          metalness: 0.02
        });
        const garment = new THREE.Mesh(new THREE.BoxGeometry(0.088, g.len, 0.26), fabricMat);
        garment.position.set(g.x, 2.02 - g.len / 2, 0);
        garment.castShadow = true;
        wardrobeGroup.add(garment);

        // Peaked tailored lapel folds for structured coats & blazers
        if (g.lapel) {
          const lapelMat = new THREE.MeshStandardMaterial({
            color: g.color,
            roughness: 0.70
          });
          const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.26, 0.03), lapelMat);
          lapelL.position.set(g.x - 0.025, 1.88, 0.135);
          lapelL.rotation.y = 0.20;
          wardrobeGroup.add(lapelL);

          const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.26, 0.03), lapelMat);
          lapelR.position.set(g.x + 0.025, 1.88, 0.135);
          lapelR.rotation.y = -0.20;
          wardrobeGroup.add(lapelR);
        }
      });

      // 5. MIDDLE ACCESSORY SHELF (y = 1.15): Designer Handbags & Jewelry Box
      // Handbag 1 (Left): Structured Cream Handbag with Gold Turn-Lock
      const bagMatCream = new THREE.MeshStandardMaterial({ color: 0xF3EFE6, roughness: 0.38 });
      const bag1 = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.15, 0.12), bagMatCream);
      bag1.position.set(-0.30, 1.25, 0);
      bag1.castShadow = true;
      wardrobeGroup.add(bag1);

      const bag1Flap = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.08, 0.125), bagMatCream);
      bag1Flap.position.set(-0.30, 1.28, 0.005);
      wardrobeGroup.add(bag1Flap);

      const bag1Lock = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.020, 0.015), brassMat);
      bag1Lock.position.set(-0.30, 1.24, 0.065);
      wardrobeGroup.add(bag1Lock);

      const bag1Handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 8, 20, Math.PI), bagMatCream);
      bag1Handle.position.set(-0.30, 1.34, 0);
      wardrobeGroup.add(bag1Handle);

      // Box 2 (Center): White Leather Jewelry Case with Gold Clasp
      const jewelryBoxMat = new THREE.MeshStandardMaterial({ color: 0xFAF8F5, roughness: 0.42 });
      const jBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.20), jewelryBoxMat);
      jBox.position.set(0, 1.23, 0);
      jBox.castShadow = true;
      wardrobeGroup.add(jBox);

      const jLock = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.012), brassMat);
      jLock.position.set(0, 1.23, 0.105);
      wardrobeGroup.add(jLock);

      // Handbag 3 (Right): Designer Black Leather Tote with Gold Hardware
      const bagMatBlack = new THREE.MeshStandardMaterial({ color: 0x1E1E22, roughness: 0.35 });
      const bag3 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.13), bagMatBlack);
      bag3.position.set(0.28, 1.26, 0);
      bag3.castShadow = true;
      wardrobeGroup.add(bag3);

      const bag3Handle1 = new THREE.Mesh(new THREE.TorusGeometry(0.060, 0.007, 8, 20, Math.PI), brassMat);
      bag3Handle1.position.set(0.28, 1.37, 0.04);
      wardrobeGroup.add(bag3Handle1);

      const bag3Handle2 = new THREE.Mesh(new THREE.TorusGeometry(0.060, 0.007, 8, 20, Math.PI), brassMat);
      bag3Handle2.position.set(0.28, 1.37, -0.04);
      wardrobeGroup.add(bag3Handle2);

      // 6. LOWER SHOE SHELF (y = 0.62): 4 Pairs of Designer Women's Shoes
      const shoePairs = [
        { x: -0.34, color: 0xFAF7F2, heelColor: 0xD8B478, name: 'White Pointed Pumps' },
        { x: -0.12, color: 0x18181A, heelColor: 0x18181A, name: 'Black Patent Stilettos' },
        { x: 0.11, color: 0xD6BFA4, heelColor: 0xD8B478, name: 'Nude Leather Pumps' },
        { x: 0.33, color: 0x242428, heelColor: 0xD8B478, name: 'Black Evening Pumps' }
      ];

      shoePairs.forEach((sp) => {
        [-0.042, 0.042].forEach((offset) => {
          const sGroup = new THREE.Group();
          sGroup.position.set(sp.x + offset, 0.635, 0.02);
          sGroup.rotation.y = -0.08;

          const sMat = new THREE.MeshStandardMaterial({ color: sp.color, roughness: 0.38 });
          const heelMat = new THREE.MeshStandardMaterial({ color: sp.heelColor, metalness: 0.75, roughness: 0.25 });

          // Pointed sole & upper
          const sole = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.022, 0.16), sMat);
          sole.position.set(0, 0.011, 0);
          sGroup.add(sole);

          const toe = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.065, 12), sMat);
          toe.rotation.x = Math.PI / 2;
          toe.position.set(0, 0.018, 0.08);
          sGroup.add(toe);

          // Slender stiletto heel
          const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.065, 8), heelMat);
          heel.position.set(0, 0.035, -0.06);
          sGroup.add(heel);

          wardrobeGroup.add(sGroup);
        });
      });

      // Raycastable Bounding Box for Interactive Touch
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.15, height + 0.1, depth + 0.3),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.set(0, height / 2, 0);
      hitBox.userData = { interactiveType: 'wardrobe', name: 'Interactive Modular Wardrobe' };
      wardrobeGroup.add(hitBox);
      this.interactiveObjects.push(hitBox);

      this.scene.add(wardrobeGroup);
    }

    /**
     * RIGHT-SIDE LUXURY VANITY & ARCHED CAPSULE MIRROR
     * Calacatta marble slab tabletop, fluted champagne-brass legs, arched halo mirror,
     * fluted glass vase with eucalyptus branches, luxury perfume bottles, art books & bouclé ottoman
     */
    buildDressingVanity() {
      const vanityGroup = new THREE.Group();
      vanityGroup.position.set(0.88, 0, -0.06);
      vanityGroup.rotation.y = -0.38; // Angled gracefully towards stage

      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xD8B478, // Champagne gold
        metalness: 0.88,
        roughness: 0.22
      });

      // 1. Vanity Table: Calacatta Gold Marble Slab Top & Architectural Brass Legs
      const tableWidth = 0.94;
      const tableDepth = 0.46;
      const tableHeight = 0.78;

      const marbleTableMat = new THREE.MeshStandardMaterial({
        map: this.textures.marble,
        roughnessMap: this.textures.marbleRoughness,
        roughness: 0.14,
        metalness: 0.04
      });
      const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(tableWidth, 0.055, tableDepth),
        marbleTableMat
      );
      tableTop.position.set(0, tableHeight, 0);
      tableTop.castShadow = true;
      tableTop.receiveShadow = true;
      vanityGroup.add(tableTop);

      // Fluted champagne-brass architectural legs (Pillar slab design)
      const legGeo = new THREE.BoxGeometry(0.045, tableHeight - 0.03, 0.08);
      [
        [-tableWidth / 2 + 0.08, 0],
        [tableWidth / 2 - 0.08, 0]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, brassMat);
        leg.position.set(lx, (tableHeight - 0.03) / 2, lz);
        leg.castShadow = true;
        vanityGroup.add(leg);

        // Fluted horizontal foot stretcher
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.025, tableDepth - 0.08), brassMat);
        foot.position.set(lx, 0.015, lz);
        vanityGroup.add(foot);
      });

      // 2. Large Arched Capsule Mirror with Champagne-Brass Frame & Halo Glow
      const mirrorWidth = 0.58;
      const mirrorHeight = 1.15;

      // Arched top rim
      const mirrorArch = new THREE.Mesh(
        new THREE.CylinderGeometry(mirrorWidth / 2, mirrorWidth / 2, 0.032, 32, 1, false, 0, Math.PI),
        brassMat
      );
      mirrorArch.rotation.x = Math.PI / 2;
      mirrorArch.rotation.z = Math.PI / 2;
      mirrorArch.position.set(0, tableHeight + mirrorHeight, -tableDepth / 2 + 0.04);
      vanityGroup.add(mirrorArch);

      // Straight lower mirror frame
      const mirrorBody = new THREE.Mesh(
        new THREE.BoxGeometry(mirrorWidth, mirrorHeight - mirrorWidth / 2, 0.025),
        brassMat
      );
      mirrorBody.position.set(0, tableHeight + (mirrorHeight - mirrorWidth / 2) / 2 + 0.025, -tableDepth / 2 + 0.04);
      vanityGroup.add(mirrorBody);

      // Glowing Warm LED Halo Rim
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xFFD89B });
      const haloRing = new THREE.Mesh(
        new THREE.TorusGeometry(mirrorWidth / 2 + 0.012, 0.014, 16, 48, Math.PI),
        haloMat
      );
      haloRing.position.set(0, tableHeight + mirrorHeight, -tableDepth / 2 + 0.045);
      vanityGroup.add(haloRing);

      // Mirror Glass Surface
      const glassGeo = new THREE.PlaneGeometry(mirrorWidth - 0.03, mirrorHeight - 0.03);
      const fallbackGlassMat = new THREE.MeshStandardMaterial({
        color: 0xECE4DA,
        roughness: 0.08,
        metalness: 0.94
      });
      this.mirrorGlassMesh = new THREE.Mesh(glassGeo, fallbackGlassMat);
      this.mirrorGlassMesh.position.set(0, tableHeight + mirrorHeight / 2 + 0.03, -tableDepth / 2 + 0.055);
      vanityGroup.add(this.mirrorGlassMesh);

      // Warm Soft Vanity Ambient Glow
      const mirrorLight = new THREE.PointLight(0xFFA834, 1.05, 2.8);
      mirrorLight.position.set(0, tableHeight + mirrorHeight / 2 + 0.15, 0.18);
      vanityGroup.add(mirrorLight);

      // 3. TABLETOP STYLING: Fluted Glass Vase with Eucalyptus, Perfumes & Art Books
      // Tall fluted clear glass vase
      const vaseGlassMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.08,
        metalness: 0.10,
        transparent: true,
        opacity: 0.65
      });
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.058, 0.24, 24), vaseGlassMat);
      vase.position.set(-0.28, tableHeight + 0.14, -0.04);
      vase.castShadow = true;
      vanityGroup.add(vase);

      // Fresh Green Eucalyptus Branches with rounded coin leaves
      const eucWoodMat = new THREE.MeshStandardMaterial({ color: 0x544638, roughness: 0.72 });
      const eucLeafMat = new THREE.MeshStandardMaterial({ color: 0x567052, roughness: 0.60 });

      for (let b = 0; b < 3; b++) {
        const branchAngle = (b - 1) * 0.22;
        const branchLength = 0.42 + b * 0.06;

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, branchLength, 8), eucWoodMat);
        stem.rotation.z = branchAngle;
        stem.position.set(-0.28 + branchAngle * 0.12, tableHeight + 0.24 + branchLength / 2, -0.04);
        vanityGroup.add(stem);

        // Circular eucalyptus leaves in opposite pairs
        for (let l = 0; l < 6; l++) {
          const lY = tableHeight + 0.26 + (l / 6) * branchLength;
          [-1, 1].forEach((side) => {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), eucLeafMat);
            leaf.scale.set(1.2, 0.22, 1.0);
            leaf.position.set(
              -0.28 + branchAngle * (lY - tableHeight) + side * 0.028,
              lY,
              -0.04 + Math.sin(l + side) * 0.015
            );
            vanityGroup.add(leaf);
          });
        }
      }

      // Stack of 2 Hardcover Fashion Art Books
      const book1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.20, 0.028, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xFAF7F2, roughness: 0.45 })
      );
      book1.position.set(0.26, tableHeight + 0.042, 0.04);
      book1.castShadow = true;
      vanityGroup.add(book1);

      const book2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.024, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xE8DFD2, roughness: 0.50 })
      );
      book2.position.set(0.26, tableHeight + 0.068, 0.04);
      book2.rotation.y = 0.08;
      book2.castShadow = true;
      vanityGroup.add(book2);

      // Luxury Glass Perfume Bottles with Polished Gold Caps
      // Perfume 1: Warm Amber Rectangular Bottle
      const p1Mat = new THREE.MeshStandardMaterial({ color: 0xDDA550, roughness: 0.12, transparent: true, opacity: 0.85 });
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.075, 0.028), p1Mat);
      p1.position.set(0.06, tableHeight + 0.065, 0.04);
      vanityGroup.add(p1);

      const p1Cap = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.020, 0.020), brassMat);
      p1Cap.position.set(0.06, tableHeight + 0.112, 0.04);
      vanityGroup.add(p1Cap);

      // Perfume 2: Rose Translucent Flacon
      const p2Mat = new THREE.MeshStandardMaterial({ color: 0xEAA29B, roughness: 0.15, transparent: true, opacity: 0.82 });
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.082, 16), p2Mat);
      p2.position.set(0.12, tableHeight + 0.068, 0.04);
      vanityGroup.add(p2);

      const p2Cap = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), brassMat);
      p2Cap.position.set(0.12, tableHeight + 0.116, 0.04);
      vanityGroup.add(p2Cap);

      // Perfume 3: Clear Faceted Bottle
      const p3Mat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.08, transparent: true, opacity: 0.78 });
      const p3 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.065, 8), p3Mat);
      p3.position.set(0.18, tableHeight + 0.060, 0.04);
      vanityGroup.add(p3);

      const p3Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.022, 12), brassMat);
      p3Cap.position.set(0.18, tableHeight + 0.103, 0.04);
      vanityGroup.add(p3Cap);

      // 4. Round Cream Bouclé Upholstered Ottoman Stool
      const stoolGroup = new THREE.Group();
      stoolGroup.position.set(0.05, 0, 0.28);

      const boucleMat = new THREE.MeshStandardMaterial({
        map: this.textures.boucle,
        color: 0xF7F3EA,
        roughness: 0.88,
        metalness: 0.01
      });
      const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.36, 32), boucleMat);
      cushion.position.y = 0.22;
      cushion.castShadow = true;
      stoolGroup.add(cushion);

      // Brushed champagne-brass metallic base plinth ring
      const brassBaseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.045, 32), brassMat);
      brassBaseRing.position.y = 0.025;
      stoolGroup.add(brassBaseRing);

      vanityGroup.add(stoolGroup);

      // Raycastable Bounding Box for Interactive Touch
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(tableWidth + 0.15, 2.0, tableDepth + 0.4),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.set(0, 1.0, 0);
      hitBox.userData = { interactiveType: 'mirror', name: 'Arched Vanity & Styling Mirror' };
      vanityGroup.add(hitBox);
      this.interactiveObjects.push(hitBox);

      this.scene.add(vanityGroup);
    }

    /**
     * Secondary Render Pipeline: Synchronized Live Reflection Camera for the Mirror
     */
    setupMirrorRenderPipeline() {
      try {
        this.mirrorRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
          format: THREE.RGBFormat,
          generateMipmaps: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter
        });

        // Mirror camera placed near vanity looking back at the avatar on stage
        this.mirrorCamera = new THREE.PerspectiveCamera(48, 1.0, 0.2, 10);
        this.mirrorCamera.position.set(0.90, 1.30, -0.10);
        this.mirrorCamera.lookAt(0, 1.10, 0);

        if (this.mirrorGlassMesh) {
          this.mirrorGlassMesh.material = new THREE.MeshBasicMaterial({
            map: this.mirrorRenderTarget.texture
          });
        }
      } catch (err) {
        console.warn('Studio3D: Mirror render target fallback active', err);
      }
    }

    /**
     * Humanoid Avatar Sculpt (Delicate Asian Facial Contours, Clear Almond Eyes, Graceful High Bun Updo, Fluid Linen Trousers)
     * Faithfully matching Sérén Visual Reference (seren_main_screen.jpg)
     */
    buildHumanoidAvatar() {
      this.avatarGroup = new THREE.Group();
      this.avatarGroup.position.set(0, 0.14, 0); // Atop limestone circular stage

      // Group containing refined anatomical sculpt (active immediately)
      this.proceduralAvatarGroup = new THREE.Group();
      this.avatarGroup.add(this.proceduralAvatarGroup);

      // Materials
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xF3D5C6, // Soft luminous porcelain/ivory skin tone
        roughness: 0.38,
        metalness: 0.02
      });
      const hairMat = new THREE.MeshStandardMaterial({
        color: 0x1E120A, // Rich deep espresso with warm undertone
        roughness: 0.28,
        metalness: 0.04
      });
      const lipMat = new THREE.MeshStandardMaterial({
        color: 0xCD6B60, // Satin rosy-nude lip finish
        roughness: 0.28
      });
      const blushMat = new THREE.MeshStandardMaterial({
        color: 0xDE8B80,
        roughness: 0.5,
        transparent: true,
        opacity: 0.32
      });

      // 1. Head & Realistic Delicate Facial Features
      this.headGroup = new THREE.Group();
      this.headGroup.position.set(0, 1.54, 0);

      // Cranium / Face with soft feminine contour
      const faceGeo = new THREE.SphereGeometry(0.095, 32, 32);
      faceGeo.scale(0.88, 1.15, 0.95);
      const face = new THREE.Mesh(faceGeo, skinMat);
      face.castShadow = true;
      this.headGroup.add(face);

      // Soft tapered chin
      const chinGeo = new THREE.SphereGeometry(0.032, 20, 20);
      chinGeo.scale(0.9, 0.8, 0.9);
      const chin = new THREE.Mesh(chinGeo, skinMat);
      chin.position.set(0, -0.072, 0.038);
      this.headGroup.add(chin);

      // Delicate rosy cheek flush
      [-1, 1].forEach((side) => {
        const blush = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), blushMat);
        blush.scale.set(1.2, 0.6, 0.3);
        blush.position.set(side * 0.048, -0.015, 0.076);
        this.headGroup.add(blush);
      });

      // Almond Eyes with Sclera, Iris, Pupil, Catchlight & Eyelash Line
      const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xFAF8F5 });
      const irisMat = new THREE.MeshStandardMaterial({ color: 0x2A190E, roughness: 0.22 });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0A0604 });
      const glintMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const lashMat = new THREE.MeshBasicMaterial({ color: 0x1A100A });
      const browMat = new THREE.MeshBasicMaterial({ color: 0x24160E });

      [-1, 1].forEach((side) => {
        const eyeX = side * 0.031;

        // Sclera White
        const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 16, 12), eyeWhiteMat);
        sclera.scale.set(1.25, 0.68, 0.5);
        sclera.position.set(eyeX, 0.015, 0.082);
        this.headGroup.add(sclera);

        // Iris
        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 12, 12), irisMat);
        iris.scale.set(1.0, 1.0, 0.3);
        iris.position.set(eyeX, 0.015, 0.086);
        this.headGroup.add(iris);

        // Pupil
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 8, 8), pupilMat);
        pupil.position.set(eyeX, 0.015, 0.088);
        this.headGroup.add(pupil);

        // Specular Catchlight Sparkle
        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0014, 6, 6), glintMat);
        glint.position.set(eyeX + 0.0018, 0.017, 0.089);
        this.headGroup.add(glint);

        // Delicate Upper Eyelash Arc
        const lash = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.025, 8), lashMat);
        lash.rotation.z = Math.PI / 2 + side * 0.14;
        lash.position.set(eyeX, 0.021, 0.084);
        this.headGroup.add(lash);

        // Graceful Arched Eyebrow (Well above eyes so face is clear)
        const brow = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0014, 0.034, 8), browMat);
        brow.rotation.z = side * 0.16;
        brow.position.set(eyeX, 0.035, 0.082);
        this.headGroup.add(brow);

        // Ear Shell
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.020, 12, 12), skinMat);
        ear.scale.set(0.35, 1.15, 0.65);
        ear.position.set(side * 0.088, 0.008, -0.005);
        this.headGroup.add(ear);
      });

      // Refined Feminine Nose Bridge & Tip
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.010, 0.038, 12), skinMat);
      bridge.position.set(0, -0.006, 0.089);
      bridge.rotation.x = -0.16;
      this.headGroup.add(bridge);

      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 12), skinMat);
      tip.scale.set(0.9, 0.75, 1.0);
      tip.position.set(0, -0.024, 0.093);
      this.headGroup.add(tip);

      // Contoured Satin Rosy Lips
      const upperLip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), lipMat);
      upperLip.scale.set(1.5, 0.45, 0.6);
      upperLip.position.set(0, -0.048, 0.084);
      this.headGroup.add(upperLip);

      const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), lipMat);
      lowerLip.scale.set(1.4, 0.55, 0.7);
      lowerLip.position.set(0, -0.058, 0.082);
      this.headGroup.add(lowerLip);

      // Elegant High Bun Updo Hairstyle (Forehead & Face 100% Unobstructed!)
      const hairCrownGeo = new THREE.SphereGeometry(0.096, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.52);
      const hairCrown = new THREE.Mesh(hairCrownGeo, hairMat);
      hairCrown.position.set(0, 0.045, -0.022);
      hairCrown.rotation.x = -0.15;
      this.headGroup.add(hairCrown);

      // Chic Sculpted Top Bun
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.046, 24, 24), hairMat);
      bun.scale.set(1.15, 0.95, 1.0);
      bun.position.set(0, 0.135, -0.038);
      this.headGroup.add(bun);

      // Golden Brass Hairpin Accent
      const clipMat = new THREE.MeshStandardMaterial({ color: 0xD8B478, metalness: 0.85, roughness: 0.22 });
      const clip = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0035, 8, 24), clipMat);
      clip.position.set(0, 0.135, -0.065);
      clip.rotation.y = Math.PI / 2;
      this.headGroup.add(clip);

      // Soft Wispy Side Locks behind cheekbones
      [-1, 1].forEach((side) => {
        const tendril = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.0015, 0.10, 8), hairMat);
        tendril.position.set(side * 0.082, -0.035, 0.015);
        tendril.rotation.z = side * 0.08;
        this.headGroup.add(tendril);
      });

      this.proceduralAvatarGroup.add(this.headGroup);

      // 2. Neck & Clavicle
      const neckGeo = new THREE.CylinderGeometry(0.038, 0.046, 0.14, 24);
      const neck = new THREE.Mesh(neckGeo, skinMat);
      neck.position.set(0, 1.41, 0);
      this.proceduralAvatarGroup.add(neck);

      // Delicate Clavicle Collarbones
      const clavicleMat = new THREE.MeshStandardMaterial({ color: 0xE5C7B5, roughness: 0.42 });
      const clavicle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.20, 12), clavicleMat);
      clavicle.rotation.z = Math.PI / 2;
      clavicle.position.set(0, 1.345, 0.052);
      this.proceduralAvatarGroup.add(clavicle);

      // 3. Torso (Bust, Midriff & Pelvis)
      this.chestGroup = new THREE.Group();
      this.chestGroup.position.set(0, 1.22, 0);

      // Feminine Bust
      const bust = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.102, 0.22, 32), skinMat);
      bust.castShadow = true;
      this.chestGroup.add(bust);

      // Midriff (Showing under cropped tank)
      const midriff = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.110, 0.14, 32), skinMat);
      midriff.position.set(0, -0.16, 0);
      this.chestGroup.add(midriff);

      this.proceduralAvatarGroup.add(this.chestGroup);

      // Pelvis
      const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.110, 0.134, 0.16, 32), skinMat);
      hips.position.set(0, 0.95, 0);
      this.proceduralAvatarGroup.add(hips);

      // 4. Arms & Articulated Hands with 5 Fingers
      this.bareArms = [];
      [-1, 1].forEach((side) => {
        const armGroup = new THREE.Group();
        armGroup.position.set(side * 0.168, 1.31, 0);

        // Shoulder Deltoid
        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.040, 16, 16), skinMat);
        armGroup.add(shoulder);

        // Upper Arm
        const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.029, 0.26, 20), skinMat);
        upperArm.position.set(0, -0.13, 0);
        upperArm.rotation.z = side * 0.05;
        upperArm.castShadow = true;
        armGroup.add(upperArm);

        // Forearm
        const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.023, 0.26, 20), skinMat);
        forearm.position.set(side * 0.012, -0.37, 0);
        forearm.rotation.z = side * -0.03;
        forearm.castShadow = true;
        armGroup.add(forearm);

        // Hand with Relaxed Open Palm
        const hand = new THREE.Group();
        hand.position.set(side * 0.016, -0.52, 0);

        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.044, 0.014), skinMat);
        hand.add(palm);

        // Thumb
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0034, 0.028, 8), skinMat);
        thumb.rotation.z = side * -0.42;
        thumb.position.set(side * -0.014, 0.004, 0.004);
        hand.add(thumb);

        // 4 Articulated Resting Fingers
        for (let f = 0; f < 4; f++) {
          const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0028, 0.038 - f * 0.003, 8), skinMat);
          finger.position.set(side * (0.009 - f * 0.006), -0.036, 0);
          hand.add(finger);
        }

        armGroup.add(hand);
        this.proceduralAvatarGroup.add(armGroup);
        this.bareArms.push(armGroup);
      });

      // 5. Build Wearable 3D Garment Meshes
      this.buildWearableTops();
      this.buildWearableBottoms();
      this.buildWearableShoes();

      // Equip starting outfit matching Reference A: Ribbed Ivory Tank + Fluid Taupe Trousers
      this.equipGarment('top', 'tank');
      this.equipGarment('bottom', 'taupe_wide');
      this.equipGarment('shoes', 'barefoot');

      // Raycastable hit box for avatar selection & rotation
      const avatarHitBox = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 1.76, 16),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      avatarHitBox.position.set(0, 0.88, 0);
      avatarHitBox.userData = { interactiveType: 'avatar', name: '3D Humanoid Model' };
      this.avatarGroup.add(avatarHitBox);
      this.interactiveObjects.push(avatarHitBox);

      this.scene.add(this.avatarGroup);

      this.proceduralAvatarGroup.visible = true;
      console.log('Studio3D: Sculpted humanoid mannequin fully active & visible with complete head, face & arms.');
    }

    /**
     * Wearable 3D Tops (Ribbed Ivory Tank, Cream Cardigan, Camel Blazer, Navy Shirt, Striped Sweater)
     */
    buildWearableTops() {
      const topParent = new THREE.Group();
      this.avatarGroup.add(topParent);

      // 1. Ribbed Ivory Tank Top (Starting Piece matching Reference D)
      const tankGroup = new THREE.Group();
      const tankMat = new THREE.MeshStandardMaterial({
        color: 0xFAF6EF, // Clean soft ivory
        roughness: 0.74,
        metalness: 0.02
      });
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.124, 0.106, 0.25, 32), tankMat);
      tank.position.set(0, 1.22, 0);
      tank.castShadow = true;
      tankGroup.add(tank);

      // Fine Vertical Rib Texturing
      const ribMat = new THREE.MeshStandardMaterial({ color: 0xE8E1D5, roughness: 0.85 });
      for (let r = 0; r < 12; r++) {
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.24, 6), ribMat);
        const angle = (r * Math.PI * 2) / 12;
        rib.position.set(Math.sin(angle) * 0.116, 1.22, Math.cos(angle) * 0.116);
        tankGroup.add(rib);
      }
      topParent.add(tankGroup);
      this.garmentMeshes.top['tank'] = tankGroup;

      // 2. Cream Cozy Knit Cardigan with Tortoiseshell Buttons (Reference D - Step 3)
      const cardiganGroup = new THREE.Group();
      const cardiganMat = new THREE.MeshStandardMaterial({
        color: 0xF2ECE0,
        roughness: 0.82,
        metalness: 0.02
      });
      const cardBody = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.132, 0.40, 32), cardiganMat);
      cardBody.position.set(0, 1.21, 0);
      cardBody.castShadow = true;
      cardiganGroup.add(cardBody);

      // Cardigan Sleeves
      const sleeveGeo = new THREE.CylinderGeometry(0.052, 0.044, 0.54, 24);
      [-1, 1].forEach((side) => {
        const sleeve = new THREE.Mesh(sleeveGeo, cardiganMat);
        sleeve.position.set(side * 0.182, 1.15, 0);
        sleeve.rotation.z = side * -0.09;
        sleeve.castShadow = true;
        cardiganGroup.add(sleeve);
      });

      // Front Button Placket
      const buttonMat = new THREE.MeshStandardMaterial({ color: 0x483626, roughness: 0.35 });
      for (let b = 0; b < 3; b++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 12), buttonMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(0, 1.10 + b * 0.08, 0.142);
        cardiganGroup.add(btn);
      }
      cardiganGroup.visible = false;
      topParent.add(cardiganGroup);
      this.garmentMeshes.top['cardigan'] = cardiganGroup;

      // 3. Tailored Camel Smart Blazer
      const blazerGroup = new THREE.Group();
      const blazerMat = new THREE.MeshStandardMaterial({
        color: 0xBC9A76,
        roughness: 0.65,
        metalness: 0.03
      });
      const blazerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.146, 0.136, 0.44, 32), blazerMat);
      blazerBody.position.set(0, 1.19, 0);
      blazerBody.castShadow = true;
      blazerGroup.add(blazerBody);

      const lapelMat = new THREE.MeshStandardMaterial({ color: 0xA68461, roughness: 0.55 });
      [-1, 1].forEach((side) => {
        const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.22, 0.02), lapelMat);
        lapel.position.set(side * 0.044, 1.25, 0.144);
        lapel.rotation.z = side * -0.25;
        blazerGroup.add(lapel);

        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.046, 0.54, 24), blazerMat);
        sleeve.position.set(side * 0.188, 1.15, 0);
        sleeve.rotation.z = side * -0.09;
        blazerGroup.add(sleeve);
      });

      blazerGroup.visible = false;
      topParent.add(blazerGroup);
      this.garmentMeshes.top['blazer'] = blazerGroup;

      // 4. Navy Poplin Oxford Shirt
      const navyGroup = new THREE.Group();
      const navyMat = new THREE.MeshStandardMaterial({
        color: 0x1E2B3E,
        roughness: 0.58,
        metalness: 0.04
      });
      const navyBody = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.128, 0.40, 32), navyMat);
      navyBody.position.set(0, 1.21, 0);
      navyGroup.add(navyBody);

      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.015, 12, 32, Math.PI * 1.5), navyMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, 1.38, 0);
      navyGroup.add(collar);

      [-1, 1].forEach((side) => {
        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.52, 24), navyMat);
        sleeve.position.set(side * 0.178, 1.15, 0);
        sleeve.rotation.z = side * -0.08;
        navyGroup.add(sleeve);
      });

      navyGroup.visible = false;
      topParent.add(navyGroup);
      this.garmentMeshes.top['navy_shirt'] = navyGroup;

      // 5. Breton Striped Nautical Sweater
      const stripeGroup = new THREE.Group();
      const whiteStripeMat = new THREE.MeshStandardMaterial({ color: 0xF4EFE6, roughness: 0.8 });
      const blueStripeMat = new THREE.MeshStandardMaterial({ color: 0x1D2636, roughness: 0.8 });

      for (let s = 0; s < 6; s++) {
        const mat = s % 2 === 0 ? whiteStripeMat : blueStripeMat;
        const stripeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.136, 0.136, 0.065, 32), mat);
        stripeRing.position.set(0, 1.05 + s * 0.065, 0);
        stripeGroup.add(stripeRing);
      }

      stripeGroup.visible = false;
      topParent.add(stripeGroup);
      this.garmentMeshes.top['striped_sweater'] = stripeGroup;
    }

    /**
     * Wearable 3D Bottoms (High-Waisted Tailored Taupe Trousers, Dark Denim, Crisp White Chinos)
     */
    buildWearableBottoms() {
      const bottomParent = new THREE.Group();
      this.avatarGroup.add(bottomParent);

      // 1. High-Waisted Tailored Fluid Trousers in Warm Taupe (Reference D)
      const taupeGroup = new THREE.Group();
      const taupeMat = new THREE.MeshStandardMaterial({
        color: 0x6E6350, // Rich warm taupe/olive tone providing clear contrast
        roughness: 0.72,
        metalness: 0.02
      });

      const taupePelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.124, 0.154, 0.22, 32), taupeMat);
      taupePelvis.position.set(0, 0.94, 0);
      taupePelvis.castShadow = true;
      taupeGroup.add(taupePelvis);

      const wideLegGeo = new THREE.CylinderGeometry(0.086, 0.104, 0.78, 24);
      [-1, 1].forEach((side) => {
        const leg = new THREE.Mesh(wideLegGeo, taupeMat);
        leg.position.set(side * 0.076, 0.44, 0);
        leg.castShadow = true;
        taupeGroup.add(leg);

        // Pressed Front Pleat Crease
        const crease = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.76, 0.01), new THREE.MeshStandardMaterial({ color: 0x564D3E }));
        crease.position.set(side * 0.076, 0.44, 0.094);
        taupeGroup.add(crease);
      });

      bottomParent.add(taupeGroup);
      this.garmentMeshes.bottom['taupe_wide'] = taupeGroup;

      // 2. Dark Indigo Denim Straight Jeans
      const denimGroup = new THREE.Group();
      const denimMat = new THREE.MeshStandardMaterial({
        color: 0x222C3D,
        roughness: 0.65,
        metalness: 0.04
      });
      const denimPelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.150, 0.22, 32), denimMat);
      denimPelvis.position.set(0, 0.94, 0);
      denimGroup.add(denimPelvis);

      const denimLegGeo = new THREE.CylinderGeometry(0.074, 0.070, 0.78, 24);
      [-1, 1].forEach((side) => {
        const leg = new THREE.Mesh(denimLegGeo, denimMat);
        leg.position.set(side * 0.072, 0.44, 0);
        denimGroup.add(leg);
      });

      denimGroup.visible = false;
      bottomParent.add(denimGroup);
      this.garmentMeshes.bottom['dark_denim'] = denimGroup;

      // 3. Crisp Pleated Ivory Chinos
      const chinosGroup = new THREE.Group();
      const chinosMat = new THREE.MeshStandardMaterial({
        color: 0xFAF7F0,
        roughness: 0.68,
        metalness: 0.02
      });
      const chinosPelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.123, 0.152, 0.22, 32), chinosMat);
      chinosPelvis.position.set(0, 0.94, 0);
      chinosGroup.add(chinosPelvis);

      const chinosLegGeo = new THREE.CylinderGeometry(0.080, 0.074, 0.78, 24);
      [-1, 1].forEach((side) => {
        const leg = new THREE.Mesh(chinosLegGeo, chinosMat);
        leg.position.set(side * 0.074, 0.44, 0);
        chinosGroup.add(leg);
      });

      chinosGroup.visible = false;
      bottomParent.add(chinosGroup);
      this.garmentMeshes.bottom['white_chinos'] = chinosGroup;
    }

    /**
     * Wearable 3D Footwear (Caramel Loafers, White Sneakers, Barefoot)
     */
    buildWearableShoes() {
      const shoesParent = new THREE.Group();
      this.avatarGroup.add(shoesParent);

      // 1. Barefoot Natural Sculpt (Matching Reference D relaxed studio look)
      const barefootGroup = new THREE.Group();
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xF0CDBC, roughness: 0.36 });
      [-1, 1].forEach((side) => {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.038, 0.16), skinMat);
        foot.position.set(side * 0.076, 0.02, 0.03);
        barefootGroup.add(foot);
      });
      shoesParent.add(barefootGroup);
      this.garmentMeshes.shoes['barefoot'] = barefootGroup;

      // 2. Polished Caramel Leather Loafers
      const loaferGroup = new THREE.Group();
      const loaferMat = new THREE.MeshStandardMaterial({ color: 0x754F31, roughness: 0.32, metalness: 0.06 });
      const soleMat = new THREE.MeshStandardMaterial({ color: 0x22160E, roughness: 0.8 });
      const bitMat = new THREE.MeshStandardMaterial({ color: 0xD8B478, metalness: 0.9, roughness: 0.2 });

      [-1, 1].forEach((side) => {
        const foot = new THREE.Group();
        foot.position.set(side * 0.076, 0, 0.03);

        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.050, 0.18), loaferMat);
        upper.position.set(0, 0.032, 0);
        foot.add(upper);

        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.016, 0.19), soleMat);
        sole.position.set(0, 0.008, 0);
        foot.add(sole);

        const bit = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.032, 8), bitMat);
        bit.rotation.z = Math.PI / 2;
        bit.position.set(0, 0.056, 0.02);
        foot.add(bit);

        loaferGroup.add(foot);
      });
      loaferGroup.visible = false;
      shoesParent.add(loaferGroup);
      this.garmentMeshes.shoes['loafers'] = loaferGroup;

      // 3. Minimalist White Court Sneakers
      const sneakerGroup = new THREE.Group();
      const sneakerMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.42 });
      const rubberSoleMat = new THREE.MeshStandardMaterial({ color: 0xF2ECE2, roughness: 0.7 });

      [-1, 1].forEach((side) => {
        const foot = new THREE.Group();
        foot.position.set(side * 0.076, 0, 0.03);

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.056, 0.19), sneakerMat);
        body.position.set(0, 0.036, 0);
        foot.add(body);

        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.020, 0.20), rubberSoleMat);
        sole.position.set(0, 0.010, 0);
        foot.add(sole);

        sneakerGroup.add(foot);
      });
      sneakerGroup.visible = false;
      shoesParent.add(sneakerGroup);
      this.garmentMeshes.shoes['sneakers'] = sneakerGroup;
    }

    /**
     * Equips a 3D garment into its corresponding category slot cleanly
     */
    equipGarment(category, garmentId) {
      let cat = category;
      if (cat === 'tops' || cat === 'outerwear') cat = 'top';
      if (cat === 'bottoms') cat = 'bottom';
      if (cat === 'shoe') cat = 'shoes';

      if (!this.garmentMeshes[cat]) return;

      // Hide all in category
      Object.keys(this.garmentMeshes[cat]).forEach((id) => {
        if (this.garmentMeshes[cat][id]) {
          this.garmentMeshes[cat][id].visible = false;
        }
      });

      // Show requested
      if (this.garmentMeshes[cat][garmentId]) {
        this.garmentMeshes[cat][garmentId].visible = true;
        this.activeGarments[cat] = garmentId;
      }

      // If equipping a top with long sleeves (like blazer, cardigan, navy_shirt), hide bare arms to prevent mesh overlap
      if (cat === 'top' && this.bareArms) {
        const hasSleeves = ['blazer', 'cardigan', 'navy_shirt', 'striped_sweater'].includes(garmentId);
        this.bareArms.forEach((arm) => {
          arm.visible = !hasSleeves;
        });
      }

      console.log(`Studio3D: Equipped [${cat}] -> ${garmentId}`);
    }

    /**
     * Smooth camera navigation to designated viewpoint
     */
    setCameraState(stateName) {
      const state = CAMERA_STATES[stateName];
      if (!state) {
        console.warn('Studio3D: Unknown camera state:', stateName);
        return;
      }

      this.currentCameraState = stateName;
      this.targetCameraPos.copy(state.position);
      this.targetCameraLookAt.copy(state.target);

      const aspect = this.camera.aspect;
      const isPortrait = aspect < 0.75;
      const targetFov = isPortrait ? state.fovPortrait : state.fovLandscape;
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();

      // Dispatch UI pill active state
      if (typeof window !== 'undefined' && window.app && window.app.onStudioCameraChanged) {
        window.app.onStudioCameraChanged(stateName);
      }
    }

    /**
     * Setup touch, pointer, and raycasting listeners
     */
    setupInteractionHandlers() {
      const onPointerDown = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        this.isPointerDown = true;
        this.pointerStartX = clientX;
        this.pointerStartY = clientY;
        this.lastPointerX = clientX;
        this.lastPointerY = clientY;
        this.hasDragged = false;
      };

      const onPointerMove = (e) => {
        if (!this.isPointerDown) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - this.lastPointerX;
        const dy = clientY - this.lastPointerY;

        if (Math.hypot(clientX - this.pointerStartX, clientY - this.pointerStartY) > 5) {
          this.hasDragged = true;
        }

        // Horizontal Drag rotates avatar smoothly
        this.targetRotationY += dx * 0.012;

        this.lastPointerX = clientX;
        this.lastPointerY = clientY;
      };

      const onPointerUp = (e) => {
        if (!this.isPointerDown) return;
        this.isPointerDown = false;

        // If simple tap/click without drag, perform Raycasting
        if (!this.hasDragged && e.target === this.canvas) {
          const rect = this.canvas.getBoundingClientRect();
          const clientX = this.pointerStartX;
          const clientY = this.pointerStartY;

          this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
          this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

          this.raycaster.setFromCamera(this.mouse, this.camera);
          const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

          if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit && !hit.userData.interactiveType && hit.parent) {
              hit = hit.parent;
            }
            if (hit && hit.userData.interactiveType) {
              const type = hit.userData.interactiveType;
              this.handleObjectClick(type);
            }
          }
        }
      };

      // Mouse Listeners
      this.canvas.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      // Touch Listeners
      this.canvas.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp, { passive: true });
    }

    /**
     * Dispatches click actions from 3D furniture
     */
    handleObjectClick(type) {
      console.log(`Studio3D: Clicked 3D object -> [${type}]`);
      if (type === 'wardrobe') {
        this.setCameraState('WARDROBE_CLOSEUP');
        if (window.app && window.app.serenToggleWardrobe) {
          window.app.serenToggleWardrobe(true);
        }
      } else if (type === 'mirror') {
        this.setCameraState('MIRROR_VIEW');
        if (window.app && window.app.serenOpenStylingReview) {
          window.app.serenOpenStylingReview();
        }
      } else if (type === 'avatar') {
        if (this.currentCameraState === 'AVATAR_FULL_BODY') {
          this.setCameraState('AVATAR_DETAIL');
        } else {
          this.setCameraState('AVATAR_FULL_BODY');
        }
      }

      if (this.onObjectClick) {
        this.onObjectClick(type);
      }
    }

    /**
     * Window / Viewport resize handler
     */
    onResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const rect = this.container.getBoundingClientRect();
      const width = rect.width || this.container.clientWidth || 390;
      const height = rect.height || this.container.clientHeight || 750;

      const aspect = width / height;
      this.camera.aspect = aspect;

      const state = CAMERA_STATES[this.currentCameraState] || CAMERA_STATES.STUDIO_OVERVIEW;
      const isPortrait = aspect < 0.75;
      this.camera.fov = isPortrait ? state.fovPortrait : state.fovLandscape;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    /**
     * Main animation loop: Smooth camera transitions, live mirror render pass, & idle breathing
     */
    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate);

      const dt = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // 1. Smooth Avatar Rotation Damping
      this.avatarRotationY += (this.targetRotationY - this.avatarRotationY) * (1.0 - Math.exp(-8.0 * dt));
      if (this.avatarGroup) {
        this.avatarGroup.rotation.y = this.avatarRotationY;
      }

      // 2. Smooth Camera Position & LookAt Lerp
      const lerpSpeed = 1.0 - Math.exp(-6.0 * dt);
      this.camera.position.lerp(this.targetCameraPos, lerpSpeed);
      this.currentCameraLookAt.lerp(this.targetCameraLookAt, lerpSpeed);
      this.camera.lookAt(this.currentCameraLookAt);

      // 3. Subtle Idle Breathing Motion on Avatar
      if (this.chestGroup) {
        const breath = Math.sin(time * 2.2) * 0.007;
        this.chestGroup.position.y = 1.22 + breath;
        this.chestGroup.scale.set(1.0 + breath * 0.4, 1.0, 1.0 + breath * 0.4);
      }
      if (this.headGroup) {
        const microTilt = Math.sin(time * 1.5) * 0.004;
        this.headGroup.rotation.z = microTilt;
      }

      // 4. Secondary Live Mirror Reflection Render Pass
      if (this.mirrorRenderTarget && this.mirrorCamera && this.mirrorGlassMesh) {
        this.mirrorGlassMesh.visible = false;
        this.renderer.setRenderTarget(this.mirrorRenderTarget);
        this.renderer.render(this.scene, this.mirrorCamera);
        this.renderer.setRenderTarget(null);
        this.mirrorGlassMesh.visible = true;
      }

      // 5. Render Main 3D WebGL Scene
      this.renderer.render(this.scene, this.camera);
    }

    /**
     * Cleanup resources
     */
    dispose() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.mirrorRenderTarget) {
        this.mirrorRenderTarget.dispose();
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
      this.isInitialized = false;
    }
  }

  return new Studio3DEngine();
}));
