import DCEL from './lib/dcel/Dcel.mjs'
import { logDCEL, mapFromDCEL } from './lib/dcel/Utilities.js'

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
    // subdivision.getFaces()[0].halfEdge.bisect();
    // subdivision.getFaces()[0].halfEdge.subdivideToThreshold(subdivision.epsilon);
    mapFromDCEL(subdivision, name)
    // logDCEL(subdivision)

})
