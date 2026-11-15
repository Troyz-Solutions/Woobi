from PIL import Image

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_img_1.png")
face_crop = img.crop((1250, 1350, 1750, 1850))
face_crop.save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/actual_male_face.png")
print("Saved actual_male_face.png")
