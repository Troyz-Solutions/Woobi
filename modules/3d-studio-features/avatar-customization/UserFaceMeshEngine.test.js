/**
 * Woobi - 3D Studio Features
 * UserFaceMeshEngine.test.js - Unit & Specification Tests for Free Hybrid Method 2 & 3
 */

import assert from 'assert';
import {
  UserFaceMeshEngine,
  FACE_UV_BOUNDS,
  FEMALE_FACE_UV_BOUNDS,
  MALE_FACE_UV_BOUNDS,
  DEFAULT_BIOMETRICS
} from './UserFaceMeshEngine.js';

// Mock Three.js Mesh and Geometry for headless Node.js testing
class MockBufferAttribute {
  constructor(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
    this.count = array.length / itemSize;
    this.needsUpdate = false;
  }
  getY(index) {
    return this.array[index * this.itemSize + 1];
  }
}

class MockBufferGeometry {
  constructor(vertexCount = 100) {
    const array = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      // Synthesize realistic human head and body vertices
      if (i < 40) {
        // Body vertices below head (y: 0.5 to 1.30)
        array[i3] = (Math.random() - 0.5) * 0.4;
        array[i3 + 1] = 0.5 + (i / 40) * 0.8;
        array[i3 + 2] = (Math.random() - 0.5) * 0.2;
      } else {
        // Head vertices above 1.36m (y: 1.38 to 1.65)
        const t = (i - 40) / 60;
        array[i3] = (Math.random() - 0.5) * 0.16; // x: -0.08 to +0.08
        array[i3 + 1] = 1.38 + t * 0.26;          // y: 1.38 to 1.64
        array[i3 + 2] = 0.01 + Math.random() * 0.10; // front z: 0.01 to 0.11
      }
    }
    this.attributes = {
      position: new MockBufferAttribute(array, 3)
    };
    this.normalsComputed = false;
  }
  computeVertexNormals() {
    this.normalsComputed = true;
  }
}

class MockMesh {
  constructor(name = 'Ch37_Body', vertexCount = 100) {
    this.name = name;
    this.isMesh = true;
    this.uuid = 'mock-mesh-' + Math.random().toString(36).substring(2, 9);
    this.geometry = new MockBufferGeometry(vertexCount);
    this.material = {
      uuid: 'mock-mat-' + Math.random().toString(36).substring(2, 9),
      map: { image: {}, needsUpdate: false }
    };
  }
  traverse(cb) {
    cb(this);
  }
}

