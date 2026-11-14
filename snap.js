const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(process.cwd(), '.chrome_snap_data');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('1. Launching chrome...');
  const proc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9333',
    `--user-data-dir=${USER_DATA}`,
    '--disable-gpu',
    '--window-size=412,915',
    'about:blank'
  ]);

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(200);
    try {
      const res = await fetch('http://127.0.0.1:9333/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }
  if (!targets) {
    console.error('Failed to get CDP targets');
    proc.kill();
    return;
  }
  console.log('2. Target found:', targets[0].webSocketDebuggerUrl);

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

  console.log('3. Navigating...');
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:8085/?screen=today' });
  await sleep(3500);

  console.log('4. Capturing screenshot...');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\fc4cd001-674c-4f83-83c3-2380a6e2190a\\live_snap_today.png';
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log('5. Done! Saved to', outPath);

  ws.close();
  proc.kill();
}
main().catch(console.error);
