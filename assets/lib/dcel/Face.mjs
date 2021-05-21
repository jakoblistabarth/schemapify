import { v4 as uuid } from "uuid";

class Face {
  constructor() {
    this.edge = null; // pointer to an arbitrary edge of the outer connected component (boundary) of this face
    this.innerEdges = null; // iterator of edges, one for each inner connected component (holes) of this face
    this.outerRing = null; // only for holes, pointer to the outerRing it belongs to
    this.uuid = uuid(); // unique ID per face
    this.FID = null; // ID per geoJSON feature
  }

  getEdges(counterclockwise = true) {
    return this.edge.getCycle(counterclockwise);
  }

  removeInnerEdge(edge) {
    const idx = this.innerEdges.indexOf(edge);
    if (idx > -1) {
      this.innerEdges.splice(idx, 1);
    }
    return this.innerEdges;
  }
}

export default Face;
