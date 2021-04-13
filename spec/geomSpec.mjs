import DCEL from '../assets/lib/dcel/Dcel.mjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const plgn1 = JSON.parse(readFileSync(resolve('assets/data/1plgn.json'), 'utf8'))
const plgn2 = JSON.parse(readFileSync(resolve('assets/data/2plgn.json'), 'utf8'))
const plgn3 = JSON.parse(readFileSync(resolve('assets/data/3plgn.json'), 'utf8'))

describe("getBbox()", function() {

    let bboxPlgn1 = DCEL.buildFromGeoJSON(plgn1).getBbox()
    let bboxPlgn2 = DCEL.buildFromGeoJSON(plgn2).getBbox()
    let bboxPlgn3 = DCEL.buildFromGeoJSON(plgn3).getBbox()

    it("returns the correct boundingbox of a given dcel", function() {
        expect(bboxPlgn1).toEqual([0, 0, 2, 2])
        expect(bboxPlgn2).toEqual([0, 0, 4, 2])
        expect(bboxPlgn3).toEqual([0, 0, 2, 2])
    })

})

describe("getDistance()", function() {

    const subdivision = new DCEL()

    const a = subdivision.makeVertex(0,0)
    const b = subdivision.makeVertex(4,0)
    const c = subdivision.makeVertex(4,4)
    const d = subdivision.makeVertex(-4,-4)

    it("returns the correct distance between 2 points", function() {
        expect(b.getDistance(a)).toEqual(b.getDistance(a))
        expect(a.getDistance(b)).toEqual(4)
        expect(a.getDistance(c)).toEqual(Math.sqrt(4*4 + 4*4))
        expect(d.getDistance(a)).toEqual(Math.sqrt(-4*-4 + -4*-4))
    })

})

describe("getDiameter()", function() {

    it("returns the correct diameter", function() {
        expect(DCEL.buildFromGeoJSON(plgn1).getDiameter()).toEqual(2)
        expect(DCEL.buildFromGeoJSON(plgn3).getDiameter()).toEqual(2)
    })

})