import { v4 as uuid } from 'uuid';

class Face {
    constructor() {
        this.uuid = uuid()
        this.edge = null
        this.properties = {}
    }

    getEdges(counterclockwise = true) {
        return this.edge.getCycle(counterclockwise)
    }
}

export default Face