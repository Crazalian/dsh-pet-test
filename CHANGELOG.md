# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] — 2026-08-19

Initial open-source release.

### Added
- 5 pets under `pets/`:
  - `firefly` (流萤) — HSR Firefly fan pet
  - `firefly-bride` (流萤花嫁) — Firefly wedding variant
  - `liuying` (流萤 chibi) — AI chibi Firefly
  - `paimon` (派蒙) — generated from a transparent portrait
  - `yelan` (夜兰) — generated from a transparent portrait
- Per-pet `previews/` (idle + overview) banners shown in the README.
- `route-b.js` — generator that builds an 8×9 spritesheet + `pet.json` from a single transparent portrait.
- `docs/PET-CONTRACT.md` — the full manifest / atlas contract.
- `scripts/validate-pets.js` — validate pets against the dsh-pet registry.
- `scripts/install-pets.sh` + `scripts/install-pets.ps1` — one-click install into `~/.codex/pets`.
- `test/contract.test.js` — contract unit tests (Node built-in test runner).
- GitHub Actions: `ci.yml` (validate + test) and `release.yml` (auto-release on `v*` tags).

### Notes
- Atlas format follows the **Codex / hatch-pet** contract: `columns × 9 rows` of 192×208 cells; row order `0 idle → 8 review`.
- miHoYo / HoYoverse fan-work disclaimer: non-commercial personal use only.
