#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * dsh-pet generator — build an 8-column x 9-row dsh-pet spritesheet from a
 * single transparent PNG portrait, plus pet.json.
 *
 * The 9 rows are fixed by the Codex/hatch-pet contract:
 *   0 idle, 1 running-right, 2 running-left, 3 waving, 4 jumping,
 *   5 failed, 6 waiting, 7 running, 8 review.
 *
 * Usage:
 *   npm i sharp     # once
 *   node route-b.js
 *
 * Edit the `jobs` array below (portraitPath / id / displayName / description).
 * Output is written to out/<id>/ (spritesheet.webp, spritesheet.png, pet.json).
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const CELL_W = 192;
const CELL_H = 208;
const COLUMNS = 8;
const ROWS = [
  'idle', 'running-right', 'running-left', 'waving',
  'jumping', 'failed', 'waiting', 'running', 'review',
];
const FRAMES = [6, 8, 8, 4, 5, 8, 6, 6, 6]; // per-row frame counts

// ---- per-state frame parameters (translation/rotation/scale/desat) ----
function params(state, i, n) {
  const t = n === 1 ? 0.5 : i / (n - 1);
  switch (state) {
    case 'idle': case 'waiting': {
      const p = Math.sin(t * Math.PI * 2);
      return { dx: 0, dy: p * (state === 'waiting' ? 4 : 6), angleDeg: p * (state === 'waiting' ? 1.5 : 2.2) };
    }
    case 'running-right': { const x = t * 26 - 13; const y = -Math.abs(Math.sin(t * Math.PI * 2)) * 8; return { dx: x, dy: y }; }
    case 'running-left': { const x = -t * 26 + 13; const y = -Math.abs(Math.sin(t * Math.PI * 2)) * 8; return { dx: x, dy: y }; }
    case 'waving': { return { dx: 0, dy: 0, angleDeg: Math.sin(t * Math.PI * 2) * 6 }; }
    case 'jumping': { return { dx: 0, dy: -Math.sin(t * Math.PI) * 30, scale: 1 + 0.06 * Math.sin(t * Math.PI) }; }
    case 'failed': { return { dx: Math.sin(i * 13) * 3, dy: 0, angleDeg: 0, desat: true }; }
    case 'running': { const x = t * 20 - 10; const y = -Math.abs(Math.sin(t * Math.PI * 2)) * 7; return { dx: x, dy: y }; }
    case 'review': { return { dx: 0, dy: 0, angleDeg: Math.sin(t * Math.PI * 2) * 4 }; }
    default: return { dx: 0, dy: 0 };
  }
}

// ----
let canvas;
const atlasW = COLUMNS * CELL_W;
const atlasH = ROWS.length * CELL_H;

function makeCanvas() { return new Uint8ClampedArray(atlasW * atlasH * 4); }

async function loadSprite(portraitPath, spriteH) {
  const data = await sharp(portraitPath)
    .trim({ threshold: 0 })
    .ensureAlpha()
    .resize({ height: spriteH })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: data.data, w: data.info.width, h: data.info.height };
}

function renderCell(sprite, p) {
  const sw = sprite.w, sh = sprite.h;
  const out = new Uint8ClampedArray(CELL_W * CELL_H * 4);
  const cx = CELL_W / 2 + (p.dx || 0);
  const cy = CELL_H / 2 + (p.dy || 0);
  const sc = p.scale || 1;
  const a = ((p.angleDeg || 0) * Math.PI) / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  for (let ty = 0; ty < CELL_H; ty++) {
    const dy = ty - cy;
    for (let tx = 0; tx < CELL_W; tx++) {
      const dx = tx - cx;
      const lx = (cos * dx + sin * dy) / sc + sw / 2;
      const ly = (-sin * dx + cos * dy) / sc + sh / 2;
      if (lx < 0 || ly < 0 || lx >= sw - 1 || ly >= sh - 1) continue;
      const x0 = Math.floor(lx), y0 = Math.floor(ly);
      const fx = lx - x0, fy = ly - y0;
      const base = (y0 * sw + x0) * 4;
      const r = (sprite.data[base] * (1 - fx) + sprite.data[base + 4] * fx) * (1 - fy) + (sprite.data[base + sw * 4] * (1 - fx) + sprite.data[base + sw * 4 + 4] * fx) * fy;
      const g = (sprite.data[base + 1] * (1 - fx) + sprite.data[base + 5] * fx) * (1 - fy) + (sprite.data[base + sw * 4 + 1] * (1 - fx) + sprite.data[base + sw * 4 + 5] * fx) * fy;
      const b = (sprite.data[base + 2] * (1 - fx) + sprite.data[base + 6] * fx) * (1 - fy) + (sprite.data[base + sw * 4 + 2] * (1 - fx) + sprite.data[base + sw * 4 + 6] * fx) * fy;
      let al = (sprite.data[base + 3] * (1 - fx) + sprite.data[base + 7] * fx) * (1 - fy) + (sprite.data[base + sw * 4 + 3] * (1 - fx) + sprite.data[base + sw * 4 + 7] * fx) * fy;
      let rr = r, gg = g, bb = b;
      if (p.desat) { const lum = 0.299 * r + 0.587 * g + 0.114 * b; rr = gg = bb = lum; }
      const o = (ty * CELL_W + tx) * 4;
      out[o] = rr; out[o + 1] = gg; out[o + 2] = bb; out[o + 3] = al;
    }
  }
  return out;
}

