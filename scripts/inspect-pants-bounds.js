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
      let pantsMesh = null;
      avatar.traverse(c => {
        if (c.isMesh && c.name.includes('Pants')) pantsMesh = c;
      });
      if (!pantsMesh) return { error: 'No pants' };
      const pos = pantsMesh.geometry.attributes.position;
      const norm = pantsMesh.geometry.attributes.normal;
      
      let fXmin = 1e9, fXmax = -1e9, fYmin = 1e9, fYmax = -1e9;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        if (x < fXmin) fXmin = x;
        if (x > fXmax) fXmax = x;
        if (y < fYmin) fYmin = y;
        if (y > fYmax) fYmax = y;
      }

      return {
        isNormalized: pos.normalized,
        format: pos.array.constructor.name,
        bounds: { minX: fXmin, maxX: fXmax, minY: fYmin, maxY: fYmax }
      };
    })()`,
    returnByValue: true
  });
  console.log('Local Pants Position Bounds:', JSON.stringify(evalRes.result.value, null, 2));
  ws.close();
}
run().catch(console.error);
