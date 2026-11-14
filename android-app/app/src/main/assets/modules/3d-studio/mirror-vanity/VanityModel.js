/**
 * Woobi 3D Studio - Vanity Model
 * Encapsulates the Calacatta Gold marble vanity table, champagne-brass framing,
 * illuminated arched mirror, cosmetics tray, floral vase, bouclé ottoman stool,
 * reflection pipeline, and raycast interaction targets.
 */

import { VanityMaterials } from './VanityMaterials.js';
import { VanityAssets } from './VanityAssets.js';
import { VanityLighting } from './VanityLighting.js';
import { MirrorReflection } from './MirrorReflection.js';

export const VANITY_CONFIG = {
  position: { x: 1.60, y: 0, z: -3.30 },
  rotationY: -0.32,
  tableHeight: 0.84,
  tableWidth: 0.98,
  tableDepth: 0.46,
  mirrorRadius: 0.48,
  stoolPosition: { x: 0.12, y: 0, z: 0.42 },
  stoolRadius: 0.25,
  stoolHeight: 0.40
};

export class VanityModel {
  constructor(options = {}) {
    this.config = Object.assign({}, VANITY_CONFIG, options);
    this.group = null;
    this.mirrorGlassMesh = null;
    this.mirrorGroup = null;
    this.interactiveObjects = [];
    this.disposables = [];
    this.lighting = new VanityLighting();
    this.reflection = new MirrorReflection();
    this.isGLBLoaded = false;
    this.isClockGLBLoaded = false;
    this.clockHands = null;
  }

  /**
   * Builds the complete vanity hierarchy and attaches it to the Three.js scene.
   */
  build(scene, textures = {}, THREEInstance = (typeof window !== 'undefined' ? window.THREE : null)) {
    const THREE = THREEInstance;
    if (!THREE || !scene) {
      throw new Error('[VanityModel] THREE or scene missing during vanity build.');
    }

    this.group = new THREE.Group();
    this.group.name = 'woobi_vanity_root';
    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.y = this.config.rotationY;

    const { tableHeight, tableWidth, tableDepth, mirrorRadius } = this.config;

    // Raycastable Bounding Box for Touch / Click
    const hitGeo = new THREE.BoxGeometry(tableWidth + 0.2, 1.8, tableDepth + 0.5);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitGeo, hitMat);
    hitBox.position.set(0, 1.0, 0.1);
    hitBox.userData = { interactiveType: 'vanity', name: 'Arched Vanity & Grooming Mirror' };
    this.group.add(hitBox);
    this.interactiveObjects.push(hitBox);
    this.disposables.push(hitGeo, hitMat);

    // Procedural Vanity Group
    const proceduralGroup = new THREE.Group();
    proceduralGroup.name = 'procedural_vanity';

    const marbleMat = VanityMaterials.createMarbleMaterial(THREE, textures.champagneStone || textures.calacatta, textures.stoneBump);
    const legsMat = VanityMaterials.createLegsMaterial(THREE);
    const brassMat = VanityMaterials.createBrassMaterial(THREE);
    const ledGlowMat = VanityMaterials.createLedGlowMaterial(THREE);
    const glassMat = VanityMaterials.createGlassMaterial(THREE, false);
    const amberGlassMat = VanityMaterials.createGlassMaterial(THREE, true);
    const boucleMat = VanityMaterials.createBoucleMaterial(THREE, textures.wovenRug);
    this.disposables.push(marbleMat, legsMat, brassMat, ledGlowMat, glassMat, amberGlassMat, boucleMat);

    // 1. Polished Calacatta Gold Marble Countertop Table with Cashmere Apron & Brass Reveal
    const topSlabGeo = new THREE.BoxGeometry(tableWidth, 0.065, tableDepth);
    const topSlab = new THREE.Mesh(topSlabGeo, marbleMat);
    topSlab.position.set(0, tableHeight, 0);
    topSlab.castShadow = true;
    topSlab.receiveShadow = true;
    proceduralGroup.add(topSlab);
    this.disposables.push(topSlabGeo);

    // Bevelled Marble Bullnose Lip
    const marbleLipGeo = new THREE.BoxGeometry(tableWidth + 0.02, 0.014, tableDepth + 0.02);
    const marbleLip = new THREE.Mesh(marbleLipGeo, marbleMat);
    marbleLip.position.set(0, tableHeight + 0.025, 0);
    marbleLip.castShadow = true;
    marbleLip.receiveShadow = true;
    proceduralGroup.add(marbleLip);
    this.disposables.push(marbleLipGeo);

