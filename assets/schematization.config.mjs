import C from "./lib/orientation-restriction/C.mjs";

const config = {
  lambda: 0.05, // max edge length of input: 0.05 suggested by buchin et al.
  k: "", // max number of edges, for simplification algorithm
  C: new C(2),
  // C: new C([Math.PI * 0.25, Math.PI * 1, Math.PI * (5 / 3)]),
};

export default config;
