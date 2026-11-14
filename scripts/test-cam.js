const fs = require('fs');

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await res.json();
  const appTab = tabs.find(t => t.url.includes('localhost:8080'));
  if (!appTab) return;

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

  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.Studio3D;
      if (!s) return;
      // Update presets in runtime
      if (window.CAMERA_PRESETS?.AVATAR_FULL_BODY) {
        window.CAMERA_PRESETS.AVATAR_FULL_BODY.position = { x: 0.0, y: 1.15, z: 3.30 };
        window.CAMERA_PRESETS.AVATAR_FULL_BODY.target = { x: 0.0, y: 0.90, z: 0.0 };
        window.CAMERA_PRESETS.AVATAR_FULL_BODY.fovPortrait = 52;
      }
      if (s.cameraStates?.AVATAR_FULL_BODY) {
        s.cameraStates.AVATAR_FULL_BODY.position.set(0.0, 1.15, 3.30);
        s.cameraStates.AVATAR_FULL_BODY.target.set(0.0, 0.90, 0.0);
        s.cameraStates.AVATAR_FULL_BODY.fovPortrait = 52;
      }
      if (s.cameraController) {
        if (s.cameraController.transitions) {
          s.cameraController.transitions.targetCameraPos?.set(0.0, 1.15, 3.30);
          s.cameraController.transitions.targetCameraLookAt?.set(0.0, 0.90, 0.0);
        }
        s.cameraController.setCameraPreset('AVATAR_FULL_BODY');
      }
      s.setCameraState('AVATAR_FULL_BODY');
    })()`
  });

  // Wait for lerp to complete (transitions take ~1-2 seconds)
  await new Promise(r => setTimeout(r, 2200));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = `C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/test-full-dress-view.png`;
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`Saved test-full-dress-view.png`);
  ws.close();
}

run().catch(console.error);
