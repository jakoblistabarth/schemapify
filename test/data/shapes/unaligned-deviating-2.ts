import MultiPolygon from "@/src/geometry/MultiPolygon";

export const unalignedDeviating2 = [
  MultiPolygon.fromCoordinates([
    [
      [
        [0, 0],
        [-4, 0],
        [-1, -2],
      ],
    ],
  ]),
  MultiPolygon.fromCoordinates([
    [
      [
        [0, 0],
        [-4, 1],
        [-4, 0],
      ],
    ],
  ]),
  MultiPolygon.fromCoordinates([
    [
      [
        [0, 0],
        [-4, 2],
        [-4, 1],
      ],
    ],
  ]),
];

export default unalignedDeviating2;
