import re, json

with open("../hero/logo.svg") as f:
    content = f.read()
m = re.search(r'd="([^"]+)"', content)
d = m.group(1)
tokens = re.findall(r'([MLZ])(?:\s+([\-\d.]+)\s+([\-\d.]+))?', d)
subpaths = []
current = []
for cmd, x, y in tokens:
    if cmd == 'M':
        if current: subpaths.append(current)
        current = [(float(x), float(y))]
    elif cmd == 'L':
        current.append((float(x), float(y)))
    elif cmd == 'Z':
        if current: subpaths.append(current)
        current = []
if current: subpaths.append(current)

sp9 = subpaths[9]  # P+R fused
p_outer = sp9[0:22] + sp9[51:60]   # split at shared vertex (179,70)
p_hole = subpaths[11]
l_outer = subpaths[8]

def bbox(sp):
    xs=[p[0] for p in sp]; ys=[p[1] for p in sp]
    return min(xs),min(ys),max(xs),max(ys)

# Cap heights (top of glyph to baseline, excluding decorative tail):
# P: top=12 (point0), baseline~206 (point5, stem's outer-bottom before tail)
# L: top=32 (point91), baseline~181 (point12, stem's bottom-right before tail)
P_TOP, P_BASE = 12.0, 206.0
L_TOP, L_BASE = 32.0, 181.0
p_cap = P_BASE - P_TOP
l_cap = L_BASE - L_TOP
scale_l = p_cap / l_cap
print("p_cap", p_cap, "l_cap", l_cap, "scale_l", scale_l)

def transform(sp, sx, sy, tx, ty):
    return [(x*sx+tx, y*sy+ty) for x,y in sp]

# Scale L up around its own top-left-ish origin, keep P as-is (reference scale).
l_outer_scaled = transform(l_outer, scale_l, scale_l, 0, 0)

pb = bbox(p_outer)
lb = bbox(l_outer_scaled)
print("P bbox", pb)
print("L bbox (scaled)", lb)

# Baseline-align: shift scaled-L so its baseline (L_BASE*scale_l) matches P's baseline (P_BASE)
l_baseline_scaled = L_BASE * scale_l
dy = P_BASE - l_baseline_scaled
# Horizontal: place L immediately right of P with a kerning gap
gap = 18.0  # tuned gap between P's right edge and L's left edge
dx = pb[2] - lb[0] + gap

l_outer_final = transform(l_outer_scaled, 1, 1, dx, dy)
lb2 = bbox(l_outer_final)
print("L bbox (final)", lb2)

def d_str(sp):
    return "M " + " L ".join(f"{x:.2f} {y:.2f}" for x,y in sp) + " Z"

# Combined bbox of PL group (P outer+hole irrelevant to bbox since hole is inside; L final)
all_pts = p_outer + list(p_hole) + l_outer_final
xs = [p[0] for p in all_pts]; ys = [p[1] for p in all_pts]
gx0,gy0,gx1,gy1 = min(xs),min(ys),max(xs),max(ys)
print("combined bbox", gx0,gy0,gx1,gy1, "w", gx1-gx0, "h", gy1-gy0)

data = {
    "p_outer": p_outer,
    "p_hole": p_hole,
    "l_outer": l_outer_final,
    "combined_bbox": [gx0,gy0,gx1,gy1],
}
with open("monogram_data.json", "w") as f:
    json.dump(data, f)
print("wrote monogram_data.json")
