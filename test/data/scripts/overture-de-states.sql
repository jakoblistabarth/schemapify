-- Extract Germany's federal states (Bundesländer) from Overture Maps.
--
-- Produces the 16 land areas of the German states, excluding the maritime
-- (territorial water) areas that Overture publishes alongside them.
--
-- Usage, from the repository root:
--   duckdb -f test/data/scripts/overture-de-states.sql
--
-- To list available releases:
--   curl -s "https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/?list-type=2&prefix=release/&delimiter=/" \
--     | grep -o '<Prefix>release/[^<]*</Prefix>'
INSTALL httpfs;

LOAD httpfs;

INSTALL spatial;

LOAD spatial;

SET
  s3_region = 'us-west-2';

COPY (
  SELECT
    id,
    names.primary AS name,
    region AS iso_code,
    admin_level,
    -- LAEA Europe is equal-area, matching this project's area preservation.
    -- EPSG:25832 (UTM 32N) is the German standard, but conformal.
    ST_Transform (
      geometry,
      'EPSG:4326',
      'EPSG:3035',
      always_xy := true
    ) AS geometry
  FROM
    read_parquet(
      's3://overturemaps-us-west-2/release/2026-08-19.0/theme=divisions/type=division_area/*.parquet',
      hive_partitioning = true
    )
  WHERE
    -- Restricts the scan to row groups overlapping Germany, using the bbox
    -- column's statistics. Purely a speed-up;
    bbox.xmin BETWEEN 5 AND 16
    AND bbox.ymin BETWEEN 46 AND 56
    AND country = 'DE'
    AND subtype = 'region'
    AND class = 'land'
  ORDER BY
    name
) TO 'test/data/gpkg/DEU_adm1.gpkg'
WITH
  (
    FORMAT gdal,
    DRIVER 'GPKG',
    -- Must match the ST_Transform target above.
    SRS 'EPSG:3035'
  );
