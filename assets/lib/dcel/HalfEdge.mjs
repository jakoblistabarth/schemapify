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

        const newVertex = this.dcel.makeVertex(x, y)
        const halfEdge1 = this.dcel.makeHalfEdge(newVertex, this, this.next)
        newVertex.incidentEdge = halfEdge1
        halfEdge1.incidentFace = this.twin.incidentFace // because of prevent duplicate logic
        halfEdge1.twin = this.twin
        this.next = halfEdge1
        this.next.prev = halfEdge1
        const halfEdge2 = this.dcel.makeHalfEdge(newVertex, this.next.twin, this.prev.twin)
        halfEdge2.incidentFace = this.incidentFace
        halfEdge2.twin = this
        this.twin = halfEdge2
        halfEdge2.prev.next = halfEdge2
    }
}

export default HalfEdge