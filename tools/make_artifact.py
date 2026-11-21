#!/usr/bin/env python3
"""Build dist-artifact/index.html: same page, frame-file delivery, no document skeleton (the host adds it)."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, "index.html")).read()
s = re.sub(r'<link rel="preload"[^>]*\.bin"[^>]*>\s*', "", s)
s = s.replace('<script src="js/sequence.js">', '<script>window.AUTOLAB_SEQ_MODE = "frames";</script>\n<script src="js/sequence.js">')
open(os.path.join(ROOT, "_frames_test.html"), "w").write(s)  # local check of frame mode, full document
for pat in [r'<!doctype html>\s*', r'<html[^>]*>\s*', r'<head>\s*', r'</head>\s*', r'<body>\s*', r'</body>\s*',
            r'</html>\s*', r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*']:
    s = re.sub(pat, "", s, flags=re.I)
os.makedirs(os.path.join(ROOT, "dist-artifact"), exist_ok=True)
open(os.path.join(ROOT, "dist-artifact", "index.html"), "w").write(s)
print("ok", len(s))
