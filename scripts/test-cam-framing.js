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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.Studio3D;
      s.camera.position.set(-0.10, 1.25, 4.75);
      s.currentCameraLookAt.set(-0.10, 0.92, -0.15);
      s.targetCameraPos.set(-0.10, 1.25, 4.75);
      s.targetCameraLookAt.set(-0.10, 0.92, -0.15);
      s.camera.fov = 57;
      s.camera.updateProjectionMatrix();
    })()`
  });

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/test-mobile-shoes-visible.png', Buffer.from(shot.data, 'base64'));
  console.log('Mobile screenshot with shoes saved successfully!');
  ws.close();
}
run();

