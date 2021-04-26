import { v4 as uuid } from 'uuid';

class Face {
    constructor() {
        this.uuid = uuid()
        this.edge = null
        this.properties = {}
    }

    getEdges(counterclockwise = true) {
        const halfEdges = []
        const initialEdge = this.edge
        let currentEdge = initialEdge

        do {
           halfEdges.push(currentEdge)
            currentEdge = counterclockwise ? currentEdge.next : currentEdge.prev
        } while (currentEdge != initialEdge)
        return halfEdges
    }
}

export default Face