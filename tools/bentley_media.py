#!/usr/bin/env python3
"""Web images for the Bentley build. Real photographs only.

  cut   : RGBA WebP. The car keeps its original pixels; the bay becomes transparent
          (soft alpha from a local segmentation model). The page puts them on a
          studio backdrop.
  orig  : close-ups where no bay is in frame, downscaled only.
  band  : a 16:9 crop of an original (booking background).
"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(os.path.dirname(ROOT), "autolab-raw", "bentley")
OUT = os.path.join(ROOT, "media", "img")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import cutout as C  # noqa: E402

CUT = ["6872163", "6873074", "6873128", "6872600"]
ORIG = ["6873077", "6872162", "6872146", "6873010", "6873190", "6873021", "6872573",
        "6873076", "6872609", "6873192", "6873087"]


def save(im, name, sizes=((2560, 82), (1280, 80))):
    for w, q in sizes:
        o = im.copy(); o.thumbnail((w, w), Image.LANCZOS)
        o.save(os.path.join(OUT, f"{name}-{w}.webp"), quality=q, method=6)


def do_cut(sid):
    im = Image.open(os.path.join(RAW, f"{sid}.jpg")).convert("RGB")
    im.thumbnail((3200, 3200), Image.LANCZOS)
    m = C.soften(C.clean(C.mask_of(im), keep_ratio=0.12))
    # drop thin floor fixtures (drain channel) below the car: keep rows down to the
    # car's lowest wide row plus a small margin for its own contact shadow
    cov = (m > .5).sum(axis=1)
    wide = np.where(cov > cov.max() * 0.25)[0]
    cut_at = min(m.shape[0], wide.max() + int(m.shape[0] * 0.035))
    ramp = np.clip(1 - (np.arange(m.shape[0]) - (cut_at - 40)) / 40, 0, 1)
    m = m * ramp[:, None]
    a = Image.fromarray((m * 255).astype(np.uint8))
    rgba = im.copy(); rgba.putalpha(a)
    box = a.point(lambda v: 255 if v > 8 else 0).getbbox()
    pad = 12
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
    rgba = rgba.crop(box)
    save(rgba, f"{sid}-alpha")
    print("cut", sid, rgba.size, "bbox", box, "of", im.size, flush=True)


def do_orig(sid):
    im = Image.open(os.path.join(RAW, f"{sid}.jpg")).convert("RGB")
    save(im, sid)
    print("orig", sid, flush=True)


def do_band():
    im = Image.open(os.path.join(RAW, "6872165.jpg")).convert("RGB")
    W, H = im.size; ch = round(W * 9 / 16); y0 = max(0, (H - ch) // 2)
    save(im.crop((0, y0, W, y0 + ch)), "6872165-band", ((2560, 80), (1280, 78)))
    print("band 6872165", flush=True)


if __name__ == "__main__":
    what = sys.argv[1:] or ["cut", "orig", "band"]
    if "cut" in what:
        for s in CUT: do_cut(s)
    if "orig" in what:
        for s in ORIG: do_orig(s)
    if "band" in what: do_band()