class MockStudio3D {
  constructor() {
    this.headMesh = new MockMesh('Ch37_Body', 100);
    this.gltfAvatarGroup = {
      traverse: (cb) => {
        this.headMesh.traverse(cb);
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
console.log('  USER FACE MESH ENGINE — HYBRID 2 & 3 TESTS       ');
console.log('==================================================');

test('FACE_UV_BOUNDS matches avatar head coordinates', () => {
  assert.strictEqual(FACE_UV_BOUNDS.x, 1100);
  assert.strictEqual(FACE_UV_BOUNDS.y, 1340);
  assert.strictEqual(FACE_UV_BOUNDS.width, 500);
  assert.strictEqual(FACE_UV_BOUNDS.height, 440);
  assert.ok(FACE_UV_BOUNDS.uMin >= 0 && FACE_UV_BOUNDS.uMax <= 1);
  assert.ok(FACE_UV_BOUNDS.vMin >= 0 && FACE_UV_BOUNDS.vMax <= 1);
  
  // Male Face UV Bounds
  assert.strictEqual(MALE_FACE_UV_BOUNDS.x, 1250);
  assert.strictEqual(MALE_FACE_UV_BOUNDS.y, 1360);
  assert.strictEqual(MALE_FACE_UV_BOUNDS.width, 500);
  assert.strictEqual(MALE_FACE_UV_BOUNDS.height, 460);
  assert.ok(MALE_FACE_UV_BOUNDS.uMin >= 0 && MALE_FACE_UV_BOUNDS.uMax <= 1);
  assert.ok(MALE_FACE_UV_BOUNDS.vMin >= 0 && MALE_FACE_UV_BOUNDS.vMax <= 1);
});

test('DEFAULT_BIOMETRICS defines neutral biometric proportions', () => {
  assert.strictEqual(DEFAULT_BIOMETRICS.jawWidth, 1.0);
  assert.strictEqual(DEFAULT_BIOMETRICS.chinShape, 0.5);
  assert.strictEqual(DEFAULT_BIOMETRICS.noseProminence, 1.0);
  assert.strictEqual(DEFAULT_BIOMETRICS.cheekProminence, 1.0);
  assert.ok(DEFAULT_BIOMETRICS.skinTone.r > 0);
});

test('analyzeFaceLandmarks returns valid biometrics on null/missing input', () => {
  const engine = new UserFaceMeshEngine();
  const bio = engine.analyzeFaceLandmarks(null);
  assert.strictEqual(bio.jawWidth, 1.0);
  assert.strictEqual(bio.chinShape, 0.5);
  assert.strictEqual(bio.noseProminence, 1.0);
});

test('findHeadMeshes accurately locates body/head meshes in studio', () => {
  const mockStudio = new MockStudio3D();
  const engine = new UserFaceMeshEngine(mockStudio);
  const meshes = engine.findHeadMeshes();
  assert.strictEqual(meshes.length, 1);
  assert.strictEqual(meshes[0].name, 'Ch37_Body');
});

test('applyParametricDeformation creates non-destructive vertex backup', () => {
  const mockStudio = new MockStudio3D();
  const engine = new UserFaceMeshEngine(mockStudio);
  const mesh = mockStudio.headMesh;
  const originalX = mesh.geometry.attributes.position.array[40 * 3]; // First head vertex

  engine.applyParametricDeformation({
    ...DEFAULT_BIOMETRICS,
    jawWidth: 1.25,
    chinShape: 0.9,
    noseProminence: 1.25
  });

  assert.ok(engine.originalVertices.has(mesh.uuid), 'Original vertices must be cached');
  const backup = engine.originalVertices.get(mesh.uuid);
  assert.strictEqual(backup[40 * 3], originalX, 'Backup must preserve pristine vertex coordinate');
  assert.strictEqual(mesh.geometry.normalsComputed, true, 'Normals must be recomputed');
  assert.strictEqual(mesh.geometry.attributes.position.needsUpdate, true);
});

test('applyParametricDeformation does NOT mutate vertices below head threshold', () => {
  const mockStudio = new MockStudio3D();
  const engine = new UserFaceMeshEngine(mockStudio);
  const mesh = mockStudio.headMesh;
  const bodyVertexY = mesh.geometry.attributes.position.array[10 * 3 + 1]; // Body vertex below 1.36m
  assert.ok(bodyVertexY < 1.36, 'Vertex 10 must be below head threshold');

  engine.applyParametricDeformation({
    ...DEFAULT_BIOMETRICS,
    jawWidth: 1.3,
    chinShape: 1.0
  });

  const postY = mesh.geometry.attributes.position.array[10 * 3 + 1];
  assert.strictEqual(postY, bodyVertexY, 'Sub-head vertices must remain untouched');
});

test('resetToDefault restores 3D vertices exactly to original coordinates', () => {
  const mockStudio = new MockStudio3D();
  const engine = new UserFaceMeshEngine(mockStudio);
  const mesh = mockStudio.headMesh;
  const pristineArray = new Float32Array(mesh.geometry.attributes.position.array);

  // Apply aggressive deformation
  engine.applyParametricDeformation({
    ...DEFAULT_BIOMETRICS,
    jawWidth: 1.35,
    chinShape: 0.1,
    noseProminence: 1.30,
    cheekProminence: 1.25
  }, 1.5);

  assert.strictEqual(engine.isApplied, true);

  // 1-Tap Reset
  engine.resetToDefault();
  assert.strictEqual(engine.isApplied, false);

  const restoredArray = mesh.geometry.attributes.position.array;
  for (let i = 0; i < pristineArray.length; i++) {
    assert.strictEqual(restoredArray[i], pristineArray[i], `Vertex byte ${i} must match pristine original`);
  }
});

test('dispose clears all memory allocations and restores geometry', () => {
  const mockStudio = new MockStudio3D();
  const engine = new UserFaceMeshEngine(mockStudio);
  engine.applyParametricDeformation();
  assert.strictEqual(engine.originalVertices.size, 1);

  engine.dispose();
  assert.strictEqual(engine.originalVertices.size, 0, 'Vertex backup cache must be emptied');
  assert.strictEqual(engine.originalTextures.size, 0, 'Texture cache must be emptied');
  assert.strictEqual(engine.isApplied, false);
});

console.log('--------------------------------------------------');
if (failed === 0) {
  console.log(`SUCCESS: All ${passed} UserFaceMeshEngine tests passed.\n`);
} else {
  console.error(`FAILED: ${failed} tests failed.\n`);
  process.exit(1);
}
