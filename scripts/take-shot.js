const { spawn } = require('child_process');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(process.cwd(), '.chrome_cdp_profile');

async function check() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + USER_DATA,
    '--use-gl=angle',
    '--use-angle=d3d11',
    'about:blank'
  ], { stdio: 'ignore' });
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
    }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  const targetScreen = process.argv[2] || 'today';
  console.log(`Navigating to http://localhost:8085/?screen=${targetScreen}...`);
  await send('Page.navigate', { url: `http://localhost:8085/?screen=${targetScreen}` });

  if (targetScreen === 'today') {
    // Wait for GLTFAvatarGroup to mount and wardrobe to load
    for (let i = 0; i < 30; i++) {
      const check = await send('Runtime.evaluate', {
        expression: '!!(window.Studio3D && window.Studio3D.avatarRoot && window.Studio3D.avatarRoot.getObjectByName("GLTFAvatarGroup"))',
        returnByValue: true
      });
      if (check.result && check.result.value) {
        console.log('GLTFAvatarGroup mounted at ' + (i * 500) + 'ms');
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 4000));
  } else {
    await new Promise(r => setTimeout(r, 2000));
  }

  if (targetScreen === 'today-recommendation') {
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('recTryOnBtn');
        if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
  }

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const fs = require('fs');
  const outPath = path.join('C:\\Users\\DELL\\.gemini\\antigravity\\brain\\fc4cd001-674c-4f83-83c3-2380a6e2190a', `${targetScreen}_live.png`);
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to:', outPath);
  ws.close();
  chrome.kill();
}
check();
