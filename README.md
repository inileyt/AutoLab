# AUTOLAB — detailing studio site
https://inileyt.github.io/AutoLab/

A scroll-driven site built entirely from real photographs of one car: a black Bentley Continental GT (third generation),
photographed during one detailing session by Tima Miroshnichenko (Pexels).
Design and development: Inna Babajanyan. See `SOURCES.md` for every file, its
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
| Interior (a second car of the same model, labelled) | clip-path masks | 11968580, 11968578, 11968575, 11968579, 11968572, 11968576 (Amit Suri) |
| Services, prices, reviews, booking | reveal on scroll; booking via WhatsApp or email | 6872609, 6873087, 6872600, 6872165 |

The fixed slate (bottom left) shows the Pexels photo number and the camera bearing of the frame on screen.

## Rebuild the media

Needs the original downloads in `../autolab-raw/bentley/` (see `SOURCES.md` for direct file URLs) and `rembg`.

```bash
python3 tools/bentley_media.py      # cut-outs (WebP with alpha), originals, booking band
python3 tools/make_sources.py       # regenerates SOURCES.md from the files on disk
```

## Languages

Armenian (default), English and Russian, switched in the header and remembered per visitor. All page text lives
in `js/i18n.js`; elements point to it with `data-i18n` keys. To change a text, edit it there in all three languages.

## Sample content

This is a portfolio project. The price list and the three reviews are sample content written for it, and the page
says so under each heading. Replace them with real prices and real client reviews before using the site for a
real studio.

## Your studio details: `js/config.js`

Open `js/config.js` and fill in what applies (phone, WhatsApp, Telegram, email, address, map link, hours, Instagram).
Empty fields stay hidden; nothing is shown that you did not enter. The file is public, so put no passwords in it.

## Booking form

Where a request goes depends on `js/config.js`:

1. `formEndpoint` set (for example a free [Formspree](https://formspree.io) form): sent in the background.
2. Otherwise `whatsapp` set: opens WhatsApp with the request filled in; the visitor presses send.
3. Otherwise `email` set: opens the visitor's mail app with the request filled in.
4. Nothing set: the page says plainly that online booking is not connected and nothing is sent.

## Publish on GitHub Pages

In the repository on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch →
Branch: `main`, folder `/ (root)` → Save**. After a minute the site is at `https://<user>.github.io/<repo>/`.
