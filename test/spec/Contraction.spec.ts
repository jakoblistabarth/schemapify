import fs from "fs";
import path from "path";
import Point from "@/src/geometry/Point";
import Configuration from "@/src/c-oriented-schematization/Configuration";
import Contraction, {
  ContractionType,
} from "@/src/c-oriented-schematization/Contraction";
import Dcel from "@/src/DCEL/Dcel";
import { configurationCases, createConfigurationSetup } from "./test-setup";

describe("isConflicting() returns", function () {
  let dcel: Dcel;
  beforeEach(function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/edge-move-test.json"),
        "utf8",
      ),
    );
    dcel = Dcel.fromGeoJSON(json);
  });

  it("false for 2 non-conflicting contractions.", function () {
    const edgeA = dcel.getHalfEdges()[2];
    const cA = (edgeA.configuration = new Configuration(edgeA));

    const edgeB = dcel.getHalfEdges()[6];
    const cB = (edgeB.configuration = new Configuration(edgeB));

    expect(
      cA[ContractionType.N]?.isConflicting(
        cB[ContractionType.P] as Contraction,
      ),
    ).toBe(false);
  });

  it("true for 2 conflicting contractions, due to 2 overlapping Edges.", function () {
    const edgeA = dcel.getHalfEdges()[0];
    const cA = (edgeA.configuration = new Configuration(edgeA));

    const edgeB = dcel.getHalfEdges()[2];
    const cB = (edgeB.configuration = new Configuration(edgeB));

    expect(
      cA[ContractionType.N]?.isConflicting(
        cB[ContractionType.N] as Contraction,
      ),
    ).toBe(true);
  });

  xit("true for 2 conflicting contractions, due to wrong inflectionType of the overlapping Edge.", function () {
    const edgeA = dcel.getHalfEdges()[0];
    const cA = (edgeA.configuration = new Configuration(edgeA));

    const edgeB = dcel.getHalfEdges()[4];
    const cB = (edgeB.configuration = new Configuration(edgeB));

    const edgeC = dcel.getHalfEdges()[8];
    const cC = (edgeC.configuration = new Configuration(edgeC));

    expect(
      cA[ContractionType.N]?.isConflicting(
        cB[ContractionType.N] as Contraction,
      ),
    ).toBe(true);
    expect(
      cA[ContractionType.N]?.isConflicting(
        cB[ContractionType.P] as Contraction,
      ),
    ).toBe(true);
    expect(
      cA[ContractionType.N]?.isConflicting(
        cC[ContractionType.N] as Contraction,
      ),
    ).toBe(true);
  });
});

describe("getCompensationShift() returns", function () {
  it("for a rectangular compensation area.", function () {
    const s = configurationCases.negConvexParallelTracks;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]?.getCompensationHeight(2)).toBe(0.5);
    expect(c[ContractionType.N]?.getCompensationHeight(4)).toBe(1);
    expect(c[ContractionType.N]?.getCompensationHeight(6)).toBe(1.5);
  });

  it("for an inwards trapezoid compensation area.", function () {
    const s = configurationCases.posReflex;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.P]?.getCompensationHeight(5)).toBe(1);
  });

  it("for an outwards trapezoid compensation area.", function () {
    const s = configurationCases.negConvex;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]?.getCompensationHeight(5)).toBe(1);
    expect(c[ContractionType.N]?.getCompensationHeight(8.25)).toBe(1.5);
  });

  it("for a inwards trapezoid compensation area.", function () {
    const s = configurationCases.posReflex;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.P]?.getCompensationHeight(5)).toBe(1);
  });

  it("for a trapezoid compensation area with 2 90deg angles.", function () {
    const s = createConfigurationSetup(
      new Point(-2, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(4, 0),
      [new Point(4, 6), new Point(-4, 6)],
    );
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.P]?.getCompensationHeight(4.5)).toBe(1);
  });

  it("for a trapezoid compensation area with 2 90deg angles.", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(2, 0),
      [new Point(4, 6), new Point(-4, 4)],
    );
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.P]?.getCompensationHeight(4.5)).toBe(1);
  });
});
