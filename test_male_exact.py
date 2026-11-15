from PIL import Image, ImageDraw, ImageFilter

tex = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_img_1.png").convert("RGBA")
user = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/.user_uploaded/media_1794719912337_df0f41e9.jpg").convert("RGBA")
uw, uh = user.size

dest_x = 1250
dest_y = 1360
dest_w = 500
dest_h = 460

crop_cx = int(uw * 0.48)
crop_cy = int(uh * 0.58)
crop_h = int(uh * 0.68)
crop_w = int(crop_h * (dest_w / dest_h))

c_x1 = max(0, crop_cx - crop_w // 2)
c_y1 = max(0, crop_cy - crop_h // 2)
c_x2 = min(uw, c_x1 + crop_w)
c_y2 = min(uh, c_y1 + crop_h)

face_crop = user.crop((c_x1, c_y1, c_x2, c_y2)).resize((dest_w, dest_h), Image.Resampling.LANCZOS)

mask = Image.new("L", (dest_w, dest_h), 0)
draw = ImageDraw.Draw(mask)
pad_x = 35
pad_y = 20
draw.ellipse([pad_x, pad_y, dest_w - pad_x, dest_h - pad_y], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(radius=16))

tex.paste(face_crop, (dest_x, dest_y), mask)
tex.save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/correct_face_on_male_atlas.png")
print("Saved correct_face_on_male_atlas.png")
