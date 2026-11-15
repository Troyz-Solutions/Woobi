from PIL import Image

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_img_1.png")
face_region = img.crop((1250, 1300, 1800, 1850))
face_region.save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_face_region_1300_1850.png")
print("Saved male_face_region_1300_1850.png")
