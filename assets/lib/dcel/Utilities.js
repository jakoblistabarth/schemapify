import leaflet from 'leaflet' // TODO: load leaflet as module

export function logDCEL(dcel) {
    console.log("--> START DCEL:", dcel);

    dcel.getFaces().forEach(f => {
        console.log("-> new face", f.uuid);
        f.getEdges().forEach(e => {
            console.log(e, e.tail.lng, e.tail.lat);
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

    const polygonFeatures = dcel.getInnerFaces().map(f => {
        f.properties.uuid = f.uuid
        const halfEdges = f.getEdges()
        const coordinates = halfEdges.map(e => [e.tail.lng, e.tail.lat])
        coordinates.push([halfEdges[0].tail.lng, halfEdges[0].tail.lat])
        return {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [ coordinates ] // TODO: implement holes
            },
            properties: f.properties
        }
    })

    const polygonsJSON = createGeoJSON(polygonFeatures)

    const polygons = L.geoJSON(polygonsJSON, {
        // style: function (feature) {
        //     return {color: feature.properties.color}
        // }
    }).bindTooltip(function (layer) {
        return `
            Face: ${layer.feature.properties.id}
            uuid : ${layer.feature.properties.uuid}
            `
    })

    const halfEdgeFeatures = Object.values(dcel.halfEdges).map(e => {
        const a = e.tail
        const b = e.twin.tail

        return {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [
                    [a.lng, a.lat],
                    [b.lng, b.lat]
                ]
            },
            properties: {
                edge: `${e.uuid.substring(0,5)} (${e.tail.lng},${e.tail.lat}) -> (${e.twin.tail.lng},${e.twin.tail.lat}) face: ${e.face?.uuid.substring(0,5)}`, 
                twin: `${e.twin.uuid.substring(0,5)} (${e.twin.tail.lng},${e.twin.tail.lat}) -> (${e.tail.lng},${e.tail.lat}) face: ${e.twin.face?.uuid.substring(0,5)}` 
            }
        }
    })

    const halfEdgesJSON = createGeoJSON(halfEdgeFeatures)
    const halfEdges = L.geoJSON(halfEdgesJSON, {
        // style: function (feature) {
        //     return {color: feature.properties.color}
        // }
    }).bindTooltip(function (layer) {
        return `
            uuid: ${layer.feature.properties.edge} <br>
            twin: ${layer.feature.properties.twin}
            `
    })

    polygons.addTo(DCELMap)
    vertices.addTo(DCELMap)
    halfEdges.addTo(DCELMap)
    DCELMap.fitBounds(vertices.getBounds())

    return DCELMap
}