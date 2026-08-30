#!/usr/bin/env bash
# Regenerate test fixtures from remote data sources.
set -e

cd "$(dirname "$0")/../../.."
mkdir -p test/data/generated

for file in test/data/scripts/*.sql; do
  echo "→ $file"
  duckdb -f "$file"
done
