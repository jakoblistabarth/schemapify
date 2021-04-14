import { v4 as uuid } from 'uuid';

class Face {
    constructor() {
        this.uuid = uuid()
        this.halfEdge = null
        this.properties = null
    }

    getEdges() {
        const halfEdges = []
        const initialEdge = this.halfEdge
        let currentEdge = initialEdge

        do {
           halfEdges.push(currentEdge)
            currentEdge = currentEdge.next
        } while (currentEdge != initialEdge)
        return halfEdges
    }
}

export default Face