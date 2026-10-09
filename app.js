/* ==========================================================
   XLIP Studio - app.js
   Editor de vídeo en el navegador (estilo CapCut)
   Funciona con el index.html y styles.css de XLIP Studio.
   Lo que falte en el HTML (línea de tiempo, ventanas) lo crea
   este archivo, y añade su propio CSS de apoyo.
   ========================================================== */
(function () {
'use strict';

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const on = (el, ev, fn, o) => el && el.addEventListener(ev, fn, o);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = t => {
  const T = Math.floor(Math.max(0, t || 0) * 10);
  const m = Math.floor(T / 600), s = Math.floor((T % 600) / 10), d = T % 10;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + d;
};
const fmtShort = t => {
  const m = Math.floor(t / 60), s = Math.round(t - m * 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};
const hexA = (hex, a) => {
  const h = (hex || '#000000').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16) || 0;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const FILTER_OK = 'filter' in CanvasRenderingContext2D.prototype;
const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

/* ---------- iconos ---------- */
const SVG = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  new: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  open: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  export: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
  import: '<path d="M12 15V3M7 10l5 5 5-5"/><path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>',
  audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  sticker: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  effects: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/>',
  transitions: '<path d="M4 5l8 7-8 7zM20 5l-8 7 8 7z"/>',
  captions: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 11h4M7 15h2M13 15h4"/>',
  filters: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',
  tostart: '<path d="M6 5v14M19 5l-9 7 9 7z"/>',
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
  pause: '<path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/>',
  fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  split: '<path d="M12 2v20"/><path d="M8 6H4v12h4M16 6h4v12h-4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  zoomin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6M11 8v6"/>',
  zoomout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>',
  fit: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.5 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.2-1"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>'
};
function hydrateIcons(root = document) {
  $$('.ic[data-icon]', root).forEach(el => { const d = ICONS[el.dataset.icon]; if (d) el.innerHTML = SVG(d); });
}
function setIcon(el, name) { if (!el) return; el.dataset.icon = name; el.innerHTML = SVG(ICONS[name] || ''); }

/* ---------- CSS de apoyo (clips, ventanas, avisos, móvil) ---------- */
(function injectCSS() {
  const st = document.createElement('style');
  st.id = 'xlip-extra';
  st.textContent = `
.xclip{position:absolute;top:4px;bottom:4px;border-radius:7px;overflow:hidden;cursor:grab;touch-action:none;display:flex;align-items:center;color:#fff;font-size:11px;border:1px solid rgba(255,255,255,.2);box-shadow:0 1px 3px rgba(0,0,0,.4);background:#0f7f86}
.xclip.video{background-color:var(--clip-video,#0f7f86)}
.xclip.image{background-color:var(--clip-image,#4a5fd0)}
.xclip.text{background-color:var(--clip-text,#c2751f)}
.xclip.audio{background-color:var(--clip-audio,#2f8f4e)}
.xclip.selected{outline:2px solid #fff;z-index:5}
.xclip:active{cursor:grabbing}
.xc-thumb{position:absolute;inset:0;background-size:auto 100%;background-repeat:repeat-x;opacity:.5;pointer-events:none}
.xc-body{position:relative;padding:0 14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;text-shadow:0 1px 2px #000;min-width:0;font-weight:600}
.xc-h{position:absolute;top:0;bottom:0;width:14px;z-index:3;cursor:ew-resize;touch-action:none}
.xc-hl{left:0}.xc-hr{right:0}
.xclip.selected .xc-h{background:rgba(255,255,255,.6)}
#playheadHandle{position:absolute;top:3px;left:-8px;width:16px;height:20px;background:#fff;border-radius:4px 4px 8px 8px;pointer-events:none}
#timelineScroll{touch-action:pan-x pan-y}
#timelineInner{min-width:100%}
#previewCanvas{touch-action:none}
#stage:fullscreen #previewCanvas{width:100%!important;height:100%!important;object-fit:contain}
.x-back{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px}
.x-modal{width:100%;max-width:460px;max-height:90dvh;display:flex;flex-direction:column;background:#1b1c22;border:1px solid #31333d;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.x-mh{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #26272f}
.x-mb{padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:14px}
.x-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}
.x-progress{height:8px;border-radius:8px;background:#2d2f38;overflow:hidden}
.x-progress>div{height:100%;width:0;background:#19d3c5;transition:width .2s}
.x-proj{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #26272f;border-radius:10px}
.x-proj>div{flex:1;min-width:0}
.x-proj strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.x-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#23242b;color:#e8e9ee;border:1px solid #31333d;padding:10px 16px;border-radius:10px;font-size:13px;max-width:90vw;box-shadow:0 8px 24px rgba(0,0,0,.5);pointer-events:none}
.x-backdrop{position:fixed;inset:0;z-index:55;background:rgba(0,0,0,.5)}
@media (max-width:900px){
  #workspace{grid-template-columns:minmax(0,1fr)!important}
  #leftPanel,#rightPanel{position:fixed!important;left:0;right:0;bottom:0;top:auto!important;height:58dvh;z-index:60;transform:translateY(105%)!important;transition:transform .22s;border-top:1px solid #31333d;border-radius:14px 14px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.6)}
  #leftPanel.open,#rightPanel.open{transform:none!important}
  .mobile-only{display:inline-flex!important}
  .desktop-only{display:none!important}
}`;
  document.head.appendChild(st);
})();

/* ---------- constantes de dominio ---------- */
const TRACKS = [
  { name: 'Texto', kinds: ['text'] },
  { name: 'Superpos.', kinds: ['video', 'image'] },
  { name: 'Principal', kinds: ['video', 'image'] },
  { name: 'Audio', kinds: ['audio'] }
];
const ASPECTS = { '16:9': [16, 9], '9:16': [9, 16], '1:1': [1, 1], '4:3': [4, 3], '3:4': [3, 4], '21:9': [21, 9] };
const FONTS = ['Arial', 'Arial Black', 'Impact', 'Georgia', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Courier New', 'Comic Sans MS', 'Brush Script MT', 'sans-serif', 'serif', 'monospace'];
const FILTERS = {
  bw: { g: 1 }, sepia: { sep: 0.9 }, vivid: { s: 1.9, c: 1.1 }, cool: { sep: 0.2, h: 170, s: 1.3 },
  warm: { sep: 0.35, s: 1.4, h: -10 }, vintage: { sep: 0.5, c: 0.9, b: 1.1, s: 0.8 },
  drama: { c: 1.4, s: 0.8, b: 0.85 }, soft: { c: 0.85, b: 1.1, blur: 0.6 }
};
const ANIMS = [['none', 'Ninguna', '∅'], ['fade', 'Fundido', '◐'], ['zoomIn', 'Zoom +', '⤢'], ['zoomOut', 'Zoom −', '⤡'],
  ['slideL', 'Deslizar ←', '←'], ['slideR', 'Deslizar →', '→'], ['slideUp', 'Subir', '↑'], ['slideDown', 'Bajar', '↓'],
  ['spin', 'Giro', '↻'], ['bounce', 'Rebote', '⤒']];
const PRESETS = {
  title: { fontSize: 96, bold: true, font: 'Arial Black' },
  subtitle: { fontSize: 64, bold: true },
  body: { fontSize: 48, bold: false },
  neon: { fontSize: 84, bold: true, color: '#ffffff', shadowColor: '#19d3c5', shadowBlur: 28 },
  outline: { fontSize: 90, bold: true, color: '#ffffff', strokeColor: '#000000', strokeWidth: 6 },
  shadow: { fontSize: 84, bold: true, shadowColor: '#e11d48', shadowOffset: 6 },
  box: { fontSize: 64, bold: true, color: '#111111', bgColor: '#ffffff', bgOpacity: 100 },
  retro: { fontSize: 90, font: 'Impact', bold: false, color: '#ffd24a', shadowColor: '#e11d48', shadowOffset: 6 }
};
const defProps = () => ({
  scale: 100, posX: 0, posY: 0, rotation: 0, opacity: 100, flipH: false, flipV: false,
  brightness: 0, contrast: 0, saturation: 0, temp: 0, blur: 0,
  filter: 'none', filterStrength: 100, effect: 'none',
  transition: 'none', transDur: 0.6, animIn: 'none', animOut: 'none', animDur: 0.5,
  volume: 100, fadeIn: 0, fadeOut: 0, speed: 1
});
const defText = () => ({
  text: 'Tu texto', font: 'Arial', fontSize: 72, bold: true, italic: false, align: 'center',
  color: '#ffffff', strokeColor: '#000000', strokeWidth: 0, shadowColor: '#000000', shadowBlur: 0, shadowOffset: 0,
  bgColor: '#000000', bgOpacity: 0
});
const newTrackState = () => TRACKS.map(() => ({ hidden: false, muted: false, locked: false }));

/* ---------- estado ---------- */
let project = { name: 'Proyecto sin título', aspect: '16:9', trackState: newTrackState(), clips: [] };
let projectId = null;
const media = new Map();     // id -> medio importado
const els = new Map();       // clipId -> {el, node, gain}
const boxes = new Map();     // clipId -> caja en el lienzo (para arrastrar)
let selId = null;
let curPTab = 'video';
let animDir = 'in';
let pps = 60;
let dirty = false;
let exporting = false, exportCtl = null;
const player = { t: 0, playing: false, last: 0 };
const undoStack = [], redoStack = [];
let editing = false, editT = null, autoT = null;
let audioCtx = null, masterGain = null, recDest = null;

const sel = () => project.clips.find(c => c.id === selId) || null;
const getClip = id => project.clips.find(c => c.id === id);
const total = () => project.clips.reduce((m, c) => Math.max(m, c.start + c.dur), 0);

/* ---------- referencias DOM ---------- */
const cv = $('#previewCanvas');
const ctx = cv.getContext('2d');
const layer = document.createElement('canvas');
const lctx = layer.getContext('2d');
const tmp = document.createElement('canvas');
const tctx = tmp.getContext('2d');
const stage = $('#stage'), stageWrap = $('#stageWrap');
const btnPlay = $('#btnPlay');

/* ---------- avisos y ventanas ---------- */
let toastT = null;
function toast(msg) {
  $$('.x-toast').forEach(n => n.remove());
  const d = document.createElement('div');
  d.className = 'x-toast'; d.textContent = msg;
  document.body.appendChild(d);
  clearTimeout(toastT);
  toastT = setTimeout(() => d.remove(), 2600);
}
function openModal(title, bodyHTML, lockClose) {
  const back = document.createElement('div');
  back.className = 'x-back';
  back.innerHTML = `<div class="x-modal" role="dialog"><div class="x-mh"><strong>${title}</strong>${lockClose ? '' : '<button class="btn btn-ghost x-x" type="button" aria-label="Cerrar">✕</button>'}</div><div class="x-mb">${bodyHTML}</div></div>`;
  document.body.appendChild(back);
  const close = () => back.remove();
  on($('.x-x', back), 'click', close);
  if (!lockClose) on(back, 'pointerdown', e => { if (e.target === back) close(); });
  hydrateIcons(back);
  return { el: back, close, body: $('.x-mb', back) };
}

/* ==========================================================
   HISTORIAL
   ========================================================== */
const snap = () => JSON.stringify({ clips: project.clips, trackState: project.trackState, aspect: project.aspect, name: project.name });
function pushHistory(s) {
  undoStack.push(s || snap());
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
  markDirty(); updateHistoryBtns();
}
function restore(str) {
  const s = JSON.parse(str);
  project.clips = s.clips.map(c => ({ ...c, p: { ...defProps(), ...c.p } }));
  project.trackState = s.trackState; project.aspect = s.aspect; project.name = s.name;
  if (!getClip(selId)) selId = null;
  const as = $('#aspectSelect'); if (as) as.value = project.aspect;
  const pn = $('#projectName'); if (pn) pn.value = project.name;
  applyAspect(); gcElements(); renderLabels(); renderTimeline(); updateProps(); requestRender(); markDirty(); updateHistoryBtns();
}
function undo() { if (!undoStack.length) return; redoStack.push(snap()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snap()); restore(redoStack.pop()); }
function updateHistoryBtns() {
  const u = $('#tlUndo'), r = $('#tlRedo');
  if (u) u.disabled = !undoStack.length;
  if (r) r.disabled = !redoStack.length;
}
function markDirty() {
  dirty = true; setStatus('Cambios sin guardar');
  if (projectId) { clearTimeout(autoT); autoT = setTimeout(() => saveProject(true), 4000); }
}
function setStatus(t) { const s = $('#saveStatus'); if (s) s.textContent = t; }

/* ==========================================================
   AUDIO (mezcla y grabación)
   ========================================================== */
function ensureAudio() {
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    recDest = audioCtx.createMediaStreamDestination();
  } catch (e) { audioCtx = null; }
  return audioCtx;
}
function getEl(clip) {
  let o = els.get(clip.id);
  if (o) return o;
  const m = media.get(clip.mediaId);
  if (!m) return null;
  const el = document.createElement(m.kind === 'audio' ? 'audio' : 'video');
  el.preload = 'auto'; el.playsInline = true; el.setAttribute('playsinline', '');
  el.src = m.url;
  on(el, 'seeked', requestRender); on(el, 'loadeddata', requestRender);
  o = { el, node: null, gain: null };
  if (ensureAudio()) {
    try {
      o.node = audioCtx.createMediaElementSource(el);
      o.gain = audioCtx.createGain();
      o.node.connect(o.gain); o.gain.connect(masterGain); o.gain.connect(recDest);
    } catch (e) { o.node = null; o.gain = null; }
  }
  els.set(clip.id, o);
  return o;
}
function setGain(o, g) {
  if (o.gain) o.gain.gain.value = clamp(g, 0, 2);
  else o.el.volume = clamp(g, 0, 1);
}
function gcElements() {
  for (const [id, o] of els) {
    if (project.clips.some(c => c.id === id)) continue;
    try { o.el.pause(); o.node && o.node.disconnect(); o.gain && o.gain.disconnect(); } catch (e) { }
    o.el.removeAttribute('src'); try { o.el.load(); } catch (e) { }
    els.delete(id);
  }
}
function getImage(m) {
  if (!m.img) { const im = new Image(); im.onload = requestRender; im.src = m.url; m.img = im; }
  return m.img;
}

/* ==========================================================
   MEDIOS: importar
   ========================================================== */
function kindOf(f) {
  const t = f.type || '';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('audio/')) return 'audio';
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  if (['mp4', 'mov', 'm4v', 'webm', 'mkv', '3gp'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'opus'].includes(ext)) return 'audio';
  return null;
}
function loadMeta(m) {
  return new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error('tiempo agotado')), 20000);
    const fail = () => { clearTimeout(to); rej(new Error('formato no compatible')); };
    if (m.kind === 'image') {
      const im = new Image();
      im.onload = () => { clearTimeout(to); m.w = im.naturalWidth; m.h = im.naturalHeight; m.dur = 5; m.thumb = m.url; m.img = im; res(m); };
      im.onerror = fail; im.src = m.url; return;
    }
    const el = document.createElement(m.kind === 'video' ? 'video' : 'audio');
    el.preload = 'metadata'; el.muted = true; el.playsInline = true;
    on(el, 'loadedmetadata', () => {
      m.dur = isFinite(el.duration) ? el.duration : 0;
      if (m.kind === 'video') { m.w = el.videoWidth; m.h = el.videoHeight; el.currentTime = Math.min(0.3, m.dur / 2); }
      else { clearTimeout(to); res(m); }
    });
    on(el, 'seeked', () => {
      try {
        const c = document.createElement('canvas'); const r = (m.w || 16) / (m.h || 9);
        c.height = 90; c.width = Math.max(1, Math.round(90 * r));
        c.getContext('2d').drawImage(el, 0, 0, c.width, c.height);
        m.thumb = c.toDataURL('image/jpeg', 0.6);
      } catch (e) { m.thumb = null; }
      clearTimeout(to); res(m);
    });
    on(el, 'error', fail);
    el.src = m.url;
  });
}
async function importFiles(list) {
  ensureAudio();
  let n = 0;
  for (const f of Array.from(list)) {
    const kind = kindOf(f);
    if (!kind) { toast('Formato no compatible: ' + f.name); continue; }
    const m = { id: uid(), kind, name: f.name, blob: f, url: URL.createObjectURL(f), dur: 0, w: 0, h: 0, thumb: null };
    try { await loadMeta(m); if (!m.dur && kind !== 'image') throw new Error('sin duración'); media.set(m.id, m); n++; }
    catch (e) { URL.revokeObjectURL(m.url); toast('No se pudo leer ' + f.name + ': ' + e.message); }
  }
  if (n) { renderMedia(); markDirty(); toast(n === 1 ? 'Archivo importado' : n + ' archivos importados'); }
}
const fileInput = document.createElement('input');
fileInput.type = 'file'; fileInput.multiple = true; fileInput.hidden = true;
document.body.appendChild(fileInput);
on(fileInput, 'change', () => { if (fileInput.files.length) importFiles(fileInput.files); fileInput.value = ''; });
$$('[data-import]').forEach(b => on(b, 'click', () => {
  fileInput.accept = b.dataset.import === 'audio' ? 'audio/*' : 'video/*,image/*,audio/*';
  fileInput.click();
}));

