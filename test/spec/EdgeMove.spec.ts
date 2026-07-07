import CollinearPointProcessor from "@/src/c-oriented-schematization/CollinearPointProcessor";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import { isAlignedToC } from "@/src/c-oriented-schematization/HalfEdgeUtils";
import Dcel from "@/src/Dcel/Dcel";
import { DECIMAL_SCALE, EPSILON } from "@/src/geometry/constants";
import Input from "@/src/Input";
import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, test } from "vitest";

describe("createConfigurations()", function () {
  test("adds configuration to all edges which are possible candidates for edge moves (which endpoints are of degree 3 or less).", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/aligned-deviating.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    const dcelConstrained = schematization.constrainAngles(dcel);

    const verticesDegree4 = dcelConstrained
      .getVertices()
      .filter((v) => v.degree === 4);

    const edgesDegree4 = dcelConstrained
      .getHalfEdges()
      .filter((e) => e.endpoints?.some((v) => v.degree > 3));

    const configurations = new ConfigurationGenerator().run(dcelConstrained);
    const configurationCount = configurations.size;

    expect(verticesDegree4.length).toBe(1);
    expect(edgesDegree4.length).toBe(8);
    expect(configurationCount).toBe(
      dcelConstrained.getHalfEdges().length - edgesDegree4.length,
    );
  });
});

describe("doEdgeMove()", function () {
  // TO-DO: fix edge move first
  test.fails("(recursive) on respective minimal configurations returns the expected contraction pair for the second, third, and fourth edge move.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);
    const contractionEdges: string[] = [];

    for (let index = 0; index < 10; index++) {
      const pair = ffb.getMinimalConfigurationPair(configurations);
      const contractionEdge = pair?.contraction.configuration.innerEdge;
      if (contractionEdge) contractionEdges.push(contractionEdge?.uuid);
      // TO-DO: fix this
      // pair?.doEdgeMove(dcel, configurations, ffb.configurations);
    }
    expect(contractionEdges).toEqual([
      "9.5|7->9.5|8",
      "10|1->10|7",
      "10|8->10|10",
    ]);
  });

  test("for the test case 'smallest-contraction'", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel.clone());
    const configurations = new ConfigurationGenerator().run(dcel.clone());
    const originalArea = dcel.getArea();
    const { dcel: newDcel } = new EdgeMoveProcessor(ffb, configurations).run(
      dcel.clone(),
    );
    const newArea = newDcel.getArea();

    expect(dcel.getBoundedFaces()[0].getEdges()[2].tail.xy).toEqual([11, 1]);
    expect(dcel.getBoundedFaces()[0].getEdges()[2].head?.xy).toEqual([10, 1]);
    expect(dcel.getBoundedFaces()[0].getEdges()[3].tail.xy).toEqual([10, 1]);
    expect(dcel.getBoundedFaces()[0].getEdges()[3].head?.xy).toEqual([10, 7]);
    expect(dcel.getBoundedFaces()[0].getEdges()[4].tail.xy).toEqual([10, 7]);
    expect(dcel.getBoundedFaces()[0].getEdges()[4].head?.xy).toEqual([9.5, 7]);
    expect(dcel.getBoundedFaces()[0].getEdges()[5].tail.xy).toEqual([9.5, 7]);
    expect(dcel.getBoundedFaces()[0].getEdges()[5].head?.xy).toEqual([9.5, 8]);

    expect(newDcel.getBoundedFaces()[0].getEdges()[2].tail.xy).toEqual([11, 1]);
    expect(newDcel.getBoundedFaces()[0].getEdges()[2].head?.xy).toEqual([
      10, 1,
    ]);
    expect(newDcel.getBoundedFaces()[0].getEdges()[3].tail.xy).toEqual([10, 1]);
    expect(newDcel.getBoundedFaces()[0].getEdges()[3].head?.xy).toEqual([
      10, 7,
    ]);
    expect(newDcel.getBoundedFaces()[0].getEdges()[4].tail.xy).toEqual([10, 7]);
    const head4 = newDcel.getBoundedFaces()[0].getEdges()[4].head;
    expect(head4?.x).toBeCloseTo(9 + 5 / 6, DECIMAL_SCALE);
    expect(head4?.y).toBe(7);
    const head5 = newDcel.getBoundedFaces()[0].getEdges()[5].head;
    expect(head5?.x).toBeCloseTo(9 + 5 / 6, DECIMAL_SCALE);
    expect(head5?.y).toBe(10);
    expect(originalArea).toBeCloseTo(newArea, DECIMAL_SCALE);
  });

  test("for the test case 'smallest-contraction-2", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const originalArea = dcel.getArea();
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);
    const { dcel: newDcel } = new EdgeMoveProcessor(ffb, configurations).run(
      dcel,
    );
    const newArea = newDcel.getArea();

    expect(newDcel.halfEdges.size / 2).toEqual(10);
    expect(newDcel.vertices.size).toEqual(10);
    expect(originalArea).toBeCloseTo(newArea, DECIMAL_SCALE);
  });

  test("for the test case 'contractions-equal'", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/contractions-equal.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const originalArea = dcel.getArea();
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);
    const pair = ffb
      .getBoundaries()[0]
      .getMinimalConfigurationPair(configurations);
    const originalContractionArea = pair?.contraction.area;
    const { dcel: newDcel } = new EdgeMoveProcessor(ffb, configurations).run(
      dcel,
    );
    const newArea = newDcel.getArea();

    const edges = newDcel
      .getBoundedFaces()[0]
      .getEdges()
      .map((e) => ({ tail: e.tail.xy, head: e.head?.xy }));

    expect(edges[0].tail).toEqual([0, 0]);
    expect(edges[0].head).toEqual([4, 0]);
    expect(edges[1].tail).toEqual([4, 0]);
    expect(edges[1].head).toEqual([4, 2]);
    expect(edges[2].tail).toEqual([4, 2]);
    expect(edges[2].head).toEqual([2.5, 2]);
    expect(edges[3].tail).toEqual([2.5, 2]);
    expect(edges[3].head).toEqual([2.5, 4]);
    expect(edges[4].tail).toEqual([2.5, 4]);
    expect(edges[4].head).toEqual([0, 4]);
    expect(edges[5].tail).toEqual([0, 4]);
    expect(edges[5].head).toEqual([0, 0]);
    expect(originalContractionArea).toEqual(1);
    expect(originalArea).toEqual(newArea);
  });
});

