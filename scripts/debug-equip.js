const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(process.cwd(), '.chrome_cdp_profile_vault');

async function debugEquip() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + USER_DATA,
    '--disable-gpu',
    '--window-size=412,915',
    'about:blank'
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 30; i++) {
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
    if (d.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', d.params.type, d.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')).join(' '));
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:8085/?screen=today' });
  await new Promise(r => setTimeout(r, 4000));

  // Dismiss overlays
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btnSkip = document.getElementById('btnSkipIntroVideo');
      if (btnSkip) btnSkip.click();
      const curtain = document.getElementById('mobileCurtainIntro');
      if (curtain) {
        curtain.click();
        curtain.style.display = 'none';
        curtain.classList.add('curtain-dismissed');
      }
      const intro = document.getElementById('theatricalIntroContainer');
      if (intro) intro.style.display = 'none';
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  const debugInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      // Open Bottoms picker
      window.app.openBodyPartWardrobeCard('bottoms');

      const cards = document.querySelectorAll('.picker-item-card');
      console.log('Cards found:', cards.length);
      cards.forEach((c, i) => console.log(' Card', i, c.getAttribute('title')));

      // Click the first card ('Beige chinos')
      if (cards.length > 0) {
        cards[0].click();
        console.log('Clicked first card!');
      }

      return { cardCount: cards.length };
    })()`,
    returnByValue: true
  });

  console.log('Debug eval executed:', debugInfo.result?.value);

  // Wait 3 seconds for texture loading and shader compilation
  await new Promise(r => setTimeout(r, 3000));

  const afterTexture = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.Studio3D;
      const pantsMesh = s.gltfAvatarGroup.getObjectByName('Ch37_Pants');
      const mat = pantsMesh?.material;
      return {
        pantsMeshFound: !!pantsMesh,
        hasMap: !!mat?.map,
        mapLoaded: !!(mat?.map?.image && mat.map.image.complete),
        mapSrc: mat?.map?.image?.src,
        color: mat?.color?.getHexString(),
        onBeforeCompile: !!mat?.onBeforeCompile
      };
    })()`,
    returnByValue: true
  });
  console.log('Pants material after 3s:', afterTexture.result?.value);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/vault-debug-chinos.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved vault-debug-chinos.png');

  ws.close();
  chrome.kill();
}

debugEquip().catch(console.error);