const mediaItemHTML = m => `<div class="media-item" data-mid="${m.id}"><div class="media-thumb" style="${m.thumb && m.kind !== 'audio' ? `background-image:url('${m.thumb}')` : ''}">${m.kind === 'audio' ? '♪' : ''}</div><span class="media-dur">${m.kind === 'image' ? 'IMG' : fmt(m.dur)}</span><button class="media-del" data-del="${m.id}" type="button" aria-label="Quitar">×</button><button class="media-add" data-add="${m.id}" type="button" aria-label="Añadir">+</button><div class="media-name">${esc(m.name)}</div></div>`;
function renderMedia() {
  const all = [...media.values()], au = all.filter(m => m.kind === 'audio');
  const me = $('#mediaEmpty'), ae = $('#audioEmpty');
  if (me) me.hidden = all.length > 0;
  if (ae) ae.hidden = au.length > 0;
  const ml = $('#mediaList'), al = $('#audioList');
  if (ml) ml.innerHTML = all.map(mediaItemHTML).join('');
  if (al) al.innerHTML = au.map(mediaItemHTML).join('');
}
function mediaClick(e) {
  const del = e.target.closest('[data-del]');
  if (del) { removeMedia(del.dataset.del); return; }
  const it = e.target.closest('.media-item');
  if (it) addMediaToTimeline(media.get(it.dataset.mid));
}
on($('#mediaList'), 'click', mediaClick);
on($('#audioList'), 'click', mediaClick);
function removeMedia(id) {
  const m = media.get(id); if (!m) return;
  const used = project.clips.some(c => c.mediaId === id);
  if (used && !confirm('Este archivo se usa en la línea de tiempo. ¿Quitarlo junto con sus clips?')) return;
  if (used) { pushHistory(); project.clips = project.clips.filter(c => c.mediaId !== id); if (!getClip(selId)) selId = null; gcElements(); }
  URL.revokeObjectURL(m.url); media.delete(id);
  renderMedia(); renderTimeline(); updateProps(); requestRender();
}
function nearestAspect(w, h) {
  const r = w / h; let best = '16:9', bd = 1e9;
  for (const [k, [a, b]] of Object.entries(ASPECTS)) { const d = Math.abs(Math.log(r / (a / b))); if (d < bd) { bd = d; best = k; } }
  return best;
}
function addMediaToTimeline(m) {
  if (!m) return;
  const track = m.kind === 'audio' ? 3 : 2;
  if (project.trackState[track].locked) { toast('La pista está bloqueada'); return; }
  pushHistory();
  if (!project.clips.length && m.w && m.h) {
    project.aspect = nearestAspect(m.w, m.h);
    const as = $('#aspectSelect'); if (as) as.value = project.aspect;
    applyAspect();
  }
  const c = { id: uid(), track, kind: m.kind, mediaId: m.id, start: player.t, dur: m.kind === 'image' ? 5 : m.dur, srcIn: 0, p: defProps() };
  resolveOverlap(c);
  project.clips.push(c);
  selId = c.id;
  renderTimeline(); updateProps(); requestRender();
  if (isMobile()) closeSheets();
}

/* ==========================================================
   MOTOR DE CLIPS
   ========================================================== */
