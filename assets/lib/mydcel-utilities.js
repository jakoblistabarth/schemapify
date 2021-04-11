// import leaflet from '../../node_modules/leaflet/src/leaflet.js'; // TODO: load leaflet as module

export function logDCEL(dcel) {
    console.log("DCEL:", dcel);
    dcel.faces.forEach(face => {
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
}

export function mapFromDCEL(dcel) {
    console.log("leaflet map in the making :D")
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
    let inputD = L.geoJSON(dcel)
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
}