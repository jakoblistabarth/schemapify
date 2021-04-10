const config = {
    "epsilonFactor": 0.5, // splitting of edges
    "k": '' //
}


function getJSON(path) {
    return fetch(path).then(response => response.json());
}

// shp('assets/data/nuts1-ger-simple.zip').then(function(data){
getJSON('assets/data/test2.json').then(function(data){
    class Point {
        constructor(lng, lat) {
            this.lng = lng
            this.lat = lat
        }

        equals(that) {
            return this.lng === that.lng && this.lat === that.lat
        }

        toString() {
            return `${this.lng}--${this.lat}`
        }
    }

    console.log(data)

    // render input in leaflet map
    const sMap = L.map('schematizationMap')
    let inputD = L.geoJSON(data)
    inputD.addTo(sMap)
    sMap.fitBounds(inputD.getBounds())

    // calculate epsilon
    let sqbb = turf.square(turf.bbox(data))
    const epsilon = Math.abs(sqbb[0] - sqbb[2]) * config.epsilonFactor
    console.log(epsilon);

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
        // console.log([p.lng, p.lat])
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