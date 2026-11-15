from PIL import Image, ImageDraw

img = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_face_region_1300_1850.png")
draw = ImageDraw.Draw(img)

# Draw grid lines every 50px with absolute coordinates labeled
# Remember offset is X=1250, Y=1300
w, h = img.size
for x in range(0, w, 50):
    abs_x = 1250 + x
    draw.line([(x, 0), (x, h)], fill="cyan" if x % 100 == 0 else "gray", width=1)

for y in range(0, h, 50):
    abs_y = 1300 + y
    draw.line([(0, y), (w, y)], fill="yellow" if y % 100 == 0 else "gray", width=1)

img.save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/face_annotated_grid.png")
print("Saved face_annotated_grid.png")
