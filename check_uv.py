import struct, json
import numpy as np

with open("avatar_male.glb", "rb") as f:
    f.read(12)
    chunk_len, _ = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(chunk_len).decode("utf-8"))
    bin_len, _ = struct.unpack("<II", f.read(8))
    bin_data = f.read(bin_len)

def get_data(mesh_idx, attr_name):
    prim = gltf["meshes"][mesh_idx]["primitives"][0]
    acc = gltf["accessors"][prim["attributes"][attr_name]]
    bv = gltf["bufferViews"][acc["bufferView"]]
    offset = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    count = acc["count"]
    ctype = acc["componentType"]
    atype = acc["type"]
    num_comp = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[atype]
    dtype = {5126: np.float32, 5122: np.int16, 5123: np.uint16, 5120: np.int8, 5121: np.uint8}[ctype]
    arr = np.frombuffer(bin_data, dtype=dtype, count=count * num_comp, offset=offset).reshape((count, num_comp))
    if acc.get("normalized", False):
        if dtype == np.uint16:
            arr = arr.astype(np.float32) / 65535.0
        elif dtype == np.int16:
            arr = np.maximum(arr.astype(np.float32) / 32767.0, -1.0)
    return arr

# Mesh 0 is Ch31_Body, Mesh 2 is Ch31_Sweater
body_pos = get_data(0, "POSITION")
body_uv = get_data(0, "TEXCOORD_0")

sweater_pos = get_data(2, "POSITION")
sweater_uv = get_data(2, "TEXCOORD_0")

# Head in Ch31_Body: Y > max_y * 0.70
max_y = np.max(body_pos[:, 1])
head_mask = body_pos[:, 1] > (max_y * 0.70)
head_uv = body_uv[head_mask]
print("Head UV count:", len(head_uv))
print(f"Head U in [0..2048]: min={np.min(head_uv[:,0])*2048:.1f}, max={np.max(head_uv[:,0])*2048:.1f}")
print(f"Head V in [0..2048]: min={np.min(1.0 - head_uv[:,1])*2048:.1f}, max={np.max(1.0 - head_uv[:,1])*2048:.1f}")

# Sweater UVs in [0..2048]
print(f"\nSweater U in [0..2048]: min={np.min(sweater_uv[:,0])*2048:.1f}, max={np.max(sweater_uv[:,0])*2048:.1f}")
print(f"Sweater V in [0..2048]: min={np.min(1.0 - sweater_uv[:,1])*2048:.1f}, max={np.max(1.0 - sweater_uv[:,1])*2048:.1f}")

# Front face of head: Z > 0 in body_pos
front_head_mask = head_mask & (body_pos[:, 2] > 0)
front_uv = body_uv[front_head_mask]
print(f"\nFront Face U: min={np.min(front_uv[:,0])*2048:.1f}, max={np.max(front_uv[:,0])*2048:.1f}")
print(f"Front Face V (canvas top-down): min={np.min(1.0 - front_uv[:,1])*2048:.1f}, max={np.max(1.0 - front_uv[:,1])*2048:.1f}")

# Nose tip in body (max Z among head)
nose_idx = np.argmax(body_pos[head_mask, 2])
nose_pos = body_pos[head_mask][nose_idx]
nose_u = head_uv[nose_idx, 0] * 2048
nose_v = (1.0 - head_uv[nose_idx, 1]) * 2048
print(f"Nose tip: pos={nose_pos}, U={nose_u:.1f}, V={nose_v:.1f}")
