const fs = require('fs');

const buf = fs.readFileSync('avatar_male.glb');
const chunkLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + chunkLen));

const prim0 = gltf.meshes[0].primitives[0];
const uvAcc0 = gltf.accessors[prim0.attributes.TEXCOORD_0];
console.log('Ch31_Body TEXCOORD_0 Accessor:', uvAcc0);

const prim2 = gltf.meshes[2].primitives[0];
const uvAcc2 = gltf.accessors[prim2.attributes.TEXCOORD_0];
console.log('Ch31_Sweater TEXCOORD_0 Accessor:', uvAcc2);
