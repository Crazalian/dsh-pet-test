#!/usr/bin/env bash
# Install all pets in ./pets into ~/.codex/pets (the dsh-pet custom pets dir).
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/pets"
DEST="${CODEX_HOME:-$HOME/.codex}/pets"

mkdir -p "$DEST"
count=0
for d in "$SRC"/*; do
  [ -d "$d" ] || continue
  id="$(basename "$d")"
  # only copy folders that look like pets (contain pet.json)
  [ -f "$d/pet.json" ] || continue
  rm -rf "$DEST/$id"
  cp -r "$d" "$DEST/$id"
  echo "installed $id"
  count=$((count + 1))
done
echo "Done: $count pet(s) installed to $DEST"
echo "Restart 'dsh web' for dsh-pet to pick them up."
