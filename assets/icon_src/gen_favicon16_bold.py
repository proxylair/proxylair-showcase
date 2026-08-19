import json
from PIL import Image, ImageDraw, ImageFilter

with open("monogram_data.json") as f:
    data = json.load(f)

p_outer = data["p_outer"]
p_hole = data["p_hole"]
l_outer = data["l_outer"]
bx0,by0,bx1,by1 = data["combined_bbox"]
bw, bh = bx1-bx0, by1-by0
cx, cy = (bx0+bx1)/2, (by0+by1)/2

def render_bold_16(dilate_px, glyph_frac, corner_frac, ss=16):
    size = 16
    S = size * ss  # working resolution before final downsample
    k = (glyph_frac * S) / bw
    tx = S/2 - cx*k
    ty = S/2 - cy*k
    def xf(sp):
        return [(x*k+tx, y*k+ty) for x,y in sp]

    # Letterform mask (white glyph incl. hole punched, alpha channel only)
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(xf(p_outer), fill=255)
    md.polygon(xf(p_hole), fill=0)
    md.polygon(xf(l_outer), fill=255)

    # Dilate (bold up) the letterform strokes
    if dilate_px > 0:
        kernel = dilate_px * 2 + 1
        mask = mask.filter(ImageFilter.MaxFilter(kernel))

    # Composite: black rounded-square bg + white glyph mask
    img = Image.new("RGBA", (S, S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    r = corner_frac * S
    d.rounded_rectangle([0,0,S-1,S-1], radius=r, fill=(0,0,0,255))
    white = Image.new("RGBA", (S,S), (255,255,255,255))
    img.paste(white, (0,0), mask)

    return img.resize((size, size), Image.LANCZOS)

# Try a few dilation amounts (in working-resolution px, ss=16 so 1 output px = 16 working px)
for dilate in [6, 10, 14, 18]:
    img = render_bold_16(dilate_px=dilate, glyph_frac=0.66, corner_frac=0.22)
    img.save(f"dist/favicon-16-bold-d{dilate}.png")
    print("wrote favicon-16-bold-d%d.png" % dilate)
