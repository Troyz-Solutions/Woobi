/**
 * Woobi - 3D Studio Avatar Module
 * AvatarRig.js - Anatomical Bone & Mesh Hierarchy, Head/Chest Groups, Eyelids, and Hairstyles
 */

import { AVATAR_PALETTE } from './AvatarMaterials.js';

export class AvatarRig {
  constructor(materials, THREE = window.THREE) {
    this.THREE = THREE;
    this.materials = materials;

    this.root = null;
    this.sculptedAvatarGroup = null;
    this.headGroup = null;
    this.chestGroup = null;
    this.eyelids = [];
    this.hairStyles = {};
    this.activeHairStyle = 'bun';
    this.accessories = {
      earrings: [],
      watch: null,
      glasses: null,
      chain: null,
      ring: null,
      button: null
    };
    this.facialGroomingGroup = null;
    this.glbHairMeshes = null;
    this.isMountedToGLB = false;
    this.beardMeshes = {};
    this.activeBeardStyle = 'clean';
    this.moustacheMeshes = {};
    this.activeMoustacheStyle = 'none';
    this.sideburnMeshes = {};
    this.activeSideburnStyle = 'natural';
    this.eyebrowMeshes = [];
    this.eyelashMeshes = [];
    this.eyeshadowMeshes = [];
    this.nailMeshes = [];
    this.activeNailShapeLeft = 'natural';
    this.activeNailShapeRight = 'natural';
    this.activeNailLengthLeft = 'short';
    this.activeNailLengthRight = 'short';
    this.disposables = [];
  }

