#!/usr/bin/env node
/* Validate every pet in ./pets against the dsh-pet registry contract using the
 * real registry loader, when available; otherwise do a structural check. */
const fs = require('fs');
const path = require('path');

const PET_ID = /^[a-z0-9][a-z0-9-]*$/;
const PET_ROW_ORDER = ['idle','running-right','running-left','waving','jumping','failed','waiting','running','review'];
const DEFAULT_FRAMES = [6, 8, 8, 4, 5, 8, 6, 6, 6];

// Resolve the installed dsh-pet registry, if present (best-effort).
function tryRealRegistry() {
  const roots = [
    path.join(process.env.USERPROFILE || '', '.dsh', 'profiles', 'web', 'node_modules', '@linxin666', 'dsh-pet', 'lib', 'types', 'registry.js'),
    path.join(process.env.USERPROFILE || '', '.dsh', 'profiles', 'node_modules', '@linxin666', 'dsh-pet', 'lib', 'types', 'registry.js'),
  ];
  for (const r of roots) { if (fs.existsSync(r)) return require(r); }
  return null;
}

/** Structural check independent of the plugin install. */
function checkManifest(dir, id) {
  const problems = [];
  const pp = path.join(dir, 'pet.json');
  if (!fs.existsSync(pp)) return { problems: ['missing pet.json'] };
  let m;
  try { m = JSON.parse(fs.readFileSync(pp, 'utf8')); }
  catch (e) { return { problems: ['pet.json parse error: ' + e.message] }; }
  if (m.id !== id) problems.push('id field mismatch: expected ' + id + ' got ' + JSON.stringify(m.id));
  if (!PET_ID.test(m.id || '')) problems.push('id not a valid kebab id');
  if (typeof m.displayName !== 'string' || !m.displayName.trim()) problems.push('missing displayName');
  if (typeof m.spritesheetPath !== 'string' || !m.spritesheetPath) problems.push('missing spritesheetPath');
  const atlas = path.join(dir, m.spritesheetPath || '');
  if (!fs.existsSync(atlas)) problems.push('spritesheet missing: ' + m.spritesheetPath);
  if (Array.isArray(m.frames)) {
    if (m.frames.length !== 9) problems.push('frames must have 9 entries');
    m.frames.forEach((n, i) => { if (!Number.isInteger(n) || n < 1) problems.push('frames[' + i + '] invalid'); });
  }
  return { problems, manifest: m };
}

function main() {
  const petsDir = path.join(__dirname, '..', 'pets');
  if (!fs.existsSync(petsDir)) { console.error('no pets/ dir'); process.exit(1); }
  const ids = fs.readdirSync(petsDir).filter((n) => /^[a-z0-9-]+$/.test(n));
  let fail = false;
  for (const id of ids) {
    const dir = path.join(petsDir, id);
    if (!fs.statSync(dir).isDirectory()) continue;
    const { problems } = checkManifest(dir, id);
    console.log((problems.length ? 'FAIL' : 'PASS') + '  ' + id + (problems.length ? ' — ' + problems.join('; ') : ''));
    if (problems.length) fail = true;
  }
  // Optional: real registry deep load (only if the plugin is installed locally).
  const reg = tryRealRegistry();
  if (reg) {
    const registry = reg.loadPetRegistry({
      packageRoot: path.resolve(__dirname, '..'),
      petsDir,
    });
    if (registry.warnings.length) { console.log('registry warnings:'); registry.warnings.forEach((w) => console.log('  - ' + w)); fail = true; }
    else console.log('registry: loaded ' + registry.entries.length + ' pets cleanly (0 warnings)');
  } else {
    console.log('registry: real dsh-pet not installed locally — structural check only');
  }
  process.exit(fail ? 1 : 0);
}
main();
