from PIL import Image
import numpy as np

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_img_1.png")
# Crop the entire bottom-right quadrant: (1024, 1024) to (2048, 2048)
br = img.crop((1024, 1024, 2048, 2048))
br.save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_bottom_right_quadrant.png")

# Now let's divide this 1024x1024 quadrant into 4x4 sub-tiles of 256x256
for r in range(4):
    for c in range(4):
        sub = br.crop((c * 256, r * 256, (c + 1) * 256, (r + 1) * 256))
        abs_x = 1024 + c * 256
        abs_y = 1024 + r * 256
        sub.save(f"C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/sub_r{r}_c{c}.png")
        arr = np.array(sub.convert('RGB'))
        print(f"Sub r{r}_c{c}: abs_x={abs_x}..{abs_x+256}, abs_y={abs_y}..{abs_y+256}, mean={arr.mean(axis=(0,1))[:3].astype(int)}")
