from PIL import Image
import numpy as np

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_face_region_1300_1850.png")
arr = np.array(img.convert('RGB'))

# Find the darkest pixels (eyes, mouth line, nostrils)
dark_mask = (arr[:,:,0] < 50) & (arr[:,:,1] < 50) & (arr[:,:,2] < 50)
y_idx, x_idx = np.where(dark_mask)

print(f"Dark features in 550x550 region: count={len(y_idx)}")
print(f"X range within region: {np.min(x_idx)} to {np.max(x_idx)}, median={np.median(x_idx):.1f}")
print(f"Y range within region: {np.min(y_idx)} to {np.max(y_idx)}, median={np.median(y_idx):.1f}")

# Remember the crop was taken at x=1250, y=1300:
abs_x_min = 1250 + np.min(x_idx)
abs_x_max = 1250 + np.max(x_idx)
abs_y_min = 1300 + np.min(y_idx)
abs_y_max = 1300 + np.max(y_idx)
print(f"\nAbsolute UV texture atlas coordinates for male facial features:")
print(f"X: {abs_x_min} to {abs_x_max}")
print(f"Y: {abs_y_min} to {abs_y_max}")
print(f"Face center: X={1250 + np.median(x_idx):.1f}, Y={1300 + np.median(y_idx):.1f}")
