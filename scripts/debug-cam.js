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
      return {
        camPos: [s.camera.position.x, s.camera.position.y, s.camera.position.z],
        fov: s.camera.fov,
        currentPreset: s.cameraController?.transitions?.currentPreset,
        targetPos: s.cameraController?.transitions?.targetCameraPos,
        controllerTransitions: !!s.cameraController?.transitions,
        hasCameraController: !!s.cameraController,
        currentCameraState: s.currentCameraState,
        cameraStates: s.cameraStates
      };
    })()`,
    returnByValue: true
  });
  console.log('Camera debug:', JSON.stringify(evalRes.result?.value, null, 2));
  ws.close();
}
run().catch(console.error);
