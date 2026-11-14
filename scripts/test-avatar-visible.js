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
    }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:8085/?screen=today' });
  await new Promise(r => setTimeout(r, 5000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.Studio3D;
      if (!s) return 'No Studio3D';
      if (s.sculptedAvatarGroup) {
        s.sculptedAvatarGroup.visible = true;
        s.sculptedAvatarGroup.traverse(c => { c.visible = true; });
        return 'Made sculpted avatar visible!';
      }
      return 'No sculptedAvatarGroup';
    })()`,
    returnByValue: true
  });
  console.log('Result:', res.result.value);

  await new Promise(r => setTimeout(r, 500));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\DELL\\.gemini\\antigravity\\brain\\fc4cd001-674c-4f83-83c3-2380a6e2190a\\avatar_test_shot.png', Buffer.from(shot.data, 'base64'));

  ws.close();
  chrome.kill();
}
run();