function resolveOverlap(c) {
  if (c.track < 2) return;
  let moved = true, guard = 0;
  while (moved && guard++ < 60) {
    moved = false;
    for (const o of project.clips) {
      if (o === c || o.track !== c.track) continue;
      if (c.start < o.start + o.dur - 1e-6 && c.start + c.dur > o.start + 1e-6) { c.start = o.start + o.dur; moved = true; }
    }
  }
}
function splitAtPlayhead() {
  const t = player.t;
  let targets = sel() ? [sel()] : project.clips.filter(c => !project.trackState[c.track].locked);
  targets = targets.filter(c => t > c.start + 0.1 && t < c.start + c.dur - 0.1 && !project.trackState[c.track].locked);
  if (!targets.length) { toast('Coloca el cursor dentro del clip que quieres dividir'); return; }
  pushHistory();
  let last = null;
  for (const c of targets) {
    const cut = t - c.start;
    const r = { ...c, id: uid(), p: { ...c.p, transition: 'none', animIn: 'none' }, start: t, dur: c.dur - cut, srcIn: c.srcIn + cut * c.p.speed };
    c.dur = cut; c.p = { ...c.p, animOut: 'none' };
    project.clips.push(r); last = r;
  }
  if (sel() && last) selId = last.id;
  renderTimeline(); updateProps(); requestRender();
}
function duplicateSel() {
  const c = sel(); if (!c) { toast('Selecciona un clip'); return; }
  if (project.trackState[c.track].locked) { toast('La pista está bloqueada'); return; }
  pushHistory();
  const d = JSON.parse(JSON.stringify(c)); d.id = uid(); d.start = c.start + c.dur;
  resolveOverlap(d); project.clips.push(d); selId = d.id;
  renderTimeline(); updateProps(); requestRender();
}
function deleteSel() {
  const c = sel(); if (!c) { toast('Selecciona un clip'); return; }
  if (project.trackState[c.track].locked) { toast('La pista está bloqueada'); return; }
  pushHistory();
  project.clips = project.clips.filter(x => x.id !== c.id);
  selId = null; gcElements();
  if (player.t > total()) player.t = total();
  renderTimeline(); updateProps(); requestRender();
}
function setSpeed(c, v) {
  if (c.kind !== 'video' && c.kind !== 'audio') return;
  const m = media.get(c.mediaId);
  let nd = (c.dur * c.p.speed) / v;
  if (m && m.dur) nd = Math.min(nd, (m.dur - c.srcIn) / v);
  c.p.speed = v; c.dur = Math.max(0.1, nd);
  resolveOverlap(c); renderTimeline();
}
function addText(preset, opts = {}) {
  if (project.trackState[0].locked) { toast('La pista de texto está bloqueada'); return; }
  pushHistory();
  const c = {
    id: uid(), track: 0, kind: 'text', mediaId: null, start: player.t, dur: opts.dur || 3, srcIn: 0,
    sticker: !!opts.sticker, p: { ...defProps(), ...defText(), ...(PRESETS[preset] || {}), ...(opts.p || {}) }
  };
  project.clips.push(c); selId = c.id; curPTab = 'text';
  renderTimeline(); updateProps(); requestRender();
  if (isMobile()) closeSheets();
}

/* ==========================================================
   RENDER DEL LIENZO
   ========================================================== */
const ease = k => 1 - Math.pow(1 - k, 3);
function filterString(p, U) {
  let b = 1 + p.brightness / 100, c = 1 + p.contrast / 100, s = 1 + p.saturation / 100, g = 0, sep = 0, h = 0, blur = p.blur * U;
  const f = FILTERS[p.filter];
  if (f && p.filter !== 'none') {
    const k = p.filterStrength / 100;
    if (f.b) b *= 1 + (f.b - 1) * k;
    if (f.c) c *= 1 + (f.c - 1) * k;
    if (f.s) s *= 1 + (f.s - 1) * k;
    if (f.g) g += f.g * k;
    if (f.sep) sep += f.sep * k;
    if (f.h) h += f.h * k;
    if (f.blur) blur += f.blur * k * U;
  }
  if (p.effect === 'blur') blur += 6 * U;
  if (p.effect === 'pulse') { /* se anima aparte */ }
  if (b === 1 && c === 1 && s === 1 && !g && !sep && !h && !blur) return 'none';
  return `brightness(${Math.max(0, b).toFixed(3)}) contrast(${Math.max(0, c).toFixed(3)}) saturate(${Math.max(0, s).toFixed(3)})` +
    (g ? ` grayscale(${g.toFixed(3)})` : '') + (sep ? ` sepia(${sep.toFixed(3)})` : '') + (h ? ` hue-rotate(${h.toFixed(1)}deg)` : '') +
    (blur ? ` blur(${blur.toFixed(2)}px)` : '');
}
function animate(a, type, remain, dir, c, W, H) {
  if (!type || type === 'none') return;
  const d = Math.min(c.p.animDur, c.dur / 2);
  if (remain >= d) return;
  const k = clamp(remain / d, 0, 1), e = ease(k), sg = dir === 'in' ? 1 : -1;
  switch (type) {
    case 'fade': a.alpha *= e; break;
    case 'zoomIn': a.s *= 0.4 + 0.6 * e; a.alpha *= e; break;
    case 'zoomOut': a.s *= 1 + 0.6 * (1 - e); a.alpha *= e; break;
    case 'slideL': a.dx += sg * (1 - e) * W; break;
    case 'slideR': a.dx -= sg * (1 - e) * W; break;
    case 'slideUp': a.dy += sg * (1 - e) * H; break;
    case 'slideDown': a.dy -= sg * (1 - e) * H; break;
    case 'spin': a.rot += sg * (1 - e) * Math.PI; a.alpha *= e; break;
    case 'bounce': { const q = k - 1; a.s *= Math.max(0, 1 + 2.70158 * q * q * q + 1.70158 * q * q); a.alpha *= Math.min(1, k * 3); break; }
  }
}
function transitionEffect(a, type, k, W, H) {
  switch (type) {
    case 'fade': a.alpha *= k; break;
    case 'dip': a.alpha *= k < 0.5 ? 0 : (k - 0.5) * 2; break;
    case 'slideL': a.dx += (1 - k) * W; break;
    case 'slideR': a.dx -= (1 - k) * W; break;
    case 'zoom': a.s *= 1 + (1 - k); a.alpha *= k; break;
    case 'wipe': a.clip = { x: 0, y: 0, w: W * k, h: H }; break;
  }
}
function prevOf(c) {
  let best = null;
  for (const o of project.clips) {
    if (o === c || o.track !== c.track) continue;
    if (Math.abs(o.start + o.dur - c.start) < 0.08) best = o;
  }
  return best;
}
function transitionState(c, t) {
  const lt = t - c.start, d = c.p.transDur;
  if (c.p.transition === 'none' || (c.track !== 1 && c.track !== 2) || lt < 0 || lt >= d) return null;
  return { k: lt / d, prev: prevOf(c) };
}
function drawTextOn(g, c, U) {
  const p = c.p, fs = p.fontSize * U;
  g.font = `${p.italic ? 'italic ' : ''}${p.bold ? 'bold ' : ''}${fs}px "${p.font}", sans-serif`;
  g.textBaseline = 'middle';
  const lines = String(p.text || '').split('\n'), lh = fs * 1.2;
  let mw = 0; lines.forEach(l => { mw = Math.max(mw, g.measureText(l).width); });
  const pad = fs * 0.25, w = mw + pad * 2, h = lines.length * lh + pad * 2;
  if (p.bgOpacity > 0) { g.fillStyle = hexA(p.bgColor, p.bgOpacity / 100); g.fillRect(-w / 2, -h / 2, w, h); }
  g.textAlign = p.align === 'left' ? 'left' : p.align === 'right' ? 'right' : 'center';
  const x = p.align === 'left' ? -mw / 2 : p.align === 'right' ? mw / 2 : 0;
  const y0 = -((lines.length - 1) * lh) / 2;
  if (p.shadowBlur > 0 || p.shadowOffset > 0) {
    g.shadowColor = p.shadowColor; g.shadowBlur = p.shadowBlur * U; g.shadowOffsetX = g.shadowOffsetY = p.shadowOffset * U;
  }
  if (p.strokeWidth > 0) {
    g.lineWidth = p.strokeWidth * U * 2; g.lineJoin = 'round'; g.strokeStyle = p.strokeColor;
    lines.forEach((l, i) => g.strokeText(l, x, y0 + i * lh));
  }
  g.fillStyle = p.color;
  lines.forEach((l, i) => g.fillText(l, x, y0 + i * lh));
  g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0;
  return { w, h };
}
function drawClip(c, lt, opt = {}) {
  const W = cv.width, H = cv.height, U = Math.min(W, H) / 720, p = c.p;
  const a = { alpha: (p.opacity / 100) * (opt.alphaMul === undefined ? 1 : opt.alphaMul), s: 1, dx: 0, dy: 0, rot: 0, clip: null };
  if (!opt.noAnim) {
    animate(a, p.animIn, lt, 'in', c, W, H);
    animate(a, p.animOut, c.dur - lt, 'out', c, W, H);
    if (opt.ts) transitionEffect(a, p.transition, opt.ts.k, W, H);
    if (p.effect === 'shake') { a.dx += Math.sin(lt * 55) * 8 * U; a.dy += Math.cos(lt * 47) * 6 * U; }
    if (p.effect === 'pulse') a.s *= 1 + 0.06 * Math.sin(lt * Math.PI * 4);
  }
  if (a.alpha <= 0.002) return;

  let src = null, sw = 0, sh = 0;
  if (c.kind === 'video') {
    const o = getEl(c); if (!o || o.el.readyState < 2) return;
    src = o.el; sw = o.el.videoWidth; sh = o.el.videoHeight;
  } else if (c.kind === 'image') {
    const m = media.get(c.mediaId); if (!m) return;
    src = getImage(m); if (!src.complete || !src.naturalWidth) return;
    sw = src.naturalWidth; sh = src.naturalHeight;
  }
  if (c.kind !== 'text' && (!sw || !sh)) return;

  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
  if (FILTER_OK) lctx.filter = 'none';
  lctx.clearRect(0, 0, W, H);
  const cx = W / 2 + (p.posX / 100) * W + a.dx, cy = H / 2 + (p.posY / 100) * H + a.dy;
  const sc = (p.scale / 100) * a.s, rot = (p.rotation * Math.PI) / 180 + a.rot;
  let bw, bh;
  lctx.save();
  lctx.translate(cx, cy); lctx.rotate(rot);
  if (c.kind === 'text') {
    lctx.scale(sc, sc);
    const d = drawTextOn(lctx, c, U); bw = d.w * sc; bh = d.h * sc;
  } else {
    const base = Math.min(W / sw, H / sh), dw = sw * base, dh = sh * base;
    lctx.scale((p.flipH ? -1 : 1) * sc, (p.flipV ? -1 : 1) * sc);
    if (FILTER_OK) lctx.filter = filterString(p, U);
    lctx.drawImage(src, -dw / 2, -dh / 2, dw, dh);
    if (FILTER_OK) lctx.filter = 'none';
    bw = dw * sc; bh = dh * sc;
  }
  lctx.restore();
  boxes.set(c.id, { cx, cy, rot, w: bw, h: bh });

  if (c.kind !== 'text') {
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    if (p.temp) {
      lctx.globalCompositeOperation = 'source-atop';
      lctx.fillStyle = p.temp > 0 ? `rgba(255,140,0,${(p.temp / 100) * 0.28})` : `rgba(0,120,255,${(-p.temp / 100) * 0.28})`;
      lctx.fillRect(0, 0, W, H); lctx.globalCompositeOperation = 'source-over';
    }
    if (p.effect === 'vignette') {
      const r = Math.max(bw, bh) * 0.75;
      const gr = lctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.88)');
      lctx.globalCompositeOperation = 'source-atop'; lctx.fillStyle = gr; lctx.fillRect(0, 0, W, H);
      lctx.globalCompositeOperation = 'source-over';
    }
    if (p.effect === 'pixelate') {
      const f = Math.max(6, Math.round(14 * U));
      tmp.width = Math.ceil(W / f); tmp.height = Math.ceil(H / f);
      tctx.imageSmoothingEnabled = true; tctx.drawImage(layer, 0, 0, tmp.width, tmp.height);
      lctx.clearRect(0, 0, W, H); lctx.imageSmoothingEnabled = false;
      lctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, tmp.width * f, tmp.height * f);
      lctx.imageSmoothingEnabled = true;
    }
    if (p.effect === 'glitch' && (lt * 3) % 1 < 0.45) {
      tmp.width = W; tmp.height = H; tctx.drawImage(layer, 0, 0);
      const seed = Math.floor(lt * 14);
      for (let i = 0; i < 6; i++) {
        const r1 = Math.abs(Math.sin(seed * 12.9898 + i * 78.233)), r2 = Math.abs(Math.sin(seed * 4.1414 + i * 11.13));
        const y = Math.floor(r1 * H), hh = Math.floor((0.02 + r2 * 0.08) * H), dx = (r2 - 0.5) * 80 * U;
        lctx.clearRect(0, y, W, hh); lctx.drawImage(tmp, 0, y, W, hh, dx, y, W, hh);
      }
    }
  }
  ctx.save();
  ctx.globalAlpha = clamp(a.alpha, 0, 1);
  if (a.clip) { ctx.beginPath(); ctx.rect(a.clip.x, a.clip.y, a.clip.w, a.clip.h); ctx.clip(); }
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}
function renderFrame(t) {
  const W = cv.width, H = cv.height, U = Math.min(W, H) / 720;
  boxes.clear();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (const tr of [2, 1, 0]) {
    if (project.trackState[tr].hidden) continue;
    const list = project.clips.filter(c => c.track === tr && t >= c.start && t < c.start + c.dur).sort((x, y) => x.start - y.start);
    for (const c of list) {
      const ts = transitionState(c, t);
      if (ts && ts.prev) drawClip(ts.prev, ts.prev.dur - 0.04, { noAnim: true, alphaMul: c.p.transition === 'dip' ? Math.max(0, 1 - ts.k * 2) : 1 });
      drawClip(c, t - c.start, { ts });
    }
  }
  if (!exporting && selId && !player.playing) {
    const b = boxes.get(selId);
    if (b) {
      ctx.save(); ctx.translate(b.cx, b.cy); ctx.rotate(b.rot);
      ctx.strokeStyle = '#19d3c5'; ctx.lineWidth = 2 * U; ctx.setLineDash([8 * U, 5 * U]);
      ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.setLineDash([]);
      ctx.fillStyle = '#19d3c5';
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) ctx.fillRect(sx * b.w / 2 - 5 * U, sy * b.h / 2 - 5 * U, 10 * U, 10 * U);
      ctx.restore();
    }
  }
}
let renderQueued = false;
function requestRender() {
  if (player.playing || renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; renderNow(); });
}
function renderNow() {
  syncMedia();
  renderFrame(player.t);
  updateTime(); updatePlayhead(false);
  const se = $('#stageEmpty'); if (se) se.hidden = total() > 0;
}
function updateTime() { const d = $('#timeDisplay'); if (d) d.textContent = fmt(player.t) + ' / ' + fmt(total()); }

