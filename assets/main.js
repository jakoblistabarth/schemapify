import DCEL from './lib/mydcel.js'

const config = {
    "epsilonFactor": 0.5, // splitting of edges
    "k": '' //
}

function getJSON(path) {
    return fetch(path).then(response => response.json());
}

getJSON('assets/data/1plgn.json').then(function(data){

    let subdivision = new DCEL()

    data.features.forEach(feature => {
        feature.geometry.coordinates.forEach(subplgn => {
            const face = subdivision.makeFace()
            let prevHalfEdge = null
            let initialEdge = null
            for (let idx = 0; idx <= subplgn.length; idx++) {
                console.log(idx);
                if (idx == subplgn.length) {
                    prevHalfEdge.next = initialEdge
                    initialEdge.prev = prevHalfEdge
                    prevHalfEdge = initialEdge
                    subdivision.outerFace.halfEdge = initialEdge.twin
                    initialEdge.twin.origin = initialEdge.next.origin
                    initialEdge.twin.next = initialEdge.prev.twin
                    initialEdge.twin.prev = initialEdge.next.twin
                    continue
                }

                const point = subplgn[idx]
                const origin = subdivision.makeVertex(point[0],point[1])
                const halfEdge = subdivision.makeHalfEdge(origin, prevHalfEdge, null)
                origin.incidentEdge = halfEdge
                halfEdge.incidentFace = face
                halfEdge.twin = subdivision.makeHalfEdge(null, null, null)
                halfEdge.twin.twin = halfEdge
                subdivision.outerFace.halfEdge = halfEdge.twin

                if (idx == 0) {
                    initialEdge = halfEdge
                    face.halfEdge = initialEdge
                } else {
                    prevHalfEdge.next = halfEdge
                    halfEdge.twin.next = prevHalfEdge.twin
                    prevHalfEdge.twin.origin = halfEdge.origin
                    prevHalfEdge.twin.prev = halfEdge.twin
                }
                prevHalfEdge = halfEdge
            }
        })
    })

    console.log("DCEL:", subdivision);

    subdivision.faces.forEach(face => {
        let currentEdge = face.halfEdge
        let initialEdge = currentEdge
        console.log(currentEdge);
        do {
            currentEdge = currentEdge.next
            console.log(currentEdge)
        } while (currentEdge.next != initialEdge)
        console.log("–––––––");
    })
    // console.log("n vertices:", Object.keys(subdivision.vertices).length);

    class Point {
        constructor(lng, lat) {
            this.lng = lng
            this.lat = lat
        }

        toString() {
            return `${this.lng}--${this.lat}`
        }
    }

    // render input in leaflet map
    const sMap = L.map('schematizationMap')
    let inputD = L.geoJSON(data)
    inputD.addTo(sMap)
    sMap.fitBounds(inputD.getBounds())

    // calculate epsilon
    let sqbb = turf.square(turf.bbox(data))
    const epsilon = Math.abs(sqbb[0] - sqbb[2]) * config.epsilonFactor

    const points = data.features.reduce((points, feature) => {
        const coordinates = feature.geometry.coordinates[0].map(point => new Point(point[0], point[1]))
        return [...points, ...coordinates]
    }, [])

    let totalPoints = points.length
    let uniquePoints = Array.from(new Set(points.map(p => p.toString()))).length
    let highDegreePoints = totalPoints - uniquePoints 
    console.log(`${highDegreePoints} Coordinate-pairs (out of ${totalPoints}) are occupied by more than one Vertex`)

    let pointsGeoJSON = {
        "type": "FeatureCollection",
        "features": []
    }
    pointsGeoJSON.features = points.map(p => {
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [p.lng, p.lat]
            }
        }
    })

    var geojsonMarkerOptions = {
        radius: 6,
        fillColor: "red",
        color: "red",
        weight: 0,
        opacity: 1,
        fillOpacity: 0.2
    }
    
    L.geoJson(pointsGeoJSON, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions)
        }
    }).addTo(sMap)
});