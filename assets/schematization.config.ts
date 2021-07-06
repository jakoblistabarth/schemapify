import C from "./lib/OrientationRestriction/C";
import Cirregular from "./lib/OrientationRestriction/Cirregular";

/**
 * @property lambda. A constant factor of the DCEL's diameter (0.05 suggested by buchin et al.).
 * @property epsilon. The maximum edge length. Used in the preprocessing step, to subdivide DCEL.
 * @property k. The maximum number of edges, for the simplification algorithm.
 * @property c. A Set of Orientations (either regular or irregular).
 * @property staircaseEpsilon. The small constant ε ensures that the edge e (of class AD) = (u, v) adheres to its direction at the insignificant vertex w.
 */

export interface Config {
  lambda: number;
  epsilon?: number;
  k: number;
  c: C | Cirregular;
  staircaseEpsilon: number;
}

export const config = {
  lambda: 0.05,
  k: 100, // TODO: set meaningful value
  c: new C(2),
  // c: new Cirregular([Math.PI * 0.25, Math.PI * 1, Math.PI * (5 / 3)]),
  staircaseEpsilon: 0.1,
};

export default config;
