from PIL import Image
import numpy as np

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_img_1.png")
arr = np.array(img.convert('RGB'))

# Find lips: where red is significantly higher than green and blue in skin area
# (R > 130, R - G > 35, R - B > 45, G > 60)
lips_mask = (arr[:,:,0] > 140) & ((arr[:,:,0].astype(int) - arr[:,:,1].astype(int)) > 35) & ((arr[:,:,0].astype(int) - arr[:,:,2].astype(int)) > 45) & (arr[:,:,1] > 60)
ly, lx = np.where(lips_mask)
print(f"Lips detected: count={len(ly)}")
if len(ly) > 0:
    print(f"Lips center: X={np.median(lx):.1f}, Y={np.median(ly):.1f}")
    print(f"Lips X range: {np.min(lx)} to {np.max(lx)}, Y range: {np.min(ly)} to {np.max(ly)}")

# Find nostrils / eyebrows / eyelashes in the face region (x in 1200..1800, y in 1200..1900)
sub_arr = arr[1200:1900, 1200:1800]
dark_sub = (sub_arr[:,:,0] < 40) & (sub_arr[:,:,1] < 40) & (sub_arr[:,:,2] < 40)
sy, sx = np.where(dark_sub)
print(f"Dark features in face quadrant: count={len(sy)}")
if len(sy) > 0:
    print(f"Dark features center: X={1200 + np.median(sx):.1f}, Y={1200 + np.median(sy):.1f}")

# Also check female avatar (female_img_1.webp) for comparison!
try:
    fimg = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/female_img_1.webp")
    farr = np.array(fimg.convert('RGB'))
    flips_mask = (farr[:,:,0] > 140) & ((farr[:,:,0].astype(int) - farr[:,:,1].astype(int)) > 35) & ((farr[:,:,0].astype(int) - farr[:,:,2].astype(int)) > 45)
    fly, flx = np.where(flips_mask)
    if len(fly) > 0:
        print(f"Female lips center: X={np.median(flx):.1f}, Y={np.median(fly):.1f}")
except Exception as e:
    print("Female check err:", e)
