import { v4 as uuid } from 'uuid';

class Vertex {
    constructor(lng,lat) {
        this.uuid = uuid()
        this.lng = lng
        this.lat = lat
        this.edges = []
    }

    static getKey(lng, lat) {
        return `${lng}/${lat}` // TODO: is there a better way to ensure that a coordinate pair vertex is added only once to the vertex list?
    }

    sortEdges() {
        this.edges = this.edges.sort((a, b) => {
          return b.getAngle() - a.getAngle()
        })
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