describe("Triangle.json edge move verification after one edge move", function () {
  let dcel: Dcel;
  let schematization: CSchematization;

  beforeAll(() => {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );

    dcel = Dcel.fromGeoJSON(json);
    schematization = new CSchematization();

    dcel = schematization.preProcess(dcel);
    dcel = schematization.constrainAngles(dcel);
    const collinearProcessor = new CollinearPointProcessor();
    dcel = collinearProcessor.run(dcel);

    let configurations = new ConfigurationGenerator().run(dcel);
    let ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

    // Execute first edge move
    const pair = ffbList.getMinimalConfigurationPair(configurations);
    expect(pair).toBeDefined();

    if (pair) {
      const processor = new EdgeMoveProcessor(ffbList, configurations);
      const result = processor.run(dcel);
      dcel = result.dcel;
      configurations = result.configurations;
      ffbList = result.faceFaceBoundaryList;
    }
  });

  test("Edge move should not create degree-4 vertices for simple polygon boundary", function () {
    // Check for degree-4+ vertices
    const highDegreeVertices = dcel.getVertices().filter((v) => v.degree > 2);

    // All vertices in simple polygon boundary should have degree 2
    expect(highDegreeVertices).toHaveLength(0);
  });

  test("Edge move should not introduce new orientations (angles)", function () {
    // Check that new orientations aren't introduced
    const face = dcel.getBoundedFaces()[0];
    if (face) {
      const edges = face.getEdges();
      const unalignedEdges = edges.filter(
        (e) => !isAlignedToC(e, schematization.style.c),
      );

      expect(unalignedEdges).toHaveLength(0);
    }
  });
});

