#!/usr/bin/env python3
"""Isolate the car from the wash-bay background, using only masking.

The car's pixels are never altered: each output pixel is either the original
source pixel or the page background colour (#0a0c0e), blended by a soft alpha
mask from a local segmentation model (rembg / ISNet). Nothing is generated.

  stills  : media/img/<id>-cut-<w>.webp
  hero    : static camera -> median mask over all frames (stable, no flicker),
            unioned with per-frame masks so the water jet stays in shot
  pass    : close dolly; the model finds only the roof line and mirror, so the
            mask is filled downward from the roof edge (everything below the
            roof line in this shot is the car), smoothed over time
  tail    : same static-camera treatment as the hero, re-encoded as the loop
"""
import glob, os, subprocess, sys, tempfile, shutil
import numpy as np
from PIL import Image
from scipy import ndimage
from rembg import new_session, remove

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(os.path.dirname(ROOT), "autolab-raw")
BG = (10, 12, 14)
SESS = None

def sess():
    global SESS
    if SESS is None: SESS = new_session("isnet-general-use")
    return SESS

def mask_of(im):
    m = np.asarray(remove(im, session=sess(), only_mask=True), dtype=np.float32) / 255.0
    return m

def clean(m, keep_ratio=0.04):
    """drop detached specks; keep components at least keep_ratio of the largest"""
    lab, n = ndimage.label(m > 0.5)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(m), lab, range(1, n + 1))
        big = sizes.max()
        for i, s in enumerate(sizes, 1):
            if s < big * keep_ratio: m[lab == i] = 0
    return m

def comp(im, m):
    a = np.asarray(im, dtype=np.float32)
    bg = np.array(BG, dtype=np.float32)
    out = a * m[..., None] + bg * (1 - m[..., None])
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))

def soften(m):
    # tighten the mask's halo slightly, keep anti-aliased edge
    return np.clip((m - 0.08) / 0.84, 0, 1)

# ------------------------------------------------------------------ stills
PASS_FROM = 86  # first pass frame kept (source time 6.88 s)
CUT_STILLS = ["6873072", "6872598", "6872166", "6873186", "6872169", "6872170", "6872605",
              "6872607", "6873071", "6873124", "6873134", "6873184", "6873006", "6873123", "6872580", "6873083"]

def do_stills():
    only = [a for a in sys.argv[2:]] or CUT_STILLS
    for sid in only:
        im = Image.open(os.path.join(RAW, "photos", f"{sid}.jpg")).convert("RGB")
        im.thumbnail((2560, 2560), Image.LANCZOS)
        m = soften(clean(mask_of(im)))
        out = comp(im, m)
        for w, q in ((2560, 82), (1280, 80)):
            o = out.copy(); o.thumbnail((w, w), Image.LANCZOS)
            o.save(os.path.join(ROOT, "media", "img", f"{sid}-cut-{w}.webp"), quality=q, method=6)
        print("still", sid, flush=True)

# --------------------------------------------------------------- sequences
def frames_from_pack(name):
    """read the original (uncut) desktop frames from the packs"""
    import json, struct
    frames = {}
    # always start from the untouched frames, never from an earlier cut
    for f in sorted(glob.glob(os.path.join(RAW, "seq-uncut", f"{name}-d-*.bin"))):
        b = open(f, "rb").read()
        hl = struct.unpack("<I", b[4:8])[0]; h = json.loads(b[8:8 + hl]); base = 8 + hl
        for i, off, size in h["frames"]:
            frames[i] = b[base + off: base + off + size]
    return [frames[i] for i in range(len(frames))]

def static_union(ims):
    masks = [mask_of(im) for im in ims]
    med = np.median(np.stack(masks), axis=0)
    med = clean(med)
    return [soften(np.maximum(med, clean(m.copy(), 0.02) * 0.95)) for m in masks]

