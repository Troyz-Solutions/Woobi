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
      const meshInfo = {};
      avatar.traverse(c => {
        if (c.isMesh) {
          const uv = c.geometry.attributes.uv;
          if (!uv) return;
          const norm = c.geometry.attributes.normal;
          const pos = c.geometry.attributes.position;
          
          let uSum = 0, vSum = 0, count = uv.count;
          let uMin = 1, uMax = 0, vMin = 1, vMax = 0;
          
          // Separate front and back
          let fCount = 0, bCount = 0;
          let fuMin = 1, fuMax = 0, fvMin = 1, fvMax = 0;
          let buMin = 1, buMax = 0, bvMin = 1, bvMax = 0;

          for (let i = 0; i < count; i++) {
            const u = uv.getX(i) / (uv.normalized ? 65535 : 1);
            const v = uv.getY(i) / (uv.normalized ? 65535 : 1);
            uSum += u; vSum += v;
            if (u < uMin) uMin = u;
            if (u > uMax) uMax = u;
            if (v < vMin) vMin = v;
            if (v > vMax) vMax = v;

            const nz = norm ? norm.getZ(i) : 0;
            if (nz > 0.2) {
              fCount++;
              if (u < fuMin) fuMin = u; if (u > fuMax) fuMax = u;
              if (v < fvMin) fvMin = v; if (v > fvMax) fvMax = v;
            } else if (nz < -0.2) {
              bCount++;
              if (u < buMin) buMin = u; if (u > buMax) buMax = u;
              if (v < bvMin) bvMin = v; if (v > bvMax) bvMax = v;
            }
          }

          meshInfo[c.name] = {
            totalBounds: { uMin: +uMin.toFixed(3), uMax: +uMax.toFixed(3), vMin: +vMin.toFixed(3), vMax: +vMax.toFixed(3) },
            center: { u: +(uSum/count).toFixed(3), v: +(vSum/count).toFixed(3) },
            frontBounds: { count: fCount, uMin: +fuMin.toFixed(3), uMax: +fuMax.toFixed(3), vMin: +fvMin.toFixed(3), vMax: +fvMax.toFixed(3) },
            backBounds: { count: bCount, uMin: +buMin.toFixed(3), uMax: +buMax.toFixed(3), vMin: +bvMin.toFixed(3), vMax: +bvMax.toFixed(3) }
          };
        }
      });
      return meshInfo;
    })()`,
    returnByValue: true
  });
  console.log('UV Atlas Layout:', JSON.stringify(evalRes.result.value, null, 2));
  ws.close();
}
run().catch(console.error);

