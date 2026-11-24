const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(process.cwd(), '.chrome_cdp_profile_vault');
const OUT_DIR = 'C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106';

async function run() {
  console.log('1. Launching headless Chrome with isolated profile...');
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
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 412,
    height: 915,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log('2. Navigating to http://localhost:8085/?screen=today ...');
  await send('Page.navigate', { url: 'http://localhost:8085/?screen=today' });
  await new Promise(r => setTimeout(r, 3500));

  // Dismiss intro overlays
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
      if (window.app) window.app.goToScreen('today');
    })()`
  });
  await new Promise(r => setTimeout(r, 3000));

  // 3. Open Bottoms Picker
  await send('Runtime.evaluate', {
    expression: `window.app.openBodyPartWardrobeCard('bottoms');`
  });
  await new Promise(r => setTimeout(r, 800));

  // 4. Equip 'Beige chinos'
  console.log('Equipping Beige chinos...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('.picker-item-card');
      if (cards.length > 0) cards[0].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'vault-03-chinos-mannequin.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved vault-03-chinos-mannequin.png');

  // 5. Equip 'Dark skirt'
  console.log('Equipping Dark skirt...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('.picker-item-card');
      if (cards.length > 1) cards[1].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'vault-04-skirt-mannequin.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved vault-04-skirt-mannequin.png');

  // 6. Equip 'Dark denim'
  console.log('Equipping Dark denim...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('.picker-item-card');
      if (cards.length > 2) cards[2].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'vault-05-denim-mannequin.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved vault-05-denim-mannequin.png');

  // 7. Open Tops Picker & Equip 'Navy shirt'
  console.log('Opening Tops picker & equipping Navy shirt...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.app.openBodyPartWardrobeCard('tops');
      setTimeout(() => {
        const cards = document.querySelectorAll('.picker-item-card');
        if (cards.length > 0) cards[0].click(); // Navy shirt
      }, 500);
    })()`
  });
  await new Promise(r => setTimeout(r, 1800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'vault-06-navy-shirt.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved vault-06-navy-shirt.png');

  // 8. Equip 'Maroon top'
  console.log('Equipping Maroon top...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('.picker-item-card');
      if (cards.length > 2) cards[2].click(); // Maroon top
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'vault-07-maroon-top.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved vault-07-maroon-top.png');

  ws.close();
  chrome.kill();
  console.log('Free Fire Vault verification completed successfully.');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
