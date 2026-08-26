"use strict";

/* ---------- shared state ---------- */
let actx = null;
let synthOn = false;
let seqTimer = null;
let step = 0;
let currentTrack = 0;
let topZ = 30;

/* ---------- stars ---------- */
const sky = document.getElementById("sky");
for (let i = 0; i < 90; i++) {
  const s = document.createElement("div");
  s.className = "star";
  s.style.left = Math.random() * 100 + "%";
  s.style.top = Math.random() * 55 + "%";
  s.style.animationDelay = Math.random() * 3 + "s";
  const size = Math.random() * 2 + 1 + "px";
  s.style.width = size;
  s.style.height = size;
  sky.appendChild(s);
}

/* ---------- boot screen ---------- */
const boot = document.getElementById("boot");
let booted = false;
function enterWorld() {
  if (booted) return;
  booted = true;
  boot.style.display = "none";
  openWindow("win-capabilities");
  openWindow("win-help");
}
boot.addEventListener("click", enterWorld);
addEventListener("keydown", enterWorld);

/* ---------- the sun is a theme switcher ---------- */
const themes = ["dusk", "dawn", "midnight", "overdrive"];
let themeIndex = 0;
document.getElementById("sun").addEventListener("click", () => {
  themeIndex = (themeIndex + 1) % themes.length;
  document.documentElement.dataset.theme = themes[themeIndex];
});

/* ---------- grid ripples (gated by the GRID FX toggle) ---------- */
let gridFx = true;
const gridfxBtn = document.getElementById("gridfx-btn");
gridfxBtn.addEventListener("click", () => {
  gridFx = !gridFx;
  gridfxBtn.textContent = gridFx ? "GRID FX: ON" : "GRID FX: OFF";
});
const gridWrap = document.getElementById("grid-wrap");
gridWrap.addEventListener("click", (e) => {
  if (!gridFx) return;
  const r = document.createElement("div");
  r.className = "ripple";
  // #grid is 3D-rotated, so its bounding rect can't map screen clicks to local
  // coordinates. Position in the untransformed wrap instead: ripple lands exactly
  // under the cursor.
  const rect = gridWrap.getBoundingClientRect();
  r.style.left = e.clientX - rect.left + "px";
  r.style.top = e.clientY - rect.top + "px";
  gridWrap.appendChild(r);
  setTimeout(() => r.remove(), 1000);
});

/* ---------- window system: registry, taskbar, start menu, drag ---------- */
// px of a window that must stay on screen: wide enough that a window clamped to
// the left edge still shows some grabbable bar left of its buttons (~64px).
const DRAG_MARGIN = 80;

const WINDOWS = [
  { id: "win-capabilities", label: "CAPABILITIES.TXT" },
  { id: "win-help", label: "HELP.TXT" },
  { id: "win-canvas", label: "AGENT_CANVAS.TXT" },
  { id: "win-sdk", label: "AGENT_SDK.TXT" },
  { id: "win-cloud", label: "CLOUD.TXT" }
];
// Per-window lifecycle: "open" (visible, taskbar button active),
// "min" (hidden, taskbar button kept), "closed" (hidden, no taskbar button —
// reopen from the start menu).
const winState = Object.fromEntries(WINDOWS.map(({ id }) => [id, "closed"]));

const taskButtons = document.getElementById("task-buttons");
const startMenu = document.getElementById("start-menu");
const startMenuItems = document.getElementById("start-menu-items");

function renderStartMenu() {
  startMenuItems.innerHTML = "";
  WINDOWS.forEach(({ id, label }) => {
    const item = document.createElement("button");
    item.type = "button";
    const state = winState[id];
    item.textContent = "▸ " + label +
      (state === "open" ? " — RUNNING" : state === "min" ? " — MINIMIZED" : "");
    item.addEventListener("click", () => {
      openWindow(id);
      startMenu.classList.add("hidden");
    });
    startMenuItems.appendChild(item);
  });
}

