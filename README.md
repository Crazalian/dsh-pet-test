# dsh-pet — Genshin & Firefly pets for DeepSeek Harness

A collection of pets for the **dsh-pet** plugin in the DeepSeek Harness Web GUI, plus the generator used to create the Paimon and Yelan spritesheets from single transparent portraits.

## What you get

| Pet | id | Preview | Source | Notes |
|---|---|---|---|---|
| 流萤 | `firefly` | ![preview](pets/firefly/previews/overview.png) | [RagnarokChan/firefly-codex-pets](https://github.com/RagnarokChan/firefly-codex-pets) | HSR Firefly fan pet (Codex contract) |
| 流萤花嫁 | `firefly-bride` | ![preview](pets/firefly-bride/previews/overview.png) | [RagnarokChan/firefly-codex-pets](https://github.com/RagnarokChan/firefly-codex-pets) | Firefly wedding variant |
| 流萤 chibi | `liuying` | ![preview](pets/liuying/previews/overview.png) | [Ruiwang66/codexpetFirefly](https://github.com/Ruiwang66/codexpetFirefly) | AI chibi Firefly |
| 派蒙 | `paimon` | ![preview](pets/paimon/previews/overview.png) | [awesome-codex-pet](https://github.com/legeling/awesome-codex-pet) (`paimon--lingxiaotian`) | Multi-state community Paimon (real per-state poses) |
| 夜兰 | `yelan` | ![preview](pets/yelan/previews/overview.png) | Programmatic (this repo) | Genshin Yelan — static single-pose portrait (no animation) |
| 牧濑红莉栖 | `kurisu` | ![preview](pets/kurisu/previews/overview.png) | [awesome-codex-pet](https://github.com/legeling/awesome-codex-pet) (`makisekurisu--m1gr4ine`) | Steins;Gate Makise Kurisu — multi-state chibi (real per-state poses) |

## Install

dsh-pet scans **`~/.codex/pets/<petId>/`** automatically at host startup.

**One-click (recommended):**

```bash
# macOS / Linux
./scripts/install-pets.sh
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File scripts/install-pets.ps1
```

**Manual — copy each pet folder (the ones under `pets/`) into `~/.codex/pets/`:**

```sh
mkdir -p ~/.codex/pets
cp -r pets/firefly pets/firefly-bride pets/liuying pets/paimon pets/yelan ~/.codex/pets/
```

```powershell
$pets = "$env:USERPROFILE\.codex\pets"
Copy-Item pets\firefly, pets\firefly-bride, pets\liuying, pets\paimon, pets\yelan -Destination $pets -Recurse
```

Then **restart `dsh web`** and open **Settings → Pet** to pick your pet.

## Docs & tooling

- [docs/PET-CONTRACT.md](docs/PET-CONTRACT.md) — the full manifest/atlas contract (field table, row order, defaults).
- [`scripts/validate-pets.js`](scripts/validate-pets.js) — validate every pet against the dsh-pet registry (CI runs it).
- [`test/contract.test.js`](test/contract.test.js) — contract unit tests (`node --test test/`).
- [`route-b.js`](route-b.js) — generate a pet from any transparent portrait.
- CI: GitHub Actions validates pets and runs tests on every push/PR — see [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Pet manifest contract (Codex / hatch-pet)

Each pet is one folder containing `pet.json` + `spritesheet.webp`:

- Atlas is **columns × 9 rows** of `cell`-sized cells (default 192×208).
- Row order is fixed: `0 idle, 1 running-right, 2 running-left, 3 waving, 4 jumping, 5 failed, 6 waiting, 7 running, 8 review`.
- `pet.json` fields:
  - `id` — lowercase kebab unique id
  - `displayName`, `description`
  - `spritesheetPath` — atlas path relative to the folder
  - `frames` — per-row used-column counts (9 entries)
  - `tracks` — per-track durations / `loop` / `fallback`

Example: [`pets/paimon/pet.json`](pets/paimon/pet.json)

## Generator (make a pet from any transparent portrait)

[`route-b.js`](route-b.js) builds an 8×9 atlas from a single transparent PNG, producing 9 programmatic states (idle float, left/right run, wave, jump, failed, wait, run, review) plus `pet.json`.

```bash
node route-b.js   # needs: node + sharp
```

Edit the `jobs` array at the bottom (portrait path / id / displayName) and run. Output lands in `route-b/<id>/`.

## Legal / source attribution

- **流萤** pets are fan-made, AI-generated chibi art (their upstream repos).
- **派蒙 / 夜兰** portraits come from [Project Amber / gi.yatta.moe](https://gi.yatta.moe) (transparent character renders).
- miHoYo/HoYoverse fan-creation guidelines permit non-commercial fan works. Personal/local use is low risk; do **not** redistribute these for commercial purposes.

## License

BSD-3-Clause — see [LICENSE](LICENSE).
