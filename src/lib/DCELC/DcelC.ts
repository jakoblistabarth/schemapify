import Dcel, { DcelInterface } from "../DCEL/Dcel";
import HalfEdge from "../DCEL/HalfEdge";
import Vertex from "../DCEL/Vertex";
import Staircase from "../orientation-restriction/Staircase";
import HalfEdgeC from "./HalfEdgeC";
import VertexC from "./VertexC";

class DcelC extends Dcel implements DcelInterface {
  vertices: Map<string, VertexC>;
  halfEdges: Map<string, HalfEdgeC>;

  getVertexClass(): typeof Vertex {
    return VertexC;
  }

  getHalfEdgeClass(): typeof HalfEdge {
    return HalfEdgeC;
  }

  getVertices(significant?: boolean) {
    if (significant)
      return [...this.vertices]
        .filter(([k, v]) => v.significant === significant)
        .map(([k, v]) => v);
    return super.getVertices();
  }

  /**
   * Returns all Staircases of an DCEL.
   */
  getStaircases(): Staircase[] {
    return this.getHalfEdges()
      .filter((edge) => edge.staircase)
      .map((edge) => edge.staircase);
  }

  edgesToStaircases() {
    // create staircase for every pair of edges
    this.getHalfEdges(undefined, true).forEach((edge) => {
      if (edge.class === EdgeClasses.AB) return;
      if (
        edge.getSignificantVertex() !== undefined &&
        edge.getSignificantVertex() !== edge.getTail()
      )
        edge = edge.twin;
      edge.staircase = new Staircase(edge);
    });

    // calculate edgedistance and stepnumber for deviating edges first
    const staircasesOfDeviatingEdges = this.getStaircases().filter(
      (staircase) =>
        staircase.edge.class === EdgeClasses.AD || staircase.edge.class === EdgeClasses.UD
    );
    this.getEdgeDistances(staircasesOfDeviatingEdges);
    this.getSe(
      staircasesOfDeviatingEdges.filter((staircase) => staircase.interferesWith.length > 0)
    );

    // calculate edgedistance and stepnumber for remaining edges
    const staircasesOther = this.getStaircases().filter(
      (staircase) =>
        staircase.edge.class !== EdgeClasses.AD && staircase.edge.class !== EdgeClasses.UD
    );
    this.getEdgeDistances(staircasesOther);
    this.getSe(staircasesOther.filter((staircase) => staircase.interferesWith.length > 0));

    // TODO: make snapshot of staircases and edges, generic function?
    this.snapShots.push({ idx: 0, name: "staircases", layers: [this.staircaseRegionsToGeoJSON()] });

    // create the actual staircase in the DCEL
    this.replaceWithStaircases();
  }

