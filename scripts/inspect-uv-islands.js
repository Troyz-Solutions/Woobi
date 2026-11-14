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
      if (!shirtMesh) return { error: 'No shirt' };
      const uv = shirtMesh.geometry.attributes.uv;
      const norm = shirtMesh.geometry.attributes.normal;
      const pos = shirtMesh.geometry.attributes.position;
      
      const frontUVs = [];
      const backUVs = [];
      const sleeveLeftUVs = [];
      const sleeveRightUVs = [];
      
      let fUmin = 1, fUmax = 0, fVmin = 1, fVmax = 0;
      let bUmin = 1, bUmax = 0, bVmin = 1, bVmax = 0;

      for (let i = 0; i < uv.count; i++) {
        // normalized UV 0 to 1
        const u = uv.getX(i) / (uv.normalized ? 65535 : 1);
        const v = uv.getY(i) / (uv.normalized ? 65535 : 1);
        const nz = norm.getZ(i);
        const nx = norm.getX(i);
        const x = pos.getX(i);

        if (nz > 0.25 && Math.abs(x) < 15000) {
          if (u < fUmin) fUmin = u;
          if (u > fUmax) fUmax = u;
          if (v < fVmin) fVmin = v;
          if (v > fVmax) fVmax = v;
          frontUVs.push([+u.toFixed(3), +v.toFixed(3)]);
        } else if (nz < -0.25 && Math.abs(x) < 15000) {
          if (u < bUmin) bUmin = u;
          if (u > bUmax) bUmax = u;
          if (v < bVmin) bVmin = v;
          if (v > bVmax) bVmax = v;
          backUVs.push([+u.toFixed(3), +v.toFixed(3)]);
        }
      }

      return {
        frontTorsoUVBounds: { uMin: +fUmin.toFixed(3), uMax: +fUmax.toFixed(3), vMin: +fVmin.toFixed(3), vMax: +fVmax.toFixed(3) },
        backTorsoUVBounds: { uMin: +bUmin.toFixed(3), uMax: +bUmax.toFixed(3), vMin: +bVmin.toFixed(3), vMax: +bVmax.toFixed(3) },
        frontSample: frontUVs.slice(0, 10),
        backSample: backUVs.slice(0, 10)
      };
    })()`,
    returnByValue: true
  });
  console.log('UV Islands:', JSON.stringify(evalRes.result.value, null, 2));
  ws.close();
}
run().catch(console.error);
