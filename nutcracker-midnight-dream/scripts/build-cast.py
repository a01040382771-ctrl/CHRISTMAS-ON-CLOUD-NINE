"""Cut the AI-painted parts sheets (src/assets/gouache/sheets) into the
named rig pieces used by src/components/PaintedCast.tsx.
Boxes are in sheet pixels; pivots are documented in PaintedCast.tsx."""
import os
import numpy as np
from PIL import Image, ImageFilter

S = 'src/assets/gouache/sheets/'
O = 'public/gouache/cast/'
os.makedirs(O, exist_ok=True)


def crop(sheet, box, name, keep=None):
    im = Image.open(S + sheet).convert('RGBA').crop(box)
    if keep is not None:
        keep(im)
    im.save(O + name + '.png')
    return im


# ---------- Nutcracker ----------
NB = (48, 120, 436, 1000)
body = Image.open(S + 'nutcracker-sheet.png').convert('RGBA').crop(NB)
a = np.asarray(body).copy()
h, w = a.shape[:2]
yy, xx = np.mgrid[0:h, 0:w]
# epaulettes become their own overlay so the separate arms tuck underneath
ep = ((yy > 40) & (yy < 168) & ((xx < 102) | (xx > 286)))
epa = a.copy()
epa[~ep, 3] = 0
Image.fromarray(epa).save(O + 'nut-epaulettes.png')
# erase the painted-on arms below the epaulettes
arms = (yy > 150) & (yy < 420) & ((xx < 88) | (xx > 296))
a[arms, 3] = 0
Image.fromarray(a).save(O + 'nut-body.png')
for i, (box, n) in enumerate([((476, 12, 760, 520), 'nut-head-front'), ((828, 12, 1112, 520), 'nut-head-left'), ((1176, 12, 1460, 522), 'nut-head-wink')]):
    crop('nutcracker-sheet.png', box, n)
crop('nutcracker-sheet.png', (644, 524, 764, 812), 'nut-uarm-l')
crop('nutcracker-sheet.png', (896, 524, 1016, 812), 'nut-uarm-r')
crop('nutcracker-sheet.png', (734, 818, 846, 1014), 'nut-farm-l')
crop('nutcracker-sheet.png', (1146, 816, 1262, 1012), 'nut-farm-r')

# ---------- Clara heads: lift the ribbon onto its own layer so it can sway ----------
for box, n in [((48, 14, 448, 412), 'clara-head-open'), ((562, 16, 962, 414), 'clara-head-sleep'), ((1078, 14, 1476, 412), 'clara-head-wonder')]:
    im = Image.open(S + 'clara-heads-sheet.png').convert('RGBA').crop(box)
    a = np.asarray(im).astype(np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    hh, ww = al.shape
    yy, xx = np.mgrid[0:hh, 0:ww]
    red = (r > 140) & (r > g * 1.55) & (r > b * 1.5) & (al > 40) & (yy < 200) & (xx > 285)
    m = Image.fromarray((red * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    red = np.asarray(m) > 0
    rib = a.copy()
    rib[~red, 3] = 0
    Image.fromarray(rib.astype(np.uint8)).save(O + n.replace('head', 'ribbon') + '.png')
    base = a.copy()
    # fill the hole with blurred hair colour, but only where hair surrounds it
    keep = (~red) & (al > 40)
    km = keep.astype(np.float32)
    col = np.zeros_like(base[..., :3])
    for c in range(3):
        ch = Image.fromarray(np.where(keep, base[..., c], 0).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))
        col[..., c] = np.asarray(ch).astype(np.float32)
    wgt = np.asarray(Image.fromarray((km * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
    fill = col / np.maximum(wgt[..., None], 1e-3)
    inside = wgt > 0.55
    base[red, :3] = np.clip(fill[red], 0, 255)
    base[red, 3] = np.where(inside[red], 255, 0)
    Image.fromarray(base.astype(np.uint8)).save(O + n + '.png')
crop('clara-heads-sheet.png', (354, 438, 566, 724), 'clara-uarm-l')
crop('clara-heads-sheet.png', (944, 434, 1160, 726), 'clara-uarm-r')
crop('clara-heads-sheet.png', (162, 570, 360, 1002), 'clara-farm-l')
crop('clara-heads-sheet.png', (1170, 572, 1374, 1002), 'clara-farm-r')
crop('clara-bodies-sheet.png', (24, 74, 344, 952), 'clara-body-stand')
crop('clara-bodies-sheet.png', (394, 332, 958, 914), 'clara-body-kneel')
crop('clara-bodies-sheet.png', (982, 422, 1514, 924), 'clara-body-sit')

# ---------- toy soldiers ----------
crop('soldier-sheet.png', (68, 18, 466, 900), 'soldier-rifle')
crop('soldier-sheet.png', (536, 18, 980, 966), 'soldier-drum')
crop('soldier-sheet.png', (1078, 466, 1206, 982), 'soldier-leg')

# ---------- ballerina turnaround ----------
for i, box in enumerate([(16, 50, 392, 962), (404, 50, 760, 962), (776, 50, 1150, 962), (1162, 50, 1524, 962)]):
    crop('ballerina-sheet.png', box, f'ballerina-{i}')
print('cast written to', O, sorted(os.listdir(O)))
