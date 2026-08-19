// Minimal contract tests — uses Node's built-in test runner (no deps).
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const PETS_DIR = path.join(__dirname, '..', 'pets');
const PET_ID = /^[a-z0-9][a-z0-9-]*$/;
const ROWS = ['idle','running-right','running-left','waving','jumping','failed','waiting','running','review'];

function pets() {
  return fs.readdirSync(PETS_DIR).filter((n) => /^[a-z0-9-]+$/.test(n) && fs.statSync(path.join(PETS_DIR, n)).isDirectory());
}

test('every pet folder has pet.json and matching spritesheet', () => {
  const n = pets();
  assert.ok(n.length >= 1, 'expected at least one pet');
  for (const id of n) {
    const dir = path.join(PETS_DIR, id);
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'pet.json'), 'utf8'));
    assert.strictEqual(m.id, id, id + ': id must match dir');
    assert.ok(PET_ID.test(m.id), id + ': valid kebab id');
    assert.ok(m.displayName && m.displayName.trim(), id + ': displayName');
    assert.ok(m.spritesheetPath && typeof m.spritesheetPath === 'string', id + ': spritesheetPath');
    const atlas = path.join(dir, m.spritesheetPath);
    assert.ok(fs.existsSync(atlas), id + ': spritesheet file exists -> ' + m.spritesheetPath);
  }
});

test('pet.json frames (when present) has 9 entries', () => {
  for (const id of pets()) {
    const m = JSON.parse(fs.readFileSync(path.join(PETS_DIR, id, 'pet.json'), 'utf8'));
    if (Array.isArray(m.frames)) {
      assert.strictEqual(m.frames.length, 9, id + ': frames length 9');
      for (const n of m.frames) assert.ok(Number.isInteger(n) && n >= 1, id + ': frame count positive int');
    }
  }
});

test('tracks keys subset of known animations; jumping/failed fall back to idle when present', () => {
  for (const id of pets()) {
    const m = JSON.parse(fs.readFileSync(path.join(PETS_DIR, id, 'pet.json'), 'utf8'));
    if (!m.tracks) continue;
    for (const key of Object.keys(m.tracks)) { assert.ok(ROWS.includes(key), id + ': unknown track ' + key); }
    if (m.tracks.jumping && m.tracks.jumping.loop === false) assert.strictEqual(m.tracks.jumping.fallback, 'idle', id + ': jumping fallback idle');
    if (m.tracks.failed && m.tracks.failed.loop === false) assert.strictEqual(m.tracks.failed.fallback, 'idle', id + ': failed fallback idle');
  }
});
