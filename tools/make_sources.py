#!/usr/bin/env python3
"""Write SOURCES.md from the files actually on disk (resolutions measured, not typed)."""
import os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(os.path.dirname(ROOT), "autolab-raw", "bentley")
RAW_INT = os.path.join(os.path.dirname(ROOT), "autolab-raw", "interior")
html = open(os.path.join(ROOT, "index.html")).read()
used = sorted(set(re.findall(r"media/img/(\d{7})[-.]", html)))
interior = sorted(set(re.findall(r"media/img/(\d{8})[-.]", html)))
cut = set(re.findall(r"media/img/(\d{7})-alpha", html))
band = set(re.findall(r"media/img/(\d{7})-band", html))

L = ["# AUTOLAB media sources", "",
 "Every image on the site is a real photograph. All exterior and wash photos come from one session of one car:",
 "a black **Bentley Continental GT (third generation, 2018 on)** in a detailing bay.",
 "Pexels titles photos from this session \"A Bentley Continental GT at a Car Wash\"; the generation is identified",
 "visually (matrix grille, round LED headlights with cut-crystal pattern, oval tail lights).", "",
 "- **Creator:** Tima Miroshnichenko — https://www.pexels.com/@tima-miroshnichenko/",
 "- **Platform:** Pexels — photographs uploaded February 2021 as one session",
 "- **License:** [Pexels License](https://www.pexels.com/license/): free for commercial and non-commercial use, no attribution required",
 "  (credited anyway). Not allowed: selling unaltered copies, redistributing on other stock/wallpaper platforms,",
 "  showing identifiable people in a bad light, or implying endorsement by people or brands shown.",
 "- **No AI-generated, upscaled, 3D or composited vehicle imagery, and no video.** Processing is limited to",
 "  cropping, scaling down, re-encoding for the web, and masking the background.", "",
 "### What is photograph and what is page graphics", "",
 "- The car: always original pixels from the photographs below.",
 "- Background removal (\"masked\" below): a soft alpha mask from a local segmentation model (rembg, ISNet).",
 "  Inside the mask every pixel is the original; outside it is transparent. The car's own floor shadow from the",
 "  photo is kept where the mask includes it. A thin strip of floor fixtures (drain channel) below the car is",
 "  cut away. Nothing of the car is repainted, retouched, extended or generated.",
 "- The grey studio backdrop, the soft ground shadow under the hero car and the white tyre smoke are page",
 "  graphics drawn with CSS and a canvas particle system. They are not photographs.",
 "- The hero car is one still photograph moved across the screen. Its wheels do not turn.",
 "- The hero photo (6872163) is cropped by its own frame through the rear quarter; the page fades that edge out.", "",
 "## Photographs (original resolution)", "",
 "| Pexels ID | Original | On the site | Page | Direct file |", "|---|---|---|---|---|"]
for sid in used:
    w, h = Image.open(os.path.join(RAW, f"{sid}.jpg")).size
    how = "masked (car only)" if sid in cut else ("16:9 crop" if sid in band else "original framing")
    L.append(f"| {sid} | {w}×{h} JPEG | {how} | https://www.pexels.com/photo/{sid}/ | https://images.pexels.com/photos/{sid}/pexels-photo-{sid}.jpeg |")
L += ["", "## Interior section: a second car (different photographer)", "",
 "The black car above was not photographed inside; the session's cabin photos show the Porsche 911 that shared the bay.",
 "The interior section therefore uses photos of a **different car of the same model**: a second-generation",
 "**Bentley Continental GT (2011–2018)** with red diamond-quilted hide, right-hand drive. The page says this in",
 "all three languages, directly under the section heading.", "",
 "- **Creator:** Amit Suri (name and copyright in the files' EXIF) — via Pexels",
 "- **License:** [Pexels License](https://www.pexels.com/license/), as above. Original framing, downscaled only.", "",
 "| Pexels ID | Original | Page | Direct file |", "|---|---|---|---|"]
for sid in interior:
    w, h = Image.open(os.path.join(RAW_INT, f"{sid}.jpg")).size
    L.append(f"| {sid} | {w}×{h} JPEG | https://www.pexels.com/photo/{sid}/ | https://images.pexels.com/photos/{sid}/pexels-photo-{sid}.jpeg |")
L += ["",
 "## Downloaded but not used", "",
 "- 6873097 and other wide shots with a detailer beside the car: segmentation lost the car or kept the person.",
 "- 6872147, 6872175, 6873008, 6873133 show the grey Porsche 911 that shared the bay, not the Bentley.",
 "- 6873106 and 6873143 are unrelated photos that sit in the same ID range.",
 "- The session's cabin photos (6872139, 6872142, 6872585, 6873102, 6873103) show the Porsche 911's interior",
 "  (Porsche steering wheel, PCM buttons, Sport Chrono clock), so they are not used for the Bentley.",
 "- An earlier version of this site used the Porsche 911 from the same session; it was replaced at the client's",
 "  request (not a Porsche, not a white or grey car).", "",
 "## What is not in the source material", "",
 "- No photograph of this car arriving visibly dirty exists. Stage 02 uses a real macro of its windscreen with",
 "  water spotting; nothing has been added to make the car look dirtier.",
 "- No machine-polishing photograph of this car exists; the services list describes polishing as a service only.",
 "- No clean side-profile photograph of this car exists in the session, so the hero uses the front three-quarter view.", "",
 "## Web encodes", "",
 "- WebP at 2560 and 1280 px, downscaled from the originals. Masked images are WebP with an alpha channel.", "",
 "Bentley and Continental GT are trademarks of Bentley Motors Limited. AUTOLAB is not affiliated with Bentley.", ""]
open(os.path.join(ROOT, "SOURCES.md"), "w").write("\n".join(L))
print("\n".join(L[22:46]))
