import struct

def build_ico(entries, out_path):
    # entries: list of (png_bytes, width, height) -- width/height 0 means 256
    n = len(entries)
    header = struct.pack("<HHH", 0, 1, n)  # reserved, type=1(icon), count
    dir_entries = b""
    data_blob = b""
    offset = 6 + 16 * n
    for png_bytes, w, h in entries:
        w_b = 0 if w >= 256 else w
        h_b = 0 if h >= 256 else h
        entry = struct.pack("<BBBBHHII",
            w_b, h_b, 0, 0,      # width, height, color count, reserved
            1, 32,               # planes, bitcount
            len(png_bytes), offset)
        dir_entries += entry
        data_blob += png_bytes
        offset += len(png_bytes)
    with open(out_path, "wb") as f:
        f.write(header + dir_entries + data_blob)

with open("dist/favicon-16.png","rb") as f: png16 = f.read()
with open("dist/favicon-32.png","rb") as f: png32 = f.read()

build_ico([(png16,16,16),(png32,32,32)], "dist/favicon.ico")
print("wrote manual dist/favicon.ico")
