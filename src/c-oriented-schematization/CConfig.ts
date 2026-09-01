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
