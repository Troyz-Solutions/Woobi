from PIL import Image, ImageDraw, ImageFilter

# Load male atlas
tex = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/male_img_1.png").convert("RGBA")

# Load user face
user = Image.open("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/.user_uploaded/media_1794719912337_df0f41e9.jpg").convert("RGBA")
uw, uh = user.size

# Target bounds in male texture atlas:
# Centered at X=1500, Y=1610 (forehead at 1380, chin at 1820)
dest_x = 1250
dest_y = 1380
dest_w = 500
dest_h = 460

# Crop user face from photo:
# Face is in the center-lower region of the 1024x576 photo
crop_cx = int(uw * 0.48)
crop_cy = int(uh * 0.58)
crop_h = int(uh * 0.72)
crop_w = int(crop_h * (dest_w / dest_h))

c_x1 = max(0, crop_cx - crop_w // 2)
c_y1 = max(0, crop_cy - crop_h // 2)
c_x2 = min(uw, c_x1 + crop_w)
c_y2 = min(uh, c_y1 + crop_h)

face_crop = user.crop((c_x1, c_y1, c_x2, c_y2)).resize((dest_w, dest_h), Image.Resampling.LANCZOS)

# Create feathered elliptical alpha mask
mask = Image.new("L", (dest_w, dest_h), 0)
draw = ImageDraw.Draw(mask)
pad_x = 35
pad_y = 25
draw.ellipse([pad_x, pad_y, dest_w - pad_x, dest_h - pad_y], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(radius=18))

# Composite into male texture atlas
tex.paste(face_crop, (dest_x, dest_y), mask)
tex.save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/verified_correct_male_atlas.png")

# Also save an inspection crop around the face region (1150, 1300, 1850, 1950)
insp = tex.crop((1150, 1300, 1850, 1950))
insp.save("C:/Users/suriy/.gemini/antigravity/brain/5f88950f-5720-4a88-a809-d2d285b36106/verified_face_region.png")

print("Verified composite created successfully!")
