# <img height="25px" style="margin-bottom:-2.5px" src="./public/schemapify-mark.svg" alt="Schemapify" /> Schemapify

## Introduction

_Schemapify_ aims to be a web based cartographic schematization tool, written in Typescript.
It aims to support the schematization of geo data (Shapefile, GeoJSON) in an interactive and accessible way.

It uses the _Area-Preserving Simplification and Schematizationof Polygonal Subdivisions_ (Buchin, K., Meulemans, W., Van Renssen, A., & Speckmann, B. (2016). Area-Preserving Simplification and Schematization of Polygonal Subdivisions. ACM Transactions on Spatial Algorithms and Systems , 2(1), 1-36. [2]. https://doi.org/10.1145/2818373.)

## TODOs

- [x] DCEL data structure (from and back to GeoJSON)
- [x] preprocessing steps
- [ ] constrain Angles
- [ ] simplify (edge-move)
- [ ] implement UI

## Development

### Setup

Building and testing _schemapify_ requires [Node.js](http://nodejs.org).

Install build dependencies with:

```bash
npm i
```

Start the developing server with:

```bash
npm run dev
```

## License

This software is licensed under the [MIT License](https://mit-license.org/).
