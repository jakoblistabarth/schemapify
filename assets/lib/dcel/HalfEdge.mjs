import { v4 as uuid } from 'uuid'
import Vertex from './Vertex.mjs'

class HalfEdge {
    constructor(origin, prev, next, dcel) {
        this.uuid = uuid()
        this.origin = origin
        this.twin = null
        this.incidentFace = null
        this.prev = prev
        this.next = next
        this.dcel = dcel
    }

    getOrigin() {
        return this.origin
    }

    getDestination() {
        return this.twin.origin
    }

    getEndpoints() {
        return [ this.getOrigin(), this.getDestination() ]
    }

    getLength() {
        return this.getOrigin().getDistance(this.getDestination())
    }

    getMidpoint() {
        const [ x1, y1 ] = [ this.getOrigin().lng, this.getOrigin().lat ]
        const [ x2, y2 ] = [ this.getDestination().lng, this.getDestination().lat ]

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
            // console.log(currentHalfEdge.origin.getXY(), currentHalfEdge.getLength());
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