"""Fade shot 1's glowing 'AI' down to shot 2's steady blue over the push-in. usage: glowfade.py <frames/c1 dir> <scale>"""
import sys, numpy as np
from PIL import Image
d, S = sys.argv[1], float(sys.argv[2])
mult = np.array([.30, .45, .82], np.float32)
for n in range(100, 181):
    p = f'{d}/{n:04d}.jpg'
    a = np.asarray(Image.open(p)).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    x = np.clip((n - 100) / 70, 0, 1); k = x * x * (3 - 2 * x)
    w = np.clip((b - (r + g) / 2 - 15) / 70, 0, 1)
    win = np.zeros(r.shape, np.float32); win[int(740*S):int(1170*S), int(360*S):int(800*S)] = 1
    w = (w * win)[..., None] * k
    Image.fromarray(np.clip(a * (1 - w * (1 - mult)), 0, 255).astype(np.uint8)).save(p, quality=95)
print('glow faded')
