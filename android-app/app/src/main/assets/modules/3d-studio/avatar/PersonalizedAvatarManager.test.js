/**
 * Woobi - 3D Studio Avatar Module
 * PersonalizedAvatarManager.test.js - Unit and Lifecycle Tests for 3D Face Integration
 */

import assert from 'assert';
import {
  PersonalizedAvatarManager,
  DEFAULT_HEAD_CONFIG,
  MIXAMO_HEAD_UV_TARGETS
} from './PersonalizedAvatarManager.js';

// Mock Three.js for Node test environment
class MockVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
  set(x, y, z) {
    this.x = x; this.y = y; this.z = z;
    return this;
  }
}

class MockBufferAttribute {
  constructor(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
    this.count = array.length / itemSize;
    this.needsUpdate = false;
  }
  getX(i) { return this.array[i * this.itemSize]; }
  getY(i) { return this.array[i * this.itemSize + 1]; }
  getZ(i) { return this.array[i * this.itemSize + 2]; }
  setZ(i, val) { this.array[i * this.itemSize + 2] = val; }
}

class MockPlaneGeometry {
  constructor(w, h, segW = 1, segH = 1) {
    this.w = w; this.h = h;
    const vertexCount = (segW + 1) * (segH + 1);
    const posArray = new Float32Array(vertexCount * 3);
    const uvArray = new Float32Array(vertexCount * 2);
    this.attributes = {
      position: new MockBufferAttribute(posArray, 3),
      uv: new MockBufferAttribute(uvArray, 2)
    };
    this.normalsComputed = false;
  }
  computeVertexNormals() {
    this.normalsComputed = true;
  }
  dispose() {}
}

class MockMaterial {
  constructor(options = {}) {
    this.map = options.map || null;
    this.color = { setHex: () => {}, getHex: () => 0xffffff };
    this.userData = {};
  }
  dispose() {}
}

class MockMesh {
  constructor(geo, mat) {
    this.geometry = geo;
    this.material = mat;
    this.position = new MockVector3();
    this.name = 'MockMesh';
    this.parent = null;
  }
}

class MockBone {
  constructor(name = 'mixamorig9_Head') {
    this.name = name;
    this.isBone = true;
    this.children = [];
  }
  add(child) {
    this.children.push(child);
    child.parent = this;
  }
  remove(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    child.parent = null;
  }
}

const MockTHREE = {
  PlaneGeometry: MockPlaneGeometry,
  MeshStandardMaterial: MockMaterial,
  Mesh: MockMesh,
  LinearFilter: 1006,
  sRGBEncoding: 3001
};

class MockStudio3D {
  constructor() {
    this.avatarConfig = { gender: 'male' };
    this.headBone = new MockBone('mixamorig9_Head');
    this.bodyMesh = {
      isMesh: true,
      name: 'Ch31_Body',
      material: new MockMaterial(),
      userData: {}
    };
    this.hairMesh = {
      isMesh: true,
      name: 'Ch31_Hair',
      material: new MockMaterial(),
      userData: {},
      visible: true
    };
    this.eyelashMesh = {
      isMesh: true,
      name: 'Ch31_Eyelashes',
      material: new MockMaterial(),
      userData: {},
      visible: true
    };

    this.gltfAvatarGroup = {
      traverse: (cb) => {
        cb(this.headBone);
        cb(this.bodyMesh);
        cb(this.hairMesh);
        cb(this.eyelashMesh);
      }
    };
  }
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
}

console.log('==================================================');
console.log('  PERSONALIZED AVATAR MANAGER — 8 LIFECYCLE TESTS  ');
console.log('==================================================');

test('1. DEFAULT_HEAD_CONFIG provides accurate anatomical calibration', () => {
  assert.ok(DEFAULT_HEAD_CONFIG.male.eyeLevelY > 9.0);
  assert.ok(DEFAULT_HEAD_CONFIG.male.faceWidth > 11.0);
  assert.ok(DEFAULT_HEAD_CONFIG.male.faceHeight > 14.0);
  assert.ok(DEFAULT_HEAD_CONFIG.female.eyeLevelY > 8.5);
});

