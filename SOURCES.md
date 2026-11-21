# AUTOLAB media sources

Every image on the site is a real photograph from one session of one car:
a black **Bentley Continental GT (third generation, 2018 on)** in a detailing bay.
Pexels titles photos from this session "A Bentley Continental GT at a Car Wash"; the generation is identified
visually (matrix grille, round LED headlights with cut-crystal pattern, oval tail lights).

- **Creator:** Tima Miroshnichenko — https://www.pexels.com/@tima-miroshnichenko/
- **Platform:** Pexels — photographs uploaded February 2021 as one session
- **License:** [Pexels License](https://www.pexels.com/license/): free for commercial and non-commercial use, no attribution required
  (credited anyway). Not allowed: selling unaltered copies, redistributing on other stock/wallpaper platforms,
  showing identifiable people in a bad light, or implying endorsement by people or brands shown.
- **No AI-generated, upscaled, 3D or composited vehicle imagery, and no video.** Processing is limited to
  cropping, scaling down, re-encoding for the web, and masking the background.

### What is photograph and what is page graphics

- The car: always original pixels from the photographs below.
- Background removal ("masked" below): a soft alpha mask from a local segmentation model (rembg, ISNet).
  Inside the mask every pixel is the original; outside it is transparent. The car's own floor shadow from the
  photo is kept where the mask includes it. A thin strip of floor fixtures (drain channel) below the car is
  cut away. Nothing of the car is repainted, retouched, extended or generated.
- The grey studio backdrop, the soft ground shadow under the hero car and the white tyre smoke are page
  graphics drawn with CSS and a canvas particle system. They are not photographs.
- The hero car is one still photograph moved across the screen. Its wheels do not turn.
- The hero photo (6872163) is cropped by its own frame through the rear quarter; the page fades that edge out.

## Photographs (original resolution)

| Pexels ID | Original | On the site | Page | Direct file |
|---|---|---|---|---|
| 6872146 | 6000×4000 JPEG | original framing | https://www.pexels.com/photo/6872146/ | https://images.pexels.com/photos/6872146/pexels-photo-6872146.jpeg |
| 6872162 | 4000×6000 JPEG | original framing | https://www.pexels.com/photo/6872162/ | https://images.pexels.com/photos/6872162/pexels-photo-6872162.jpeg |
| 6872163 | 6000×4000 JPEG | masked (car only) | https://www.pexels.com/photo/6872163/ | https://images.pexels.com/photos/6872163/pexels-photo-6872163.jpeg |
| 6872165 | 6000×4000 JPEG | 16:9 crop | https://www.pexels.com/photo/6872165/ | https://images.pexels.com/photos/6872165/pexels-photo-6872165.jpeg |
| 6872573 | 5100×3400 JPEG | original framing | https://www.pexels.com/photo/6872573/ | https://images.pexels.com/photos/6872573/pexels-photo-6872573.jpeg |
| 6872600 | 3797×5695 JPEG | masked (car only) | https://www.pexels.com/photo/6872600/ | https://images.pexels.com/photos/6872600/pexels-photo-6872600.jpeg |
| 6872609 | 3929×5893 JPEG | original framing | https://www.pexels.com/photo/6872609/ | https://images.pexels.com/photos/6872609/pexels-photo-6872609.jpeg |
| 6873010 | 6000×4000 JPEG | original framing | https://www.pexels.com/photo/6873010/ | https://images.pexels.com/photos/6873010/pexels-photo-6873010.jpeg |
| 6873021 | 5885×3923 JPEG | original framing | https://www.pexels.com/photo/6873021/ | https://images.pexels.com/photos/6873021/pexels-photo-6873021.jpeg |
| 6873074 | 5579×3719 JPEG | masked (car only) | https://www.pexels.com/photo/6873074/ | https://images.pexels.com/photos/6873074/pexels-photo-6873074.jpeg |
| 6873076 | 3979×5968 JPEG | original framing | https://www.pexels.com/photo/6873076/ | https://images.pexels.com/photos/6873076/pexels-photo-6873076.jpeg |
| 6873077 | 6000×4000 JPEG | original framing | https://www.pexels.com/photo/6873077/ | https://images.pexels.com/photos/6873077/pexels-photo-6873077.jpeg |
| 6873087 | 4000×6000 JPEG | original framing | https://www.pexels.com/photo/6873087/ | https://images.pexels.com/photos/6873087/pexels-photo-6873087.jpeg |
| 6873128 | 3831×5746 JPEG | masked (car only) | https://www.pexels.com/photo/6873128/ | https://images.pexels.com/photos/6873128/pexels-photo-6873128.jpeg |
| 6873190 | 6000×4000 JPEG | original framing | https://www.pexels.com/photo/6873190/ | https://images.pexels.com/photos/6873190/pexels-photo-6873190.jpeg |
| 6873192 | 3979×5968 JPEG | original framing | https://www.pexels.com/photo/6873192/ | https://images.pexels.com/photos/6873192/pexels-photo-6873192.jpeg |

## Downloaded but not used

- 6873097 and other wide shots with a detailer beside the car: segmentation lost the car or kept the person.
- 6872147, 6872175, 6873008, 6873133 show the grey Porsche 911 that shared the bay, not the Bentley.
- 6873106 and 6873143 are unrelated photos that sit in the same ID range.
- An earlier version of this site used the Porsche 911 from the same session; it was replaced at the client's
  request (not a Porsche, not a white or grey car).

## What is not in the source material

- No photograph of this car arriving visibly dirty exists. Stage 02 uses a real macro of its windscreen with
  water spotting; nothing has been added to make the car look dirtier.
- No machine-polishing photograph of this car exists; the services list describes polishing as a service only.
- No clean side-profile photograph of this car exists in the session, so the hero uses the front three-quarter view.

## Web encodes

- WebP at 2560 and 1280 px, downscaled from the originals. Masked images are WebP with an alpha channel.

Bentley and Continental GT are trademarks of Bentley Motors Limited. AUTOLAB is not affiliated with Bentley.
