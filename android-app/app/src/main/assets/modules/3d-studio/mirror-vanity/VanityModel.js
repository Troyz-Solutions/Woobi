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

    // B. Bevelled Sculpted Champagne Brass Mirror Frame
    const frameArcGeo = new THREE.TorusGeometry(archR + 0.018, 0.014, 16, 64, Math.PI);
    const frameArc = new THREE.Mesh(frameArcGeo, brassMat);
    frameArc.position.set(0, straightH, 0);
    this.mirrorGroup.add(frameArc);

    const frameSideGeo = new THREE.CylinderGeometry(0.014, 0.014, straightH, 16);
    [-archR - 0.018, archR + 0.018].forEach(fx => {
      const sideFrame = new THREE.Mesh(frameSideGeo, brassMat);
      sideFrame.position.set(fx, straightH / 2, 0);
      this.mirrorGroup.add(sideFrame);
    });

    const frameBottomGeo = new THREE.BoxGeometry((archR + 0.018) * 2 + 0.028, 0.016, 0.028);
    const frameBottom = new THREE.Mesh(frameBottomGeo, brassMat);
    frameBottom.position.set(0, 0.008, 0);
    this.mirrorGroup.add(frameBottom);

    // C. Continuous Warm 3000K LED Radiance Halo Ring
    const haloArcGeo = new THREE.TorusGeometry(archR + 0.006, 0.009, 16, 64, Math.PI);
    const haloArc = new THREE.Mesh(haloArcGeo, ledGlowMat);
    haloArc.position.set(0, straightH, 0.004);
    this.mirrorGroup.add(haloArc);

    const haloSideGeo = new THREE.CylinderGeometry(0.009, 0.009, straightH, 16);
    [-archR - 0.006, archR + 0.006].forEach(hx => {
      const sideHalo = new THREE.Mesh(haloSideGeo, ledGlowMat);
      sideHalo.position.set(hx, straightH / 2, 0.004);
      this.mirrorGroup.add(sideHalo);
    });
    this.disposables.push(frameArcGeo, frameSideGeo, frameBottomGeo, haloArcGeo, haloSideGeo);

    // D. Clean, Unobstructed Grand Arched Mirror Surface per user request (no internal mullion grids, filigree or glass design)

    // F. Tabletop Solid Brass Mounting Brackets with Knurled Thumbscrews
    const bracketGeo = new THREE.BoxGeometry(0.038, 0.048, 0.038);
    const thumbscrewGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.016, 16);
    [-archR - 0.010, archR + 0.010].forEach(bx => {
      const bracket = new THREE.Mesh(bracketGeo, brassMat);
      bracket.position.set(bx, 0.024, 0.012);
      this.mirrorGroup.add(bracket);

      const thumbscrew = new THREE.Mesh(thumbscrewGeo, brassMat);
      thumbscrew.rotation.z = Math.PI / 2;
      thumbscrew.position.set(bx + (bx > 0 ? 0.018 : -0.018), 0.024, 0.012);
      this.mirrorGroup.add(thumbscrew);
    });
    this.disposables.push(bracketGeo, thumbscrewGeo);

    // H. Protective Walnut Backing Panel
    const mirrorBackMat = VanityMaterials.createMirrorBackMaterial(THREE);
    const backRectGeo = new THREE.BoxGeometry(archR * 2 + 0.02, straightH, 0.012);
    const backRect = new THREE.Mesh(backRectGeo, mirrorBackMat);
    backRect.position.set(0, straightH / 2, -0.010);
    this.mirrorGroup.add(backRect);

    const backArcGeo = new THREE.CircleGeometry(archR + 0.01, 64, 0, Math.PI);
    const backArc = new THREE.Mesh(backArcGeo, mirrorBackMat);
    backArc.position.set(0, straightH, -0.010);
    this.mirrorGroup.add(backArc);
    this.disposables.push(mirrorBackMat, backRectGeo, backArcGeo);

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

  setVanityLightsEnabled(enabled) {
    this.lighting.setEnabled(enabled);
  }

  getVanityState() {
    return {
      isGLBLoaded: this.isGLBLoaded,
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
