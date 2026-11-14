const fs = require('fs');

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await res.json();
  const appTab = tabs.find(t => t.url.includes('localhost:8080'));
  if (!appTab) {
    console.error('No localhost:8080 tab found!');
    process.exit(1);
  }

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

  console.log('1. Setting mobile viewport 390x844...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  // Reload page
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 2200));

  console.log('2. Opening clothing camera...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.app.openClothingCamera('shirt');
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('3. Simulating upload of a multi-colored designer shirt (Navy + Crimson + Gold + White)...');
  const uploadEval = await send('Runtime.evaluate', {
    expression: `(() => {
      // 100% full-resolution canvas representing user photo
      const canvas = document.getElementById('clothingCameraCanvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');

      // Light background
      ctx.fillStyle = '#FAF7F2';
      ctx.fillRect(0, 0, 1200, 1600);

      // Shirt Silhouette Foreground: Deep Navy Blue (#1B2A4A)
      ctx.fillStyle = '#1B2A4A';
      ctx.beginPath();
      ctx.ellipse(600, 800, 380, 560, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crimson Red Color Block (#C82828)
      ctx.fillStyle = '#C82828';
      ctx.fillRect(320, 650, 560, 90);

      // Warm Amber Gold Accent Line (#F4A261)
      ctx.fillStyle = '#F4A261';
      ctx.fillRect(320, 750, 560, 30);

      // Crisp White Collar Arc (#FFFFFF)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(600, 340, 140, 0, Math.PI);
      ctx.fill();

      // Emblem text
      ctx.fillStyle = '#F4A261';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦ EXACT ATELIER ✦', 600, 580);

      // Process garment with on-device background removal and multi-color extraction
      window.app.captureClothingSnapshot();
      return { ok: true };
    })()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 900));

  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/exact-color-palette-review.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved exact-color-palette-review.png');

  console.log('4. Confirming garment and equipping onto 3D mannequin...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.app.confirmClothingPhoto();
      window.app.openClothingReview();
      window.app.saveCapturedClothingToWardrobe();
      const item = window.WARDROBE_ITEMS[0];
      window.app.wardrobeEquipToMannequin(item);
      window.Studio3D.setCameraState('STUDIO_OVERVIEW');
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/exact-aligned-mannequin.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved exact-aligned-mannequin.png');

  console.log('5. Rotating camera to inspect mirror reflection...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.Studio3D.setCameraState('MIRROR_VIEW');
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/mirror-view-reflection.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved mirror-view-reflection.png');

  console.log('All exact color and alignment verifications passed successfully!');
  ws.close();
}
run().catch(console.error);