  buildRig() {
    const THREE = this.THREE;
    const mats = this.materials;

    this.root = new THREE.Group();
    this.root.name = 'AvatarRoot';
    // STRICT GROUNDING CONTRACT: Grounded on elevated 8cm stage dais
    this.root.position.set(0, 0.080, 0);

    this.sculptedAvatarGroup = new THREE.Group();
    this.sculptedAvatarGroup.name = 'SculptedAvatarGroup';
    this.root.add(this.sculptedAvatarGroup);

    // 1. HEAD & FACIAL ANATOMY (Stylized Beauty with expressive almond eyes)
    this.headGroup = new THREE.Group();
    this.headGroup.name = 'AvatarHeadGroup';
    this.headGroup.position.set(0, 1.54, 0);

    // Smooth Head / Cranium
    const craniumGeo = new THREE.SphereGeometry(0.096, 32, 32);
    craniumGeo.scale(0.88, 1.15, 0.95);
    const cranium = new THREE.Mesh(craniumGeo, mats.skinMat);
    cranium.name = 'AvatarCranium';
    cranium.castShadow = true;
    this.headGroup.add(cranium);
    this.disposables.push(craniumGeo);

    // Tapered Chin
    const chinGeo = new THREE.SphereGeometry(0.032, 20, 20);
    const chin = new THREE.Mesh(chinGeo, mats.skinMat);
    chin.scale.set(0.9, 0.8, 0.9);
    chin.position.set(0, -0.072, 0.038);
    this.headGroup.add(chin);
    this.disposables.push(chinGeo);

    // Soft Blushing Cheeks
    [-1, 1].forEach((side) => {
      const blushGeo = new THREE.SphereGeometry(0.024, 12, 12);
      const blush = new THREE.Mesh(blushGeo, mats.blushMat);
      blush.scale.set(1.2, 0.6, 0.3);
      blush.position.set(side * 0.048, -0.015, 0.076);
      this.headGroup.add(blush);
      this.disposables.push(blushGeo);
    });

    // Almond Eyes: Sclera, Iris, Pupil, Catchlight Glint & Eyelashes
    this.eyelids = [];

    [-1, 1].forEach((side) => {
      const eyeX = side * 0.032;

      const scleraGeo = new THREE.SphereGeometry(0.0098, 16, 12);
      const sclera = new THREE.Mesh(scleraGeo, mats.scleraMat);
      sclera.scale.set(1.28, 0.70, 0.5);
      sclera.position.set(eyeX, 0.015, 0.082);
      this.headGroup.add(sclera);
      this.disposables.push(scleraGeo);

      const irisGeo = new THREE.SphereGeometry(0.0058, 12, 12);
      const iris = new THREE.Mesh(irisGeo, mats.irisMat);
      iris.scale.set(1.0, 1.0, 0.3);
      iris.position.set(eyeX, 0.015, 0.086);
      this.headGroup.add(iris);
      this.disposables.push(irisGeo);

      const pupilGeo = new THREE.SphereGeometry(0.0030, 8, 8);
      const pupil = new THREE.Mesh(pupilGeo, mats.pupilMat);
      pupil.position.set(eyeX, 0.015, 0.088);
      this.headGroup.add(pupil);
      this.disposables.push(pupilGeo);

      const glintGeo = new THREE.SphereGeometry(0.0015, 6, 6);
      const glint = new THREE.Mesh(glintGeo, mats.glintMat);
      glint.position.set(eyeX + 0.0018, 0.017, 0.089);
      this.headGroup.add(glint);
      this.disposables.push(glintGeo);

      // Dynamic Eyelid for Natural Blinking Animation
      const eyelidGeo = new THREE.SphereGeometry(0.0102, 16, 10);
      const eyelid = new THREE.Mesh(eyelidGeo, mats.skinMat);
      eyelid.name = `AvatarEyelid_${side < 0 ? 'Left' : 'Right'}`;
      eyelid.scale.set(1.30, 0.02, 0.52);
      eyelid.position.set(eyeX, 0.022, 0.084);
      this.headGroup.add(eyelid);
      this.eyelids.push(eyelid);
      this.disposables.push(eyelidGeo);

      // Curved Upper Lashes
      const lashGeo = new THREE.CylinderGeometry(0.0016, 0.0016, 0.026, 8);
      const lash = new THREE.Mesh(lashGeo, mats.lashMat);
      lash.rotation.z = Math.PI / 2 + side * 0.15;
      lash.position.set(eyeX, 0.022, 0.084);
      this.headGroup.add(lash);
      this.disposables.push(lashGeo);

      // Arched Natural Brows
      const browGeo = new THREE.CylinderGeometry(0.0022, 0.0014, 0.035, 8);
      const brow = new THREE.Mesh(browGeo, mats.browMat);
      brow.rotation.z = side * 0.16;
      brow.position.set(eyeX, 0.036, 0.082);
      brow.userData = { side, baseZRot: side * 0.16, baseY: 0.036 };
      this.headGroup.add(brow);
      this.eyebrowMeshes.push(brow);
      this.disposables.push(browGeo);

      // Ears with subtle gold hoops
      const earGeo = new THREE.SphereGeometry(0.020, 12, 12);
      const ear = new THREE.Mesh(earGeo, mats.skinMat);
      ear.scale.set(0.35, 1.15, 0.65);
      ear.position.set(side * 0.088, 0.008, -0.005);
      this.headGroup.add(ear);
      this.disposables.push(earGeo);

      const hoopGeo = new THREE.TorusGeometry(0.012, 0.0025, 8, 16);
      const hoop = new THREE.Mesh(hoopGeo, mats.hoopMat);
      hoop.name = `AvatarEarring_${side < 0 ? 'Left' : 'Right'}`;
      hoop.position.set(side * 0.090, -0.010, -0.005);
      this.headGroup.add(hoop);
      this.accessories.earrings.push(hoop);
      this.disposables.push(hoopGeo);
    });

    // Contoured Nose
    const bridgeGeo = new THREE.CylinderGeometry(0.005, 0.010, 0.038, 12);
    const bridge = new THREE.Mesh(bridgeGeo, mats.skinMat);
    bridge.position.set(0, -0.006, 0.089);
    bridge.rotation.x = -0.16;
    this.headGroup.add(bridge);
    this.disposables.push(bridgeGeo);

    const noseTipGeo = new THREE.SphereGeometry(0.009, 12, 12);
    const noseTip = new THREE.Mesh(noseTipGeo, mats.skinMat);
    noseTip.scale.set(0.9, 0.75, 1.0);
    noseTip.position.set(0, -0.024, 0.093);
    this.headGroup.add(noseTip);
    this.disposables.push(noseTipGeo);

    // Satin Rosy Lips with Cupid's Bow
    const upperLipGeo = new THREE.SphereGeometry(0.012, 16, 12);
    const upperLip = new THREE.Mesh(upperLipGeo, mats.lipMat);
    upperLip.scale.set(1.5, 0.45, 0.6);
    upperLip.position.set(0, -0.048, 0.084);
    this.headGroup.add(upperLip);
    this.disposables.push(upperLipGeo);

    const lowerLipGeo = new THREE.SphereGeometry(0.014, 16, 12);
    const lowerLip = new THREE.Mesh(lowerLipGeo, mats.lipMat);
    lowerLip.scale.set(1.4, 0.55, 0.7);
    lowerLip.position.set(0, -0.058, 0.082);
    this.headGroup.add(lowerLip);
    this.disposables.push(lowerLipGeo);

    // 2. HAIRSTYLES (Signature High Bun Updo)
    this.buildHairstyles();

    // 2B. PROCEDURAL GROOMING MESHES (Beard, Moustache & Alternate Hairstyles)
    this.facialGroomingGroup = new THREE.Group();
    this.facialGroomingGroup.name = 'AvatarFacialGroomingGroup';
    this.facialGroomingGroup.position.set(0, 0, 0);

    this.buildBeardMeshes();
    this.buildMoustacheMeshes();
    this.buildAlternateHairstyles();
    this.buildSideburnMeshes();
    this.buildEyeshadowMeshes();
    this.buildGLBGlasses(this.facialGroomingGroup);
    this.buildGLBChainNecklace(this.facialGroomingGroup);

    this.headGroup.add(this.facialGroomingGroup);

    // 3. SLENDER NECK & ANATOMICAL CLAVICLES
    const neckGeo = new THREE.CylinderGeometry(0.038, 0.046, 0.14, 24);
    const neck = new THREE.Mesh(neckGeo, mats.skinMat);
    neck.name = 'AvatarNeck';
    neck.position.set(0, 1.41, 0);
    this.sculptedAvatarGroup.add(neck);
    this.disposables.push(neckGeo);

    // 4. TORSO: CHEST & MIDRIFF (With Subtle Breathing Movement)
    this.chestGroup = new THREE.Group();
    this.chestGroup.name = 'AvatarChestGroup';
    this.chestGroup.position.set(0, 1.22, 0);

    // High-neck sleeveless crop top body
    const tankTopGeo = new THREE.CylinderGeometry(0.114, 0.104, 0.22, 32);
    const tankTop = new THREE.Mesh(tankTopGeo, mats.tankMat);
    tankTop.name = 'AvatarTop';
    tankTop.castShadow = true;
    this.chestGroup.add(tankTop);
    this.disposables.push(tankTopGeo);

    // High-neck collar rim
    const neckCollarGeo = new THREE.CylinderGeometry(0.048, 0.052, 0.045, 24);
    const neckCollar = new THREE.Mesh(neckCollarGeo, mats.tankMat);
    neckCollar.position.set(0, 0.12, 0);
    this.chestGroup.add(neckCollar);
    this.disposables.push(neckCollarGeo);

    this.sculptedAvatarGroup.add(this.chestGroup);

    // Exposed Midriff
    const midriffGeo = new THREE.CylinderGeometry(0.098, 0.110, 0.14, 32);
    const midriff = new THREE.Mesh(midriffGeo, mats.skinMat);
    midriff.name = 'AvatarMidriff';
    midriff.position.set(0, 1.06, 0);
    this.sculptedAvatarGroup.add(midriff);
    this.disposables.push(midriffGeo);

    // 5. ARMS & HANDS WITH NATURAL RESTING FINGERS
    [-1, 1].forEach((side) => {
      const armGroup = new THREE.Group();
      armGroup.name = `AvatarArmGroup_${side < 0 ? 'Left' : 'Right'}`;
      armGroup.position.set(side * 0.168, 1.31, 0);

      const shoulderGeo = new THREE.SphereGeometry(0.038, 16, 16);
      const shoulder = new THREE.Mesh(shoulderGeo, mats.skinMat);
      armGroup.add(shoulder);
      this.disposables.push(shoulderGeo);

      const upperArmGeo = new THREE.CylinderGeometry(0.032, 0.027, 0.26, 20);
      const upperArm = new THREE.Mesh(upperArmGeo, mats.skinMat);
      upperArm.position.set(0, -0.13, 0);
      upperArm.rotation.z = side * 0.05;
      upperArm.castShadow = true;
      armGroup.add(upperArm);
      this.disposables.push(upperArmGeo);

      const forearmGeo = new THREE.CylinderGeometry(0.026, 0.022, 0.26, 20);
      const forearm = new THREE.Mesh(forearmGeo, mats.skinMat);
      forearm.position.set(side * 0.010, -0.37, 0);
      forearm.rotation.z = side * -0.03;
      forearm.castShadow = true;
      armGroup.add(forearm);
      this.disposables.push(forearmGeo);

      // Sculpted Hand with 5 Distinct Curved Fingers
      const hand = new THREE.Group();
      hand.position.set(side * 0.015, -0.52, 0);

      const palmGeo = new THREE.BoxGeometry(0.026, 0.042, 0.014);
      const palm = new THREE.Mesh(palmGeo, mats.skinMat);
      hand.add(palm);
      this.disposables.push(palmGeo);

      const thumbGeo = new THREE.CylinderGeometry(0.0040, 0.0032, 0.026, 8);
      const thumb = new THREE.Mesh(thumbGeo, mats.skinMat);
      thumb.rotation.z = side * -0.42;
      thumb.position.set(side * -0.013, 0.004, 0.004);

      if (mats.nailMat) {
        const thumbNailGeo = new THREE.BoxGeometry(0.0042, 0.006, 0.0018);
        const thumbNail = new THREE.Mesh(thumbNailGeo, mats.nailMat);
        thumbNail.position.set(0, -0.010, 0.0032);
        thumb.add(thumbNail);
        this.nailMeshes.push(thumbNail);
        this.disposables.push(thumbNailGeo);
      }

      hand.add(thumb);
      this.disposables.push(thumbGeo);

      for (let f = 0; f < 4; f++) {
        const fingerLen = 0.036 - f * 0.003;
        const fingerGeo = new THREE.CylinderGeometry(0.0034, 0.0026, fingerLen, 8);
        const finger = new THREE.Mesh(fingerGeo, mats.skinMat);
        finger.position.set(side * (0.008 - f * 0.005), -0.035, 0);

        if (mats.nailMat) {
          const fingerNailGeo = new THREE.BoxGeometry(0.0038, 0.0052, 0.0018);
          const fingerNail = new THREE.Mesh(fingerNailGeo, mats.nailMat);
          fingerNail.position.set(0, -fingerLen / 2 + 0.003, 0.0025);
          finger.add(fingerNail);
          this.nailMeshes.push(fingerNail);
          this.disposables.push(fingerNailGeo);
        }

        hand.add(finger);
        this.disposables.push(fingerGeo);
      }
      armGroup.add(hand);

      this.sculptedAvatarGroup.add(armGroup);
    });

    // 6. HIGH-WAISTED FLUID WIDE-LEG TAILORED TROUSERS IN SAND
    const waistHipsGeo = new THREE.CylinderGeometry(0.112, 0.136, 0.18, 32);
    const waistHips = new THREE.Mesh(waistHipsGeo, mats.trouserMat);
    waistHips.name = 'AvatarWaistHips';
    waistHips.position.set(0, 0.95, 0);
    waistHips.castShadow = true;
    this.sculptedAvatarGroup.add(waistHips);
    this.disposables.push(waistHipsGeo);

    // Center Front Button
    const buttonGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.006, 12);
    const button = new THREE.Mesh(buttonGeo, mats.trouserMat);
    button.rotation.x = Math.PI / 2;
    button.position.set(0, 1.01, 0.115);
    this.sculptedAvatarGroup.add(button);
    this.accessories.button = button;
    this.disposables.push(buttonGeo);

