import HalfEdge from "../DCEL/HalfEdge";
import Line from "../geometry/Line";

class Configuration {
  edge: HalfEdge;
  tracks: Line[];

  constructor(edge: HalfEdge) {
    this.edge = edge;
    this.tracks = this.createTracks();
  }

  createTracks(): Line[] {
    const track1 = new Line(this.edge.getTail(), this.edge.prev.getAngle());
    const track2 = new Line(this.edge.getHead(), this.edge.next.getAngle());
    return [track1, track2];
  }
}

export default Configuration;