/* ---------- tamaño del lienzo ---------- */
function dimsFor(aspect, short) {
  const [a, b] = ASPECTS[aspect] || ASPECTS['16:9'];
  const r = Math.max(a, b) / Math.min(a, b), long = Math.round((short * r) / 2) * 2;
  return a >= b ? [long, short] : [short, long];
}
function previewDims(aspect) {
  const [a, b] = ASPECTS[aspect] || ASPECTS['16:9'];
  const r = Math.max(a, b) / Math.min(a, b);
  return dimsFor(aspect, Math.floor(Math.min(720, Math.sqrt(1e6 / r)) / 2) * 2);
}
function setCanvasSize(W, H) {
  cv.width = layer.width = W; cv.height = layer.height = H;
}
function applyAspect() { const [W, H] = previewDims(project.aspect); setCanvasSize(W, H); fitStage(); requestRender(); }
function fitStage() {
  if (document.fullscreenElement === stage) { stage.style.width = stage.style.height = ''; return; }
  const aw = stageWrap.clientWidth - 20, ah = stageWrap.clientHeight - 20;
  if (aw <= 0 || ah <= 0) return;
  const r = cv.width / cv.height, w = Math.min(aw, ah * r);
  stage.style.width = Math.floor(w) + 'px'; stage.style.height = Math.floor(w / r) + 'px';
}
if ('ResizeObserver' in window) new ResizeObserver(fitStage).observe(stageWrap);
on(window, 'resize', () => { fitStage(); renderTimeline(); });
on(document, 'fullscreenchange', () => { fitStage(); requestRender(); });

/* ==========================================================
   REPRODUCCIÓN
   ========================================================== */
function syncMedia() {
  const t = player.t, act = new Map();
  for (const c of project.clips) if (t >= c.start && t < c.start + c.dur) act.set(c.id, false);
  for (const [id] of [...act]) {
    const c = getClip(id), ts = c && transitionState(c, t);
    if (ts && ts.prev && !act.has(ts.prev.id)) act.set(ts.prev.id, true);
  }
  for (const c of project.clips) {
    if (c.kind !== 'video' && c.kind !== 'audio') continue;
    const st = act.get(c.id), o0 = els.get(c.id);
    if (st === undefined) { if (o0 && !o0.el.paused) o0.el.pause(); continue; }
    const o = o0 || getEl(c); if (!o) continue;
    const el = o.el, m = media.get(c.mediaId), ts = project.trackState[c.track];
    const lt = st ? Math.max(0, c.dur - 0.04) : t - c.start;
    const want = clamp(c.srcIn + lt * c.p.speed, 0, Math.max(0, (m && m.dur ? m.dur : 1e9) - 0.001));
    let g = c.p.volume / 100;
    if (c.p.fadeIn > 0 && lt < c.p.fadeIn) g *= lt / c.p.fadeIn;
    const rem = c.dur - lt;
    if (c.p.fadeOut > 0 && rem < c.p.fadeOut) g *= Math.max(0, rem / c.p.fadeOut);
    if (ts.muted || st || (c.kind === 'audio' && ts.hidden)) g = 0;
    setGain(o, g);
    if (player.playing && !st) {
      el.playbackRate = clamp(c.p.speed, 0.0625, 16);
      if (el.paused) { if (Math.abs(el.currentTime - want) > 0.05) el.currentTime = want; el.play().catch(() => { }); }
      else if (Math.abs(el.currentTime - want) > 0.3) el.currentTime = want;
    } else {
      if (!el.paused) el.pause();
      if (Math.abs(el.currentTime - want) > 0.04) el.currentTime = want;
    }
  }
}
function setPlayIcon() { setIcon($('.ic', btnPlay), player.playing ? 'pause' : 'play'); }
function play() {
  if (player.playing) return;
  if (!total()) { toast('Añade un clip a la línea de tiempo'); return; }
  ensureAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (player.t >= total() - 0.05) player.t = 0;
  player.playing = true; player.last = performance.now(); setPlayIcon();
  requestAnimationFrame(loop);
}
function pause() {
  player.playing = false; setPlayIcon();
  for (const o of els.values()) { try { o.el.pause(); } catch (e) { } }
}
function loop(ts) {
  if (!player.playing) return;
  player.t += Math.max(0, Math.min(0.25, (ts - player.last) / 1000)); player.last = ts;
  const T = total();
  if (player.t >= T) {
    player.t = T; pause(); renderNow();
    if (exporting) finishExport();
    return;
  }
  syncMedia(); renderFrame(player.t); updateTime(); updatePlayhead(true);
  if (exporting && exportCtl && exportCtl.bar) exportCtl.bar.style.width = (player.t / T * 100).toFixed(1) + '%';
  requestAnimationFrame(loop);
}
function seek(t) {
  player.t = clamp(t, 0, total());
  renderNow();
}
on(btnPlay, 'click', () => (player.playing ? pause() : play()));
on($('#btnToStart'), 'click', () => { seek(0); const s = $('#timelineScroll'); if (s) s.scrollLeft = 0; });
on($('#aspectSelect'), 'change', e => { pushHistory(); project.aspect = e.target.value; applyAspect(); });
on($('#btnFullscreen'), 'click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (stage.requestFullscreen) stage.requestFullscreen().catch(() => toast('Pantalla completa no disponible'));
  else toast('Pantalla completa no disponible en este navegador');
});

