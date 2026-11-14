const fs = require('fs');

function inspectGlb(path) {
  const buf = fs.readFileSync(path);
  const magic = buf.readUInt32LE(0);
  const version = buf.readUInt32LE(4);
  const length = buf.readUInt32LE(8);
  const chunk0Length = buf.readUInt32LE(12);
  const chunk0Type = buf.readUInt32LE(16); // 0x4E4F534A is JSON
  const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonStr);
  console.log('Meshes in', path, ':');
  gltf.meshes.forEach((m, idx) => {
    console.log(` Mesh ${idx}: ${m.name}`);
    m.primitives.forEach((p, pIdx) => {
      console.log(`   Prim ${pIdx}: attrs =`, Object.keys(p.attributes).join(', '));
    });
  });
}

inspectGlb('assets/models/avatar_female.glb');
inspectGlb('assets/models/avatar_male.glb');
