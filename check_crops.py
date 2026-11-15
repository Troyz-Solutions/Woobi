from PIL import Image

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_img_1.png")
# Crop around (1330, 120) - where we put the face!
img.crop((1200, 50, 1800, 550)).save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/crop_at_120.png")

# Crop around (1250, 1350) - where the nose tip is (U=1289, V=1332)!
img.crop((1100, 1150, 1800, 1850)).save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/crop_at_1350.png")

print("Saved crops!")