/* ---------- arrastrar / escalar sobre el reproductor ---------- */
function hitBox(b, px, py) {
  const dx = px - b.cx, dy = py - b.cy, cs = Math.cos(b.rot), sn = Math.sin(b.rot);
  const lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;
  return Math.abs(lx) <= b.w / 2 && Math.abs(ly) <= b.h / 2;
}
on(cv, 'pointerdown', e => {
  if (exporting) return;
  const r = cv.getBoundingClientRect(), k = cv.width / r.width;
  const px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
  let c = sel(), b = c && boxes.get(c.id), mode = 'move';
  if (b) {
    const cs = Math.cos(b.rot), sn = Math.sin(b.rot);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const lx = sx * b.w / 2, ly = sy * b.h / 2, X = b.cx + lx * cs - ly * sn, Y = b.cy + lx * sn + ly * cs;
      if (Math.hypot(px - X, py - Y) < 26 * k) mode = 'scale';
    }
  }
  if (!b || (mode !== 'scale' && !hitBox(b, px, py))) {
    c = null;
    outer: for (const tr of [0, 1, 2]) {
      if (project.trackState[tr].hidden) continue;
      const list = project.clips.filter(x => x.track === tr && player.t >= x.start && player.t < x.start + x.dur).reverse();
      for (const x of list) { const bb = boxes.get(x.id); if (bb && hitBox(bb, px, py)) { c = x; break outer; } }
    }
    select(c ? c.id : null);
    if (!c) return;
    b = boxes.get(c.id); mode = 'move';
  }
  if (project.trackState[c.track].locked) { toast('La pista está bloqueada'); return; }
  const pre = snap(), o = { x: c.p.posX, y: c.p.posY, s: c.p.scale };
  const d0 = Math.max(1, Math.hypot(px - b.cx, py - b.cy));
  let moved = false;
  const mv = ev => {
    const X = (ev.clientX - r.left) * k, Y = (ev.clientY - r.top) * k;
    moved = true;
    if (mode === 'move') { c.p.posX = clamp(o.x + ((X - px) / cv.width) * 100, -100, 100); c.p.posY = clamp(o.y + ((Y - py) / cv.height) * 100, -100, 100); }
    else c.p.scale = clamp(o.s * Math.hypot(X - b.cx, Y - b.cy) / d0, 10, 400);
    syncInputs(c); requestRender();
  };
  const up = () => {
    document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
    if (moved) pushHistory(pre);
  };
  document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  e.preventDefault();
});

/* ==========================================================
   LÍNEA DE TIEMPO
   ========================================================== */
let scrollEl, inner, ruler, lanesEl, labelsEl, playheadEl;
function buildTimeline() {
  let ta = $('#timelineArea');
  if (!ta) { ta = document.createElement('section'); ta.id = 'timelineArea'; $('#app').appendChild(ta); }
  ta.innerHTML = `
  <div id="timelineToolbar">
    <div class="tool-group">
      <button id="tlUndo" class="btn btn-ghost" type="button" title="Deshacer (Ctrl+Z)"><span class="ic" data-icon="undo"></span></button>
      <button id="tlRedo" class="btn btn-ghost" type="button" title="Rehacer (Ctrl+Y)"><span class="ic" data-icon="redo"></span></button>
    </div>
    <div class="tool-group">
      <button id="tlSplit" class="btn btn-ghost" type="button" title="Dividir en el cursor (S)"><span class="ic" data-icon="split"></span></button>
      <button id="tlDup" class="btn btn-ghost" type="button" title="Duplicar (Ctrl+D)"><span class="ic" data-icon="copy"></span></button>
      <button id="tlDel" class="btn btn-ghost" type="button" title="Eliminar (Supr)"><span class="ic" data-icon="trash"></span></button>
    </div>
    <span class="spacer"></span>
    <div class="tool-group zoom-group">
      <button id="tlZoomOut" class="btn btn-ghost" type="button" title="Alejar"><span class="ic" data-icon="zoomout"></span></button>
      <input id="zoomSlider" type="range" min="8" max="300" step="1" value="60" aria-label="Zoom">
      <button id="tlZoomIn" class="btn btn-ghost" type="button" title="Acercar"><span class="ic" data-icon="zoomin"></span></button>
      <button id="tlFit" class="btn btn-ghost" type="button" title="Ajustar a la pantalla"><span class="ic" data-icon="fit"></span></button>
    </div>
  </div>
  <div id="timelineBody">
    <div id="trackLabels"></div>
    <div id="timelineScroll"><div id="timelineInner">
      <div id="ruler"></div><div id="lanes"></div>
      <div id="playhead"><div id="playheadHandle"></div></div>
    </div></div>
  </div>`;
  hydrateIcons(ta);
  scrollEl = $('#timelineScroll'); inner = $('#timelineInner'); ruler = $('#ruler');
  lanesEl = $('#lanes'); labelsEl = $('#trackLabels'); playheadEl = $('#playhead');

  on($('#tlUndo'), 'click', undo); on($('#tlRedo'), 'click', redo);
  on($('#tlSplit'), 'click', splitAtPlayhead); on($('#tlDup'), 'click', duplicateSel); on($('#tlDel'), 'click', deleteSel);
  on($('#tlZoomOut'), 'click', () => setZoom(pps / 1.4));
  on($('#tlZoomIn'), 'click', () => setZoom(pps * 1.4));
  on($('#tlFit'), 'click', () => setZoom(((scrollEl.clientWidth - 40) / Math.max(total(), 1))));
  on($('#zoomSlider'), 'input', e => setZoom(parseFloat(e.target.value)));

  on(labelsEl, 'click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.dataset.t, k = b.dataset.act;
    pushHistory(); project.trackState[i][k] = !project.trackState[i][k];
    renderLabels(); renderTimeline(); requestRender();
  });
  on(ruler, 'pointerdown', scrubStart);
  on(lanesEl, 'pointerdown', e => {
    const ce = e.target.closest('.xclip');
    if (!ce) { select(null); scrubStart(e); return; }
    const c = getClip(ce.dataset.id); if (!c) return;
    select(c.id);
    const h = e.target.closest('.xc-h');
    startDrag(e, c, ce, h ? h.dataset.h : null);
    e.preventDefault();
  });
  updateHistoryBtns();
}
function setZoom(v) {
  const nv = clamp(v, 8, 300);
  const px = player.t * pps - scrollEl.scrollLeft;
  pps = nv; $('#zoomSlider').value = nv;
  renderTimeline();
  scrollEl.scrollLeft = Math.max(0, player.t * pps - px);
}
function renderLabels() {
  labelsEl.innerHTML = '<div class="label-spacer"></div>' + TRACKS.map((tr, i) => {
    const s = project.trackState[i];
    return `<div class="track-label"><span class="track-name">${tr.name}</span><div class="track-btns">` +
      `<button type="button" data-act="hidden" data-t="${i}" class="${s.hidden ? 'active' : ''}" title="${s.hidden ? 'Mostrar' : 'Ocultar'}"><span class="ic" data-icon="${s.hidden ? 'eyeoff' : 'eye'}"></span></button>` +
      (i !== 0 ? `<button type="button" data-act="muted" data-t="${i}" class="${s.muted ? 'active' : ''}" title="${s.muted ? 'Activar sonido' : 'Silenciar'}"><span class="ic" data-icon="${s.muted ? 'mute' : 'volume'}"></span></button>` : '') +
      `<button type="button" data-act="locked" data-t="${i}" class="${s.locked ? 'active' : ''}" title="${s.locked ? 'Desbloquear' : 'Bloquear'}"><span class="ic" data-icon="${s.locked ? 'lock' : 'unlock'}"></span></button>` +
      `</div></div>`;
  }).join('');
  hydrateIcons(labelsEl);
}
function clipLabel(c) {
  if (c.kind === 'text') return (c.sticker ? '' : 'T  ') + String(c.p.text || '').split('\n')[0];
  const m = media.get(c.mediaId); return m ? m.name : 'Clip';
}
function clipHTML(c) {
  const m = media.get(c.mediaId);
  const th = m && m.thumb && c.kind !== 'audio' ? `<div class="xc-thumb" style="background-image:url('${m.thumb}')"></div>` : '';
  return `<div class="xclip ${c.kind}${c.id === selId ? ' selected' : ''}" data-id="${c.id}" style="left:${c.start * pps}px;width:${Math.max(6, c.dur * pps)}px">${th}<span class="xc-h xc-hl" data-h="l"></span><div class="xc-body">${esc(clipLabel(c))}</div><span class="xc-h xc-hr" data-h="r"></span></div>`;
}
function renderTimeline() {
  if (!inner) return;
  const dur = total(), vw = scrollEl.clientWidth || 600;
  const width = Math.max(vw, (dur + 8) * pps);
  inner.style.width = width + 'px';
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const step = steps.find(s => s * pps >= 80) || 600, minor = step / 5;
  let rh = '';
  for (let i = 0, n = Math.ceil(width / pps / minor); i <= n; i++) {
    const x = i * minor * pps, major = i % 5 === 0;
    rh += `<div class="ruler-tick${major ? ' major' : ''}" style="left:${x}px"></div>`;
    if (major) rh += `<div class="ruler-label" style="left:${x}px">${fmtShort(i * minor)}</div>`;
  }
  ruler.innerHTML = rh;
  lanesEl.innerHTML = TRACKS.map((tr, i) => {
    const s = project.trackState[i];
    return `<div class="lane${s.hidden ? ' hidden-track' : ''}${s.locked ? ' locked' : ''}" data-track="${i}">${project.clips.filter(c => c.track === i).map(clipHTML).join('')}</div>`;
  }).join('');
  updatePlayhead(false); updateTime(); updateHistoryBtns();
  const hasSel = !!sel();
  ['tlDup', 'tlDel'].forEach(id => { const b = $('#' + id); if (b) b.disabled = !hasSel; });
}
function updatePlayhead(follow) {
  if (!playheadEl) return;
  const x = player.t * pps;
  playheadEl.style.left = x + 'px';
  if (follow && player.playing) {
    if (x > scrollEl.scrollLeft + scrollEl.clientWidth - 40) scrollEl.scrollLeft = x - 40;
    else if (x < scrollEl.scrollLeft) scrollEl.scrollLeft = Math.max(0, x - 40);
  }
}
function select(id) {
  selId = id;
  $$('.xclip', lanesEl).forEach(e => e.classList.toggle('selected', e.dataset.id === id));
  const hasSel = !!id;
  ['tlDup', 'tlDel'].forEach(i => { const b = $('#' + i); if (b) b.disabled = !hasSel; });
  updateProps(); requestRender();
}
function scrubStart(e) {
  if (player.playing) pause();
  const f = ev => { const r = inner.getBoundingClientRect(); seek((ev.clientX - r.left) / pps); };
  f(e);
  const up = () => { document.removeEventListener('pointermove', f); document.removeEventListener('pointerup', up); };
  document.addEventListener('pointermove', f); document.addEventListener('pointerup', up);
}
function laneAt(y) {
  const l = $$('.lane', lanesEl);
  for (let i = 0; i < l.length; i++) { const r = l[i].getBoundingClientRect(); if (y >= r.top && y < r.bottom) return i; }
  return null;
}
function snapEdge(v, c) {
  const th = 8 / pps; let best = v, bd = th;
  const cand = [0, player.t];
  for (const o of project.clips) if (o !== c) cand.push(o.start, o.start + o.dur);
  for (const x of cand) { const d = Math.abs(x - v); if (d < bd) { bd = d; best = x; } }
  return best;
}
function startDrag(e, c, ce, mode) {
  if (project.trackState[c.track].locked) { toast('La pista está bloqueada'); return; }
  const pre = snap(), x0 = e.clientX, y0 = e.clientY;
  const o = { start: c.start, dur: c.dur, srcIn: c.srcIn, track: c.track };
  const av = c.kind === 'video' || c.kind === 'audio', m = media.get(c.mediaId);
  let moved = false;
  const others = project.clips.filter(x => x !== c && x.track === c.track);
  const mv = ev => {
    if (!moved && Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 5) return;
    moved = true;
    const dx = (ev.clientX - x0) / pps;
    if (!mode) {
      let ns = Math.max(0, o.start + dx);
      const s1 = snapEdge(ns, c), s2 = snapEdge(ns + c.dur, c) - c.dur;
      ns = Math.abs(s1 - ns) <= Math.abs(s2 - ns) ? s1 : s2;
      c.start = Math.max(0, ns);
      const tr = laneAt(ev.clientY);
      if (tr !== null && tr !== c.track && TRACKS[tr].kinds.includes(c.kind) && !project.trackState[tr].locked) {
        c.track = tr; $$('.lane', lanesEl)[tr].appendChild(ce);
      }
    } else if (mode === 'l') {
      let ns = snapEdge(o.start + dx, c), d = ns - o.start;
      const minD = -Math.min(o.start, av ? o.srcIn / c.p.speed : Infinity);
      d = clamp(d, minD, o.dur - 0.2);
      if (c.track >= 2) {
        const pe = others.filter(x => x.start + x.dur <= o.start + 1e-6).reduce((mx, x) => Math.max(mx, x.start + x.dur), 0);
        d = Math.max(d, pe - o.start);
      }
      c.start = o.start + d; c.dur = o.dur - d; if (av) c.srcIn = o.srcIn + d * c.p.speed;
    } else {
      let ne = snapEdge(o.start + o.dur + dx, c), nd = ne - o.start;
      let mx = av && m && m.dur ? (m.dur - o.srcIn) / c.p.speed : Infinity;
      if (c.track >= 2) {
        const nx = others.filter(x => x.start >= o.start + o.dur - 1e-6).reduce((mn, x) => Math.min(mn, x.start), Infinity);
        mx = Math.min(mx, nx - o.start);
      }
      c.dur = clamp(nd, 0.2, mx);
    }
    ce.style.left = c.start * pps + 'px'; ce.style.width = Math.max(6, c.dur * pps) + 'px';
    updateTime();
  };
  const up = () => {
    document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
    if (!moved) return;
    if (!mode) resolveOverlap(c);
    pushHistory(pre); renderTimeline(); updateProps(); requestRender();
  };
  document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
}

