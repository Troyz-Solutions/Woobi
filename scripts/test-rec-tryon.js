const fs = require('fs');
const WebSocket = globalThis.WebSocket;

async function run() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/E4C64EED086DB24F6B7B4E1EB92A2961');
  await new Promise(r => ws.onopen = r);

  const testCode = `(() => {
    try {
      // 1. Open daily recommendation
      window.app.openDailyRecommendation();

      // 2. Click Try On button
      setTimeout(() => {
        window.app.tryOnRecommendedOutfit();
      }, 500);

      return { status: 'triggered' };
    } catch (e) {
      return { error: e.message };
    }
  })()`;

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression: testCode, returnByValue: true }
  }));

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  const checkState = `(() => {
    const s = window.Studio3D;
    return {
      currentScreen: window.app.state.currentScreen,
      hasStudio: !!s,
      avatarRootVisible: s?.avatarRoot?.visible,
      avatarRootChildren: s?.avatarRoot?.children.map(c => ({ name: c.name, visible: c.visible })),
      cameraPos: s?.camera?.position,
      currentCameraState: s?.currentCameraState
    };
  })()`;

  ws.send(JSON.stringify({
    id: 2,
    method: 'Runtime.evaluate',
    params: { expression: checkState, returnByValue: true }
  }));

  ws.send(JSON.stringify({
    id: 3,
    method: 'Page.captureScreenshot',
    params: { format: 'png' }
  }));

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 2) {
      console.log('State after tryOnRecommendedOutfit:', JSON.stringify(data.result.result.value, null, 2));
    }
    if (data.id === 3 && data.result && data.result.data) {
      fs.writeFileSync('scripts/after-rec-tryon.png', Buffer.from(data.result.data, 'base64'));
      console.log('Saved after-rec-tryon.png');
      ws.close();
    }
  };
}

run().catch(console.error);
