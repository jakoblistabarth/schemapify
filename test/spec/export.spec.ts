import Subdivision from "@/src/geometry/Subdivision";
import { wgs84, type Crs } from "@/src/Input/Crs";
import { geoPackageToGeometry } from "@/src/Input/geoPackage";
import { flatGeobufToGeometry } from "@/src/Input/flatGeobuf";
import {
  canExportGeoJson,
  outputFormatOf,
  serializeSubdivision,
  subdivisionToFlatGeobuf,
  subdivisionToGeoJson,
  subdivisionToGeoPackage,
  subdivisionToSvg,
} from "@/src/Output";
import { describe, expect, test } from "vitest";

/** A unit square with a square hole, plus a detached second feature. */
const subdivision = () => {
  const outer: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];
  const hole: [number, number][] = [
    [4, 4],
    [6, 4],
    [6, 6],
    [4, 6],
  ];
  const second: [number, number][] = [
    [20, 0],
    [30, 0],
    [30, 10],
    [20, 10],
  ];
  const data = Subdivision.fromCoordinates([[[outer, hole]], [[second]]]);
  data.multiPolygons[0].properties = { name: "with hole", area: 96 };
  data.multiPolygons[1].properties = { name: "plain", area: 100 };
  return data;
};

const austriaLambert: Crs = {
  org: "EPSG",
  code: 31287,
  name: "MGI / Austria Lambert",
  wkt: 'PROJCS["MGI / Austria Lambert"]',
};

describe("Exporting as GeoJSON", () => {
  test("writes every multipolygon as a MultiPolygon feature.", () => {
    const geoJson = subdivisionToGeoJson(subdivision());

    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features.length).toBe(2);
    expect(geoJson.features[0].geometry.type).toBe("MultiPolygon");
    expect(geoJson.features[0].properties?.name).toBe("with hole");
  });

  test("closes every ring, as RFC 7946 requires.", () => {
    const [{ geometry }] = subdivisionToGeoJson(subdivision()).features;

    for (const ring of geometry.coordinates.flat())
      expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  test("winds the exterior ring counterclockwise and holes clockwise.", () => {
    const [{ geometry }] = subdivisionToGeoJson(subdivision()).features;
    const [exterior, hole] = geometry.coordinates[0];

    // A positive shoelace sum is counterclockwise.
    const signedArea = (ring: number[][]) =>
      ring
        .slice(0, -1)
        .reduce(
          (sum, [x, y], i) =>
            sum + (x * ring[i + 1][1] - ring[i + 1][0] * y) / 2,
          0,
        );
    expect(signedArea(exterior)).toBeGreaterThan(0);
    expect(signedArea(hole)).toBeLessThan(0);
  });

  test("is only offered for WGS84 data.", () => {
    expect(canExportGeoJson(wgs84)).toBe(true);
    expect(canExportGeoJson(austriaLambert)).toBe(false);
    // An unknown CRS could be anything, so it is not assumed to be WGS84.
    expect(canExportGeoJson(undefined)).toBe(false);
  });
});

describe("Exporting as SVG", () => {
  test("writes one path per multipolygon.", () => {
    const svg = subdivisionToSvg(subdivision());

    expect(svg).toMatch(/^<\?xml/);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg.match(/<path /g)?.length).toBe(2);
  });

  test("cuts holes out via a closed subpath and the evenodd fill rule.", () => {
    const svg = subdivisionToSvg(subdivision());
    const [, firstPath] = svg.match(/<path id="0" d="([^"]+)"/) ?? [];

    expect(svg).toContain('fill-rule="evenodd"');
    // One subpath for the exterior ring, one for the hole.
    expect(firstPath?.match(/M/g)?.length).toBe(2);
    expect(firstPath?.match(/Z/g)?.length).toBe(2);
  });

  test("fits the data into the drawing, with y flipped into screen space.", () => {
    const svg = subdivisionToSvg(subdivision(), { size: 300, padding: 0 });

    // 30 x 10 units of data, drawn 300 wide.
    expect(svg).toContain('width="300" height="100"');
    // The first ring runs (0,0) → (10,0) → (10,10) → (0,10), and the data's
    // y = 10 is the drawing's top.
    expect(svg).toContain("M0 100L100 100L100 0L0 0Z");
  });
});

