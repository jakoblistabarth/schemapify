import { degreesToRadians, radiansToDegrees } from "../utilities";
import type C from "./C";
import CIrregular from "./CIrregular";
import CRegular from "./CRegular";

/**
 * A serializable description of C, the set of allowed orientations.
 * Unlike a {@link C} it survives structured cloning, so it can be posted to a worker.
 */
export type CConfig =
  | {
      type: "regular";
      orientations: number;
      /** The rotation of C, in radians. */
      beta: number;
    }
  | {
      type: "irregular";
      /** The orientations of C, in radians. */
      angles: number[];
    };

/**
 * Build the set of orientations C from its serializable description.
 * @param config the description of C
 * @returns the corresponding {@link C}
 */
export const createC = (config: CConfig): C =>
  config.type === "regular"
    ? new CRegular(config.orientations, config.beta)
    : new CIrregular(config.angles);

/**
 * Read the orientations of an irregular C from a comma-separated list of
 * degrees, the form both the configurator's field and the CLI's `--angles`
 * take them in.
 *
 * Empty entries are ignored, so a list stays readable while it is being typed.
 * @param text the list, e.g. `"0, 30, 90, 150"`
 * @returns the angles in radians
 * @throws if an entry is not a number
 */
export const parseAngles = (text: string) =>
  text
    .split(",")
    .map((angle) => angle.trim())
    .filter((angle) => angle.length > 0)
    .map((angle) => {
      const degrees = Number(angle);
      if (!Number.isFinite(degrees))
        throw new Error(`Expected an angle in degrees, got "${angle}".`);
      return degreesToRadians(degrees);
    });

/**
 * Write the orientations of an irregular C back as degrees, the inverse of
 * {@link parseAngles}.
 *
 * Rounded, so that converting back and forth does not leave the float noise of
 * the radian round trip in a field the user is meant to edit.
 * @param angles the angles in radians
 * @returns the comma-separated list of degrees
 */
export const formatAngles = (angles: number[]) =>
  angles.map((angle) => Number(radiansToDegrees(angle).toFixed(6))).join(", ");
