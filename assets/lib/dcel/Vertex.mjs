import { v4 as uuid } from 'uuid';

class Vertex {
    constructor(lng,lat) {
        this.uuid = uuid()
        this.lng = lng
        this.lat = lat
        this.incidentEdge = null
    }

    getDistance(p) {
        const [x1, y1] = [this.lng, this.lat]
        const [x2, y2] = [p.lng, p.lat]

        const a = x1 - x2
        const b = y1 - y2

        const c = Math.sqrt( a*a + b*b )
        return c
    }
}

export default Vertex