function syncWindowUI(id) {
  const win = document.getElementById(id);
  const state = winState[id];
  win.classList.toggle("hidden", state !== "open");
  let btn = taskButtons.querySelector('[data-win-btn="' + id + '"]');
  if (state === "closed") {
    if (btn) btn.remove();
  } else {
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = WINDOWS.find((w) => w.id === id).label;
      btn.dataset.winBtn = id;
      btn.addEventListener("click", () => {
        // Win95 taskbar semantics: clicking the open window's button minimizes
        // it, clicking a minimized window's button restores it.
        if (winState[id] === "open") minimizeWindow(id);
        else openWindow(id);
      });
      taskButtons.appendChild(btn);
    }
    btn.classList.toggle("active", state === "open");
  }
  renderStartMenu();
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  winState[id] = "open";
  // A window stranded fully off-screen (e.g. by a viewport resize) snaps back
  // to its CSS home position so it can never be lost for good.
  const r = win.getBoundingClientRect();
  if (r.right < 0 || r.left > window.innerWidth || r.bottom < 0 || r.top > window.innerHeight) {
    win.style.left = "";
    win.style.right = "";
    win.style.top = "";
    win.style.bottom = "";
  }
  win.style.zIndex = ++topZ;
  syncWindowUI(id);
}

function minimizeWindow(id) {
  winState[id] = "min";
  syncWindowUI(id);
}

function closeWindow(id) {
  const win = document.getElementById(id);
  // Restore geometry before hiding so a closed-then-reopened window comes back
  // at its normal size, not stuck full screen.
  if (win && win.classList.contains("maximized")) toggleMaximize(win);
  winState[id] = "closed";
  syncWindowUI(id);
}

function toggleMaximize(win) {
  const btn = win.querySelector("[data-max]");
  if (win.classList.contains("maximized")) {
    win.classList.remove("maximized");
    try {
      const saved = JSON.parse(win.dataset.prevStyle || "{}");
      const [left, top, right, bottom] = saved.rect || [];
      win.style.left = left || "";
      win.style.top = top || "";
      win.style.right = right || "";
      win.style.bottom = bottom || "";
    } catch { /* geometry stays at CSS home on malformed snapshot */ }
    win.style.zIndex = ++topZ;
    if (btn) { btn.textContent = "□"; btn.title = "maximize"; }
  } else {
    // Snapshot bare geometry values (rect + z-index). A style-string snapshot
    // would smuggle in a chromium generated `inset` shorthand and poison the
    // restore.
    win.dataset.prevStyle = JSON.stringify({
      rect: [win.style.left, win.style.top, win.style.right, win.style.bottom],
      z: win.style.zIndex
    });
    win.style.inset = "";
    win.style.left = "";
    win.style.top = "";
    win.style.right = "";
    win.style.bottom = "";
    win.classList.add("maximized");
    win.style.zIndex = ++topZ;
    if (btn) { btn.textContent = "❐"; btn.title = "restore"; }
  }
}

document.querySelectorAll("[data-min]").forEach((btn) => {
  btn.addEventListener("click", () => minimizeWindow(btn.dataset.min));
});
document.querySelectorAll("[data-max]").forEach((btn) => {
  btn.addEventListener("click", () => toggleMaximize(document.getElementById(btn.dataset.max)));
});
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeWindow(btn.dataset.close));
});

document.getElementById("start-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  renderStartMenu();
  startMenu.classList.toggle("hidden");
});
document.addEventListener("pointerdown", (e) => {
  if (!startMenu.classList.contains("hidden") &&
      !startMenu.contains(e.target) && e.target.id !== "start-btn") {
    startMenu.classList.add("hidden");
  }
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape") startMenu.classList.add("hidden");
});

document.querySelectorAll(".win95").forEach((win) => {
  const bar = win.querySelector(".win95-bar");
  let dx = 0;
  let dy = 0;
  let dragging = false;
  bar.addEventListener("pointerdown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    if (win.classList.contains("maximized")) return;
    dragging = true;
    dx = e.clientX - win.offsetLeft;
    dy = e.clientY - win.offsetTop;
    win.style.zIndex = ++topZ;
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const left = Math.min(Math.max(e.clientX - dx, DRAG_MARGIN - win.offsetWidth), window.innerWidth - DRAG_MARGIN);
    const top = Math.min(Math.max(e.clientY - dy, 0), window.innerHeight - DRAG_MARGIN);
    // `style.setProperty("inset", …)` keeps the shorthand stable: plain
    // `style.inset = …` gets split into per-side properties in chromium, and
    // subsequent left/top assignments then serialize back as an `inset`
    // shorthand — breaking the geometry snapshot maximize/restore relies on.
    win.style.setProperty("inset", top + "px auto auto " + left + "px");
  });
  bar.addEventListener("pointerup", () => {
    dragging = false;
  });
});

