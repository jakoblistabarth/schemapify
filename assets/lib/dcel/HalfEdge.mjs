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

    getCycle(forwards = true) {
        let currentEdge = this
        const initialEdge = currentEdge
        const halfEdges = []

        do {
           halfEdges.push(currentEdge)
            currentEdge = forwards ? currentEdge.next : currentEdge.prev
        } while (currentEdge != initialEdge)

        return halfEdges
    }

    getAngle() {
        const vector = [this.twin.tail.lng - this.tail.lng, this.twin.tail.lat - this.tail.lat]
        const angle = Math.atan2(vector[1], vector[0])
        return angle < 0 ? angle + 2 * Math.PI : angle
    }

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

        const a_ = this.dcel.makeHalfEdge(newVertex, b.tail)
        a_.next = b
        a_.prev = a
        a.next = a_
        b.prev = a_
        newVertex.incidentEdge = a_

        a.twin.tail = newVertex
        const a_t = this.dcel.makeHalfEdge(b.tail, newVertex)
        a_t.next = a.twin
        a_t.prev = b.twin
        a.twin.prev = a_t
        b.twin.next = a_t

        a_t.twin = a_
        a_.twin = a_t

        a_.face = b.face
        a_.twin.face = b.twin.face

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