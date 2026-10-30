"""House-style score for the INOVAITIQ reel.

Grid: beat 0 = first drop at 9.0s (chip powers on). 72 beats later = second drop at 44.0s (city).
Intro (0-9): dark pad, muffled kick from 5.3s, snare-roll build.  Groove: bars 0-13.
Breakdown: bars 14-17 (no kick/bass, filtered stabs, build).  Drop 2: bar 18 to the end.
"""
import numpy as np, wave

SR = 48000
DUR = 60.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)          # drums/bass/stabs (sidechain-free)
PL = np.zeros(N); PR = np.zeros(N)        # pads/stabs bus that gets ducked by the kick

DROP1 = 9.0
BEAT = 35.0 / 72                         # ~123.4 BPM, lands bar 18 exactly on 44.0s
BAR = 4 * BEAT
DROP2 = DROP1 + 72 * BEAT                # 44.0
BREAK = DROP1 + 56 * BEAT                # ~36.2 (4-bar breakdown)


def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


SL = np.zeros(N); SR_ = np.zeros(N)       # reverb send


def place(sig, at, gain=1.0, pan=0.0, bus='main', rev=0.0):
    i = int(round(at * SR))
    if i >= N: return
    j = min(N, i + len(sig)); s = sig[: j - i] * gain
    l, r = (L, R) if bus == 'main' else (PL, PR)
    l[i:j] += s * (1 - max(0, pan)); r[i:j] += s * (1 + min(0, pan))
    if rev: SL[i:j] += s * rev * (1 - max(0, pan)); SR_[i:j] += s * rev * (1 + min(0, pan))


def curve(points):
    xs, ys = zip(*points); return np.interp(t, xs, ys)


def saw_n(f, n, ph=0.0):
    tt = np.arange(n) / SR; return 2 * ((tt * f + ph) % 1) - 1


# ---------------- instruments
def kick(muffled=False):
    n = int(.45 * SR); tt = np.arange(n) / SR
    f = 48 + 110 * np.exp(-tt * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7.5)
    click = band(rng.standard_normal(n), 1500, 7000) * np.exp(-tt * 300) * .35
    k = np.tanh((body + click) * 1.6)
    return band(k, 20, 160) * 1.3 if muffled else k


def clap():
    n = int(.35 * SR); tt = np.arange(n) / SR
    nz = band(rng.standard_normal(n), 900, 6000)
    e = sum(np.exp(-np.clip(tt - d, 0, None) * 60) * (tt >= d) for d in (0, .011, .022)) / 3
    return nz * (e + .4 * np.exp(-tt * 14))


def hat(open_=False):
    n = int((.32 if open_ else .06) * SR); tt = np.arange(n) / SR
    return band(rng.standard_normal(n), 7000, 16000) * np.exp(-tt * (9 if open_ else 70))


def snare():
    n = int(.18 * SR); tt = np.arange(n) / SR
    return (band(rng.standard_normal(n), 1200, 9000) * .8 + np.sin(2 * np.pi * 190 * tt) * .5) * np.exp(-tt * 22)


def bass(f, dur=.22):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = saw_n(f, n) * .6 + np.sin(2 * np.pi * f * tt)
    s = band(s, 25, 420) * np.minimum(1, tt / .004) * np.exp(-tt * 6)
    return np.tanh(s * 1.4)


def stab(freqs, lo=250, hi=3200, dur=.32):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = sum(saw_n(f * d, n, rng.random()) for f in freqs for d in (.995, 1.005))
    return band(s, lo, hi) * np.minimum(1, tt / .003) * np.exp(-tt * 9) / len(freqs)


SWING = BEAT * .055                      # push the off 16ths late for groove


def shaker():
    n = int(.05 * SR); tt = np.arange(n) / SR
    return band(rng.standard_normal(n), 4500, 12000) * np.minimum(1, tt / .004) * np.exp(-tt * 55)


def perc(f):  # wooden rim/tok
    n = int(.12 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 1.48 * tt)) * np.exp(-tt * 38) + band(rng.standard_normal(n), 2000, 6000) * np.exp(-tt * 300) * .3


def pluck(f, bright=1.0):
    n = int(.45 * SR); tt = np.arange(n) / SR
    s = sum(saw_n(f * d, n, rng.random()) for d in (.996, 1.004)) * .5 + np.sin(2 * np.pi * f * tt)
    lo_band = band(s, 150, 900 + 1200 * bright) * np.exp(-tt * 9)
    hi_band = band(s, 900 + 1200 * bright, 6000 * bright + 1000) * np.exp(-tt * 28)   # brightness dies first, like a filter env
    return (lo_band + hi_band * .8) * np.minimum(1, tt / .002)


def crash():
    n = int(2.8 * SR); tt = np.arange(n) / SR
    return band(rng.standard_normal(n), 3500, 16000) * np.exp(-tt * 1.6) * np.minimum(1, tt / .002)


