# <img height="25px" style="margin-bottom:-2.5px" src="./public/mark.svg" alt="Mapshaver" /> Mapshaver

## Introduction

_Mapshaver_ is a cartographic schematization tool written in TypeScript.
It aims to support the schematization of geodata (Shapefile, GeoJSON) in an interactive and accessible way.

It is inspired by the Matthew Bloch's [Mapshaper](https://github.com/mbloch/mapshaper) tool and uses the _Area-Preserving Simplification and Schematization of Polygonal Subdivisions_ (Buchin, K., Meulemans, W., Van Renssen, A., & Speckmann, B. (2016). Area-Preserving Simplification and Schematization of Polygonal Subdivisions. ACM Transactions on Spatial Algorithms and Systems , 2(1), 1-36. [2]. https://doi.org/10.1145/2818373.)

## Development

### Setup

Building and testing _Mapshaver_ requires [Node.js](http://nodejs.org).

Install build dependencies with:

```bash
npm i
```

Start the developing server with:

```bash
npm run dev
```

### CLI

A schematization can also be run, without the web UI, using the CLI:

```bash
pnpm schematize <input> -o <output>
```

Run `pnpm schematize --help` for the remaining options.

### Test data

The fixtures under `test/data` are rebuilt by `pnpm test-data`. It has three stages, always run in this order:

| Stage      | Writes                                       | Cost                     |
| ---------- | -------------------------------------------- | ------------------------ |
| `overture` | full-resolution `*_adm1.gpkg` in `generated` | ~4 min, several GB of S3 |
| `simplify` | topology-aware variants in `simplified`      | seconds                  |
| `fixtures` | the reader fixtures in `gpkg` and `fgb`      | seconds                  |

Name stages to rebuild a subset, which is worth doing to skip the Overture scan:

```bash
pnpm test-data                    # all three
pnpm test-data simplify fixtures  # reuse the last Overture fetch
```

Add a country by adding a `COPY` to `test/data/scripts/overture-adm.sql`;
`simplify` picks up whatever that stage wrote. `generated` is gitignored, as
its sources are large and only feed `simplify`; everything else is committed,
and reruns are byte-identical so they leave no diff.

## License

This software is licensed under the [MIT License](https://mit-license.org/).
