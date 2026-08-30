#!/usr/bin/env bash
# Regenerate test fixtures from remote data sources.
set -e

cd "$(dirname "$0")/../../.."
mkdir -p test/data/generated

for file in test/data/scripts/*.sql; do
  echo "→ $file"
  duckdb -f "$file"
done

# Create simplified (topology aware) variants
# with mapshaper to test without the full-resolution cost
for percent in 0.01 .05 .1; do
  out="test/data/generated/DEU_adm1-s${percent}.gpkg"
  echo "→ $out"
  pnpm exec mapshaper test/data/generated/DEU_adm1.gpkg \
    -simplify "${percent}%" keep-shapes \
    -clean \
    -o "$out"
done
