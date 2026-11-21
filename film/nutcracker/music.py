"""Original 30-second music-box score for the film (synthesised, no samples).

Cues follow the picture:
  0.0  만남     – music-box waltz in G
  5.5  여행     – the waltz again, fuller, with sleigh bells
 10.5  눈꽃 요정 – shimmering E-minor arpeggios, glockenspiel, airy pad
 15.5  생쥐 대왕 – staccato minor march, timpani, sword clangs, slipper hit, poof
 21.5  결혼식   – harp glissando into the transformation, wedding bells, waltz in C
 26.4  깨어남   – slow music-box lullaby, final held chord
"""
import sys
import wave
import numpy as np

SR = 44100
DUR = 30.5
N = int(SR * DUR)
L = np.zeros(N)
Rr = np.zeros(N)
rng = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l
    Rr[i:i + len(sig)] += sig * gain * r


def env(n, a=0.004, tau=0.6):
    t = np.arange(n) / SR
    e = np.exp(-t / tau)
    att = int(a * SR)
    if att > 0:
        e[:att] *= np.linspace(0, 1, att)
    return e


def celesta(m, dur=1.2, tau=0.55):
    f = hz(m); n = int(SR * (dur + 1.2)); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.25)
         + 0.12 * np.sin(2 * np.pi * 3.98 * f * t) * np.exp(-t / 0.12) + 0.05 * np.sin(2 * np.pi * 5.43 * f * t) * np.exp(-t / 0.06))
    return s * env(n, 0.002, tau)


def musicbox(m, tau=0.9):
    f = hz(m); n = int(SR * 2.2); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 3.0 * f * t) * np.exp(-t / 0.2) + 0.15 * np.sin(2 * np.pi * 5.8 * f * t) * np.exp(-t / 0.05)
    return s * env(n, 0.001, tau)


def pluck(m, tau=0.22):
    f = hz(m); n = int(SR * 0.9); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.4 * np.exp(-t * k / (tau * 3)) for k in range(1, 7))
    return s * env(n, 0.003, tau)


def bell(m, tau=2.2):
    f = hz(m); n = int(SR * 3.5); t = np.arange(n) / SR
    parts = [(0.56, 1, 1), (0.92, 0.67, 0.9), (1.19, 1, 0.65), (1.71, 1.8, 0.55), (2.0, 2.67, 0.33), (2.74, 1.67, 0.32), (3.0, 1.46, 0.25), (3.76, 1.33, 0.2), (4.07, 1.33, 0.15)]
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (tau * d / 1.5)) for r, a, d in parts)
    return s * env(n, 0.002, 10) / 4


def pad(ms, dur, gain=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    s = np.zeros(n)
    for m in ms:
        for det in (-0.12, 0.0, 0.11):
            f = hz(m + det)
            s += np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t)
    e = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8).clip(0)
    return s * e * gain / (len(ms) * 3)


def noise_burst(dur, tau, hp=True):
    n = int(SR * dur); x = rng.standard_normal(n)
    if hp:
        x = np.diff(np.concatenate([[0], x]))
    return x * env(n, 0.001, tau)


def jingle():
    n = int(SR * 0.35); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) for f in (5200, 6300, 7400, 8800))
    return (s * 0.25 + noise_burst(0.35, 0.05) * 0.3) * env(n, 0.001, 0.08)


def timp(m, tau=0.5):
    n = int(SR * 1.2); t = np.arange(n) / SR
    f = hz(m) * (1 + 0.15 * np.exp(-t / 0.05))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * noise_burst(1.2, 0.03, False)[:n] * 0.3
    return s * env(n, 0.002, tau)


def clang():
    n = int(SR * 0.8); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((2150, 0.25), (3320, 0.18), (4710, 0.12), (6080, 0.08)))
    return (s * 0.35 + noise_burst(0.8, 0.02) * 0.6) * env(n, 0.0005, 5)


