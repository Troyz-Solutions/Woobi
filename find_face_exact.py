import struct, json

with open("avatar_male.glb", "rb") as f:
    f.read(12)
    chunk_len, _ = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(chunk_len).decode("utf-8"))

print("extensionsUsed:", gltf.get("extensionsUsed", []))
print("extensionsRequired:", gltf.get("extensionsRequired", []))
prim = gltf["meshes"][0]["primitives"][0]
print("primitive extensions:", prim.get("extensions", {}).keys())
