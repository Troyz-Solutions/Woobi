const fs = require('fs');

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
        if (c.isMesh && (c.name === 'Ch37_Shirt' || c.name === 'Ch31_Sweater')) shirtMesh = c;
      });
      if (!shirtMesh) return { error: 'No shirt mesh' };
      const uv = shirtMesh.geometry.attributes.uv;
      const pos = shirtMesh.geometry.attributes.position;
      const norm = shirtMesh.geometry.attributes.normal;
      
      let frontUmin = 1, frontUmax = 0, frontVmin = 1, frontVmax = 0;
      let backUmin = 1, backUmax = 0, backVmin = 1, backVmax = 0;
      let frontCount = 0, backCount = 0;

      for (let i = 0; i < pos.count; i++) {
        const nz = norm ? norm.getZ(i) : 0;
        const u = uv.getX(i);
        const v = uv.getY(i);
        if (nz > 0.1) {
          frontCount++;
          if (u < frontUmin) frontUmin = u;
          if (u > frontUmax) frontUmax = u;
          if (v < frontVmin) frontVmin = v;
          if (v > frontVmax) frontVmax = v;
        } else if (nz < -0.1) {
          backCount++;
          if (u < backUmin) backUmin = u;
          if (u > backUmax) backUmax = u;
          if (v < backVmin) backVmin = v;
          if (v > backVmax) backVmax = v;
        }
      }

      return {
        meshName: shirtMesh.name,
        vertexCount: pos.count,
        frontCount,
        backCount,
        frontUV: { uMin: frontUmin, uMax: frontUmax, vMin: frontVmin, vMax: frontVmax },
        backUV: { uMin: backUmin, uMax: backUmax, vMin: backVmin, vMax: backVmax }
      };
    })()`,
    returnByValue: true
  });
  console.log('UV Inspection:', JSON.stringify(evalRes.result?.value, null, 2));
  ws.close();
}
run().catch(console.error);
