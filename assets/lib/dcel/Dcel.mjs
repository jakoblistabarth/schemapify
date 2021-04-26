import config from '../../schematization.config.mjs'
import Vertex from './Vertex.mjs'
import HalfEdge from './HalfEdge.mjs'
import Face from './Face.mjs'

class Dcel {
    constructor() {
        this.vertices = {}
        this.halfEdges = []
        this.faces = []
        // this.outerFace = this.makeFace()
    }

    makeVertex(lng,lat) {
        const key = Vertex.getKey(lng, lat) // TODO: is there a better way to ensure that a coordinate pair vertex is added only once to the vertex list
        if (this.vertices[key])
            return this.vertices[key]

        const vertex = new Vertex(lng, lat, this)
        this.vertices[key] = vertex
        return vertex
    }

    makeHalfEdge(tail, head) {
        const existingHalfEdge = this.halfEdges.find(edge => tail == edge.tail && edge.twin.tail == head)
        if (existingHalfEdge)
            return existingHalfEdge

        const halfEdge = new HalfEdge(tail, this)
        this.halfEdges.push(halfEdge)
        tail.edges.push(halfEdge)
        return halfEdge
    }

    makeFace(properties){
        const face = new Face()
        face.properties = properties ? properties : face.properties
        this.faces.push(face)
        return face
    }

    getFaces() {
        return this.faces
    }

    // as seen @ https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts
    // takes a dcel
    // returns its Boundingbox as [minX, minY, maxX, maxY]
    getBbox() {
        const points = Object.values(this.vertices).map(p => [p.lng, p.lat])
        const bbox = [Infinity,Infinity,-Infinity,-Infinity]
        points.forEach(p =>{
            if (bbox[0] > p[0]) {
                bbox[0] = p[0];
              }
              if (bbox[1] > p[1]) {
                bbox[1] = p[1];
              }
              if (bbox[2] < p[0]) {
                bbox[2] = p[0];
              }
              if (bbox[3] < p[1]) {
                bbox[3] = p[1];
              }
        })
        return bbox
    }

    // takes a dcel
    // returns its diameter
    getDiameter() {
        const bbox = this.getBbox()
        // TODO: refactor this?
        const [a, b, c, d] = [
            new Vertex(bbox[0],bbox[1]),
            new Vertex(bbox[2],bbox[1]),
            new Vertex(bbox[2],bbox[3]),
            new Vertex(bbox[0],bbox[3])
        ]

        const diameter = Math.max(...[ // TODO: refactor this – only two sides necessary?
            a.getDistance(b),
            b.getDistance(c),
            c.getDistance(d),
            d.getDistance(a)
        ])

        return diameter;
    }

    findVertex(lng, lat) {
        const key = Vertex.getKey(lng, lat)
        return this.vertices[key]
    }

    static buildFromGeoJSON(geoJSON) {
        const subdivision = new Dcel()

        const polygons = geoJSON.features.reduce((acc, feature)  => {
            acc.push(...feature.geometry.coordinates.map(subplgn => {
                return subplgn.map(point => {
                    return subdivision.findVertex(point[0], point[1]) || subdivision.makeVertex(point[0],point[1])
                })
            }))
            return acc
        }, [])

        polygons.forEach(plgn =>{
            plgn.forEach((tail, idx) => {
                const head = plgn[(idx + 1) % plgn.length]
                const halfEdge = subdivision.makeHalfEdge(tail, head)
                const twinHalfEdge = subdivision.makeHalfEdge(head, tail)
                halfEdge.twin = twinHalfEdge
                twinHalfEdge.twin = halfEdge
            })
        })

        // TODO: sort edges everytime a new edge is pushed to vertex.edges
        Object.values(subdivision.vertices).forEach(vertex => {
            //  sort the half-edges whose tail vertex is that endpoint in clockwise order.
            vertex.sortEdges()
            // For every pair of half-edges e1, e2 in clockwise order, assign e1->twin->next = e2 and e2->prev = e1->twin.
            vertex.edges.forEach((e1, idx) => {
                const e2 = vertex.edges[(idx + 1) % vertex.edges.length]
                e1.twin.next = e2
                e2.prev = e1.twin
                e2.twin.next = e1
                e1.prev = e2.twin
            })
        })

        // geoJSON.features.forEach(feature => {
        //     feature.geometry.coordinates.forEach(subplgn => {
        //         const [ firstPoint, secondPoint ] = subplgn
        //         const initialEdge = subdivision.halfEdges.find(edge => {
        //             return edge.tail.lng === firstPoint[0] && edge.tail.lat === firstPoint[1] &&
        //                 edge.twin.tail.lng === secondPoint[0] && edge.twin.tail.lat === secondPoint[1]
        //         })

        //         let currentEdge = initialEdge
        //         const face = subdivision.makeFace(feature.properties)
        //         face.edge = initialEdge
        //         do {
        //             currentEdge.face = face
        //             currentEdge = currentEdge.next
        //          } while (currentEdge != initialEdge)
        //     })
        // })

        console.log(subdivision);

        subdivision.setEpsilon(config.eFactor)
        return subdivision
    }

    // get epsilon
    // – the threshold for max edge length
    // takes a dcel
    // returns the treshold as float
    setEpsilon(factor) {
        this.epsilon = this.getDiameter() * factor
    }

}

export default Dcel