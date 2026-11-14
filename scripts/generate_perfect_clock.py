import math
import os
from PIL import Image, ImageDraw, ImageFont

def generate_dial_texture(output_path):
    dim = 2048
    img = Image.new('RGBA', (dim, dim), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = dim // 2, dim // 2
    r = dim // 2 - 16

    # 1. Pure Porcelain Enamel Face with subtle radial depth
    for ri in range(r, 0, -2):
        t = ri / r
        cr = int(255 - (1.0 - t) * 6)
        cg = int(253 - (1.0 - t) * 8)
        cb = int(248 - (1.0 - t) * 14)
        draw.ellipse([cx - ri, cy - ri, cx + ri, cy + ri], fill=(cr, cg, cb, 255))

    # 2. Concentric Chapter Rings & Gilded Accents
    # Outer Gilded Rim
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(212, 175, 55, 255), width=24)
    # Primary Outer Railway Border (Deep Jet Black)
    draw.ellipse([cx - int(r*0.96), cy - int(r*0.96), cx + int(r*0.96), cy + int(r*0.96)], outline=(5, 5, 5, 255), width=26)
    # Inner Railway Track
    draw.ellipse([cx - int(r*0.84), cy - int(r*0.84), cx + int(r*0.84), cy + int(r*0.84)], outline=(20, 18, 16, 255), width=14)
    # Decorative Inner Gilded Chapter Circle
    draw.ellipse([cx - int(r*0.56), cy - int(r*0.56), cx + int(r*0.56), cy + int(r*0.56)], outline=(195, 155, 75, 220), width=8)

    # 3. 60-Minute Railroad Track Ticks
    for m in range(60):
        ang = m * math.pi / 30.0
        sin_a = math.sin(ang)
        cos_a = math.cos(ang)
        is_hour = (m % 5 == 0)

        r_outer = r * 0.96
        r_inner = r * 0.84 if is_hour else r * 0.89

        p1 = (cx + sin_a * r_inner, cy - cos_a * r_inner)
        p2 = (cx + sin_a * r_outer, cy - cos_a * r_outer)

        w = 26 if is_hour else 10
        col = (0, 0, 0, 255) if is_hour else (60, 50, 42, 255)
        draw.line([p1, p2], fill=col, width=w)

        # Polished Gold Hour Marker Beads
        if is_hour:
            rb = r * 0.80
            bx = cx + sin_a * rb
            by = cy - cos_a * rb
            draw.ellipse([bx - 18, by - 18, bx + 18, by + 18], fill=(212, 175, 55, 255), outline=(130, 95, 25, 255), width=4)

    # 4. Ultra-Crisp Roman Numerals (Bold, High Contrast, Perfectly Aligned)
    font_num = ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf', 160)
    font_brand = ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf', 68)
    font_sub = ImageFont.truetype('C:/Windows/Fonts/times.ttf', 40)
    font_city = ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf', 36)

    numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    for h_idx in range(12):
        ang = h_idx * math.pi / 6.0
        sin_a = math.sin(ang)
        cos_a = math.cos(ang)
        rn = numerals[h_idx]

        dist = r * 0.67
        tx = cx + sin_a * dist
        ty = cy - cos_a * dist

        bbox = font_num.getbbox(rn)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]

        # Draw with stroke for maximum edge contrast
        draw.text((tx - tw//2, ty - th//2 - bbox[1]), rn, fill=(0, 0, 0, 255), font=font_num, stroke_width=4, stroke_fill=(0, 0, 0, 255))

    # 5. Vintage Haute Horlogerie Inscription
    brand = 'S É R È N'
    bbox_b = font_brand.getbbox(brand)
    draw.text((cx - (bbox_b[2]-bbox_b[0])//2, cy - 255), brand, fill=(10, 10, 10, 255), font=font_brand)

    sub = "Horlogerie d'Atelier"
    bbox_s = font_sub.getbbox(sub)
    draw.text((cx - (bbox_s[2]-bbox_s[0])//2, cy - 195), sub, fill=(80, 70, 60, 255), font=font_sub)

    city = 'PARIS • 1889'
    bbox_c = font_city.getbbox(city)
    draw.text((cx - (bbox_c[2]-bbox_c[0])//2, cy + 225), city, fill=(85, 75, 65, 255), font=font_city)

    star = '✦'
    bbox_star = font_sub.getbbox(star)
    draw.text((cx - (bbox_star[2]-bbox_star[0])//2, cy + 275), star, fill=(212, 175, 55, 255), font=font_sub)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, quality=98)
    print(f'Dial texture saved to {output_path}')


def generate_clock_obj():
    dial_tex_path = 'Clock/textures/clock_dial_uhd.png'
    generate_dial_texture(dial_tex_path)

    # Also write MTL file
    mtl_path = 'Clock/clock_perfect.mtl'
    with open(mtl_path, 'w') as f:
        f.write("""# Authentic Classic Wall Clock Materials
newmtl dial_mat
Kd 1.0 1.0 1.0
Ka 0.2 0.2 0.2
Ks 0.1 0.1 0.1
Ns 30
map_Kd textures/clock_dial_uhd.png

newmtl brass_mat
Kd 0.78 0.65 0.38
Ka 0.3 0.25 0.15
Ks 0.9 0.8 0.5
Ns 80

newmtl walnut_mat
Kd 0.16 0.11 0.08
Ka 0.1 0.08 0.05
Ks 0.2 0.15 0.1
Ns 20

newmtl gold_mat
Kd 0.85 0.70 0.25
Ka 0.35 0.30 0.15
Ks 0.95 0.88 0.6
Ns 90

newmtl blued_steel_mat
Kd 0.04 0.05 0.06
Ka 0.05 0.05 0.06
Ks 0.8 0.82 0.85
Ns 70
""")

    # Build OBJ
    obj_lines = []
    obj_lines.append('# Authentic Parisian Grand Wall Clock')
    obj_lines.append('mtllib clock_perfect.mtl')

    v_list = []
    vt_list = []
    vn_list = []

    def add_v(x, y, z):
        v_list.append((x, y, z))
        return len(v_list)

    def add_vt(u, v):
        vt_list.append((u, v))
        return len(vt_list)

    def add_vn(nx, ny, nz):
        vn_list.append((nx, ny, nz))
        return len(vn_list)

    SEGMENTS = 72
    clock_r = 0.325 # 65cm diameter statement clock
    dial_r = 0.300

    # 1. CLOCK MAIN
    obj_lines.append('\no clock_main')
    obj_lines.append('g clock_main')

    # A. Walnut Casing (Outer cylinder)
    obj_lines.append('usemtl walnut_mat')
    vn_back = add_vn(0, 0, -1)
    vn_front = add_vn(0, 0, 1)

    # Casing outer & back
    c_rim_r = clock_r + 0.024
    c_z_back = -0.020
    c_z_front = 0.016

    # Dial face (Planar circle at z = 0.014)
    obj_lines.append('usemtl dial_mat')
    center_v = add_v(0, 0, 0.014)
    center_vt = add_vt(0.5, 0.5)
    dial_vn = add_vn(0, 0, 1)

    dial_ring = []
    for i in range(SEGMENTS):
        ang = i * 2.0 * math.pi / SEGMENTS
        x = dial_r * math.cos(ang)
        y = dial_r * math.sin(ang)
        v_idx = add_v(x, y, 0.014)
        u = 0.5 + 0.5 * (x / dial_r)
        v = 0.5 + 0.5 * (y / dial_r)
        vt_idx = add_vt(u, v)
        dial_ring.append((v_idx, vt_idx))

    for i in range(SEGMENTS):
        next_i = (i + 1) % SEGMENTS
        v1, vt1 = dial_ring[i]
        v2, vt2 = dial_ring[next_i]
        obj_lines.append(f'f {center_v}/{center_vt}/{dial_vn} {v1}/{vt1}/{dial_vn} {v2}/{vt2}/{dial_vn}')

    # Outer Bezel Ring (Brass)
    obj_lines.append('usemtl brass_mat')
    bezel_inner_r = dial_r - 0.004
    bezel_outer_r = clock_r + 0.012
    bz_z1 = 0.012
    bz_z2 = 0.022

    bz_inner = []
    bz_outer = []
    for i in range(SEGMENTS):
        ang = i * 2.0 * math.pi / SEGMENTS
        ca, sa = math.cos(ang), math.sin(ang)
        vi = add_v(bezel_inner_r * ca, bezel_inner_r * sa, bz_z1)
        vo = add_v(bezel_outer_r * ca, bezel_outer_r * sa, bz_z2)
        vn = add_vn(ca * 0.4, sa * 0.4, 0.8)
        vt = add_vt(i / SEGMENTS, 0.5)
        bz_inner.append((vi, vt, vn))
        bz_outer.append((vo, vt, vn))

    for i in range(SEGMENTS):
        ni = (i + 1) % SEGMENTS
        v_i1, vt_i1, vn_i1 = bz_inner[i]
        v_i2, vt_i2, vn_i2 = bz_inner[ni]
        v_o1, vt_o1, vn_o1 = bz_outer[i]
        v_o2, vt_o2, vn_o2 = bz_outer[ni]
        obj_lines.append(f'f {v_i1}/{vt_i1}/{vn_i1} {v_i2}/{vt_i2}/{vn_i2} {v_o2}/{vt_o2}/{vn_o2}')
        obj_lines.append(f'f {v_i1}/{vt_i1}/{vn_i1} {v_o2}/{vt_o2}/{vn_o2} {v_o1}/{vt_o1}/{vn_o1}')

    # Walnut casing rim
    obj_lines.append('usemtl walnut_mat')
    case_outer_r = clock_r + 0.024
    for i in range(SEGMENTS):
        ang = i * 2.0 * math.pi / SEGMENTS
        ca, sa = math.cos(ang), math.sin(ang)
        v_b1 = add_v(case_outer_r * ca, case_outer_r * sa, -0.025)
        v_f1 = add_v(bezel_outer_r * ca, bezel_outer_r * sa, bz_z2)
        ang_n = (i + 1) * 2.0 * math.pi / SEGMENTS
        ca_n, sa_n = math.cos(ang_n), math.sin(ang_n)
        v_b2 = add_v(case_outer_r * ca_n, case_outer_r * sa_n, -0.025)
        v_f2 = add_v(bezel_outer_r * ca_n, bezel_outer_r * sa_n, bz_z2)
        vn_c = add_vn(ca, sa, 0)
        vt_c = add_vt(i / SEGMENTS, 0.2)
        obj_lines.append(f'f {v_b1}/{vt_c}/{vn_c} {v_b2}/{vt_c}/{vn_c} {v_f2}/{vt_c}/{vn_c}')
        obj_lines.append(f'f {v_b1}/{vt_c}/{vn_c} {v_f2}/{vt_c}/{vn_c} {v_f1}/{vt_c}/{vn_c}')

    # Pinion hub (Center Brass Pin)
    obj_lines.append('usemtl gold_mat')
    pin_c = add_v(0, 0, 0.032)
    pin_ring = []
    for i in range(24):
        ang = i * 2.0 * math.pi / 24
        x = 0.012 * math.cos(ang)
        y = 0.012 * math.sin(ang)
        pv = add_v(x, y, 0.030)
        pvt = add_vt(0.5, 0.5)
        pin_ring.append((pv, pvt))
    for i in range(24):
        ni = (i + 1) % 24
        obj_lines.append(f'f {pin_c}/{center_vt}/{vn_front} {pin_ring[i][0]}/{pin_ring[i][1]}/{vn_front} {pin_ring[ni][0]}/{pin_ring[ni][1]}/{vn_front}')

    # 2. HOUR HAND (Pivoted at 0, 0, 0 pointing straight UP at +Y)
    obj_lines.append('\no hour_hand')
    obj_lines.append('g hour_hand')
    obj_lines.append('usemtl blued_steel_mat')
    # Solid 3D Breguet Hour Hand
    h_z = 0.020
    # Shaft box: width 0.012, height 0.115
    hw = 0.006
    h1 = add_v(-hw, 0, h_z)
    h2 = add_v(hw, 0, h_z)
    h3 = add_v(hw, 0.090, h_z)
    h4 = add_v(-hw, 0.090, h_z)
    h_vt = add_vt(0.1, 0.1)
    obj_lines.append(f'f {h1}/{h_vt}/{vn_front} {h2}/{h_vt}/{vn_front} {h3}/{h_vt}/{vn_front}')
    obj_lines.append(f'f {h1}/{h_vt}/{vn_front} {h3}/{h_vt}/{vn_front} {h4}/{h_vt}/{vn_front}')

    # Moon ring at y = 0.095, radius 0.018
    moon_c = add_v(0, 0.095, h_z)
    for i in range(20):
        a1 = i * 2.0 * math.pi / 20
        a2 = (i + 1) * 2.0 * math.pi / 20
        m1 = add_v(0.018 * math.cos(a1), 0.095 + 0.018 * math.sin(a1), h_z)
        m2 = add_v(0.018 * math.cos(a2), 0.095 + 0.018 * math.sin(a2), h_z)
        obj_lines.append(f'f {moon_c}/{h_vt}/{vn_front} {m1}/{h_vt}/{vn_front} {m2}/{h_vt}/{vn_front}')

    # Pointer tip
    ht1 = add_v(-0.005, 0.112, h_z)
    ht2 = add_v(0.005, 0.112, h_z)
    ht_tip = add_v(0, 0.132, h_z)
    obj_lines.append(f'f {ht1}/{h_vt}/{vn_front} {ht2}/{h_vt}/{vn_front} {ht_tip}/{h_vt}/{vn_front}')

    # 3. MINUTE HAND (Pivoted at 0, 0, 0 pointing straight UP at +Y)
    obj_lines.append('\no minute_hand')
    obj_lines.append('g minute_hand')
    obj_lines.append('usemtl blued_steel_mat')
    m_z = 0.024
    mw = 0.0045
    m1 = add_v(-mw, 0, m_z)
    m2 = add_v(mw, 0, m_z)
    m3 = add_v(mw, 0.155, m_z)
    m4 = add_v(-mw, 0.155, m_z)
    obj_lines.append(f'f {m1}/{h_vt}/{vn_front} {m2}/{h_vt}/{vn_front} {m3}/{h_vt}/{vn_front}')
    obj_lines.append(f'f {m1}/{h_vt}/{vn_front} {m3}/{h_vt}/{vn_front} {m4}/{h_vt}/{vn_front}')

    # Moon ring at y = 0.160, radius 0.014
    min_moon_c = add_v(0, 0.160, m_z)
    for i in range(20):
        a1 = i * 2.0 * math.pi / 20
        a2 = (i + 1) * 2.0 * math.pi / 20
        mm1 = add_v(0.014 * math.cos(a1), 0.160 + 0.014 * math.sin(a1), m_z)
        mm2 = add_v(0.014 * math.cos(a2), 0.160 + 0.014 * math.sin(a2), m_z)
        obj_lines.append(f'f {min_moon_c}/{h_vt}/{vn_front} {mm1}/{h_vt}/{vn_front} {mm2}/{h_vt}/{vn_front}')

    # Needle tip
    mt1 = add_v(-0.004, 0.174, m_z)
    mt2 = add_v(0.004, 0.174, m_z)
    mt_tip = add_v(0, 0.205, m_z)
    obj_lines.append(f'f {mt1}/{h_vt}/{vn_front} {mt2}/{h_vt}/{vn_front} {mt_tip}/{h_vt}/{vn_front}')

    # 4. SECOND HAND (Pivoted at 0, 0, 0 pointing straight UP at +Y)
    obj_lines.append('\no second_hand')
    obj_lines.append('g second_hand')
    obj_lines.append('usemtl gold_mat')
    s_z = 0.028
    sw = 0.0018
    s1 = add_v(-sw, -0.045, s_z)
    s2 = add_v(sw, -0.045, s_z)
    s3 = add_v(sw, 0.225, s_z)
    s4 = add_v(-sw, 0.225, s_z)
    s_vt = add_vt(0.9, 0.9)
    obj_lines.append(f'f {s1}/{s_vt}/{vn_front} {s2}/{s_vt}/{vn_front} {s3}/{s_vt}/{vn_front}')
    obj_lines.append(f'f {s1}/{s_vt}/{vn_front} {s3}/{s_vt}/{vn_front} {s4}/{s_vt}/{vn_front}')

    # Counterweight disc at y = -0.030, radius 0.012
    s_disc_c = add_v(0, -0.030, s_z)
    for i in range(16):
        a1 = i * 2.0 * math.pi / 16
        a2 = (i + 1) * 2.0 * math.pi / 16
        sd1 = add_v(0.012 * math.cos(a1), -0.030 + 0.012 * math.sin(a1), s_z)
        sd2 = add_v(0.012 * math.cos(a2), -0.030 + 0.012 * math.sin(a2), s_z)
        obj_lines.append(f'f {s_disc_c}/{s_vt}/{vn_front} {sd1}/{s_vt}/{vn_front} {sd2}/{s_vt}/{vn_front}')

    # Write full OBJ file
    obj_path = 'Clock/clock_perfect.obj'
    with open(obj_path, 'w') as f:
        f.write('# Vertices\n')
        for v in v_list:
            f.write(f'v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n')
        f.write('# Texture coordinates\n')
        for vt in vt_list:
            f.write(f'vt {vt[0]:.6f} {vt[1]:.6f}\n')
        f.write('# Normals\n')
        for vn in vn_list:
            f.write(f'vn {vn[0]:.6f} {vn[1]:.6f} {vn[2]:.6f}\n')
        f.write('\n'.join(obj_lines))

    print(f'Clock OBJ saved to {obj_path}')

if __name__ == '__main__':
    generate_clock_obj()

