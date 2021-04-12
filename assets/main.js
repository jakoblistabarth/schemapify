import DCEL from './lib/mydcel.js'
import { logDCEL, mapFromDCEL } from './lib/mydcel-utilities.js'

const config = {
    "epsilonFactor": 0.5, // splitting of edges
    "k": '' //
}

const tests = [
    // 'assets/data/ne_110m_africa_admin0.json',
    'assets/data/1plgn.json',
    // 'assets/data/1plgn-hole.json',
    'assets/data/2plgn.json',
    // 'assets/data/3plgn.json'
]

async function getJSON(path) {
    const response = await fetch(path)
    return response.json()
}

tests.forEach(async (test) => {
    const data = await getJSON(test)
    const name =  test.slice(test.lastIndexOf("/")+1,-5)

    const subdivision = DCEL.buildFromGeoJSON(data)
    logDCEL(subdivision)
    mapFromDCEL(subdivision, name)
})

// calculate epsilon
// let sqbb = turf.square(turf.bbox(verticesJSON))
// const epsilon = Math.abs(sqbb[0] - sqbb[2]) * config.epsilonFactor
