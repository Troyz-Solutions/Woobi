const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(process.cwd(), '.chrome_cdp_profile');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA}`,
    '--disable-gpu',
    '--window-size=412,915',
    'about:blank'
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
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
    if (d.method === 'Console.messageAdded') {
      console.log('[BROWSER LOG]', d.params.message.level, d.params.message.text);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  await send('Page.navigate', { url: 'http://localhost:8085/?screen=today' });
  await sleep(7000); // Give 7 seconds for 3D glb to load

  const evalRes = await send('Runtime.evaluate', {
    expression: `({
      avatarLoaded: !!(window.Studio3D && window.Studio3D.avatarModel),
      avatarVisible: !!(window.Studio3D && window.Studio3D.avatarModel && window.Studio3D.avatarModel.visible),
      avatarPosition: window.Studio3D && window.Studio3D.avatarModel ? window.Studio3D.avatarModel.position : null,
      mannequinType: window.Studio3D ? window.Studio3D.currentMannequinType : null
    })`,
    returnByValue: true
  });
  console.log('AVATAR STATUS:', evalRes.result.value);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\DELL\\.gemini\\antigravity\\brain\\fc4cd001-674c-4f83-83c3-2380a6e2190a\\today_7s.png', Buffer.from(shot.data, 'base64'));

  ws.close();
  chrome.kill();
}
run();
