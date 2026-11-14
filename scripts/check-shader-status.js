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
      const mat = shirtMesh.material;
      return {
        hasProgram: !!mat.program,
        isCloned: !!mat._isClonedGarment,
        hasMap: !!mat.map
      };
    })()`,
    returnByValue: true
  });
  console.log('Shader Status:', evalRes.result.value);
  ws.close();
}
run().catch(console.error);
