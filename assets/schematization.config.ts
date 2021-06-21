import C from "./lib/OrientationRestriction/C";
import Cirregular from "./lib/OrientationRestriction/Cirregular";

/**
 * @property lambda, is the maximum edge length (0.05 suggested by buchin et al.)
 * @property k, maximum number of edges, for simplification algorithm
 */
export interface Config {
  lambda: number;
  epsilon?: number;
  k: number;
  c: C | Cirregular;
}

export const config = {
  lambda: 0.05,
  k: 100, // TODO: set meaningful value
  c: new C(2),
  // c: new Cirregular([Math.PI * 0.25, Math.PI * 1, Math.PI * (5 / 3)]),
};

export default config;
