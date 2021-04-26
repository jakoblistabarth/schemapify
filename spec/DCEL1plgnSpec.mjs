import DCEL from '../assets/lib/dcel/Dcel.mjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe("A DCEL of a single square", function() {

    const plgn1 = JSON.parse(readFileSync(resolve('assets/data/1plgn.json'), 'utf8'))
    let dcel = DCEL.buildFromGeoJSON(plgn1)

    xit("has 1 outerface", function(){
        expect(dcel.outerFace).toEqual(jasmine.any(Object))
    })

    xit("has 2 faces", function(){
        expect(dcel.faces.length).toBe(2)
    })

    it("has 4 vertices", function(){
        expect(Object.keys(dcel.vertices).length).toBe(4)
    })

    it("has 8 edges", function(){
        expect(dcel.halfEdges.length).toBe(8)
    })

    it("has 4 linked outer edges", function(){
        expect(dcel.faces[0].getEdges().length).toBe(4)
        // expect(dcel.faces[1].edge.twin.face.getEdges().length).toBe(4)
    })

    xit("has 4 linked inner edges", function(){
        expect(dcel.faces[1].getEdges().length).toBe(4)
        expect(dcel.faces[0].edge.twin.face.getEdges().length).toBe(4)
        expect(dcel.faces[1].getEdges(false).length).toBe(4)
        expect(dcel.faces[0].edge.twin.face.getEdges(false).length).toBe(4)
    })

})