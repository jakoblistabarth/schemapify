import { v4 as uuid } from 'uuid'

class HalfEdge {
    constructor(origin, prev, next) {
        this.uuid = uuid()
        this.origin = origin
        this.twin = null
        this.incidentFace = null
        this.prev = prev
        this.next = next
    }

    getDestination() {
        return this.twin.origin
    }

    getEndpoints() {
        return [this.origin, this.getDestination()]
    }

    bisect() {
        const [o, d] = [ this.getEndpoints()[0], this.getEndpoints()[1] ]
        console.log("endpoints", this.getEndpoints())
        console.log(o, d)
    }
}

export default HalfEdge