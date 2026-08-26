# Repository Notes

## vaporwave-openhands/
Interactive vaporwave-style landing page explaining OpenHands capabilities.
Vanilla HTML/CSS/JS, no build step. Files: `index.html`, `style.css`, `script.js`,
`assets/CREDITS.md` (all graphics are original inline SVG/CSS).

- Serve with `python3 -m http.server 12000` from inside `vaporwave-openhands/`;
  reachable via the work-1 runtime host.
- The striped sun cycles 4 CSS-variable themes.
- Window manager (`script.js`): per-window state `open`/`min`/`closed` drives
  the taskbar (`open`/`min` keep a button; `closed` removes it; reopen via the
  START menu). Maximize saves/restores geometry via a JSON snapshot — a
  style-string snapshot is poisoned by chromium's `inset` shorthand.
- Mixtape tracks each carry WebAudio synth params (bassline/tempo/waveform).
- Linted with ESLint, stylelint (stylelint-config-standard), and html-validate;
  stylelint waives `declaration-block-single-line-max-declarations` (deliberate
  compact one-line rule style).