    // Fluid Wide Legs with Front Creases and Natural Fashion Stance
    [-1, 1].forEach((side) => {
      const legGroup = new THREE.Group();
      legGroup.name = `AvatarLegGroup_${side < 0 ? 'Left' : 'Right'}`;
      legGroup.position.set(side * 0.088, 0.86, 0);
      legGroup.rotation.y = side * -0.06; // Subtle relaxed fashion hip and thigh angle

      const pantLegGeo = new THREE.CylinderGeometry(0.072, 0.098, 0.78, 28);
      const pantLeg = new THREE.Mesh(pantLegGeo, mats.trouserMat);
      pantLeg.name = `AvatarBottom_${side < 0 ? 'Left' : 'Right'}`;
      pantLeg.position.y = -0.39;
      pantLeg.castShadow = true;
      legGroup.add(pantLeg);
      this.disposables.push(pantLegGeo);

      const creaseGeo = new THREE.BoxGeometry(0.003, 0.76, 0.004);
      const crease = new THREE.Mesh(creaseGeo, mats.trouserMat);
      crease.position.set(0, -0.39, 0.088);
      legGroup.add(crease);
      this.disposables.push(creaseGeo);

      this.sculptedAvatarGroup.add(legGroup);
    });

    // 7. MINIMALIST CHUNKY WHITE PLATFORM SNEAKERS WITH NATURAL OUTWARD TOE FLARE
    [-1, 1].forEach((side) => {
      const sneaker = new THREE.Group();
      sneaker.name = `AvatarSneaker_${side < 0 ? 'Left' : 'Right'}`;
      sneaker.position.set(side * 0.092, 0.018, 0.032);
      sneaker.rotation.y = side * -0.10; // Natural 6-degree outward toe flare for relaxed grounded stance

      // Chunky Platform Rubber Sole with Tread
      const soleGeo = new THREE.BoxGeometry(0.082, 0.036, 0.22);
      const sole = new THREE.Mesh(soleGeo, mats.soleMat);
      sole.position.y = 0.018;
      sole.castShadow = true;
      sneaker.add(sole);
      this.disposables.push(soleGeo);

      // Contoured White Leather Upper
      const upperGeo = new THREE.SphereGeometry(0.040, 16, 16);
      const upper = new THREE.Mesh(upperGeo, mats.sneakerMat);
      upper.scale.set(1.0, 0.85, 1.9);
      upper.position.set(0, 0.046, 0.01);
      upper.castShadow = true;
      sneaker.add(upper);
      this.disposables.push(upperGeo);

      // Padded Tongue & Laces
      const tongueGeo = new THREE.BoxGeometry(0.035, 0.040, 0.06);
      const tongue = new THREE.Mesh(tongueGeo, mats.sneakerMat);
      tongue.position.set(0, 0.062, -0.01);
      tongue.rotation.x = -0.3;
      sneaker.add(tongue);
      this.disposables.push(tongueGeo);

      this.sculptedAvatarGroup.add(sneaker);
    });

