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

  console.log('Injecting precision planar projection shader on mannequin shirt...');
  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.Studio3D;
      const avatar = s.gltfAvatarGroup;
      let shirtMesh = null;
      avatar.traverse(c => {
        if (c.isMesh && (c.name.includes('Shirt') || c.name.includes('Sweater'))) shirtMesh = c;
      });
      if (!shirtMesh) return { error: 'No shirt' };

      // Create a test patterned multi-colored shirt texture
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Navy blue base (#1B2A4A)
      ctx.fillStyle = '#1B2A4A';
      ctx.fillRect(0, 0, 1024, 1024);

      // Red and gold athletic stripes across chest (exact colors #E63946 and #F4A261)
      ctx.fillStyle = '#E63946';
      ctx.fillRect(0, 480, 1024, 60);
      ctx.fillStyle = '#F4A261';
      ctx.fillRect(0, 550, 1024, 30);

      // White collar zone (#FFFFFF)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(512, 100, 180, 0, Math.PI);
      ctx.fill();

      // Brand emblem in gold
      ctx.fillStyle = '#F4A261';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WOOBI COUTURE', 512, 420);

      const texture = new window.THREE.CanvasTexture(canvas);
      texture.wrapS = window.THREE.ClampToEdgeWrapping;
      texture.wrapT = window.THREE.ClampToEdgeWrapping;

      const mat = shirtMesh.material;
      mat.color.setHex(0xFFFFFF); // PURE WHITE BASE - NEVER MUDDY COLORS
      mat.userData.uFrontMap = { value: texture };
      mat.userData.uBackMap = { value: texture };

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uFrontMap = mat.userData.uFrontMap;
        shader.uniforms.uBackMap = mat.userData.uBackMap;

        shader.vertexShader = \`
          varying vec2 vFrontUV;
          varying vec2 vBackUV;
          varying vec3 vNorm;
          \${shader.vertexShader}
        \`.replace(
          '#include <begin_vertex>',
          \`#include <begin_vertex>
           vNorm = normal;
           // Precision Planar Projection:
           // X normalized in [-1.0, 1.0] -> U in [0.0, 1.0]
           // Y normalized in [-0.425, 0.425] -> V in [0.0, 1.0]
           float uVal = clamp((position.x * 0.5) + 0.5, 0.0, 1.0);
           float vVal = clamp((position.y + 0.425) / 0.85, 0.0, 1.0);
           vFrontUV = vec2(uVal, vVal);
           vBackUV = vec2(1.0 - uVal, vVal);
          \`
        );

        shader.fragmentShader = \`
          uniform sampler2D uFrontMap;
          uniform sampler2D uBackMap;
          varying vec2 vFrontUV;
          varying vec2 vBackUV;
          varying vec3 vNorm;
          \${shader.fragmentShader}
        \`.replace(
          '#include <map_fragment>',
          \`#ifdef USE_MAP
             vec4 fColor = texture2D(uFrontMap, vFrontUV);
             vec4 bColor = texture2D(uBackMap, vBackUV);
             float sideBlend = smoothstep(-0.1, 0.1, vNorm.z);
             vec4 texelColor = mix(bColor, fColor, sideBlend);
             diffuseColor = texelColor;
           #endif\`
        );
      };

      mat.map = texture;
      mat.needsUpdate = true;
      return { success: true };
    })()`,
    returnByValue: true
  });

  console.log('Shader injection result:', evalRes.result.value);
  await new Promise(r => setTimeout(r, 1000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/test-planar-projection.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved test-planar-projection.png!');
  ws.close();
}
run().catch(console.error);

