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
      if (!avatar) return { error: 'No avatar group' };
      const meshes = [];
      avatar.traverse(c => {
        if (c.isMesh) {
          const uv = c.geometry.attributes.uv;
          const pos = c.geometry.attributes.position;
          const norm = c.geometry.attributes.normal;
          
          let uMin = 1e9, uMax = -1e9, vMin = 1e9, vMax = -1e9;
          let xMin = 1e9, xMax = -1e9, yMin = 1e9, yMax = -1e9, zMin = 1e9, zMax = -1e9;
          
          if (uv) {
            for (let i = 0; i < uv.count; i++) {
              const u = uv.getX(i);
              const v = uv.getY(i);
              if (u < uMin) uMin = u;
              if (u > uMax) uMax = u;
              if (v < vMin) vMin = v;
              if (v > vMax) vMax = v;
            }
          }

          if (pos) {
            for (let i = 0; i < pos.count; i++) {
              const x = pos.getX(i);
              const y = pos.getY(i);
              const z = pos.getZ(i);
              if (x < xMin) xMin = x;
              if (x > xMax) xMax = x;
              if (y < yMin) yMin = y;
              if (y > yMax) yMax = y;
              if (z < zMin) zMin = z;
              if (z > zMax) zMax = z;
            }
          }

          meshes.push({
            name: c.name,
            matNames: Array.isArray(c.material) ? c.material.map(m => m.name) : (c.material ? c.material.name : 'none'),
            posBounds: { xMin: +xMin.toFixed(3), xMax: +xMax.toFixed(3), yMin: +yMin.toFixed(3), yMax: +yMax.toFixed(3), zMin: +zMin.toFixed(3), zMax: +zMax.toFixed(3) },
            uvBounds: { uMin: +uMin.toFixed(3), uMax: +uMax.toFixed(3), vMin: +vMin.toFixed(3), vMax: +vMax.toFixed(3) },
            uvNormalized: uv ? uv.normalized : false,
            uvFormat: uv ? uv.array.constructor.name : null
          });
        }
      });
      return meshes;
    })()`,
    returnByValue: true
  });
  console.log('Avatar Meshes:', JSON.stringify(evalRes.result.value, null, 2));
  ws.close();
}
run().catch(console.error);
