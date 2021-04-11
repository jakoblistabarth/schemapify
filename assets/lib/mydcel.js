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
        this.halfEdge = null
    }
}

class DCEL {
    constructor() {
        this.vertices = {}            
        this.halfEdges = []            
        this.faces = []
        this.outerFace = this.makeFace()
    }

    makeVertex(lng,lat) {
        const key = `${lng}/${lat}`
        if (this.vertices[key]) 
            return this.vertices[key]

        const vertex = new DCELVertex(lng,lat)
        this.vertices[key] = vertex
        return vertex
    }

    makeHalfEdge(origin, prev, next) {
        let existingEdge = null
        if (origin) {
            existingEdge = this.halfEdges.find(edge => edge.origin == origin && edge.incidentFace == this.outerFace)
        }
        if (existingEdge) {
            // console.log("duplicate!");
            // console.log("origin:", origin);
            // console.log(existingEdge)
            return existingEdge
        }
        const halfEdge = new DCELHalfEdge(origin, prev, next)
        halfEdge.incidentFace = this.outerFace
        this.halfEdges.push(halfEdge)
        console.log("create halfEdge:", origin);
        return halfEdge
    }

    makeFace(){
        const face = new DCELFace()
        this.faces.push(face)
        return face
    }
}