const fs = require('fs');

function inspectGlbNodes(path) {
  const buf = fs.readFileSync(path);
  const chunk0Length = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonStr);
  console.log('Nodes in', path, ':');
  gltf.nodes.forEach((n, idx) => {
    if (n.mesh !== undefined) {
      console.log(` Node ${idx}: "${n.name}" -> Mesh ${n.mesh}`);
    }
  });
}

inspectGlbNodes('assets/models/avatar_female.glb');
inspectGlbNodes('assets/models/avatar_male.glb');