test('2. validateFaceImage rejects undersized images', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const tinyImg = { naturalWidth: 120, naturalHeight: 120 };
  const res = manager.validateFaceImage(tinyImg);
  assert.strictEqual(res.valid, false);
  assert.ok(res.reason.includes('too low'));
});

test('3. validateFaceImage accepts valid proportions', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const goodImg = { naturalWidth: 800, naturalHeight: 800 };
  const res = manager.validateFaceImage(goodImg);
  assert.strictEqual(res.valid, true);
  assert.ok(Array.isArray(res.faces));
});

test('4. processFaceImage extracts valid biometric ratios', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const processed = manager.processFaceImage(null);
  assert.ok(processed.biometrics.jawWidth > 0.9);
  assert.ok(processed.skinTone.r > 0);
  assert.ok(processed.hairColor.r > 0);
});

test('5. generatePersonalizedHead builds 3D mesh with sculpt deformation', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const headMesh = manager.generatePersonalizedHead(
    { jawWidth: 1.15, noseProminence: 1.2 },
    null,
    { scale: 1.0 }
  );
  assert.ok(headMesh !== null);
  assert.strictEqual(headMesh.name, 'Personalized3DHeadMesh');
  assert.strictEqual(headMesh.geometry.normalsComputed, true);
});

test('6. replaceMannequinHead mounts to head bone and harmonizes skin', () => {
  const mockStudio = new MockStudio3D();
  const manager = new PersonalizedAvatarManager(mockStudio, MockTHREE);
  const headMesh = manager.generatePersonalizedHead({}, null);

  const success = manager.replaceMannequinHead(headMesh);
  assert.strictEqual(success, true);
  assert.strictEqual(manager.isPersonalized, true);
  assert.strictEqual(mockStudio.headBone.children.length, 1);
  assert.strictEqual(mockStudio.hairMesh.visible, true, 'Hair must remain visible');
  assert.strictEqual(mockStudio.eyelashMesh.visible, false, 'Eyelashes must be hidden');
});

test('7. resetToDefaultAvatar restores original mannequin appearance', () => {
  const mockStudio = new MockStudio3D();
  const manager = new PersonalizedAvatarManager(mockStudio, MockTHREE);
  const headMesh = manager.generatePersonalizedHead({}, null);
  manager.replaceMannequinHead(headMesh);

  manager.resetToDefaultAvatar();
  assert.strictEqual(manager.isPersonalized, false);
  assert.strictEqual(mockStudio.headBone.children.length, 0);
  assert.strictEqual(mockStudio.eyelashMesh.visible, true, 'Eyelashes restored');
  assert.strictEqual(mockStudio.hairMesh.visible, true, 'Hair restored');
});

test('8. disposePersonalizedAvatar releases all allocations', () => {
  const mockStudio = new MockStudio3D();
  const manager = new PersonalizedAvatarManager(mockStudio, MockTHREE);
  const headMesh = manager.generatePersonalizedHead({}, null);
  manager.replaceMannequinHead(headMesh);

  manager.disposePersonalizedAvatar();
  assert.strictEqual(manager.isPersonalized, false);
  assert.strictEqual(manager.currentPersonalizedHead, null);
  assert.strictEqual(manager.activeLandmarks, null);
});

test('9. MIXAMO_HEAD_UV_TARGETS accurately anchors head and protects torso (>1560 Y)', () => {
  assert.ok(MIXAMO_HEAD_UV_TARGETS.male, 'Male targets must exist');
  assert.ok(MIXAMO_HEAD_UV_TARGETS.female, 'Female targets must exist');

  // Verify coordinates are strictly above torso boundary (torso is V: 1381-1553)
  assert.ok(MIXAMO_HEAD_UV_TARGETS.male.bounds.y >= 1565, 'Male Y boundary must be >= 1565');
  assert.ok(MIXAMO_HEAD_UV_TARGETS.female.bounds.y >= 1565, 'Female Y boundary must be >= 1565');
  assert.ok(MIXAMO_HEAD_UV_TARGETS.male.chin.y >= 1565, 'Male chin must be above torso');
  assert.ok(MIXAMO_HEAD_UV_TARGETS.female.chin.y >= 1565, 'Female chin must be above torso');

  // Verify anatomical vertical progression on canvas (chin is lower Y than forehead on texture)
  assert.ok(MIXAMO_HEAD_UV_TARGETS.male.forehead.y > MIXAMO_HEAD_UV_TARGETS.male.chin.y);
  assert.ok(MIXAMO_HEAD_UV_TARGETS.female.forehead.y > MIXAMO_HEAD_UV_TARGETS.female.chin.y);
});

