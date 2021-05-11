import DCEL from '../assets/lib/dcel/Dcel.mjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe("A DCEL of a single triangle with one triangular hole", function() {

    let dcel

    beforeEach(function() {
        const polygon = JSON.parse(readFileSync(resolve('assets/data/triangle-hole.json'), 'utf8'))
        dcel = DCEL.buildFromGeoJSON(polygon)
    })

    it("has 1 outerface", function(){
        expect(dcel.outerFace).toEqual(jasmine.any(Object))
    })

    it("has 3 faces (1 outer, 2 inner) in total", function(){
        expect(dcel.getFaces().length).toBe(3)
    })

    it("has 6 vertices", function(){
        expect(Object.values(dcel.vertices).length).toBe(6)
    })

    it("has 12 halfedges", function(){
        expect(dcel.halfEdges.length).toBe(12)
    })

})