describe("Blocked contractions are correctly identified and prevented from edge moves", function () {
  test("unaligned-deviating-2: cross-face vertex blocking prevents invalid edge moves", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/unaligned-deviating-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();

    const originalArea = dcel.getArea();

    // Manually replicate simplify() but stop after 3 iterations
    const preprocessed = schematization.preProcess(dcel);
    const constrained = schematization.constrainAngles(preprocessed);
    let result = new CollinearPointProcessor().run(constrained);

    // Run exactly 3 iterations of edge moves
    let iteration = 0;
    do {
      iteration++;
      const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(
        result,
      );
      const configurations = new ConfigurationGenerator().run(result);
      const { dcel: newDcel } = new EdgeMoveProcessor(
        faceFaceBoundaryList,
        configurations,
      ).run(result);
      result = newDcel;
    } while (iteration < 3);

    // Check: Area preservation
    const finalArea = result.getArea();
    const areaDifference = Math.abs(originalArea - finalArea);
    expect(areaDifference).toBeLessThan(EPSILON);

    // Check: No degenerate edges
    const degenerateEdges = result.getHalfEdges().filter((e) => {
      const head = e.head;
      return head && e.tail.x === head.x && e.tail.y === head.y;
    });
    expect(degenerateEdges).toHaveLength(0);

    // Check: Problematic edges at y ≈ 0.6̄ (2/3) should not overlap with other edges from same polygon
    // The problematic edges are: (-2, 0.6̄) → (-3.5, 0.6̄) and (-2.16̄, 0.6̄) → (-1.3̄, 0.6̄)
    const TWO_THIRDS = 2 / 3;
    const allEdges = result.getHalfEdges();

    const problematicEdges = allEdges.filter((edge) => {
      if (!edge.head) return false;
      // Look for horizontal edges near y = 2/3
      const isHorizontal = Math.abs(edge.tail.y - edge.head.y) < EPSILON;
      const isAtTargetY = Math.abs(edge.tail.y - TWO_THIRDS) < EPSILON;
      return isHorizontal && isAtTargetY;
    });

    // For each problematic edge, check it doesn't overlap with other edges from same face
    for (const problematicEdge of problematicEdges) {
      const face = problematicEdge.face;
      if (!face) continue;

      const faceEdges = face.getEdges();
      for (const otherEdge of faceEdges) {
        if (!otherEdge.head) continue;
        if (otherEdge === problematicEdge) continue;

        // Skip if they share a vertex
        const sharesVertex = [problematicEdge.tail, problematicEdge.head].some(
          (v) => v === otherEdge.tail || v === otherEdge.head,
        );
        if (sharesVertex) continue;
        if (!problematicEdge.head) continue;

        // Check if edges are collinear (on same infinite line)
        const dx1 = problematicEdge.head.x - problematicEdge.tail.x;
        const dy1 = problematicEdge.head.y - problematicEdge.tail.y;
        const dx2 = otherEdge.head.x - otherEdge.tail.x;
        const dy2 = otherEdge.head.y - otherEdge.tail.y;

        const crossProduct = dx1 * dy2 - dy1 * dx2;
        const isParallel = Math.abs(crossProduct) < EPSILON;

        if (isParallel) {
          const dx = otherEdge.tail.x - problematicEdge.tail.x;
          const dy = otherEdge.tail.y - problematicEdge.tail.y;
          const crossToOther = dx1 * dy - dy1 * dx;

          if (Math.abs(crossToOther) < EPSILON) {
            expect.fail(
              `Problematic edge overlap at y ≈ 0.6̄: (${problematicEdge.tail.x.toFixed(4)}, ${problematicEdge.tail.y.toFixed(4)}) -> ` +
                `(${problematicEdge.head.x.toFixed(4)}, ${problematicEdge.head.y.toFixed(4)}) overlaps with ` +
                `(${otherEdge.tail.x.toFixed(4)}, ${otherEdge.tail.y.toFixed(4)}) -> ` +
                `(${otherEdge.head.x.toFixed(4)}, ${otherEdge.head.y.toFixed(4)})`,
            );
          }
        }
      }
    }

    // Verify no new orientations were introduced
    const validAngles = schematization.style.c.angles;
    const faces = result.getBoundedFaces();

    for (const face of faces) {
      const edges = face.getEdges();
      for (const edge of edges) {
        const angle = edge.getAngle();
        if (angle !== undefined) {
          const isValid = validAngles.some(
            (v) => Math.abs(v - angle) <= EPSILON,
          );
          expect(isValid).toBe(true);
        }
      }
    }
  });
});

describe("Thoroughly check edge DCEL after edge move", function () {
  test("After edge move, check that all half-edge pointers (twin, next, prev) are consistent and that the DCEL structure is valid.", function () {
    const input = Input.fromCoordinates(
      "Simplest edge move",
      JSON.parse(
        fs.readFileSync(
          path.resolve("test/data/shapes/simplest-edge-move.subdivision.json"),
          "utf8",
        ),
      ),
    );
    const dcel = input.getDcel();

    const clone = dcel.clone();
    const ffbList = new FaceFaceBoundaryListGenerator().run(clone);
    const configurations = new ConfigurationGenerator().run(clone);
    const { dcel: simplified } = new EdgeMoveProcessor(
      ffbList,
      configurations,
    ).run(clone);

    expect(dcel.vertices.size).toBe(6);
    expect(dcel.halfEdges.size).toBe(12);
    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(6);
    expect(simplified.vertices.size).toBe(4);
    expect(simplified.getVertices().length).toBe(4);
    expect(simplified.halfEdges.size).toBeLessThan(dcel.halfEdges.size);
    expect(simplified.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(() => simplified.getBoundedFaces()[0].edge.getCycle()).not.toThrow();
    expect(() =>
      simplified.getBoundedFaces()[0].edge.getCycle(false),
    ).not.toThrow();
  });
});

describe("At least 6 iterations shall be possible for diamond shape", function () {
  test("Diamond shape should allow at least 6 edge moves before stopping.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/diamond.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();

    expect(() => schematization.run(dcel, 6)).not.toThrow();
  });
});
