import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import Point from "@/src/geometry/Point";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import { createEdgeVertexSetup, TestSetup, getTestFiles } from "./test-setup";
import Line from "@/src/geometry/Line";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";

describe("getLength()", function () {
  it("returns the correct length for a single halfEdge", function () {
    const a = new Vertex(0, 0, new Dcel());
    const b = new Vertex(2, 0, new Dcel());
    const edge = new HalfEdge(a, new Dcel());
    edge.twin = new HalfEdge(b, new Dcel());
    edge.twin.twin = edge;

    expect(edge.getLength()).toEqual(2);
  });

  it("returns the correct length for all sides of a square", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    dcel
      .getBoundedFaces()[0]
      .edge?.getCycle()
      .forEach((e) => {
        expect(e.getLength()).toBe(20);
      });
  });

  it("returns the correct length for the sides of a triangle", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const lengths = dcel
      .getBoundedFaces()[0]
      .edge?.getCycle()
      .map((e) => e.getLength());
    expect(lengths?.sort()).toEqual([
      14.142135623730951, 14.142135623730951, 20,
    ]);
  });
});

describe("getMidpoint()", function () {
  it("returns the correct length", function () {
    const a = new Vertex(0, 0, new Dcel());
    const b = new Vertex(2, 0, new Dcel());
    const edge = new HalfEdge(a, new Dcel());
    edge.twin = new HalfEdge(b, new Dcel());
    edge.twin.twin = edge;

    const c = new Vertex(0, 10, new Dcel());
    const edge2 = new HalfEdge(a, new Dcel());
    edge2.twin = new HalfEdge(c, new Dcel());
    edge2.twin.twin = edge2;

    expect(edge.getMidpoint()).toEqual(new Point(1, 0));
    expect(edge2.getMidpoint()).toEqual(new Point(0, 5));
  });
});

describe("distanceToEdge()", function () {
  it("returns the minimum distance between 2 edges", function () {
    const a = new Vertex(0, 0, new Dcel());
    const b = new Vertex(-10, 10, new Dcel());
    const v = new Vertex(-1, -2, new Dcel());
    const w = new Vertex(2, 1, new Dcel());

    const ab = new HalfEdge(a, new Dcel());
    ab.twin = new HalfEdge(b, new Dcel());
    ab.twin.twin = ab;

    const vw = new HalfEdge(v, new Dcel());
    vw.twin = new HalfEdge(w, new Dcel());
    vw.twin.twin = vw;

    expect(ab.distanceToEdge(vw)).toEqual(Math.sqrt(0.5));
    expect(vw.distanceToEdge(ab)).toEqual(Math.sqrt(0.5));
  });
});

describe("getAngle()", function () {
  it("returns the correct angle", function () {
    const center = new Vertex(0, 0, new Dcel());

    const headRight = new Vertex(4, 0, new Dcel());
    const edgeRight = new HalfEdge(center, new Dcel());
    edgeRight.twin = new HalfEdge(headRight, new Dcel());
    edgeRight.twin.twin = edgeRight;

    const headBottom = new Vertex(0, -1, new Dcel());
    const edgeBottom = new HalfEdge(center, new Dcel());
    edgeBottom.twin = new HalfEdge(headBottom, new Dcel());
    edgeBottom.twin.twin = edgeBottom;

    const headLeft = new Vertex(-20, 0, new Dcel());
    const edgeLeft = new HalfEdge(center, new Dcel());
    edgeLeft.twin = new HalfEdge(headLeft, new Dcel());
    edgeLeft.twin.twin = edgeLeft;

    const headTop = new Vertex(0, 100, new Dcel());
    const edgeTop = new HalfEdge(center, new Dcel());
    edgeTop.twin = new HalfEdge(headTop, new Dcel());
    edgeTop.twin.twin = edgeTop;

    expect(edgeRight.getAngle()).toBe(0);
    expect(edgeTop.getAngle()).toBe(Math.PI * 0.5);
    expect(edgeLeft.getAngle()).toBe(Math.PI);
    expect(edgeBottom.getAngle()).toBe(Math.PI * 1.5);
  });
});

