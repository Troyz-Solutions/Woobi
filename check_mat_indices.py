import struct, json
import numpy as np

with open("avatar_male.glb", "rb") as f:
    f.read(12)
    chunk_len, _ = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(chunk_len).decode("utf-8"))
    bin_len, _ = struct.unpack("<II", f.read(8))
    bin_data = f.read(bin_len)

# Mesh 0: Ch31_Body
prim = gltf["meshes"][0]["primitives"][0]
print("Ch31_Body material index:", prim["material"])
print("Ch31_Sweater material index:", gltf["meshes"][2]["primitives"][0]["material"])
print("Ch31_Pants material index:", gltf["meshes"][1]["primitives"][0]["material"])
print("Ch31_Shoes material index:", gltf["meshes"][5]["primitives"][0]["material"])