def whoosh(dur, up=True):
    n = int(SR * dur); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    k = np.exp(-((np.arange(-400, 401)) / 120.0) ** 2); k /= k.sum()
    x = np.convolve(x, k, 'same') * 6
    e = np.sin(np.pi * t / dur) ** 2
    return x * e


# ---------------------------------------------------------------- score
BEAT = 0.42  # waltz beat; bar = 1.26 s

def waltz(t0, melody, chords, inst=celesta, mgain=0.32, bass_gain=0.25, chord_gain=0.1, jingles=False):
    """melody: list of (beat, midi, beats); chords: list of (bass, [chord tones]) per bar"""
    for b, m, d in melody:
        add(inst(m, d * BEAT), t0 + b * BEAT, mgain, 0.1)
    for bar, (bass, tones) in enumerate(chords):
        tb = t0 + bar * 3 * BEAT
        add(pluck(bass), tb, bass_gain, -0.2)
        for k in (1, 2):
            for i, m in enumerate(tones):
                add(musicbox(m, 0.35), tb + k * BEAT + i * 0.004, chord_gain, 0.3)
        if jingles:
            for k in range(6):
                add(jingle(), tb + k * BEAT / 2, 0.08 if k % 2 else 0.12, 0.5)


# A — meeting (G major)
waltz(0.3, [(0, 74, 1), (1, 79, 1), (2, 78, 1), (3, 76, 2), (5, 74, 1), (6, 72, 1), (7, 76, 1), (8, 74, 1), (9, 71, 3)],
      [(43, [67, 71, 74]), (48, [67, 72, 76]), (50, [66, 69, 72]), (43, [67, 71, 74])], inst=musicbox, mgain=0.36)
add(pad([55, 59, 62], 5.4, 0.5), 0.1, 0.35)
# sparkle as the nutcracker wakes
for i, m in enumerate([86, 91, 95, 98, 103]):
    add(celesta(m, 0.3, 0.3), 0.7 + i * 0.09, 0.1, 0.4)

# B — journey (G major, fuller, sleigh bells)
waltz(5.5, [(0, 74, 1), (1, 79, 1), (2, 83, 1), (3, 81, 2), (5, 79, 1), (6, 78, 1), (7, 81, 1), (8, 74, 1), (9, 79, 3)],
      [(43, [67, 71, 74]), (50, [66, 69, 74]), (50, [66, 69, 72]), (43, [67, 71, 74])], mgain=0.34, jingles=True)
waltz(5.5, [(0, 62, 1), (1, 67, 1), (2, 71, 1), (3, 69, 2), (5, 67, 1), (6, 66, 1), (7, 69, 1), (8, 62, 1), (9, 67, 3)], [], inst=musicbox, mgain=0.12)
add(pad([55, 62, 67], 5.0, 0.6), 5.5, 0.35)

# C — snowflake fairies (E minor shimmer)
arp_ch = [[64, 67, 71, 76, 79, 83], [60, 64, 67, 72, 76, 79], [57, 60, 64, 69, 72, 76], [59, 63, 66, 71, 75, 78]]
for bar, ch in enumerate(arp_ch):
    tb = 10.5 + bar * 1.25
    for i in range(12):
        m = ch[[0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5][i]] + 12
        add(celesta(m, 0.2, 0.35), tb + i * 1.25 / 12, 0.07, -0.5 + (i % 6) / 5)
    add(pad([ch[0] - 12, ch[1], ch[2]], 1.5, 0.7), tb - 0.1, 0.3)
    add(pluck(ch[0] - 12, 0.5), tb, 0.18, -0.2)
for b, m, d in [(0, 83, 3), (3, 84, 2), (5, 81, 1), (6, 79, 3), (9, 78, 2), (11, 75, 1)]:
    add(bell(m - 12, 1.6), 10.5 + b * 1.25 / 3, 0.22, 0.2)

# D — Mouse King battle (E minor march)
q = 0.3
for i in range(18):
    t = 15.5 + i * q
    if t > 19.8:
        break
    add(pluck([40, 40, 47, 40, 43, 40, 47, 46][i % 8], 0.12), t, 0.32, -0.3)
    if i % 2 == 0:
        add(timp(28, 0.35), t, 0.45, 0)
