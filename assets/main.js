import DCEL from './lib/mydcel.js'
import { logDCEL, mapFromDCEL } from './lib/mydcel-utilities.js'

const config = {
    "epsilonFactor": 0.5, // splitting of edges
    "k": '' //
}

function getJSON(path) {
    return fetch(path).then(response => response.json());
}

getJSON('assets/data/1plgn.json').then(function(data){

    const dcel = new DCEL;
    const subdivision = dcel.buildFromGeoJSON(data)

    logDCEL(subdivision)
    mapFromDCEL(data)

})