    // Cashmere Cream Vanity Apron
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0xEDE7DF,
      roughness: 0.38,
      metalness: 0.04
    });
    const apronGeo = new THREE.BoxGeometry(tableWidth - 0.08, 0.048, tableDepth - 0.06);
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(0, tableHeight - 0.040, 0);
    apron.castShadow = true;
    proceduralGroup.add(apron);
    this.disposables.push(apronMat, apronGeo);

    // Recessed Brushed Champagne Brass Reveal Groove
    const revealGeo = new THREE.BoxGeometry(tableWidth - 0.04, 0.008, tableDepth - 0.03);
    const reveal = new THREE.Mesh(revealGeo, brassMat);
    reveal.position.set(0, tableHeight - 0.016, 0);
    proceduralGroup.add(reveal);
    this.disposables.push(revealGeo);

    // Minimalist Champagne Brass Drawer Knobs
    const knobGeo = new THREE.SphereGeometry(0.010, 16, 16);
    [-0.24, 0.24].forEach(kx => {
      const knob = new THREE.Mesh(knobGeo, brassMat);
      knob.position.set(kx, tableHeight - 0.040, tableDepth / 2 - 0.022);
      proceduralGroup.add(knob);
    });
    this.disposables.push(knobGeo);

    // Architectural Curved Pedestals (Sculptural Champagne Satin Brass Bases)
    const pedestalX = [-(tableWidth / 2 - 0.15), (tableWidth / 2 - 0.15)];
    const pillarHeight = tableHeight - 0.07;
    const pillarGeo = new THREE.CylinderGeometry(0.038, 0.038, pillarHeight, 32);
    const plinthGeo = new THREE.BoxGeometry(0.12, 0.024, tableDepth - 0.12);
    const archRailGeo = new THREE.TorusGeometry(0.11, 0.018, 16, 32, Math.PI);

    pedestalX.forEach(px => {
      // Front and rear cylindrical architectural pillars
      const frontPillar = new THREE.Mesh(pillarGeo, brassMat);
      frontPillar.position.set(px, pillarHeight / 2 + 0.012, tableDepth / 2 - 0.11);
      frontPillar.castShadow = true;
      proceduralGroup.add(frontPillar);

      const rearPillar = new THREE.Mesh(pillarGeo, brassMat);
      rearPillar.position.set(px, pillarHeight / 2 + 0.012, -tableDepth / 2 + 0.11);
      rearPillar.castShadow = true;
      proceduralGroup.add(rearPillar);

      // Curved Connecting Arch Rail
      const archRail = new THREE.Mesh(archRailGeo, brassMat);
      archRail.rotation.y = Math.PI / 2;
      archRail.position.set(px, pillarHeight - 0.04, 0);
      proceduralGroup.add(archRail);

      // Solid Champagne Brass Floor Plinth Foot
      const plinth = new THREE.Mesh(plinthGeo, brassMat);
      plinth.position.set(px, 0.012, 0);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      proceduralGroup.add(plinth);
    });
    this.disposables.push(pillarGeo, plinthGeo, archRailGeo);

    // 2. GRAND ARCHITECTURAL FRENCH ATELIER GROOMING MIRROR
    this.mirrorGroup = new THREE.Group();
    this.mirrorGroup.position.set(0, tableHeight + 0.032, -tableDepth / 2 + 0.045);

    const archR = mirrorRadius || 0.48;
    const straightH = 1.05; // Grand increased mirror height per user request

    // A. Single Unified Seamless Arched Mirror Glass Surface
    let mirrorGlassGeo;
    if (THREE && typeof THREE.ShapeGeometry !== 'undefined' && typeof THREE.Shape !== 'undefined') {
      const shape = new THREE.Shape();
      shape.moveTo(-archR, 0);
      shape.lineTo(archR, 0);
      shape.lineTo(archR, straightH);
      shape.absarc(0, straightH, archR, 0, Math.PI, false);
      shape.lineTo(-archR, 0);
      mirrorGlassGeo = new THREE.ShapeGeometry(shape, 64);

      if (THREE.BufferAttribute && mirrorGlassGeo.attributes && mirrorGlassGeo.attributes.position) {
        const pos = mirrorGlassGeo.attributes.position;
        const uvs = new Float32Array(pos.count * 2);
        const spanX = archR * 2;
        const spanY = straightH + archR;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          uvs[i * 2] = 1.0 - ((x + archR) / spanX); // Optical horizontal mirror reflection flip
          uvs[i * 2 + 1] = y / spanY;
        }
        mirrorGlassGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      }
    } else {
      mirrorGlassGeo = new THREE.CircleGeometry(archR, 64);
    }

    const mirrorMat = VanityMaterials.createMirrorMaterial(THREE);
    this.mirrorGlassMesh = new THREE.Mesh(mirrorGlassGeo, mirrorMat);
    this.mirrorGlassMesh.position.set(0, 0, 0.002);
    this.mirrorGlassMesh.userData = { forcePlanarUV: true };
    this.mirrorGroup.add(this.mirrorGlassMesh);
    this.disposables.push(mirrorGlassGeo, mirrorMat);

    // B. Architectural French Atelier Sculpted Champagne Brass Mirror Frame
    const polishedGoldMat = (typeof VanityMaterials.createPolishedGoldMaterial === 'function')
      ? VanityMaterials.createPolishedGoldMaterial(THREE)
      : brassMat;

    const frameOuterR = archR + 0.034; // Generous 34mm luxurious rim face
    const frameDepth = 0.038; // 38mm deep architectural casing

    if (THREE && typeof THREE.ExtrudeGeometry !== 'undefined' && typeof THREE.Shape !== 'undefined') {
      // 1. Seamless Monolithic Primary Beveled Frame Chassis
      const frameShape = new THREE.Shape();
      frameShape.moveTo(-frameOuterR, 0);
      frameShape.lineTo(frameOuterR, 0);
      frameShape.lineTo(frameOuterR, straightH);
      frameShape.absarc(0, straightH, frameOuterR, 0, Math.PI, false);
      frameShape.lineTo(-frameOuterR, 0);

      const frameHole = new THREE.Path();
      frameHole.moveTo(-archR, 0);
      frameHole.lineTo(archR, 0);
      frameHole.lineTo(archR, straightH);
      frameHole.absarc(0, straightH, archR, 0, Math.PI, false);
      frameHole.lineTo(-archR, 0);
      frameShape.holes.push(frameHole);

      const frameExtrudeSettings = {
        depth: frameDepth,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.007,
        bevelThickness: 0.007
      };
      const mainFrameGeo = new THREE.ExtrudeGeometry(frameShape, frameExtrudeSettings);
      const mainFrame = new THREE.Mesh(mainFrameGeo, brassMat);
      mainFrame.position.set(0, 0, -frameDepth / 2);
      mainFrame.castShadow = true;
      this.mirrorGroup.add(mainFrame);
      this.disposables.push(mainFrameGeo);

      // 2. Secondary Jewelers Stepped Bezel (Inner Specular Brass Step)
      const bezelOuterR = archR + 0.010;
      const bezelShape = new THREE.Shape();
      bezelShape.moveTo(-bezelOuterR, 0);
      bezelShape.lineTo(bezelOuterR, 0);
      bezelShape.lineTo(bezelOuterR, straightH);
      bezelShape.absarc(0, straightH, bezelOuterR, 0, Math.PI, false);
      bezelShape.lineTo(-bezelOuterR, 0);

      const bezelHole = new THREE.Path();
      bezelHole.moveTo(-archR, 0);
      bezelHole.lineTo(archR, 0);
      bezelHole.lineTo(archR, straightH);
      bezelHole.absarc(0, straightH, archR, 0, Math.PI, false);
      bezelHole.lineTo(-archR, 0);
      bezelShape.holes.push(bezelHole);

      const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
        depth: 0.014,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.002,
        bevelThickness: 0.002
      });
      const bezelMesh = new THREE.Mesh(bezelGeo, polishedGoldMat);
      bezelMesh.position.set(0, 0, 0.004);
      this.mirrorGroup.add(bezelMesh);
      this.disposables.push(bezelGeo);

    } else {
      // Mock / Low-overhead Fallback for headless tests
      const frameArcGeo = new THREE.TorusGeometry(frameOuterR - 0.012, 0.016, 16, 64, Math.PI);
      const frameArc = new THREE.Mesh(frameArcGeo, brassMat);
      frameArc.position.set(0, straightH, 0);
      this.mirrorGroup.add(frameArc);

      const frameSideGeo = new THREE.CylinderGeometry(0.016, 0.016, straightH, 16);
      [-archR - 0.018, archR + 0.018].forEach(fx => {
        const sideFrame = new THREE.Mesh(frameSideGeo, brassMat);
        sideFrame.position.set(fx, straightH / 2, 0);
        this.mirrorGroup.add(sideFrame);
      });

      const frameBottomGeo = new THREE.BoxGeometry((frameOuterR + 0.02) * 2, 0.024, 0.042);
      const frameBottom = new THREE.Mesh(frameBottomGeo, brassMat);
      frameBottom.position.set(0, 0.012, 0);
      this.mirrorGroup.add(frameBottom);
      this.disposables.push(frameArcGeo, frameSideGeo, frameBottomGeo);
    }

    // 3. Grounding Base Threshold Rail (Flush on Calacatta Marble Console)
    const baseRailGeo = new THREE.BoxGeometry((frameOuterR + 0.022) * 2, 0.022, frameDepth + 0.018);
    const baseRail = new THREE.Mesh(baseRailGeo, brassMat);
    baseRail.position.set(0, 0.011, 0.004);
    baseRail.castShadow = true;
    this.mirrorGroup.add(baseRail);
    this.disposables.push(baseRailGeo);

    // 4. Parisian Architectural Apex Crown Crest (Exterior Frame Ornament - Strictly Above Arch, Never on Glass)
    const crestGroup = new THREE.Group();
    crestGroup.position.set(0, straightH + frameOuterR + 0.004, 0.006);

    const crestPedestalGeo = new THREE.BoxGeometry(0.096, 0.020, 0.026);
    const crestPedestal = new THREE.Mesh(crestPedestalGeo, brassMat);
    crestPedestal.castShadow = true;
    crestGroup.add(crestPedestal);

    // Flanked Classical Acanthus Scroll Curls
    [-0.046, 0.046].forEach((cx, idx) => {
      const scrollGeo = new THREE.TorusGeometry(0.022, 0.005, 12, 24, Math.PI * 0.9);
      const scroll = new THREE.Mesh(scrollGeo, polishedGoldMat);
      scroll.position.set(cx, 0.012, 0);
      scroll.rotation.z = idx === 0 ? Math.PI / 4 : -Math.PI / 4;
      crestGroup.add(scroll);
      this.disposables.push(scrollGeo);
    });

    // Central Imperial Artichoke Finial Orb & Spire
    const finialCollarGeo = new THREE.CylinderGeometry(0.010, 0.014, 0.008, 16);
    const finialCollar = new THREE.Mesh(finialCollarGeo, polishedGoldMat);
    finialCollar.position.set(0, 0.014, 0);
    crestGroup.add(finialCollar);

    const finialOrbGeo = new THREE.SphereGeometry(0.018, 20, 20);
    const finialOrb = new THREE.Mesh(finialOrbGeo, polishedGoldMat);
    finialOrb.position.set(0, 0.034, 0);
    crestGroup.add(finialOrb);

    const finialSpireGeo = (typeof THREE.ConeGeometry !== 'undefined')
      ? new THREE.ConeGeometry(0.008, 0.022, 16)
      : new THREE.CylinderGeometry(0.002, 0.008, 0.022, 16);
    const finialSpire = new THREE.Mesh(finialSpireGeo, polishedGoldMat);
    finialSpire.position.set(0, 0.056, 0);
    crestGroup.add(finialSpire);

    this.mirrorGroup.add(crestGroup);
    this.disposables.push(crestPedestalGeo, finialCollarGeo, finialOrbGeo, finialSpireGeo);

    // C. Continuous Warm 3000K LED Radiance Halo Ring (Recessed Behind Frame Perimeter)
    const haloArcGeo = new THREE.TorusGeometry(frameOuterR + 0.002, 0.008, 16, 64, Math.PI);
    const haloArc = new THREE.Mesh(haloArcGeo, ledGlowMat);
    haloArc.position.set(0, straightH, -0.016);
    this.mirrorGroup.add(haloArc);

    const haloSideGeo = new THREE.CylinderGeometry(0.008, 0.008, straightH, 16);
    [-frameOuterR - 0.002, frameOuterR + 0.002].forEach(hx => {
      const sideHalo = new THREE.Mesh(haloSideGeo, ledGlowMat);
      sideHalo.position.set(hx, straightH / 2, -0.016);
      this.mirrorGroup.add(sideHalo);
    });
    this.disposables.push(haloArcGeo, haloSideGeo);

    // D. Clean, Unobstructed Grand Arched Mirror Surface per user request (no internal mullion grids, filigree or glass design)

    // F. Tabletop Solid Brass Pedestal Clamps with Knurled Thumbscrews
    const clampBaseGeo = new THREE.BoxGeometry(0.046, 0.042, 0.052);
    const clampScrewGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.018, 20);
    [-frameOuterR - 0.008, frameOuterR + 0.008].forEach(bx => {
      const bracket = new THREE.Mesh(clampBaseGeo, brassMat);
      bracket.position.set(bx, 0.021, 0.014);
      bracket.castShadow = true;
      this.mirrorGroup.add(bracket);

      const thumbscrew = new THREE.Mesh(clampScrewGeo, polishedGoldMat);
      thumbscrew.rotation.z = Math.PI / 2;
      thumbscrew.position.set(bx + (bx > 0 ? 0.022 : -0.022), 0.021, 0.014);
      this.mirrorGroup.add(thumbscrew);
    });
    this.disposables.push(clampBaseGeo, clampScrewGeo);

    // H. Protective Walnut Backing Panel
    const mirrorBackMat = VanityMaterials.createMirrorBackMaterial(THREE);
    const backRectGeo = new THREE.BoxGeometry(frameOuterR * 2 + 0.01, straightH, 0.014);
    const backRect = new THREE.Mesh(backRectGeo, mirrorBackMat);
    backRect.position.set(0, straightH / 2, -frameDepth / 2 - 0.004);
    this.mirrorGroup.add(backRect);

    const backArcGeo = new THREE.CircleGeometry(frameOuterR + 0.005, 64, 0, Math.PI);
    const backArc = new THREE.Mesh(backArcGeo, mirrorBackMat);
    backArc.position.set(0, straightH, -frameDepth / 2 - 0.004);
    this.mirrorGroup.add(backArc);
    this.disposables.push(mirrorBackMat, backRectGeo, backArcGeo);

    // I. Classic Parisian Horlogerie Wall Clock Mounted Above the Grooming Mirror
    const clockGroup = this.buildClassicWallClock(THREE, straightH, frameOuterR, brassMat, polishedGoldMat);
    this.mirrorGroup.add(clockGroup);

    // Initialize Vanity Radiance Lighting
    this.lighting.init(THREE, this.mirrorGroup);

    // Initialize Mirror Reflection Pipeline
    this.reflection.init(THREE, scene, this.mirrorGlassMesh);

    proceduralGroup.add(this.mirrorGroup);

    // 3. TABLETOP LUXURY COSMETICS & FLORAL ARRANGEMENT
    const perfumeGroup = new THREE.Group();
    perfumeGroup.position.set(0.24, tableHeight + 0.035, 0.05);

    // Perfume 1: Tall Faceted Flacon
    const p1Geo = new THREE.BoxGeometry(0.044, 0.080, 0.044);
    const p1 = new THREE.Mesh(p1Geo, glassMat);
    p1.position.set(0, 0.040, 0);
    perfumeGroup.add(p1);
    const p1CapGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.024, 16);
    const p1Cap = new THREE.Mesh(p1CapGeo, brassMat);
    p1Cap.position.set(0, 0.092, 0);
    perfumeGroup.add(p1Cap);
    this.disposables.push(p1Geo, p1CapGeo);

    // Perfume 2: Round Amber Bottle
    const p2Geo = new THREE.CylinderGeometry(0.024, 0.024, 0.065, 16);
    const p2 = new THREE.Mesh(p2Geo, amberGlassMat);
    p2.position.set(0.065, 0.032, 0.02);
    perfumeGroup.add(p2);
    const p2CapGeo = new THREE.SphereGeometry(0.012, 12, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1A1816 });
    const p2Cap = new THREE.Mesh(p2CapGeo, capMat);
    p2Cap.position.set(0.065, 0.070, 0.02);
    perfumeGroup.add(p2Cap);
    this.disposables.push(p2Geo, p2CapGeo, capMat);

    proceduralGroup.add(perfumeGroup);

    // Ceramic Makeup Brush Holder & Brushes
    const brushHolderGeo = new THREE.CylinderGeometry(0.028, 0.024, 0.075, 16);
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x2A2622, roughness: 0.40 });
    const brushHolder = new THREE.Mesh(brushHolderGeo, ceramicMat);
    brushHolder.position.set(0.12, tableHeight + 0.070, 0.08);
    proceduralGroup.add(brushHolder);
    this.disposables.push(brushHolderGeo, ceramicMat);

    const brushGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.11, 8);
    for (let b = 0; b < 4; b++) {
      const brush = new THREE.Mesh(brushGeo, brassMat);
      brush.rotation.set(0.12 * Math.sin(b * 1.5), 0, 0.12 * Math.cos(b * 1.5));
      brush.position.set(0.12 + Math.sin(b) * 0.008, tableHeight + 0.11, 0.08 + Math.cos(b) * 0.008);
      proceduralGroup.add(brush);
    }
    this.disposables.push(brushGeo);

    // Clear Glass Vase with Delicate White Baby's Breath Flowers
    const vaseGroup = new THREE.Group();
    vaseGroup.position.set(-0.28, tableHeight + 0.035, 0.04);
    const vaseGeo = new THREE.CylinderGeometry(0.038, 0.028, 0.15, 20);
    const vase = new THREE.Mesh(vaseGeo, glassMat);
    vase.position.y = 0.075;
    vaseGroup.add(vase);
    this.disposables.push(vaseGeo);

    const stemGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.24, 8);
    const blossomGeo = new THREE.SphereGeometry(0.008, 6, 6);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x485840, roughness: 0.65 });
    const bloomMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.85 });
    this.disposables.push(stemGeo, blossomGeo, stemMat, bloomMat);

    for (let s = 0; s < 6; s++) {
      const stem = new THREE.Mesh(stemGeo, stemMat);
      const ang = s * 1.05;
      stem.rotation.set(0.18 * Math.cos(ang), 0, 0.18 * Math.sin(ang));
      stem.position.set(Math.cos(ang) * 0.015, 0.16, Math.sin(ang) * 0.015);
      vaseGroup.add(stem);

      for (let fl = 0; fl < 4; fl++) {
        const blossom = new THREE.Mesh(blossomGeo, bloomMat);
        blossom.position.set(
          Math.cos(ang) * 0.04 + (fl - 2) * 0.015,
          0.26 + fl * 0.018,
          Math.sin(ang) * 0.04 + (fl % 2 === 0 ? 0.01 : -0.01)
        );
        vaseGroup.add(blossom);
      }
    }
    proceduralGroup.add(vaseGroup);

    // 4. ROUND CREAM BOUCLÉ UPHOLSTERED OTTOMAN STOOL WITH BRASS BASE
    // Cushion beneath the table removed per user request: "remove the cussion benath the table"
    if (this.config.showStool) {
      const stoolGroup = new THREE.Group();
      stoolGroup.position.set(this.config.stoolPosition.x, this.config.stoolPosition.y, this.config.stoolPosition.z);

      const stoolPlinthGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 36);
      const stoolPlinth = new THREE.Mesh(stoolPlinthGeo, brassMat);
      stoolPlinth.position.y = 0.025;
      stoolPlinth.castShadow = true;
      stoolGroup.add(stoolPlinth);
      this.disposables.push(stoolPlinthGeo);

      const stoolBodyGeo = new THREE.CylinderGeometry(0.245, 0.238, 0.33, 36);
      const stoolBody = new THREE.Mesh(stoolBodyGeo, boucleMat);
      stoolBody.position.y = 0.215;
      stoolBody.castShadow = true;
      stoolGroup.add(stoolBody);
      this.disposables.push(stoolBodyGeo);

      const stoolCushionGeo = new THREE.CylinderGeometry(this.config.stoolRadius, 0.245, 0.07, 36);
      const cushionMat = new THREE.MeshStandardMaterial({
        color: 0xF8F4EE,
        roughness: 0.82,
        metalness: 0.02
      });
      const stoolCushion = new THREE.Mesh(stoolCushionGeo, cushionMat);
      stoolCushion.position.y = 0.415;
      stoolCushion.castShadow = true;
      stoolGroup.add(stoolCushion);
      this.disposables.push(stoolCushionGeo, cushionMat);

      proceduralGroup.add(stoolGroup);
    }

    this.group.add(proceduralGroup);

    // 5. Authentic Model Loading / Luxury Procedural Selection
    if (this.config.preferProcedural) {
      this.isGLBLoaded = false;
      proceduralGroup.visible = true;
      scene.add(this.group);
      return this.group;
    }

    VanityAssets.loadVanityGLB(
      THREE,
      (model) => {
        model.name = 'woobi_vanity_glb';
        model.traverse((child) => {
          if (child.isMesh && (child.name === 'Mirror_Surface' || child.name.toLowerCase().includes('mirror_surface'))) {
            this.mirrorGlassMesh = child;
          }
        });
        this.group.add(model);
        this.isGLBLoaded = true;
        proceduralGroup.visible = false;

        // Traverse GLB and bind mirror reflection & LED glow
        model.traverse((child) => {
          if (child.isMesh) {
            if (child.name === 'Mirror_Surface' || child.name.includes('Mirror_Surface')) {
              this.mirrorGlassMesh = child;
              if (this.reflection) {
                this.reflection.bindMirrorMesh(child, THREE);
              }
            } else if (child.name === 'Mirror_LED_Strip') {
              child.material = VanityMaterials.createLedGlowMaterial(THREE);
            } else if (child.name === 'Mirror_Frame') {
              child.material = VanityMaterials.createBrassMaterial(THREE);
            } else if (child.name === 'Vanity_Marble_Top' || child.name === 'Vanity_Cosmetic_Tray_Base' || child.name.includes('Marble')) {
              // Generate planar UVs for horizontal tabletop geometry if missing (seren_vanity.glb has no UV attributes)
              if (child.geometry && !child.geometry.attributes?.uv && child.geometry.attributes?.position && typeof THREE.BufferAttribute !== 'undefined') {
                const pos = child.geometry.attributes.position;
                if (typeof child.geometry.computeBoundingBox === 'function') {
                  child.geometry.computeBoundingBox();
                }
                const bb = child.geometry.boundingBox;
                const minX = bb ? bb.min.x : -0.675;
                const maxX = bb ? bb.max.x : 0.675;
                const minZ = bb ? bb.min.z : -0.240;
                const maxZ = bb ? bb.max.z : 0.240;
                const spanX = (maxX - minX) || 1.35;
                const spanZ = (maxZ - minZ) || 0.48;

                const uvs = new Float32Array(pos.count * 2);
                for (let i = 0; i < pos.count; i++) {
                  const x = pos.getX(i);
                  const z = pos.getZ(i);
                  uvs[i * 2] = (x - minX) / spanX;
                  uvs[i * 2 + 1] = (z - minZ) / spanZ;
                }
                child.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
              }
              child.material = VanityMaterials.createMarbleMaterial(THREE, textures.champagneStone || textures.calacatta, textures.stoneBump);
            } else if (child.name.includes('Vanity_Leg') || child.name.includes('Vanity_Top_Rail') || child.name.includes('Vanity_Tray_Rim') || child.name.includes('Vanity_Drawer_Seam')) {
              child.material = VanityMaterials.createLegsMaterial(THREE);
            } else if (child.name.toLowerCase().includes('stool') || child.name.toLowerCase().includes('bench') || child.name.toLowerCase().includes('cushion') || child.name.toLowerCase().includes('ottoman')) {
              // Stool / Cushion removed per user request: "remove the cussion benath the table"
              child.visible = false;
            }
          }
        });
      },
      () => {
        this.isGLBLoaded = false;
      }
    );

    scene.add(this.group);
    return this.group;
  }

  /**
   * Builds an authentic classic Parisian horlogerie wall clock mounted directly above the grooming mirror.
   */
  buildClassicWallClock(THREE, straightH, frameOuterR, brassMat, polishedGoldMat) {
    const clockGroup = new THREE.Group();
    clockGroup.name = 'vanity_classic_wall_clock';
    // Positioned gracefully centered directly above the arched mirror frame
    const clockCenterY = straightH + frameOuterR + 0.34;
    clockGroup.position.set(0, clockCenterY, -0.015);

    const proceduralClockGroup = new THREE.Group();
    proceduralClockGroup.name = 'procedural_clock_group';
    clockGroup.add(proceduralClockGroup);

    const clockR = 0.22; // 44cm diameter classic station wall clock

    // 1. Deep Antique Dark Walnut Wooden Outer Casing
    const casingGeo = new THREE.CylinderGeometry(clockR + 0.018, clockR + 0.018, 0.042, 48);
    const casingMat = VanityMaterials.createMirrorBackMaterial(THREE);
    const casing = new THREE.Mesh(casingGeo, casingMat);
    casing.rotation.x = Math.PI / 2;
    casing.position.set(0, 0, -0.012);
    casing.castShadow = true;
    proceduralClockGroup.add(casing);
    this.disposables.push(casingGeo, casingMat);

    // 2. Stepped Beveled Champagne Brass Outer Bezel Ring
    const outerBezelGeo = new THREE.TorusGeometry(clockR + 0.008, 0.014, 16, 64);
    const outerBezel = new THREE.Mesh(outerBezelGeo, brassMat);
    outerBezel.position.set(0, 0, 0.006);
    outerBezel.castShadow = true;
    proceduralClockGroup.add(outerBezel);
    this.disposables.push(outerBezelGeo);

    // 3. Inner Polished Gilded Bezel Ring
    const innerBezelGeo = new THREE.TorusGeometry(clockR - 0.016, 0.008, 16, 64);
    const innerBezel = new THREE.Mesh(innerBezelGeo, polishedGoldMat);
    innerBezel.position.set(0, 0, 0.012);
    proceduralClockGroup.add(innerBezel);
    this.disposables.push(innerBezelGeo);

    // 4. Dial Face (Antique Parchment Ivory with Roman Numerals & Railway Ticks)
    const clockDialTexture = this.createClockDialTexture(THREE);
    const dialMat = new THREE.MeshStandardMaterial({
      map: clockDialTexture,
      color: clockDialTexture ? 0xFFFFFF : 0xF7F4EB,
      roughness: 0.32,
      metalness: 0.02
    });
    const dialGeo = new THREE.CircleGeometry(clockR - 0.018, 64);
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.position.set(0, 0, 0.014);
    dial.receiveShadow = true;
    proceduralClockGroup.add(dial);
    this.disposables.push(dialGeo, dialMat);
    if (clockDialTexture) this.disposables.push(clockDialTexture);

    // 5. Central Brass Pinion Hub
    const pinionGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.014, 20);
    const pinion = new THREE.Mesh(pinionGeo, polishedGoldMat);
    pinion.rotation.x = Math.PI / 2;
    pinion.position.set(0, 0, 0.026);
    proceduralClockGroup.add(pinion);
    this.disposables.push(pinionGeo);

    // 6. Classical Breguet Blued-Steel Hour & Minute Hands
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x1A1D20, // Antique blued charcoal steel
      roughness: 0.38,
      metalness: 0.82
    });
    this.disposables.push(steelMat);

    // Hour Hand
    const hourHandGroup = new THREE.Group();
    hourHandGroup.position.set(0, 0, 0.020);
    const hourShaftGeo = new THREE.BoxGeometry(0.007, 0.082, 0.003);
    const hourShaft = new THREE.Mesh(hourShaftGeo, steelMat);
    hourShaft.position.set(0, 0.041, 0);
    hourHandGroup.add(hourShaft);

    const hourMoonGeo = new THREE.TorusGeometry(0.012, 0.0025, 8, 20);
    const hourMoon = new THREE.Mesh(hourMoonGeo, steelMat);
    hourMoon.position.set(0, 0.068, 0);
    hourHandGroup.add(hourMoon);

    const hourPointerGeo = (typeof THREE.ConeGeometry !== 'undefined')
      ? new THREE.ConeGeometry(0.0035, 0.016, 8)
      : new THREE.CylinderGeometry(0.001, 0.0035, 0.016, 8);
    const hourPointer = new THREE.Mesh(hourPointerGeo, steelMat);
    hourPointer.position.set(0, 0.088, 0);
    hourHandGroup.add(hourPointer);
    proceduralClockGroup.add(hourHandGroup);
    this.disposables.push(hourShaftGeo, hourMoonGeo, hourPointerGeo);

    // Minute Hand
    const minuteHandGroup = new THREE.Group();
    minuteHandGroup.position.set(0, 0, 0.024);
    const minShaftGeo = new THREE.BoxGeometry(0.005, 0.126, 0.003);
    const minShaft = new THREE.Mesh(minShaftGeo, steelMat);
    minShaft.position.set(0, 0.063, 0);
    minuteHandGroup.add(minShaft);

    const minMoonGeo = new THREE.TorusGeometry(0.009, 0.002, 8, 20);
    const minMoon = new THREE.Mesh(minMoonGeo, steelMat);
    minMoon.position.set(0, 0.114, 0);
    minuteHandGroup.add(minMoon);

    const minPointerGeo = (typeof THREE.ConeGeometry !== 'undefined')
      ? new THREE.ConeGeometry(0.0025, 0.022, 8)
      : new THREE.CylinderGeometry(0.001, 0.0025, 0.022, 8);
    const minPointer = new THREE.Mesh(minPointerGeo, steelMat);
    minPointer.position.set(0, 0.136, 0);
    minuteHandGroup.add(minPointer);
    proceduralClockGroup.add(minuteHandGroup);
    this.disposables.push(minShaftGeo, minMoonGeo, minPointerGeo);

    // Slender Golden Second Hand with Counterweight
    const secondHandGroup = new THREE.Group();
    secondHandGroup.position.set(0, 0, 0.028);
    const secShaftGeo = new THREE.BoxGeometry(0.002, 0.155, 0.002);
    const secShaft = new THREE.Mesh(secShaftGeo, polishedGoldMat);
    secShaft.position.set(0, 0.052, 0);
    secondHandGroup.add(secShaft);

    const secDiscGeo = new THREE.CircleGeometry(0.008, 16);
    const secDisc = new THREE.Mesh(secDiscGeo, polishedGoldMat);
    secDisc.position.set(0, -0.025, 0);
    secondHandGroup.add(secDisc);
    proceduralClockGroup.add(secondHandGroup);
    this.disposables.push(secShaftGeo, secDiscGeo);

    // 7. Protective Convex Glossy Crystal Glass Lens
    const lensGeo = new THREE.CircleGeometry(clockR - 0.014, 48);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.05,
      metalness: 0.10,
      transparent: true,
      opacity: 0.18
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0, 0.032);
    proceduralClockGroup.add(lens);
    this.disposables.push(lensGeo, lensMat);

    // 8. Classical Forged Brass Wall Hanging Loop & Wall Anchor Rosette
    const hangerBaseGeo = new THREE.BoxGeometry(0.038, 0.024, 0.022);
    const hangerBase = new THREE.Mesh(hangerBaseGeo, brassMat);
    hangerBase.position.set(0, clockR + 0.022, 0.004);
    proceduralClockGroup.add(hangerBase);

    const hangerRingGeo = new THREE.TorusGeometry(0.036, 0.006, 16, 32);
    const hangerRing = new THREE.Mesh(hangerRingGeo, polishedGoldMat);
    hangerRing.position.set(0, clockR + 0.056, 0.004);
    proceduralClockGroup.add(hangerRing);

    const rosetteGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.010, 24);
    const rosette = new THREE.Mesh(rosetteGeo, brassMat);
    rosette.rotation.x = Math.PI / 2;
    rosette.position.set(0, clockR + 0.086, -0.006);
    proceduralClockGroup.add(rosette);
    this.disposables.push(hangerBaseGeo, hangerRingGeo, rosetteGeo);

    this.clockHands = {
      hourHand: hourHandGroup,
      minuteHand: minuteHandGroup,
      secondHand: secondHandGroup
    };

    // Initialize to current time immediately
    this.updateClock();

    // Asynchronously load the authentic user-provided 3D Clock model
    VanityAssets.loadClockGLB(
      THREE,
      (clockGLB) => {
        clockGLB.name = 'clock_glb_model';
        const scaleFactor = 0.46 / 34.137;
        clockGLB.scale.set(scaleFactor, scaleFactor, scaleFactor);
        clockGLB.position.set(0, 0, 0.010);

        let glbHourHand = null;
        let glbMinuteHand = null;
        let glbSecondHand = null;

        clockGLB.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = (child.name || '').toLowerCase();
            if (name === 'hour_hand' || name.includes('hour_hand')) {
              glbHourHand = child;
            } else if (name === 'minute_hand' || name.includes('minute_hand')) {
              glbMinuteHand = child;
            } else if (name === 'second_hand' || name.includes('second_hand')) {
              glbSecondHand = child;
            } else if (name.includes('glass')) {
              if (child.material) {
                child.material.transparent = true;
                child.material.opacity = 0.22;
                child.material.roughness = 0.08;
              }
            }
          }
        });

        if (glbHourHand || glbMinuteHand || glbSecondHand) {
          this.clockHands = {
            hourHand: glbHourHand || hourHandGroup,
            minuteHand: glbMinuteHand || minuteHandGroup,
            secondHand: glbSecondHand || secondHandGroup
          };
          this.isClockGLBLoaded = true;
          proceduralClockGroup.visible = false;
          this.updateClock();
        }

        clockGroup.add(clockGLB);
      },
      () => {
        this.isClockGLBLoaded = false;
        proceduralClockGroup.visible = true;
      }
    );

    return clockGroup;
  }

  /**
   * Generates high-definition antique parchment clock dial with Roman numerals and railroad track.
   */
  createClockDialTexture(THREE) {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return null;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const cx = 256;
      const cy = 256;
      const r = 246;

      // Antique Warm Ivory Enamel Face with subtle aged parchment radial gradient
      const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, r);
      grad.addColorStop(0.0, '#FFFDF8');
      grad.addColorStop(0.70, '#F7F3E8');
      grad.addColorStop(1.0, '#ECE4D4');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Outer and Inner Concentric Chapter Rings
      ctx.strokeStyle = '#28221B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 236, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 214, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#7D6955';
      ctx.beginPath();
      ctx.arc(cx, cy, 142, 0, Math.PI * 2);
      ctx.stroke();

      // 60-Minute Railroad Track Ticks
      for (let m = 0; m < 60; m++) {
        const angle = (m * Math.PI) / 30;
        const isHour = (m % 5 === 0);
        const innerDist = isHour ? 214 : 224;
        const outerDist = 236;

        ctx.strokeStyle = isHour ? '#1C1916' : '#6A5C4F';
        ctx.lineWidth = isHour ? 3.5 : 1.5;

        ctx.beginPath();
        ctx.moveTo(cx + Math.sin(angle) * innerDist, cy - Math.cos(angle) * innerDist);
        ctx.lineTo(cx + Math.sin(angle) * outerDist, cy - Math.cos(angle) * outerDist);
        ctx.stroke();

        if (isHour) {
          ctx.fillStyle = '#C89D52';
          ctx.beginPath();
          ctx.arc(cx + Math.sin(angle) * 206, cy - Math.cos(angle) * 206, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Classic Serif Roman Numerals
      const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      ctx.fillStyle = '#1C1916';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 36px "Cinzel", "Playfair Display", "Times New Roman", Georgia, serif';

      for (let h = 0; h < 12; h++) {
        const angle = (h * Math.PI) / 6;
        const textDist = 176;
        const tx = cx + Math.sin(angle) * textDist;
        const ty = cy - Math.cos(angle) * textDist;
        ctx.fillText(romanNumerals[h], tx, ty);
      }

      // Vintage Horology Inscription
      ctx.fillStyle = '#42382E';
      ctx.font = '600 15px "Cinzel", "Times New Roman", Georgia, serif';
      ctx.fillText('S É R È N', cx, cy - 64);

      ctx.fillStyle = '#7A6B5C';
      ctx.font = 'italic 500 11px "Times New Roman", Georgia, serif';
      ctx.fillText('Horlogerie d\'Atelier', cx, cy - 48);

      ctx.fillStyle = '#8C7C6D';
      ctx.font = '500 10px "Times New Roman", Georgia, serif';
      ctx.fillText('PARIS • 1889', cx, cy + 54);

      ctx.fillStyle = '#C89D52';
      ctx.font = '14px serif';
      ctx.fillText('✦', cx, cy + 70);

      if (THREE && typeof THREE.CanvasTexture !== 'undefined') {
        const tex = new THREE.CanvasTexture(canvas);
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        return tex;
      }
    } catch (e) {
      console.warn('[VanityModel] Canvas clock dial fallback active:', e);
    }
    return null;
  }

  /**
   * Updates the clock hands to match real live time.
   */
  updateClock() {
    if (!this.clockHands) return;
    const now = new Date();
    const hrs = (now.getHours() % 12) + now.getMinutes() / 60;
    const mins = now.getMinutes() + now.getSeconds() / 60;
    const secs = now.getSeconds() + now.getMilliseconds() / 1000;

    if (this.clockHands.hourHand) {
      this.clockHands.hourHand.rotation.z = -hrs * (Math.PI / 6);
    }
    if (this.clockHands.minuteHand) {
      this.clockHands.minuteHand.rotation.z = -mins * (Math.PI / 30);
    }
    if (this.clockHands.secondHand) {
      this.clockHands.secondHand.rotation.z = -secs * (Math.PI / 30);
    }
  }

  setVanityLightsEnabled(enabled) {
    this.lighting.setEnabled(enabled);
  }

  getVanityState() {
    return {
      isGLBLoaded: this.isGLBLoaded,
      isClockGLBLoaded: this.isClockGLBLoaded,
      isLightsEnabled: this.lighting.isEnabled,
      hasMirrorReflection: !!this.reflection.renderTarget
    };
  }

  dispose(scene) {
    if (this.group && scene) {
      scene.remove(this.group);
    }
    this.lighting.dispose(this.mirrorGroup);
    this.reflection.dispose();
    this.clockHands = null;
    this.isClockGLBLoaded = false;

    this.disposables.forEach(d => {
      if (d && typeof d.dispose === 'function') {
        d.dispose();
      }
    });
    this.disposables = [];
    this.interactiveObjects = [];
    this.mirrorGlassMesh = null;
    this.mirrorGroup = null;
    this.group = null;
  }
}

export default VanityModel;