for t, m in [(15.6, 64), (15.9, 67), (16.2, 71), (16.5, 70), (17.1, 71), (17.4, 74), (17.7, 72), (18.0, 71), (18.6, 67), (18.9, 66), (19.2, 64)]:
    add(pluck(m + 12, 0.1), t, 0.2, 0.3)
    add(pluck(m, 0.1), t, 0.12, 0.3)
for c in (1.15, 1.65, 2.15, 2.6, 3.0):
    add(clang(), 15.5 + c, 0.22, 0.1)
add(pad([40, 46, 52], 3.2, 0.5), 15.6, 0.25)
add(whoosh(0.5), 19.45, 0.08, -0.5)                 # slipper flies
add(clang(), 19.92, 0.25, 0.2); add(bell(84, 1.2), 19.92, 0.35, 0.2); add(timp(31, 0.6), 19.92, 0.5)
for i, m in enumerate([84, 81, 77, 74, 71, 67, 64, 60]):  # the king spins down
    add(celesta(m, 0.2, 0.25), 20.0 + i * 0.07, 0.12, 0.3)
add(whoosh(0.8), 20.45, 0.12, 0.3)                  # poof
for i, m in enumerate([76, 79, 83, 88]):
    add(musicbox(m, 0.6), 20.9 + i * 0.12, 0.14, -0.2)

# E — transformation + wedding (C major)
scale = [60, 62, 64, 65, 67, 69, 71]
for i in range(22):
    m = scale[i % 7] + 12 * (i // 7)
    add(pluck(m + 12, 0.6), 21.55 + i * 0.055, 0.12, -0.6 + i / 22)
add(bell(96, 2.0), 22.75, 0.3); add(bell(91, 2.0), 22.77, 0.25)
add(pad([48, 55, 64, 67], 3.8, 0.8), 22.7, 0.4)
waltz(23.05, [(0, 76, 1), (1, 79, 1), (2, 84, 1), (3, 83, 2), (5, 81, 1), (6, 79, 3)],
      [(36, [60, 64, 67]), (43, [62, 67, 71]), (36, [60, 64, 67])], mgain=0.34)
for i in range(6):
    add(bell([72, 67][i % 2], 2.4), 23.8 + i * 0.42, 0.2, -0.4 if i % 2 else 0.4)
add(whoosh(1.4), 25.7, 0.06, 0)                    # dissolving into white

# F — waking up (lullaby)
for i, (m, d) in enumerate([(79, 1), (76, 1), (74, 1), (72, 1.5), (76, 1), (74, 1), (72, 3)]):
    t = 26.6 + sum(x for _, x in [(0, 1), (0, 1), (0, 1), (0, 1.5), (0, 1), (0, 1), (0, 3)][:i]) * 0.38
    add(musicbox(m, 1.2), t, 0.34, 0.1)
add(pad([48, 55, 64], 3.8, 0.7), 26.6, 0.3)
add(pluck(36, 1.5), 26.6, 0.2); add(pluck(43, 1.5), 28.1, 0.18)
for m in (60, 64, 67, 72):
    add(musicbox(m, 1.6), 29.0, 0.12)
add(celesta(96, 0.4, 0.5), 29.5, 0.08, 0.3)     # the doll's twinkle

# ---------------------------------------------------------------- reverb + master
def reverb(x, secs=2.2, mix=0.28):
    n = int(SR * secs); t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t / (secs / 5)); ir[:int(0.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - mix) + y * mix * 2.2

L2, R2 = reverb(L), reverb(Rr)
st = np.stack([L2, R2], 1)
t = np.arange(N) / SR
st *= (np.minimum(1, t / 0.3) * np.clip((DUR - 0.2 - t) / 0.8, 0, 1))[:, None]
st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.4) / np.tanh(1.4) * 0.88
out = sys.argv[1] if len(sys.argv) > 1 else 'score.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st[: int(SR * 30)] * 32767).astype('<i2').tobytes())
print('wrote', out)
