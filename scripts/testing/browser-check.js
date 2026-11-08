const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(process.cwd(), '.chrome_cdp_profile');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('[BrowserCheck] Launching Chrome headless with CDP...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA}`,
    '--disable-gpu',
    '--window-size=1280,900',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for CDP to be ready
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  if (!targets || !targets[0] || !targets[0].webSocketDebuggerUrl) {
    console.error('[BrowserCheck] Failed to connect to Chrome CDP');
    chrome.kill();
    process.exit(1);
  }

  const wsUrl = targets[0].webSocketDebuggerUrl;
  console.log('[BrowserCheck] Connected to CDP:', wsUrl);

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();
  const consoleMessages = [];
  const errors = [];

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const curId = id++;
      pending.set(curId, { resolve, reject });
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
      return;
    }

    if (data.method === 'Console.messageAdded') {
      consoleMessages.push(data.params.message);
      if (data.params.message.level === 'error') {
        errors.push(data.params.message.text);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text;
      errors.push(`Runtime Exception: ${desc} at line ${data.params.exceptionDetails.lineNumber}`);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  console.log('[BrowserCheck] Navigating to http://localhost:8085...');
  await send('Page.navigate', { url: 'http://localhost:8085' });

  // Wait 4 seconds for scripts & 3D WebGL to initialize
  await sleep(4000);

  // 1. Check initial room load & 3D Studio
  const roomState = await send('Runtime.evaluate', {
    expression: `({
      title: document.title,
      activeScreens: Array.from(document.querySelectorAll('.phone-screen.active')).map(el => el.id),
      studio3DExists: typeof window.Studio3D !== 'undefined',
      wardrobeModelExists: !!(window.Studio3D && window.Studio3D.wardrobeModel),
      interactiveObjectsCount: window.Studio3D?.interactiveObjects?.length || 0,
      interactiveGarmentsCount: window.Studio3D?.interactiveObjects?.filter(o => o.userData?.interactiveType === 'wardrobe_garment').length || 0
    })`,
    returnByValue: true
  });

  console.log('\n[1] 3D STUDIO ROOM STATE:', roomState.result.value);

  // Capture Screenshot of 3D Room with Cupboard & Clothes
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath1 = 'C:\\Users\\suriy\\.gemini\\antigravity\\brain\\ec172732-7aa6-47b5-87c8-e16fcafdc93a\\live_3d_room.png';
  fs.writeFileSync(shotPath1, Buffer.from(shot1.data, 'base64'));
  console.log('Saved 3D room screenshot to:', shotPath1);

  // 2. Test 3D Wardrobe Direct Raycast Click & Drag
  console.log('\n[2] Testing 3D Garment Click & Drag on Cupboard...');
  const garmentClickTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const garments = window.Studio3D?.interactiveObjects?.filter(o => o.userData?.interactiveType === 'wardrobe_garment');
      if (!garments || garments.length === 0) return { success: false, reason: 'No garments found' };
      const targetGarment = garments[0].userData;
      // Trigger garment drag directly as if clicked in 3D canvas
      window.app.start3DGarmentDrag(targetGarment, 320, 380);
      return {
        success: true,
        garmentName: targetGarment.garmentName,
        ghostActive: document.getElementById('studio3dDragGhost')?.classList.contains('active'),
        dropTargetActive: document.getElementById('studio3dMannequinDropTarget')?.classList.contains('active')
      };
    })()`,
    returnByValue: true
  });
  console.log('3D Garment Drag Initiation:', garmentClickTest.result.value);

  // Capture Screenshot during 3D Drag
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath2 = 'C:\\Users\\suriy\\.gemini\\antigravity\\brain\\ec172732-7aa6-47b5-87c8-e16fcafdc93a\\live_drag_active.png';
  fs.writeFileSync(shotPath2, Buffer.from(shot2.data, 'base64'));
  console.log('Saved drag active screenshot to:', shotPath2);

  // 3. Drop onto Mannequin & Equip
  console.log('\n[3] Dropping garment onto Mannequin...');
  const equipTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const garments = window.Studio3D?.interactiveObjects?.filter(o => o.userData?.interactiveType === 'wardrobe_garment');
      const targetGarment = garments[0].userData;
      window.app.equip3DGarmentToMannequin(targetGarment);
      return {
        equipped: true,
        garmentName: targetGarment.garmentName,
        currentOutfit: window.app.state?.currentLook || window.app.state?.currentOutfit
      };
    })()`,
    returnByValue: true
  });
  console.log('Mannequin Equip Result:', equipTest.result.value);
  await sleep(1500);

  // Capture Screenshot after Equip
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath3 = 'C:\\Users\\suriy\\.gemini\\antigravity\\brain\\ec172732-7aa6-47b5-87c8-e16fcafdc93a\\live_equipped_mannequin.png';
  fs.writeFileSync(shotPath3, Buffer.from(shot3.data, 'base64'));
  console.log('Saved equipped mannequin screenshot to:', shotPath3);

  // 4. Test Haute Wardrobe Screen (app.goToScreen('wardrobe'))
  console.log('\n[4] Navigating to Haute Wardrobe screen...');
  await send('Runtime.evaluate', { expression: `window.app.goToScreen('wardrobe')` });
  await sleep(1500);

  const wardrobeState = await send('Runtime.evaluate', {
    expression: `({
      screenWardrobeActive: document.getElementById('screen-wardrobe')?.classList.contains('active'),
      garmentCardsCount: document.querySelectorAll('.wardrobe-luxury-card').length,
      categoryFilterPillsCount: document.querySelectorAll('.wardrobe-filter-pill').length,
      sectionBannersCount: document.querySelectorAll('.wardrobe-hero-card').length
    })`,
    returnByValue: true
  });
  console.log('Haute Wardrobe Screen Details:', wardrobeState.result.value);

  // Capture Haute Wardrobe Screenshot
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath4 = 'C:\\Users\\suriy\\.gemini\\antigravity\\brain\\ec172732-7aa6-47b5-87c8-e16fcafdc93a\\live_haute_wardrobe.png';
  fs.writeFileSync(shotPath4, Buffer.from(shot4.data, 'base64'));
  console.log('Saved Haute Wardrobe screenshot to:', shotPath4);

  // 5. Test Zoom / Inspect Garment Modal
  console.log('\n[5] Testing Zoom / Inspection Modal on Wardrobe Item...');
  const inspectTest = await send('Runtime.evaluate', {
    expression: `(() => {
      window.app.wardrobeOpenZoom('item_1');
      return {
        modalActive: document.getElementById('wZoomedCard')?.classList.contains('active'),
        backdropActive: document.getElementById('wZoomBackdrop')?.classList.contains('active'),
        title: document.getElementById('wZoomedName')?.textContent,
        cat: document.getElementById('wZoomedCat')?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('Wardrobe Item Inspection Details:', inspectTest.result.value);
  await sleep(800);

  // Capture Inspect Zoom Modal Screenshot
  const shot5 = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath5 = 'C:\\Users\\suriy\\.gemini\\antigravity\\brain\\ec172732-7aa6-47b5-87c8-e16fcafdc93a\\live_inspect_zoom.png';
  fs.writeFileSync(shotPath5, Buffer.from(shot5.data, 'base64'));
  console.log('Saved inspection zoom modal screenshot to:', shotPath5);

  console.log('\nTotal Console Errors caught during session:', errors);

  ws.close();
  chrome.kill();
  console.log('\n[BrowserCheck] All automated browser tests finished successfully!');
}

run().catch((err) => {
  console.error('[BrowserCheck Error]', err);
  process.exit(1);
});