function blendInto(cell, ox, oy) {
  for (let y = 0; y < CELL_H; y++) {
    for (let x = 0; x < CELL_W; x++) {
      const src = (y * CELL_W + x) * 4;
      const dst = ((oy + y) * atlasW + ox + x) * 4;
      const aa = cell[src + 3] / 255;
      const ab = canvas[dst + 3] / 255;
      const outA = aa + ab * (1 - aa);
      if (outA > 0) {
        for (let c = 0; c < 3; c++) canvas[dst + c] = Math.round((cell[src + c] * aa + canvas[dst + c] * ab * (1 - aa)) / outA);
        canvas[dst + 3] = Math.round(outA * 255);
      } else canvas[dst + 3] = 0;
    }
  }
}

async function generate(job) {
  const spriteH = 168; // ~80% of cell height
  const sprite = await loadSprite(job.portraitPath, spriteH);
  canvas = makeCanvas();
  for (let row = 0; row < ROWS.length; row++) {
    const state = ROWS[row];
    const n = FRAMES[row];
    for (let col = 0; col < n; col++) {
      const cell = renderCell(sprite, params(state, col, n));
      blendInto(cell, col * CELL_W, row * CELL_H);
    }
  }
  const outDir = path.join('out', job.id);
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(canvas, { raw: { width: atlasW, height: atlasH, channels: 4 } })
    .webp({ quality: 90, effort: 4 })
    .toFile(path.join(outDir, 'spritesheet.webp'));
  await sharp(canvas, { raw: { width: atlasW, height: atlasH, channels: 4 } })
    .png()
    .toFile(path.join(outDir, 'spritesheet.png'));
  const pet = {
    id: job.id,
    displayName: job.displayName,
    description: job.description,
    spritesheetPath: 'spritesheet.webp',
    frames: FRAMES,
    tracks: {
      idle: { durations: Array(6).fill(400) },
      'running-right': { durations: Array(8).fill(120) },
      'running-left': { durations: Array(8).fill(120) },
      waving: { durations: Array(4).fill(160) },
      jumping: { durations: [150, 150, 150, 150, 300], loop: false, fallback: 'idle' },
      failed: { durations: Array(8).fill(110), loop: false, fallback: 'idle' },
      waiting: { durations: Array(6).fill(400) },
      running: { durations: Array(6).fill(120) },
      review: { durations: Array(6).fill(350) },
    },
  };
  fs.writeFileSync(path.join(outDir, 'pet.json'), JSON.stringify(pet, null, 2) + '\n');
  console.log('wrote', outDir, atlasW + 'x' + atlasH);
}

const JOBS = [
  // { portraitPath: 'sources/paimon.png', id: 'paimon', displayName: '派蒙', description: '最能吃的应急食品，会飞。' },
  // { portraitPath: 'sources/yelan.png', id: 'yelan', displayName: '夜兰', description: '总务司的隐秘情报官。' },
];

(async () => {
  for (const job of JOBS) await generate(job);
  if (JOBS.length === 0) console.log('No jobs configured — edit JOBS at the bottom of route-b.js.');
})();
