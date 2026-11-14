const fs = require('fs');

function inspectGlbMeshBounds(path, meshIndex, meshName) {
  const buf = fs.readFileSync(path);
  const chunk0Length = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonStr);
  const mesh = gltf.meshes[meshIndex];
  const prim = mesh.primitives[0];
  const posAccIdx = prim.attributes.POSITION;
  const acc = gltf.accessors[posAccIdx];
  console.log(`Mesh ${meshIndex} (${meshName}) in ${path}:`);
  console.log(' Min:', acc.min);
  console.log(' Max:', acc.max);
}

inspectGlbMeshBounds('assets/models/avatar_female.glb', 2, 'Ch37_Shirt');
inspectGlbMeshBounds('assets/models/avatar_female.glb', 0, 'Ch37_Pants');
inspectGlbMeshBounds('assets/models/avatar_male.glb', 2, 'Ch31_Sweater');
inspectGlbMeshBounds('assets/models/avatar_male.glb', 1, 'Ch31_Pants');
