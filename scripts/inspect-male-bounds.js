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
    expression: `(async () => {
      const s = window.Studio3D;
      await s.setAvatarGender('male');
      const avatar = s.gltfAvatarGroup;
      const list = [];
      avatar.traverse(c => {
        if (c.isMesh) {
          const pos = c.geometry.attributes.position;
          let minX=1e9, maxX=-1e9, minY=1e9, maxY=-1e9;
          if (pos) {
            for (let i = 0; i < pos.count; i++) {
              const x = pos.getX(i); const y = pos.getY(i);
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
          list.push({
            name: c.name,
            norm: pos ? pos.normalized : false,
            bounds: { minX, maxX, minY, maxY }
          });
        }
      });
      return list;
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Male avatar meshes:', JSON.stringify(evalRes.result.value, null, 2));
  ws.close();
}
run().catch(console.error);