test('10. extractFallbackLandmarks extracts valid facial keypoints and contour', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const mockImg = { naturalWidth: 640, naturalHeight: 800 };
  const lm = manager.extractFallbackLandmarks(mockImg);

  assert.ok(lm, 'Landmarks object must exist');
  assert.ok(lm.leftEye && lm.rightEye, 'Eye landmarks must exist');
  assert.ok(lm.chin && lm.forehead, 'Chin and forehead must exist');
  assert.ok(lm.noseTip && lm.mouth, 'Nose tip and mouth must exist');
  assert.ok(Array.isArray(lm.faceOval) && lm.faceOval.length >= 16, 'Face oval contour must have points');
  assert.strictEqual(lm.isFallback, true);
});

test('11. _computeAffineMatrix accurately maps source points to target landmarks', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const src = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 150, y: 250 }
  ];
  const dst = [
    { x: 300, y: 400 },
    { x: 500, y: 400 },
    { x: 400, y: 700 }
  ];
  const M = manager._computeAffineMatrix(src, dst);
  assert.ok(M !== null, 'Matrix must be computed');
  assert.strictEqual(M.length, 6);

  // Helper to apply matrix
  const transform = (p) => ({
    x: Math.round(M[0] * p.x + M[2] * p.y + M[4]),
    y: Math.round(M[1] * p.x + M[3] * p.y + M[5])
  });

  const p0 = transform(src[0]);
  const p1 = transform(src[1]);
  const p2 = transform(src[2]);

  assert.strictEqual(p0.x, dst[0].x);
  assert.strictEqual(p0.y, dst[0].y);
  assert.strictEqual(p1.x, dst[1].x);
  assert.strictEqual(p1.y, dst[1].y);
  assert.strictEqual(p2.x, dst[2].x);
  assert.strictEqual(p2.y, dst[2].y);
});

test('12. processFaceImage attaches active landmarks to result', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const mockImg = { naturalWidth: 800, naturalHeight: 800 };
  const res = manager.processFaceImage(mockImg);

  assert.ok(res.landmarks, 'Processed face must contain landmarks');
  assert.ok(res.landmarks.leftEye && res.landmarks.rightEye);
  assert.ok(manager.activeLandmarks !== null, 'activeLandmarks must be retained on manager');
});

test('13. _computeAffineMatrix maps eyes and mouth with correct vertical orientation (d < 0)', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const targets = MIXAMO_HEAD_UV_TARGETS.male;

  // Photo landmarks (image coords: eyes at y=200, mouth at y=350 below eyes)
  const photo = {
    leftEye: { x: 350, y: 200 },
    rightEye: { x: 150, y: 200 },
    mouth: { x: 250, y: 350 }
  };

  const targetX = targets.bounds.x;
  const targetY = targets.bounds.y;
  const qLeftEye = { x: targets.leftEye.x - targetX, y: targets.leftEye.y - targetY };
  const qRightEye = { x: targets.rightEye.x - targetX, y: targets.rightEye.y - targetY };
  const qMouth = { x: targets.mouth.x - targetX, y: targets.mouth.y - targetY };

  const M = manager._computeAffineMatrix(
    [photo.leftEye, photo.rightEye, photo.mouth],
    [qLeftEye, qRightEye, qMouth]
  );

  assert.ok(M !== null, 'Affine matrix should exist');
  assert.ok(M[3] < 0, `d component (${M[3]}) must be negative to naturally invert orientation for 3D right-side-up`);

  const transform = (p) => ({
    x: M[0] * p.x + M[2] * p.y + M[4],
    y: M[1] * p.x + M[3] * p.y + M[5]
  });

  const photoForehead = { x: 250, y: 100 }; // above eyes in photo
  const mappedForehead = transform(photoForehead);
  const mappedEyes = transform(photo.leftEye);
  const mappedMouth = transform(photo.mouth);

  assert.ok(mappedForehead.y > mappedEyes.y, 'Forehead must have larger Y than eyes on atlas');
  assert.ok(mappedEyes.y > mappedMouth.y, 'Eyes must have larger Y than mouth on atlas');
  assert.ok(targetY + mappedMouth.y >= 1565, 'Mouth on atlas must remain above torso boundary');
});