CHORDS = [  # A minor house: Am7 · Fmaj7 · Dm7 · Em7
    ((220, 261.63, 329.63, 392.0), 55.0),
    ((174.61, 220, 261.63, 329.63), 43.65),
    ((146.83, 174.61, 220, 261.63), 73.42),
    ((164.81, 196.0, 246.94, 293.66), 41.2),
]

# ---------------- pad (the original dark drone, kept)
def saw(f, ph=0): return 2 * ((t * f + ph) % 1) - 1
pad = band(sum(saw(f * d, rng.random()) for f in (55, 82.41, 110, 130.81) for d in (.997, 1.003)), 30, 900) * .05
lift = band(sum(saw(f * d) for f in (220, 329.6) for d in (.996, 1.004)), 150, 2500) * .02
pad_env = curve([(0, 0), (1, .75), (8.6, .9), (9, 1), (BREAK, 1), (BREAK + .8, .35), (BREAK + 8 * BEAT, .4), (BREAK + 8 * BEAT + 1.2, 2.2), (DROP2, 3.0), (DROP2 + .2, 1), (58.5, 1), (60, 0)])
lift_env = curve([(0, 0), (8, 0), (9.5, .6), (BREAK, 1.2), (BREAK + .8, .2), (BREAK + 8 * BEAT, .3), (DROP2, 2.6), (DROP2 + .5, 1.1), (60, 0)])
PL += pad * pad_env + lift * lift_env * np.sin(t * .4)
PR += pad * pad_env * .97 + lift * lift_env * np.cos(t * .4)

# ---------------- intro build
b = DROP1 - 8 * BEAT                      # muffled kick for the last 2 bars before the drop
while b < DROP1 - 1e-6:
    place(kick(True), b, .55); b += BEAT
roll = DROP1 - 2 * BEAT                   # build sits in the last 2 kicks only
for i in range(8):                        # eight 16ths, rising
    at = roll + i * BEAT / 4
    place(snare(), at, .12 + .03 * i, pan=(.15 if i % 2 else -.15))

# ---------------- main grid
nbeats = int((DUR - DROP1) / BEAT) + 1
for k in range(nbeats):
    at = DROP1 + k * BEAT
    if at >= DUR: break
    bar, pos = divmod(k, 4)
    brk = 14 <= bar < 18
    outro = False                                   # play through; the master fade ends it with the picture
    chord, root = CHORDS[bar % 4]
    if not brk:
        place(kick(), at, .95)
        if pos in (1, 3): place(clap(), at, .32, pan=.05, rev=.35)
        place(hat(True), at + BEAT / 2, .09, pan=.25)
        if bar >= 3 and not outro:                      # 16th hats join after 3 bars
            for q in (0, 1, 3): place(hat(), at + q * BEAT / 4 + (SWING if q % 2 else 0), .045 + (.02 if q == 1 else 0), pan=-.2)
            for q in range(4): place(shaker(), at + q * BEAT / 4 + (SWING if q % 2 else 0), (.035, .02, .05, .025)[q], pan=.35)
        if not outro: place(bass(root), at + BEAT / 2, .38)
        if bar >= 18 and pos == 3: place(hat(True), at + BEAT * .75, .06, pan=-.3)  # extra lift in drop 2
    else:
        if bar >= 16: place(hat(True), at + BEAT / 2, .03 + .015 * (k - 64) / 8, pan=.25)   # half 2: hats creep back
    # chord stabs on the off-beat syncopation
    if pos in (0, 2) and not outro and not (14 <= bar < 16):    # breakdown half 1: melody alone
        lo, hi = (200, 900 + 700 * (bar - 16)) if brk else (250, 3200)
        place(stab(chord, lo, hi), at + BEAT * (.75 if pos == 0 else .5), .34 if brk else .16, pan=(-.3 if pos == 0 else .3), bus='pad', rev=.4)

# breakdown build into drop 2
roll = DROP2 - 4 * BEAT
for i in range(24):
    at = roll + (i * BEAT / 4 if i < 8 else 2 * BEAT + (i - 8) * BEAT / 8)
    place(snare(), at, .09 + .01 * i, pan=(.15 if i % 2 else -.15))


# ---------------- hook: syncopated pluck riff on chord tones
STEPS = [(0, 3), (3, 2), (6, 1), (8, 3), (10, 2), (13, 1), (14, 0)]   # (16th step, chord-tone index)
for bar in range(4, 30):
    b0 = DROP1 + bar * 4 * BEAT
    if b0 >= DUR: break
    brk = 14 <= bar < 18
    chord, _ = CHORDS[bar % 4]
    bright = .35 if bar < 8 else ((.55, .6, .8, 1.0)[bar - 14] if brk else (1.0 if bar >= 18 else .75))
    g = (.05 if bar < 8 else .075) * (1.15 if bar >= 18 else ((2.4, 2.3, 1.9, 1.7)[bar - 14] if brk else 1))      # melody carries the breakdown
    for st, ci in STEPS:
        at = b0 + st * BEAT / 4 + (SWING if st % 2 else 0)
        if at >= DUR: continue
        f = chord[ci] * 2
        p = pluck(f, bright)
        place(p, at, g, pan=0, rev=.5)
        if bar >= 16 and ci == 3:                                   # octave layer joins halfway through the breakdown
            place(pluck(f * 2, 1.0), at, g * .35, pan=0, rev=.5)   # octave sparkle in drop 2

