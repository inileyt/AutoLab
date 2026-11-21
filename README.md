# AUTOLAB — detailing studio site

A scroll-driven site built entirely from real photographs of one car: a black Bentley Continental GT (third generation),
photographed during one detailing session by Tima Miroshnichenko (Pexels). See `SOURCES.md` for every file, its
measured resolution, licence and what it is used for.

The site uses photographs only: no video and no frame sequences. On the first screen the car (one cut-out still)
drives in from the left onto a studio set; scrolling drives it out to the right, leaving white tyre smoke
(a canvas particle system in `js/smoke.js`). Backdrop, ground shadow and smoke are page graphics.

## Run it

```bash
npx http-server . -p 8080 -c-1
```

Then open http://localhost:8080. GSAP, ScrollTrigger and Lenis load from cdnjs/jsDelivr and fall back to `vendor/`.

## Structure

| Chapter | Technique | Photo |
|---|---|---|
| Hero | cut-out car drives in on load, drives out on scroll, tyre smoke, studio set | 6872163 |
| The car | light-bar slit mask opens onto the studio set, then crops to a panel | 6873074 |
| Process (six stages) | pinned timeline, top-down light-bar wipes | 6873128, 6873077, 6872162, 6872146, 6873010, 6873192 |
| Up close | clip-path masks | 6873190, 6873076, 6873021, 6872573 |
| Services, booking | reveal on scroll | 6872609, 6873087, 6872600, 6872165 |

The fixed slate (bottom left) shows the Pexels photo number and the camera bearing of the frame on screen.

## Rebuild the media

Needs the original downloads in `../autolab-raw/bentley/` (see `SOURCES.md` for direct file URLs) and `rembg`.

```bash
python3 tools/bentley_media.py      # cut-outs (WebP with alpha), originals, booking band
python3 tools/make_sources.py       # regenerates SOURCES.md from the files on disk
```

## Booking form

The form validates in the page but has no backend; connect it to your booking system before going live.
