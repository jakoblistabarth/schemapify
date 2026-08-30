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

# The GeoPackage and FlatGeobuf fixtures are committed, so they are built from
# the GeoJSON next to them rather than from a remote source.
# GeoJSON is WGS84 by definition, so the unprojected variants need no -a_srs.
mkdir -p test/data/gpkg test/data/fgb

fixture() {
  local out="$1"
  local layer="$2"
  local source="$3"
  local format
  shift 3
  # GeoPackage records a last_change timestamp; pin it so reruns stay
  # byte-identical instead of churning the diff.
  case "$out" in
    *.gpkg) format=GPKG ;;
    *.fgb) format=FlatGeobuf ;;
  esac
  echo "→ $out"
  ogr2ogr \
    --config OGR_CURRENT_DATE "2026-01-01T00:00:00.000Z" \
    -f "$format" -nln "$layer" "$@" \
    "$out" "$source"
}

for format in gpkg fgb; do
  fixture "test/data/$format/square.$format" square \
    test/data/shapes/square.json

  fixture "test/data/$format/AUT_adm1-simple.$format" AUT_adm1-simple \
    test/data/geodata/AUT_adm1-simple.json

  # Austria Lambert, so the readers are exercised on a projected CRS.
  # The two formats are compared vertex-for-vertex, so they must stay in sync.
  fixture "test/data/$format/AUT_adm1-31287.$format" AUT_adm1-simple \
    test/data/geodata/AUT_adm1-simple.json \
    -s_srs EPSG:4326 -t_srs EPSG:31287
done

# Z ordinates are expected to be dropped on read, so keep a 3D counterpart.
fixture test/data/fgb/square-3d.fgb square \
  test/data/shapes/square.json \
  -dim XYZ
