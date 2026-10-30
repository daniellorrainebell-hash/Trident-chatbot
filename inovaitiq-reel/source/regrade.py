"""Shift warm (orange/yellow) light in the city footage to the reel's electric blue; leave blues and neutrals alone."""
import sys, glob, numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor

def grade(path):
    im = Image.open(path).convert('HSV'); a = np.asarray(im).astype(np.float32)
    h, s, v = a[..., 0] * (360 / 255), a[..., 1] / 255, a[..., 2] / 255
    warm = ((h < 75) | (h > 330)).astype(np.float32)
    w = warm * np.clip((s - .12) / .25, 0, 1)                 # only clearly coloured pixels
    nh = 222 + (np.where(h > 330, h - 360, h) - 35) * .25     # orange→~215-230° blue, keep a little variation
    h2 = h * (1 - w) + nh * w
    s2 = s * (1 - w) + np.clip(s * .82, 0, 1) * w
    v2 = np.clip(v * (1 - w * .05), 0, 1)
    out = np.stack([(h2 % 360) * 255 / 360, s2 * 255, v2 * 255], -1).astype(np.uint8)
    rgb = np.asarray(Image.fromarray(out, 'HSV').convert('RGB')).astype(np.float32)
    rgb = rgb * np.array([.94, .98, 1.06])                     # cool gunmetal cast overall
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(path, quality=94)

if __name__ == '__main__':
    files = sorted(glob.glob(sys.argv[1] + '/*.jpg'))
    with ProcessPoolExecutor() as ex: list(ex.map(grade, files))
    print(len(files), 'graded')
