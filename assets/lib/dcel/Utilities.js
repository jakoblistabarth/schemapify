import leaflet from 'leaflet' // TODO: load leaflet as module

export function logDCEL(dcel) {
    console.log("--> START DCEL:", dcel);

    dcel.getFaces().forEach(f => {
        console.log("-> new face", f.uuid);
        f.getEdges().forEach(e => {
            console.log(e, e.origin.lng, e.origin.lat);
        })
    })
    console.log("<-- DCEL END");
}

function createGeoJSON(features) {
    return {
        "type": "FeatureCollection",
        "features": features
    }
}

export function mapFromDCEL(dcel, name) {

    const grid = document.getElementById('map-grid')
    let map = document.createElement("div")
    map.id = name
    map.className = "map"
    grid.appendChild(map)

    const DCELMap = L.map(name)
    DCELMap.attributionControl.addAttribution(name)

    const vertexFeatures = Object.values(dcel.vertices).map(v => {
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [v.lng, v.lat]
            },
            "properties": {
                "uuid": v.uuid
            }
        }
    })

    const verticesJSON = createGeoJSON(vertexFeatures)

    const geojsonMarkerOptions = {
        radius: 6,
        fillColor: "red",
        color: "red",
        weight: 0,
        opacity: 1,
        fillOpacity: 0.2
    }

    const vertices = L.geoJson(verticesJSON, {
        pointToLayer: function (feature, latlng) {
            const uuid = feature.properties.uuid
            const v = feature.geometry.coordinates
            return L.circleMarker(latlng, geojsonMarkerOptions).bindTooltip(`<strong>${v[0]},${v[1]}</strong><br>${uuid}`)
        }
    })

    const polygonFeatures = dcel.faces.map(f => {
        f.properties.uuid = f.uuid
        const halfEdges = f.getEdges()
        const coordinates = halfEdges.map(e => e.origin.getXY())
        coordinates.push(halfEdges[0].origin.getXY())
        // console.log("halfEdges", halfEdges);
        // console.log("coordinates", coordinates);
        return {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [ coordinates ] // TODO: implement holes
            },
            "properties": f.properties
        }
    })

    const polygonsJSON = createGeoJSON(polygonFeatures)
    console.log("polygonsJSON", polygonsJSON);

    const polygons = L.geoJSON(polygonsJSON, {
        // style: function (feature) {
        //     return {color: feature.properties.color}
        // }
    }).bindTooltip(function (layer) {
        return `
            Face: ${layer.feature.properties.Name}
            uuid : ${layer.feature.properties.uuid}
            `
    })

    polygons.addTo(DCELMap)
    vertices.addTo(DCELMap)
    DCELMap.fitBounds(vertices.getBounds())

    return DCELMap
}