describe("getAssignedDirection()", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns the correct angle", function () {
    const c = new CRegular(2);
    const sectors = c.sectors;
    s.directions.od53.assignedDirection = 1;
    s.directions.od104.assignedDirection = 2;
    s.directions.od217.assignedDirection = 3;
    s.directions.od315.assignedDirection = 0;

    expect(s.directions.od53.getAssignedAngle(sectors)).toBe(c.angles[1]);
    expect(s.directions.od104.getAssignedAngle(sectors)).toBe(c.angles[2]);
    expect(s.directions.od217.getAssignedAngle(sectors)).toBe(c.angles[3]);
    expect(s.directions.od315.getAssignedAngle(sectors)).toBe(c.angles[0]);
  });
});

describe("getCycle()", function () {
  it("returns the correct number of edges for square", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    expect(dcel.getBoundedFaces()[0].edge?.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(4);
  });

  it("returns the correct number of edges for a triangle", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    expect(dcel.getBoundedFaces()[0].edge?.getCycle().length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(3);
  });
});

describe("subdivide() on geodata results in a Dcel", function () {
  const dir = "test/data/geodata";
  const testFiles = [
    "AUT_adm1-simple.json",
    "AUT_adm0-s1.json",
    "ne_50m_africa_admin0-s20.json",
    "ne_50m_europe_mapunits-s20.json",
  ];

  testFiles.forEach((file) => {
    it(
      "with complete cycles for all faces in counter-clockwise and clockwise direction of file " +
        file,
      function () {
        const json = JSON.parse(
          fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
        );
        const dcel = Dcel.fromGeoJSON(json);

        const cycles: HalfEdge[][] = [];
        dcel.getBoundedFaces().forEach((f) => {
          cycles.push(f.getEdges());
          cycles.push(f.getEdges(false));
        });

        expect(cycles.length).toBeGreaterThanOrEqual(1);
      },
    );
  });
});

describe("subdivide() on simple shapes results in a Dcel", function () {
  const dir = "test/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(
      "with complete cycles for all faces in counter-clockwise and clockwise direction of file " +
        file,
      function () {
        const json = JSON.parse(
          fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
        );
        const dcel = Dcel.fromGeoJSON(json);
        dcel
          .getBoundedFaces()
          .forEach((f) => f.getEdges().forEach((e) => e.subdivide()));

        const cycles: HalfEdge[][] = [];
        dcel.getBoundedFaces().forEach((f) => {
          cycles.push(f.getEdges());
          cycles.push(f.getEdges(false));
        });

        expect(cycles.length).toBeGreaterThanOrEqual(1);
      },
    );
  });
});

describe("subdivide()", function () {
  it("on one edge of a triangle results in 4 linked halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      4,
    );
  });

  it("on one edge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();

    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });

  it("on one outer edge of a square results in 5 linked inner halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge?.twin?.subdivide();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(5);
  });

  it("on one inneredge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge?.subdivide();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });

  it("on a square with a specified point, which is not on the origina edge, results in a correct dcel", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge?.subdivide(new Point(1, 1));

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });

  it("on the 1st outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/2triangle-adjacent.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[1].subdivide();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.size).toBe(12);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getBoundedFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });

  it("on the 2nd outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/2triangle-adjacent.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[2].subdivide();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.size).toBe(12);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getBoundedFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });
});

describe("subdivideToThreshold()", function () {
  it("on one edge of a square with side length 20 into 8 edges (epsilon: .5)", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const edge = dcel.getBoundedFaces()[0].edge;

    const halfEdgesBefore = dcel.halfEdges.size;
    edge?.subdivideToThreshold(5);
    const halfEdgesAfter = dcel.halfEdges.size;

    expect(halfEdgesAfter).toBe(halfEdgesBefore - 2 + 8 * 2);
  });

  it("turns an square with sides of length 20 into a dcel with 64 edges (epsilon: .5)", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    schematization.splitEdges(dcel, 5);

    expect(dcel.halfEdges.size).toBe(64);
  });
});

