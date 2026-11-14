const fs = require('fs');

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await res.json();
  const appTab = tabs.find(t => t.url.includes('localhost:8080'));
  if (!appTab) { console.error('No app tab'); return; }

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

  console.log('1. Reloading page...');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 4500));

  // Verify initial mannequin
  const initialShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/1-initial-realistic-mannequin.png', Buffer.from(initialShot.data, 'base64'));
  console.log('Saved 1-initial-realistic-mannequin.png');

  // Simulate user trying on an uploaded item (e.g. "Emerald Satin Top")
  console.log('2. Equipping uploaded top (Emerald Satin Top)...');
  const equipTopRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const uploadedTop = {
        id: 'user_uploaded_emerald_top_99',
        name: 'Emerald Satin Top',
        category: 'Tops',
        color: 0x1B4D3E, // Emerald Green
        fit: 'perfect',
        condition: 'clean'
      };
      window.app.wardrobeEquipToMannequin(uploadedTop);
      return { success: true };
    })()`,
    returnByValue: true
  });
  console.log('Equip top result:', equipTopRes.result?.value);
  await new Promise(r => setTimeout(r, 1500));

  const topShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/2-after-uploaded-top-equipped.png', Buffer.from(topShot.data, 'base64'));
  console.log('Saved 2-after-uploaded-top-equipped.png');

  // Simulate user trying on uploaded pants (e.g. "Warm Beige Chinos")
  console.log('3. Equipping uploaded bottom (Warm Beige Chinos)...');
  const equipBottomRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const uploadedBottom = {
        id: 'user_uploaded_beige_pants_88',
        name: 'Warm Beige Chinos',
        category: 'Bottoms',
        color: 0xC2B299, // Beige/Khaki
        fit: 'perfect',
        condition: 'clean'
      };
      window.app.wardrobeEquipToMannequin(uploadedBottom);
      return { success: true };
    })()`,
    returnByValue: true
  });
  console.log('Equip bottom result:', equipBottomRes.result?.value);
  await new Promise(r => setTimeout(r, 1500));

  const outfitShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/3-after-full-outfit-equipped.png', Buffer.from(outfitShot.data, 'base64'));
  console.log('Saved 3-after-full-outfit-equipped.png');

  // Verify meshes state
  const stateRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.Studio3D;
      const avatar = s.gltfAvatarGroup;
      const meshes = [];
      avatar.traverse(c => {
        if (c.isMesh) {
          const mat = Array.isArray(c.material) ? c.material[0] : c.material;
          meshes.push({
            name: c.name,
            color: '#' + mat?.color?.getHexString(),
            visible: c.visible
          });
        }
      });
      return {
        activeGarments: s.activeGarments,
        meshes
      };
    })()`,
    returnByValue: true
  });
  console.log('Final 3D mesh state:', JSON.stringify(stateRes.result?.value, null, 2));

  ws.close();
}

run().catch(console.error);

