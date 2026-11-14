import math
import os
from PIL import Image, ImageDraw, ImageFont

def bake_dial():
    albedo_path = 'Clock/textures/clock_Albedo.png'
    albedo = Image.open(albedo_path).convert('RGBA')
    w, h = albedo.size

    cx = int(0.479 * w)
    cy = int((1.0 - 0.494) * h)
    r = int(0.435 * w)

    print(f'Baking dial into albedo at ({cx}, {cy}), r={r}')

    dial_dim = 2 * r
    overlay = Image.new('RGBA', (dial_dim, dial_dim), (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    dcx, dcy = r, r

    font_num = ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf', 240)
    font_brand = ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf', 90)
    font_sub = ImageFont.truetype('C:/Windows/Fonts/times.ttf', 55)
    font_city = ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf', 50)

    # Porcelain enamel dial fill
    for ri in range(r, 0, -3):
        t = ri / r
        cr = int(255 - (1.0 - t) * 5)
        cg = int(253 - (1.0 - t) * 7)
        cb = int(248 - (1.0 - t) * 12)
        draw.ellipse([dcx - ri, dcy - ri, dcx + ri, dcy + ri], fill=(cr, cg, cb, 255))

    # Outer gold rim & chapter rings
    draw.ellipse([dcx - r + 10, dcy - r + 10, dcx + r - 10, dcy + r - 10], outline=(195, 155, 75, 255), width=24)
    draw.ellipse([dcx - int(r*0.96), dcy - int(r*0.96), dcx + int(r*0.96), dcy + int(r*0.96)], outline=(10, 10, 10, 255), width=28)
    draw.ellipse([dcx - int(r*0.84), dcy - int(r*0.84), dcx + int(r*0.84), dcy + int(r*0.84)], outline=(20, 20, 20, 255), width=16)
    draw.ellipse([dcx - int(r*0.56), dcy - int(r*0.56), dcx + int(r*0.56), dcy + int(r*0.56)], outline=(195, 155, 75, 200), width=10)

    # 60 Minute track
    for m in range(60):
        ang = m * math.pi / 30.0
        sin_a = math.sin(ang)
        cos_a = math.cos(ang)
        is_hour = (m % 5 == 0)

        r_outer = r * 0.96
        r_inner = r * 0.84 if is_hour else r * 0.89

        p1 = (dcx + sin_a * r_inner, dcy - cos_a * r_inner)
        p2 = (dcx + sin_a * r_outer, dcy - cos_a * r_outer)

        w_line = 28 if is_hour else 12
        col = (10, 10, 10, 255) if is_hour else (50, 45, 40, 255)
        draw.line([p1, p2], fill=col, width=w_line)

        if is_hour:
            rb = r * 0.79
            bx = dcx + sin_a * rb
            by = dcy - cos_a * rb
            draw.ellipse([bx - 16, by - 16, bx + 16, by + 16], fill=(212, 175, 55, 255), outline=(130, 95, 25, 255), width=4)

    # Roman Numerals
    numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    for h_idx in range(12):
        ang = h_idx * math.pi / 6.0
        sin_a = math.sin(ang)
        cos_a = math.cos(ang)
        rn = numerals[h_idx]

        dist = r * 0.67
        tx = dcx + sin_a * dist
        ty = dcy - cos_a * dist

        bbox = font_num.getbbox(rn)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]

        draw.text((tx - tw//2, ty - th//2 - bbox[1]), rn, fill=(5, 5, 5, 255), font=font_num)

    # Branded Inscription
    brand = 'S É R È N'
    bbox_b = font_brand.getbbox(brand)
    draw.text((dcx - (bbox_b[2]-bbox_b[0])//2, dcy - 360), brand, fill=(10, 10, 10, 255), font=font_brand)

    sub = "Horlogerie d'Atelier"
    bbox_s = font_sub.getbbox(sub)
    draw.text((dcx - (bbox_s[2]-bbox_s[0])//2, dcy - 260), sub, fill=(70, 60, 50, 255), font=font_sub)

    city = 'PARIS • 1889'
    bbox_c = font_city.getbbox(city)
    draw.text((dcx - (bbox_c[2]-bbox_c[0])//2, dcy + 280), city, fill=(80, 70, 60, 255), font=font_city)

    # Paste into albedo with circular alpha mask
    mask = Image.new('L', (dial_dim, dial_dim), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.ellipse([0, 0, dial_dim, dial_dim], fill=255)

    albedo.paste(overlay, (cx - r, cy - r), mask)
    albedo.convert('RGB').save('Clock/textures/clock_Albedo.png', quality=98)
    print('Updated Clock/textures/clock_Albedo.png successfully')

    # Also save standalone dial image for 3D studio
    overlay.save('Clock/textures/clock_dial_uhd.png')
    print('Saved Clock/textures/clock_dial_uhd.png')

if __name__ == '__main__':
    bake_dial()

