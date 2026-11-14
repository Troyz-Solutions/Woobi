const WebSocket = globalThis.WebSocket;

async function run() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/E4C64EED086DB24F6B7B4E1EB92A2961');
  await new Promise(r => ws.onopen = r);

  const switchCode = `(() => {
    window.app.selectMannequin('male');
    return true;
  })()`;

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression: switchCode, returnByValue: true }
  }));

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));

  const checkCode = `(() => {
    const s = window.Studio3D;
    const g = s.gltfAvatarGroup;
    const meshes = [];
    if (g) {
      g.traverse(c => {
        if (c.isMesh) meshes.push({ name: c.name, visible: c.visible, culled: c.frustumCulled });
      });
    }
    return {
      currentGender: s.avatarModel?.currentGender,
      hasGltf: !!g,
      gltfVisible: g?.visible,
      avatarRootVisible: s.avatarRoot?.visible,
      avatarRootChildren: s.avatarRoot?.children.map(c => c.name),
      meshes
    };
  })()`;

  ws.send(JSON.stringify({
    id: 2,
    method: 'Runtime.evaluate',
    params: { expression: checkCode, returnByValue: true }
  }));

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 2) {
      console.log(JSON.stringify(data.result.result.value, null, 2));
      ws.close();
    }
  };
}

run().catch(console.error);