    // 8. LOCALIZED HIGH-FIDELITY FOOT CONTACT SHADOWS DIRECTLY ON STAGE DAIS
    const ShadowGeoClass = THREE.CircleGeometry || THREE.CylinderGeometry;
    [-1, 1].forEach((side) => {
      const shadowGeo = new ShadowGeoClass(0.062, 32);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x1A140E,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      });
      const footShadow = new THREE.Mesh(shadowGeo, shadowMat);
      footShadow.name = `AvatarFootContactShadow_${side < 0 ? 'Left' : 'Right'}`;
      footShadow.rotation.x = -Math.PI / 2;
      footShadow.rotation.z = side * 0.10; // Angle matches natural toe flare
      footShadow.scale.set(0.70, 1.55, 1.0);
      footShadow.position.set(side * 0.092, 0.001, 0.032);
      this.root.add(footShadow);
      this.disposables.push(shadowGeo, shadowMat);
    });

    // Enable complete castShadow and receiveShadow self-shadowing across all anatomical and garment meshes
    this.root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return this.root;
  }

  buildHairstyles() {
    const THREE = this.THREE;
    const mats = this.materials;

    // 1. SIGNATURE HIGH BUN UPDO
    const bunGroup = new THREE.Group();
    bunGroup.name = 'AvatarHair_Bun';

    const crownGeo = new THREE.SphereGeometry(0.105, 24, 24);
    crownGeo.scale(0.92, 1.16, 0.96);
    const crown = new THREE.Mesh(crownGeo, mats.hairMat);
    crown.position.set(0, 0.02, -0.012);
    crown.castShadow = true;
    bunGroup.add(crown);
    this.disposables.push(crownGeo);

    const bunMeshGeo = new THREE.SphereGeometry(0.058, 20, 20);
    const bun = new THREE.Mesh(bunMeshGeo, mats.hairMat);
    bun.scale.set(1.0, 0.9, 0.9);
    bun.position.set(0, 0.125, -0.035);
    bun.castShadow = true;
    bunGroup.add(bun);
    this.disposables.push(bunMeshGeo);

    const hairTieGeo = new THREE.TorusGeometry(0.045, 0.008, 8, 24);
    const hairTie = new THREE.Mesh(hairTieGeo, mats.hairTieMat);
    hairTie.rotation.x = Math.PI / 2;
    hairTie.position.set(0, 0.095, -0.035);
    bunGroup.add(hairTie);
    this.disposables.push(hairTieGeo);

    [-1, 1].forEach((side) => {
      const wispGeo = new THREE.CylinderGeometry(0.004, 0.002, 0.14, 8);
      const wisp = new THREE.Mesh(wispGeo, mats.hairMat);
      wisp.rotation.z = side * 0.12;
      wisp.position.set(side * 0.082, -0.02, 0.03);
      bunGroup.add(wisp);
      this.disposables.push(wispGeo);
    });

    this.hairStyles.bun = bunGroup;
    this.headGroup.add(bunGroup);
  }

  buildBeardMeshes() {
    const THREE = this.THREE;
    const mats = this.materials;
    const mount = this.facialGroomingGroup || this.headGroup;
    if (!mats.beardMat || !mount) return;

    // 1. Stubble Beard Group
    const stubbleGroup = new THREE.Group();
    stubbleGroup.name = 'AvatarBeard_Stubble';
    const stubbleChinGeo = new THREE.SphereGeometry(0.034, 16, 16);
    const stubbleChin = new THREE.Mesh(stubbleChinGeo, mats.beardMat);
    stubbleChin.scale.set(0.96, 0.84, 0.96);
    stubbleChin.position.set(0, -0.072, 0.040);
    stubbleGroup.add(stubbleChin);
    this.disposables.push(stubbleChinGeo);

    [-1, 1].forEach((side) => {
      const stubbleJawGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.065, 12);
      const stubbleJaw = new THREE.Mesh(stubbleJawGeo, mats.beardMat);
      stubbleJaw.rotation.z = side * 0.55;
      stubbleJaw.position.set(side * 0.045, -0.058, 0.032);
      stubbleGroup.add(stubbleJaw);
      this.disposables.push(stubbleJawGeo);
    });
    stubbleGroup.visible = false;
    mount.add(stubbleGroup);
    this.beardMeshes.stubble = stubbleGroup;

    // 2. Short Boxed Beard Group
    const shortGroup = new THREE.Group();
    shortGroup.name = 'AvatarBeard_Short';
    const shortChinGeo = new THREE.BoxGeometry(0.065, 0.048, 0.038);
    const shortChin = new THREE.Mesh(shortChinGeo, mats.beardMat);
    shortChin.position.set(0, -0.075, 0.046);
    shortGroup.add(shortChin);
    this.disposables.push(shortChinGeo);

    [-1, 1].forEach((side) => {
      const shortJawGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.080, 12);
      const shortJaw = new THREE.Mesh(shortJawGeo, mats.beardMat);
      shortJaw.rotation.z = side * 0.65;
      shortJaw.position.set(side * 0.052, -0.052, 0.034);
      shortGroup.add(shortJaw);
      this.disposables.push(shortJawGeo);
    });
    shortGroup.visible = false;
    mount.add(shortGroup);
    this.beardMeshes.short = shortGroup;

    // 3. Full Majestic Beard Group
    const fullGroup = new THREE.Group();
    fullGroup.name = 'AvatarBeard_Full';
    const fullChinGeo = new THREE.SphereGeometry(0.046, 20, 20);
    const fullChin = new THREE.Mesh(fullChinGeo, mats.beardMat);
    fullChin.scale.set(1.15, 1.25, 1.15);
    fullChin.position.set(0, -0.088, 0.048);
    fullGroup.add(fullChin);
    this.disposables.push(fullChinGeo);

    [-1, 1].forEach((side) => {
      const fullJawGeo = new THREE.CylinderGeometry(0.024, 0.028, 0.095, 12);
      const fullJaw = new THREE.Mesh(fullJawGeo, mats.beardMat);
      fullJaw.rotation.z = side * 0.65;
      fullJaw.position.set(side * 0.056, -0.048, 0.035);
      fullGroup.add(fullJaw);
      this.disposables.push(fullJawGeo);
    });
    fullGroup.visible = false;
    mount.add(fullGroup);
    this.beardMeshes.full = fullGroup;

    // 4. Goatee Beard Group
    const goateeGroup = new THREE.Group();
    goateeGroup.name = 'AvatarBeard_Goatee';
    const goateeChinGeo = new THREE.SphereGeometry(0.030, 16, 16);
    const goateeChin = new THREE.Mesh(goateeChinGeo, mats.beardMat);
    goateeChin.scale.set(1.0, 1.25, 0.9);
    goateeChin.position.set(0, -0.078, 0.048);
    goateeGroup.add(goateeChin);
    this.disposables.push(goateeChinGeo);
    goateeGroup.visible = false;
    mount.add(goateeGroup);
    this.beardMeshes.goatee = goateeGroup;
  }

  buildMoustacheMeshes() {
    const THREE = this.THREE;
    const mats = this.materials;
    const mount = this.facialGroomingGroup || this.headGroup;
    if (!mats.beardMat || !mount) return;

    // 1. Natural Moustache
    const naturalGroup = new THREE.Group();
    naturalGroup.name = 'AvatarMoustache_Natural';
    [-1, 1].forEach((side) => {
      const natGeo = new THREE.CylinderGeometry(0.003, 0.002, 0.022, 8);
      const nat = new THREE.Mesh(natGeo, mats.beardMat);
      nat.rotation.z = side * 1.35;
      nat.position.set(side * 0.010, -0.040, 0.092);
      naturalGroup.add(nat);
      this.disposables.push(natGeo);
    });
    naturalGroup.visible = false;
    mount.add(naturalGroup);
    this.moustacheMeshes.natural = naturalGroup;

    // 2. Chevron Moustache
    const chevronGroup = new THREE.Group();
    chevronGroup.name = 'AvatarMoustache_Chevron';
    const chevGeo = new THREE.BoxGeometry(0.038, 0.010, 0.008);
    const chev = new THREE.Mesh(chevGeo, mats.beardMat);
    chev.position.set(0, -0.040, 0.092);
    chevronGroup.add(chev);
    this.disposables.push(chevGeo);
    chevronGroup.visible = false;
    mount.add(chevronGroup);
    this.moustacheMeshes.chevron = chevronGroup;

    // 3. Pencil Moustache
    const pencilGroup = new THREE.Group();
    pencilGroup.name = 'AvatarMoustache_Pencil';
    const pencilGeo = new THREE.CylinderGeometry(0.0014, 0.0014, 0.032, 8);
    const pencil = new THREE.Mesh(pencilGeo, mats.beardMat);
    pencil.rotation.z = Math.PI / 2;
    pencil.position.set(0, -0.038, 0.093);
    pencilGroup.add(pencil);
    this.disposables.push(pencilGeo);
    pencilGroup.visible = false;
    mount.add(pencilGroup);
    this.moustacheMeshes.pencil = pencilGroup;

    // 4. Handlebar Moustache
    const handlebarGroup = new THREE.Group();
    handlebarGroup.name = 'AvatarMoustache_Handlebar';
    [-1, 1].forEach((side) => {
      const hBarGeo = new THREE.TorusGeometry(0.012, 0.0025, 6, 12, Math.PI / 1.5);
      const hBar = new THREE.Mesh(hBarGeo, mats.beardMat);
      hBar.rotation.z = side < 0 ? Math.PI / 3 : -Math.PI / 3;
      hBar.position.set(side * 0.018, -0.039, 0.092);
      handlebarGroup.add(hBar);
      this.disposables.push(hBarGeo);
    });
    handlebarGroup.visible = false;
    mount.add(handlebarGroup);
    this.moustacheMeshes.handlebar = handlebarGroup;
  }

  buildAlternateHairstyles() {
    const THREE = this.THREE;
    const mats = this.materials;
    const mount = this.facialGroomingGroup || this.headGroup;
    if (!mats.hairMat || !mount) return;

    // 1. Chic Sleek Bob
    const bobGroup = new THREE.Group();
    bobGroup.name = 'AvatarHair_Bob';
    [-1, 1].forEach((side) => {
      const bobCurtainGeo = new THREE.CylinderGeometry(0.016, 0.012, 0.12, 12);
      bobCurtainGeo.scale(1.2, 1.0, 0.85);
      const bobCurtain = new THREE.Mesh(bobCurtainGeo, mats.hairMat);
      bobCurtain.position.set(side * 0.082, -0.025, 0.012);
      bobCurtain.rotation.z = side * -0.10;
      bobGroup.add(bobCurtain);
      this.disposables.push(bobCurtainGeo);
    });
    const bobBackGeo = new THREE.SphereGeometry(0.068, 16, 16);
    bobBackGeo.scale(1.25, 1.1, 0.85);
    const bobBack = new THREE.Mesh(bobBackGeo, mats.hairMat);
    bobBack.position.set(0, 0.02, -0.042);
    bobGroup.add(bobBack);
    this.disposables.push(bobBackGeo);
    bobGroup.visible = false;
    mount.add(bobGroup);
    this.hairStyles.bob = bobGroup;

    // 2. Soft Cascading Waves
    const wavesGroup = new THREE.Group();
    wavesGroup.name = 'AvatarHair_Waves';
    [-1, 1].forEach((side) => {
      const waveFrontGeo = new THREE.CylinderGeometry(0.015, 0.010, 0.20, 12);
      waveFrontGeo.scale(1.1, 1.0, 0.7);
      const waveFront = new THREE.Mesh(waveFrontGeo, mats.hairMat);
      waveFront.position.set(side * 0.085, -0.065, 0.025);
      waveFront.rotation.z = side * -0.12;
      waveFront.rotation.x = 0.08;
      wavesGroup.add(waveFront);
      this.disposables.push(waveFrontGeo);

      const waveBackGeo = new THREE.CylinderGeometry(0.014, 0.008, 0.16, 10);
      const waveBack = new THREE.Mesh(waveBackGeo, mats.hairMat);
      waveBack.position.set(side * 0.095, -0.095, -0.015);
      waveBack.rotation.z = side * -0.18;
      wavesGroup.add(waveBack);
      this.disposables.push(waveBackGeo);
    });
    const wavesCrownBackGeo = new THREE.SphereGeometry(0.075, 16, 16);
    wavesCrownBackGeo.scale(1.25, 1.4, 0.9);
    const wavesCrownBack = new THREE.Mesh(wavesCrownBackGeo, mats.hairMat);
    wavesCrownBack.position.set(0, -0.02, -0.045);
    wavesGroup.add(wavesCrownBack);
    this.disposables.push(wavesCrownBackGeo);
    wavesGroup.visible = false;
    mount.add(wavesGroup);
    this.hairStyles.waves = wavesGroup;

    // 3. Modern Pixie Crop
    const cropGroup = new THREE.Group();
    cropGroup.name = 'AvatarHair_Crop';
    const cropCapGeo = new THREE.SphereGeometry(0.098, 20, 20);
    cropCapGeo.scale(0.94, 1.08, 0.96);
    const cropCap = new THREE.Mesh(cropCapGeo, mats.hairMat);
    cropCap.position.set(0, 0.035, -0.010);
    cropGroup.add(cropCap);
    this.disposables.push(cropCapGeo);
    [-1, 1].forEach((side) => {
      const cropSideGeo = new THREE.BoxGeometry(0.012, 0.045, 0.025);
      const cropSide = new THREE.Mesh(cropSideGeo, mats.hairMat);
      cropSide.position.set(side * 0.086, 0.010, 0.010);
      cropGroup.add(cropSide);
      this.disposables.push(cropSideGeo);
    });
    cropGroup.visible = false;
    mount.add(cropGroup);
    this.hairStyles.crop = cropGroup;
  }

  mountToGLB(model) {
    if (!model || this.isMountedToGLB) return;
    this.isMountedToGLB = true;

    // 1. Reparent Facial Grooming Group (Beards, Moustaches, Alternate Hairstyles) onto GLB model
    if (this.facialGroomingGroup) {
      if (this.facialGroomingGroup.parent) {
        this.facialGroomingGroup.parent.remove(this.facialGroomingGroup);
      }
      this.facialGroomingGroup.position.set(0, 1.54, 0);
      model.add(this.facialGroomingGroup);
    }

    // 2. Discover GLB Nodes for Nails, Earrings, Brows, and Hair
    const glbHair = { base: null, bun: null, twist: null, tendrils: [] };

    model.traverse((child) => {
      if (child.name === 'Avatar_Hair_Base') glbHair.base = child;
      else if (child.name === 'Avatar_Hair_Bun') glbHair.bun = child;
      else if (child.name === 'Avatar_Hair_Twist') glbHair.twist = child;
      else if (child.name.includes('Avatar_Tendril')) glbHair.tendrils.push(child);
      else if (child.name.includes('Earring') || child.name.includes('Hoop')) {
        if (!this.accessories.earrings.includes(child)) {
          this.accessories.earrings.push(child);
        }
      } else if (child.name.includes('Brow') || child.name.includes('Eye_Brow')) {
        child.userData = {
          side: child.name.includes('_L') ? -1 : 1,
          baseZRot: child.rotation.z,
          baseY: child.position.y
        };
        this.eyebrowMeshes.push(child);
      } else if (child.name.includes('Lash')) {
        if (!this.eyelashMeshes.includes(child)) {
          this.eyelashMeshes.push(child);
        }
      } else if (child.name === 'Avatar_Hand_L' || child.name === 'Avatar_Hand_R') {
        this.buildGLBHandNails(child, child.name === 'Avatar_Hand_L');
      }
    });

    // 3. Attach Luxury Gold Watch to Left Hand/Wrist
    const leftHand = model.getObjectByName('Avatar_Hand_L');
    if (leftHand && !this.accessories.watch) {
      this.buildGLBWatch(leftHand);
    }

    // 4. Attach Signet Ring to Right Hand
    const rightHand = model.getObjectByName('Avatar_Hand_R');
    if (rightHand && !this.accessories.ring) {
      this.buildGLBRing(rightHand);
    }

    // 5. Ensure Designer Glasses and Chain are mounted to Facial Grooming Group
    if (this.facialGroomingGroup) {
      if (!this.accessories.glasses) this.buildGLBGlasses(this.facialGroomingGroup);
      if (!this.accessories.chain) this.buildGLBChainNecklace(this.facialGroomingGroup);
    }

    this.glbHairMeshes = glbHair;

    // Apply active styles to the newly mounted GLB model
    this.setHairstyle(this.activeHairStyle || 'bun');
    this.setBeardStyle(this.activeBeardStyle || 'clean');
    this.setMoustacheStyle(this.activeMoustacheStyle || 'none');
    this.setSideburnStyle(this.activeSideburnStyle || 'natural');
  }

  createNailGeometry(shape = 'oval', lengthId = 'medium', isThumb = false) {
    const THREE = this.THREE;
    const width = isThumb ? 0.0048 : 0.0036;

    let length = isThumb ? 0.0068 : 0.0056;
    switch (lengthId) {
      case 'natural':
      case 'short':
        length *= 0.88;
        break;
      case 'long':
        length *= 1.65;
        break;
      case 'extralong':
      case 'extra-long':
        length *= 2.15;
        break;
      case 'medium':
      default:
        length *= 1.25;
        break;
    }

    if (THREE && typeof THREE.Shape === 'function' && typeof THREE.ExtrudeGeometry === 'function') {
      const halfW = width / 2;
      const baseH = length * 0.40;

      const nailShape = new THREE.Shape();
      // Cuticle curve (top/base, Y = 0)
      nailShape.moveTo(-halfW * 0.85, 0);
      nailShape.quadraticCurveTo(0, 0.0008, halfW * 0.85, 0);

      const normShape = (shape || 'oval').toLowerCase();
      switch (normShape) {
        case 'square':
          // Modern Square: clean parallel sides, sharp flat tip
          nailShape.lineTo(halfW, -length);
          nailShape.lineTo(-halfW, -length);
          break;
        case 'coffin':
          // Ballerina Coffin: tapered sides with squared-off flat tip
          nailShape.lineTo(halfW * 0.95, -baseH);
          nailShape.lineTo(halfW * 0.52, -length);
          nailShape.lineTo(-halfW * 0.52, -length);
          nailShape.lineTo(-halfW * 0.95, -baseH);
          break;
        case 'stiletto':
          // Stiletto Edge: dramatic taper to sharp triangular point
          nailShape.lineTo(halfW * 0.90, -baseH);
          nailShape.lineTo(0, -length * 1.15);
          nailShape.lineTo(-halfW * 0.90, -baseH);
          break;
        case 'almond':
          // Almond Sculpt: tapered sides to soft rounded apex
          nailShape.lineTo(halfW * 0.90, -baseH);
          nailShape.quadraticCurveTo(halfW * 0.55, -length, 0, -length);
          nailShape.quadraticCurveTo(-halfW * 0.55, -length, -halfW * 0.90, -baseH);
          break;
        case 'round':
        case 'natural':
        case 'oval':
        default:
          // Classic Oval: smooth curved tip
          nailShape.lineTo(halfW, -baseH);
          nailShape.quadraticCurveTo(halfW, -length, 0, -length);
          nailShape.quadraticCurveTo(-halfW, -length, -halfW, -baseH);
          break;
      }
      nailShape.closePath();

      const extrudeSettings = {
        depth: 0.0006,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.0002,
        bevelThickness: 0.0002
      };

      const geo = new THREE.ExtrudeGeometry(nailShape, extrudeSettings);
      geo.translate(0, 0, -0.0003);
      return geo;
    }

    // Resilient fallback for mock test environments
    const fallbackGeo = new THREE.BoxGeometry(width, length, 0.001);
    if (typeof fallbackGeo.translate === 'function') {
      fallbackGeo.translate(0, -length / 2, 0);
    }
    return fallbackGeo;
  }

  buildGLBHandNails(handNode, isLeftHand) {
    const THREE = this.THREE;
    const mats = this.materials;
    if (!mats.nailMat || !handNode) return;

    const groupName = `AvatarGLBNails_${isLeftHand ? 'Left' : 'Right'}`;
    const existing = handNode.getObjectByName(groupName);
    if (existing) {
      handNode.remove(existing);
      this.nailMeshes = this.nailMeshes.filter(m => m.parent !== existing);
    }

    const nailsGroup = new THREE.Group();
    nailsGroup.name = groupName;

    const currentShape = this.activeNailShape || 'oval';
    const currentLength = this.activeNailLength || 'medium';

    // Hand local orientations:
    // For Left Hand: dorsal (nail) surface faces along -X, forward is -Z.
    // For Right Hand: dorsal (nail) surface faces along +X, forward is -Z.
    const side = isLeftHand ? -1 : 1;
    const rotSide = isLeftHand ? -1 : 1;

    const fingers = [
      // Thumb
      {
        isThumb: true,
        pos: { x: side * 0.0090, y: -0.024, z: -0.013 },
        rot: { x: 0.20, y: rotSide * 0.65, z: rotSide * 0.32 }
      },
      // Index Finger
      {
        isThumb: false,
        pos: { x: side * 0.0108, y: -0.035, z: -0.007 },
        rot: { x: 0.15, y: rotSide * 0.38, z: rotSide * 0.05 }
      },
      // Middle Finger
      {
        isThumb: false,
        pos: { x: side * 0.0115, y: -0.037, z: -0.001 },
        rot: { x: 0.12, y: rotSide * 0.28, z: rotSide * 0.02 }
      },
      // Ring Finger
      {
        isThumb: false,
        pos: { x: side * 0.0110, y: -0.035, z: 0.005 },
        rot: { x: 0.10, y: rotSide * 0.22, z: rotSide * -0.02 }
      },
      // Pinky Finger
      {
        isThumb: false,
        pos: { x: side * 0.0095, y: -0.031, z: 0.010 },
        rot: { x: 0.08, y: rotSide * 0.16, z: rotSide * -0.04 }
      }
    ];

    fingers.forEach((f) => {
      const geo = this.createNailGeometry(currentShape, currentLength, f.isThumb);
      const handMat = isLeftHand ? (mats.nailMatLeft || mats.nailMat) : (mats.nailMatRight || mats.nailMat);
      const mesh = new THREE.Mesh(geo, handMat);
      mesh.name = `Nail_${isLeftHand ? 'L' : 'R'}_${f.isThumb ? 'Thumb' : 'Finger'}`;
      mesh.position.set(f.pos.x, f.pos.y, f.pos.z);
      mesh.rotation.set(f.rot.x, f.rot.y, f.rot.z);
      mesh.userData = { isThumb: f.isThumb, isLeft: isLeftHand };
      mesh.castShadow = true;
      nailsGroup.add(mesh);
      this.nailMeshes.push(mesh);
      this.disposables.push(geo);
    });

    handNode.add(nailsGroup);
  }

  buildGLBWatch(handNode) {
    const THREE = this.THREE;
    const mats = this.materials;
    if (!mats.hoopMat || !handNode) return;

    const watchGroup = new THREE.Group();
    watchGroup.name = 'AvatarGoldWatch';

    // Luxury Warm Brass Gold Band at wrist
    const bandGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.012, 16, 1, true);
    const band = new THREE.Mesh(bandGeo, mats.hoopMat);
    band.position.set(0, 0.026, 0);
    watchGroup.add(band);
    this.disposables.push(bandGeo);

    // Watch Bezel & Face
    const faceGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.003, 16);
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x1A140E,
      roughness: 0.25,
      metalness: 0.85
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 0.026, 0.020);
    watchGroup.add(face);
    this.disposables.push(faceGeo, faceMat);

    handNode.add(watchGroup);
    this.accessories.watch = watchGroup;
  }

  buildGLBGlasses(mount) {
    const THREE = this.THREE;
    const mats = this.materials;
    if (!mount) return;

    const glassesGroup = new THREE.Group();
    glassesGroup.name = 'AvatarDesignerGlasses';

    const frameMat = mats.hoopMat || new THREE.MeshStandardMaterial({ color: 0x1E120A, roughness: 0.3 });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xEEF5FF,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.28
    });
    this.disposables.push(lensMat);

    [-1, 1].forEach((side) => {
      const eyeX = side * 0.032;
      const rimGeo = new THREE.TorusGeometry(0.0135, 0.0016, 8, 20);
      const rim = new THREE.Mesh(rimGeo, frameMat);
      rim.position.set(eyeX, 0.024, 0.092);
      glassesGroup.add(rim);

      const lensGeo = new THREE.CylinderGeometry(0.0125, 0.0125, 0.001, 16);
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(eyeX, 0.024, 0.092);
      glassesGroup.add(lens);
      this.disposables.push(rimGeo, lensGeo);
    });

    const bridgeGeo = new THREE.CylinderGeometry(0.0014, 0.0014, 0.014, 8);
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 0.027, 0.093);
    glassesGroup.add(bridge);
    this.disposables.push(bridgeGeo);

    [-1, 1].forEach((side) => {
      const templeGeo = new THREE.CylinderGeometry(0.0012, 0.0012, 0.075, 8);
      const temple = new THREE.Mesh(templeGeo, frameMat);
      temple.rotation.x = Math.PI / 2;
      temple.position.set(side * 0.046, 0.024, 0.055);
      glassesGroup.add(temple);
      this.disposables.push(templeGeo);
    });

    glassesGroup.visible = false;
    mount.add(glassesGroup);
    this.accessories.glasses = glassesGroup;
  }

  buildGLBChainNecklace(mount) {
    const THREE = this.THREE;
    const mats = this.materials;
    if (!mount || !mats.hoopMat) return;

    const chainGroup = new THREE.Group();
    chainGroup.name = 'AvatarChainNecklace';

    const chainGeo = new THREE.TorusGeometry(0.052, 0.0024, 12, 28);
    const chainMesh = new THREE.Mesh(chainGeo, mats.hoopMat);
    chainMesh.rotation.x = Math.PI * 0.42;
    chainMesh.position.set(0, -0.095, 0.015);
    chainGroup.add(chainMesh);
    this.disposables.push(chainGeo);

    chainGroup.visible = false;
    mount.add(chainGroup);
    this.accessories.chain = chainGroup;
  }

  buildGLBRing(handNode) {
    const THREE = this.THREE;
    const mats = this.materials;
    if (!handNode || !mats.hoopMat) return;

    const ringGroup = new THREE.Group();
    ringGroup.name = 'AvatarSignetRing';

    const ringGeo = new THREE.TorusGeometry(0.0036, 0.0010, 8, 16);
    const ringMesh = new THREE.Mesh(ringGeo, mats.hoopMat);
    ringMesh.position.set(0.0105, -0.024, 0.005);
    ringMesh.rotation.set(0.10, 0.22, -0.02);
    ringGroup.add(ringMesh);
    this.disposables.push(ringGeo);

    ringGroup.visible = false;
    handNode.add(ringGroup);
    this.accessories.ring = ringGroup;
  }

  buildEyeshadowMeshes() {
    const THREE = this.THREE;
    const mats = this.materials;
    const mount = this.facialGroomingGroup || this.headGroup;
    if (!mount || !mats.eyeshadowMat) return;

    const shadowGroup = new THREE.Group();
    shadowGroup.name = 'AvatarEyeshadowGroup';

    [-1, 1].forEach((side) => {
      const eyeX = side * 0.032;
      const arcGeo = new THREE.CylinderGeometry(0.0024, 0.0020, 0.024, 8);
      const arcMesh = new THREE.Mesh(arcGeo, mats.eyeshadowMat);
      arcMesh.name = `AvatarEyeshadow_${side < 0 ? 'L' : 'R'}`;
      arcMesh.rotation.z = Math.PI / 2 + side * 0.12;
      arcMesh.position.set(eyeX, 0.026, 0.088);
      shadowGroup.add(arcMesh);
      this.eyeshadowMeshes.push(arcMesh);
      this.disposables.push(arcGeo);
    });

    mount.add(shadowGroup);
  }

  buildSideburnMeshes() {
    const THREE = this.THREE;
    const mats = this.materials;
    const mount = this.facialGroomingGroup || this.headGroup;
    if (!mount || !mats.beardMat) return;

    const styles = ['natural', 'faded', 'long', 'clean'];
    styles.forEach((st) => {
      const grp = new THREE.Group();
      grp.name = `AvatarSideburns_${st}`;
      if (st !== 'clean') {
        const height = (st === 'long') ? 0.055 : (st === 'faded' ? 0.025 : 0.038);
        [-1, 1].forEach((side) => {
          const sideGeo = new THREE.BoxGeometry(0.006, height, 0.016);
          const sideMesh = new THREE.Mesh(sideGeo, mats.beardMat);
          sideMesh.position.set(side * 0.084, 0.008 - height * 0.3, 0.012);
          grp.add(sideMesh);
          this.disposables.push(sideGeo);
        });
      }
      grp.visible = (st === this.activeSideburnStyle);
      mount.add(grp);
      this.sideburnMeshes[st] = grp;
    });
  }

  setSideburnStyle(styleId = 'natural') {
    this.activeSideburnStyle = styleId;
    Object.entries(this.sideburnMeshes).forEach(([id, grp]) => {
      if (grp) grp.visible = (id === styleId);
    });
  }

  setHairstyle(styleName = 'bun') {
    this.activeHairStyle = styleName;

    // Toggle GLB pre-baked hair meshes if available
    const glb = this.glbHairMeshes;
    if (glb) {
      const showBun = (styleName === 'bun');
      if (glb.bun) glb.bun.visible = showBun;
      if (glb.twist) glb.twist.visible = showBun;
      if (glb.tendrils && Array.isArray(glb.tendrils)) {
        glb.tendrils.forEach(t => {
          if (t) t.visible = (styleName !== 'crop');
        });
      }
    }

    // Toggle procedural hairstyle groups
    if (this.hairStyles.bun) this.hairStyles.bun.visible = (styleName === 'bun');
    if (this.hairStyles.bob) this.hairStyles.bob.visible = (styleName === 'bob');
    if (this.hairStyles.waves) this.hairStyles.waves.visible = (styleName === 'waves');
    if (this.hairStyles.crop) this.hairStyles.crop.visible = (styleName === 'crop');
  }

  setBeardStyle(styleId = 'clean') {
    this.activeBeardStyle = styleId;
    Object.entries(this.beardMeshes).forEach(([id, group]) => {
      if (group) group.visible = (id === styleId);
    });
  }

  setMoustacheStyle(styleId = 'none') {
    this.activeMoustacheStyle = styleId;
    Object.entries(this.moustacheMeshes).forEach(([id, group]) => {
      if (group) group.visible = (id === styleId);
    });
  }

  setEyebrowShape(shapeId = 'natural') {
    this.eyebrowMeshes.forEach((brow) => {
      if (!brow) return;
      const { side, baseZRot, baseY } = brow.userData || { side: 1, baseZRot: 0.16, baseY: 0.036 };
      switch (shapeId) {
        case 'arched':
          brow.scale.set(1.05, 1.25, 1.0);
          brow.rotation.z = (baseZRot || 0) * 1.8;
          brow.position.y = (baseY || 0) + 0.003;
          break;
        case 'straight':
          brow.scale.set(1.1, 0.9, 1.0);
          brow.rotation.z = (baseZRot || 0) * 0.25;
          brow.position.y = (baseY || 0) - 0.001;
          break;
        case 'bold':
          brow.scale.set(1.35, 1.5, 1.2);
          brow.rotation.z = (baseZRot || 0) * 1.1;
          brow.position.y = baseY || 0;
          break;
        case 'feathered':
          brow.scale.set(0.95, 0.85, 0.95);
          brow.rotation.z = (baseZRot || 0) * 1.35;
          brow.position.y = (baseY || 0) + 0.001;
          break;
        case 'natural':
        default:
          brow.scale.set(1.0, 1.0, 1.0);
          brow.rotation.z = baseZRot || 0;
          brow.position.y = baseY || 0;
          break;
      }
    });
  }

  setEyeMakeup(style = 'natural', hex = null, intensity = 0.5, mascara = 'natural') {
    if (this.eyelids && this.eyelids.length > 0) {
      this.eyelids.forEach((lid) => {
        if (!lid) return;
        switch (style) {
          case 'winged':
            lid.scale.set(1.42, 0.032, 0.58);
            break;
          case 'kohl':
            lid.scale.set(1.36, 0.030, 0.55);
            break;
          case 'tightline':
            lid.scale.set(1.22, 0.020, 0.50);
            break;
          case 'natural':
          default:
            lid.scale.set(1.30, 0.025, 0.52);
            break;
        }
      });
    }

    if (this.eyelashMeshes && this.eyelashMeshes.length > 0) {
      this.eyelashMeshes.forEach((lash) => {
        if (!lash) return;
        switch (mascara) {
          case 'volume':
            lash.scale.set(1.4, 1.4, 1.4);
            break;
          case 'kajal':
            lash.scale.set(1.6, 1.5, 1.3);
            break;
          case 'dramatic':
            lash.scale.set(1.8, 1.7, 1.5);
            break;
          case 'natural':
          default:
            lash.scale.set(1.0, 1.0, 1.0);
            break;
        }
      });
    }

    if (this.eyeshadowMeshes && this.eyeshadowMeshes.length > 0) {
      const showShadow = (typeof intensity === 'number') ? (intensity > 0.05) : true;
      this.eyeshadowMeshes.forEach((s) => {
        if (s) s.visible = showShadow;
      });
    }
  }

  setNailShape(shapeId = 'oval', lengthId = 'medium', targetHand = 'both') {
    if (targetHand === 'left' || targetHand === 'both') {
      this.activeNailShapeLeft = shapeId;
      this.activeNailLengthLeft = lengthId;
    }
    if (targetHand === 'right' || targetHand === 'both') {
      this.activeNailShapeRight = shapeId;
      this.activeNailLengthRight = lengthId;
    }
    this.activeNailShape = shapeId;
    this.activeNailLength = lengthId;

    this.nailMeshes.forEach((nail) => {
      if (!nail) return;
      const isLeft = !!nail.userData?.isLeft;
      if (targetHand === 'left' && !isLeft) return;
      if (targetHand === 'right' && isLeft) return;

      const currentShape = isLeft ? (this.activeNailShapeLeft || shapeId) : (this.activeNailShapeRight || shapeId);
      const currentLength = isLeft ? (this.activeNailLengthLeft || lengthId) : (this.activeNailLengthRight || lengthId);
      const isThumb = !!nail.userData?.isThumb;
      const newGeo = this.createNailGeometry(currentShape, currentLength, isThumb);
      if (nail.geometry && typeof nail.geometry.dispose === 'function') {
        nail.geometry.dispose();
      }
      nail.geometry = newGeo;
      this.disposables.push(newGeo);
    });
  }

  dispose() {
    this.disposables.forEach((geo) => {
      if (geo && typeof geo.dispose === 'function') {
        geo.dispose();
      }
    });
    this.disposables = [];
    this.eyelids = [];
    this.hairStyles = {};
    this.beardMeshes = {};
    this.moustacheMeshes = {};
    this.sideburnMeshes = {};
    this.eyebrowMeshes = [];
    this.eyelashMeshes = [];
    this.eyeshadowMeshes = [];
    this.nailMeshes = [];
  }
}
