async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await res.json();
  const appTab = tabs.find(t => t.url.includes('localhost:8080'));
  const ws = new WebSocket(appTab.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const curId = id++;
      pending.set(curId, { resolve, reject });
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }
  await new Promise(r => ws.onopen = r);
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) {
      const { resolve, reject } = pending.get(d.id);
      pending.delete(d.id);
      if (d.error) reject(d.error); else resolve(d.result);
    }
  };

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.Studio3D;
      const avatar = s.gltfAvatarGroup;
      let shirtMesh = null;
      let pantsMesh = null;
      avatar.traverse(c => {
        if (c.isMesh) {
          if (c.name.includes('Shirt') || c.name.includes('Sweater')) shirtMesh = c;
          if (c.name.includes('Pants')) pantsMesh = c;
        }
      });
      
      function getMeshWorldBounds(mesh) {
        if (!mesh) return null;
        mesh.updateMatrixWorld(true);
        const geom = mesh.geometry;
        const pos = geom.attributes.position;
        const v = new window.THREE.Vector3();
        let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
        
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          v.applyMatrix4(mesh.matrixWorld);
          if (v.x < minX) minX = v.x;
          if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
          if (v.z < minZ) minZ = v.z;
          if (v.z > maxZ) maxZ = v.z;
        }
        return {
          minX: +minX.toFixed(3),
          maxX: +maxX.toFixed(3),
          minY: +minY.toFixed(3),
          maxY: +maxY.toFixed(3),
          minZ: +minZ.toFixed(3),
          maxZ: +maxZ.toFixed(3),
          width: +(maxX - minX).toFixed(3),
          height: +(maxY - minY).toFixed(3),
          depth: +(maxZ - minZ).toFixed(3)
        };
      }

      return {
        shirtBounds: getMeshWorldBounds(shirtMesh),
        pantsBounds: getMeshWorldBounds(pantsMesh)
      };
    })()`,
    returnByValue: true
  });
  console.log('Garment 3D Bounds in World Space:', JSON.stringify(evalRes.result.value, null, 2));
  ws.close();
}
run().catch(console.error);
