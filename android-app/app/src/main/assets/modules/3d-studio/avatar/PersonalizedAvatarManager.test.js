/**
 * Woobi - 3D Studio Avatar Module
 * PersonalizedAvatarManager.test.js - Unit and Lifecycle Tests for 3D Face Integration
 */

import assert from 'assert';
import { PersonalizedAvatarManager, DEFAULT_HEAD_CONFIG } from './PersonalizedAvatarManager.js';

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
});

console.log('--------------------------------------------------');
if (failed === 0) {
  console.log(`SUCCESS: All ${passed} PersonalizedAvatarManager tests passed.\n`);
} else {
  console.error(`FAILED: ${failed} tests failed.\n`);
  process.exit(1);
}
