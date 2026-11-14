const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(process.cwd(), '.chrome_cdp_profile');

async function run() {
  const chrome = spawn(CHROME_PATH, ['--headless=new', '--remote-debugging-port=9222', '--user-data-dir=' + USER_DATA, '--disable-gpu', '--window-size=412,915', 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
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
      return;
    }
    if (d.method === 'Runtime.exceptionThrown') {
      console.log('EXCEPTION:', d.params.exceptionDetails);
    }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:8085/?screen=today' });
  await new Promise(r => setTimeout(r, 4000));

  const errs = await send('Runtime.evaluate', {
    expression: `({
      hasStudio3D: !!window.Studio3D,
      sceneChildrenCount: window.Studio3D?.scene?.children?.length,
      sceneChildren: window.Studio3D?.scene?.children?.map(c => c.name),
      isFallbackHidden: document.getElementById('seren3dFallback')?.hidden
    })`,
    returnByValue: true
  });
  console.log('STUDIO STATE:', JSON.stringify(errs.result.value, null, 2));
  ws.close();
  chrome.kill();
}
run();
