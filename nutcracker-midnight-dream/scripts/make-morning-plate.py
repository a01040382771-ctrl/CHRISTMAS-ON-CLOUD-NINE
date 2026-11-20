"""Derive the morning parlour from the painted night parlour so both scenes
show exactly the same room: window panes repainted as a pale dawn sky,
the fire dies down to embers, and the whole plate is warmed and lifted."""
from PIL import Image, ImageFilter
import numpy as np

im = np.asarray(Image.open('public/gouache/parlour-night.png').convert('RGB')).astype(np.float32)
h, w, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]
lum = 0.3 * r + 0.59 * g + 0.11 * b
yy, xx = np.mgrid[0:h, 0:w]

# window glass: bluish pixels inside the window
win = (xx > 218) & (xx < 412) & (yy > 70) & (yy < 732) & (b > r + 12)
m = Image.fromarray((win * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
m = np.asarray(m).astype(np.float32)[..., None] / 255
t = (yy[..., None] - 70) / 660.0  # top→bottom gradient: pale blue to gold
sky_top = np.array([214, 230, 238], np.float32)
sky_bot = np.array([252, 232, 196], np.float32)
sky = sky_top * (1 - t) + sky_bot * t
l = (lum[..., None] / 255.0)
morning_view = sky * (0.62 + 0.5 * l)  # keep painted rooftops/snow as light-dark texture
out = im * (1 - m) + np.clip(morning_view, 0, 255) * m

# fire → embers
fire = (xx < 120) & (yy > 830) & (yy < 1110) & (r > 170) & (g > 90)
fm = Image.fromarray((fire * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
fm = np.asarray(fm).astype(np.float32)[..., None] / 255
ember = np.stack([lum * 0.35 + 30, lum * 0.18 + 14, lum * 0.12 + 10], -1)
out = out * (1 - fm) + ember * fm

# morning grade: lift shadows, warm highlights
out = out / 255.0
out = 1 - (1 - out) * 0.86  # lift
out[..., 0] *= 1.03
out[..., 2] *= 0.94
out = np.clip(out * 255, 0, 255).astype(np.uint8)
Image.fromarray(out).save('public/gouache/parlour-morning.png')
print('wrote public/gouache/parlour-morning.png')