/* ==========================================================
   PANEL IZQUIERDO
   ========================================================== */
$$('.tool-tab').forEach(b => on(b, 'click', () => {
  $$('.tool-tab').forEach(x => x.classList.toggle('active', x === b));
  $$('.tab-body').forEach(s => s.hidden = s.dataset.body !== b.dataset.tab);
}));
$$('#textPresets [data-preset]').forEach(b => on(b, 'click', () => addText(b.dataset.preset)));
$$('#stickerGrid [data-emoji]').forEach(b => on(b, 'click', () =>
  addText('body', { sticker: true, p: { text: b.dataset.emoji, fontSize: 170, bold: false, font: 'sans-serif' } })));
on($('#captionDuration'), 'input', e => { const l = $('#captionDurLabel'); if (l) l.textContent = parseFloat(e.target.value).toFixed(1) + ' s'; });
on($('#btnAddCaption'), 'click', () => {
  const t = ($('#captionText').value || '').trim();
  if (!t) { toast('Escribe el texto del subtítulo'); return; }
  addText('body', { dur: parseFloat($('#captionDuration').value) || 3, p: { text: t, fontSize: 52, bold: true, strokeColor: '#000000', strokeWidth: 4, posY: 38 } });
  $('#captionText').value = '';
});
function needVisual() {
  const c = sel();
  if (!c || (c.kind !== 'video' && c.kind !== 'image')) { toast('Selecciona primero un clip de vídeo o imagen'); return null; }
  if (project.trackState[c.track].locked) { toast('La pista está bloqueada'); return null; }
  return c;
}
function setClipProp(key, val) {
  const c = needVisual(); if (!c) return;
  pushHistory(); c.p[key] = val; syncInputs(c); requestRender();
}
$$('#effectGrid [data-effect]').forEach(b => on(b, 'click', () => setClipProp('effect', b.dataset.effect)));
$$('#filterGrid [data-filter]').forEach(b => on(b, 'click', () => setClipProp('filter', b.dataset.filter)));
$$('#transitionGrid [data-transition]').forEach(b => on(b, 'click', () => {
  const c = needVisual(); if (!c) return;
  if (c.track !== 1 && c.track !== 2) return;
  pushHistory(); c.p.transition = b.dataset.transition; syncInputs(c);
  if (b.dataset.transition !== 'none') { seek(c.start); play(); }
  else requestRender();
}));

/* ==========================================================
   PANEL DERECHO
   ========================================================== */
const sl = (label, prop, min, max, step, unit) =>
  `<label class="slider"><span>${label}</span><output></output><input type="range" data-prop="${prop}" min="${min}" max="${max}" step="${step}" data-unit="${unit}"></label>`;
function buildPropPanels() {
  const pc = $('#propContent'); if (!pc) return;
  pc.innerHTML = `
  <div class="prop-body" data-pbody="text" hidden>
    <label class="field"><span>Contenido</span><textarea data-prop="text" rows="3"></textarea></label>
    <label class="field"><span>Fuente</span><select data-prop="font">${FONTS.map(f => `<option value="${f}">${f}</option>`).join('')}</select></label>
    ${sl('Tamaño', 'fontSize', 16, 300, 1, 'px')}
    <div class="row">
      <button type="button" class="btn toggle" data-toggle="bold"><strong>B</strong></button>
      <button type="button" class="btn toggle" data-toggle="italic"><em>I</em></button>
      <button type="button" class="btn toggle" data-align="left" title="Izquierda">⟸</button>
      <button type="button" class="btn toggle" data-align="center" title="Centro">≡</button>
      <button type="button" class="btn toggle" data-align="right" title="Derecha">⟹</button>
    </div>
    <div class="row color-row">
      <label class="color"><span>Color</span><input type="color" data-prop="color"></label>
      <label class="color"><span>Contorno</span><input type="color" data-prop="strokeColor"></label>
      <label class="color"><span>Sombra</span><input type="color" data-prop="shadowColor"></label>
      <label class="color"><span>Fondo</span><input type="color" data-prop="bgColor"></label>
    </div>
    ${sl('Grosor del contorno', 'strokeWidth', 0, 30, 1, 'px')}
    ${sl('Desenfoque de sombra', 'shadowBlur', 0, 40, 1, 'px')}
    ${sl('Distancia de sombra', 'shadowOffset', 0, 30, 1, 'px')}
    ${sl('Opacidad del fondo', 'bgOpacity', 0, 100, 1, '%')}
  </div>
  <div class="prop-body" data-pbody="video">
    ${sl('Escala', 'scale', 10, 400, 1, '%')}
    ${sl('Posición X', 'posX', -100, 100, 1, '%')}
    ${sl('Posición Y', 'posY', -100, 100, 1, '%')}
    ${sl('Rotación', 'rotation', -180, 180, 1, '°')}
    ${sl('Opacidad', 'opacity', 0, 100, 1, '%')}
    <div class="row">
      <button type="button" class="btn toggle" data-flip="flipH">Voltear ↔</button>
      <button type="button" class="btn toggle" data-flip="flipV">Voltear ↕</button>
      <button type="button" class="btn" data-reset="video">Restablecer</button>
    </div>
    <p class="hint">También puedes arrastrar el clip en el reproductor y escalarlo desde las esquinas.</p>
  </div>
  <div class="prop-body" data-pbody="audio" hidden>
    ${sl('Volumen', 'volume', 0, 200, 1, '%')}
    ${sl('Fundido de entrada', 'fadeIn', 0, 5, 0.1, ' s')}
    ${sl('Fundido de salida', 'fadeOut', 0, 5, 0.1, ' s')}
    <p class="hint">Para silenciar toda una pista usa el botón de altavoz de la línea de tiempo.</p>
  </div>
  <div class="prop-body" data-pbody="speed" hidden>
    ${sl('Velocidad', 'speed', 0.25, 4, 0.05, 'x')}
    <div class="row">${[0.5, 1, 1.5, 2, 3].map(v => `<button type="button" class="btn" data-speed="${v}">${v}x</button>`).join('')}</div>
    <p class="hint">Cambiar la velocidad cambia la duración del clip en la línea de tiempo.</p>
  </div>
  <div class="prop-body" data-pbody="anim" hidden>
    <div class="row">
      <button type="button" class="btn toggle active" data-animdir="in">Entrada</button>
      <button type="button" class="btn toggle" data-animdir="out">Salida</button>
    </div>
    <div class="card-grid" id="animGrid">${ANIMS.map(([k, l, g]) => `<button class="card" type="button" data-anim="${k}"><span class="thumb thumb-none" style="font-size:22px">${g}</span><span>${l}</span></button>`).join('')}</div>
    ${sl('Duración', 'animDur', 0.1, 2, 0.1, ' s')}
  </div>
  <div class="prop-body" data-pbody="adjust" hidden>
    ${sl('Brillo', 'brightness', -100, 100, 1, '')}
    ${sl('Contraste', 'contrast', -100, 100, 1, '')}
    ${sl('Saturación', 'saturation', -100, 100, 1, '')}
    ${sl('Temperatura', 'temp', -100, 100, 1, '')}
    ${sl('Desenfoque', 'blur', 0, 20, 1, ' px')}
    <button type="button" class="btn" data-reset="adjust">Restablecer</button>
    ${FILTER_OK ? '' : '<p class="hint">Este navegador no admite filtros en el lienzo (Safari). Prueba con Chrome.</p>'}
  </div>`;
}
function showPTab(name) {
  curPTab = name;
  $$('.prop-tab').forEach(b => b.classList.toggle('active', b.dataset.ptab === name));
  $$('.prop-body').forEach(b => b.hidden = b.dataset.pbody !== name);
}
$$('.prop-tab').forEach(b => on(b, 'click', () => showPTab(b.dataset.ptab)));

