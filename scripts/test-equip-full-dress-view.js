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

  console.log('1. Equipping dress / garment...');
  const equipRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const item = {
        id: 'item_linen_kurta',
        name: 'Cream kurta',
        category: 'Tops',
        color: 0xEDE3D2,
        fit: 'perfect',
        condition: 'clean'
      };
      window.app.wardrobeEquipToMannequin(item);
      return { success: true };
    })()`,
    returnByValue: true
  });
  console.log('Equip result:', equipRes.result?.value);

  await new Promise(r => setTimeout(r, 2000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = 'C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/perfect-head-to-toe-view.png';
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log('Saved perfect-head-to-toe-view.png');
  ws.close();
}

run().catch(console.error);
