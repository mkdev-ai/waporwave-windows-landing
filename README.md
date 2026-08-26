# waporwave-windows-landing

**testing openhands project features**

## 🌐 Live preview

**https://mkdev-ai.github.io/waporwave-windows-landing/preview**

Click anywhere (or press any key) to enter the scene.

## About

An interactive **vaporwave / synthwave landing page for [OpenHands](https://docs.openhands.dev/)**, styled as a retro operating system booting into an endless 1986 sunset. Pure vanilla HTML/CSS/JS — no build step, no dependencies, served as fully static files.

A DOS-style boot screen types itself out, then the scene loads: a striped sun floating over an infinite scrolling grid floor, silhouetted mountains, palms and dolphins, and a Win95-style window manager on top.

## Features

- 🖥️ **Win95 window manager** — full lifecycle: `_` minimizes to the taskbar, `×` closes completely (taskbar button removed), `□`/`❐` maximizes to full screen and restores to exact previous size/position. Closed windows reopen from the **◤ START** menu, which lists every window with its live state (RUNNING / MINIMIZED). Drag-clamped on-screen with z-ordering
- ☀️ **Theme cycling** — click the sun to shift the timeline through 4 palettes (dusk, dawn, midnight, overdrive)
- 🌊 **Interactive grid floor** — click the floor to spawn ripples (GRID FX toggle in the taskbar)
- 🎛️ **Mixtape deck** — feature tracks that update the deck display
- 🎹 **WebAudio synth** — the SYNTH button builds a real audio graph; each track retunes it live
- 💡 **Neon signs** — AGENT CANVAS / AGENT SDK / CLOUD signs open their product dialogs and link to the docs
- 📱 **Responsive** — mobile viewport layout with the full-bleed grid floor intact
- 🔒 **Self-contained** — strict CSP (`default-src 'self'`), no external requests, zero JS errors

## Project layout

```
vaporwave-openhands/
├── index.html   — scene markup, windows, SVG symbols
├── style.css    — full vaporwave theme, 3D grid floor, animations
├── script.js    — boot sequence, window manager, synth, interactions
└── assets/      — attribution (CREDITS.md)
```

## Run locally

No build needed — serve the folder with any static server:

```bash
cd vaporwave-openhands
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly also works.)

## Deployment

The site is published to **GitHub Pages** from the `gh-pages` branch under the `/preview` path. A GitHub Actions workflow ([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)) keeps it in sync: every push to `main` that touches `vaporwave-openhands/**` redeploys the preview automatically (~1 min). Manual redeploys are available via **Actions → Deploy preview to GitHub Pages → Run workflow**.