place(crash(), DROP1, .2, pan=-.1, rev=.46); place(crash(), DROP2, .218, pan=.1, rev=.46)   # ~8% down

# ---------------- sidechain duck on the pad bus from every full kick
duck = np.ones(N)
for k in range(nbeats):
    at = DROP1 + k * BEAT; bar = k // 4
    if 14 <= bar < 18 or at >= DUR: continue
    i = int(at * SR); n = int(.3 * SR); tt = np.arange(min(n, N - i)) / SR
    duck[i:i + len(tt)] = np.minimum(duck[i:i + len(tt)], 1 - .7 * np.clip(1 - tt / .3, 0, 1) ** 2)
L += PL * duck; R += PR * duck

# ---------------- plate-ish reverb: convolve the send with decaying stereo noise
def ir(seed):
    rg = np.random.default_rng(seed); n = int(1.9 * SR); tt = np.arange(n) / SR
    x = rg.standard_normal(n) * np.exp(-tt * 3.4) * np.minimum(1, tt / .012)
    return band(x, 180, 7000)
def conv(x, h):
    n = len(x) + len(h); F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:len(x)]
wl, wr = conv(SL, ir(1)), conv(SR_, ir(2))
sc = .5 / (np.max(np.abs(np.stack([wl, wr]))) + 1e-9) * max(np.max(np.abs(SL)), 1e-9)
L += wl * sc * duck * .9; R += wr * sc * duck * .9


# ---------------- essential SFX
def glass(f=1760, n=0.5, bright=1.0):
    k = int(n * SR); tt = np.arange(k) / SR
    s = (np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 2.01 * tt) + .25 * np.sin(2 * np.pi * f * 3.02 * tt)) * np.exp(-tt * 14)
    return (s * .5 + band(rng.standard_normal(k), 3000, 12000) * np.exp(-tt * 200) * .6) * bright


def impact(at, g=1.0):
    n = int(2.5 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (38 + 30 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 2.2)
    place(boom + band(rng.standard_normal(n), 200, 5000) * np.exp(-tt * 5) * .25, at, .7 * g)


def riser(at, length, g=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    noise = band(rng.standard_normal(n), 400, 9000) * (tt / length) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / length) ** 2) / SR) * (tt / length) ** 3 * .25
    place(noise * .18 + tone * .4, at, g)


def shimmer(at, g=1.0):
    for i, f in enumerate((1318.5, 1760, 2217.5, 2637)):
        place(glass(f, 1.6, .6), at + i * .06, .16 * g, pan=(-.5 + i * .33))


for a in (1.5, 2.3, 3.1):                                  # missed calls
    place(glass(880, .6, .8), a, .22, -.2); place(glass(830, .6, .7), a + .12, .2, .2)
riser(DROP1 - 2 * BEAT, 2 * BEAT, .9); impact(DROP1, .8); shimmer(9.4)   # chip powers on (on the drop)
for a in (26, 27.7, 29.4, 31.1):
    place(glass(2637, .35, 1.2), a + .7, .2)               # each step ticks off
riser(38.0, 2.3, .4); place(glass(2093, .5, 1.1), 40.35, .24)   # bars climb, badge lands
riser(DROP2 - 2.0, 2.0, .8); impact(DROP2, .8)            # board becomes city (drop 2)
shimmer(54.4, 1.1)                                          # logo lands


# ---------------- master: short room, glue, fade
def room(x):
    y = x.copy()
    for d, g in ((.031, .22), (.057, .16), (.089, .12), (.143, .08), (.211, .05)):
        k = int(d * SR); y[k:] += x[:-k] * g
    return y


L, R = room(L), room(R)
mx = np.max(np.abs(np.stack([L, R])))
L, R = np.tanh(L / mx * 1.5) * .9, np.tanh(R / mx * 1.5) * .9
fo = np.clip((t - 58.6) / 1.4, 0, 1); fade = np.cos(fo * np.pi / 2) ** 1.2 * np.clip(t / .05, 0, 1); L *= fade; R *= fade
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([L, R], 1) * 32767).astype('<i2').tobytes())
print(f'beat={BEAT:.4f}s bpm={60/BEAT:.1f} break={BREAK:.2f} drop2={DROP2:.2f}')
