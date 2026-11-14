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

  // Reload page to get fresh state
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Verifying Studio Overview head-to-toe framing...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      if (window.app && typeof window.app.goToScreen === 'function') {
        window.app.goToScreen('today');
      }
      if (window.Studio3D && typeof window.Studio3D.setCameraState === 'function') {
        window.Studio3D.setCameraState('STUDIO_OVERVIEW');
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/1-mobile-head-to-toe-framing.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved 1-mobile-head-to-toe-framing.png');

  console.log('3. Opening Clothing Capture modal with Dual-Side (Front & Back) selector...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.app.openClothingCamera('shirt');
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/2-clothing-camera-front-side.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved 2-clothing-camera-front-side.png');

  console.log('4. Simulating capture of Front photo with on-device background removal ($0) & HD color matching...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      // Create full-resolution canvas representing user photo
      const canvas = document.getElementById('clothingCameraCanvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');

      // Background: light cream bedsheet
      ctx.fillStyle = '#F5F0EB';
      ctx.fillRect(0, 0, 1200, 1600);

      // Foreground garment: Emerald green designer shirt (#1E5838)
      ctx.fillStyle = '#1E5838';
      ctx.beginPath();
      ctx.ellipse(600, 800, 360, 520, 0, 0, Math.PI * 2);
      ctx.fill();

      // Front design pattern details
      ctx.fillStyle = '#2D7A50';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('✦ ATELIER FRONT ✦', 400, 750);

      // Trigger capture processing
      window.app.captureClothingSnapshot();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/3-front-photo-reviewed-with-hd-color.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved 3-front-photo-reviewed-with-hd-color.png');

  console.log('5. Clicking "Next: Capture Back Side" to capture back of garment...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.app.proceedToBackSideCapture();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('6. Simulating capture of Back photo with matching on-device segmentation...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const canvas = document.getElementById('clothingCameraCanvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');

      // Background: light cream
      ctx.fillStyle = '#F5F0EB';
      ctx.fillRect(0, 0, 1200, 1600);

      // Foreground garment: Emerald green designer shirt (#1E5838)
      ctx.fillStyle = '#1E5838';
      ctx.beginPath();
      ctx.ellipse(600, 800, 360, 520, 0, 0, Math.PI * 2);
      ctx.fill();

      // Back design pattern details
      ctx.fillStyle = '#154228';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('✦ ATELIER REAR BACK ✦', 360, 750);

      window.app.captureClothingSnapshot();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/4-back-photo-reviewed.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved 4-back-photo-reviewed.png');

  console.log('7. Confirming and saving garment to wardrobe...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.app.confirmClothingPhoto();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('8. Opening Review modal and saving items to digital wardrobe...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.app.openClothingReview();
      window.app.saveCapturedClothingToWardrobe();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('9. Equipping the dual-side emerald garment on realistic 3D mannequin...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const item = window.WARDROBE_ITEMS[0];
      window.app.wardrobeEquipToMannequin(item);
      window.Studio3D.setCameraState('STUDIO_OVERVIEW');
    })()`
  });
  await new Promise(r => setTimeout(r, 1600));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/5-mannequin-dual-side-equipped.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved 5-mannequin-dual-side-equipped.png');

  console.log('All verification steps completed successfully!');
  ws.close();
}
run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
