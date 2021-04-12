// import leaflet from '../../node_modules/leaflet/src/leaflet.js'; // TODO: load leaflet as module

export function logDCEL(dcel) {
    console.log("--> START DCEL:", dcel);

    dcel.getFaces().forEach(f => {
        console.log("-> new face", f.uuid);
        f.getHalfEdges().forEach(e => {
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

    var geojsonMarkerOptions = {
        radius: 6,
        fillColor: "red",
        color: "red",
        weight: 0,
        opacity: 1,
        fillOpacity: 0.2
    }
    
    let vertices = L.geoJson(verticesJSON, {
        pointToLayer: function (feature, latlng) {
            const uuid = feature.properties.uuid
            const v = feature.geometry.coordinates
            return L.circleMarker(latlng, geojsonMarkerOptions).bindTooltip(`<strong>${v[0]},${v[1]}</strong><br>${uuid}`)
        }
    })

    // const polygonFeatures = dcel.faces.forEach(f => {
    //     let polygon = []
    //     let currentEdge = f.halfEdge
    //     let initialEdge = currentEdge
    //     while (currentEdge.next != initialEdge) {
    //         // console.log(currentEdge.origin);
    //         polygon.push([currentEdge.origin.lng, currentEdge.origin.lat])
    //         currentEdge = currentEdge.next
    //         console.log(currentEdge)
    //     }
    //     return {
    //         "type": "Feature",
    //         "geometry": {
    //             "type": "Point",
    //             "coordinates": polygon // TODO: implement holes
    //         },
    //         "properties": {
    //             "uuid": f.uuid
    //         }
    //     }
    // })

    // const PolygonsJSON = createGeoJSON(polygonFeatures)
    // console.log("PolygonsJSON", PolygonsJSON);

    vertices.addTo(DCELMap)
    DCELMap.fitBounds(vertices.getBounds())

    // let polygonsL = L.geoJSON(halfEdges)
    // polygons.addTo(DCELMap)

    return DCELMap
}