describe("intersectsLine()", function () {
  it("returns the intersection point if the halfedge intersects with a line", function () {
    const halfEdge = new HalfEdge(new Vertex(0, 0, new Dcel()), new Dcel());
    halfEdge.twin = new HalfEdge(new Vertex(2, 2, new Dcel()), new Dcel());
    const line = new Line(new Point(1, 1), 0);

    expect(halfEdge.intersectsLine(line)?.x).toBeCloseTo(1);
    expect(halfEdge.intersectsLine(line)?.y).toBeCloseTo(1);
  });

  it("returns the intersection point if the halfedge intersects with a line", function () {
    const halfEdge = new HalfEdge(new Vertex(2, 0, new Dcel()), new Dcel());
    halfEdge.twin = new HalfEdge(new Vertex(0, 2, new Dcel()), new Dcel());
    const line = new Line(new Point(2, 1), 0);

    expect(halfEdge.intersectsLine(line)?.x).toBeCloseTo(1);
    expect(halfEdge.intersectsLine(line)?.y).toBeCloseTo(1);
  });

  it("returns undefined if the halfedge and the line are parallel and do not share a vertex", function () {
    const halfEdge = new HalfEdge(new Vertex(0, 0, new Dcel()), new Dcel());
    halfEdge.twin = new HalfEdge(new Vertex(2, 0, new Dcel()), new Dcel());
    const line = new Line(new Point(0, 4), 0);

    expect(halfEdge.intersectsLine(line)).toBeUndefined();
  });

  it("returns ? if the halfedge is in line with the line", function () {
    const halfEdge = new HalfEdge(new Vertex(0, 0, new Dcel()), new Dcel());
    halfEdge.twin = new HalfEdge(new Vertex(2, 0, new Dcel()), new Dcel());
    const line = new Line(new Point(-2, 0), 0);

    expect(halfEdge.intersectsLine(line)).toBeUndefined();
  });

  it("returns undefined if the halfedge does not intersect with a line", function () {
    const halfEdge = new HalfEdge(new Vertex(0, 0, new Dcel()), new Dcel());
    halfEdge.twin = new HalfEdge(new Vertex(2, 2, new Dcel()), new Dcel());
    const line = new Line(new Point(0, 3), 0);

    expect(halfEdge.intersectsLine(line)).toBeUndefined();
  });
});

describe("getMinimalCycleDistance()", function () {
  it("returns the correct distance for a square.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const edge0 = dcel.getHalfEdges()[0];

    expect(edge0.getMinimalCycleDistance(dcel.getHalfEdges()[2])).toBe(1);
    expect(edge0.getMinimalCycleDistance(dcel.getHalfEdges()[4])).toBe(2);
    expect(edge0.getMinimalCycleDistance(dcel.getHalfEdges()[6])).toBe(1);
  });
});

describe("move().", function () {
  it("deletes(merges) a vertex if target point is existing.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel
      .getBoundedFaces()[0]
      .getEdges()[1]
      .move(new Point(10, 0), new Point(10, 1));

    expect(dcel.getBoundedFaces()[0].getEdges()[1].toString()).toBe(
      "10/0->10/1",
    );
  });

  it("deletes(merges) vertices if target points are existing.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel
      .getBoundedFaces()[0]
      .getEdges()[5]
      .move(new Point(10, 7), new Point(10, 8));

    expect(dcel.getBoundedFaces()[0].getEdges()[3].toString()).toBe(
      "10/1->10/7",
    );
    expect(dcel.getBoundedFaces()[0].getEdges()[4].toString()).toBe(
      "10/7->10/8",
    );
    expect(dcel.getBoundedFaces()[0].getEdges()[5].toString()).toBe(
      "10/8->10/10",
    );
  });

  it("moves an edge.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel
      .getBoundedFaces()[0]
      .getEdges()[1]
      .move(new Point(10.5, 0), new Point(10.5, 1));

    expect(dcel.getBoundedFaces()[0].getEdges()[1].toString()).toBe(
      "10.5/0->10.5/1",
    );
  });
});
