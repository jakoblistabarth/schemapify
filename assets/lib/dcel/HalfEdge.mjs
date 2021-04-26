import { v4 as uuid } from 'uuid'

class HalfEdge {
    constructor(tail, dcel) {
        this.uuid = uuid()
        this.tail = tail
        this.twin = null
        this.face = null
        this.prev = null
        this.next = null
        this.dcel = dcel
    }

    getTail() {
        return this.tail
    }

    getHead() {
        return this.twin.tail
    }

    getEndpoints() {
        return [ this.getTail(), this.getHead() ]
    }

    getAngle() {
        const vector = [this.twin.tail.lng - this.tail.lng, this.twin.tail.lat - this.tail.lat]
        const angle = Math.atan2(vector[1], vector[0])
        return angle < 0 ? angle + 2 * Math.PI : angle
    }

    getRadialHalfEdge() {
        return this.prev.twin.prev.twin // or twin.next ??

    }

    // getRadialHalfEdge(counterclockwise = true){ //TODO: implement clockwise direction
    //     const edges = this.getTail().getOutgoingEdges()
    //     const idx = edges.findIndex(e => e === this) + (counterclockwise ? 1 : -1)

    //     return edges[idx >= edges.length ? 0 : idx < 0 ? edges.length -1 : idx]
    // }

    getLength() {
        return this.getTail().getDistance(this.getHead())
    }

    getMidpoint() {
        const [ x1, y1 ] = [ this.getTail().lng, this.getTail().lat ]
        const [ x2, y2 ] = [ this.getHead().lng, this.getHead().lat ]

        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2

        return [mx, my]
    }

    bisect() {
        const [ x, y ] = this.getMidpoint()
        const a = this
        const b = this.next

        const newVertex = this.dcel.makeVertex(x, y)

        const a_ = this.dcel.makeHalfEdge(newVertex, a, b)
        a.next = a_
        b.prev = a_
        newVertex.incidentEdge = a_

        a.twin.origin = newVertex
        const a_t = this.dcel.makeHalfEdge(b.origin, b.twin, a.twin)
        a.twin.prev = a_t
        b.twin.next = a_t

        a_t.twin = a_
        a_.twin = a_t

        a_.incidentFace = b.incidentFace
        a_.twin.incidentFace = b.twin.incidentFace

        return a_
    }

    subdivideToThreshold(threshold) {
        const initialHalfEdge = this
        let currentHalfEdge = initialHalfEdge

        while (currentHalfEdge != initialHalfEdge.next) {
            if (currentHalfEdge.getLength() < threshold) {
                currentHalfEdge = currentHalfEdge.next
            } else {
                const newHalfEdge = currentHalfEdge.bisect()
                console.log(newHalfEdge);
                currentHalfEdge = newHalfEdge.prev
            }
        }
    }
}

export default HalfEdge