def fill_down(ims):
    tops = []
    for im in ims:
        m = mask_of(im) > 0.5
        h, w = m.shape
        top = np.where(m.any(axis=0), m.argmax(axis=0), -1).astype(np.float32)
        valid = top >= 0
        if valid.sum() < 2: top[:] = h
        else:
            idx = np.arange(w)
            top = np.interp(idx, idx[valid], top[valid])
        tops.append(top)
    tops = np.stack(tops)
    # temporal + spatial smoothing of the roof edge: no wobble between frames
    tops = ndimage.median_filter(tops, size=(9, 1))
    tops = ndimage.gaussian_filter(tops, sigma=(1.5, 28))
    out = []
    for im, top in zip(ims, tops):
        h, w = im.size[1], im.size[0]
        yy = np.arange(h, dtype=np.float32)[:, None]
        m = np.clip((yy - top[None, :]) / 3.0 + 0.5, 0, 1)  # ~3px soft edge
        # the bay's back wall is pink; the car's paint is neutral grey. Mask the wall by colour.
        a = np.asarray(im, dtype=np.float32)
        pink = np.clip(((a[..., 0] - a[..., 1]) - 14) / 16, 0, 1)
        pink = ndimage.gaussian_filter(ndimage.grey_opening(pink, size=(9, 9)), 2)
        out.append(m * (1 - pink))
    return out

def write_seq(name, ims, masks):
    """write cut frames back as packs (d + m) and as per-frame files"""
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    from build_media import pack, PARTS
    for sk, w, q in (("d", 1920, 76), ("m", 1024, 74)):
        tmp = tempfile.mkdtemp()
        files = []
        for i, (im, m) in enumerate(zip(ims, masks)):
            o = comp(im, m)
            if o.size[0] != w: o = o.resize((w, round(o.size[1] * w / o.size[0] / 2) * 2), Image.LANCZOS)
            p = os.path.join(tmp, f"{i:04d}.webp"); o.save(p, quality=q, method=6); files.append(p)
        fw, fh = Image.open(files[0]).size
        for part in range(PARTS):
            sel = [(i, files[i]) for i in range(len(files)) if i % PARTS == part]
            pack(sel, os.path.join(ROOT, "media", "seq", f"{name}-{sk}-{part}.bin"), fw, fh, len(files), part)
        if sk == "d":
            fd = os.path.join(ROOT, "media", "frames", name)
            for i, p in enumerate(files): shutil.copy(p, os.path.join(fd, f"{i:03d}.webp"))
        shutil.rmtree(tmp)
    print("seq", name, len(ims), flush=True)

def do_seq(name):
    import io
    ims = [Image.open(io.BytesIO(b)).convert("RGB") for b in frames_from_pack(name)]
    if name == "pass":
        # the model loses the car in frames 0-85 of this dolly; keep only the clean last 3.3 s
        ims = ims[PASS_FROM:]
    masks = static_union(ims) if name == "hero" else fill_down(ims)
    write_seq(name, ims, masks)

# ------------------------------------------------------------------ tail loop
def do_tail():
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    from build_media import VIDS, vid
    cid, ss, dur, filt, sizes = VIDS["tail"]
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-ss", str(ss), "-t", str(dur), "-i", vid(cid),
                    "-vf", "scale=1920:-2:flags=lanczos", os.path.join(tmp, "f_%04d.png")], check=True)
    files = sorted(glob.glob(os.path.join(tmp, "f_*.png")))
    ims = [Image.open(f).convert("RGB") for f in files]
    masks = static_union(ims)
    for f, im, m in zip(files, ims, masks): comp(im, m).save(f)
    for w in sizes:
        out = os.path.join(ROOT, "media", "video", f"tail-{w}.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "25", "-i", os.path.join(tmp, "f_%04d.png"),
                        "-vf", f"scale={w}:-2:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow",
                        "-crf", "21" if w > 1000 else "24", "-g", "25", "-movflags", "+faststart", out], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-frames:v", "1", "-c:v", "libwebp", "-quality", "78",
                        out.replace(".mp4", ".webp")], check=True)
    shutil.rmtree(tmp)
    print("tail done", flush=True)

if __name__ == "__main__":
    what = sys.argv[1:] or ["stills", "hero", "pass", "tail"]
    if "stills" in what: do_stills()
    if "hero" in what: do_seq("hero")
    if "pass" in what: do_seq("pass")
    if "tail" in what: do_tail()