  getEdgeDistances(staircases: Staircase[]) {
    // TODO: make sure the edgedistance cannot be too small? for topology error ("Must Be Larger Than Cluster tolerance"), when minimum distance between points to small
    // see: https://pro.arcgis.com/en/pro-app/latest/help/editing/geodatabase-topology-rules-for-polygon-features.htm

    // check if any point of a region is within another region
    for (const staircase of staircases) {
      const currentStaircaseIdx = staircases.indexOf(staircase);
      const staircasesToCompareWith = Array.from(staircases);
      staircasesToCompareWith.splice(currentStaircaseIdx, 1);
      staircasesToCompareWith.forEach((staircaseToCompareWith) => {
        if (staircase.region.every((point) => !point.isInPolygon(staircaseToCompareWith.region)))
          return;
        let e = staircase.edge;
        let e_ = staircaseToCompareWith.edge;
        if (
          e.getTail() !== e_.getTail() &&
          e.getTail() !== e_.getHead() &&
          e.getHead() !== e_.getHead() &&
          e.getHead() !== e_.getTail()
        ) {
          // "If the compared regions' edges do not have a vertex in common,
          // de is is simply the minimal distance between the edges."
          const de = e.distanceToEdge(e_);
          staircase.setEdgeDistance(de);
          return staircase.interferesWith.push(e_);
        } else {
          // "If e and e' share a vertex v, they interfere only if the edges reside in the same sector with respect to v."
          const v = e.getEndpoints().find((endpoint) => e_.getEndpoints().indexOf(endpoint) >= 0); // get common vertex
          e = e.getTail() !== v ? e.twin : e;
          e_ = e_.getTail() !== v ? e_.twin : e_;
          if (!e.getAssociatedSector().some((sector) => sector.encloses(e_.getAngle()))) return;
          staircase.interferesWith.push(e_);

          // "However, if e and e' do share a vertex, then we must again look at the classification."
          let de = undefined;
          switch (e.class) {
            case EdgeClasses.UB: {
              // "If e' is aligned, then we ignore a fraction of (1 − ε)/2 of e'."
              // "If e' is unaligned, then we ignore a fraction of e' equal to the length of the first step."
              // "In other words, we ignore a fraction of 1/(se' − 1) [of e']."
              if (e_.class === EdgeClasses.AD) {
                const offset = (1 - e.dcel.config.staircaseEpsilon) / 2;
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset.distanceToEdge(e);
              } else {
                const offset = 1 / (e_.staircase.se - 1);
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset.distanceToEdge(e);
              }
              break;
            }
            case EdgeClasses.E: {
              // "If e' is an evading edge, we ignore the first half of e (but not of e')."
              // "If e' is a deviating edge, we treat it as if e were an unaligned basic edge."
              if (e_.class === EdgeClasses.E) {
                const vertexOffset = e.getOffsetVertex(e, (e.getLength() * 1) / 2);
                de = vertexOffset.distanceToEdge(e_);
              } else {
                // AD or UD
                const offset = 1 / (e_.staircase.se - 1);
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset.distanceToEdge(e);
              }
              break;
            }
            case EdgeClasses.AD: {
              const offset = (1 - e.dcel.config.staircaseEpsilon) / 2;
              const vertexOffset = e.getOffsetVertex(e, offset);
              de = vertexOffset.distanceToEdge(e_);
              break;
            }
            case EdgeClasses.UD: {
              const vertexOffset = e.getOffsetVertex(e, (e.getLength() * 1) / 3);
              de = vertexOffset.distanceToEdge(e_);
              break;
            }
          }
          staircase.setEdgeDistance(de);
        }
      });
    }
  }

  getSe(staircases: Staircase[]) {
    for (const staircase of staircases) {
      const edge = staircase.edge;
      switch (edge.class) {
        case EdgeClasses.AD: {
          // "… we use δe = min{de/2,Δe}, where Δe = 0.1||e|| as defined for the staircase regions."
          if (staircase.de / 2 < staircase.deltaE) staircase.deltaE = staircase.de / 2;
          break;
        }
        case EdgeClasses.UD: {
          const maxVertices = staircase.points
            .slice(1, 2)
            .map((point) => new Vertex(point.x, point.y, null));
          const d1 = Math.min(...maxVertices.map((vertex) => vertex.distanceToEdge(edge)));
          let se = Math.ceil((2 * d1 * edge.getLength()) / staircase.de + 1);
          se = se % 2 === 0 ? se + 2 : se + 1; // TODO: check if this is correct? (p. 18)
          staircase.se = Math.max(4, se);
          break;
        }
        default: {
          // console.log("de", staircase.de);
          // "Let 𝛼1 denote the absolute angle between vector w−v and the assigned direction of e.
          // Similarly, 𝛼2 denotes the absolute angle between vector w − v and the other associated direction of e."
          const alpha1 = edge.getAngle() - edge.getAssociatedAngles()[0];
          const alpha2 = edge.getAssociatedAngles()[1] - edge.getAngle();
          const lmax =
            ((Math.pow(Math.tan(alpha1), -1) + Math.pow(Math.tan(alpha2), -1)) * staircase.de) / 2;
          let se = Math.ceil(edge.getLength() / lmax);
          staircase.se = se % 2 === 0 ? se + 2 : se + 1; // TODO: check if this is correct? (p. 18)
        }
      }
    }
  }

  replaceWithStaircases() {
    this.getHalfEdges()
      .filter((edge) => edge.staircase !== undefined)
      .forEach((edge) => {
        const stepPoints = edge.staircase.getStaircasePoints().slice(1, -1); // FIXME: use staircase.points here instead of method?
        let edgeToSubdivide = edge;
        for (let p of stepPoints)
          edgeToSubdivide = edgeToSubdivide.subdivide(new Point(p.x, p.y)).next;
      });

    // assign class AB to all edges of just created staircases
    this.getHalfEdges().forEach((edge) => (edge.class = EdgeClasses.AB));
  }
}

export default DcelC;
