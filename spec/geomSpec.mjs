import DCEL from '../assets/lib/dcel/Dcel.mjs'
import HalfEdge from '../assets/lib/dcel/HalfEdge.mjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe("getBbox()", function() {

    it("returns the correct boundingbox of a given dcel", function() {

        const plgn1 = JSON.parse(readFileSync(resolve('assets/data/1plgn.json'), 'utf8'))
        const plgn2 = JSON.parse(readFileSync(resolve('assets/data/2plgn.json'), 'utf8'))
        const plgn3 = JSON.parse(readFileSync(resolve('assets/data/3plgn.json'), 'utf8'))

        let bboxPlgn1 = DCEL.buildFromGeoJSON(plgn1).getBbox()
        let bboxPlgn2 = DCEL.buildFromGeoJSON(plgn2).getBbox()
        let bboxPlgn3 = DCEL.buildFromGeoJSON(plgn3).getBbox()

        expect(bboxPlgn1).toEqual([0, 0, 2, 2])
        expect(bboxPlgn2).toEqual([0, 0, 4, 2])
        expect(bboxPlgn3).toEqual([0, 0, 2, 2])
    })

})

describe("getDistance()", function() {

    it("returns the correct distance between 2 points", function() {

        const subdivision = new DCEL()

        const a = subdivision.makeVertex(0,0)
        const b = subdivision.makeVertex(4,0)
        const c = subdivision.makeVertex(4,4)
        const d = subdivision.makeVertex(-4,-4)

        expect(b.getDistance(a)).toEqual(b.getDistance(a))
        expect(a.getDistance(b)).toEqual(4)
        expect(a.getDistance(c)).toEqual(Math.sqrt(4*4 + 4*4))
        expect(d.getDistance(a)).toEqual(Math.sqrt(-4*-4 + -4*-4))
    })

})

describe("getDiameter()", function() {

    it("returns the correct diameter", function() {

        const plgn1 = JSON.parse(readFileSync(resolve('assets/data/1plgn.json'), 'utf8'))
        const plgn3 = JSON.parse(readFileSync(resolve('assets/data/3plgn.json'), 'utf8'))

        expect(DCEL.buildFromGeoJSON(plgn1).getDiameter()).toEqual(2)
        expect(DCEL.buildFromGeoJSON(plgn3).getDiameter()).toEqual(2)
    })

})

describe("getLength()", function() {

    it("returns the correct length", function() {

        const plgn1 = JSON.parse(readFileSync(resolve('assets/data/1plgn.json'), 'utf8'))
        const edge = DCEL.buildFromGeoJSON(plgn1).getFaces()[0].halfEdge

        expect(edge.getLength()).toEqual(2)
    })

})

describe("getMidpoint()", function() {

    it("returns the correct length", function() {

        const subdivision = new DCEL()
        const [ org, dest ] = [ subdivision.makeVertex(0,0),  subdivision.makeVertex(6,4) ]
        const edge = new HalfEdge(org)
        edge.twin = new HalfEdge(dest)

        const [ org2, dest2 ] = [ subdivision.makeVertex(-2,1),  subdivision.makeVertex(2,-1) ]
        const edge2 = new HalfEdge(org2)
        edge2.twin = new HalfEdge(dest2)

        expect(edge.getMidpoint()).toEqual([3,2])
        expect(edge2.getMidpoint()).toEqual([0,0])
    })

})

describe("bisect()", function() {

    const plgn1 = JSON.parse(readFileSync(resolve('assets/data/1plgn.json'), 'utf8'))
    const dcel = DCEL.buildFromGeoJSON(plgn1)
    dcel.getFaces()[0].halfEdge.bisect()

    it("on one edge of a square results in 5 linked outer halfEdges", function(){
        expect(dcel.getFaces()[0].getEdges().length).toBe(5)
        expect(dcel.getFaces()[1].halfEdge.twin.incidentFace.getEdges().length).toBe(5)
        expect(dcel.getFaces()[0].getEdges(false).length).toBe(5)
        expect(dcel.getFaces()[1].halfEdge.twin.incidentFace.getEdges(false).length).toBe(5)
    })

    it("on one edge of a square results in 5 linked inner halfEdges", function(){
        expect(dcel.getFaces()[1].getEdges().length).toBe(5)
        expect(dcel.getFaces()[0].halfEdge.twin.incidentFace.getEdges().length).toBe(5)
        expect(dcel.getFaces()[1].getEdges(false).length).toBe(5)
        expect(dcel.getFaces()[0].halfEdge.twin.incidentFace.getEdges(false).length).toBe(5)
    })

})