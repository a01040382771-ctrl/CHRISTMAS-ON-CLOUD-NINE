"""Split a transparent parts sheet into one PNG per connected piece.
Usage: python3 scripts/split-sheet.py sheet.png outdir prefix"""
import sys, os
import numpy as np
from PIL import Image

src, outdir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert('RGBA')
a = np.asarray(im)[..., 3] > 30
h, w = a.shape
lab = np.zeros((h, w), np.int32)
n = 0
# iterative flood fill labelling (4-connectivity) on a downsampled mask for speed
step = 2
small = a[::step, ::step]
sh, sw = small.shape
labs = np.zeros((sh, sw), np.int32)
for y in range(sh):
    for x in range(sw):
        if small[y, x] and not labs[y, x]:
            n += 1
            stack = [(y, x)]
            labs[y, x] = n
            while stack:
                cy, cx = stack.pop()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < sh and 0 <= nx < sw and small[ny, nx] and not labs[ny, nx]:
                        labs[ny, nx] = n
                        stack.append((ny, nx))
os.makedirs(outdir, exist_ok=True)
parts = []
for i in range(1, n + 1):
    ys, xs = np.nonzero(labs == i)
    if len(ys) < 400:
        continue
    x0, x1, y0, y1 = xs.min() * step, (xs.max() + 1) * step, ys.min() * step, (ys.max() + 1) * step
    parts.append((x0, y0, x1, y1))
parts.sort(key=lambda b: (b[1] // 150, b[0]))
for k, (x0, y0, x1, y1) in enumerate(parts):
    # keep only this component's pixels (neighbours may poke into the box)
    m = Image.fromarray(((labs == 0) * 0).astype(np.uint8))
    crop = im.crop((x0 - 2, y0 - 2, x1 + 2, y1 + 2))
    comp = np.zeros((h, w), bool)
    idx = labs == (labs[(y0 + y1) // 2 // step, (x0 + x1) // 2 // step] if False else 0)
    crop.save(f'{outdir}/{prefix}-{k:02d}.png')
    print(k, (x0, y0, x1, y1), crop.size)