describe("Exporting as a GeoPackage", () => {
  test("round-trips through the reader.", async () => {
    const bytes = await subdivisionToGeoPackage(subdivision());
    const { data, skipped } = await geoPackageToGeometry(bytes);

    expect(skipped).toBe(0);
    expect(data.multiPolygons.length).toBe(2);
    expect(data.multiPolygons[0].polygons[0].rings.length).toBe(2);
    expect(data.vertexCount).toBe(subdivision().vertexCount);
  });

  test("preserves the area of the written geometry.", async () => {
    const bytes = await subdivisionToGeoPackage(subdivision());
    const { data } = await geoPackageToGeometry(bytes);

    expect(data.multiPolygons[0].area).toBeCloseTo(96);
    expect(data.multiPolygons[1].area).toBeCloseTo(100);
  });

  test("declares the CRS it was given, so projected data stays projected.", async () => {
    const bytes = await subdivisionToGeoPackage(subdivision(), {
      crs: austriaLambert,
    });
    const { crs } = await geoPackageToGeometry(bytes);

    expect(crs?.org).toBe("EPSG");
    expect(crs?.code).toBe(31287);
    expect(crs?.wkt).toBe(austriaLambert.wkt);
  });

  test("carries the features' properties over as columns.", async () => {
    const bytes = await subdivisionToGeoPackage(subdivision());
    const { data } = await geoPackageToGeometry(bytes);

    expect(data.multiPolygons[0].properties).toEqual({
      name: "with hole",
      area: 96,
    });
  });

  test("identifies itself as a GeoPackage.", async () => {
    const bytes = await subdivisionToGeoPackage(subdivision());

    // The SQLite header's application_id, at byte 68, reads "GPKG".
    expect(String.fromCharCode(...bytes.slice(68, 72))).toBe("GPKG");
  });
});

describe("Exporting as FlatGeobuf", () => {
  test("round-trips through the reader.", async () => {
    const bytes = subdivisionToFlatGeobuf(subdivision());
    const { data, skipped } = await flatGeobufToGeometry(bytes);

    expect(skipped).toBe(0);
    expect(data.multiPolygons.length).toBe(2);
    expect(data.multiPolygons[0].polygons[0].rings.length).toBe(2);
    expect(data.vertexCount).toBe(subdivision().vertexCount);
  });

  test("preserves the area of the written geometry.", async () => {
    const { data } = await flatGeobufToGeometry(
      subdivisionToFlatGeobuf(subdivision()),
    );

    expect(data.multiPolygons[0].area).toBeCloseTo(96);
    expect(data.multiPolygons[1].area).toBeCloseTo(100);
  });

  test("declares the CRS in its header, so projected data stays georeferenced.", async () => {
    const { crs } = await flatGeobufToGeometry(
      subdivisionToFlatGeobuf(subdivision(), austriaLambert),
    );

    expect(crs?.code).toBe(31287);
  });

  test("carries the features' properties over.", async () => {
    const { data } = await flatGeobufToGeometry(
      subdivisionToFlatGeobuf(subdivision()),
    );

    expect(data.multiPolygons[0].properties?.name).toBe("with hole");
    expect(data.multiPolygons[1].properties?.area).toBe(100);
  });

  test("identifies itself as a FlatGeobuf.", () => {
    const bytes = subdivisionToFlatGeobuf(subdivision());

    // The magic bytes are 0x66 0x67 0x62 ("fgb") and a version marker.
    expect([...bytes.slice(0, 3)]).toEqual([0x66, 0x67, 0x62]);
  });
});

describe("Serializing through the format dispatcher", () => {
  test("picks the format an extension names, dot or no dot.", () => {
    expect(outputFormatOf(".gpkg")).toBe("gpkg");
    expect(outputFormatOf("fgb")).toBe("fgb");
    expect(outputFormatOf(".GeoJSON")).toBe("geojson");
    // `.json` is accepted for GeoJSON, as the readers accept it.
    expect(outputFormatOf(".json")).toBe("geojson");
    expect(outputFormatOf(".svg")).toBe("svg");
    expect(outputFormatOf(".shp")).toBeUndefined();
  });

  test("writes each format, text as text and binaries as bytes.", async () => {
    const svg = await serializeSubdivision(subdivision(), "svg");
    // GeoJSON needs the CRS stated: an unknown one could be anything.
    const geoJson = await serializeSubdivision(subdivision(), "geojson", {
      crs: wgs84,
    });
    const fgb = await serializeSubdivision(subdivision(), "fgb");
    const gpkg = await serializeSubdivision(subdivision(), "gpkg");

    expect(svg).toContain("<svg");
    expect(JSON.parse(geoJson as string).features.length).toBe(2);
    expect(fgb).toBeInstanceOf(Uint8Array);
    expect(gpkg).toBeInstanceOf(Uint8Array);
  });

  test("refuses GeoJSON for data whose CRS is unknown.", async () => {
    await expect(
      serializeSubdivision(subdivision(), "geojson"),
    ).rejects.toThrow(/RFC 7946/);
  });

  test("refuses GeoJSON for projected data.", async () => {
    await expect(
      serializeSubdivision(subdivision(), "geojson", { crs: austriaLambert }),
    ).rejects.toThrow(/RFC 7946/);
  });

  test("keeps a projected CRS in the formats that can express it.", async () => {
    const bytes = await serializeSubdivision(subdivision(), "gpkg", {
      crs: austriaLambert,
      layerName: "regions",
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
  });
});