function fmtVal(inp, v) {
  const dec = (String(inp.step || '').split('.')[1] || '').length;
  return (+v).toFixed(dec) + (inp.dataset.unit || '');
}
function syncInputs(c) {
  if (!c) return;
  $$('[data-prop]').forEach(inp => {
    const v = c.p[inp.dataset.prop]; if (v === undefined) return;
    inp.value = v;
    const out = inp.closest('label') && $('output', inp.closest('label'));
    if (out) out.textContent = fmtVal(inp, v);
  });
  $$('[data-toggle]').forEach(b => b.classList.toggle('active', !!c.p[b.dataset.toggle]));
  $$('[data-flip]').forEach(b => b.classList.toggle('active', !!c.p[b.dataset.flip]));
  $$('[data-align]').forEach(b => b.classList.toggle('active', c.p.align === b.dataset.align));
  $$('#effectGrid .card').forEach(b => b.classList.toggle('active', b.dataset.effect === c.p.effect));
  $$('#filterGrid .card').forEach(b => b.classList.toggle('active', b.dataset.filter === c.p.filter));
  $$('#transitionGrid .card').forEach(b => b.classList.toggle('active', b.dataset.transition === c.p.transition));
  $$('#animGrid .card').forEach(b => b.classList.toggle('active', b.dataset.anim === (animDir === 'in' ? c.p.animIn : c.p.animOut)));
  $$('[data-animdir]').forEach(b => b.classList.toggle('active', b.dataset.animdir === animDir));
}
function updateProps() {
  const c = sel(), pe = $('#propsEmpty'), pb = $('#propsBody');
  if (pe) pe.hidden = !!c;
  if (pb) pb.hidden = !c;
  if (!c) { $$('.card.active').forEach(x => { if (x.closest('#effectGrid,#filterGrid,#transitionGrid')) x.classList.remove('active'); }); return; }
  const allow = { text: ['text', 'video', 'anim'], video: ['video', 'audio', 'speed', 'anim', 'adjust'], image: ['video', 'anim', 'adjust'], audio: ['audio', 'speed'] }[c.kind];
  $$('.prop-tab').forEach(b => b.hidden = !allow.includes(b.dataset.ptab));
  showPTab(allow.includes(curPTab) ? curPTab : allow[0]);
  const nm = $('#propClipName'), inf = $('#propClipInfo');
  if (nm) nm.textContent = clipLabel(c).trim() || 'Clip';
  if (inf) inf.textContent = { video: 'Vídeo', image: 'Imagen', audio: 'Audio', text: c.sticker ? 'Pegatina' : 'Texto' }[c.kind] + ' · ' + c.dur.toFixed(1) + ' s';
  syncInputs(c);
}
function handleProp(t) {
  const c = sel();
  if (!c) { if (t.type === 'range') toast('Selecciona un clip primero'); return; }
  if (project.trackState[c.track].locked) { toast('La pista está bloqueada'); return; }
  const k = t.dataset.prop;
  const v = (t.type === 'range' || t.type === 'number') ? parseFloat(t.value) : t.value;
  if (!editing) { pushHistory(); editing = true; }
  clearTimeout(editT); editT = setTimeout(() => { editing = false; }, 800);
  if (k === 'speed') setSpeed(c, v); else c.p[k] = v;
  const out = t.closest('label') && $('output', t.closest('label'));
  if (out) out.textContent = fmtVal(t, v);
  if (k === 'text') {
    const el = $(`.xclip[data-id="${c.id}"] .xc-body`, lanesEl); if (el) el.textContent = clipLabel(c);
    const nm = $('#propClipName'); if (nm) nm.textContent = clipLabel(c).trim() || 'Clip';
  }
  if (k === 'speed') updateProps();
  requestRender();
}
on(document, 'input', e => { if (e.target.matches && e.target.matches('[data-prop]')) handleProp(e.target); });
on(document, 'click', e => {
  const t = e.target.closest('button'); if (!t) return;
  const c = sel();
  if (t.dataset.toggle || t.dataset.align || t.dataset.flip || t.dataset.speed || t.dataset.anim || t.dataset.reset) {
    if (!c) return;
    if (project.trackState[c.track].locked) { toast('La pista está bloqueada'); return; }
    pushHistory();
    if (t.dataset.toggle) c.p[t.dataset.toggle] = !c.p[t.dataset.toggle];
    else if (t.dataset.flip) c.p[t.dataset.flip] = !c.p[t.dataset.flip];
    else if (t.dataset.align) c.p.align = t.dataset.align;
    else if (t.dataset.speed) setSpeed(c, parseFloat(t.dataset.speed));
    else if (t.dataset.anim) c.p[animDir === 'in' ? 'animIn' : 'animOut'] = t.dataset.anim;
    else if (t.dataset.reset) {
      const d = defProps();
      const keys = t.dataset.reset === 'video' ? ['scale', 'posX', 'posY', 'rotation', 'opacity', 'flipH', 'flipV'] : ['brightness', 'contrast', 'saturation', 'temp', 'blur'];
      keys.forEach(k => { c.p[k] = d[k]; });
    }
    syncInputs(c); updateProps(); requestRender();
    if (t.dataset.anim && t.dataset.anim !== 'none') { seek(animDir === 'in' ? c.start : Math.max(c.start, c.start + c.dur - c.p.animDur)); play(); }
  } else if (t.dataset.animdir) { animDir = t.dataset.animdir; if (c) syncInputs(c); }
});

/* ==========================================================
   MENÚ, PANELES MÓVILES, ATAJOS
   ========================================================== */
const menuPanel = $('#menuPanel');
on($('#btnMenu'), 'click', e => { e.stopPropagation(); if (menuPanel) menuPanel.hidden = !menuPanel.hidden; });
on(document, 'click', e => { if (menuPanel && !e.target.closest('.menu-wrap')) menuPanel.hidden = true; });
$$('[data-menu]').forEach(b => on(b, 'click', () => { if (menuPanel) menuPanel.hidden = true; menuAction(b.dataset.menu); }));
function menuAction(a) {
  if (a === 'new') newProjectAction();
  else if (a === 'save') saveProject(false);
  else if (a === 'open') openProjectsModal();
}
on($('#projectName'), 'input', e => { project.name = e.target.value; markDirty(); });

let backdrop = null;
function closeSheets() {
  const l = $('#leftPanel'), r = $('#rightPanel');
  l && l.classList.remove('open'); r && r.classList.remove('open');
  if (backdrop) { backdrop.remove(); backdrop = null; }
}
function toggleSheet(id) {
  const p = $(id), was = p.classList.contains('open');
  closeSheets();
  if (was) return;
  p.classList.add('open');
  backdrop = document.createElement('div'); backdrop.className = 'x-backdrop';
  on(backdrop, 'pointerdown', closeSheets);
  document.body.appendChild(backdrop);
}
on($('#btnTools'), 'click', () => toggleSheet('#leftPanel'));
on($('#btnProps'), 'click', () => toggleSheet('#rightPanel'));

const SHORTCUTS = [['Espacio', 'Reproducir / pausar'], ['S', 'Dividir en el cursor'], ['Supr / Retroceso', 'Eliminar clip'], ['Ctrl + Z', 'Deshacer'],
  ['Ctrl + Mayús + Z / Ctrl + Y', 'Rehacer'], ['Ctrl + D', 'Duplicar clip'], ['← / →', 'Retroceder / avanzar un fotograma'], ['Inicio', 'Ir al principio'],
  ['F', 'Pantalla completa'], ['+ / −', 'Acercar / alejar la línea de tiempo']];
on($('#btnShortcuts'), 'click', () => {
  openModal('Atajos de teclado', SHORTCUTS.map(([k, d]) => `<div class="prop-row"><span>${d}</span><kbd>${k}</kbd></div>`).join(''));
});
on(document, 'keydown', e => {
  const tg = e.target, typing = tg.matches && tg.matches('input:not([type=range]):not([type=color]),textarea,select');
  if (typing || exporting) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (mod && k === 'y') { e.preventDefault(); redo(); }
  else if (mod && k === 'd') { e.preventDefault(); duplicateSel(); }
  else if (mod) return;
  else if (k === ' ') { e.preventDefault(); player.playing ? pause() : play(); }
  else if (k === 's') splitAtPlayhead();
  else if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSel(); }
  else if (k === 'arrowleft') { e.preventDefault(); seek(player.t - 1 / 30); }
  else if (k === 'arrowright') { e.preventDefault(); seek(player.t + 1 / 30); }
  else if (k === 'home') seek(0);
  else if (k === 'f') $('#btnFullscreen') && $('#btnFullscreen').click();
  else if (k === '+' || k === '=') setZoom(pps * 1.25);
  else if (k === '-') setZoom(pps / 1.25);
});
on(window, 'beforeunload', e => { if (dirty && project.clips.length) { e.preventDefault(); e.returnValue = ''; } });

/* ==========================================================
   PROYECTOS (IndexedDB)
   ========================================================== */
