import { v4 as uuid } from 'uuid';

class Face {
    constructor() {
        this.uuid = uuid()
        this.halfEdge = null
        this.properties = {}
    }

    getEdges(anticlockwise = true) {
        const halfEdges = []
        const initialEdge = this.halfEdge
        let currentEdge = initialEdge

        do {
           halfEdges.push(currentEdge)
            currentEdge = anticlockwise ? currentEdge.next : currentEdge.prev
        } while (currentEdge != initialEdge)
        return halfEdges
    }
}

export default Face