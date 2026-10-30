# INOVAITIQ 60-second Reel

Vertical (9:16) promotional video for Instagram Reels and Stories.

| File | Resolution | Use |
|---|---|---|
| `INOVAITIQ_Reel_60s_4K.mp4` | 2160×3840, H.264, 30 fps | Master: website, YouTube, presentations |
| `INOVAITIQ_Reel_60s_1080p.mp4` | 1080×1920, H.264, 30 fps | Instagram upload (Reels play at 1080p) |

## Story (60s)
1. **0–9s:** "How many calls did you miss today?" Missed-call cards stack up while light pulses race along the board's tracks and die out.
2. **9–15s:** Blue light surges across the board, the INOVAITIQ chip powers on and the camera pushes in.
3. **15–24s:** The chip lid lifts. Cards show the three services: AI Receptionist, Instant follow-up and Connected systems.
4. **24–36s:** "Handled while you work." The same 14:32 call is answered, qualified, booked and logged (labelled as an illustrative example).
5. **36–44s:** "UK AI adoption doubled in a year." An animated bar chart rises from 16% (2025) to 32% (2026), sourced from the UK Government AI Adoption Survey.
6. **44–53s:** The board becomes a living city at night. Pills show the target sectors: offices, clinics, dentists, trades, salons and agencies.
7. **53–60s:** "The city never sleeps. Now, neither does your business." Logo, "Book a consultation", inovaitiq.ai and 0800 193 5055, then a fade to black.

## How it's built
- **Footage:** six AI video shots made on Higgsfield with Kling 3.0 Turbo and upscaled to 4K with Topaz. The opening board is a still image with code-drawn light pulses that follow the real tracks (`traces.json`).
- **Motion graphics:** `source/reel.html` holds every card, chart, headline and transition. It's rendered frame by frame with Playwright (`render.js`; set `SCALE=2` for native 4K).
- **Music:** `source/music.py` synthesises the whole score, an A-minor house track at about 123 BPM with drops at 9s and 44s and a two-stage breakdown, together with the UI sound effects.
- **Grading:** `regrade.py` turns the city's orange street light electric blue. `glowfade.py` eases the chip's "AI" glow into the next shot.

## Re-rendering
```bash
cd source
python3 music.py                                  # → music.wav
# frames/cN from the clips via extract.sh (1080p) or extract4k.sh (4K)
SCALE=2 FRAMEDIR=frames4k node render.js out4k 0 60 1
ffmpeg -framerate 30 -i out4k/%05d.jpg -i music.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac out.mp4
```
The raw clips and extracted frames are not committed because of their size.
