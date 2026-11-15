const fs = require('fs');
const buf = fs.readFileSync('avatar_male.glb');
const chunkLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + chunkLen));

console.log('Nodes in avatar_male.glb:');
gltf.nodes.forEach((n, idx) => {
  if (n.mesh !== undefined) {
    console.log(`Node ${idx}: name="${n.name}", mesh=${n.mesh}`);
  }
});

console.log('\nMeshes in avatar_male.glb:');
gltf.meshes.forEach((m, idx) => {
  console.log(`Mesh ${idx}: name="${m.name}"`);
});
