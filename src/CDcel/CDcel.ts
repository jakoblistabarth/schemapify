import Dcel from "@/src/Dcel/Dcel";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  LineString,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";
import Face from "@/src/Dcel/Face";
import HalfEdge from "@/src/Dcel/HalfEdge";
import { createGeoJSON } from "@/src/utilities";
import { CStyle } from "@/src/c-oriented-schematization/schematization.style";
import Staircase from "@/src/c-oriented-schematization/Staircase";
import Sector from "@/src/c-oriented-schematization/Sector";
import CVertex from "@/src/Dcel/Vertex";
import CHalfEdge from "@/src/CDcel/CHalfEdge";

class CDcel extends Dcel {
  vertices: Map<string, CVertex>;
  halfEdges: Map<string, CHalfEdge>;

  constructor() {
    super();
    this.vertices = new Map();
    this.halfEdges = new Map();
  }

  /**
   * Gets all contractions within a DCEL.
   * @returns An array of {@link Contraction}s.
   */
  getContractions(): Contraction[] {
    return this.getHalfEdges().reduce((acc: Contraction[], edge) => {
      if (!edge.configuration) return acc;
      const n = edge.configuration[ContractionType.N];
      const p = edge.configuration[ContractionType.P];
      if (n) acc.push(n);
      if (p) acc.push(p);
      return acc;
    }, []);
  }

  toGeoJSON(): FeatureCollection<MultiPolygon> {
    const outerRingsByFID = this.getBoundedFaces().reduce(
      (groupedFaces: { [key: number]: Face[] }, face) => {
        face.associatedFeatures.forEach((featureId, idx) => {
          if (face.outerRing && idx === 0) return groupedFaces; // TODO: why do we need this 0? for cases like Vienna within noe
          if (groupedFaces[featureId]) groupedFaces[featureId].push(face);
          else groupedFaces[featureId] = [face];
        });
        return groupedFaces;
      },
      {},
    );

    const features = Object.values(outerRingsByFID).map(
      (feature: Face[], idx: number): Feature<MultiPolygon> => {
        let featureProperties: GeoJsonProperties = {};
        if (this.featureProperties)
          featureProperties =
            this.featureProperties[Object.keys(outerRingsByFID)[idx]];
        const featureCoordinates: number[][][][] = [];
        let ringIdx = 0;
        feature.forEach((ring: Face) => {
          const halfEdges = ring.getEdges();
          const coordinates = halfEdges.map((e) => [e.tail.x, e.tail.y]);
          coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
          featureCoordinates.push([coordinates]);
          if (ring.innerEdges.length) {
            const ringCoordinates: number[][][] = [];
            ring.innerEdges.forEach((innerEdge: HalfEdge) => {
              const halfEdges: HalfEdge[] = innerEdge.getCycle(false); // go backwards to go counterclockwise also for holes
              const coordinates: number[][] = halfEdges.map((e) => [
                e.tail.x,
                e.tail.y,
              ]);
              coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
              ringCoordinates.push(coordinates);
            });
            featureCoordinates[ringIdx].push(...ringCoordinates);
          }
          ringIdx++;
        });
        return {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: featureCoordinates,
          },
          properties: featureProperties,
        };
      },
    );

    return createGeoJSON(features);
  }

  verticesToGeoJSON(): FeatureCollection<Point> {
    const vertexFeatures = Array.from(this.vertices.values()).map(
      (v): Feature<Point> => {
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [v.x, v.y],
          },
          properties: {
            uuid: v.uuid,
            significant: v.significant,
            edges: v.edges,
          },
        };
      },
    );

    return createGeoJSON(vertexFeatures);
  }

  facesToGeoJSON(): FeatureCollection<Polygon> {
    const faceFeatures = this.getBoundedFaces().map((f): Feature<Polygon> => {
      const halfEdges = f.getEdges();
      const coordinates = halfEdges.map((e) => [e.tail.x, e.tail.y]);
      coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
      return {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
        properties: {
          uuid: f.uuid,
          featureId: f.associatedFeatures,
          ringType: f.outerRing ? "inner" : "outer",
        },
      };
    });

    return createGeoJSON(faceFeatures);
  }

  staircasesToGeoJSON(cStyle: CStyle): FeatureCollection<Polygon> {
    const staircaseFeatures = this.getHalfEdges(undefined, true).map(
      (edge): Feature<Polygon> => {
        const staircase: Staircase = new Staircase(edge, cStyle);
        const coordinates: number[][] =
          staircase.region.exteriorRing.points.map((p) => [p.x, p.y]);
        return {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coordinates],
          },
          properties: {
            edge: edge.uuid,
            edgeClass: edge.class,
          },
        };
      },
    );
    return createGeoJSON(staircaseFeatures);
  }

  edgesToGeoJSON(sectors: Sector[]): FeatureCollection<LineString> {
    const edgeFeatures = this.getHalfEdges(undefined, true).map(
      (e): Feature<LineString> => {
        const a = e.tail;
        const b = e.twin?.tail;
        const coordinates = // QUESTION: does it make sense to return an empty set of coordinates if head is not defined?
          a && b
            ? [
                [a.x, a.y],
                [b.x, b.y],
              ]
            : [];

        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
          properties: {
            incidentFaceType: e.face?.outerRing ? "inner" : "outer",
            length: e.getLength(),
            sector: e.getAssociatedSector(sectors),
            class: e.class,
            assignedDirection: e.assignedDirection,
            configuration: e.configuration,
            twinClass: e.twin?.class,
            // TODO: move this to mapoutput!
            edge: `
                  <span class="material-icons">rotate_left</span>
                  ${e.getUuid(5)} (${e.tail.x}/${e.tail.y})
                  <span class="material-icons">arrow_forward</span>
                  (${e.twin?.tail.x}/${e.twin?.tail.y})
                  <span class="material-icons">highlight_alt</span> ${e.face?.getUuid(
                    5,
                  )}
                  ${e.class}
                  ${e.assignedDirection}
                  `,
            twin: `
                  <span class="material-icons">rotate_right</span>
                  ${e.twin?.getUuid(5)} (${e.twin?.tail.x}/${e.twin?.tail.y})
                  <span class="material-icons">arrow_back</span>
                  (${e.tail.x}/${e.tail.y})
                  <span class="material-icons">highlight_alt</span> ${e.twin?.face?.getUuid(
                    5,
                  )}
                  ${e.twin?.class}
                  ${e.twin?.assignedDirection}
                  `,
          },
        };
      },
    );

    return createGeoJSON(edgeFeatures);
  }
}

export default CDcel;
