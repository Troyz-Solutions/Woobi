const fs = require('fs');

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await res.json();
  const appTab = tabs.find(t => t.url.includes('localhost:8080'));
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

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.Studio3D;
      const avatar = s.gltfAvatarGroup;
      let shirtMesh = null;
      avatar.traverse(c => {
        if (c.isMesh && (c.name.includes('Shirt') || c.name.includes('Sweater'))) shirtMesh = c;
      });
      if (!shirtMesh) return { error: 'No shirt' };
      const geom = shirtMesh.geometry;
      const uv = geom.attributes.uv;
      const index = geom.index;
      const norm = geom.attributes.normal;
      
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111118';
      ctx.fillRect(0, 0, 1024, 1024);

      function getU(i) { return (uv.getX(i) / (uv.normalized ? 65535 : 1)) * 1024; }
      function getV(i) { return (1.0 - (uv.getY(i) / (uv.normalized ? 65535 : 1))) * 1024; }

      const triCount = index ? index.count / 3 : uv.count / 3;
      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

        const nz = norm ? (norm.getZ(i0) + norm.getZ(i1) + norm.getZ(i2)) / 3 : 0;
        
        ctx.beginPath();
        ctx.moveTo(getU(i0), getV(i0));
        ctx.lineTo(getU(i1), getV(i1));
        ctx.lineTo(getU(i2), getV(i2));
        ctx.closePath();

        if (nz > 0.15) {
          ctx.fillStyle = 'rgba(60, 180, 80, 0.35)'; // Front = green
          ctx.strokeStyle = 'rgba(60, 220, 100, 0.7)';
        } else if (nz < -0.15) {
          ctx.fillStyle = 'rgba(80, 100, 220, 0.35)'; // Back = blue
          ctx.strokeStyle = 'rgba(100, 140, 255, 0.7)';
        } else {
          ctx.fillStyle = 'rgba(200, 160, 40, 0.25)'; // Sides/sleeves = yellow
          ctx.strokeStyle = 'rgba(220, 180, 50, 0.6)';
        }
        ctx.fill();
        ctx.stroke();
      }

      return canvas.toDataURL('image/png');
    })()`,
    returnByValue: true
  });

  if (evalRes.result.value && typeof evalRes.result.value === 'string') {
    const b64 = evalRes.result.value.split(',')[1];
    fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/shirt-uv-wireframe.png', Buffer.from(b64, 'base64'));
    console.log('Saved shirt-uv-wireframe.png successfully!');
  } else {
    console.log('Error:', evalRes.result.value);
  }
  ws.close();
}
run().catch(console.error);
