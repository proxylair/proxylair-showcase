import json
from PIL import Image, ImageDraw

with open("monogram_data.json") as f:
    data = json.load(f)

p_outer = data["p_outer"]
p_hole = data["p_hole"]
l_outer = data["l_outer"]
bx0,by0,bx1,by1 = data["combined_bbox"]
bw, bh = bx1-bx0, by1-by0
cx, cy = (bx0+bx1)/2, (by0+by1)/2

SS = 4  # supersample factor for antialiasing

def render(size, glyph_frac, corner_frac, bleed, out_path):
    S = size * SS
    k = (glyph_frac * S) / bw
    tx = S/2 - cx*k
    ty = S/2 - cy*k
    def xf(sp):
        return [(x*k+tx, y*k+ty) for x,y in sp]

    img = Image.new("RGBA", (S, S), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    r = 0 if bleed else corner_frac * S
    if r > 0:
        draw.rounded_rectangle([0,0,S-1,S-1], radius=r, fill=(0,0,0,255))
    else:
        draw.rectangle([0,0,S-1,S-1], fill=(0,0,0,255))

    draw.polygon(xf(p_outer), fill=(255,255,255,255))
    draw.polygon(xf(p_hole), fill=(0,0,0,255))
    draw.polygon(xf(l_outer), fill=(255,255,255,255))

    img = img.resize((size, size), Image.LANCZOS)
    img.save(out_path)
    print("wrote", out_path, size, "x", size)

variants = [
    ("icon-512.png",        512, 0.60, 0.22, False),
    ("icon-192.png",        192, 0.60, 0.22, False),
    ("apple-touch-icon.png",180, 0.62, 0.0,  True),
    ("favicon-32.png",       32, 0.60, 0.22, False),
    ("favicon-16.png",       16, 0.60, 0.22, False),
    ("maskable-512.png",    512, 0.50, 0.0,  True),
    ("maskable-192.png",    192, 0.50, 0.0,  True),
]

import os
os.makedirs("dist", exist_ok=True)
for name, size, gf, cf, bleed in variants:
    render(size, gf, cf, bleed, f"dist/{name}")
