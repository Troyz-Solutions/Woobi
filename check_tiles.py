from PIL import Image
import numpy as np

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_img_1.png")
print("male_img_1.png size:", img.size)

# Split into 16 tiles (4x4) and save each with its row, col and coordinates
w, h = img.size
tw, th = w // 4, h // 4

for row in range(4):
    for col in range(4):
        x1 = col * tw
        y1 = row * th
        x2 = x1 + tw
        y2 = y1 + th
        tile = img.crop((x1, y1, x2, y2))
        arr = np.array(tile.convert('RGB'))
        mean_c = arr.mean(axis=(0,1))
        # Check if skin-like: mean R > 100, mean R > mean B
        is_skin = (mean_c[0] > 90) and (mean_c[0] > mean_c[2] + 20)
        tile.save(f"C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/tile_r{row}_c{col}.png")
        print(f"Tile r{row}_c{col} (x={x1}..{x2}, y={y1}..{y2}): mean={mean_c[:3].astype(int)}, is_skin={is_skin}")
