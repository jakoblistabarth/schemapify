let solution = null
getJSON('assets/test/2plgn-solution.json').then(function(data) {
    solution = data
})

console.log("solution:", solution)

// console.assert(subdivison.vertices.length == solution.vertices.length, "wrong number of vertices in DCEL")

