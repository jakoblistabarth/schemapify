// TODO: if this class needs particular methods for the schematization algorithm extend this class
class DCELVertex {
    constructor(lng,lat) {
        this.lng = lng
        this.lat = lat
        this.incidentEdge = null
    }
}

class DCELHalfEdge {
    constructor(origin, prev, next) {
        this.origin = origin
        this.twin = null
        this.incidentFace = null
        this.prev = prev // prev half-edge
        this.next = next // next half-edge
    }
}

class DCELFace {
    constructor() {
        this.outerComponent = null
        this.innerComponent = null
    }
}

class DCEL {
    constructor() {
        this.vertices = {}            
        this.halfEdges = []            
        this.faces = []            
    }

    makeVertex(lng,lat) {
        const key = `${lng}|${lat}`
        if (this.vertices[key]) 
            return this.vertices[key]

        const vertex = new DCELVertex(lng,lat)
        this.vertices[key] = vertex
        return vertex
    }

    makeHalfEdge(origin, prev, next) {
        const halfEdge = new DCELHalfEdge(origin, prev, next)
        this.halfEdges.push(halfEdge)
        return halfEdge
    }

    makeFace(){
        const face = new DCELFace()
        this.faces.push(face)
        return face
    }
}