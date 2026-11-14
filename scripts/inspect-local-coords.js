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
      avatar.traverse(c => {
        if (c.isMesh && (c.name.includes('Shirt') || c.name.includes('Sweater'))) shirtMesh = c;
      });
      if (!shirtMesh) return { error: 'No shirt' };
      const pos = shirtMesh.geometry.attributes.position;
      const norm = shirtMesh.geometry.attributes.normal;
      
      let fXmin = 1e9, fXmax = -1e9, fYmin = 1e9, fYmax = -1e9, fZmin = 1e9, fZmax = -1e9;
      let bXmin = 1e9, bXmax = -1e9, bYmin = 1e9, bYmax = -1e9;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const nz = norm.getZ(i);

        if (nz > 0.1) {
          if (x < fXmin) fXmin = x;
          if (x > fXmax) fXmax = x;
          if (y < fYmin) fYmin = y;
          if (y > fYmax) fYmax = y;
          if (z < fZmin) fZmin = z;
          if (z > fZmax) fZmax = z;
        } else if (nz < -0.1) {
          if (x < bXmin) bXmin = x;
          if (x > bXmax) bXmax = x;
          if (y < bYmin) bYmin = y;
          if (y > bYmax) bYmax = y;
        }
      }

      return {
        isNormalized: pos.normalized,
        format: pos.array.constructor.name,
        frontBounds: { minX: fXmin, maxX: fXmax, minY: fYmin, maxY: fYmax, minZ: fZmin, maxZ: fZmax },
        backBounds: { minX: bXmin, maxX: bXmax, minY: bYmin, maxY: bYmax }
      };
    })()`,
    returnByValue: true
  });
  console.log('Local Shirt Position Bounds:', JSON.stringify(evalRes.result.value, null, 2));
  ws.close();
}
run().catch(console.error);
