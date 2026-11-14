const fs = require('fs');

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await res.json();
  const appTab = tabs.find(t => t.url.includes('localhost:8080'));
  if (!appTab) { console.error('No app tab found'); return; }

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
    expression: `
      (() => {
        const s = window.Studio3D;
        if (!s) return { error: 'No Studio3D' };
        const avatar = s.gltfAvatarGroup;
        if (!avatar) return { error: 'No gltfAvatarGroup', sculpted: !!s.sculptedAvatarGroup };
        const meshes = [];
        avatar.traverse(c => {
          if (c.isMesh) {
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            meshes.push({
              name: c.name,
              visible: c.visible,
              materials: mats.map(m => ({
                name: m.name,
                color: '#' + (m.color ? m.color.getHexString() : 'none'),
                hasMap: !!m.map,
                metalness: m.metalness,
                roughness: m.roughness,
                type: m.type
              }))
            });
          }
        });
        return {
          gender: s.avatarConfig ? s.avatarConfig.gender : null,
          activeAvatarType: s.activeAvatarType,
          cameraPos: s.camera ? [s.camera.position.x, s.camera.position.y, s.camera.position.z] : null,
          cameraTarget: s.controls ? [s.controls.target.x, s.controls.target.y, s.controls.target.z] : null,
          avatarPos: avatar.position,
          avatarVisible: avatar.visible,
          avatarScale: avatar.scale,
          meshes
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Studio state:', JSON.stringify(evalRes.result ? evalRes.result.value : evalRes, null, 2));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/live-chrome-debug.png', Buffer.from(shot.data, 'base64'));
  console.log('Screenshot saved to live-chrome-debug.png');
  ws.close();
}

run().catch(console.error);

