from PIL import Image
import numpy as np

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/female_img_1.webp")
# In female, where is the face?
# Let's check (1100, 1350) to (1600, 1850)
crop = img.crop((1100, 1350, 1600, 1850))
crop.save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/actual_female_face.png")
arr = np.array(crop.convert('RGB'))
print("Female crop size:", crop.size)
print("Top-center:", arr[50, 250])
print("Center:", arr[200, 250])
print("Mid-lower:", arr[320, 250])
print("Bottom-center:", arr[450, 250])
