import { TWO_PI } from "../geometry/constants";
import { isSameAngle, normalizeAngle } from "../utilities";
import C from "./C";
import Sector from "./Sector";

/**
 * The fewest orientations a C can describe.
 */
const minimumOrientations = 2;

/**
 * Turn a set of orientations into the directions of C.
 *
 * An orientation is a line, not an arrow. A regular C is built
 * the same way, from `orientations * 2` angles, and completing the given ones
 * likewise is what keeps every sector narrower than half a turn.
 * @param angles the orientations, in radians
 * @returns the directions of C, sorted and without duplicates
 */
const toDirections = (angles: number[]) => {
  if (angles.some((angle) => !Number.isFinite(angle)))
    throw new Error("C's angles have to be numbers.");

  const directions = angles
    .flatMap((angle) => [angle, angle + Math.PI])
    .map(normalizeAngle)
    .toSorted((a, b) => a - b)
    .filter(
      (angle, idx, sorted) => idx === 0 || !isSameAngle(angle, sorted[idx - 1]),
    );

  // Normalizing folds into [0, 2π), so the first and last are neighbours around
  // the circle and can still be the same direction.
  const deduplicated =
    directions.length > 1 &&
    isSameAngle(directions[0], directions[directions.length - 1])
      ? directions.slice(0, -1)
      : directions;

  if (deduplicated.length < minimumOrientations * 2)
    throw new Error(
      `C needs at least ${minimumOrientations} distinct orientations, and so at least ${minimumOrientations * 2} directions; got ${deduplicated.length}.`,
    );

  return deduplicated;
};

class CIrregular extends C {
  /**
   * @param angles the orientations of C, in radians. Each is completed with its
   * opposite, so passing a full set of directions is equally valid.
   */
  constructor(angles: number[]) {
    super();
    this.angles = toDirections(angles);
  }

  /**
   * Get the sectors of C.
   * @returns An array of {@link Sector}s.
   */
  get sectors(): Sector[] {
    return this.angles.map((angle, idx) => {
      // The last sector reaches around to the first angle,
      // which lies a whole turn on from where this one starts.
      // Same as for CRegular.
      const upperBound =
        idx + 1 === this.angles.length
          ? this.angles[0] + TWO_PI
          : this.angles[idx + 1];
      return new Sector(this, idx, angle, upperBound);
    });
  }

  /**
   * Get the central angle of a Sector.
   * @returns The central angle of a {@link Sector}.
   * TO-DO: @param idx for irregular Cs only meaningful with index as argument?
   */
  get sectorAngle() {
    // TO-DO: for irregular Cs only meaningful with index as argument?
    return 0;
  }
}

export default CIrregular;
