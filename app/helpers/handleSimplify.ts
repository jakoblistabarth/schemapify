import Dcel, { STEP } from "@/src/DCEL/Dcel";

export const handleSimplify = (setDcel: (dcel: Dcel) => void, dcel?: Dcel) => {
  console.log("hello world");
  if (!dcel) return;
  const pair = dcel?.faceFaceBoundaryList?.getMinimalConfigurationPair();
  pair?.doEdgeMove();
  dcel?.takeSnapshot(STEP.SIMPLIFY);
  setDcel(dcel);
};