/* ---------- neon signs open product dialogs ---------- */
document.querySelectorAll(".sign").forEach((sign) => {
  sign.addEventListener("click", (e) => {
    e.preventDefault();
    openWindow(sign.dataset.win);
  });
});

/* ---------- feature mixtape: each track carries its own synth patch ---------- */
const tracks = [
  { side: "A1", name: "BASH.EXE",
    desc: "Executes real shell commands in a sandboxed terminal — installs deps, runs builds, greps the universe.",
    music: { bass: [55, 55, 65.41, 55, 82.41, 73.42, 65.41, 49], tempo: 260, wave: "sawtooth", arpEvery: 4 } },
  { side: "A2", name: "FILE_SURGE",
    desc: "Precise file editing with exact-match patching. No whole-file rewrites unless the mission demands it.",
    music: { bass: [110, 0, 130.81, 0, 98, 0, 87.31, 0], tempo: 560, wave: "triangle", arpEvery: 8 } },
  { side: "A3", name: "NET_RUNNER",
    desc: "A full web browser tool: reads docs, researches errors, downloads what the job needs.",
    music: { bass: [130.81, 164.81, 196, 246.94, 196, 164.81, 130.81, 164.81], tempo: 170, wave: "square", arpEvery: 2 } },
  { side: "B1", name: "GIT_WIZARD",
    desc: "Branches, commits, pushes, opens pull requests — the whole loop, with clean history.",
    music: { bass: [55, 55, 55, 58.27, 55, 55, 65.41, 62.23], tempo: 140, wave: "square", arpEvery: 8 } },
  { side: "B2", name: "PLAN_SPLITTER",
    desc: "Breaks big ambiguous tasks into tracked steps and works them one by one until done.",
    music: { bass: [220, 0, 0, 164.81, 0, 196, 0, 0], tempo: 650, wave: "sine", arpEvery: 4 } },
  { side: "B3", name: "ANY_LLM_FREEDOM",
    desc: "Model-agnostic: Claude, GPT, Gemini, Qwen, Devstral, local models. MIT-licensed, zero lock-in.",
    music: { bass: [73.42, 82.41, 98, 110, 98, 82.41], tempo: 420, wave: "sawtooth", detune: 14, arpEvery: 3 } }
];

const tracksEl = document.getElementById("tracks");
const info = document.getElementById("track-info");
tracks.forEach((track, i) => {
  const row = document.createElement("div");
  row.className = "track";
  const num = document.createElement("span");
  num.className = "num";
  num.textContent = track.side;
  const name = document.createElement("span");
  name.textContent = track.name;
  row.append(num, name);
  row.addEventListener("click", () => {
    document.querySelectorAll(".track").forEach((x) => x.classList.remove("playing"));
    row.classList.add("playing");
    currentTrack = i;
    step = 0;
    info.textContent = "♫ NOW DECODING " + track.side + " “" + track.name + "” — " + track.desc;
  });
  tracksEl.appendChild(row);
});

/* ---------- synthwave engine (WebAudio, no files) ---------- */
function note(freq, time, dur, type, gainV, detuneCents) {
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.value = freq;
  if (detuneCents) o.detune.value = detuneCents;
  g.gain.setValueAtTime(gainV, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  o.connect(g).connect(actx.destination);
  o.start(time);
  o.stop(time + dur);
}

function loop() {
  if (!synthOn) return;
  const m = tracks[currentTrack].music;
  const t = actx.currentTime;
  const b = m.bass[step % m.bass.length];
  if (b > 0) {
    const dur = Math.min(0.5, m.tempo / 1000);
    note(b, t, dur, m.wave, 0.08, 0);
    if (m.detune) note(b, t, dur, m.wave, 0.05, m.detune);
    note(b * 2, t, dur * 0.6, "square", 0.025, 0);
    if (step % m.arpEvery === 0) note(b * 4, t + 0.08, 0.5, "triangle", 0.02, 0);
  }
  step++;
  seqTimer = setTimeout(loop, m.tempo);
}

document.getElementById("audio-btn").addEventListener("click", function () {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  synthOn = !synthOn;
  this.textContent = synthOn ? "♪ SYNTH: ON" : "♪ SYNTH: OFF";
  if (synthOn) {
    actx.resume();
    loop();
  } else {
    clearTimeout(seqTimer);
  }
});
