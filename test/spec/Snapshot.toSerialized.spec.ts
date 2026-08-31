import { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import { Orientation } from "@/src/c-oriented-schematization/HalfEdgeClassGenerator";
import Polygon from "@/src/geometry/Polygon";
import Subdivision from "@/src/geometry/Subdivision";
import Snapshot from "@/src/Snapshot/Snapshot";
import { describe, expect, test } from "vitest";

const square: [number, number][] = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
];

const subdivision = Subdivision.fromCoordinates([[[square]]]);

const snapshot = new Snapshot(subdivision, 0, LABEL.CLASSIFY, {
  significantVertices: new Map([["0/0", true]]),
  halfEdgeClasses: new Map([
    ["0/0-2/0", { orientation: Orientation.AB, assignedDirection: 0 }],
  ]),
  regions: new Map([[1, Polygon.fromCoordinates([square])]]),
});

/**
 * Mimics what `postMessage` does to a value on its way out of a worker:
 * plain data survives, class prototypes do not.
 */
const clone = <T>(value: T): T => structuredClone(value);

describe("A serialized Snapshot", () => {
  test("survives structured cloning", () => {
    expect(() => clone(snapshot.toSerialized())).not.toThrow();
  });

  test("keeps its identity and timings", () => {
    const restored = Snapshot.fromSerialized(clone(snapshot.toSerialized()));

    expect(restored.id).toBe(snapshot.id);
    expect(restored.label).toBe(snapshot.label);
    expect(restored.triggeredAt).toBe(snapshot.triggeredAt);
    expect(restored.duration).toBe(snapshot.duration);
  });

  test("restores the subdivision's geometry", () => {
    const restored = Snapshot.fromSerialized(clone(snapshot.toSerialized()));
    const [multiPolygon] = restored.subdivision.multiPolygons;

    expect(restored.subdivision).toBeInstanceOf(Subdivision);
    expect(restored.subdivision.vertexCount).toBe(subdivision.vertexCount);
    expect(multiPolygon.polygons[0].area).toBe(4);
  });

  test("is restorable through a bare reference, as the store maps it", () => {
    const [restored] = [clone(snapshot.toSerialized())].map(
      Snapshot.fromSerialized,
    );

    expect(restored).toBeInstanceOf(Snapshot);
    expect(restored.subdivision.vertexCount).toBe(subdivision.vertexCount);
  });

  test("restores its additional data", () => {
    const { additionalData } = Snapshot.fromSerialized(
      clone(snapshot.toSerialized()),
    );

    expect(additionalData?.significantVertices?.get("0/0")).toBe(true);
    expect(additionalData?.halfEdgeClasses?.get("0/0-2/0")).toEqual({
      orientation: Orientation.AB,
      assignedDirection: 0,
    });
    expect(additionalData?.regions?.get(1)).toBeInstanceOf(Polygon);
    expect(additionalData?.regions?.get(1)?.area).toBe(4);
  });
});
