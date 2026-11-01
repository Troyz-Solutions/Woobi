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
        this.renderer.toneMappingExposure = 0.78; // Calibrated for deep contrast and filmic tone
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

      // 2. Authentic European Golden Oak Procedural Textures (Uprights, Shelves, Backboard & Pores)
      // 2A. Vertical Grain European Oak for Cabinet Uprights & Frame (1024x1024)
      const woodCanvas = document.createElement('canvas');
      woodCanvas.width = 1024;
      woodCanvas.height = 1024;
      const wCtx = woodCanvas.getContext('2d');

      // Base warm golden honey oak
      wCtx.fillStyle = '#C9A66B';
      wCtx.fillRect(0, 0, 1024, 1024);

      // Organic subtle timber growth variations across width
      const wGrad = wCtx.createLinearGradient(0, 0, 1024, 0);
      wGrad.addColorStop(0, '#C49F63');
      wGrad.addColorStop(0.22, '#CEAB70');
      wGrad.addColorStop(0.48, '#C29C60');
      wGrad.addColorStop(0.72, '#D2AF75');
      wGrad.addColorStop(1, '#C5A064');
      wCtx.fillStyle = wGrad;
      wCtx.fillRect(0, 0, 1024, 1024);

      // Fine longitudinal timber grain lines with natural sinusoidal flow
      for (let i = 0; i < 54; i++) {
        const gx = 80 + i * 17.5;
        wCtx.strokeStyle = (i % 3 === 0) ? 'rgba(152, 116, 66, 0.38)' : 'rgba(182, 146, 96, 0.22)';
        wCtx.lineWidth = 1.1 + (i % 4) * 0.35;
        wCtx.beginPath();
        wCtx.moveTo(gx, 0);
        for (let y = 0; y <= 1024; y += 32) {
          const wave = Math.sin(y * 0.007 + i * 0.22) * 14 + Math.sin(y * 0.025) * 3.5;
          wCtx.lineTo(gx + wave, y);
        }
        wCtx.stroke();
      }

      // Cathedral grain flame peak arches
      for (let c = 0; c < 3; c++) {
        const cy = 240 + c * 330;
        for (let r = 1; r <= 6; r++) {
          wCtx.strokeStyle = 'rgba(142, 106, 58, ' + (0.16 + r * 0.028) + ')';
          wCtx.lineWidth = 1.3;
          wCtx.beginPath();
          wCtx.ellipse(512, cy, 60 + r * 26, 85 + r * 32, 0, 0, Math.PI);
          wCtx.stroke();
        }
      }

      // Medullary rays (tiger oak / quartersawn flecks across the grain)
      for (let m = 0; m < 90; m++) {
        const mx = Math.random() * 960 + 30;
        const my = Math.random() * 980 + 20;
        const mLen = Math.random() * 26 + 10;
        wCtx.strokeStyle = Math.random() > 0.4 ? 'rgba(238, 218, 180, 0.34)' : 'rgba(132, 98, 56, 0.24)';
        wCtx.lineWidth = Math.random() * 1.8 + 0.8;
        wCtx.beginPath();
        wCtx.moveTo(mx, my);
        wCtx.lineTo(mx + mLen, my + (Math.random() - 0.5) * 3);
        wCtx.stroke();
      }

      // High-frequency open timber pores (characteristic of European Oak)
      for (let p = 0; p < 2800; p++) {
        const px = Math.random() * 1024;
        const py = Math.random() * 1024;
        const pLen = Math.random() * 9 + 4;
        wCtx.fillStyle = Math.random() > 0.4 ? 'rgba(126, 92, 50, 0.30)' : 'rgba(238, 212, 166, 0.20)';
        wCtx.fillRect(px, py, 1.1, pLen);
      }

      this.textures.oak = new THREE.CanvasTexture(woodCanvas);
      this.textures.oak.wrapS = THREE.RepeatWrapping;
      this.textures.oak.wrapT = THREE.RepeatWrapping;
      this.textures.oak.repeat.set(1.5, 2.2);

      // European Oak Tactile Bump Map
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

      // 2B. European Oak Roughness Variation Map (512x512)
      // Break specular highlights naturally along wood pores and grain
      const wRoughCanvas = document.createElement('canvas');
      wRoughCanvas.width = 512;
      wRoughCanvas.height = 512;
      const wrCtx = wRoughCanvas.getContext('2d');
      wrCtx.fillStyle = '#686868'; // Base satin sheen ~0.40
      wrCtx.fillRect(0, 0, 512, 512);
      wrCtx.drawImage(wBumpCanvas, 0, 0, 512, 512);
      this.textures.oakRoughness = new THREE.CanvasTexture(wRoughCanvas);
      this.textures.oakRoughness.wrapS = THREE.RepeatWrapping;
      this.textures.oakRoughness.wrapT = THREE.RepeatWrapping;
      this.textures.oakRoughness.repeat.set(1.5, 2.2);

      // 2C. Horizontal Grain European Oak for Shelves & Plinth (1024x512)
      // Wood grain runs horizontally along shelf width
      const woodShelfCanvas = document.createElement('canvas');
      woodShelfCanvas.width = 1024;
      woodShelfCanvas.height = 512;
      const wsCtx = woodShelfCanvas.getContext('2d');

      // Warm honey oak base
      wsCtx.fillStyle = '#CAA76D';
      wsCtx.fillRect(0, 0, 1024, 512);

      // Horizontal plank tone gradients
      const wsGrad = wsCtx.createLinearGradient(0, 0, 0, 512);
      wsGrad.addColorStop(0, '#C19B5E');
      wsGrad.addColorStop(0.35, '#D0AD73');
      wsGrad.addColorStop(0.70, '#C39E62');
      wsGrad.addColorStop(1, '#CEAA70');
      wsCtx.fillStyle = wsGrad;
      wsCtx.fillRect(0, 0, 1024, 512);

      // Longitudinal horizontal grain lines
      for (let j = 0; j < 36; j++) {
        const gy = 15 + j * 14;
        wsCtx.strokeStyle = (j % 3 === 0) ? 'rgba(148, 112, 62, 0.35)' : 'rgba(178, 142, 92, 0.20)';
        wsCtx.lineWidth = 1.0 + (j % 4) * 0.3;
        wsCtx.beginPath();
        wsCtx.moveTo(0, gy);
        for (let x = 0; x <= 1024; x += 32) {
          const wave = Math.sin(x * 0.006 + j * 0.24) * 10 + Math.sin(x * 0.022) * 2.5;
          wsCtx.lineTo(x, gy + wave);
        }
        wsCtx.stroke();
      }

      // Horizontal open pores
      for (let p = 0; p < 1800; p++) {
        const px = Math.random() * 1024;
        const py = Math.random() * 512;
        const pLen = Math.random() * 10 + 4;
        wsCtx.fillStyle = Math.random() > 0.4 ? 'rgba(122, 88, 48, 0.28)' : 'rgba(235, 212, 168, 0.20)';
        wsCtx.fillRect(px, py, pLen, 1.1);
      }

      this.textures.oakShelf = new THREE.CanvasTexture(woodShelfCanvas);
      this.textures.oakShelf.wrapS = THREE.RepeatWrapping;
      this.textures.oakShelf.wrapT = THREE.RepeatWrapping;
      this.textures.oakShelf.repeat.set(2.0, 1.2);

      const wsBumpCanvas = document.createElement('canvas');
      wsBumpCanvas.width = 512;
      wsBumpCanvas.height = 256;
      const wsbCtx = wsBumpCanvas.getContext('2d');
      wsbCtx.fillStyle = '#808080';
      wsbCtx.fillRect(0, 0, 512, 256);
      wsbCtx.drawImage(woodShelfCanvas, 0, 0, 512, 256);
      this.textures.oakShelfBump = new THREE.CanvasTexture(wsBumpCanvas);
      this.textures.oakShelfBump.wrapS = THREE.RepeatWrapping;
      this.textures.oakShelfBump.wrapT = THREE.RepeatWrapping;
      this.textures.oakShelfBump.repeat.set(2.0, 1.2);

      // 2D. Architectural Tongue-and-Groove Planked Oak Backboard Texture (1024x1024)
      // Creates individual vertical timber planks with recessed shadow v-grooves
      const backboardCanvas = document.createElement('canvas');
      backboardCanvas.width = 1024;
      backboardCanvas.height = 1024;
      const bbCtx = backboardCanvas.getContext('2d');

      const plankColors = ['#936D3E', '#9A7342', '#8C6636', '#9E7746', '#906A39'];
      const numPlanks = 5;
      const plankW = 1024 / numPlanks;

      for (let pk = 0; pk < numPlanks; pk++) {
        const px = pk * plankW;
        bbCtx.fillStyle = plankColors[pk % plankColors.length];
        bbCtx.fillRect(px, 0, plankW, 1024);

        // Individual plank vertical grain
        for (let g = 0; g < 10; g++) {
          const gx = px + 12 + g * 18;
          bbCtx.strokeStyle = 'rgba(74, 52, 28, 0.28)';
          bbCtx.lineWidth = 1.0;
          bbCtx.beginPath();
          bbCtx.moveTo(gx, 0);
          for (let y = 0; y <= 1024; y += 40) {
            bbCtx.lineTo(gx + Math.sin(y * 0.008 + g) * 5, y);
          }
          bbCtx.stroke();
        }

        // Deep recessed V-groove shadow line between adjacent planks
        if (pk > 0) {
          const vGrad = bbCtx.createLinearGradient(px - 4, 0, px + 4, 0);
          vGrad.addColorStop(0, 'rgba(42, 28, 14, 0.0)');
          vGrad.addColorStop(0.5, 'rgba(32, 20, 10, 0.72)');
          vGrad.addColorStop(1, 'rgba(42, 28, 14, 0.0)');
          bbCtx.fillStyle = vGrad;
          bbCtx.fillRect(px - 4, 0, 8, 1024);
        }
      }

      this.textures.oakBackboard = new THREE.CanvasTexture(backboardCanvas);
      this.textures.oakBackboard.wrapS = THREE.ClampToEdgeWrapping;
      this.textures.oakBackboard.wrapT = THREE.RepeatWrapping;

      // 3. Circular Woven Wool Rug Texture (512x512)
      const rugCanvas = document.createElement('canvas');
      rugCanvas.width = 512;
      rugCanvas.height = 512;
      const rCtx = rugCanvas.getContext('2d');

      rCtx.fillStyle = '#A68A68'; // Accent #A68A68
      rCtx.fillRect(0, 0, 512, 512);

      // Concentric radial woven rings & cross texture
      for (let r = 8; r < 256; r += 3) {
        rCtx.strokeStyle = (r % 6 === 0) ? 'rgba(126, 102, 78, 0.38)' : 'rgba(198, 176, 152, 0.26)';
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

      bCtx.fillStyle = '#D8CFC1'; // Secondary surface #D8CFC1
      bCtx.fillRect(0, 0, 512, 512);

      // Nubby looped yarn clusters
      for (let i = 0; i < 2800; i++) {
        const bx = Math.random() * 512;
        const by = Math.random() * 512;
        const br = Math.random() * 2.8 + 1.2;
        bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(180, 168, 152, 0.45)' : 'rgba(245, 240, 232, 0.60)';
        bCtx.beginPath();
        bCtx.arc(bx, by, br, 0, Math.PI * 2);
        bCtx.fill();
      }
      this.textures.boucle = new THREE.CanvasTexture(boucleCanvas);
      this.textures.boucle.wrapS = THREE.RepeatWrapping;
      this.textures.boucle.wrapT = THREE.RepeatWrapping;
      this.textures.boucle.repeat.set(3, 3);

      // 5. Authentic Rustic Linen Fabric Texture (Albert Reference, 512x512)
      const linenCanvas = document.createElement('canvas');
      linenCanvas.width = 512;
      linenCanvas.height = 512;
      const lCtx = linenCanvas.getContext('2d');

      lCtx.fillStyle = '#EDE5D8'; // Unbleached natural raw linen flax
      lCtx.fillRect(0, 0, 512, 512);

      // Orthogonal warp (vertical) and weft (horizontal) slub yarn threads
      const threadStep = 4;
      for (let x = 0; x < 512; x += threadStep) {
        const isSlub = Math.random() > 0.84;
        const alpha = isSlub ? 0.34 : 0.16;
        lCtx.fillStyle = Math.random() > 0.5 ? 'rgba(138, 122, 104, ' + alpha + ')' : 'rgba(255, 252, 246, ' + alpha + ')';
        lCtx.fillRect(x, 0, isSlub ? 2.4 : 1.4, 512);
      }
      for (let y = 0; y < 512; y += threadStep) {
        const isSlub = Math.random() > 0.84;
        const alpha = isSlub ? 0.34 : 0.16;
        lCtx.fillStyle = Math.random() > 0.5 ? 'rgba(138, 122, 104, ' + alpha + ')' : 'rgba(255, 252, 246, ' + alpha + ')';
        lCtx.fillRect(0, y, 512, isSlub ? 2.4 : 1.4);
      }

      // Micro slub knots & organic fiber flecks
      for (let s = 0; s < 500; s++) {
        const sx = Math.random() * 512;
        const sy = Math.random() * 512;
        lCtx.fillStyle = Math.random() > 0.6 ? 'rgba(120, 105, 88, 0.38)' : 'rgba(255, 255, 255, 0.50)';
        lCtx.fillRect(sx, sy, Math.random() * 2.8 + 1, Math.random() * 2.2 + 1);
      }

      this.textures.linen = new THREE.CanvasTexture(linenCanvas);
      this.textures.linen.wrapS = THREE.RepeatWrapping;
      this.textures.linen.wrapT = THREE.RepeatWrapping;
      this.textures.linen.repeat.set(6, 6);

      // Rustic Linen Bump Map
      const lBumpCanvas = document.createElement('canvas');
      lBumpCanvas.width = 512;
      lBumpCanvas.height = 512;
      const lbCtx = lBumpCanvas.getContext('2d');
      lbCtx.fillStyle = '#808080';
      lbCtx.fillRect(0, 0, 512, 512);
      lbCtx.drawImage(linenCanvas, 0, 0, 512, 512);
      this.textures.linenBump = new THREE.CanvasTexture(lBumpCanvas);
      this.textures.linenBump.wrapS = THREE.RepeatWrapping;
      this.textures.linenBump.wrapT = THREE.RepeatWrapping;
      this.textures.linenBump.repeat.set(6, 6);

      // 6. Soft Photographic Contact Shadow Maps
      // 6A. Circular Radial Contact Shadow Map (256x256)
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const sCtx = shadowCanvas.getContext('2d');

      const sGrad = sCtx.createRadialGradient(128, 128, 6, 128, 128, 126);
      sGrad.addColorStop(0, 'rgba(16, 12, 8, 0.95)'); // Dense core ambient occlusion
      sGrad.addColorStop(0.35, 'rgba(26, 20, 14, 0.62)');
      sGrad.addColorStop(0.70, 'rgba(45, 36, 26, 0.22)');
      sGrad.addColorStop(1, 'rgba(60, 48, 35, 0.0)'); // Soft feathered falloff
      sCtx.fillStyle = sGrad;
      sCtx.fillRect(0, 0, 256, 256);

      this.textures.contactShadow = new THREE.CanvasTexture(shadowCanvas);

      // 6B. Anatomical Foot Sole Grounding Shadow Map (256x256)
      // Photorealistic sole contact core (heel pad, lateral bridge & metatarsal ball) with directional soft penumbra
      const footCanvas = document.createElement('canvas');
      footCanvas.width = 256;
      footCanvas.height = 256;
      const fCtx = footCanvas.getContext('2d');

      // Soft feathered outer penumbra with subtle directional drift (+X, -Z matching morning key light)
      const fOuterGrad = fCtx.createRadialGradient(132, 122, 16, 132, 122, 114);
      fOuterGrad.addColorStop(0, 'rgba(18, 13, 8, 0.40)');
      fOuterGrad.addColorStop(0.50, 'rgba(28, 20, 14, 0.18)');
      fOuterGrad.addColorStop(0.85, 'rgba(45, 34, 24, 0.05)');
      fOuterGrad.addColorStop(1, 'rgba(60, 48, 35, 0.0)');
      fCtx.fillStyle = fOuterGrad;
      fCtx.fillRect(0, 0, 256, 256);

      // Metatarsal ball / forefoot contact core (high weight concentration)
      const ballGrad = fCtx.createRadialGradient(128, 88, 4, 128, 88, 40);
      ballGrad.addColorStop(0, 'rgba(12, 8, 5, 0.96)');
      ballGrad.addColorStop(0.55, 'rgba(20, 14, 9, 0.68)');
      ballGrad.addColorStop(1, 'rgba(38, 28, 18, 0.0)');
      fCtx.fillStyle = ballGrad;
      fCtx.beginPath();
      fCtx.arc(128, 88, 40, 0, Math.PI * 2);
      fCtx.fill();

      // Heel pad circular contact core
      const heelGrad = fCtx.createRadialGradient(128, 172, 3, 128, 172, 32);
      heelGrad.addColorStop(0, 'rgba(12, 8, 5, 0.96)');
      heelGrad.addColorStop(0.55, 'rgba(20, 14, 9, 0.65)');
      heelGrad.addColorStop(1, 'rgba(38, 28, 18, 0.0)');
      fCtx.fillStyle = heelGrad;
      fCtx.beginPath();
      fCtx.arc(128, 172, 32, 0, Math.PI * 2);
      fCtx.fill();

      // Subtle lateral arch connection strip
      const archGrad = fCtx.createLinearGradient(140, 95, 140, 160);
      archGrad.addColorStop(0, 'rgba(18, 13, 8, 0.50)');
      archGrad.addColorStop(0.5, 'rgba(22, 16, 10, 0.35)');
      archGrad.addColorStop(1, 'rgba(18, 13, 8, 0.50)');
      fCtx.fillStyle = archGrad;
      fCtx.fillRect(132, 105, 16, 52);

      this.textures.footContactShadow = new THREE.CanvasTexture(footCanvas);

      // 6C. Rectangular Linear Furniture Base Grounding Shadow Map (512x256)
      // Generates intense contact occlusion along cabinet plinth and table leg perimeters
      const boxShadowCanvas = document.createElement('canvas');
      boxShadowCanvas.width = 512;
      boxShadowCanvas.height = 256;
      const bsCtx = boxShadowCanvas.getContext('2d');

      // Soft perimeter feathering
      for (let step = 0; step < 28; step++) {
        const inset = step * 3.5;
        const alpha = Math.pow(step / 27, 2.2) * 0.92;
        bsCtx.fillStyle = `rgba(14, 10, 6, ${alpha})`;
        bsCtx.fillRect(36 + inset, 24 + inset * 0.65, 512 - (36 + inset) * 2, 256 - (24 + inset * 0.65) * 2);
      }

      this.textures.boxContactShadow = new THREE.CanvasTexture(boxShadowCanvas);
    }

    /**
     * Advanced Photographic Lighting Architecture
     * Soft warm directional key light, ambient illumination, architectural spots & cove glows
     */
    setupLighting() {
      // Warm, natural ambient fill (Balanced architectural daylight bounce)
      const ambientLight = new THREE.AmbientLight(0xEAE2D5, 0.22);
      this.scene.add(ambientLight);

      // Primary Key Sunlight (Directional morning sunbeams, balanced to avoid washing out left side)
      const keyLight = new THREE.DirectionalLight(0xFFF5E4, 0.72);
      keyLight.position.set(-3.2, 5.0, 2.8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 14;
      keyLight.shadow.bias = -0.0002;
      const d = 2.6;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      this.scene.add(keyLight);

      // Balanced Soft Daylight Fill from right (elevated from 0.18 to 0.38 to balance left-right contrast)
      const fillLight = new THREE.DirectionalLight(0xF7EFE5, 0.38);
      fillLight.position.set(3.0, 3.4, 2.2);
      this.scene.add(fillLight);

      // Right-Side Architectural Wall & Vanity Wash (Gently balances the right half of the scene)
      const rightBounce = new THREE.DirectionalLight(0xF5ECE0, 0.22);
      rightBounce.position.set(3.2, 1.8, 0.5);
      this.scene.add(rightBounce);

      // Golden Rim Light (Creates crisp contour separation around avatar hair, shoulders & ivory top edges)
      const rimLight = new THREE.DirectionalLight(0xFFE2B8, 0.44);
      rimLight.position.set(0.3, 3.4, -2.2);
      this.scene.add(rimLight);

      // Architectural Ceiling Spotlights (Soft warm downward accents balanced symmetrically)
      // 1. Wardrobe Downlight
      const wardrobeSpot = new THREE.SpotLight(0xFFE8C6, 0.30, 5.5, Math.PI / 4, 0.45, 1.2);
      wardrobeSpot.position.set(-1.0, 3.6, 0.3);
      wardrobeSpot.target.position.set(-0.95, 1.2, -0.15);
      this.scene.add(wardrobeSpot);
      this.scene.add(wardrobeSpot.target);

      // 2. Center Stage Downlight
      const stageSpot = new THREE.SpotLight(0xFFF2DC, 0.26, 6.0, Math.PI / 4.2, 0.45, 1.1);
      stageSpot.position.set(0, 3.8, 0.4);
      stageSpot.target.position.set(0, 0.6, 0);
      this.scene.add(stageSpot);
      this.scene.add(stageSpot.target);

      // 3. Vanity Downlight with directional shadow depth
      const vanitySpot = new THREE.SpotLight(0xFFE8C6, 0.42, 6.0, Math.PI / 4, 0.48, 1.2);
      vanitySpot.position.set(1.0, 3.6, 0.3);
      vanitySpot.target.position.set(0.95, 1.2, -0.15);
      vanitySpot.castShadow = true;
      vanitySpot.shadow.bias = -0.0005;
      if (vanitySpot.shadow.mapSize) {
        vanitySpot.shadow.mapSize.width = 1024;
        vanitySpot.shadow.mapSize.height = 1024;
      }
      this.scene.add(vanitySpot);
      this.scene.add(vanitySpot.target);
    }

    /**
     * Architecture: Polished Calacatta Gold Marble Floor, Layered Ceiling Soffits & Architectural Walls
     */
    buildRoomArchitecture() {
      // 1. Polished Italian Calacatta Gold Marble Flooring (Soft satin sheen avoiding mirror glare)
      const floorGeo = new THREE.PlaneGeometry(16, 16);
      const floorMat = new THREE.MeshStandardMaterial({
        map: this.textures.marble,
        roughnessMap: this.textures.marbleRoughness,
        roughness: 0.34, // Refined satin hone
        metalness: 0.02,
        color: 0xEAE3D8
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      this.scene.add(floor);

      // 2. Smooth Architectural Cream Plaster Back Wall (#E9E2D7)
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xEDE6DC, // Soft luminous architectural cream plaster
        roughness: 0.94,
        metalness: 0.0,
        side: THREE.BackSide
      });
      const wallGeo = new THREE.CylinderGeometry(6.6, 6.6, 6.8, 48, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
      const backWall = new THREE.Mesh(wallGeo, wallMat);
      backWall.position.set(0, 3.4, 0);
      backWall.receiveShadow = true;
      this.scene.add(backWall);

      // 3. Architectural Backdrop Wall (Seamless 5.4m breadth eliminating dark vertical crevice behind mirror)
      const alcoveWidth = 5.4;
      const alcoveHeight = 3.8;
      const alcoveDepth = 0.08;
      const alcoveMat = new THREE.MeshStandardMaterial({
        color: 0xDDD4C7, // Soft harmonious architectural cashmere plaster blending smoothly across room
        roughness: 0.94
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

      // Soft Ambient Occlusion Contact Shadow under rug edge for grounding depth
      const shadowDiscGeo = new THREE.CircleGeometry(1.30, 64);
      const shadowDiscMat = new THREE.MeshBasicMaterial({
        map: this.textures.contactShadow,
        transparent: true,
        opacity: 0.68
      });
      const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.002;
      stageGroup.add(shadowDisc);

      // 2. Lower Tier: Circular Stone Base with Radiant LED Halo Perimeter
      const lowerBaseRadius = 0.94;
      const lowerBaseHeight = 0.045;

      // Soft grounding contact shadow ring under stone base onto rug
      const baseShadowGeo = new THREE.CircleGeometry(lowerBaseRadius + 0.08, 64);
      const baseShadowMat = new THREE.MeshBasicMaterial({
        map: this.textures.contactShadow,
        transparent: true,
        opacity: 0.72,
        depthWrite: false
      });
      const baseShadow = new THREE.Mesh(baseShadowGeo, baseShadowMat);
      baseShadow.rotation.x = -Math.PI / 2;
      baseShadow.position.y = 0.008;
      stageGroup.add(baseShadow);

      const lowerBaseGeo = new THREE.CylinderGeometry(lowerBaseRadius, lowerBaseRadius, lowerBaseHeight, 64);
      const lowerBaseMat = new THREE.MeshStandardMaterial({
        color: 0xD8CFC1, // Secondary surface #D8CFC1
        roughness: 0.65,
        metalness: 0.02
      });
      const lowerBase = new THREE.Mesh(lowerBaseGeo, lowerBaseMat);
      lowerBase.position.y = lowerBaseHeight / 2;
      lowerBase.receiveShadow = true;
      stageGroup.add(lowerBase);

      // Radiant Warm 360° Illuminated LED Halo Ring (Subtle Amber Glow)
      const ledHaloGeo = new THREE.TorusGeometry(lowerBaseRadius + 0.012, 0.016, 16, 64);
      const ledHaloMat = new THREE.MeshBasicMaterial({
        color: 0xE8C27E
      });
      const ledHalo = new THREE.Mesh(ledHaloGeo, ledHaloMat);
      ledHalo.rotation.x = Math.PI / 2;
      ledHalo.position.y = 0.038;
      stageGroup.add(ledHalo);

      // Downward halo perimeter light illuminating the woven rug
      const haloLight = new THREE.PointLight(0xFFD694, 0.35, 2.2);
      haloLight.position.set(0, 0.06, 0);
      stageGroup.add(haloLight);

      // 3. Upper Tier: Refined Polished Disc (Secondary surface #D8CFC1)
      const upperRadius = 0.88;
      const upperHeight = 0.075;
      const upperStageGeo = new THREE.CylinderGeometry(upperRadius, upperRadius + 0.015, upperHeight, 64);
      const upperStageMat = new THREE.MeshStandardMaterial({
        color: 0xD8CFC1, // Secondary surface #D8CFC1
        roughness: 0.58,
        metalness: 0.02
      });
      const upperStage = new THREE.Mesh(upperStageGeo, upperStageMat);
      upperStage.position.y = lowerBaseHeight + upperHeight / 2;
      upperStage.receiveShadow = true;
      stageGroup.add(upperStage);

      // Chamfered brass accent ring between upper and lower tiers
      const brassBevelGeo = new THREE.TorusGeometry(upperRadius + 0.008, 0.006, 12, 64);
      const brassBevelMat = new THREE.MeshStandardMaterial({
        color: 0xA68A68, // Accent #A68A68
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

      // European Oak Frame Material (Vertical stiles with medullary rays and satin sheen)
      const oakMat = new THREE.MeshStandardMaterial({
        map: this.textures.oak,
        bumpMap: this.textures.oakBump,
        bumpScale: 0.016,
        roughnessMap: this.textures.oakRoughness,
        color: 0xC9A66B, // Authentic European Golden Oak #C9A66B
        roughness: 0.40, // Soft satin furniture lacquer
        metalness: 0.01
      });

      // European Oak Shelves Material (Horizontal grain orientation along shelf span with warm honey depth)
      const oakShelfMat = new THREE.MeshStandardMaterial({
        map: this.textures.oakShelf,
        bumpMap: this.textures.oakShelfBump,
        bumpScale: 0.018,
        roughnessMap: this.textures.oakRoughness,
        color: 0xC6A164, // Subtle warm amber-honey variation for horizontal shelving
        roughness: 0.38,
        metalness: 0.01
      });

      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xA68A68, // Accent #A68A68 brushed metallic
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

      // Back Wall Panel with tongue-and-groove planking to eliminate flat appearance
      const interiorOakMat = new THREE.MeshStandardMaterial({
        map: this.textures.oakBackboard,
        bumpMap: this.textures.oakBump,
        bumpScale: 0.014,
        color: 0xA47D48, // Rich amber-honey recessed timber tone
        roughness: 0.56,
        metalness: 0.01
      });
      const backBoard = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.076, height - 0.038, 0.02),
        interiorOakMat
      );
      backBoard.position.set(0, height / 2, -depth / 2 + 0.01);
      backBoard.receiveShadow = true;
      wardrobeGroup.add(backBoard);

      // Base Plinth with Horizontal Grain & Kick-Toe Recessed Glow
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, depth - 0.04), oakShelfMat);
      plinth.position.set(0, 0.07, 0.02);
      plinth.castShadow = true;
      wardrobeGroup.add(plinth);

      // Natural rectangular contact grounding shadow under wardrobe base plinth
      const wardrobeShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(width + 0.32, depth + 0.28),
        new THREE.MeshBasicMaterial({
          map: this.textures.boxContactShadow,
          transparent: true,
          opacity: 0.82,
          depthWrite: false
        })
      );
      wardrobeShadow.rotation.x = -Math.PI / 2;
      wardrobeShadow.position.set(0.04, 0.003, 0.04);
      wardrobeGroup.add(wardrobeShadow);

      // Front kickplate tight contact shadow line
      const kickShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(width, 0.07),
        new THREE.MeshBasicMaterial({
          map: this.textures.boxContactShadow,
          transparent: true,
          opacity: 0.70,
          depthWrite: false
        })
      );
      kickShadow.rotation.x = -Math.PI / 2;
      kickShadow.position.set(0, 0.004, depth / 2 - 0.01);
      wardrobeGroup.add(kickShadow);

      // 2. Horizontal Shelf Tiers with Recessed Warm LED Light Strips & Front Edge Highlight
      const shelfPositions = [0.14, 0.62, 1.15, 2.18];
      const shelfGeo = new THREE.BoxGeometry(width - 0.076, 0.030, depth - 0.02);
      const shelfLipGeo = new THREE.BoxGeometry(width - 0.076, 0.008, 0.012);
      const shelfLipMat = new THREE.MeshStandardMaterial({
        color: 0xD8B478, // Subtle champagne metallic front edge lip
        metalness: 0.70,
        roughness: 0.28
      });

      shelfPositions.forEach((shY) => {
        // Shelf slab with horizontal wood grain
        const shelf = new THREE.Mesh(shelfGeo, oakShelfMat);
        shelf.position.set(0, shY, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        wardrobeGroup.add(shelf);

        // Subtle front edge highlight trim (breaks flat shelf edge)
        const frontLip = new THREE.Mesh(shelfLipGeo, shelfLipMat);
        frontLip.position.set(0, shY - 0.011, (depth - 0.02) / 2);
        wardrobeGroup.add(frontLip);

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

      // Internal warm ambient shelf lighting (Balanced so left side does not overpower scene)
      const shelfLight1 = new THREE.PointLight(0xFFA834, 0.85, 2.5);
      shelfLight1.position.set(0, 2.10, 0.14);
      wardrobeGroup.add(shelfLight1);

      const shelfLight2 = new THREE.PointLight(0xFFA834, 0.65, 1.9);
      shelfLight2.position.set(0, 1.08, 0.14);
      wardrobeGroup.add(shelfLight2);

      const shelfLight3 = new THREE.PointLight(0xFFA834, 0.60, 1.7);
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
        roughness: 0.24, // Tactile honed marble surface
        metalness: 0.02,
        color: 0xD8CFC1 // Secondary surface #D8CFC1
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

        // Natural grounding contact shadow under vanity foot stretcher
        const legShadow = new THREE.Mesh(
          new THREE.PlaneGeometry(0.20, tableDepth + 0.12),
          new THREE.MeshBasicMaterial({
            map: this.textures.boxContactShadow,
            transparent: true,
            opacity: 0.78,
            depthWrite: false
          })
        );
        legShadow.rotation.x = -Math.PI / 2;
        legShadow.position.set(lx, 0.003, lz);
        vanityGroup.add(legShadow);
      });

      // Overall architectural ambient contact shadow under vanity table structure
      const tableAmbientShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(tableWidth + 0.22, tableDepth + 0.16),
        new THREE.MeshBasicMaterial({
          map: this.textures.boxContactShadow,
          transparent: true,
          opacity: 0.52,
          depthWrite: false
        })
      );
      tableAmbientShadow.rotation.x = -Math.PI / 2;
      tableAmbientShadow.position.set(0, 0.002, 0);
      vanityGroup.add(tableAmbientShadow);

      // 2. Large Arched Capsule Mirror with Filled Half-Circle & Illuminated Perimeter LED Light Strip
      const mirrorWidth = 0.58;
      const mirrorRadius = mirrorWidth / 2; // 0.29m
      const straightHeight = 0.82; // Height of the rectangular lower portion
      const mirrorBaseY = tableHeight + 0.0275; // Sits directly atop the table marble slab (y ≈ 0.808m)
      const mirrorZ = -tableDepth / 2 + 0.035;

      // Refined Satin Champagne Metal (Never turns black/dark under showroom lighting)
      const mirrorFrameMat = new THREE.MeshStandardMaterial({
        color: 0xE6D5B4, // Soft luminous satin champagne gold
        roughness: 0.44,
        metalness: 0.24
      });

      // 2A. Continuous Arched Backplate with Deep Architectural Bevel & Ambient Drop Shadow
      const backplateShape = new THREE.Shape();
      backplateShape.moveTo(-mirrorRadius, 0);
      backplateShape.lineTo(mirrorRadius, 0);
      backplateShape.lineTo(mirrorRadius, straightHeight);
      backplateShape.absarc(0, straightHeight, mirrorRadius, 0, Math.PI, false);
      backplateShape.lineTo(-mirrorRadius, straightHeight);
      backplateShape.closePath();

      // Dimensional Wall Drop Shadow (Casts soft directional occlusion onto the alcove plaster behind mirror)
      const mirrorWallShadowGeo = new THREE.ShapeGeometry(backplateShape, 24);
      const mirrorWallShadow = new THREE.Mesh(
        mirrorWallShadowGeo,
        new THREE.MeshBasicMaterial({
          color: 0x18120B,
          transparent: true,
          opacity: 0.30,
          depthWrite: false
        })
      );
      mirrorWallShadow.scale.set(1.05, 1.035, 1.0);
      mirrorWallShadow.position.set(0.016, mirrorBaseY - 0.014, mirrorZ - 0.024);
      vanityGroup.add(mirrorWallShadow);

      // Soft Warm LED Rear Backlight Wash (Radiates warm luminous aura onto the wall behind mirror)
      const mirrorBackGlow = new THREE.PointLight(0xFFCF88, 0.85, 2.4);
      mirrorBackGlow.position.set(0, mirrorBaseY + straightHeight * 0.55, mirrorZ - 0.035);
      vanityGroup.add(mirrorBackGlow);

      // Refined Architectural Backplate (Mounted behind the mirror glass)
      const backplateGeo = new THREE.ExtrudeGeometry(backplateShape, {
        depth: 0.014,
        bevelEnabled: false
      });
      const mirrorBackplate = new THREE.Mesh(backplateGeo, mirrorFrameMat);
      mirrorBackplate.position.set(0, mirrorBaseY, mirrorZ);
      mirrorBackplate.castShadow = true;
      mirrorBackplate.receiveShadow = true;
      vanityGroup.add(mirrorBackplate);

      // 2B. Arched Mirror Glass Surface (Completely fills both rectangle & upper semi-circle dome)
      const glassInset = 0.007; // 7mm champagne bezel margin
      const glassR = mirrorRadius - glassInset;
      const glassStraightH = straightHeight;
      const glassShape = new THREE.Shape();
      glassShape.moveTo(-glassR, glassInset);
      glassShape.lineTo(glassR, glassInset);
      glassShape.lineTo(glassR, glassStraightH);
      glassShape.absarc(0, glassStraightH, glassR, 0, Math.PI, false);
      glassShape.lineTo(-glassR, glassStraightH);
      glassShape.closePath();

      const glassGeo = new THREE.ShapeGeometry(glassShape, 36);

      // Compute normalized [0, 1] UVs across the entire arched shape so live reflection maps seamlessly
      if (glassGeo.computeBoundingBox) {
        glassGeo.computeBoundingBox();
        const gBBox = glassGeo.boundingBox || { min: { x: -glassR, y: glassInset }, max: { x: glassR, y: glassStraightH + glassR } };
        const gWidth = Math.max(0.001, gBBox.max.x - gBBox.min.x);
        const gHeight = Math.max(0.001, gBBox.max.y - gBBox.min.y);
        const posAttr = glassGeo.attributes ? glassGeo.attributes.position : null;
        if (posAttr && posAttr.count) {
          const uvs = new Float32Array(posAttr.count * 2);
          for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            uvs[i * 2] = (x - gBBox.min.x) / gWidth;
            uvs[i * 2 + 1] = (y - gBBox.min.y) / gHeight;
          }
          if (THREE.BufferAttribute) {
            glassGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
          }
        }
      }

      const fallbackGlassMat = new THREE.MeshStandardMaterial({
        color: 0xF2ECE2,
        roughness: 0.06,
        metalness: 0.94
      });
      this.mirrorGlassMesh = new THREE.Mesh(glassGeo, fallbackGlassMat);
      this.mirrorGlassMesh.position.set(0, mirrorBaseY, mirrorZ + 0.017); // In front of backplate for unobstructed reflection
      vanityGroup.add(this.mirrorGlassMesh);

      // 2C. Glowing Perimeter LED Light Strip (Framing top arched half-circle, sides & base)
      const stripRadius = 0.0095; // Defined continuous luminous warm LED ribbon
      const stripZ = mirrorZ + 0.0175; // Flush along the perimeter of the mirror glass
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xFFF8E7 }); // Warm white luminous core
      const haloAuraMat = new THREE.MeshBasicMaterial({
        color: 0xFFE0B2,
        transparent: true,
        opacity: 0.65
      });

      // Top Semi-Circle Arch Light Strip (Half Torus lying in XY plane, curving over the top half of circle)
      const archStripGeo = new THREE.TorusGeometry(mirrorRadius, stripRadius, 16, 48, Math.PI);
      const archStrip = new THREE.Mesh(archStripGeo, haloMat);
      archStrip.position.set(0, mirrorBaseY + straightHeight, stripZ);
      vanityGroup.add(archStrip);

      // Top Arch Soft Ambient Halo Glow
      const archAuraGeo = new THREE.TorusGeometry(mirrorRadius, stripRadius * 1.9, 16, 48, Math.PI);
      const archAura = new THREE.Mesh(archAuraGeo, haloAuraMat);
      archAura.position.set(0, mirrorBaseY + straightHeight, stripZ - 0.002);
      vanityGroup.add(archAura);

      // Left & Right Vertical Side Light Strips (Extending down both sides to the vanity countertop)
      [-1, 1].forEach((side) => {
        const sideStripGeo = new THREE.CylinderGeometry(stripRadius, stripRadius, straightHeight, 16);
        const sideStrip = new THREE.Mesh(sideStripGeo, haloMat);
        sideStrip.position.set(side * mirrorRadius, mirrorBaseY + straightHeight / 2, stripZ);
        vanityGroup.add(sideStrip);

        // Soft Halo Aura behind side strips
        const sideAuraGeo = new THREE.CylinderGeometry(stripRadius * 1.9, stripRadius * 1.9, straightHeight, 16);
        const sideAura = new THREE.Mesh(sideAuraGeo, haloAuraMat);
        sideAura.position.set(side * mirrorRadius, mirrorBaseY + straightHeight / 2, stripZ - 0.002);
        vanityGroup.add(sideAura);

        // Seamless corner elbow spheres connecting straight sides to the top arch and base
        const topCorner = new THREE.Mesh(new THREE.SphereGeometry(stripRadius, 16, 16), haloMat);
        topCorner.position.set(side * mirrorRadius, mirrorBaseY + straightHeight, stripZ);
        vanityGroup.add(topCorner);

        const bottomCorner = new THREE.Mesh(new THREE.SphereGeometry(stripRadius, 16, 16), haloMat);
        bottomCorner.position.set(side * mirrorRadius, mirrorBaseY, stripZ);
        vanityGroup.add(bottomCorner);
      });

      // Bottom Horizontal Light Strip across the tabletop base
      const bottomStrip = new THREE.Mesh(
        new THREE.CylinderGeometry(stripRadius, stripRadius, mirrorWidth, 16),
        haloMat
      );
      bottomStrip.rotation.z = Math.PI / 2;
      bottomStrip.position.set(0, mirrorBaseY, stripZ);
      vanityGroup.add(bottomStrip);

      // Warm Soft Vanity Ambient Glow
      const mirrorLight = new THREE.PointLight(0xFFA834, 1.25, 2.8);
      mirrorLight.position.set(0, mirrorBaseY + straightHeight / 2 + 0.15, 0.18);
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

      // Soft contact shadow grounding accessories on marble tabletop
      const tableAccessoryShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.58, 0.22),
        new THREE.MeshBasicMaterial({
          map: this.textures.contactShadow,
          transparent: true,
          opacity: 0.36,
          depthWrite: false
        })
      );
      tableAccessoryShadow.rotation.x = -Math.PI / 2;
      tableAccessoryShadow.position.set(0.12, tableHeight + 0.0285, 0.03);
      vanityGroup.add(tableAccessoryShadow);

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
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.075, 0.028), p1Mat); p1.castShadow = true;
      p1.position.set(0.06, tableHeight + 0.065, 0.04);
      vanityGroup.add(p1);

      const p1Cap = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.020, 0.020), brassMat);
      p1Cap.position.set(0.06, tableHeight + 0.112, 0.04);
      vanityGroup.add(p1Cap);

      // Perfume 2: Rose Translucent Flacon
      const p2Mat = new THREE.MeshStandardMaterial({ color: 0xEAA29B, roughness: 0.15, transparent: true, opacity: 0.82 });
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.082, 16), p2Mat); p2.castShadow = true;
      p2.position.set(0.12, tableHeight + 0.068, 0.04);
      vanityGroup.add(p2);

      const p2Cap = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), brassMat);
      p2Cap.position.set(0.12, tableHeight + 0.116, 0.04);
      vanityGroup.add(p2Cap);

      // Perfume 3: Clear Faceted Bottle
      const p3Mat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.08, transparent: true, opacity: 0.78 });
      const p3 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.065, 8), p3Mat); p3.castShadow = true;
      p3.position.set(0.18, tableHeight + 0.060, 0.04);
      vanityGroup.add(p3);

      const p3Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.022, 12), brassMat);
      p3Cap.position.set(0.18, tableHeight + 0.103, 0.04);
      vanityGroup.add(p3Cap);

      // 4. Round Monolithic Bouclé Upholstered Ottoman Stool (#D8CFC1)
      const stoolGroup = new THREE.Group();
      stoolGroup.position.set(0.05, 0, 0.28);

      // Soft natural contact shadow under ottoman stool
      const stoolShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.48),
        new THREE.MeshBasicMaterial({
          map: this.textures.contactShadow,
          transparent: true,
          opacity: 0.40,
          depthWrite: false
        })
      );
      stoolShadow.rotation.x = -Math.PI / 2;
      stoolShadow.position.set(0, 0.002, 0);
      stoolGroup.add(stoolShadow);

      const boucleMat = new THREE.MeshStandardMaterial({
        map: this.textures.boucle,
        color: 0xD8CFC1, // Secondary surface #D8CFC1
        roughness: 0.94,
        metalness: 0.0
      });
      // Monolithic upholstered bouclé cushion resting directly on the floor (no dark base strip)
      const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.40, 32), boucleMat);
      cushion.position.y = 0.20;
      cushion.castShadow = true;
      cushion.receiveShadow = true;
      stoolGroup.add(cushion);

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
        const renderFormat = (typeof THREE.RGBAFormat !== 'undefined') ? THREE.RGBAFormat : THREE.RGBFormat;
        this.mirrorRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
          format: renderFormat,
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
          this.mirrorGlassMesh.material.needsUpdate = true;
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

      // Natural grounding contact shadows tightly calibrated to foot sole footprint (0.09m x 0.20m)
      const footLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(0.09, 0.20),
        new THREE.MeshBasicMaterial({
          map: this.textures.footContactShadow,
          transparent: true,
          opacity: 0.88,
          depthWrite: false
        })
      );
      footLeft.rotation.x = -Math.PI / 2;
      footLeft.position.set(-0.074, 0.003, 0.026);
      this.avatarGroup.add(footLeft);

      const footRight = new THREE.Mesh(
        new THREE.PlaneGeometry(0.09, 0.20),
        new THREE.MeshBasicMaterial({
          map: this.textures.footContactShadow,
          transparent: true,
          opacity: 0.88,
          depthWrite: false
        })
      );
      footRight.rotation.x = -Math.PI / 2;
      footRight.position.set(0.078, 0.003, 0.026);
      this.avatarGroup.add(footRight);

      // Subtle, soft directional ambient occlusion wash connecting and grounding both feet
      const footAmbient = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34, 0.26),
        new THREE.MeshBasicMaterial({
          map: this.textures.contactShadow,
          transparent: true,
          opacity: 0.40,
          depthWrite: false
        })
      );
      footAmbient.rotation.x = -Math.PI / 2;
      footAmbient.position.set(0.015, 0.002, 0.020);
      this.avatarGroup.add(footAmbient);

      // Group containing refined anatomical sculpt (active immediately)
      this.proceduralAvatarGroup = new THREE.Group();
      this.avatarGroup.add(this.proceduralAvatarGroup);

      // Materials
      this.avatarSkinMat = new THREE.MeshStandardMaterial({
        color: 0xD7AC93, // PR #9 calibrated body tone (warm natural skin tone)
        roughness: 0.46,
        metalness: 0.01
      });
      const skinMat = this.avatarSkinMat;
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

      // 1. Ribbed Rustic Linen Oatmeal Ecru Tank Top (Rich Contrast Oatmeal #D5C5AC)
      const tankGroup = new THREE.Group();
      const tankMat = new THREE.MeshStandardMaterial({
        map: this.textures.linen,
        bumpMap: this.textures.linenBump,
        bumpScale: 0.020,
        color: 0xF2ECE0, // Luminous natural ivory linen weave (calibrated for crisp tripartite contrast)
        roughness: 0.88, // Tactile matte linen weave
        metalness: 0.0
      });
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.124, 0.106, 0.25, 32), tankMat);
      tank.position.set(0, 1.22, 0);
      tank.castShadow = true;
      tankGroup.add(tank);

      // Fine Vertical Rib Texturing with distinct chiaroscuro shadow definition
      const ribMat = new THREE.MeshStandardMaterial({ color: 0xD0C2AE, roughness: 0.84 });
      for (let r = 0; r < 16; r++) {
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.0030, 0.0030, 0.24, 6), ribMat);
        const angle = (r * Math.PI * 2) / 16;
        rib.position.set(Math.sin(angle) * 0.116, 1.22, Math.cos(angle) * 0.116);
        tankGroup.add(rib);
      }

      // Sartorial Edge Piping (Defines clothing silhouette cleanly against bright backdrop)
      const pipingMat = new THREE.MeshStandardMaterial({
        color: 0x9E836A, // Tailored contrast camel-biscuit piping defining garment borders against skin
        roughness: 0.80
      });

      // Scoop neckline collar trim
      const collarTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.065, 0.0042, 8, 24, Math.PI),
        pipingMat
      );
      collarTrim.position.set(0, 1.338, 0.076);
      collarTrim.rotation.x = 0.28;
      tankGroup.add(collarTrim);

      // Armhole contour piping
      [-1, 1].forEach((side) => {
        const armTrim = new THREE.Mesh(
          new THREE.TorusGeometry(0.052, 0.0038, 8, 24),
          pipingMat
        );
        armTrim.rotation.y = Math.PI / 2;
        armTrim.rotation.x = side * 0.14;
        armTrim.position.set(side * 0.122, 1.285, 0);
        tankGroup.add(armTrim);
      });

      // Bottom waist hem piping
      const waistTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.106, 0.0042, 8, 32),
        pipingMat
      );
      waistTrim.rotation.x = Math.PI / 2;
      waistTrim.position.set(0, 1.096, 0);
      tankGroup.add(waistTrim);

      topParent.add(tankGroup);
      this.garmentMeshes.top['tank'] = tankGroup;

      // 2. Cream Cozy Knit Cardigan with Tortoiseshell Buttons (Rich Contrast #D8C8AF)
      const cardiganGroup = new THREE.Group();
      const cardiganMat = new THREE.MeshStandardMaterial({
        map: this.textures.linen,
        bumpMap: this.textures.linenBump,
        bumpScale: 0.022,
        color: 0xD8C8AF, // Warm tactile oatmeal cream
        roughness: 0.90, // High fabric roughness, soft diffuse reflection
        metalness: 0.0
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

      // 1. High-Waisted Tailored Fluid Trousers in Warm Taupe (Rustic Linen Slub)
      const taupeGroup = new THREE.Group();
      const taupeMat = new THREE.MeshStandardMaterial({
        map: this.textures.linen,
        bumpMap: this.textures.linenBump,
        bumpScale: 0.016,
        color: 0x786C58, // Warm earthy taupe
        roughness: 0.94, // Tactile fabric matte diffusion
        metalness: 0.0
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
      const skinMat = this.avatarSkinMat || new THREE.MeshStandardMaterial({ color: 0xD7AC93, roughness: 0.46 });
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
     * Updates avatar body/skin tone dynamically while maintaining contrast against clothing & background
     */
    setAvatarSkinColor(hexColor) {
      if (this.avatarSkinMat) {
        const col = typeof hexColor === 'string' ? parseInt(hexColor.replace('#', '0x'), 16) : hexColor;
        this.avatarSkinMat.color.setHex(col);
        this.avatarSkinMat.needsUpdate = true;
      }
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
