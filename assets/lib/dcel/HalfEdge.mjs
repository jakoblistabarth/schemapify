import { v4 as uuid } from "uuid";

class HalfEdge {
  constructor(tail, dcel) {
    this.uuid = uuid();
    this.tail = tail;
    this.twin = null;
    this.face = null;
    this.prev = null;
    this.next = null;
    this.dcel = dcel;
  }

  getTail() {
    return this.tail;
  }

  getHead() {
    return this.twin.tail;
  }

  getEndpoints() {
    return [this.getTail(), this.getHead()];
  }

  getCycle(forwards = true) {
    let currentEdge = this;
    const initialEdge = currentEdge;
    const halfEdges = [];

    do {
      halfEdges.push(currentEdge);
      currentEdge = forwards ? currentEdge.next : currentEdge.prev;
    } while (currentEdge != initialEdge);

    return halfEdges;
  }

  getAngle() {
    const vector = [this.twin.tail.lng - this.tail.lng, this.twin.tail.lat - this.tail.lat];
    const angle = Math.atan2(vector[1], vector[0]);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }

  getLength() {
    return this.getTail().getDistance(this.getHead());
  }

  getMidpoint() {
    const [x1, y1] = [this.getTail().lng, this.getTail().lat];
    const [x2, y2] = [this.getHead().lng, this.getHead().lat];

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return [mx, my];
  }

  remove() {
    this.tail.removeIncidentEdge(this);
    this.dcel.removeHalfEdge(this);
  }

  bisect() {
    const e = this;
    const et = e.twin;
    const f1 = e.face;
    const f2 = et.face;

    const a = e.next;
    const b = e.prev;
    const c = et.next;
    const d = et.prev;

    const [x, y] = e.getMidpoint();
    const N = this.dcel.makeVertex(x, y);

    const et_ = this.dcel.makeHalfEdge(N, e.tail);
    const et__ = this.dcel.makeHalfEdge(et.tail, N);
    N.edges.push(et_);
    N.edges.sort();
    et_.next = c;
    et_.prev = et__;
    et_.face = f2;

    et__.next = et_;
    et__.prev = d;
    et__.face = f2;

    et.prev.next = et__;
    et.next.prev = et_;
    et.remove();

    const e_ = this.dcel.makeHalfEdge(e.tail, N);
    const e__ = this.dcel.makeHalfEdge(N, et.tail);
    N.edges.push(e__);
    N.edges.sort();
    e_.next = e__;
    e_.prev = b;
    e_.face = f1;

    e__.next = a;
    e__.prev = e_;
    e__.face = f1;

    b.next = e_;
    a.prev = e__;

    et_.twin = e_;
    e_.twin = et_;
    et__.twin = e__;
    e__.twin = et__;

    e.remove();

    return e_;
  }

  subdivideToThreshold(threshold) {
    const initialHalfEdge = this;
    let currentHalfEdge = initialHalfEdge;

    while (currentHalfEdge != initialHalfEdge.next) {
      if (currentHalfEdge.getLength() < threshold) {
        currentHalfEdge = currentHalfEdge.next;
      } else {
        const newHalfEdge = currentHalfEdge.bisect();
        // console.log(newHalfEdge);
        currentHalfEdge = newHalfEdge.prev;
      }
    }
  }
}

export default HalfEdge;
