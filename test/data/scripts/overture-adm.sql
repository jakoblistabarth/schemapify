-- Extract boundaries from Overture Maps.
--
-- Produces territorial boundaries, excluding the maritime
-- (territorial water) areas that Overture publishes alongside them.
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

-- List of European ISO 3166-1 alpha-2 codes
SET VARIABLE eu_iso = [
  'AT',
  'BE',
  'CH',
  'CZ',
  'DE',
  'DK',
  'FR',
  'HU',
  'IT',
  'LI',
  'MT',
  'NL',
  'PL',
  'SI',
  'SK',
];

CREATE OR REPLACE TABLE boundaries AS (
  SELECT
    id,
    names.primary AS name,
    subtype,
    admin_level,
    region AS iso_code,
    class,
    country,
    geometry
  FROM
    read_parquet(
      's3://overturemaps-us-west-2/release/2026-08-19.0/theme=divisions/type=division_area/*.parquet',
      hive_partitioning = true
    )
  WHERE
    subtype IN ('country', 'region')
    AND country IN (
      SELECT
        UNNEST(getvariable ('eu_iso'))
    )
);

COPY (
  SELECT
    * REPLACE(
      ST_Transform (
        geometry,
        'EPSG:4326',
        'EPSG:3035',
        always_xy := true
      ) AS geometry
    )
  FROM
    boundaries
  WHERE
    country = 'DE'
    AND subtype = 'region'
    AND class = 'land'
  ORDER BY
    name
) TO 'test/data/generated/DEU_adm1.gpkg'
WITH
  (
    FORMAT gdal,
    DRIVER 'GPKG',
    -- Must match the ST_Transform target above.
    SRS 'EPSG:3035'
  );

COPY (
  SELECT
    * REPLACE(
      ST_Transform (
        geometry,
        'EPSG:4326',
        'EPSG:3035',
        always_xy := true
      ) AS geometry
    )
  FROM
    boundaries
  WHERE
    country = 'AT'
    AND subtype = 'region'
    AND class = 'land'
  ORDER BY
    name
) TO 'test/data/generated/AT_adm1.gpkg'
WITH
  (
    FORMAT gdal,
    DRIVER 'GPKG',
    -- Must match the ST_Transform target above.
    SRS 'EPSG:3035'
  );

COPY (
  SELECT
    * REPLACE(
      ST_Transform (
        geometry,
        'EPSG:4326',
        'EPSG:3035',
        always_xy := true
      ) AS geometry
    )
  FROM
    boundaries
  WHERE
    country = 'IT'
    AND subtype = 'region'
    AND class = 'land'
  ORDER BY
    name
) TO 'test/data/generated/IT_adm1.gpkg'
WITH
  (
    FORMAT gdal,
    DRIVER 'GPKG',
    -- Must match the ST_Transform target above.
    SRS 'EPSG:3035'
  );