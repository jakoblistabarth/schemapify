import DCEL from '../assets/lib/dcel/Dcel.mjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const plgn1 = JSON.parse(readFileSync(resolve('assets/data/1plgn.json'), 'utf8'))
const plgn2 = JSON.parse(readFileSync(resolve('assets/data/2plgn.json'), 'utf8'))
const plgn3 = JSON.parse(readFileSync(resolve('assets/data/3plgn.json'), 'utf8'))

describe("A DCEL of a single square", function() {

    let dcel = DCEL.buildFromGeoJSON(plgn1)

    it("has 1 outerface", function(){
        expect(dcel.outerFace).toEqual(jasmine.any(Object))
    })

    it("has 2 faces", function(){
        expect(dcel.faces.length).toBe(2)
    })

    it("has 4 vertices", function(){
        expect(Object.keys(dcel.vertices).length).toBe(4)
    })

    it("has 8 edges", function(){
        expect(dcel.halfEdges.length).toBe(8)
    })

    it("has 4 linked inner edges", function(){
        expect(dcel.faces[0].getEdges().length).toBe(4)
        expect(dcel.faces[1].halfEdge.twin.incidentFace.getEdges().length).toBe(4)
    })

    it("has 4 linked outer edges", function(){
        expect(dcel.faces[1].getEdges().length).toBe(4)
        expect(dcel.faces[0].halfEdge.twin.incidentFace.getEdges().length).toBe(4)
    })

})

describe("A DCEL of 2 adjacent squares", function() {

    let dcel = DCEL.buildFromGeoJSON(plgn2)

    it("has 1 outerface", function(){
        expect(dcel.outerFace).toEqual(jasmine.any(Object))
    })

    it("has 3 faces", function(){
        expect(dcel.faces.length).toBe(3)
    })

    it("has 6 vertices", function(){
        expect(Object.keys(dcel.vertices).length).toBe(6)
    })

    it("has 14 edges", function(){
        expect(dcel.halfEdges.length).toBe(14)
    })

    xit("has faces with the right amount of edges", function(){
        const edgeCount = dcel.getFaces().reduce((counter, f) => {
            counter.push(f.getEdges().length)
            return counter
        }, [])
        expect(edgeCount.sort()).toEqual([4,4,6].sort())
    })

    xit("has outer Face with 6 linked edges", function(){
        expect(dcel.outerFace.getEdges().length).toBe(6)
        expect(dcel.outerFace.halfEdge.twin.incidentFace.getEdges().length).toBe(4)
    })

})

describe("A DCEL of 3 adjacent squares", function() {

    let dcel = DCEL.buildFromGeoJSON(plgn3)

    it("has 1 outerface", function(){
        expect(dcel.outerFace).toEqual(jasmine.any(Object))
    })

    it("has 4 faces", function(){
        expect(dcel.faces.length).toBe(4)
    })

    it("has 8 vertices", function(){
        expect(Object.keys(dcel.vertices).length).toBe(8)
    })

    it("has 20 edges", function(){
        expect(dcel.halfEdges.length).toBe(20)
    })

    xit("has faces with the right amount of edges", function(){
        const edgeCount = dcel.getFaces().reduce((counter, f) => {
            counter.push(f.getEdges().length)
            return counter
        }, [])
        expect(edgeCount.sort()).toEqual([4,4,4,8].sort())
    })
})