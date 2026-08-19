import json
from PIL import Image, ImageDraw, ImageFilter

with open("monogram_data.json") as f:
    data = json.load(f)

p_outer = data["p_outer"]; p_hole = data["p_hole"]; l_outer = data["l_outer"]
bx0,by0,bx1,by1 = data["combined_bbox"]
bw, bh = bx1-bx0, by1-by0
cx, cy = (bx0+bx1)/2, (by0+by1)/2

def render_bold_16(dilate_px=10, glyph_frac=0.66, corner_frac=0.22, ss=16):
    size = 16
    S = size * ss
    k = (glyph_frac * S) / bw
    tx = S/2 - cx*k
    ty = S/2 - cy*k
    def xf(sp): return [(x*k+tx, y*k+ty) for x,y in sp]

    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(xf(p_outer), fill=255)
    md.polygon(xf(p_hole), fill=0)
    md.polygon(xf(l_outer), fill=255)
    mask = mask.filter(ImageFilter.MaxFilter(dilate_px*2+1))

    img = Image.new("RGBA", (S, S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0,0,S-1,S-1], radius=corner_frac*S, fill=(0,0,0,255))
    white = Image.new("RGBA", (S,S), (255,255,255,255))
    img.paste(white, (0,0), mask)
    return img.resize((size, size), Image.LANCZOS)

final16 = render_bold_16(dilate_px=10)
final16.save("dist/favicon-16.png")
print("wrote final dist/favicon-16.png (bold/simplified)")

# Build favicon.ico: 16 (bold, simplified) + 32 (authentic, unchanged)
img32 = Image.open("dist/favicon-32.png").convert("RGBA")
final16.save("dist/favicon.ico", format="ICO", sizes=[(16,16),(32,32)],
             append_images=[img32])
print("wrote dist/favicon.ico (16 bold + 32 authentic)")