const idbOpen = () => new Promise((res, rej) => {
  const r = indexedDB.open('xlip-studio', 1);
  r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('projects', { keyPath: 'id' }); d.createObjectStore('blobs'); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const txDone = t => new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });

async function saveProject(silent) {
  try {
    const db = await idbOpen();
    if (!projectId) projectId = uid();
    const meta = [...media.values()].map(m => ({ id: m.id, kind: m.kind, name: m.name, dur: m.dur, w: m.w, h: m.h, thumb: m.kind === 'image' ? null : m.thumb, type: m.blob.type }));
    const t = db.transaction(['projects', 'blobs'], 'readwrite');
    t.objectStore('projects').put({ id: projectId, name: project.name, updated: Date.now(), data: JSON.parse(snap()), media: meta });
    const bs = t.objectStore('blobs');
    for (const m of media.values()) bs.put(m.blob, projectId + ':' + m.id);
    const range = IDBKeyRange.bound(projectId + ':', projectId + ':\uffff');
    const cur = bs.openKeyCursor(range);
    cur.onsuccess = () => { const c = cur.result; if (c) { if (!media.has(String(c.key).slice(projectId.length + 1))) bs.delete(c.key); c.continue(); } };
    await txDone(t);
    dirty = false;
    setStatus('Guardado ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    if (!silent) toast('Proyecto guardado');
  } catch (e) { toast('No se pudo guardar (almacenamiento lleno o bloqueado)'); }
}
function resetEditor() {
  pause();
  for (const m of media.values()) URL.revokeObjectURL(m.url);
  media.clear(); project.clips = []; gcElements();
  selId = null; player.t = 0; undoStack.length = 0; redoStack.length = 0;
}
function afterLoad() {
  const as = $('#aspectSelect'); if (as) as.value = project.aspect;
  const pn = $('#projectName'); if (pn) pn.value = project.name;
  applyAspect(); renderMedia(); renderLabels(); renderTimeline(); updateProps(); updateHistoryBtns(); renderNow();
}
function newProjectAction() {
  if ((project.clips.length || media.size) && dirty && !confirm('Hay cambios sin guardar. ¿Crear un proyecto nuevo igualmente?')) return;
  resetEditor();
  project = { name: 'Proyecto sin título', aspect: '16:9', trackState: newTrackState(), clips: [] };
  projectId = null; dirty = false; setStatus('Sin guardar'); afterLoad();
}
async function loadProject(id) {
  try {
    const db = await idbOpen();
    const rec = await req(db.transaction('projects').objectStore('projects').get(id));
    if (!rec) { toast('Proyecto no encontrado'); return; }
    const bs = db.transaction('blobs').objectStore('blobs');
    const newMedia = [];
    for (const mm of rec.media) {
      const blob = await req(bs.get(id + ':' + mm.id));
      if (!blob) continue;
      const url = URL.createObjectURL(blob);
      newMedia.push({ ...mm, blob, url, thumb: mm.kind === 'image' ? url : mm.thumb });
    }
    resetEditor();
    newMedia.forEach(m => media.set(m.id, m));
    const d = rec.data;
    project = {
      name: d.name, aspect: d.aspect, trackState: d.trackState,
      clips: d.clips.filter(c => c.kind === 'text' || media.has(c.mediaId)).map(c => ({ ...c, p: { ...defProps(), ...c.p } }))
    };
    projectId = id; dirty = false; setStatus('Proyecto abierto'); afterLoad();
  } catch (e) { toast('No se pudo abrir el proyecto'); }
}
async function openProjectsModal() {
  let list = [];
  try {
    const db = await idbOpen();
    list = await req(db.transaction('projects').objectStore('projects').getAll());
  } catch (e) { toast('No se puede acceder al almacenamiento del navegador'); return; }
  list.sort((a, b) => b.updated - a.updated);
  const md = openModal('Abrir proyecto', list.length ? list.map(p => `<div class="x-proj" data-id="${p.id}"><div><strong>${esc(p.name)}</strong><span class="muted small">${new Date(p.updated).toLocaleString()}</span></div><button class="btn btn-accent" type="button" data-open="${p.id}">Abrir</button><button class="btn" type="button" data-rm="${p.id}">Borrar</button></div>`).join('') : '<p class="muted">No hay proyectos guardados todavía.</p>');
  on(md.body, 'click', async e => {
    const o = e.target.closest('[data-open]'), r = e.target.closest('[data-rm]');
    if (o) {
      if (dirty && project.clips.length && !confirm('Hay cambios sin guardar. ¿Abrir otro proyecto igualmente?')) return;
      md.close(); loadProject(o.dataset.open);
    } else if (r) {
      if (!confirm('¿Borrar este proyecto para siempre?')) return;
      try {
        const db = await idbOpen(), id = r.dataset.rm;
        const t = db.transaction(['projects', 'blobs'], 'readwrite');
        t.objectStore('projects').delete(id);
        t.objectStore('blobs').delete(IDBKeyRange.bound(id + ':', id + ':\uffff'));
        await txDone(t);
        if (id === projectId) projectId = null;
        r.closest('.x-proj').remove();
      } catch (er) { toast('No se pudo borrar'); }
    }
  });
}

/* ==========================================================
   EXPORTAR
   ========================================================== */
function pickMime() {
  if (!window.MediaRecorder) return null;
  const list = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const type = list.find(t => MediaRecorder.isTypeSupported(t));
  return type ? { type, ext: type.includes('mp4') ? 'mp4' : 'webm' } : null;
}
on($('#btnExport'), 'click', () => {
  if (exporting) return;
  if (!total()) { toast('No hay nada que exportar. Añade clips a la línea de tiempo.'); return; }
  const mime = pickMime();
  if (!mime) { toast('Este navegador no permite grabar vídeo. Usa Chrome.'); return; }
  pause();
  const md = openModal('Exportar vídeo', `
    <label class="field"><span>Nombre</span><input id="exName" type="text" maxlength="60"></label>
    <label class="field"><span>Resolución</span><select id="exRes"><option value="480">480p</option><option value="720" selected>720p</option><option value="1080">1080p</option></select></label>
    <label class="field"><span>Fotogramas por segundo</span><select id="exFps"><option value="24">24 fps</option><option value="30" selected>30 fps</option><option value="60">60 fps</option></select></label>
    <p class="hint">Formato: <strong>${mime.ext.toUpperCase()}</strong> (${esc(mime.type.split(';')[0])}). Duración: ${fmt(total())}. La exportación se hace en tiempo real: mantén la pantalla encendida y esta pestaña abierta.</p>
    <div class="x-actions"><button class="btn" type="button" id="exCancel">Cancelar</button><button class="btn btn-accent" type="button" id="exGo">Exportar</button></div>`);
  $('#exName', md.el).value = project.name || 'proyecto';
  on($('#exCancel', md.el), 'click', md.close);
  on($('#exGo', md.el), 'click', () => {
    const opts = { name: ($('#exName', md.el).value || 'proyecto').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'proyecto', res: +$('#exRes', md.el).value, fps: +$('#exFps', md.el).value, mime };
    md.close(); doExport(opts);
  });
});
async function doExport(opts) {
  const T = total();
  exporting = true;
  const ctl = exportCtl = { cancelled: false, chunks: [], opts };
  const md = openModal('Exportando…', `<p class="muted" id="exMsg">Preparando…</p><div class="x-progress"><div id="exBar"></div></div><div class="x-actions"><button class="btn" type="button" id="exStop">Cancelar</button></div>`, true);
  ctl.modal = md; ctl.bar = $('#exBar', md.el);
  on($('#exStop', md.el), 'click', () => { ctl.cancelled = true; abortExport(); });
  ctl.prevSelId = selId; selId = null;
  try {
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    const [W, H] = dimsFor(project.aspect, opts.res);
    setCanvasSize(W, H);
    if (masterGain) masterGain.gain.value = 0;
    player.t = 0; renderNow();
    await sleep(700); renderNow(); await sleep(150);
    const stream = cv.captureStream(opts.fps);
    if (recDest) recDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    const base = opts.res >= 1080 ? 9e6 : opts.res >= 720 ? 5e6 : 2.5e6;
    const rec = new MediaRecorder(stream, { mimeType: opts.mime.type, videoBitsPerSecond: Math.round(base * opts.fps / 30), audioBitsPerSecond: 128000 });
    ctl.rec = rec;
    rec.ondataavailable = ev => { if (ev.data && ev.data.size) ctl.chunks.push(ev.data); };
    ctl.stopped = new Promise(r => { rec.onstop = r; });
    rec.start(500);
    const msg = $('#exMsg', md.el); if (msg) msg.textContent = 'Grabando ' + fmt(T) + ' de vídeo en tiempo real…';
    play();
  } catch (e) {
    toast('Error al exportar: ' + (e && e.message ? e.message : 'desconocido'));
    abortExport();
  }
}
function cleanupExport() {
  exporting = false;
  if (masterGain) masterGain.gain.value = 1;
  const c = exportCtl; exportCtl = null;
  if (c) { if (c.modal) c.modal.close(); if (c.prevSelId && getClip(c.prevSelId)) selId = c.prevSelId; }
  applyAspect(); renderTimeline(); updateProps(); player.t = 0; renderNow();
}
function abortExport() {
  const c = exportCtl; pause();
  try { if (c && c.rec && c.rec.state !== 'inactive') c.rec.stop(); } catch (e) { }
  cleanupExport();
}
async function finishExport() {
  const c = exportCtl; if (!c || !c.rec) return;
  await sleep(350);
  try { if (c.rec.state !== 'inactive') c.rec.stop(); } catch (e) { }
  await c.stopped;
  if (c.cancelled) return;
  const blob = new Blob(c.chunks, { type: c.opts.mime.type.split(';')[0] });
  const name = c.opts.name + '.' + c.opts.mime.ext;
  cleanupExport();
  if (!blob.size) { toast('La exportación no produjo datos'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  toast('Vídeo exportado: ' + name);
}

/* ==========================================================
   ARRANQUE
   ========================================================== */
hydrateIcons();
buildTimeline();
buildPropPanels();
renderLabels();
applyAspect();
renderMedia();
renderTimeline();
updateProps();
setPlayIcon();
renderNow();
setStatus('Sin guardar');
dirty = false;
})();