test('14. extractFallbackLandmarks maintains viewer-right leftEye and calibrated pupil spacing', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const mockImg = { naturalWidth: 1000, naturalHeight: 1000 };
  const lm = manager.extractFallbackLandmarks(mockImg);

  assert.ok(lm.leftEye.x > lm.rightEye.x, 'leftEye (viewer right) must have larger X than rightEye (viewer left)');
  const pupilDist = lm.leftEye.x - lm.rightEye.x;
  assert.ok(pupilDist > 150, 'Pupil distance should reflect natural anatomical spacing (~44% face width)');
  assert.ok(lm.mouth.y > lm.noseTip.y, 'Mouth must be below nose tip');
  assert.ok(lm.chin.y > lm.mouth.y, 'Chin must be below mouth');
});

test('15. MediaPipe async integration preloads and falls back gracefully', async () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  assert.strictEqual(manager.isProcessing, false);

  // Calling extractFacialLandmarks in Node environment gracefully returns fallback
  const mockImg = { naturalWidth: 800, naturalHeight: 800 };
  const lm = await manager.extractFacialLandmarks(mockImg);
  assert.ok(lm !== null);
  assert.strictEqual(lm.isFallback, true);
});

test('16. Eyebrow landmarks (midBrow, leftEyebrow, rightEyebrow) are anchored 1:1 on 3D brow ridge', () => {
  const manager = new PersonalizedAvatarManager(null, MockTHREE);
  const male = MIXAMO_HEAD_UV_TARGETS.male;
  const female = MIXAMO_HEAD_UV_TARGETS.female;

  // Eyebrows exist on both male and female
  assert.ok(male.leftEyebrow && male.rightEyebrow && male.midBrow, 'Male eyebrow targets must exist');
  assert.ok(female.leftEyebrow && female.rightEyebrow && female.midBrow, 'Female eyebrow targets must exist');

  // Eyebrows are above eye sockets on texture atlas (Y_brow > Y_eye)
  assert.ok(male.leftEyebrow.y > male.leftEye.y, 'Male eyebrows must be above eyes on atlas');
  assert.ok(female.leftEyebrow.y > female.leftEye.y, 'Female eyebrows must be above eyes on atlas');

  // Eyebrows are below forehead hairline on texture atlas (Y_forehead > Y_brow)
  assert.ok(male.forehead.y > male.leftEyebrow.y, 'Male forehead must be above eyebrows on atlas');
  assert.ok(female.forehead.y > female.leftEyebrow.y, 'Female forehead must be above eyebrows on atlas');

  // Viewer-right orientation: leftEyebrow (viewer right) has larger X than rightEyebrow (viewer left)
  assert.ok(male.leftEyebrow.x > male.rightEyebrow.x, 'leftEyebrow must be viewer-right (larger X)');
  assert.ok(female.leftEyebrow.x > female.rightEyebrow.x, 'female leftEyebrow must be viewer-right (larger X)');

  // Fallback landmarks include valid eyebrow anchors
  const mockImg = { naturalWidth: 1000, naturalHeight: 1000 };
  const lm = manager.extractFallbackLandmarks(mockImg);
  assert.ok(lm.leftEyebrow && lm.rightEyebrow && lm.midBrow, 'Fallback landmarks must provide eyebrows');
  assert.ok(lm.leftEyebrow.y < lm.leftEye.y, 'In photo coordinates, eyebrows must be above eyes (y_brow < y_eye)');
  assert.ok(lm.forehead.y < lm.leftEyebrow.y, 'In photo coordinates, forehead must be above eyebrows (y_forehead < y_brow)');
  assert.ok(lm.leftEyebrow.x > lm.rightEyebrow.x, 'Fallback leftEyebrow must be viewer-right (larger X)');
});

console.log('--------------------------------------------------');
if (failed === 0) {
  console.log(`SUCCESS: All ${passed} PersonalizedAvatarManager tests passed.\n`);
} else {
  console.error(`FAILED: ${failed} tests failed.\n`);
  process.exit(1);
}

